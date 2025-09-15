"use client"

import type React from "react"

import { useState, useMemo } from "react"
import { DatabaseService, type Sale } from "@/lib/database"
import { AuthService } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { ProtectedRoute } from "@/components/protected-route"
import {
  Plus,
  Search,
  Download,
  DollarSign,
  ShoppingCart,
  TrendingUp,
  Calendar,
  CreditCard,
  Receipt,
  ArrowUpDown,
  HelpCircle,
} from "lucide-react"

type SortField = "sale_date" | "total_amount" | "customer_name" | "laptop_model"
type SortDirection = "asc" | "desc"

export function SalesTab() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentFilter, setPaymentFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [sortField, setSortField] = useState<SortField>("sale_date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [showNewSaleDialog, setShowNewSaleDialog] = useState(false)
  const [selectedSale, setSelectedSale] = useState<any>(null)
  const [showSalesHelp, setShowSalesHelp] = useState(false)

  const db = DatabaseService.getInstance()
  const sales = db.getSales()
  const laptops = db.getLaptops()
  const customers = db.getCustomers()

  // Enhanced sales data with customer and laptop info
  const enhancedSales = useMemo(() => {
    return sales.map((sale) => {
      const laptop = laptops.find((l) => l.id === sale.laptop_id)
      const customer = customers.find((c) => c.id === sale.customer_id)
      return {
        ...sale,
        laptop_name: laptop ? `${laptop.brand} ${laptop.model}` : "Unknown",
        customer_name: customer ? customer.name : "Unknown",
        profit: laptop ? (sale.unit_price - laptop.cost) * sale.quantity : 0,
      }
    })
  }, [sales, laptops, customers])

  // Filter and sort sales
  const filteredAndSortedSales = useMemo(() => {
    const filtered = enhancedSales.filter((sale) => {
      const matchesSearch =
        sale.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.laptop_name.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === "all" || sale.status === statusFilter
      const matchesPayment = paymentFilter === "all" || sale.payment_method === paymentFilter

      let matchesDate = true
      if (dateFilter !== "all") {
        const saleDate = new Date(sale.sale_date)
        const now = new Date()
        const daysDiff = Math.floor((now.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24))

        switch (dateFilter) {
          case "today":
            matchesDate = daysDiff === 0
            break
          case "week":
            matchesDate = daysDiff <= 7
            break
          case "month":
            matchesDate = daysDiff <= 30
            break
        }
      }

      return matchesSearch && matchesStatus && matchesPayment && matchesDate
    })

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortField as keyof typeof a]
      let bValue: any = b[sortField as keyof typeof b]

      if (sortField === "customer_name" || sortField === "laptop_model") {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (sortDirection === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    return filtered
  }, [enhancedSales, searchTerm, statusFilter, paymentFilter, dateFilter, sortField, sortDirection])

  // Calculate stats
  const totalRevenue = filteredAndSortedSales.reduce((sum, sale) => sum + sale.total_amount, 0)
  const totalProfit = filteredAndSortedSales.reduce((sum, sale) => sum + sale.profit, 0)
  const avgOrderValue = filteredAndSortedSales.length > 0 ? totalRevenue / filteredAndSortedSales.length : 0

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const exportToCSV = () => {
    const headers = [
      "Sale ID",
      "Date",
      "Customer",
      "Laptop",
      "Quantity",
      "Unit Price",
      "Total Amount",
      "Payment Method",
      "Status",
      "Profit",
      "Warranty Expiry",
    ]

    const csvData = filteredAndSortedSales.map((sale) => [
      sale.id,
      new Date(sale.sale_date).toLocaleDateString(),
      sale.customer_name,
      sale.laptop_name,
      sale.quantity,
      sale.unit_price,
      sale.total_amount,
      sale.payment_method,
      sale.status,
      sale.profit.toFixed(2),
      new Date(sale.warranty_expiry).toLocaleDateString(),
    ])

    const csvContent = [headers, ...csvData].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `sales_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-card text-foreground border-border"
      case "pending":
        return "bg-muted text-muted-foreground border-border"
      case "cancelled":
        return "bg-muted text-muted-foreground border-border"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "cash":
        return <DollarSign className="h-4 w-4 text-foreground" />
      case "card":
        return <CreditCard className="h-4 w-4 text-foreground" />
      case "installment":
        return <Calendar className="h-4 w-4 text-foreground" />
      default:
        return <Receipt className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted">
            <CardTitle className="text-sm font-medium text-foreground">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{filteredAndSortedSales.length}</div>
            <p className="text-xs text-muted-foreground">{sales.length} total</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted">
            <CardTitle className="text-sm font-medium text-foreground">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From filtered sales</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted">
            <CardTitle className="text-sm font-medium text-foreground">Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${totalProfit.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0}% margin
            </p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted">
            <CardTitle className="text-sm font-medium text-foreground">Avg Order Value</CardTitle>
            <Receipt className="h-4 w-4 text-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${avgOrderValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Per transaction</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card className="border-border">
        <CardHeader className="bg-card">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-foreground">Sales Management</CardTitle>
              <CardDescription className="text-muted-foreground">Track and manage all sales transactions</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSalesHelp(!showSalesHelp)}
              className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <HelpCircle className="h-4 w-4" />
              {showSalesHelp ? 'Hide Help' : 'Show Help'}
            </Button>
          </div>
        </CardHeader>
        {showSalesHelp && (
          <div className="px-6 pb-4 animate-in slide-in-from-top-2 duration-200">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <div className="text-sm">
                  <h4 className="font-semibold text-blue-800 mb-3">💰 Sales Management Guide:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium text-blue-700 mb-2">🔍 Search & Filter</h5>
                      <ul className="list-disc list-inside space-y-1 text-blue-600">
                        <li>Search by customer name or laptop model</li>
                        <li>Filter by sale status (completed/pending/cancelled)</li>
                        <li>Filter by payment method (cash/card/installment)</li>
                        <li>Filter by date range (today/week/month/all time)</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-medium text-blue-700 mb-2">📊 Sales Analysis</h5>
                      <ul className="list-disc list-inside space-y-1 text-blue-600">
                        <li>View total revenue and profit metrics</li>
                        <li>Track sales performance over time</li>
                        <li>Monitor payment method distribution</li>
                        <li>Export sales data to CSV format</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by customer or laptop..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-border focus:border-primary focus:ring-primary"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32 border-border focus:border-primary">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-36 border-border focus:border-primary">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="installment">Installment</SelectItem>
              </SelectContent>
            </Select>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-32 border-border focus:border-primary">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <ProtectedRoute requiredPermission="sales">
              <Button onClick={() => setShowNewSaleDialog(true)} className="bg-black hover:bg-slate-800 text-white">
                <Plus className="w-4 h-4 mr-2" />
                New Sale
              </Button>
            </ProtectedRoute>

            <Button
              variant="outline"
              onClick={exportToCSV}
              className="border-slate-300 text-black hover:bg-slate-50 bg-transparent"
              title="Export sales data to CSV file. File will be downloaded to your Downloads folder."
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("sale_date")}>
                    <div className="flex items-center gap-1">
                      Date
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("customer_name")}>
                    <div className="flex items-center gap-1">
                      Customer
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Laptop</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("total_amount")}>
                    <div className="flex items-center gap-1">
                      Total
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Profit</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">#{sale.id}</TableCell>
                    <TableCell>{new Date(sale.sale_date).toLocaleDateString()}</TableCell>
                    <TableCell>{sale.customer_name}</TableCell>
                    <TableCell className="text-sm">{sale.laptop_name}</TableCell>
                    <TableCell>{sale.quantity}</TableCell>
                    <TableCell className="font-medium">${sale.total_amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(sale.status)}>{sale.status}</Badge>
                    </TableCell>
                    <TableCell className="text-black font-medium">${sale.profit.toFixed(0)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedSale(sale)}
                        className="text-black hover:bg-slate-50"
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* New Sale Dialog */}
      <NewSaleDialog
        open={showNewSaleDialog}
        onOpenChange={setShowNewSaleDialog}
        onSuccess={() => window.location.reload()}
      />

      {/* Sale Details Dialog */}
      {selectedSale && (
        <Dialog open={!!selectedSale} onOpenChange={() => setSelectedSale(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sale Details #{selectedSale.id}</DialogTitle>
              <DialogDescription>Complete information about this sale</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Customer</Label>
                  <p>{selectedSale.customer_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Date</Label>
                  <p>{new Date(selectedSale.sale_date).toLocaleDateString()}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Laptop</Label>
                <p>{selectedSale.laptop_name}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Quantity</Label>
                  <p>{selectedSale.quantity}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Unit Price</Label>
                  <p>${selectedSale.unit_price.toLocaleString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Total</Label>
                  <p className="font-medium">${selectedSale.total_amount.toLocaleString()}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Payment Method</Label>
                  <p className="capitalize">{selectedSale.payment_method}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={getStatusColor(selectedSale.status)}>{selectedSale.status}</Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Warranty Expires</Label>
                <p>{new Date(selectedSale.warranty_expiry).toLocaleDateString()}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Profit</Label>
                <p className="text-black font-medium">${selectedSale.profit.toFixed(2)}</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// New Sale Dialog Component
function NewSaleDialog({
  open,
  onOpenChange,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    laptop_id: "",
    customer_id: "",
    quantity: "1",
    payment_method: "cash" as "cash" | "card" | "installment",
    installment_months: "12",
  })

  const db = DatabaseService.getInstance()
  const laptops = db.getLaptops().filter((laptop) => laptop.quantity > 0)
  const customers = db.getCustomers()
  const currentUser = AuthService.getCurrentUser()

  const selectedLaptop = laptops.find((l) => l.id === Number.parseInt(formData.laptop_id))
  const unitPrice = selectedLaptop?.price || 0
  const totalAmount = unitPrice * Number.parseInt(formData.quantity || "1")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser || !selectedLaptop) return

    const quantity = Number.parseInt(formData.quantity)
    const warrantyExpiry = new Date()
    warrantyExpiry.setMonth(warrantyExpiry.getMonth() + selectedLaptop.warranty_months)

    const sale = db.addSale({
      laptop_id: selectedLaptop.id,
      customer_id: Number.parseInt(formData.customer_id),
      user_id: currentUser.id,
      quantity,
      unit_price: unitPrice,
      total_amount: totalAmount,
      payment_method: formData.payment_method,
      sale_date: new Date().toISOString(),
      warranty_expiry: warrantyExpiry.toISOString(),
      status: "completed",
    })

    // If installment, create installment record
    if (formData.payment_method === "installment") {
      const months = Number.parseInt(formData.installment_months)
      const monthlyAmount = totalAmount / months
      const nextDueDate = new Date()
      nextDueDate.setMonth(nextDueDate.getMonth() + 1)

      // This would create an installment record in a real implementation
      console.log("Creating installment plan:", {
        sale_id: sale.id,
        customer_id: Number.parseInt(formData.customer_id),
        total_amount: totalAmount,
        monthly_amount: monthlyAmount,
        months,
        next_due_date: nextDueDate.toISOString(),
      })
    }

    onSuccess()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Sale</DialogTitle>
          <DialogDescription>Create a new sale transaction</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Customer</Label>
            <Select
              value={formData.customer_id}
              onValueChange={(value) => setFormData({ ...formData, customer_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    {customer.name} - {customer.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Laptop</Label>
            <Select
              value={formData.laptop_id}
              onValueChange={(value) => setFormData({ ...formData, laptop_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select laptop" />
              </SelectTrigger>
              <SelectContent>
                {laptops.map((laptop) => (
                  <SelectItem key={laptop.id} value={laptop.id.toString()}>
                    {laptop.brand} {laptop.model} - ${laptop.price.toLocaleString()} ({laptop.quantity} available)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min="1"
                max={selectedLaptop?.quantity || 1}
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value: "cash" | "card" | "installment") =>
                  setFormData({ ...formData, payment_method: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="installment">Installment</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {formData.payment_method === "installment" && (
            <div className="space-y-2">
              <Label>Installment Period</Label>
              <Select
                value={formData.installment_months}
                onValueChange={(value) => setFormData({ ...formData, installment_months: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 months</SelectItem>
                  <SelectItem value="12">12 months</SelectItem>
                  <SelectItem value="18">18 months</SelectItem>
                  <SelectItem value="24">24 months</SelectItem>
                </SelectContent>
              </Select>
              {totalAmount > 0 && (
                <p className="text-sm text-muted-foreground">
                  Monthly payment: ${(totalAmount / Number.parseInt(formData.installment_months)).toFixed(2)}
                </p>
              )}
            </div>
          )}

          {selectedLaptop && (
            <div className="bg-muted p-3 rounded-lg">
              <div className="flex justify-between">
                <span>Unit Price:</span>
                <span>${unitPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>Total Amount:</span>
                <span>${totalAmount.toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.laptop_id || !formData.customer_id}>
              Create Sale
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
