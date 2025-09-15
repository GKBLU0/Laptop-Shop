"use client"

import React from "react"

import { useState, useMemo, useEffect, useCallback } from "react"
import { DatabaseService, type AuditLog, type RegistrationRequest, type User } from "@/lib/database"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ProtectedRoute } from "@/components/protected-route"
import { Bell, Shield, Wrench, CreditCard, FileText, AlertTriangle, User, HelpCircle } from "lucide-react"
import { TestRunner } from "@/components/test-runner"
import { Input } from "@/components/ui/input"
import { AuthService } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

// Warranty Alert Component
export function WarrantyAlerts() {
  const db = DatabaseService.getInstance()
  const sales = db.getSales()
  const laptops = db.getLaptops()
  const customers = db.getCustomers()

  const warrantyAlerts = useMemo(() => {
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    return sales
      .map((sale) => {
        const laptop = laptops.find((l) => l.id === sale.laptop_id)
        const customer = customers.find((c) => c.id === sale.customer_id)
        const warrantyExpiry = new Date(sale.warranty_expiry)

        return {
          sale,
          laptop,
          customer,
          warrantyExpiry,
          daysUntilExpiry: Math.ceil((warrantyExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
          isExpiring: warrantyExpiry <= thirtyDaysFromNow && warrantyExpiry > now,
          isExpired: warrantyExpiry <= now,
        }
      })
      .filter((item) => item.isExpiring || item.isExpired)
      .sort((a, b) => a.warrantyExpiry.getTime() - b.warrantyExpiry.getTime())
  }, [sales, laptops, customers])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Warranty Alerts
        </CardTitle>
        <CardDescription>Warranties expiring within 30 days or already expired</CardDescription>
      </CardHeader>
      <CardContent>
        {warrantyAlerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No warranty alerts at this time</p>
          </div>
        ) : (
          <div className="space-y-3">
            {warrantyAlerts.map((alert) => (
              <div
                key={alert.sale.id}
                className={`p-4 rounded-lg border ${
                  alert.isExpired ? "bg-destructive/10 border-destructive/20" : "bg-primary/10 border-primary/20"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium">
                      {alert.laptop?.brand} {alert.laptop?.model}
                    </h4>
                    <p className="text-sm text-muted-foreground">Customer: {alert.customer?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Sale Date: {new Date(alert.sale.sale_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={alert.isExpired ? "destructive" : "secondary"}>
                      {alert.isExpired
                        ? `Expired ${Math.abs(alert.daysUntilExpiry)} days ago`
                        : `${alert.daysUntilExpiry} days left`}
                    </Badge>
                    <p className="text-sm text-muted-foreground mt-1">
                      Expires: {alert.warrantyExpiry.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Repair Management Component
export function RepairManagement({ onRefresh, isWorkerMode = false }: { onRefresh?: () => void; isWorkerMode?: boolean }) {
  const [showAddRepair, setShowAddRepair] = useState(false)
  const [selectedRepair, setSelectedRepair] = useState<any>(null)
  const [repairs, setRepairs] = useState<any[]>([])
  const [sortField, setSortField] = useState<string>("created_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  const db = DatabaseService.getInstance()
  const laptops = db.getLaptops()
  const customers = db.getCustomers()

  const loadRepairs = () => {
    const dbRepairs = db.getRepairs()
    const enhancedRepairs = dbRepairs.map((repair) => {
      const laptop = laptops.find((l) => l.id === repair.laptop_id)
      const customer = customers.find((c) => c.id === repair.customer_id)
      return {
        ...repair,
        laptop_name: laptop ? `${laptop.brand} ${laptop.model}` : "Unknown",
        customer_name: customer ? customer.name : "Unknown",
      }
    })
    
    // Sort the repairs
    const sortedRepairs = enhancedRepairs.sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]
      
      // Handle date fields
      if (sortField === "created_at" || sortField === "completed_at") {
        aValue = new Date(aValue || 0).getTime()
        bValue = new Date(bValue || 0).getTime()
      }
      
      // Handle numeric fields
      if (sortField === "repair_cost" || sortField === "id") {
        aValue = Number(aValue) || 0
        bValue = Number(bValue) || 0
      }
      
      // Handle string fields
      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }
      
      if (sortDirection === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })
    
    setRepairs(sortedRepairs)
  }

  useEffect(() => {
    loadRepairs()
  }, [sortField, sortDirection])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const handleEditRepair = (repair: any) => {
    setSelectedRepair(repair)
  }

  const handleDeleteRepair = (repairId: number) => {
    if (confirm("Are you sure you want to delete this repair request?")) {
      db.deleteRepair(repairId)
      loadRepairs() // Refresh the repairs list
      if (onRefresh) onRefresh() // Trigger dashboard refresh
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-card text-foreground border-border"
      case "in_progress":
        return "bg-primary/10 text-primary border-primary/20"
      case "pending":
        return "bg-muted text-muted-foreground border-border"
      case "cancelled":
        return "bg-destructive/10 text-destructive border-destructive/20"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="h-5 w-5" />
          Repair Management
        </CardTitle>
        <CardDescription>
          Track and manage repair requests and warranties
          {isWorkerMode && (
            <span className="ml-2 text-primary">(Worker Mode - Full Access)</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <Badge variant="outline">{repairs.filter((r) => r.status === "pending").length} Pending</Badge>
            <Badge variant="outline">
              {repairs.filter((r) => r.status === "in_progress").length} In Progress
            </Badge>
            <Badge variant="outline">{repairs.filter((r) => r.status === "completed").length} Completed</Badge>
          </div>
          <Button onClick={() => setShowAddRepair(true)}>Add Repair Request</Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50" 
                onClick={() => handleSort("id")}
              >
                ID {sortField === "id" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50" 
                onClick={() => handleSort("customer_name")}
              >
                Customer {sortField === "customer_name" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50" 
                onClick={() => handleSort("laptop_name")}
              >
                Laptop {sortField === "laptop_name" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead>Issue</TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50" 
                onClick={() => handleSort("repair_cost")}
              >
                Cost {sortField === "repair_cost" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50" 
                onClick={() => handleSort("status")}
              >
                Status {sortField === "status" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead 
                className="cursor-pointer hover:bg-muted/50" 
                onClick={() => handleSort("created_at")}
              >
                Created {sortField === "created_at" && (sortDirection === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {repairs.map((repair) => (
              <TableRow key={repair.id}>
                <TableCell>#{repair.id}</TableCell>
                <TableCell>{repair.customer_name}</TableCell>
                <TableCell>{repair.laptop_name}</TableCell>
                <TableCell className="max-w-48 truncate">{repair.issue_description}</TableCell>
                <TableCell>${repair.repair_cost}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(repair.status)}>{repair.status}</Badge>
                </TableCell>
                <TableCell>{new Date(repair.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedRepair(repair)}>
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleEditRepair(repair)}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => handleDeleteRepair(repair.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {showAddRepair && (
          <Dialog open={showAddRepair} onOpenChange={setShowAddRepair}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Repair Request</DialogTitle>
                <DialogDescription>Create a new repair request for a customer's laptop</DialogDescription>
              </DialogHeader>
              <RepairForm
                onSave={(repairData) => {
                  // Add repair to database
                  db.addRepair(repairData)
                  loadRepairs() // Refresh the repairs list
                  if (onRefresh) onRefresh() // Trigger dashboard refresh
                  setShowAddRepair(false)
                }}
                onCancel={() => setShowAddRepair(false)}
                customers={customers}
                laptops={laptops}
              />
            </DialogContent>
          </Dialog>
        )}

        {selectedRepair && (
          <Dialog open={!!selectedRepair} onOpenChange={() => setSelectedRepair(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Repair Request #{selectedRepair.id}</DialogTitle>
                <DialogDescription>Complete repair information and status</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Customer</Label>
                    <p>{selectedRepair.customer_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Laptop</Label>
                    <p>{selectedRepair.laptop_name}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Issue Description</Label>
                  <p className="text-sm bg-muted p-2 rounded">{selectedRepair.issue_description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Repair Cost</Label>
                    <p>${selectedRepair.repair_cost}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Status</Label>
                    <Badge className={getStatusColor(selectedRepair.status)}>{selectedRepair.status}</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Created</Label>
                    <p>{new Date(selectedRepair.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Completed</Label>
                    <p>
                      {selectedRepair.completed_at
                        ? new Date(selectedRepair.completed_at).toLocaleDateString()
                        : "Not completed"}
                    </p>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="status" className="text-sm font-medium">Update Status</Label>
                      <select
                        id="status"
                        value={selectedRepair.status}
                        onChange={(e) => {
                          const newStatus = e.target.value as "pending" | "in_progress" | "completed" | "cancelled"
                          const updates: Partial<Repair> = { status: newStatus }
                          
                          if (newStatus === "completed") {
                            updates.completed_at = new Date().toISOString()
                          } else if (newStatus !== "completed" && selectedRepair.completed_at) {
                            updates.completed_at = null
                          }
                          
                          db.updateRepair(selectedRepair.id, updates)
                          loadRepairs() // Refresh the repairs list
                          if (onRefresh) onRefresh() // Trigger dashboard refresh
                          setSelectedRepair(null) // Close dialog
                        }}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <Button 
                        onClick={() => {
                          db.updateRepair(selectedRepair.id, { 
                            status: "completed",
                            completed_at: new Date().toISOString()
                          })
                          loadRepairs() // Refresh the repairs list
                          if (onRefresh) onRefresh() // Trigger dashboard refresh
                          setSelectedRepair(null) // Close dialog
                        }}
                        disabled={selectedRepair.status === "completed"}
                        className="w-full"
                      >
                        Mark as Completed
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  )
}

function RepairForm({
  onSave,
  onCancel,
  customers,
  laptops,
}: {
  onSave: (data: any) => void
  onCancel: () => void
  customers: any[]
  laptops: any[]
}) {
  const [formData, setFormData] = useState({
    customer_id: "",
    laptop_id: "",
    issue_description: "",
    repair_cost: "",
    status: "pending",
  })

  const db = DatabaseService.getInstance()
  const sales = db.getSales()

  // Get laptops purchased by the selected customer
  const getCustomerLaptops = (customerId: number) => {
    if (!customerId) return []
    
    const customerSales = sales.filter(sale => sale.customer_id === customerId)
    const customerLaptopIds = customerSales.map(sale => sale.laptop_id)
    
    return laptops.filter(laptop => customerLaptopIds.includes(laptop.id))
  }

  const customerLaptops = getCustomerLaptops(Number(formData.customer_id))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...formData,
      repair_cost: Number.parseFloat(formData.repair_cost) || 0,
      customer_id: Number.parseInt(formData.customer_id),
      laptop_id: Number.parseInt(formData.laptop_id),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="customer_id">Customer *</Label>
        <select
          id="customer_id"
          value={formData.customer_id}
          onChange={(e) => setFormData({ 
            ...formData, 
            customer_id: e.target.value,
            laptop_id: "" // Reset laptop selection when customer changes
          })}
          className="w-full p-2 border rounded-md"
          required
        >
          <option value="">Select Customer</option>
          {customers.map((customer) => {
            const customerLaptopCount = sales.filter(sale => sale.customer_id === customer.id).length
            return (
              <option key={customer.id} value={customer.id}>
                {customer.name} - {customer.email} ({customerLaptopCount} laptop{customerLaptopCount !== 1 ? 's' : ''})
              </option>
            )
          })}
        </select>
      </div>
      
      <div>
        <Label htmlFor="laptop_id">Laptop *</Label>
        <select
          id="laptop_id"
          value={formData.laptop_id}
          onChange={(e) => setFormData({ ...formData, laptop_id: e.target.value })}
          className="w-full p-2 border rounded-md"
          required
          disabled={!formData.customer_id}
        >
          <option value="">
            {!formData.customer_id 
              ? "Select a customer first" 
              : customerLaptops.length === 0 
                ? "No laptops purchased by this customer" 
                : "Select Laptop"
            }
          </option>
          {customerLaptops.map((laptop) => (
            <option key={laptop.id} value={laptop.id}>
              {laptop.brand} {laptop.model} - {laptop.serial_number}
            </option>
          ))}
        </select>
        {formData.customer_id && customerLaptops.length === 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            This customer hasn't purchased any laptops yet.
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="issue_description">Issue Description *</Label>
        <textarea
          id="issue_description"
          value={formData.issue_description}
          onChange={(e) => setFormData({ ...formData, issue_description: e.target.value })}
          className="w-full p-2 border rounded-md h-20"
          placeholder="Describe the issue in detail..."
          required
        />
      </div>
      <div>
        <Label htmlFor="repair_cost">Estimated Repair Cost</Label>
        <Input
          id="repair_cost"
          type="number"
          step="0.01"
          value={formData.repair_cost}
          onChange={(e) => setFormData({ ...formData, repair_cost: e.target.value })}
          placeholder="0.00"
        />
      </div>
      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">
          Create Repair Request
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

// Installment Management Component
export function InstallmentManagement() {
  const [selectedInstallment, setSelectedInstallment] = useState<any>(null)
  const [showProgressUpdate, setShowProgressUpdate] = useState(false)
  const [progressUpdateData, setProgressUpdateData] = useState({
    installmentId: 0,
    currentPaidMonths: 0,
    newPaidMonths: 0,
    confirmationStep: 1
  })

  const db = DatabaseService.getInstance()
  const installments = db.getInstallments()
  const customers = db.getCustomers()
  const laptops = db.getLaptops()
  
  // Get current user role for permission checking
  const currentUser = AuthService.getCurrentUser()
  const isWorker = currentUser?.role === "worker"
  const isManager = currentUser?.role === "manager"
  const isAdmin = currentUser?.role === "admin"
  
  // Toast hook for notifications
  const { toast } = useToast()

  // Enhanced installment data with customer and laptop info
  const enhancedInstallments = installments.map((installment) => {
    const customer = customers.find((c) => c.id === installment.customer_id)
    const laptop = laptops.find((l) => l.id === installment.laptop_id)
    const remainingAmount = (installment.months - installment.paid_months) * installment.monthly_amount

    return {
      ...installment,
      customer_name: customer?.name || "Unknown",
      laptop_name: laptop ? `${laptop.brand} ${laptop.model}` : "Unknown",
      remaining_amount: remainingAmount,
    }
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-card text-foreground border-border"
      case "active":
        return "bg-primary/10 text-primary border-primary/20"
      case "overdue":
        return "bg-destructive/10 text-destructive border-destructive/20"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  const handleProgressUpdate = (installment: any) => {
    setProgressUpdateData({
      installmentId: installment.id,
      currentPaidMonths: installment.paid_months,
      newPaidMonths: installment.paid_months + 1,
      confirmationStep: 1
    })
    setShowProgressUpdate(true)
  }

  const confirmProgressUpdate = () => {
    const { installmentId, newPaidMonths } = progressUpdateData
    
    // Update the installment progress - ALL USERS CAN DO THIS
    const updatedInstallment = db.updateInstallmentProgress(installmentId, newPaidMonths, "user")
    
    if (updatedInstallment) {
      toast({
        title: "Progress Updated",
        description: `Installment progress updated to ${newPaidMonths} months`,
      })
      setShowProgressUpdate(false)
      // Force re-render
      window.location.reload()
    } else {
      toast({
        title: "Update Failed",
        description: "Failed to update installment progress",
        variant: "destructive",
      })
    }
  }

  const getProgressPercentage = (paidMonths: number, totalMonths: number) => {
    return Math.min((paidMonths / totalMonths) * 100, 100)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Installment Management
        </CardTitle>
        <CardDescription>
          {isWorker 
            ? "View installment plans and update payment progress (limited access)" 
            : "Track and manage customer payment plans and installments"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Badge variant="outline">{enhancedInstallments.filter((i) => i.status === "active").length} Active Plans</Badge>
          <Badge variant="outline">{enhancedInstallments.filter((i) => i.status === "completed").length} Completed</Badge>
          {!isWorker && (
            <Badge variant="outline">
              ${enhancedInstallments.reduce((sum, i) => sum + i.remaining_amount, 0).toLocaleString()} Outstanding
            </Badge>
          )}
          {isWorker && (
            <Badge variant="secondary" className="bg-secondary/10 text-secondary border-secondary/20">
              Worker Mode - Progress Updates Only
            </Badge>
          )}
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Laptop</TableHead>
              {!isWorker && <TableHead>Total Amount</TableHead>}
              {!isWorker && <TableHead>Monthly Payment</TableHead>}
              <TableHead>Progress</TableHead>
              {!isWorker && <TableHead>Remaining</TableHead>}
              <TableHead>Next Due</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enhancedInstallments.map((installment) => (
              <TableRow key={installment.id}>
                <TableCell>{installment.customer_name}</TableCell>
                <TableCell>{installment.laptop_name}</TableCell>
                {!isWorker && <TableCell>${installment.total_amount.toLocaleString()}</TableCell>}
                {!isWorker && <TableCell>${installment.monthly_amount.toFixed(2)}</TableCell>}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${getProgressPercentage(installment.paid_months, installment.months)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm">
                      {installment.paid_months}/{installment.months}
                    </span>
                  </div>
                </TableCell>
                {!isWorker && <TableCell>${installment.remaining_amount.toFixed(2)}</TableCell>}
                <TableCell>{new Date(installment.next_due_date).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge className={getStatusColor(installment.status)}>{installment.status}</Badge>
                </TableCell>
                <TableCell>
                  {installment.status !== "completed" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleProgressUpdate(installment)}
                      disabled={installment.paid_months >= installment.months}
                    >
                      Update Progress
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Progress Update Dialog with Double Confirmation */}
        <Dialog open={showProgressUpdate} onOpenChange={setShowProgressUpdate}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Update Installment Progress</DialogTitle>
              <DialogDescription>
                {progressUpdateData.confirmationStep === 1 
                  ? "Confirm the progress update details" 
                  : "Final confirmation required"
                }
              </DialogDescription>
            </DialogHeader>
            
            {progressUpdateData.confirmationStep === 1 ? (
              <div className="space-y-4">
                <div className="bg-muted p-3 rounded-lg">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span>Current Progress:</span>
                    <span className="font-medium">{progressUpdateData.currentPaidMonths} months</span>
                    <span>New Progress:</span>
                                          <span className="font-medium text-primary">{progressUpdateData.newPaidMonths} months</span>
                    <span>Increase:</span>
                                          <span className="font-medium text-secondary">+1 month</span>
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  This action will be logged in the audit trail and cannot be undone.
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowProgressUpdate(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button 
                    onClick={() => setProgressUpdateData(prev => ({ ...prev, confirmationStep: 2 }))}
                    className="flex-1"
                  >
                    Continue
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-2">⚠️ Final Confirmation</div>
                  <p className="text-sm text-muted-foreground">
                    You are about to update installment progress from {progressUpdateData.currentPaidMonths} to {progressUpdateData.newPaidMonths} months.
                  </p>
                </div>
                
                <div className="bg-secondary/10 border border-secondary/20 p-3 rounded-lg">
                  <p className="text-sm text-secondary">
                    <strong>Double-check:</strong> This action will be permanently recorded in the audit logs.
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setProgressUpdateData(prev => ({ ...prev, confirmationStep: 2 }))}
                    className="flex-1"
                  >
                    Go Back
                  </Button>
                  <Button 
                    onClick={confirmProgressUpdate}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    Confirm Update
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

// Audit Log Viewer Component
export function AuditLogViewer() {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  const db = DatabaseService.getInstance()
  const auditLogs = db.getAuditLogs()

  const enhancedLogs = auditLogs.map((log) => {
    let actionDescription = ""
    let changeDescription = ""

    // Parse the values to create human-readable descriptions
    let oldData: any = {}
    let newData: any = {}

    try {
      if (log.old_values) oldData = JSON.parse(log.old_values)
      if (log.new_values) newData = JSON.parse(log.new_values)
    } catch (e) {
      // Handle parsing errors gracefully
    }

    switch (log.action) {
      case "CREATE":
        actionDescription = `Created new ${log.table_name.slice(0, -1)}`
        if (log.table_name === "laptops" && newData.brand) {
          changeDescription = `Added ${newData.brand} ${newData.model} to inventory with ${newData.quantity} units at $${newData.price}`
        } else if (log.table_name === "customers" && newData.name) {
          changeDescription = `Added customer ${newData.name} (${newData.email})`
        } else if (log.table_name === "sales" && newData.total_amount) {
          changeDescription = `Recorded sale of $${newData.total_amount} via ${newData.payment_method}`
        } else {
          changeDescription = `Created new record in ${log.table_name}`
        }
        break
      case "UPDATE":
        actionDescription = `Updated ${log.table_name.slice(0, -1)}`
        if (log.table_name === "laptops") {
          const changes = []
          if (oldData.quantity !== newData.quantity) {
            changes.push(`quantity from ${oldData.quantity} to ${newData.quantity}`)
          }
          if (oldData.price !== newData.price) {
            changes.push(`price from $${oldData.price} to $${newData.price}`)
          }
          if (oldData.brand && oldData.model) {
            changeDescription = `Updated ${oldData.brand} ${oldData.model}: ${changes.join(", ") || "modified details"}`
          } else {
            changeDescription = `Updated laptop details: ${changes.join(", ") || "modified information"}`
          }
        } else if (log.table_name === "customers") {
          const changes = []
          if (oldData.name !== newData.name) {
            changes.push(`name from "${oldData.name}" to "${newData.name}"`)
          }
          if (oldData.email !== newData.email) {
            changes.push(`email from "${oldData.email}" to "${newData.email}"`)
          }
          if (oldData.phone !== newData.phone) {
            changes.push(`phone from "${oldData.phone}" to "${newData.phone}"`)
          }
          changeDescription = `Updated customer: ${changes.join(", ") || "modified details"}`
        } else {
          changeDescription = `Modified record details`
        }
        break
      case "DELETE":
        actionDescription = `Deleted ${log.table_name.slice(0, -1)}`
        if (log.table_name === "laptops" && oldData.brand) {
          changeDescription = `Removed ${oldData.brand} ${oldData.model} from inventory`
        } else if (log.table_name === "customers" && oldData.name) {
          changeDescription = `Deleted customer ${oldData.name}`
        } else {
          changeDescription = `Deleted record from ${log.table_name}`
        }
        break
      case "RESTORE":
        actionDescription = `Restored ${log.table_name.slice(0, -1)}`
        changeDescription = `Restored previously deleted record`
        break
      case "GENERATE":
        actionDescription = "Generated dummy data"
        changeDescription = "System generated sample data for testing"
        break
      default:
        actionDescription = log.action
        changeDescription = "System operation performed"
    }

    return {
      ...log,
      actionDescription,
      changeDescription,
      timestamp_formatted: new Date(log.timestamp).toLocaleString(),
    }
  })

  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATE":
        return "bg-card text-foreground border-border"
      case "UPDATE":
        return "bg-primary/10 text-primary border-primary/20"
      case "DELETE":
        return "bg-destructive/10 text-destructive border-destructive/20"
      case "RESTORE":
        return "bg-muted text-muted-foreground border-border"
      case "GENERATE":
        return "bg-muted text-muted-foreground border-border"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Audit Log
        </CardTitle>
        <CardDescription>Complete system activity log with change tracking</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Timestamp</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enhancedLogs.slice(0, 50).map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-sm">{log.timestamp_formatted}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    User #{log.user_id}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getActionColor(log.action)}>{log.action}</Badge>
                </TableCell>
                <TableCell className="max-w-md">
                  <div className="space-y-1">
                    <p className="font-medium text-sm">{log.actionDescription}</p>
                    <p className="text-xs text-muted-foreground">{log.changeDescription}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedLog(log)}>
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {selectedLog && (
          <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Change Details</DialogTitle>
                <DialogDescription>Complete information about this system change</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">When</Label>
                    <p>{selectedLog.timestamp_formatted}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Who</Label>
                    <p>User #{selectedLog.user_id}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Action</Label>
                    <Badge className={getActionColor(selectedLog.action)}>{selectedLog.action}</Badge>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Area</Label>
                    <p className="capitalize">{selectedLog.table_name}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">What Changed</Label>
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="font-medium">{selectedLog.actionDescription}</p>
                    <p className="text-sm text-muted-foreground mt-1">{selectedLog.changeDescription}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Record ID</Label>
                  <p>#{selectedLog.record_id}</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  )
}

// Notification Center Component
export function NotificationCenter() {
  const db = DatabaseService.getInstance()
  const lowStockItems = db.getLowStockLaptops()
  const sales = db.getSales()
  const laptops = db.getLaptops()
  const customers = db.getCustomers()

  // Generate notifications
  const notifications = useMemo(() => {
    const notifs = []

    // Low stock notifications
    lowStockItems.forEach((laptop) => {
      notifs.push({
        id: `stock-${laptop.id}`,
        type: "warning",
        title: "Low Stock Alert",
        message: `${laptop.brand} ${laptop.model} is running low (${laptop.quantity} left)`,
        timestamp: new Date().toISOString(),
        icon: <AlertTriangle className="h-4 w-4" />,
      })
    })

    // Warranty expiry notifications
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    sales.forEach((sale) => {
      const warrantyExpiry = new Date(sale.warranty_expiry)
      if (warrantyExpiry <= thirtyDaysFromNow && warrantyExpiry > now) {
        const laptop = laptops.find((l) => l.id === sale.laptop_id)
        const customer = customers.find((c) => c.id === sale.customer_id)
        notifs.push({
          id: `warranty-${sale.id}`,
          type: "info",
          title: "Warranty Expiring",
          message: `Warranty for ${customer?.name}'s ${laptop?.brand} ${laptop?.model} expires on ${warrantyExpiry.toLocaleDateString()}`,
          timestamp: sale.warranty_expiry,
          icon: <Shield className="h-4 w-4" />,
        })
      }
    })

    return notifs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }, [lowStockItems, sales, laptops, customers])

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "warning":
        return "border-secondary/20 bg-secondary/10"
      case "error":
        return "border-destructive/20 bg-destructive/10"
      case "info":
        return "border-primary/20 bg-primary/10"
      case "success":
        return "border-border bg-card"
      default:
        return "border-border bg-muted"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Center
          {notifications.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {notifications.length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>System alerts and important notifications</CardDescription>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No notifications at this time</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <div key={notification.id} className={`p-3 rounded-lg border ${getNotificationColor(notification.type)}`}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{notification.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{notification.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(notification.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Database Backup Management Component
export function DatabaseBackupManager() {
  const [backups, setBackups] = useState<any[]>([])
  const [isCreatingBackup, setIsCreatingBackup] = useState(false)
  const [selectedBackup, setSelectedBackup] = useState<any>(null)

  const db = DatabaseService.getInstance()
  const currentUser = AuthService.getCurrentUser()
  const isAdmin = currentUser?.role === "admin"
  const isManager = currentUser?.role === "manager"
  const canManageBackups = isAdmin || isManager

  // Load backups from database service
  useEffect(() => {
    if (canManageBackups) {
      setBackups(db.getBackups())
    }
  }, [canManageBackups])

  const createBackup = async () => {
    setIsCreatingBackup(true)
    try {
      // Simulate backup creation delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Create backup using database service
      const newBackup = db.createBackup("Manual backup")
      
      // Refresh backups list
      setBackups(db.getBackups())

      // Show success message
      alert("Backup created successfully!")
    } catch (error) {
      alert("Failed to create backup")
    } finally {
      setIsCreatingBackup(false)
    }
  }

  const restoreFromBackup = async (backup: any) => {
    // Only admins can restore from backups
    if (!isAdmin) {
      alert("Only administrators can restore from backups. This action is restricted for security reasons.")
      return
    }

    if (
      !confirm(
        `Are you sure you want to restore from backup "${backup.filename}"? This will replace all current data and cannot be undone.`,
      )
    ) {
      return
    }

    try {
      // Simulate restore process
      await new Promise((resolve) => setTimeout(resolve, 3000))

      // Log the restore operation
      db.logAudit?.(1, "RESTORE", "system", 0, "", `Restored from backup: ${backup.filename}`)

      alert("Database restored successfully! Please refresh the page.")
      window.location.reload()
    } catch (error) {
      alert("Failed to restore from backup")
    }
  }

  const downloadBackup = async (_backup: any) => {
    window.location.href = "/api/backup/download"
  }

  const deleteBackup = async (backup: any) => {
    // Only admins can delete backups
    if (!isAdmin) {
      alert("Only administrators can delete backups. This action is restricted for security reasons.")
      return
    }

    if (!confirm(`Are you sure you want to delete backup "${backup.filename}"? This action cannot be undone.`)) {
      return
    }

    try {
      setBackups(backups.filter((b) => b.id !== backup.id))
      alert("Backup deleted successfully!")
    } catch (error) {
      alert("Failed to delete backup")
    }
  }

  // Show different UI for managers vs admins
  if (isManager && !isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Create Database Backup
          </CardTitle>
          <CardDescription>Create manual backups to ensure data safety</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted border border-border rounded-lg p-4 mb-6">
            <div className="flex items-start gap-2">
              <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground">Backup Information</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  • Create manual backups before making major changes
                  <br />• Backups include all system data and settings
                  <br />• Contact your administrator for backup restoration
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Button
              onClick={createBackup}
              disabled={isCreatingBackup}
              className="bg-cyan-600 hover:bg-cyan-700"
              size="lg"
            >
              {isCreatingBackup ? "Creating Backup..." : "Create Manual Backup"}
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              This will create a complete backup of the current system state
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Database Backup Management
        </CardTitle>
        <CardDescription>Create, manage, and restore database backups (Admin Only)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            <Badge variant="outline">{backups.length} Backups Available</Badge>
            <Badge variant="outline">
              Latest: {backups.length > 0 ? new Date(backups[0].created_at).toLocaleDateString() : "None"}
            </Badge>
          </div>
          <Button onClick={createBackup} disabled={isCreatingBackup} className="bg-cyan-600 hover:bg-cyan-700">
            {isCreatingBackup ? "Creating..." : "Create Backup"}
          </Button>
        </div>

        <div className="mb-4">
          <Label className="block mb-2">Upload Backup (JSON) — applies instantly to database</Label>
          <input
            type="file"
            accept="application/json,.json"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              const form = new FormData()
              form.append('file', file)
              const res = await fetch('/api/backup/upload', { method: 'POST', body: form })
              if (res.ok) {
                alert('Backup uploaded and applied to MySQL. Reloading...')
                window.location.reload()
              } else {
                alert('Failed to upload backup')
              }
            }}
          />
        </div>

        <div className="bg-muted border border-border rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <h4 className="font-medium text-foreground">Important Backup Information</h4>
              <p className="text-sm text-muted-foreground mt-1">
                • Backups are stored locally and include all system data
                <br />• Restoring from backup will replace ALL current data
                <br />• Always create a backup before major system changes
                <br />• Regular automated backups are recommended for data safety
              </p>
            </div>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Backup File</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Records</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {backups.map((backup) => (
              <TableRow key={backup.id}>
                <TableCell className="font-mono text-sm">{backup.filename}</TableCell>
                <TableCell>{new Date(backup.created_at).toLocaleString()}</TableCell>
                <TableCell>{backup.size}</TableCell>
                <TableCell>{backup.records_count}</TableCell>
                <TableCell>{backup.description}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadBackup(backup)}
                      title="Download backup file"
                    >
                      Download
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => restoreFromBackup(backup)}
                      className="text-primary hover:text-primary/80"
                      title="Restore from this backup"
                    >
                      Restore
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedBackup(backup)}
                      title="View backup details"
                    >
                      Details
                    </Button>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteBackup(backup)}
                        className="text-destructive hover:text-destructive/80"
                        title="Delete backup (Admin only)"
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {backups.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No backups available</p>
            <p className="text-sm">Create your first backup to ensure data safety</p>
          </div>
        )}

        {selectedBackup && (
          <Dialog open={!!selectedBackup} onOpenChange={() => setSelectedBackup(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Backup Details</DialogTitle>
                <DialogDescription>Complete information about this database backup</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Filename</Label>
                    <p className="font-mono text-sm">{selectedBackup.filename}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Created</Label>
                    <p>{new Date(selectedBackup.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">File Size</Label>
                    <p>{selectedBackup.size}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Total Records</Label>
                    <p>{selectedBackup.records_count}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p>{selectedBackup.description}</p>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={() => restoreFromBackup(selectedBackup)} className="bg-primary hover:bg-primary/90">
                    Restore from This Backup
                  </Button>
                  <Button variant="outline" onClick={() => downloadBackup(selectedBackup)}>
                    Download Backup
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  )
}

// Main Advanced Features Component
export function AdvancedFeatures({ onRefresh }: { onRefresh?: () => void }) {
  // Get current user role for permission checking
  const currentUser = AuthService.getCurrentUser()
  const isWorker = currentUser?.role === "worker"
  const isManager = currentUser?.role === "manager"
  const isAdmin = currentUser?.role === "admin"
  
  // Persist active tab in localStorage to prevent reset on re-render
  const [activeTab, setActiveTab] = useState("notifications")
  const [showTestingHelp, setShowTestingHelp] = useState(false)
  
  // Load persisted tab from localStorage after component mounts
  useEffect(() => {
    const storedTab = localStorage.getItem("advanced-active-tab")
    if (storedTab && storedTab !== "notifications") {
      setActiveTab(storedTab)
    }
  }, [])
  
  // Persist tab changes to localStorage and prevent reset to notifications
  useEffect(() => {
    if (activeTab && activeTab !== "notifications") {
      localStorage.setItem("advanced-active-tab", activeTab)
    }
  }, [activeTab])
  
  // Prevent activeTab from being reset to "notifications" unless explicitly changed
  useEffect(() => {
    const storedTab = localStorage.getItem("advanced-active-tab")
    if (storedTab && storedTab !== "notifications" && activeTab === "notifications") {
      setActiveTab(storedTab)
    }
  }, [activeTab])
  
  // Redirect users away from restricted tabs if they somehow access them
  useEffect(() => {
    // Workers cannot access audit logs or backup
    if (isWorker && (activeTab === "audit" || activeTab === "backup")) {
      setActiveTab("notifications")
      localStorage.setItem("advanced-active-tab", "notifications")
    }
    // Only managers and admins can access backup
    if (!isManager && !isAdmin && activeTab === "backup") {
      setActiveTab("notifications")
      localStorage.setItem("advanced-active-tab", "notifications")
    }
  }, [isWorker, isManager, isAdmin, activeTab])
  
  // Handle tab change and persist to localStorage
  const handleTabChange = useCallback((value: string) => {
    console.log("Advanced tab changing from", activeTab, "to", value)
    setActiveTab(value)
    if (typeof window !== "undefined") {
      localStorage.setItem("advanced-active-tab", value)
    }
  }, [activeTab])
  
  // Debug: Log when component re-renders
  console.log("AdvancedFeatures re-render, activeTab:", activeTab, "stored:", localStorage.getItem("advanced-active-tab"))
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Features</h2>
          <p className="text-muted-foreground">Comprehensive business management tools and alerts</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className={`grid w-full ${isWorker ? 'grid-cols-5' : isAdmin ? 'grid-cols-8' : 'grid-cols-7'}`}>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="warranty">Warranty</TabsTrigger>
          <TabsTrigger value="repairs">Repairs</TabsTrigger>
          <TabsTrigger value="installments">Installments</TabsTrigger>
          <TabsTrigger value="testing">Testing</TabsTrigger>
          {!isWorker && (
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          )}
          {(isManager || isAdmin) && (
            <TabsTrigger value="backup">Backup</TabsTrigger>
          )}
          {isAdmin && (
            <TabsTrigger value="credentials">Login Credentials</TabsTrigger>
          )}
          {isManager && !isAdmin && (
            <TabsTrigger value="approvals">Registrations</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="notifications">
          {isWorker ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Notification Center</h3>
                  <p className="text-sm text-muted-foreground">View-only access for workers</p>
                </div>
                <Badge variant="outline">Worker Mode - View Only</Badge>
              </div>
              <NotificationCenter />
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Advanced Overview</CardTitle>
                  <CardDescription>Quick summary table</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Section</TableHead>
                        <TableHead>Visible</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Notifications</TableCell>
                        <TableCell>Yes</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-4">
              <NotificationCenter />
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Advanced Overview</CardTitle>
                  <CardDescription>Quick summary table</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Section</TableHead>
                        <TableHead>Visible</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>Notifications</TableCell>
                        <TableCell>Yes</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="warranty">
          {isWorker ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Warranty Alerts</h3>
                  <p className="text-sm text-muted-foreground">View-only access for workers</p>
                </div>
                <Badge variant="outline">Worker Mode - View Only</Badge>
              </div>
              <WarrantyAlerts />
            </div>
          ) : (
            <WarrantyAlerts />
          )}
        </TabsContent>

        <TabsContent value="repairs">
          <RepairManagement onRefresh={onRefresh} />
        </TabsContent>

        <TabsContent value="installments">
          {isWorker ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Installment Management</h3>
                  <p className="text-sm text-muted-foreground">Progress updates only for workers</p>
                </div>
                <Badge variant="outline">Worker Mode - Progress Updates Only</Badge>
              </div>
              <InstallmentManagement />
            </div>
          ) : (
            <ProtectedRoute requiredPermission="installments">
              <InstallmentManagement />
            </ProtectedRoute>
          )}
        </TabsContent>

        <TabsContent value="testing">
          <div className="space-y-6">
            <TestRunner />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Testing Instructions & User Guidance
                </CardTitle>
                <CardDescription>
                  Follow these steps to ensure all features work correctly and avoid common issues
                </CardDescription>
                <div className="mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowTestingHelp(!showTestingHelp)}
                    className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <HelpCircle className="h-4 w-4" />
                    {showTestingHelp ? 'Hide Testing Guide' : 'Show Testing Guide'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {showTestingHelp && (
                  <>
                    <div className="space-y-4">
                      <h4 className="font-semibold">🔧 Pre-Testing Checklist:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h5 className="font-medium">✅ Authentication & Permissions</h5>
                          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                            <li>Log in with a valid user account (admin, manager, or worker)</li>
                            <li>Verify your role permissions match expected access levels</li>
                            <li>Check that all tabs are accessible based on your role</li>
                            <li>Ensure session hasn't expired (check for logout prompts)</li>
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <h5 className="font-medium">✅ Data & Environment</h5>
                          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                            <li>Generate sample data if database is empty (Admin only)</li>
                            <li>Check that dark mode toggle is working properly</li>
                            <li>Verify browser supports modern JavaScript features</li>
                            <li>Ensure no browser extensions are blocking functionality</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-semibold">📋 Feature Testing Guide:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="p-3 bg-muted rounded-lg">
                            <h5 className="font-medium">📊 Dashboard & Reports</h5>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-2">
                              <li>Check all overview cards display correctly</li>
                              <li>Verify charts and graphs render properly</li>
                              <li>Test export functionality (CSV/PDF)</li>
                              <li>Ensure data filtering and sorting works</li>
                              <li>Check that low stock alerts appear</li>
                            </ul>
                          </div>
                          
                          <div className="p-3 bg-muted rounded-lg">
                            <h5 className="font-medium">🛍️ Sales & Cart</h5>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-2">
                              <li>Add items to cart and complete checkout</li>
                              <li>Test different payment methods</li>
                              <li>Verify sales records are created</li>
                              <li>Check customer creation during checkout</li>
                              <li>Test cart clearing and item removal</li>
                            </ul>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="p-3 bg-muted rounded-lg">
                            <h5 className="font-medium">📦 Inventory Management</h5>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-2">
                              <li>Add, edit, and delete laptop entries</li>
                              <li>Test bulk import/export operations</li>
                              <li>Verify stock level updates</li>
                              <li>Check low stock alerts and thresholds</li>
                              <li>Test image upload and display</li>
                            </ul>
                          </div>
                          
                          <div className="p-3 bg-muted rounded-lg">
                            <h5 className="font-medium">👥 Customer Management</h5>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-2">
                              <li>Add new customers manually</li>
                              <li>Edit customer information</li>
                              <li>View customer purchase history</li>
                              <li>Test customer search and filtering</li>
                              <li>Check customer tier assignments</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-semibold">⚠️ Common Issues & Solutions:</h4>
                      <div className="space-y-3">
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                          <p className="font-medium text-destructive">❌ Dark mode not working properly</p>
                          <p className="text-sm text-muted-foreground mt-1">Solution: Check for hardcoded colors in components, ensure theme provider is properly configured, refresh the page</p>
                        </div>
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                          <p className="font-medium text-destructive">❌ Export functions not working</p>
                          <p className="text-sm text-muted-foreground mt-1">Solution: Ensure browser supports Blob API, check for JavaScript errors in console, try different browser</p>
                        </div>
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                          <p className="font-medium text-destructive">❌ Import validation errors</p>
                          <p className="text-sm text-muted-foreground mt-1">Solution: Check CSV format, ensure all required fields are filled, verify data types match expected format</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-semibold">📝 Import/Export Instructions:</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                          <h5 className="font-medium text-primary">📤 Export Operations</h5>
                          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-2">
                            <li>Click export button (CSV/PDF)</li>
                            <li>Wait for file generation to complete</li>
                            <li>File will download automatically</li>
                            <li>Check downloads folder for the file</li>
                            <li>Open with appropriate application (Excel for CSV)</li>
                          </ul>
                        </div>
                        <div className="p-3 bg-secondary/10 border border-secondary/20 rounded-lg">
                          <h5 className="font-medium text-secondary">📥 Import Operations</h5>
                          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-2">
                            <li>Prepare CSV file with correct headers</li>
                            <li>Ensure data format matches expected structure</li>
                            <li>Click import button and select file</li>
                            <li>Review preview data before confirming</li>
                            <li>Check for any validation errors</li>
                            <li>Confirm import to add data to system</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audit">
          {isWorker ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Audit Log Viewer</h3>
                  <p className="text-sm text-muted-foreground">Access restricted for workers</p>
                </div>
                <Badge variant="outline">Access Denied - Workers</Badge>
              </div>
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Audit logs are restricted to managers and administrators only</p>
              </div>
            </div>
          ) : (
            <AuditLogViewer />
          )}
        </TabsContent>

        <TabsContent value="backup">
          <ProtectedRoute requiredPermission="backup_create">
            <DatabaseBackupManager />
          </ProtectedRoute>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="credentials">
            <CredentialsManager />
          </TabsContent>
        )}

        {isManager && !isAdmin && (
          <TabsContent value="approvals">
            <ManagerApprovals />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

function CredentialsManager() {
  const db = DatabaseService.getInstance()
  const [requests, setRequests] = useState<RegistrationRequest[]>(db.getRegistrationRequests())
  const [users, setUsers] = useState<User[]>(db.getUsers())

  const refresh = () => {
    setRequests([...db.getRegistrationRequests()])
    setUsers([...db.getUsers()])
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Pending Registration Requests</CardTitle>
          <CardDescription>Approve or reject new user registrations</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Requested Role</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.filter(r => r.status === "pending").map((req) => (
                <TableRow key={req.id}>
                  <TableCell>#{req.id}</TableCell>
                  <TableCell>{req.username}</TableCell>
                  <TableCell>{req.email}</TableCell>
                  <TableCell>{req.phone}</TableCell>
                  <TableCell className="capitalize">{req.requested_role}</TableCell>
                  <TableCell>{new Date(req.submitted_at).toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          const current = AuthService.getCurrentUser()!
                          const res = db.approveRegistration(req.id, { id: current.id, username: current.username, role: "admin" })
                          alert(res.message)
                          refresh()
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const current = AuthService.getCurrentUser()!
                          const res = db.rejectRegistration(req.id, { id: current.id, username: current.username, role: "admin" })
                          alert(res.message)
                          refresh()
                        }}
                      >
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {requests.filter(r => r.status === "pending").length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">No pending requests</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>All registered users and roles</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>#{u.id}</TableCell>
                  <TableCell>{u.username}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.phone || '-'}</TableCell>
                  <TableCell className="capitalize">{u.role}</TableCell>
                  <TableCell>{u.is_active ? "Yes" : "No"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function ManagerApprovals() {
  const db = DatabaseService.getInstance()
  const [requests, setRequests] = useState<RegistrationRequest[]>(db.getRegistrationRequests())

  const refresh = () => setRequests([...db.getRegistrationRequests()])

  const pendingWorkers = requests.filter((r) => r.status === "pending" && r.requested_role === "worker")

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Worker Registrations</CardTitle>
        <CardDescription>Managers can approve or reject worker registrations</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingWorkers.map((req) => (
              <TableRow key={req.id}>
                <TableCell>#{req.id}</TableCell>
                <TableCell>{req.username}</TableCell>
                <TableCell>{req.email}</TableCell>
                <TableCell>{req.phone}</TableCell>
                <TableCell>{new Date(req.submitted_at).toLocaleString()}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        const current = AuthService.getCurrentUser()!
                        const res = db.approveRegistration(req.id, { id: current.id, username: current.username, role: "manager" })
                        alert(res.message)
                        refresh()
                      }}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const current = AuthService.getCurrentUser()!
                        const res = db.rejectRegistration(req.id, { id: current.id, username: current.username, role: "manager" })
                        alert(res.message)
                        refresh()
                      }}
                    >
                      Reject
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {pendingWorkers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  No pending worker registrations
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
