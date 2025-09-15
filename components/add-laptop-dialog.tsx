"use client"

import type React from "react"

import { useState } from "react"
import { DatabaseService } from "@/lib/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface AddLaptopDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddLaptopDialog({ open, onOpenChange, onSuccess }: AddLaptopDialogProps) {
  const [formData, setFormData] = useState({
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
    low_stock_threshold: "5",
    category: "",
    supplier: "",
    warranty_months: "12",
  })

  const db = DatabaseService.getInstance()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    try {
      db.addLaptop({
        brand: formData.brand,
        model: formData.model,
        processor: formData.processor,
        ram: formData.ram,
        storage: formData.storage,
        graphics_card: formData.graphics_card,
        screen_size: formData.screen_size,
        price: Number.parseFloat(formData.price),
        cost: Number.parseFloat(formData.cost),
        quantity: Number.parseInt(formData.quantity),
        low_stock_threshold: Number.parseInt(formData.low_stock_threshold),
        category: formData.category,
        supplier: formData.supplier,
        warranty_months: Number.parseInt(formData.warranty_months),
      })

      // Reset form
      setFormData({
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
        low_stock_threshold: "5",
        category: "",
        supplier: "",
        warranty_months: "12",
      })

      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Error adding laptop:", error)
    }
  }

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Laptop</DialogTitle>
          <DialogDescription>Enter the details for the new laptop to add to inventory</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Input
                id="brand"
                value={formData.brand}
                onChange={(e) => updateFormData("brand", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => updateFormData("model", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="processor">Processor</Label>
            <Input
              id="processor"
              value={formData.processor}
              onChange={(e) => updateFormData("processor", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ram">RAM</Label>
              <Select value={formData.ram} onValueChange={(value) => updateFormData("ram", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select RAM" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4GB">4GB</SelectItem>
                  <SelectItem value="8GB">8GB</SelectItem>
                  <SelectItem value="16GB">16GB</SelectItem>
                  <SelectItem value="32GB">32GB</SelectItem>
                  <SelectItem value="64GB">64GB</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="storage">Storage</Label>
              <Select value={formData.storage} onValueChange={(value) => updateFormData("storage", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Storage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="256GB SSD">256GB SSD</SelectItem>
                  <SelectItem value="512GB SSD">512GB SSD</SelectItem>
                  <SelectItem value="1TB SSD">1TB SSD</SelectItem>
                  <SelectItem value="2TB SSD">2TB SSD</SelectItem>
                  <SelectItem value="1TB HDD">1TB HDD</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="screen_size">Screen Size</Label>
              <Select value={formData.screen_size} onValueChange={(value) => updateFormData("screen_size", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Screen Size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='13.3"'>13.3"</SelectItem>
                  <SelectItem value='14"'>14"</SelectItem>
                  <SelectItem value='15.6"'>15.6"</SelectItem>
                  <SelectItem value='17.3"'>17.3"</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="graphics_card">Graphics Card</Label>
            <Input
              id="graphics_card"
              value={formData.graphics_card}
              onChange={(e) => updateFormData("graphics_card", e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => updateFormData("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ultrabook">Ultrabook</SelectItem>
                  <SelectItem value="Gaming">Gaming</SelectItem>
                  <SelectItem value="Business">Business</SelectItem>
                  <SelectItem value="Budget">Budget</SelectItem>
                  <SelectItem value="Workstation">Workstation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplier">Supplier</Label>
              <Input
                id="supplier"
                value={formData.supplier}
                onChange={(e) => updateFormData("supplier", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Selling Price ($)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) => updateFormData("price", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cost">Cost Price ($)</Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                value={formData.cost}
                onChange={(e) => updateFormData("cost", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => updateFormData("quantity", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="low_stock_threshold">Low Stock Alert</Label>
              <Input
                id="low_stock_threshold"
                type="number"
                value={formData.low_stock_threshold}
                onChange={(e) => updateFormData("low_stock_threshold", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="warranty_months">Warranty (Months)</Label>
              <Input
                id="warranty_months"
                type="number"
                value={formData.warranty_months}
                onChange={(e) => updateFormData("warranty_months", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Laptop</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
