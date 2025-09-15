"use client"

import type React from "react"

import { useState, useMemo, useRef } from "react"
import { DatabaseService, type Laptop } from "@/lib/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { ProtectedRoute } from "@/components/protected-route"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Papa from "papaparse"
import {
  Search,
  Download,
  Upload,
  Plus,
  Edit,
  AlertTriangle,
  TrendingUp,
  Package,
  DollarSign,
  ArrowUpDown,
  RefreshCw,
  Trash2,
  FileText,
  CheckCircle,
  XCircle,
  HelpCircle,
} from "lucide-react"
import { useEffect } from "react"

type SortField =
  | "brand"
  | "model"
  | "processor"
  | "ram"
  | "storage"
  | "graphics_card"
  | "screen_size"
  | "price"
  | "quantity"
  | "profit_margin"
  | "created_at"
type SortDirection = "asc" | "desc"

interface InventoryTabProps {
  onRefresh: () => void
}

export function InventoryTab({ onRefresh }: InventoryTabProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [brandFilter, setBrandFilter] = useState("all")
  const [stockFilter, setStockFilter] = useState("all")
  const [processorFilter, setProcessorFilter] = useState("all")
  const [ramFilter, setRamFilter] = useState("all")
  const [sortField, setSortField] = useState<SortField>("created_at")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingLaptop, setEditingLaptop] = useState<Laptop | null>(null)
  const [showRestockSuggestions, setShowRestockSuggestions] = useState(false)
  const [deletingLaptop, setDeletingLaptop] = useState<Laptop | null>(null)
  const [showImportDialog, setShowImportDialog] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importPreview, setImportPreview] = useState<any[]>([])
  const [importErrors, setImportErrors] = useState<string[]>([])
  const [importMode, setImportMode] = useState<"preview" | "confirm">("preview")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [previewLaptop, setPreviewLaptop] = useState<Laptop | null>(null)
  const [showImportSteps, setShowImportSteps] = useState(false)
  const [showImportHelp, setShowImportHelp] = useState(false)

  const getImageSrc = (laptop: Laptop): string => {
    const src = laptop.image_url?.trim()
    if (src) {
      // Absolute URL
      if (/^https?:\/\//i.test(src)) return src
      // Already rooted to public
      if (src.startsWith("/")) return src
      // Treat as a filename inside public/
      return `/${src}`
    }
    // Fallback to Unsplash using brand + model only
    return `https://source.unsplash.com/1280x960/?${encodeURIComponent(`${laptop.brand} ${laptop.model}`)}`
  }

  const ImagePreview = ({ laptop, resolver }: { laptop: Laptop; resolver: (l: Laptop) => string }) => {
    const [src, setSrc] = useState<string>(resolver(laptop))
    const [attempt, setAttempt] = useState<number>(0)

    // Reset when laptop changes
    useEffect(() => {
      setSrc(resolver(laptop))
      setAttempt(0)
    }, [laptop])

    const handleError = () => {
      // Attempt 0: use laptop.image_url or derived; Attempt 1: use Unsplash brand+model; Attempt 2: use local placeholder
      if (attempt === 0) {
        setSrc(`https://source.unsplash.com/1280x960/?${encodeURIComponent(`${laptop.brand} ${laptop.model}`)}`)
        setAttempt(1)
      } else if (attempt === 1) {
        setSrc(`/placeholder.jpg`)
        setAttempt(2)
      }
    }

    return (
      <div className="mt-4 space-y-3">
        <div className="w-full aspect-video bg-muted/30 rounded-md border overflow-hidden flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={`${laptop.brand} ${laptop.model}`}
            className="max-h-full w-auto object-contain"
            onError={handleError}
          />
        </div>
        <div className="text-right">
          <a href={src} target="_blank" rel="noreferrer" className="text-sm underline">
            Open original
          </a>
        </div>
      </div>
    )
  }

  const [laptops, setLaptops] = useState<Laptop[]>([])

  const loadLaptops = () => {
    setLaptops(DatabaseService.getInstance().getLaptops())
  }

  useEffect(() => {
    loadLaptops()
  }, [])

  const [newLaptop, setNewLaptop] = useState({
    brand: "",
    model: "",
    processor: "",
    ram: "",
    storage: "",
    graphics_card: "",
    screen_size: "",
    price: "",
    cost: "",
    quantity: "",
    category: "",
    supplier: "",
    low_stock_threshold: "5",
    description: "",
    warranty_months: "12",
    image_url: "",
  })

  const [editLaptop, setEditLaptop] = useState({
    brand: "",
    model: "",
    processor: "",
    ram: "",
    storage: "",
    graphics_card: "",
    screen_size: "",
    price: "",
    cost: "",
    quantity: "",
    category: "",
    supplier: "",
    low_stock_threshold: "5",
    description: "",
    warranty_months: "12",
    image_url: "",
  })

  const db = DatabaseService.getInstance()
  const lowStockItems = useMemo(() => {
    return db.getLowStockLaptops()
  }, [laptops])

  const categories = [...new Set(laptops.map((laptop) => laptop.category))]
  const brands = [...new Set(laptops.map((laptop) => laptop.brand))]
  const processors = [...new Set(laptops.map((laptop) => laptop.processor))]
  const rams = [...new Set(laptops.map((laptop) => laptop.ram))]

  const parseRamToNumber = (ramText: string): number => {
    const match = /([0-9]+)\s*GB/i.exec(ramText)
    return match ? Number(match[1]) : 0
  }

  const filteredAndSortedLaptops = useMemo(() => {
    const filtered = laptops.filter((laptop) => {
      const matchesSearch =
        laptop.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        laptop.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        laptop.processor.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesCategory = categoryFilter === "all" || laptop.category === categoryFilter
      const matchesBrand = brandFilter === "all" || laptop.brand === brandFilter
      const matchesProcessor = processorFilter === "all" || laptop.processor === processorFilter
      const matchesRam = ramFilter === "all" || laptop.ram === ramFilter

      let matchesStock = true
      if (stockFilter === "low") {
        matchesStock = laptop.quantity <= laptop.low_stock_threshold
      } else if (stockFilter === "out") {
        matchesStock = laptop.quantity === 0
      } else if (stockFilter === "in_stock") {
        matchesStock = laptop.quantity > laptop.low_stock_threshold
      }

      return (
        matchesSearch &&
        matchesCategory &&
        matchesBrand &&
        matchesProcessor &&
        matchesRam &&
        matchesStock
      )
    })

    filtered.sort((a, b) => {
      let aValue: any = (a as any)[sortField]
      let bValue: any = (b as any)[sortField]

      if (sortField === "profit_margin") {
        aValue = db.calculateProfitMargin(a.id)
        bValue = db.calculateProfitMargin(b.id)
      } else if (sortField === "ram") {
        aValue = parseRamToNumber(a.ram)
        bValue = parseRamToNumber(b.ram)
      }

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
  }, [
    laptops,
    searchTerm,
    categoryFilter,
    brandFilter,
    processorFilter,
    ramFilter,
    stockFilter,
    sortField,
    sortDirection,
    db,
  ])

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
      "Brand",
      "Model",
      "Processor",
      "RAM",
      "Storage",
      "Graphics",
      "Screen Size",
      "Price",
      "Cost",
      "Quantity",
      "Category",
      "Supplier",
      "Profit Margin %",
      "Low Stock Threshold",
    ]

    const csvData = filteredAndSortedLaptops.map((laptop) => [
      laptop.id,
      laptop.brand,
      laptop.model,
      laptop.processor,
      laptop.ram,
      laptop.storage,
      laptop.graphics_card,
      laptop.screen_size,
      laptop.price,
      laptop.cost,
      laptop.quantity,
      laptop.category,
      laptop.supplier,
      db.calculateProfitMargin(laptop.id).toFixed(2),
      laptop.low_stock_threshold,
    ])

    const csvContent = [headers, ...csvData].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `inventory_${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getStockStatus = (laptop: Laptop) => {
    if (laptop.quantity === 0) {
      return { label: "Out of Stock", color: "bg-gray-100 text-gray-700" }
    } else if (laptop.quantity <= laptop.low_stock_threshold) {
      return { label: "Low Stock", color: "bg-blue-50 text-blue-700" }
    } else {
      return { label: "In Stock", color: "bg-card text-foreground border border-border" }
    }
  }

  const getProfitMarginColor = (margin: number) => {
    if (margin >= 30) return "text-gray-900"
    if (margin >= 20) return "text-gray-700"
    return "text-gray-500"
  }

  const generateRestockSuggestions = () => {
    return lowStockItems.map((laptop) => {
      const avgMonthlySales = 2 // Mock calculation - would be based on sales history
      const suggestedQuantity = Math.max(laptop.low_stock_threshold * 2, avgMonthlySales * 3)
      const totalCost = suggestedQuantity * laptop.cost

      return {
        laptop,
        suggestedQuantity,
        totalCost,
        reason: laptop.quantity === 0 ? "Out of stock" : "Below threshold",
      }
    })
  }

  const handleAddLaptop = () => {
    const db = DatabaseService.getInstance()

    try {
      const laptopData = {
        ...newLaptop,
        price: Number.parseFloat(newLaptop.price),
        cost: Number.parseFloat(newLaptop.cost),
        quantity: Number.parseInt(newLaptop.quantity),
        low_stock_threshold: Number.parseInt(newLaptop.low_stock_threshold),
        warranty_months: Number.parseInt(newLaptop.warranty_months),
      }

      db.addLaptop(laptopData)
      loadLaptops() // Refresh laptops after adding
      onRefresh() // Trigger dashboard refresh

      setNewLaptop({
        brand: "",
        model: "",
        processor: "",
        ram: "",
        storage: "",
        graphics_card: "",
        screen_size: "",
        price: "",
        cost: "",
        quantity: "",
        category: "",
        supplier: "",
        low_stock_threshold: "5",
        description: "",
        warranty_months: "12",
        image_url: "",
      })

      setShowAddDialog(false)
    } catch (error) {
      console.error("Error adding laptop:", error)
    }
  }

  const handleEditLaptop = () => {
    if (!editingLaptop) return

    const db = DatabaseService.getInstance()

    try {
      const laptopData = {
        ...editLaptop,
        price: Number.parseFloat(editLaptop.price),
        cost: Number.parseFloat(editLaptop.cost),
        quantity: Number.parseInt(editLaptop.quantity),
        low_stock_threshold: Number.parseInt(editLaptop.low_stock_threshold),
        warranty_months: Number.parseInt(editLaptop.warranty_months),
      }

      db.updateLaptop(editingLaptop.id, laptopData)
      loadLaptops() // Refresh laptops after editing
      onRefresh() // Trigger dashboard refresh
      setEditingLaptop(null)
    } catch (error) {
      console.error("Error updating laptop:", error)
    }
  }

  const handleDeleteLaptop = () => {
    if (!deletingLaptop) return

    const db = DatabaseService.getInstance()

    try {
      db.deleteLaptop(deletingLaptop.id)
      loadLaptops() // Refresh laptops after deleting
      onRefresh() // Trigger dashboard refresh
      setDeletingLaptop(null)
    } catch (error) {
      console.error("Error deleting laptop:", error)
    }
  }

  const startEditingLaptop = (laptop: Laptop) => {
    setEditingLaptop(laptop)
    setEditLaptop({
      brand: laptop.brand,
      model: laptop.model,
      processor: laptop.processor,
      ram: laptop.ram,
      storage: laptop.storage,
      graphics_card: laptop.graphics_card,
      screen_size: laptop.screen_size,
      price: laptop.price.toString(),
      cost: laptop.cost.toString(),
      quantity: laptop.quantity.toString(),
      category: laptop.category,
      supplier: laptop.supplier,
      low_stock_threshold: laptop.low_stock_threshold.toString(),
      description: laptop.description || "",
      warranty_months: laptop.warranty_months.toString(),
      image_url: laptop.image_url || "",
    })
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith(".csv")) {
      setImportErrors(["Please select a CSV file"])
      return
    }

    setImportFile(file)
    setImportErrors([])

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results: any) => {
        validateAndPreviewImport(results.data)
      },
      error: (error: any) => {
        setImportErrors([`Error parsing CSV: ${error.message}`])
      },
    })
  }

  const validateAndPreviewImport = (data: any[]) => {
    const errors: string[] = []
    const validatedData: any[] = []

    // Required fields for laptop import
    const requiredFields = [
      "brand",
      "model",
      "processor",
      "ram",
      "storage",
      "graphics_card",
      "screen_size",
      "price",
      "cost",
      "quantity",
      "category",
    ]

    // Check if required headers exist
    if (data.length > 0) {
      const headers = Object.keys(data[0])
      const missingHeaders = requiredFields.filter((field) => !headers.includes(field))
      if (missingHeaders.length > 0) {
        errors.push(`Missing required columns: ${missingHeaders.join(", ")}`)
      }
    }

    // Validate each row
    data.forEach((row, index) => {
      const rowErrors: string[] = []

      // Check required fields
      requiredFields.forEach((field) => {
        if (!row[field] || row[field].toString().trim() === "") {
          rowErrors.push(`${field} is required`)
        }
      })

      // Validate numeric fields
      const numericFields = ["price", "cost", "quantity", "low_stock_threshold", "warranty_months"]
      numericFields.forEach((field) => {
        if (row[field] && isNaN(Number(row[field]))) {
          rowErrors.push(`${field} must be a number`)
        }
      })

      // Validate price > cost
      if (row.price && row.cost && Number(row.price) <= Number(row.cost)) {
        rowErrors.push("Price must be greater than cost")
      }

      if (rowErrors.length > 0) {
        errors.push(`Row ${index + 2}: ${rowErrors.join(", ")}`)
      } else {
        // Add validated row with defaults
        validatedData.push({
          ...row,
          price: Number(row.price),
          cost: Number(row.cost),
          quantity: Number(row.quantity),
          low_stock_threshold: Number(row.low_stock_threshold) || 5,
          warranty_months: Number(row.warranty_months) || 12,
          supplier: row.supplier || "Unknown",
          description: row.description || "",
          image_url:
            row.image_url ||
            `https://source.unsplash.com/640x480/?${encodeURIComponent(`laptop,${row.brand},${row.model}`)}`,
        })
      }
    })

    setImportErrors(errors)
    setImportPreview(validatedData)
    setImportMode("preview")
  }

  const executeImport = () => {
    const db = DatabaseService.getInstance()
    let successCount = 0
    let errorCount = 0

    importPreview.forEach((laptopData) => {
      try {
        db.addLaptop(laptopData)
        successCount++
      } catch (error) {
        errorCount++
        console.error("Error importing laptop:", error)
      }
    })
    loadLaptops() // Refresh laptops after import
    onRefresh() // Trigger dashboard refresh

    // Reset import state
    setShowImportDialog(false)
    setImportFile(null)
    setImportPreview([])
    setImportErrors([])
    setImportMode("preview")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }

    // Show success message (you could use a toast here)
    alert(
      `Import completed: ${successCount} laptops imported successfully${errorCount > 0 ? `, ${errorCount} failed` : ""}`,
    )
  }

  const downloadSampleCSV = () => {
    const sampleData = [
      {
        brand: "Dell",
        model: "XPS 13",
        processor: "Intel i7-12700H",
        ram: "16GB DDR4",
        storage: "512GB SSD",
        graphics_card: "Intel Iris Xe",
        screen_size: "13.3 inch",
        price: 1299.99,
        cost: 999.99,
        quantity: 10,
        category: "Ultrabook",
        supplier: "Dell Direct",
        low_stock_threshold: 5,
        warranty_months: 12,
        description: "Premium ultrabook for professionals",
      },
    ]

    const csv = Papa.unparse(sampleData)
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "laptop_import_sample.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{laptops.length}</div>
            <p className="text-xs text-muted-foreground">{filteredAndSortedLaptops.length} filtered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${laptops.reduce((sum, laptop) => sum + laptop.price * laptop.quantity, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Retail value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground">Need restocking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Profit Margin</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(laptops.reduce((sum, laptop) => sum + db.calculateProfitMargin(laptop.id), 0) / laptops.length).toFixed(
                1,
              )}
              %
            </div>
            <p className="text-xs text-muted-foreground">Across all items</p>
          </CardContent>
        </Card>
      </div>



      <Card>
        <CardHeader>
          <CardTitle>Inventory Management</CardTitle>
          <CardDescription>Manage your laptop inventory with filtering, sorting, and bulk operations</CardDescription>
          <div className="mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImportHelp(!showImportHelp)}
              className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              <HelpCircle className="h-4 w-4" />
              {showImportHelp ? 'Hide Import/Export Help' : 'Show Import/Export Help'}
            </Button>
          </div>
        </CardHeader>
        {showImportHelp && (
          <div className="px-6 pb-4 animate-in slide-in-from-top-2 duration-200">
            <Alert className="bg-blue-50 border-blue-200">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>📋 Import/Export Instructions:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li><strong>Export:</strong> Downloads current inventory as CSV. File will be saved to your Downloads folder.</li>
                  <li><strong>Import:</strong> Upload CSV file with required columns: brand, model, processor, ram, storage, graphics_card, screen_size, price, cost, quantity, category</li>
                  <li><strong>Format:</strong> Use comma-separated values, include headers in first row</li>
                  <li><strong>Validation:</strong> Price must be greater than cost, all required fields must be filled</li>
                  <li><strong>Sample:</strong> Click "Download Sample" in import dialog to see correct format</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        )}
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by brand, model, or processor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Brand" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {brands.map((brand) => (
                  <SelectItem key={brand} value={brand}>
                    {brand}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stock</SelectItem>
                <SelectItem value="in_stock">In Stock</SelectItem>
                <SelectItem value="low">Low Stock</SelectItem>
                <SelectItem value="out">Out of Stock</SelectItem>
              </SelectContent>
            </Select>

            <Select value={processorFilter} onValueChange={setProcessorFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Processor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All CPUs</SelectItem>
                {processors.map((cpu) => (
                  <SelectItem key={cpu} value={cpu}>
                    {cpu}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={ramFilter} onValueChange={setRamFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="RAM" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All RAM</SelectItem>
                {rams
                  .sort((a, b) => {
                    const toNum = (t: string) => {
                      const m = /(\d+)\s*GB/i.exec(t)
                      return m ? Number(m[1]) : 0
                    }
                    return toNum(a) - toNum(b)
                  })
                  .map((ram) => (
                    <SelectItem key={ram} value={ram}>
                      {ram}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2">
            <ProtectedRoute requiredPermission="inventory_edit">
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Laptop
              </Button>
            </ProtectedRoute>

            <ProtectedRoute requiredPermission="inventory_edit">
              <Button variant="outline" onClick={() => setShowImportDialog(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Import CSV
              </Button>
            </ProtectedRoute>

            <Button variant="outline" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>

            {lowStockItems.length > 0 && (
              <Button variant="outline" onClick={() => setShowRestockSuggestions(true)}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Restock Suggestions ({lowStockItems.length})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("brand")}>
                    <div className="flex items-center gap-1">
                      Brand
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("model")}>
                    <div className="flex items-center gap-1">
                      Model
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("processor")}>
                    <div className="flex items-center gap-1">
                      CPU
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("ram")}>
                    <div className="flex items-center gap-1">
                      RAM
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("storage")}>
                    <div className="flex items-center gap-1">
                      Storage
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("graphics_card")}>
                    <div className="flex items-center gap-1">
                      GPU
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("screen_size")}>
                    <div className="flex items-center gap-1">
                      Screen
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("price")}>
                    <div className="flex items-center gap-1">
                      Price
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("quantity")}>
                    <div className="flex items-center gap-1">
                      Stock
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("profit_margin")}>
                    <div className="flex items-center gap-1">
                      Profit %
                      <ArrowUpDown className="h-3 w-3" />
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedLaptops.map((laptop) => {
                  const stockStatus = getStockStatus(laptop)
                  const profitMargin = db.calculateProfitMargin(laptop.id)

                  return (
                    <TableRow key={laptop.id}>
                      <TableCell className="font-medium">{laptop.brand}</TableCell>
                      <TableCell>{laptop.model}</TableCell>
                      <TableCell className="text-sm">{laptop.processor}</TableCell>
                      <TableCell className="text-sm font-medium">{laptop.ram}</TableCell>
                      <TableCell className="text-sm">{laptop.storage}</TableCell>
                      <TableCell className="text-sm">{laptop.graphics_card}</TableCell>
                      <TableCell className="text-sm">{laptop.screen_size}</TableCell>
                      <TableCell>${laptop.price.toLocaleString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={laptop.quantity <= laptop.low_stock_threshold ? "text-blue-600 font-medium" : ""}
                          >
                            {laptop.quantity}
                          </span>
                          {laptop.quantity <= laptop.low_stock_threshold && (
                            <AlertTriangle className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className={getProfitMarginColor(profitMargin)}>{profitMargin.toFixed(1)}%</TableCell>
                      <TableCell>
                        <Badge className={stockStatus.color}>{stockStatus.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" onClick={() => setPreviewLaptop(laptop)}>
                            Display
                          </Button>
                          <ProtectedRoute requiredPermission="inventory_edit">
                            <Button variant="ghost" size="sm" onClick={() => startEditingLaptop(laptop)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </ProtectedRoute>
                          <ProtectedRoute requiredPermission="inventory_edit">
                            <Button variant="ghost" size="sm" onClick={() => setDeletingLaptop(laptop)}>
                              <Trash2 className="h-4 w-4 text-foreground" />
                            </Button>
                          </ProtectedRoute>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Sheet open={previewLaptop !== null} onOpenChange={() => setPreviewLaptop(null)}>
        <SheetContent side="right" className="w-full sm:max-w-[50vw]">
          <SheetHeader>
            <SheetTitle>{previewLaptop ? `${previewLaptop.brand} ${previewLaptop.model}` : "Laptop Preview"}</SheetTitle>
          </SheetHeader>
          {previewLaptop && (
            <ImagePreview laptop={previewLaptop} resolver={getImageSrc} />
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={showRestockSuggestions} onOpenChange={setShowRestockSuggestions}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Restock Suggestions</DialogTitle>
            <DialogDescription>Based on current stock levels and sales patterns</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {generateRestockSuggestions().map(({ laptop, suggestedQuantity, totalCost, reason }) => (
              <Card key={laptop.id}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">
                        {laptop.brand} {laptop.model}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Current: {laptop.quantity} • Threshold: {laptop.low_stock_threshold}
                      </p>
                      <p className="text-sm text-foreground">{reason}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">Suggested: {suggestedQuantity} units</p>
                      <p className="text-sm text-muted-foreground">Cost: ${totalCost.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Laptop</DialogTitle>
            <DialogDescription>Enter the details for the new laptop to add to inventory</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={newLaptop.brand}
                onChange={(e) => setNewLaptop({ ...newLaptop, brand: e.target.value })}
                placeholder="e.g., Dell, HP, Lenovo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={newLaptop.model}
                onChange={(e) => setNewLaptop({ ...newLaptop, model: e.target.value })}
                placeholder="e.g., XPS 13, ThinkPad X1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="processor">Processor</Label>
              <Input
                id="processor"
                value={newLaptop.processor}
                onChange={(e) => setNewLaptop({ ...newLaptop, processor: e.target.value })}
                placeholder="e.g., Intel i7-12700H"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ram">RAM</Label>
              <Input
                id="ram"
                value={newLaptop.ram}
                onChange={(e) => setNewLaptop({ ...newLaptop, ram: e.target.value })}
                placeholder="e.g., 16GB DDR4"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="storage">Storage</Label>
              <Input
                id="storage"
                value={newLaptop.storage}
                onChange={(e) => setNewLaptop({ ...newLaptop, storage: e.target.value })}
                placeholder="e.g., 512GB SSD"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="graphics_card">Graphics Card</Label>
              <Input
                id="graphics_card"
                value={newLaptop.graphics_card}
                onChange={(e) => setNewLaptop({ ...newLaptop, graphics_card: e.target.value })}
                placeholder="e.g., NVIDIA RTX 3060"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="screen_size">Screen Size</Label>
              <Input
                id="screen_size"
                value={newLaptop.screen_size}
                onChange={(e) => setNewLaptop({ ...newLaptop, screen_size: e.target.value })}
                placeholder="e.g., 15.6 inch"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={newLaptop.category}
                onChange={(e) => setNewLaptop({ ...newLaptop, category: e.target.value })}
                placeholder="e.g., Gaming, Business, Ultrabook"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                type="number"
                value={newLaptop.price}
                onChange={(e) => setNewLaptop({ ...newLaptop, price: e.target.value })}
                placeholder="1299.99"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">Cost ($)</Label>
              <Input
                id="cost"
                type="number"
                value={newLaptop.cost}
                onChange={(e) => setNewLaptop({ ...newLaptop, cost: e.target.value })}
                placeholder="999.99"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={newLaptop.quantity}
                onChange={(e) => setNewLaptop({ ...newLaptop, quantity: e.target.value })}
                placeholder="10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="low_stock_threshold">Low Stock Threshold</Label>
              <Input
                id="low_stock_threshold"
                type="number"
                value={newLaptop.low_stock_threshold}
                onChange={(e) => setNewLaptop({ ...newLaptop, low_stock_threshold: e.target.value })}
                placeholder="5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={newLaptop.supplier}
                onChange={(e) => setNewLaptop({ ...newLaptop, supplier: e.target.value })}
                placeholder="e.g., Tech Distributors Inc"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="warranty_months">Warranty (Months)</Label>
              <Input
                id="warranty_months"
                type="number"
                value={newLaptop.warranty_months}
                onChange={(e) => setNewLaptop({ ...newLaptop, warranty_months: e.target.value })}
                placeholder="12"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newLaptop.description}
                onChange={(e) => setNewLaptop({ ...newLaptop, description: e.target.value })}
                placeholder="Additional details about the laptop..."
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddLaptop}>Add Laptop</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editingLaptop !== null} onOpenChange={() => setEditingLaptop(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Laptop</DialogTitle>
            <DialogDescription>Update the details for this laptop</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-brand">Brand</Label>
              <Input
                id="edit-brand"
                value={editLaptop.brand}
                onChange={(e) => setEditLaptop({ ...editLaptop, brand: e.target.value })}
                placeholder="e.g., Dell, HP, Lenovo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-model">Model</Label>
              <Input
                id="edit-model"
                value={editLaptop.model}
                onChange={(e) => setEditLaptop({ ...editLaptop, model: e.target.value })}
                placeholder="e.g., XPS 13, ThinkPad X1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-processor">Processor</Label>
              <Input
                id="edit-processor"
                value={editLaptop.processor}
                onChange={(e) => setEditLaptop({ ...editLaptop, processor: e.target.value })}
                placeholder="e.g., Intel i7-12700H"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-ram">RAM</Label>
              <Input
                id="edit-ram"
                value={editLaptop.ram}
                onChange={(e) => setEditLaptop({ ...editLaptop, ram: e.target.value })}
                placeholder="e.g., 16GB DDR4"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-storage">Storage</Label>
              <Input
                id="edit-storage"
                value={editLaptop.storage}
                onChange={(e) => setEditLaptop({ ...editLaptop, storage: e.target.value })}
                placeholder="e.g., 512GB SSD"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-graphics_card">Graphics Card</Label>
              <Input
                id="edit-graphics_card"
                value={editLaptop.graphics_card}
                onChange={(e) => setEditLaptop({ ...editLaptop, graphics_card: e.target.value })}
                placeholder="e.g., NVIDIA RTX 3060"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-screen_size">Screen Size</Label>
              <Input
                id="edit-screen_size"
                value={editLaptop.screen_size}
                onChange={(e) => setEditLaptop({ ...editLaptop, screen_size: e.target.value })}
                placeholder="e.g., 15.6 inch"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Input
                id="edit-category"
                value={editLaptop.category}
                onChange={(e) => setEditLaptop({ ...editLaptop, category: e.target.value })}
                placeholder="e.g., Gaming, Business, Ultrabook"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-price">Price ($)</Label>
              <Input
                id="edit-price"
                type="number"
                value={editLaptop.price}
                onChange={(e) => setEditLaptop({ ...editLaptop, price: e.target.value })}
                placeholder="1299.99"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-cost">Cost ($)</Label>
              <Input
                id="edit-cost"
                type="number"
                value={editLaptop.cost}
                onChange={(e) => setEditLaptop({ ...editLaptop, cost: e.target.value })}
                placeholder="999.99"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-quantity">Quantity</Label>
              <Input
                id="edit-quantity"
                type="number"
                value={editLaptop.quantity}
                onChange={(e) => setEditLaptop({ ...editLaptop, quantity: e.target.value })}
                placeholder="10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-low_stock_threshold">Low Stock Threshold</Label>
              <Input
                id="edit-low_stock_threshold"
                type="number"
                value={editLaptop.low_stock_threshold}
                onChange={(e) => setEditLaptop({ ...editLaptop, low_stock_threshold: e.target.value })}
                placeholder="5"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-supplier">Supplier</Label>
              <Input
                id="edit-supplier"
                value={editLaptop.supplier}
                onChange={(e) => setEditLaptop({ ...editLaptop, supplier: e.target.value })}
                placeholder="e.g., Tech Distributors Inc"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-warranty_months">Warranty (Months)</Label>
              <Input
                id="edit-warranty_months"
                type="number"
                value={editLaptop.warranty_months}
                onChange={(e) => setEditLaptop({ ...editLaptop, warranty_months: e.target.value })}
                placeholder="12"
              />
            </div>
            <div className="space-y-2 col-span-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editLaptop.description}
                onChange={(e) => setEditLaptop({ ...editLaptop, description: e.target.value })}
                placeholder="Additional details about the laptop..."
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setEditingLaptop(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditLaptop}>Update Laptop</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deletingLaptop !== null} onOpenChange={() => setDeletingLaptop(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Laptop</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this laptop? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {deletingLaptop && (
            <div className="py-4">
              <p className="font-medium">
                {deletingLaptop.brand} {deletingLaptop.model}
              </p>
              <p className="text-sm text-muted-foreground">Current stock: {deletingLaptop.quantity} units</p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeletingLaptop(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteLaptop}>
              Delete Laptop
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Laptops from CSV</DialogTitle>
            <DialogDescription>
              Upload a CSV file to bulk import laptop inventory. Download the sample file to see the required format.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Step-by-step instructions */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowImportSteps(!showImportSteps)}
                className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                <HelpCircle className="h-4 w-4" />
                {showImportSteps ? 'Hide Steps' : 'Show Import Steps'}
              </Button>
            </div>
            
            {showImportSteps && (
              <Alert className="bg-blue-50 border-blue-200 animate-in slide-in-from-top-2 duration-200">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>📝 Step-by-Step Import Instructions:</strong>
                  <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                    <li><strong>Download Sample:</strong> Click "Download Sample CSV" to get the correct format</li>
                    <li><strong>Prepare File:</strong> Create your CSV with the same headers as the sample</li>
                    <li><strong>Required Fields:</strong> brand, model, processor, ram, storage, graphics_card, screen_size, price, cost, quantity, category</li>
                    <li><strong>Validation Rules:</strong> Price &gt; Cost, all fields must be filled, numeric fields must be numbers</li>
                    <li><strong>Select File:</strong> Click "Select CSV File" and choose your prepared file</li>
                    <li><strong>Review:</strong> Check the preview and fix any errors before importing</li>
                    <li><strong>Import:</strong> Click "Import Laptops" to add them to inventory</li>
                  </ol>
                </AlertDescription>
              </Alert>
            )}
            
            <div className="flex gap-2">
              <Button variant="outline" onClick={downloadSampleCSV}>
                <FileText className="w-4 h-4 mr-2" />
                Download Sample CSV
              </Button>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-2" />
                Select CSV File
              </Button>
              <input ref={fileInputRef} type="file" accept=".csv" onChange={handleFileSelect} className="hidden" />
            </div>

            {importFile && (
              <Alert>
                <FileText className="h-4 w-4" />
                <AlertDescription>
                  Selected file: {importFile.name} ({(importFile.size / 1024).toFixed(1)} KB)
                </AlertDescription>
              </Alert>
            )}

            {importErrors.length > 0 && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-medium mb-2">Import Errors:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {importErrors.map((error, index) => (
                      <li key={index} className="text-sm">
                        {error}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {importPreview.length > 0 && importErrors.length === 0 && (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Ready to import {importPreview.length} laptops. Review the preview below and click Import to
                    proceed.
                  </AlertDescription>
                </Alert>

                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted p-3 font-medium">Import Preview</div>
                  <div className="max-h-60 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Brand</TableHead>
                          <TableHead>Model</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Cost</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Category</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {importPreview.slice(0, 10).map((laptop, index) => (
                          <TableRow key={index}>
                            <TableCell>{laptop.brand}</TableCell>
                            <TableCell>{laptop.model}</TableCell>
                            <TableCell>${laptop.price}</TableCell>
                            <TableCell>${laptop.cost}</TableCell>
                            <TableCell>{laptop.quantity}</TableCell>
                            <TableCell>{laptop.category}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {importPreview.length > 10 && (
                      <div className="p-3 text-sm text-muted-foreground text-center">
                        ... and {importPreview.length - 10} more items
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowImportDialog(false)}>
              Cancel
            </Button>
            {importPreview.length > 0 && importErrors.length === 0 && (
              <Button onClick={executeImport}>Import {importPreview.length} Laptops</Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
