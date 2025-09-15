"use client"

import { useState, useEffect } from "react"
import { DatabaseService, type Laptop, type Customer, type CartItem } from "@/lib/database"
import type { AuthUser } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Trash2, Plus, Minus, ShoppingCart, CreditCard, Search, CheckCircle, HelpCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface CartTabProps {
  user: AuthUser
  onRefresh: () => void // Add onRefresh prop
}

export function CartTab({ user, onRefresh }: CartTabProps) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [laptops, setLaptops] = useState<Laptop[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showCheckout, setShowCheckout] = useState(false)
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false)
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "installment">("cash")
  const [installmentMonths, setInstallmentMonths] = useState(12)
  const [notes, setNotes] = useState("")
  const { toast } = useToast()
  const [showTransactionComplete, setShowTransactionComplete] = useState(false)
  const [showCartHelp, setShowCartHelp] = useState(false)

  useEffect(() => {
    loadData()
  }, [])



  const loadData = () => {
    setLaptops(DatabaseService.getInstance().getLaptops())
    setCustomers(DatabaseService.getInstance().getCustomers())
  }

  const createNewCustomer = (customerData: {
    name: string
    email: string
    phone: string
    address: string
    preferredBrands: string
    notes: string
  }) => {
    if (isCreatingCustomer) {
      console.log("Customer creation already in progress, ignoring duplicate call")
      return null
    }
    
    setIsCreatingCustomer(true)
    
    try {
      const db = DatabaseService.getInstance()
      
      // Check if customer with same email already exists
      const existingCustomer = customers.find(c => c.email.toLowerCase() === customerData.email.toLowerCase())
      if (existingCustomer) {
        toast({
          title: "Customer Already Exists",
          description: `A customer with email ${customerData.email} already exists`,
          variant: "destructive",
        })
        // Select the existing customer instead
        setSelectedCustomer(existingCustomer)
        setShowNewCustomerForm(false)
        return existingCustomer
      }
      
      console.log("Creating new customer:", customerData)
      const newCustomer = db.addCustomer({
        name: customerData.name,
        email: customerData.email,
        phone: customerData.phone,
        address: customerData.address,
        preferred_brands: customerData.preferredBrands,
        notes: customerData.notes,
      })
      
      console.log("New customer created:", newCustomer)
      console.log("Current customers count:", customers.length)
      
      // Reload customers from database to avoid duplicates
      loadData()
      
      // Select the new customer
      setSelectedCustomer(newCustomer)
      
      // Close the new customer form
      setShowNewCustomerForm(false)
      
      toast({
        title: "Customer Created",
        description: `${newCustomer.name} has been added to the system`,
      })
      
      return newCustomer
    } finally {
      setIsCreatingCustomer(false)
    }
  }

  const filteredLaptops = laptops
    .filter(
      (laptop) =>
        laptop.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        laptop.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        laptop.category.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .filter((laptop) => laptop.quantity > 0)

  const addToCart = (laptop: Laptop) => {
    const existingItem = cart.find((item) => item.laptopId === laptop.id)

    if (existingItem) {
      if (existingItem.quantity >= laptop.quantity) {
        toast({
          title: "Stock Limit Reached",
          description: `Only ${laptop.quantity} units available`,
          variant: "destructive",
        })
        return
      }
      setCart(cart.map((item) => (item.laptopId === laptop.id ? { ...item, quantity: item.quantity + 1 } : item)))
    } else {
      const cartItem: CartItem = {
        id: Date.now().toString(),
        laptopId: laptop.id,
        laptop,
        quantity: 1,
        price: laptop.price,
      }
      setCart([...cart, cartItem])
    }

    toast({
      title: "Added to Cart",
      description: `${laptop.brand} ${laptop.model} added to cart`,
    })
  }

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId)
      return
    }

    const item = cart.find((item) => item.id === itemId)
    if (item && newQuantity > item.laptop.quantity) {
      toast({
        title: "Stock Limit Reached",
        description: `Only ${item.laptop.quantity} units available`,
        variant: "destructive",
      })
      return
    }

    setCart(cart.map((item) => (item.id === itemId ? { ...item, quantity: newQuantity } : item)))
  }

  const removeFromCart = (itemId: string) => {
    setCart(cart.filter((item) => item.id !== itemId))
  }

  const clearCart = () => {
    setCart([])
    setSelectedCustomer(null)
    setNotes("")
  }

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to cart before checkout",
        variant: "destructive",
      })
      return
    }

    if (!selectedCustomer) {
      toast({
        title: "Customer Required",
        description: "Please select a customer for this sale",
        variant: "destructive",
      })
      return
    }

    try {
      // Create sale record
      const saleData = {
        customerId: selectedCustomer.id,
        items: cart.map((item) => ({
          laptopId: item.laptopId,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount: getTotalAmount(),
        paymentMethod,
        installmentMonths: paymentMethod === "installment" ? installmentMonths : undefined,
        notes,
        soldBy: user.username || "admin", // Fallback to admin if username is undefined
      }

      const db = DatabaseService.getInstance()
      const saleId = db.createSale(saleData)

      // Update inventory
      cart.forEach((item) => {
        const laptop = laptops.find((l) => l.id === item.laptopId)
        if (laptop) {
          db.updateLaptopDirect(laptop.id, {
            quantity: laptop.quantity - item.quantity,
          })
        }
      })

      toast({
        title: "Sale Completed",
        description: `Sale #${saleId} completed successfully`,
        variant: "default",
      })

      // Clear cart and reload data
      clearCart()
      loadData()
      setShowCheckout(false)
      
      // Show transaction complete popup
      setShowTransactionComplete(true)
    } catch (error) {
      console.error("Checkout error:", error)
      toast({
        title: "Checkout Failed",
        description: error instanceof Error ? error.message : "An error occurred during checkout",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-6 w-6 text-foreground" />
          <h2 className="text-2xl font-bold text-foreground">Point of Sale</h2>
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCartHelp(!showCartHelp)}
            className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
          >
            <HelpCircle className="h-4 w-4" />
            {showCartHelp ? 'Hide Help' : 'Show Help'}
          </Button>
          <Badge variant="secondary" className="text-lg px-3 py-1 bg-muted text-muted-foreground border-border">
            {getTotalItems()} items
          </Badge>
          <Badge variant="outline" className="text-lg px-3 py-1 border-border text-foreground">
            ${getTotalAmount().toFixed(2)}
          </Badge>
        </div>
      </div>
      
      {showCartHelp && (
        <Card className="bg-blue-50 border-blue-200 animate-in slide-in-from-top-2 duration-200">
          <CardContent className="pt-6">
            <div className="text-sm">
              <h4 className="font-semibold text-blue-800 mb-3">🛒 Point of Sale Guide:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="font-medium text-blue-700 mb-2">📦 Adding Items</h5>
                  <ul className="list-disc list-inside space-y-1 text-blue-600">
                    <li>Search for laptops using the search bar</li>
                    <li>Click the + button to add items to cart</li>
                    <li>Adjust quantities using + and - buttons</li>
                    <li>Remove items with the trash icon</li>
                  </ul>
                </div>
                <div>
                  <h5 className="font-medium text-blue-700 mb-2">💳 Checkout Process</h5>
                  <ul className="list-disc list-inside space-y-1 text-blue-600">
                    <li>Select or create a customer first</li>
                    <li>Choose payment method (cash/card/installment)</li>
                    <li>Add any special notes or instructions</li>
                    <li>Complete the sale to update inventory</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Selection */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-border">
            <CardHeader className="bg-card">
              <CardTitle className="text-foreground">Select Products</CardTitle>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search laptops..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-border focus:border-primary focus:ring-primary"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {filteredLaptops.map((laptop) => (
                  <Card
                    key={laptop.id}
                    className="cursor-pointer hover:shadow-md transition-shadow border-border hover:border-primary"
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-semibold text-foreground">
                            {laptop.brand} {laptop.model}
                          </h4>
                          <p className="text-sm text-muted-foreground">{laptop.category}</p>
                        </div>
                        <Badge
                          variant={laptop.quantity < 5 ? "destructive" : "secondary"}
                          className={
                            laptop.quantity < 5 ? "bg-muted text-muted-foreground" : "bg-card text-foreground border-border"
                          }
                        >
                          {laptop.quantity} left
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-foreground">${laptop.price}</span>
                        <Button
                          size="sm"
                          onClick={() => addToCart(laptop)}
                          disabled={laptop.quantity === 0}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cart */}
        <div className="space-y-4">
          <Card className="border-border">
            <CardHeader className="bg-card">
              <div className="flex justify-between items-center">
                <CardTitle className="text-foreground">Shopping Cart</CardTitle>
                {cart.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearCart}
                    className="border-border text-muted-foreground hover:bg-accent bg-transparent"
                  >
                    Clear All
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {cart.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                  <p>Your cart is empty</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-3 border border-border rounded-lg hover:border-primary transition-colors"
                    >
                      <div className="flex-1">
                        <h5 className="font-medium text-sm text-foreground">
                          {item.laptop.brand} {item.laptop.model}
                        </h5>
                        <p className="text-xs text-muted-foreground">${item.price} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="border-border hover:bg-accent"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center text-sm text-foreground">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="border-border hover:bg-accent"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => removeFromCart(item.id)}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Separator className="bg-border" />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Subtotal:</span>
                      <span>${getTotalAmount().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-foreground">
                      <span>Total:</span>
                      <span>${getTotalAmount().toFixed(2)}</span>
                    </div>
                  </div>

                  <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" size="lg">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Checkout
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Complete Sale</DialogTitle>
                        <DialogDescription>
                          Follow these steps to complete the sale:
                          <ol className="list-decimal list-inside mt-2 space-y-1 text-sm">
                            <li>Select an existing customer or create a new one</li>
                            <li>Choose payment method (Cash/Card/Installment)</li>
                            <li>For installments, select payment period</li>
                            <li>Add optional notes if needed</li>
                            <li>Review total amount and click "Complete Sale"</li>
                          </ol>
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Customer</Label>
                          <div className="space-y-2">
                            <Select
                              value={selectedCustomer?.id?.toString() || ""}
                              onValueChange={(value) => {
                                if (value === "new") {
                                  setShowNewCustomerForm(true)
                                  setSelectedCustomer(null)
                                } else {
                                  const customer = customers.find((c) => c.id.toString() === value)
                                  setSelectedCustomer(customer || null)
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select customer" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new" className="font-semibold text-blue-600">
                                  ➕ Create New Customer
                                </SelectItem>
                                {customers.map((customer) => (
                                  <SelectItem key={`customer-${customer.id}`} value={customer.id.toString()}>
                                    {customer.name} - {customer.email}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            {selectedCustomer && (
                              <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
                                Selected: <strong>{selectedCustomer.name}</strong> ({selectedCustomer.email})
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          <Label>Payment Method</Label>
                          <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">Cash</SelectItem>
                              <SelectItem value="card">Card</SelectItem>
                              <SelectItem value="installment">Installment Plan</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {paymentMethod === "installment" && (
                          <div>
                            <Label>Installment Period</Label>
                            <Select
                              value={installmentMonths.toString()}
                              onValueChange={(value) => setInstallmentMonths(Number.parseInt(value))}
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
                          </div>
                        )}

                        <div>
                          <Label>Notes (Optional)</Label>
                          <Textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add any notes for this sale..."
                            rows={3}
                          />
                        </div>

                        <div className="bg-muted p-3 rounded-lg">
                          <div className="flex justify-between font-bold">
                            <span>Total Amount:</span>
                            <span>${getTotalAmount().toFixed(2)}</span>
                          </div>
                          {paymentMethod === "installment" && (
                            <div className="text-sm text-muted-foreground mt-1">
                              Monthly payment: ${(getTotalAmount() / installmentMonths).toFixed(2)}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => setShowCheckout(false)} className="flex-1">
                            Cancel
                          </Button>
                          <Button onClick={handleCheckout} className="flex-1">
                            Complete Sale
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      {/* New Customer Form Dialog */}
      <Dialog open={showNewCustomerForm} onOpenChange={setShowNewCustomerForm}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Customer</DialogTitle>
            <DialogDescription>Enter customer information to register them in the system</DialogDescription>
          </DialogHeader>
          <NewCustomerForm 
            onSubmit={createNewCustomer}
            onCancel={() => setShowNewCustomerForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Transaction Complete Dialog */}
      <Dialog open={showTransactionComplete} onOpenChange={(open) => {
        if (!open) {
          setShowTransactionComplete(false)
          // Trigger dashboard refresh when popup is closed
          onRefresh()
        }
      }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-green-600">Transaction Complete!</DialogTitle>
          </DialogHeader>
          <div className="text-center py-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <p className="text-lg font-semibold">Your purchase was successful.</p>
            <p className="text-muted-foreground mt-2">Thank you for your business!</p>
          </div>
          <Button onClick={() => setShowTransactionComplete(false)}>Close</Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// New Customer Form Component
function NewCustomerForm({ 
  onSubmit, 
  onCancel 
}: { 
  onSubmit: (data: {
    name: string
    email: string
    phone: string
    address: string
    preferredBrands: string
    notes: string
  }) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    preferredBrands: "",
    notes: ""
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim() || !formData.email.trim()) {
      return
    }
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Full Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter customer's full name"
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
          placeholder="customer@email.com"
          required
        />
      </div>
      
      <div>
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="+1234567890"
        />
      </div>
      
      <div>
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder="Enter customer's address"
          rows={2}
        />
      </div>
      
      <div>
        <Label htmlFor="preferredBrands">Preferred Brands</Label>
        <Input
          id="preferredBrands"
          value={formData.preferredBrands}
          onChange={(e) => setFormData({ ...formData, preferredBrands: e.target.value })}
          placeholder="e.g., Dell, HP, Apple"
        />
      </div>
      
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Any additional notes about the customer"
          rows={2}
        />
      </div>
      
      <div className="flex gap-2 pt-4">
        <Button type="submit" className="flex-1">
          Create Customer
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
      </div>
    </form>
  )
}
