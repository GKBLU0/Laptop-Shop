"use client"

import { useState } from "react"
import { type AuthUser, AuthService } from "@/lib/auth"
import { DatabaseService } from "@/lib/database"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { InventoryTab } from "@/components/inventory-tab"
import { SalesTab } from "@/components/sales-tab"
import { CustomersTab } from "@/components/customers-tab"
import { ReportsTab } from "@/components/reports-tab"
import { AdvancedFeatures } from "@/components/advanced-features"
import { CartTab } from "@/components/cart-tab"
import { RepairTab } from "@/components/repair-tab"
import {
  Package,
  ShoppingCart,
  Users,
  AlertTriangle,
  DollarSign,
  LogOut,
  Shield,
  Undo,
  Redo,
  Database,
  CreditCard,
  Plus,
  HelpCircle,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useEffect } from "react"
import { ThemeToggle } from "@/components/theme-toggle"

interface DashboardProps {
  user: AuthUser
  onLogout: () => void
}

export function Dashboard({ user, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [refreshKey, setRefreshKey] = useState(0)
  const db = DatabaseService.getInstance()
  const [showDashboardHelp, setShowDashboardHelp] = useState(false)

  const [laptops, setLaptops] = useState(db.getLaptops())
  const [customers, setCustomers] = useState(db.getCustomers())
  const [sales, setSales] = useState(db.getSales())
  const [lowStockItems, setLowStockItems] = useState(db.getLowStockLaptops())
  const [totalProfit, setTotalProfit] = useState(db.calculateTotalProfit())
  const [totalInventoryValue, setTotalInventoryValue] = useState(
    laptops.reduce((sum, laptop) => sum + laptop.price * laptop.quantity, 0),
  )
  const [totalRevenue, setTotalRevenue] = useState(sales.reduce((sum, sale) => sum + sale.total_amount, 0))

  useEffect(() => {
    setLaptops(db.getLaptops())
    setCustomers(db.getCustomers())
    setSales(db.getSales())
    setLowStockItems(db.getLowStockLaptops())
    setTotalProfit(db.calculateTotalProfit())
    setTotalInventoryValue(laptops.reduce((sum, laptop) => sum + laptop.price * laptop.quantity, 0))
    setTotalRevenue(sales.reduce((sum, sale) => sum + sale.total_amount, 0))
  }, [refreshKey, db, laptops, sales])

  const handleUndo = () => {
    const result = db.undo()
    if (result.success) {
      toast({
        title: "Operation Undone",
        description: result.message,
      })
      setRefreshKey((prev) => prev + 1)
    } else {
      toast({
        title: "Cannot Undo",
        description: result.message,
        variant: "destructive",
      })
    }
  }

  const handleRedo = () => {
    const result = db.redo()
    if (result.success) {
      toast({
        title: "Operation Redone",
        description: result.message,
      })
      setRefreshKey((prev) => prev + 1)
    } else {
      toast({
        title: "Cannot Redo",
        description: result.message,
        variant: "destructive",
      })
    }
  }

  const handleGenerateDummyData = () => {
    const result = db.generateDummyData()
    if (result.success) {
      toast({
        title: "Dummy Data Generated",
        description: result.message,
      })
      setRefreshKey((prev) => prev + 1)
    } else {
      toast({
        title: "Generation Failed",
        description: result.message,
        variant: "destructive",
      })
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-primary text-primary-foreground border-primary"
      case "manager":
        return "bg-secondary text-secondary-foreground border-secondary"
      case "worker":
        return "bg-muted text-muted-foreground border-border"
      default:
        return "bg-muted text-muted-foreground border-border"
    }
  }

  return (
    <div className="min-h-screen bg-background" key={refreshKey}>
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-foreground">Zanzibar</h1>
            <Badge className={`${getRoleColor(user.role)} font-medium`}>
              <Shield className="w-3 h-3 mr-1" />
              {user.role.toUpperCase()}
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {user.role === "admin" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateDummyData}
                  className="bg-background hover:bg-accent border-border text-foreground"
                  title="Generate comprehensive dummy data for testing. This will create sample laptops, customers, and sales data to populate the system. Only available for admin users."
                >
                  <Database className="w-4 h-4 mr-2" />
                  Generate Data
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleUndo}
                disabled={!db.canUndo()}
                className="bg-background hover:bg-accent border-border text-foreground"
                title={db.canUndo() ? `Undo: ${db.getUndoDescription()}` : "No operations to undo"}
              >
                <Undo className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRedo}
                disabled={!db.canRedo()}
                className="bg-background hover:bg-accent border-border text-foreground"
                title={db.canRedo() ? `Redo: ${db.getRedoDescription()}` : "No operations to redo"}
              >
                <Redo className="w-4 h-4" />
              </Button>
              <ThemeToggle />
            </div>
            <span className="text-sm text-foreground">Welcome, {user.username}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={onLogout}
              className="bg-background hover:bg-accent border-border text-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 bg-card border border-border p-1">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-accent text-foreground"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="inventory"
              disabled={!AuthService.canAccess("inventory")}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-accent text-foreground"
            >
              Inventory
            </TabsTrigger>
            <TabsTrigger
              value="sales"
              disabled={!AuthService.canAccess("sales")}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-accent text-foreground"
            >
              Sales
            </TabsTrigger>
            <TabsTrigger
              value="customers"
              disabled={!AuthService.canAccess("customers")}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-accent text-foreground"
            >
              Customers
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              disabled={!AuthService.canAccess("reports")}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-accent text-foreground"
            >
              Reports
            </TabsTrigger>
            <TabsTrigger
              value="advanced"
              disabled={!AuthService.canAccess("reports")}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-accent text-foreground"
            >
              Advanced
            </TabsTrigger>
            <TabsTrigger
              value="cart"
              disabled={!AuthService.canAccess("sales")}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-accent text-foreground"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Cart
            </TabsTrigger>
            <TabsTrigger
              value="repair"
              disabled={!AuthService.canAccess("repair")}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground hover:bg-accent text-foreground"
            >
              Repair
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Dashboard Help Section */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Dashboard Overview</h2>
                <p className="text-muted-foreground">Monitor your business performance and key metrics</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDashboardHelp(!showDashboardHelp)}
                className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <HelpCircle className="h-4 w-4" />
                {showDashboardHelp ? 'Hide Help' : 'Show Help'}
              </Button>
            </div>
            
            {showDashboardHelp && (
              <Card className="bg-blue-50 border-blue-200 animate-in slide-in-from-top-2 duration-200">
                <CardContent className="pt-6">
                  <div className="text-sm">
                    <h4 className="font-semibold text-blue-800 mb-3">📊 Dashboard Features Guide:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-blue-700 mb-2">📈 Key Metrics</h5>
                        <ul className="list-disc list-inside space-y-1 text-blue-600">
                          <li>Total Inventory: Current stock count and value</li>
                          <li>Total Sales: Revenue generated from sales</li>
                          <li>Total Profit: Net profit after costs</li>
                          <li>Low Stock Alerts: Items needing restocking</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium text-blue-700 mb-2">🔧 Quick Actions</h5>
                        <ul className="list-disc list-inside space-y-1 text-blue-600">
                          <li>Generate Data: Create sample data for testing</li>
                          <li>Undo/Redo: Reverse or repeat recent actions</li>
                          <li>Theme Toggle: Switch between light/dark modes</li>
                          <li>Tab Navigation: Access different business areas</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-card border border-border hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Inventory</CardTitle>
                  <Package className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">
                    {laptops.reduce((sum, laptop) => sum + laptop.quantity, 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">${totalInventoryValue.toLocaleString()} value</p>
                </CardContent>
              </Card>

              <Card className="bg-card border border-border hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales</CardTitle>
                  <ShoppingCart className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{sales.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">${totalRevenue.toLocaleString()} revenue</p>
                </CardContent>
              </Card>

              <Card className="bg-card border border-border hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Customers</CardTitle>
                  <Users className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{customers.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">Active customers</p>
                </CardContent>
              </Card>

              <Card className="bg-card border border-border hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Profit</CardTitle>
                  <DollarSign className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">${totalProfit.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">Gross profit</p>
                </CardContent>
              </Card>
            </div>

            {lowStockItems.length > 0 && (
              <Card className="border-border bg-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-foreground">
                      <AlertTriangle className="h-5 w-5 text-primary" />
                      Low Stock Alert
                    </CardTitle>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-card border-border text-muted-foreground hover:bg-accent"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription className="text-muted-foreground">
                    {lowStockItems.length} items are running low on stock
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {lowStockItems.slice(0, 3).map((laptop) => (
                      <div key={laptop.id} className="flex justify-between items-center py-2">
                        <span className="font-medium text-foreground">
                          {laptop.brand} {laptop.model}
                        </span>
                                                  <Badge variant="outline" className="text-muted-foreground border-border bg-muted">
                          {laptop.quantity} left
                        </Badge>
                      </div>
                    ))}
                    {lowStockItems.length > 3 && (
                                    <div className="pt-2 border-t border-border">
                <p className="text-sm text-muted-foreground font-medium">+{lowStockItems.length - 3} more items</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="cart">
            <CartTab user={user} key={refreshKey} onRefresh={() => setRefreshKey((prev) => prev + 1)} />
          </TabsContent>

          <TabsContent value="inventory">
            <InventoryTab key={refreshKey} onRefresh={() => setRefreshKey((prev) => prev + 1)} />
          </TabsContent>

          <TabsContent value="sales">
            <SalesTab />
          </TabsContent>

          <TabsContent value="customers">
            <CustomersTab onRefresh={() => setRefreshKey((prev) => prev + 1)} />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsTab />
          </TabsContent>

          <TabsContent value="advanced">
            <AdvancedFeatures onRefresh={() => setRefreshKey((prev) => prev + 1)} />
          </TabsContent>
          <TabsContent value="repair">
            <RepairTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
