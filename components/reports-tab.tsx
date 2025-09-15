"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { DatabaseService } from "@/lib/database"
import { AuthService } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Download, TrendingUp, DollarSign, Package, BarChart3, FileText, HelpCircle } from "lucide-react"
import jsPDF from "jspdf"

type ReportPeriod = "daily" | "weekly" | "monthly" | "yearly"

export function ReportsTab() {
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>("monthly")
  
  // Persist active tab in localStorage to prevent reset on re-render
  const [activeTab, setActiveTab] = useState("overview")
  
  // Get current user role for permission checking (must be before any usage)
  const currentUser = AuthService.getCurrentUser()
  const isWorker = currentUser?.role === "worker"
  const isManager = currentUser?.role === "manager"
  const isAdmin = currentUser?.role === "admin"
  
  // Load persisted tab from localStorage after component mounts
  useEffect(() => {
    const storedTab = localStorage.getItem("reports-active-tab")
    if (storedTab && storedTab !== "overview") {
      setActiveTab(storedTab)
    }
  }, [])
  
  // Persist tab changes to localStorage and prevent reset to overview
  useEffect(() => {
    if (activeTab && activeTab !== "overview") {
      localStorage.setItem("reports-active-tab", activeTab)
    }
  }, [activeTab])
  
  // Prevent activeTab from being reset to "overview" unless explicitly changed
  useEffect(() => {
    const storedTab = localStorage.getItem("reports-active-tab")
    if (storedTab && storedTab !== "overview" && activeTab === "overview") {
      setActiveTab(storedTab)
    }
  }, [activeTab])
  
  // Redirect workers away from financial tab if they somehow access it
  useEffect(() => {
    if (isWorker && activeTab === "financial") {
      setActiveTab("overview")
      localStorage.setItem("reports-active-tab", "overview")
    }
  }, [isWorker, activeTab])

  const db = DatabaseService.getInstance()
  const sales = db.getSales()
  const laptops = db.getLaptops()
  const customers = db.getCustomers()
  const lowStockItems = db.getLowStockLaptops()
  
  // Roles already initialized above
  
  // Handle tab change and persist to localStorage
  const handleTabChange = useCallback((value: string) => {
    console.log("Tab changing from", activeTab, "to", value)
    setActiveTab(value)
    if (typeof window !== "undefined") {
      localStorage.setItem("reports-active-tab", value)
    }
  }, [activeTab])
  
  // Debug: Log when component re-renders
  console.log("ReportsTab re-render, activeTab:", activeTab, "stored:", localStorage.getItem("reports-active-tab"))
  
  // Memoize the database data to prevent unnecessary recalculations
  const memoizedData = useMemo(() => ({
    sales,
    laptops,
    customers,
    lowStockItems
  }), [sales.length, laptops.length, customers.length, lowStockItems.length])

  const timeBasedData = useMemo(() => {
    const now = new Date()
    const periods: { label: string; start: Date; end: Date }[] = []

    for (let i = 11; i >= 0; i--) {
      const start = new Date(now)
      const end = new Date(now)

      switch (selectedPeriod) {
        case "daily":
          start.setDate(now.getDate() - i)
          end.setDate(now.getDate() - i)
          start.setHours(0, 0, 0, 0)
          end.setHours(23, 59, 59, 999)
          periods.push({
            label: start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            start,
            end,
          })
          break
        case "weekly":
          const weekStart = new Date(now)
          weekStart.setDate(now.getDate() - now.getDay() - i * 7)
          const weekEnd = new Date(weekStart)
          weekEnd.setDate(weekStart.getDate() + 6)
          periods.push({
            label: `Week ${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
            start: weekStart,
            end: weekEnd,
          })
          break
        case "monthly":
          start.setMonth(now.getMonth() - i)
          start.setDate(1)
          start.setHours(0, 0, 0, 0)
          end.setMonth(now.getMonth() - i + 1)
          end.setDate(0)
          end.setHours(23, 59, 59, 999)
          periods.push({
            label: start.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
            start,
            end,
          })
          break
        case "yearly":
          start.setFullYear(now.getFullYear() - i)
          start.setMonth(0, 1)
          start.setHours(0, 0, 0, 0)
          end.setFullYear(now.getFullYear() - i)
          end.setMonth(11, 31)
          end.setHours(23, 59, 59, 999)
          periods.push({
            label: start.getFullYear().toString(),
            start,
            end,
          })
          break
      }
    }

    return periods.map((period) => {
      const periodSales = sales.filter((sale) => {
        const saleDate = new Date(sale.sale_date)
        return saleDate >= period.start && saleDate <= period.end
      })

      const revenue = periodSales.reduce((sum, sale) => sum + sale.total_amount, 0)
      const profit = periodSales.reduce((sum, sale) => {
        const laptop = laptops.find((l) => l.id === sale.laptop_id)
        return sum + (laptop ? (sale.unit_price - laptop.cost) * sale.quantity : 0)
      }, 0)

      return {
        period: period.label,
        sales: periodSales.length,
        revenue,
        profit,
        avgOrderValue: periodSales.length > 0 ? revenue / periodSales.length : 0,
      }
    })
  }, [selectedPeriod, sales, laptops])

  const brandPerformance = useMemo(() => {
    const brandStats = laptops.reduce(
      (acc, laptop) => {
        const laptopSales = sales.filter((sale) => sale.laptop_id === laptop.id)
        const revenue = laptopSales.reduce((sum, sale) => sum + sale.total_amount, 0)
        const profit = laptopSales.reduce((sum, sale) => sum + (sale.unit_price - laptop.cost) * sale.quantity, 0)
        const unitsSold = laptopSales.reduce((sum, sale) => sum + sale.quantity, 0)

        if (!acc[laptop.brand]) {
          acc[laptop.brand] = { revenue: 0, profit: 0, unitsSold: 0, models: 0 }
        }

        acc[laptop.brand].revenue += revenue
        acc[laptop.brand].profit += profit
        acc[laptop.brand].unitsSold += unitsSold
        acc[laptop.brand].models += 1

        return acc
      },
      {} as Record<string, { revenue: number; profit: number; unitsSold: number; models: number }>,
    )

    return Object.entries(brandStats)
      .map(([brand, stats]) => ({
        brand,
        ...stats,
        profitMargin: stats.revenue > 0 ? (stats.profit / stats.revenue) * 100 : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
  }, [laptops, sales])

  const categoryPerformance = useMemo(() => {
    const categoryStats = laptops.reduce(
      (acc, laptop) => {
        const laptopSales = sales.filter((sale) => sale.laptop_id === laptop.id)
        const revenue = laptopSales.reduce((sum, sale) => sum + sale.total_amount, 0)
        const unitsSold = laptopSales.reduce((sum, sale) => sum + sale.quantity, 0)

        if (!acc[laptop.category]) {
          acc[laptop.category] = { revenue: 0, unitsSold: 0 }
        }

        acc[laptop.category].revenue += revenue
        acc[laptop.category].unitsSold += unitsSold

        return acc
      },
      {} as Record<string, { revenue: number; unitsSold: number }>,
    )

    return Object.entries(categoryStats).map(([category, stats]) => ({
      name: category,
      value: stats.revenue,
      units: stats.unitsSold,
    }))
  }, [laptops, sales])

  const topProducts = useMemo(() => {
    return laptops
      .map((laptop) => {
        const laptopSales = sales.filter((sale) => sale.laptop_id === laptop.id)
        const revenue = laptopSales.reduce((sum, sale) => sum + sale.total_amount, 0)
        const profit = laptopSales.reduce((sum, sale) => sum + (sale.unit_price - laptop.cost) * sale.quantity, 0)
        const unitsSold = laptopSales.reduce((sum, sale) => sum + sale.quantity, 0)

        return {
          ...laptop,
          revenue,
          profit,
          unitsSold,
          profitMargin: revenue > 0 ? (profit / revenue) * 100 : 0,
        }
      })
      .filter((product) => product.unitsSold > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)
  }, [laptops, sales])

  const customerAnalytics = useMemo(() => {
    const customerStats = customers.map((customer) => {
      const customerSales = sales.filter((sale) => sale.customer_id === customer.id)
      const totalSpent = customerSales.reduce((sum, sale) => sum + sale.total_amount, 0)
      const totalPurchases = customerSales.length

      let tier = "Bronze"
      if (totalSpent > 10000) tier = "Platinum"
      else if (totalSpent > 5000) tier = "Gold"
      else if (totalSpent > 2000) tier = "Silver"

      return {
        ...customer,
        totalSpent,
        totalPurchases,
        tier,
        avgOrderValue: totalPurchases > 0 ? totalSpent / totalPurchases : 0,
      }
    })

    const tierDistribution = customerStats.reduce(
      (acc, customer) => {
        acc[customer.tier] = (acc[customer.tier] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return {
      topCustomers: customerStats.sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 10),
      tierDistribution: Object.entries(tierDistribution).map(([tier, count]) => ({
        name: tier,
        value: count,
      })),
    }
  }, [customers, sales])

  const exportReport = (reportType: string) => {
    let data: any[] = []
    let filename = ""

    switch (reportType) {
      case "sales":
        data = timeBasedData
        filename = `sales_report_${selectedPeriod}_${new Date().toISOString().split("T")[0]}.csv`
        break
      case "inventory":
        data = laptops.map((laptop) => ({
          brand: laptop.brand,
          model: laptop.model,
          quantity: laptop.quantity,
          price: laptop.price,
          cost: laptop.cost,
          profit_margin: db.calculateProfitMargin(laptop.id),
          low_stock: laptop.quantity <= laptop.low_stock_threshold,
        }))
        filename = `inventory_report_${new Date().toISOString().split("T")[0]}.csv`
        break
      case "customers":
        data = customerAnalytics.topCustomers
        filename = `customer_report_${new Date().toISOString().split("T")[0]}.csv`
        break
    }

    if (data.length === 0) return

    const headers = Object.keys(data[0])
    const csvContent = [
      headers.join(","),
      ...data.map((row) => headers.map((header) => `"${row[header]}"`).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const exportToPDF = (reportType: string) => {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height
    let yPosition = 20
    let xPosition = 20

    doc.setFontSize(20)
    doc.setFont("helvetica", "bold")
    doc.text("Zanzibar Laptop Shop", pageWidth / 2, yPosition, { align: "center" })
    yPosition += 10

    doc.setFontSize(16)
    doc.setFont("helvetica", "normal")
    const reportTitle = reportType.charAt(0).toUpperCase() + reportType.slice(1) + " Report"
    doc.text(reportTitle, pageWidth / 2, yPosition, { align: "center" })
    yPosition += 5

    doc.setFontSize(10)
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: "center" })
    yPosition += 15

    doc.setLineWidth(0.5)
    doc.line(20, yPosition, pageWidth - 20, yPosition)
    yPosition += 10

    switch (reportType) {
      case "sales":
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text("Sales Summary", 20, yPosition)
        yPosition += 10

        const totalRevenue = timeBasedData.reduce((sum, period) => sum + period.revenue, 0)
        const totalProfit = timeBasedData.reduce((sum, period) => sum + period.profit, 0)
        const totalSales = timeBasedData.reduce((sum, period) => sum + period.sales, 0)

        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        doc.text(`Total Revenue: $${totalRevenue.toLocaleString()}`, 20, yPosition)
        yPosition += 6
        doc.text(`Total Profit: $${totalProfit.toLocaleString()}`, 20, yPosition)
        yPosition += 6
        doc.text(`Total Sales: ${totalSales}`, 20, yPosition)
        yPosition += 6
        doc.text(`Period: ${selectedPeriod} (Last 12 periods)`, 20, yPosition)
        yPosition += 15

        doc.setFontSize(12)
        doc.setFont("helvetica", "bold")
        doc.text("Sales by Period", 20, yPosition)
        yPosition += 8

        doc.setFontSize(9)
        doc.setFont("helvetica", "bold")
        const headers = ["Period", "Sales", "Revenue", "Profit", "Avg Order"]
        const colWidths = [40, 25, 35, 35, 35]
        xPosition = 20

        headers.forEach((header, index) => {
          doc.text(header, xPosition, yPosition)
          xPosition += colWidths[index]
        })
        yPosition += 5

        doc.setFont("helvetica", "normal")
        timeBasedData.forEach((period) => {
          if (yPosition > pageHeight - 30) {
            doc.addPage()
            yPosition = 20
          }

          xPosition = 20
          const rowData = [
            period.period,
            period.sales.toString(),
            `$${period.revenue.toLocaleString()}`,
            `$${period.profit.toLocaleString()}`,
            `$${period.avgOrderValue.toLocaleString()}`,
          ]

          rowData.forEach((data, index) => {
            doc.text(data, xPosition, yPosition)
            xPosition += colWidths[index]
          })
          yPosition += 5
        })
        break

      case "inventory":
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text("Inventory Summary", 20, yPosition)
        yPosition += 10

        const totalInventoryValue = laptops.reduce((sum, laptop) => sum + laptop.price * laptop.quantity, 0)
        const lowStockCount = lowStockItems.length
        const outOfStockCount = laptops.filter((laptop) => laptop.quantity === 0).length

        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        doc.text(`Total Inventory Value: $${totalInventoryValue.toLocaleString()}`, 20, yPosition)
        yPosition += 6
        doc.text(`Low Stock Items: ${lowStockCount}`, 20, yPosition)
        yPosition += 6
        doc.text(`Out of Stock Items: ${outOfStockCount}`, 20, yPosition)
        yPosition += 15

        doc.setFontSize(12)
        doc.setFont("helvetica", "bold")
        doc.text("Current Inventory", 20, yPosition)
        yPosition += 8

        doc.setFontSize(8)
        doc.setFont("helvetica", "bold")
        const invHeaders = ["Brand", "Model", "Qty", "Price", "Value", "Status"]
        const invColWidths = [25, 40, 15, 25, 30, 25]
        xPosition = 20

        invHeaders.forEach((header, index) => {
          doc.text(header, xPosition, yPosition)
          xPosition += invColWidths[index]
        })
        yPosition += 5

        doc.setFont("helvetica", "normal")
        laptops.forEach((laptop) => {
          if (yPosition > pageHeight - 30) {
            doc.addPage()
            yPosition = 20
          }

          xPosition = 20
          const status = laptop.quantity === 0 ? "Out" : laptop.quantity <= laptop.low_stock_threshold ? "Low" : "OK"
          const rowData = [
            laptop.brand,
            laptop.model.substring(0, 20),
            laptop.quantity.toString(),
            `$${laptop.price.toLocaleString()}`,
            `$${(laptop.price * laptop.quantity).toLocaleString()}`,
            status,
          ]

          rowData.forEach((data, index) => {
            doc.text(data, xPosition, yPosition)
            xPosition += invColWidths[index]
          })
          yPosition += 5
        })
        break

      case "customers":
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text("Customer Analytics", 20, yPosition)
        yPosition += 10

        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        doc.text(`Total Customers: ${customers.length}`, 20, yPosition)
        yPosition += 6

        customerAnalytics.tierDistribution.forEach((tier) => {
          doc.text(`${tier.name} Tier: ${tier.value} customers`, 20, yPosition)
          yPosition += 6
        })
        yPosition += 10

        doc.setFontSize(12)
        doc.setFont("helvetica", "bold")
        doc.text("Top Customers", 20, yPosition)
        yPosition += 8

        doc.setFontSize(9)
        doc.setFont("helvetica", "bold")
        const custHeaders = ["Name", "Email", "Purchases", "Total Spent", "Tier"]
        const custColWidths = [35, 45, 20, 30, 20]
        xPosition = 20

        custHeaders.forEach((header, index) => {
          doc.text(header, xPosition, yPosition)
          xPosition += custColWidths[index]
        })
        yPosition += 5

        doc.setFont("helvetica", "normal")
        customerAnalytics.topCustomers.slice(0, 15).forEach((customer) => {
          if (yPosition > pageHeight - 30) {
            doc.addPage()
            yPosition = 20
          }

          xPosition = 20
          const rowData = [
            customer.name.substring(0, 15),
            customer.email.substring(0, 20),
            customer.totalPurchases.toString(),
            `$${customer.totalSpent.toLocaleString()}`,
            customer.tier,
          ]

          rowData.forEach((data, index) => {
            doc.text(data, xPosition, yPosition)
            xPosition += custColWidths[index]
          })
          yPosition += 5
        })
        break
    }

    const filename = `${reportType}_report_${selectedPeriod}_${new Date().toISOString().split("T")[0]}.pdf`
    doc.save(filename)
  }

  const SimpleBarChart = ({ data, dataKey, title }: { data: any[]; dataKey: string; title: string }) => {
    const maxValue = Math.max(...data.map((item) => item[dataKey]))

    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
        {data.map((item, index) => (
          <div key={index} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>{item.period || item.brand || item.name}</span>
              <span className="font-medium">
                {(typeof item[dataKey] === "number" && dataKey.includes("revenue")) ||
                dataKey.includes("profit") ||
                dataKey.includes("value")
                  ? `$${item[dataKey].toLocaleString()}`
                  : item[dataKey]}
              </span>
            </div>
            <Progress value={(item[dataKey] / maxValue) * 100} className="h-2" />
          </div>
        ))}
      </div>
    )
  }

  const SimplePieChart = ({ data, title }: { data: any[]; title: string }) => {
    const total = data.reduce((sum, item) => sum + item.value, 0)

    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
        {data.map((item, index) => {
          const percentage = total > 0 ? (item.value / total) * 100 : 0
          return (
            <div key={index} className="flex justify-between items-center">
              <span className="text-sm">{item.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{percentage.toFixed(1)}%</span>
                <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${percentage}%` }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const [showReportsHelp, setShowReportsHelp] = useState(false)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Business Reports</CardTitle>
              <CardDescription>Comprehensive analytics and reporting dashboard</CardDescription>
            </div>
            <Select value={selectedPeriod} onValueChange={(value: ReportPeriod) => setSelectedPeriod(value)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly" className="bg-muted text-foreground font-medium">
                  Monthly
                </SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
                    <TabsList className={`grid w-full ${isWorker ? 'grid-cols-4' : 'grid-cols-5'} bg-muted border border-border`}>
          <TabsTrigger value="overview" className="data-[state=active]:bg-black data-[state=active]:text-white">
            Overview
          </TabsTrigger>
          <TabsTrigger value="sales" className="data-[state=active]:bg-black data-[state=active]:text-white">
            Sales
          </TabsTrigger>
          <TabsTrigger value="inventory" className="data-[state=active]:bg-black data-[state=active]:text-white">
            Inventory
          </TabsTrigger>
          <TabsTrigger value="customers" className="data-[state=active]:bg-black data-[state=active]:text-white">
            Customers
          </TabsTrigger>
          {!isWorker && (
            <TabsTrigger value="financial" className="data-[state=active]:bg-black data-[state=active]:text-white">
              Financial
            </TabsTrigger>
          )}
        </TabsList>

        {/* Reports Help Section */}
        <div className="flex items-center justify-between mt-4">
          <div>
            <h2 className="text-2xl font-bold">Business Reports</h2>
            <p className="text-muted-foreground">Comprehensive analytics and insights for business decision making</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReportsHelp(!showReportsHelp)}
            className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <HelpCircle className="h-4 w-4" />
            {showReportsHelp ? 'Hide Help' : 'Show Help'}
          </Button>
        </div>
        
        {showReportsHelp && (
          <Card className="bg-blue-50 border-blue-200 animate-in slide-in-from-top-2 duration-200">
            <CardContent className="pt-6">
              <div className="text-sm">
                <h4 className="font-semibold text-blue-800 mb-3">📊 Reports & Analytics Guide:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-blue-700 mb-2">📈 Report Types</h5>
                    <ul className="list-disc list-inside space-y-1 text-blue-600">
                      <li>Overview: Key business metrics and trends</li>
                      <li>Sales: Revenue analysis and performance</li>
                      <li>Inventory: Stock levels and product performance</li>
                      <li>Customers: Customer behavior and value analysis</li>
                      <li>Financial: Detailed profit and loss (Managers+)</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-blue-700 mb-2">🔧 Features</h5>
                    <ul className="list-disc list-inside space-y-1 text-blue-600">
                      <li>Time-based filtering (daily/weekly/monthly/yearly)</li>
                      <li>Export reports to CSV format</li>
                      <li>Interactive charts and visualizations</li>
                      <li>Role-based access control</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <TabsContent value="overview" className="space-y-6">
          {isWorker && (
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Reports Overview</h3>
                <p className="text-sm text-muted-foreground">Limited access for workers - Financial data hidden</p>
              </div>
              <Badge variant="outline">Worker Mode - Limited Access</Badge>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-border bg-muted">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  ${timeBasedData.reduce((sum, period) => sum + period.revenue, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Last 12 {selectedPeriod.slice(0, -2)} periods</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-muted">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Total Profit</CardTitle>
                <TrendingUp className="h-4 w-4 text-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  ${timeBasedData.reduce((sum, period) => sum + period.profit, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Gross profit</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-muted">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Units Sold</CardTitle>
                <Package className="h-4 w-4 text-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {timeBasedData.reduce((sum, period) => sum + period.sales, 0)}
                </div>
                <p className="text-xs text-muted-foreground">Total transactions</p>
              </CardContent>
            </Card>

            <Card className="border-border bg-muted">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Avg Order Value</CardTitle>
                <BarChart3 className="h-4 w-4 text-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  $
                  {(
                    timeBasedData.reduce((sum, period) => sum + period.avgOrderValue, 0) / timeBasedData.length
                  ).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Average per transaction</p>
              </CardContent>
            </Card>
          </div>

          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Revenue Trend</CardTitle>
              <CardDescription>Revenue and profit over time</CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleBarChart data={timeBasedData} dataKey="revenue" title="Revenue by Period" />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sales by Category</CardTitle>
                <CardDescription>Revenue distribution across product categories</CardDescription>
              </CardHeader>
              <CardContent>
                <SimplePieChart data={categoryPerformance} title="Category Performance" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Brand Performance</CardTitle>
                <CardDescription>Top performing brands by revenue</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleBarChart data={brandPerformance.slice(0, 5)} dataKey="revenue" title="Brand Revenue" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          {isWorker && (
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Sales Reports</h3>
                <p className="text-sm text-muted-foreground">View-only access for workers</p>
              </div>
              <Badge variant="outline">Worker Mode - View Only</Badge>
            </div>
          )}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Sales Analytics</h3>
            <div className="flex gap-2">
              <Button 
                onClick={() => exportReport("sales")} 
                variant="outline"
                title="Export sales analytics data to CSV. File will be downloaded to your Downloads folder."
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={() => exportToPDF("sales")} variant="default">
                <FileText className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sales Performance</CardTitle>
              <CardDescription>Number of sales and revenue over time</CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleBarChart data={timeBasedData} dataKey="sales" title="Sales by Period" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Performing Products</CardTitle>
              <CardDescription>Best selling products by revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Units Sold</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Profit</TableHead>
                    <TableHead>Margin %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">
                        {product.brand} {product.model}
                      </TableCell>
                      <TableCell>{product.unitsSold}</TableCell>
                      <TableCell>${product.revenue.toLocaleString()}</TableCell>
                                              <TableCell className="text-foreground">${product.profit.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            product.profitMargin >= 30
                              ? "default"
                              : product.profitMargin >= 20
                                ? "secondary"
                                : "destructive"
                          }
                          className={
                            product.profitMargin >= 30
                              ? "bg-card text-foreground border-border"
                              : product.profitMargin >= 20
                                ? "bg-muted text-muted-foreground"
                                : "bg-muted text-muted-foreground"
                          }
                        >
                          {product.profitMargin.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          {isWorker && (
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Inventory Reports</h3>
                <p className="text-sm text-muted-foreground">View-only access for workers</p>
              </div>
              <Badge variant="outline">Worker Mode - View Only</Badge>
            </div>
          )}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Inventory Analytics</h3>
            <div className="flex gap-2">
              <Button 
                onClick={() => exportReport("inventory")} 
                variant="outline"
                title="Export inventory analytics data to CSV. File will be downloaded to your Downloads folder."
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={() => exportToPDF("inventory")} variant="default">
                <FileText className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-border bg-muted">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-foreground">Total Inventory Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  ${laptops.reduce((sum, laptop) => sum + laptop.price * laptop.quantity, 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-muted">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-foreground">Low Stock Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{lowStockItems.length}</div>
              </CardContent>
            </Card>

            <Card className="border-border bg-muted">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-foreground">Out of Stock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {laptops.filter((laptop) => laptop.quantity === 0).length}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Stock Levels by Category</CardTitle>
              <CardDescription>Current inventory levels across categories</CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleBarChart
                data={[...new Set(laptops.map((l) => l.category))].map((category) => ({
                  name: category,
                  quantity: laptops.filter((l) => l.category === category).reduce((sum, l) => sum + l.quantity, 0),
                }))}
                dataKey="quantity"
                title="Stock by Category"
              />
            </CardContent>
          </Card>

          {lowStockItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Restock Recommendations</CardTitle>
                <CardDescription>Items that need immediate attention</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Current Stock</TableHead>
                      <TableHead>Threshold</TableHead>
                      <TableHead>Suggested Restock</TableHead>
                      <TableHead>Estimated Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowStockItems.map((laptop) => {
                      const suggestedQuantity = Math.max(laptop.low_stock_threshold * 2, 10)
                      const estimatedCost = suggestedQuantity * laptop.cost

                      return (
                        <TableRow key={laptop.id}>
                          <TableCell className="font-medium">
                            {laptop.brand} {laptop.model}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={laptop.quantity === 0 ? "destructive" : "secondary"}
                              className={
                                laptop.quantity === 0
                                  ? "bg-destructive/10 text-destructive border-destructive/20"
                                  : "bg-card text-foreground border-border"
                              }
                            >
                              {laptop.quantity}
                            </Badge>
                          </TableCell>
                          <TableCell>{laptop.low_stock_threshold}</TableCell>
                          <TableCell>{suggestedQuantity}</TableCell>
                          <TableCell>${estimatedCost.toLocaleString()}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          {isWorker && (
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Customer Reports</h3>
                <p className="text-sm text-muted-foreground">View-only access for workers</p>
              </div>
              <Badge variant="outline">Worker Mode - View Only</Badge>
            </div>
          )}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Customer Analytics</h3>
            <div className="flex gap-2">
              <Button 
                onClick={() => exportReport("customers")} 
                variant="outline"
                title="Export customer analytics data to CSV. File will be downloaded to your Downloads folder."
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={() => exportToPDF("customers")} variant="default">
                <FileText className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Tiers</CardTitle>
                <CardDescription>Distribution of customers by value tier</CardDescription>
              </CardHeader>
              <CardContent>
                <SimplePieChart data={customerAnalytics.tierDistribution} title="Customer Tier Distribution" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Customers</CardTitle>
                <CardDescription>Highest value customers by total spending</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {customerAnalytics.topCustomers.slice(0, 5).map((customer, index) => (
                    <div key={customer.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-muted-foreground">{customer.totalPurchases} purchases</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${customer.totalSpent.toLocaleString()}</p>
                        <Badge
                          variant={
                            customer.tier === "Platinum"
                              ? "default"
                              : customer.tier === "Gold"
                                ? "secondary"
                                : "outline"
                          }
                          className={
                            customer.tier === "Platinum"
                              ? "bg-white text-black border-slate-300"
                              : customer.tier === "Gold"
                                ? "bg-slate-100 text-slate-800"
                                : "bg-slate-100 text-slate-800 border-slate-200"
                          }
                        >
                          {customer.tier}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Financial Reports</h3>
            <div className="flex gap-2">
              <Button 
                onClick={() => exportReport("financial")} 
                variant="outline"
                title="Export financial analytics data to CSV. File will be downloaded to your Downloads folder."
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={() => exportToPDF("sales")} variant="default">
                <FileText className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Profit Analysis</CardTitle>
              <CardDescription>Revenue vs profit margins over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <SimpleBarChart data={timeBasedData} dataKey="revenue" title="Revenue by Period" />
                <SimpleBarChart data={timeBasedData} dataKey="profit" title="Profit by Period" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Brand Profitability</CardTitle>
              <CardDescription>Profit margins by brand</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Brand</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Profit</TableHead>
                    <TableHead>Margin %</TableHead>
                    <TableHead>Units Sold</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {brandPerformance.map((brand) => (
                    <TableRow key={brand.brand}>
                      <TableCell className="font-medium">{brand.brand}</TableCell>
                      <TableCell>${brand.revenue.toLocaleString()}</TableCell>
                                              <TableCell className="text-foreground">${brand.profit.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            brand.profitMargin >= 30
                              ? "default"
                              : brand.profitMargin >= 20
                                ? "secondary"
                                : "destructive"
                          }
                          className={
                            brand.profitMargin >= 30
                              ? "bg-white text-black border-slate-300"
                              : brand.profitMargin >= 20
                                ? "bg-slate-100 text-slate-800"
                                : "bg-slate-100 text-slate-800"
                          }
                        >
                          {brand.profitMargin.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>{brand.unitsSold}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
