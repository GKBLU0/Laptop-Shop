"use client"

import type React from "react"

import { useState, useMemo, useEffect } from "react"
import { DatabaseService, type Customer } from "@/lib/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProtectedRoute } from "@/components/protected-route"
import {
  Plus,
  Search,
  Download,
  Users,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Edit,
  Eye,
  ArrowUpDown,
  Star,
  HelpCircle,
} from "lucide-react"

type SortField = "name" | "email" | "total_purchases" | "total_spent" | "created_at"
type SortDirection = "asc" | "desc"

interface CustomersTabProps {
  onRefresh: () => void
}

export function CustomersTab({ onRefresh }: CustomersTabProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<SortField>("created_at")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [showCustomerHelp, setShowCustomerHelp] = useState(false)

  const db = DatabaseService.getInstance()
  const customers = db.getCustomers()
  const sales = db.getSales()
  const laptops = db.getLaptops()

  // Enhanced customer data with purchase history
  const enhancedCustomers = useMemo(() => {
    return customers.map((customer) => {
      const customerSales = sales.filter((sale) => sale.customer_id === customer.id)
      const totalPurchases = customerSales.length
      const totalSpent = customerSales.reduce((sum, sale) => sum + sale.total_amount, 0)
      const lastPurchase =
        customerSales.length > 0
          ? new Date(Math.max(...customerSales.map((sale) => new Date(sale.sale_date).getTime())))
          : null

      // Calculate customer value tier
      let tier = "Bronze"
      if (totalSpent > 10000) tier = "Platinum"
      else if (totalSpent > 5000) tier = "Gold"
      else if (totalSpent > 2000) tier = "Silver"

      // Get preferred brands from purchase history
      const purchasedLaptops = customerSales
        .map((sale) => laptops.find((laptop) => laptop.id === sale.laptop_id))
        .filter(Boolean)
      const brandCounts = purchasedLaptops.reduce(
        (acc, laptop) => {
          if (laptop) {
            acc[laptop.brand] = (acc[laptop.brand] || 0) + 1
          }
          return acc
        },
        {} as Record<string, number>,
      )
      const actualPreferredBrands = Object.entries(brandCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([brand]) => brand)

      return {
        ...customer,
        totalPurchases,
        totalSpent,
        lastPurchase,
        tier,
        actualPreferredBrands,
        customerSales,
      }
    })
  }, [customers, sales, laptops])

  // Filter and sort customers
  const filteredAndSortedCustomers = useMemo(() => {
    const filtered = enhancedCustomers.filter((customer) => {
      const matchesSearch =
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone.includes(searchTerm)

      return matchesSearch
    })

    // Sort
    filtered.sort((a, b) => {
      let aValue: any = a[sortField as keyof typeof a]
      let bValue: any = b[sortField as keyof typeof b]

      if (typeof aValue === "string") {
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
  }, [enhancedCustomers, searchTerm, sortField, sortDirection])

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
      "ID",
      "Name",
      "Email",
      "Phone",
      "Address",
      "Total Purchases",
      "Total Spent",
      "Customer Tier",
      "Preferred Brands",
      "Last Purchase",
      "Notes",
    ]

    const csvData = filteredAndSortedCustomers.map((customer) => [
      customer.id,
      customer.name,
      customer.email,
      customer.phone,
      customer.address,
      customer.totalPurchases,
      customer.totalSpent.toFixed(2),
      customer.tier,
      customer.actualPreferredBrands.join(", "),
      customer.lastPurchase ? customer.lastPurchase.toLocaleDateString() : "Never",
      customer.notes,
    ])

    const csvContent = [headers, ...csvData].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `customers_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Platinum":
        return "bg-muted text-muted-foreground border-border"
      case "Gold":
        return "bg-card text-foreground border-border"
      case "Silver":
        return "bg-muted text-muted-foreground border-border"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "Platinum":
      case "Gold":
        return <Star className="h-3 w-3" />
      case "Silver":
        return <TrendingUp className="h-3 w-3" />
      default:
        return <Users className="h-3 w-3" />
    }
  }

  // Calculate stats
  const totalCustomers = customers.length
  const totalRevenue = enhancedCustomers.reduce((sum, customer) => sum + customer.totalSpent, 0)
  const avgCustomerValue = totalCustomers > 0 ? totalRevenue / totalCustomers : 0
  const activeCustomers = enhancedCustomers.filter(
    (customer) =>
      customer.lastPurchase && new Date().getTime() - customer.lastPurchase.getTime() < 90 * 24 * 60 * 60 * 1000, // 90 days
  ).length

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted">
            <CardTitle className="text-sm font-medium text-foreground">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">{filteredAndSortedCustomers.length} filtered</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted">
            <CardTitle className="text-sm font-medium text-foreground">Active Customers</CardTitle>
            <TrendingUp className="h-4 w-4 text-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{activeCustomers}</div>
            <p className="text-xs text-muted-foreground">Purchased in last 90 days</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted">
            <CardTitle className="text-sm font-medium text-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">From all customers</p>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 bg-muted">
            <CardTitle className="text-sm font-medium text-foreground">Avg Customer Value</CardTitle>
            <ShoppingBag className="h-4 w-4 text-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${avgCustomerValue.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">Per customer</p>
          </CardContent>
        </Card>
      </div>

      {/* Customer Management Help */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Customer Management</h2>
          <p className="text-muted-foreground">Manage customer information, track purchases, and analyze customer value</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowCustomerHelp(!showCustomerHelp)}
          className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
        >
          <HelpCircle className="h-4 w-4" />
          {showCustomerHelp ? 'Hide Help' : 'Show Help'}
        </Button>
      </div>
      
      {showCustomerHelp && (
        <Card className="bg-blue-50 border-blue-200 animate-in slide-in-from-top-2 duration-200">
          <CardContent className="pt-6">
            <div className="text-sm">
              <h4 className="font-semibold text-blue-800 mb-3">👥 Customer Management Guide:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-blue-700 mb-2">📊 Customer Insights</h5>
                  <ul className="list-disc list-inside space-y-1 text-blue-600">
                    <li>Customer Tiers: Bronze, Silver, Gold, Platinum based on spending</li>
                    <li>Purchase History: Track all customer transactions</li>
                    <li>Preferred Brands: Automatically detected from purchases</li>
                    <li>Activity Status: Active customers (purchased in last 90 days)</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium text-blue-700 mb-2">🔧 Management Features</h5>
                  <ul className="list-disc list-inside space-y-1 text-blue-600">
                    <li>Add new customers with detailed information</li>
                    <li>Edit existing customer details</li>
                    <li>Search and filter customers</li>
                    <li>Export customer data to CSV</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Actions */}
      <Card className="border-border">
        <CardHeader className="bg-card">
          <CardTitle className="text-foreground">Customer Management</CardTitle>
          <CardDescription className="text-muted-foreground">
            Manage customer relationships and track purchase history
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-border focus:border-primary focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <ProtectedRoute requiredPermission="customers_edit">
              <Button onClick={() => setShowAddDialog(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Add Customer
              </Button>
            </ProtectedRoute>

            <Button
              variant="outline"
              onClick={exportToCSV}
                              className="border-border text-foreground hover:bg-accent bg-transparent"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("name")}>
                    <div className="flex items-center gap-1">
                      Name
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("email")}>
                    <div className="flex items-center gap-1">
                      Contact
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("total_purchases")}>
                    <div className="flex items-center gap-1">
                      Purchases
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("total_spent")}>
                    <div className="flex items-center gap-1">
                      Total Spent
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Preferred Brands</TableHead>
                  <TableHead>Last Purchase</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{customer.email}</div>
                        <div className="text-muted-foreground">{customer.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>{customer.totalPurchases}</TableCell>
                    <TableCell className="font-medium">${customer.totalSpent.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={getTierColor(customer.tier)}>
                        {getTierIcon(customer.tier)}
                        <span className="ml-1">{customer.tier}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {customer.actualPreferredBrands.length > 0
                        ? customer.actualPreferredBrands.join(", ")
                        : customer.preferred_brands || "None"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {customer.lastPurchase ? customer.lastPurchase.toLocaleDateString() : "Never"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedCustomer(customer)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <ProtectedRoute requiredPermission="customers_edit">
                          <Button variant="ghost" size="sm" onClick={() => setEditingCustomer(customer)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </ProtectedRoute>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Customer Details Dialog */}
      {selectedCustomer && (
        <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>{selectedCustomer.name}</DialogTitle>
              <DialogDescription>Complete customer profile and purchase history</DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="profile" className="w-full">
              <TabsList>
                <TabsTrigger value="profile">Profile</TabsTrigger>
                <TabsTrigger value="history">Purchase History</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <p>{selectedCustomer.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Phone</Label>
                    <p>{selectedCustomer.phone}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Address</Label>
                  <p>{selectedCustomer.address}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Customer Tier</Label>
                  <Badge className={getTierColor(selectedCustomer.tier)}>
                    {getTierIcon(selectedCustomer.tier)}
                    <span className="ml-1">{selectedCustomer.tier}</span>
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Preferred Brands</Label>
                  <p>{selectedCustomer.preferred_brands || "Not specified"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Notes</Label>
                  <p className="text-sm text-muted-foreground">{selectedCustomer.notes || "No notes available"}</p>
                </div>
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                <div className="space-y-2">
                  {selectedCustomer.customerSales.length > 0 ? (
                    selectedCustomer.customerSales.map((sale) => {
                      const laptop = laptops.find((l) => l.id === sale.laptop_id)
                      return (
                        <Card key={sale.id}>
                          <CardContent className="pt-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">
                                  {laptop ? `${laptop.brand} ${laptop.model}` : "Unknown Laptop"}
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(sale.sale_date).toLocaleDateString()} • Qty: {sale.quantity} •
                                  {sale.payment_method}
                                </p>
                              </div>
                        <div className="text-right">
                          <p className="font-medium">${sale.total_amount.toLocaleString()}</p>
                          {sale && sale.status && <Badge className={getStatusColor(sale.status)}>{sale.status}</Badge>}
                        </div>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <ShoppingBag className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No purchase history available</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Total Purchases</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedCustomer.totalPurchases}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Total Spent</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">${selectedCustomer.totalSpent.toLocaleString()}</div>
                    </CardContent>
                  </Card>
                </div>
                <div>
                  <Label className="text-sm font-medium">Actual Preferred Brands (Based on Purchases)</Label>
                  <div className="flex gap-2 mt-2">
                    {selectedCustomer.actualPreferredBrands.map((brand) => (
                      <Badge key={brand} variant="outline">
                        {brand}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Last Purchase</Label>
                  <p>{selectedCustomer.lastPurchase ? selectedCustomer.lastPurchase.toLocaleDateString() : "Never"}</p>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* Add/Edit Customer Dialog */}
      {(showAddDialog || editingCustomer) && (
        <Dialog
          open={showAddDialog || !!editingCustomer}
          onOpenChange={() => {
            setShowAddDialog(false)
            setEditingCustomer(null)
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingCustomer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
              <DialogDescription>
                {editingCustomer ? "Update customer information" : "Enter customer details to add them to the system"}
              </DialogDescription>
            </DialogHeader>
            <CustomerForm
              customer={editingCustomer}
              onSave={(customerData) => {
                if (editingCustomer) {
                  db.updateCustomer(editingCustomer.id, customerData)
                } else {
                  db.addCustomer(customerData)
                }
                setShowAddDialog(false)
                setEditingCustomer(null)
                loadData() // Refresh local data
                onRefresh() // Trigger dashboard refresh
              }}
              onCancel={() => {
                setShowAddDialog(false)
                setEditingCustomer(null)
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

// CustomerForm component for adding/editing customers
function CustomerForm({
  customer,
  onSave,
  onCancel,
}: {
  customer?: Customer | null
  onSave: (data: any) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: customer?.name || "",
    email: customer?.email || "",
    phone: customer?.phone || "",
    address: customer?.address || "",
    preferred_brands: customer?.preferred_brands || "",
    notes: customer?.notes || "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="phone">Phone *</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          required
        />
      </div>
      <div>
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />
      </div>
      <div>
        <Label htmlFor="preferred_brands">Preferred Brands</Label>
        <Input
          id="preferred_brands"
          value={formData.preferred_brands}
          onChange={(e) => setFormData({ ...formData, preferred_brands: e.target.value })}
          placeholder="e.g., Dell, HP, Lenovo"
        />
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Input
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Customer preferences, issues, etc."
        />
      </div>
      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">
          {customer ? "Update Customer" : "Add Customer"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

function getStatusColor(status: string) {
  switch (status) {
    case "completed":
      return "bg-white text-black border-slate-300"
    case "pending":
      return "bg-slate-100 text-slate-800 border-slate-200"
    case "cancelled":
      return "bg-slate-100 text-slate-800 border-slate-200"
    default:
      return "bg-slate-100 text-slate-800 border-slate-200"
  }
}
