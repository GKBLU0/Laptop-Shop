import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DatabaseService, type Laptop, type Customer, type Sale } from './database'

// Mock fetch to prevent network calls
global.fetch = vi.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({})
  })
) as any

describe('DatabaseService', () => {
  let db: DatabaseService

  beforeEach(() => {
    localStorage.clear()
    // Reset singleton instance
    ;(DatabaseService as any).instance = undefined
    db = DatabaseService.getInstance()
  })

  describe('singleton pattern', () => {
    it('returns the same instance', () => {
      const db1 = DatabaseService.getInstance()
      const db2 = DatabaseService.getInstance()
      expect(db1).toBe(db2)
    })
  })

  describe('laptop operations', () => {
    it('gets all laptops', () => {
      const laptops = db.getLaptops()
      expect(Array.isArray(laptops)).toBe(true)
    })

    it('gets laptop by id', () => {
      const laptops = db.getLaptops()
      if (laptops.length > 0) {
        const laptop = db.getLaptopById(laptops[0].id)
        expect(laptop).toBeDefined()
        expect(laptop!.id).toBe(laptops[0].id)
      }
    })

    it('adds a new laptop', () => {
      const initialCount = db.getLaptops().length
      const newLaptop = {
        brand: 'Test Brand',
        model: 'Test Model',
        processor: 'Test CPU',
        ram: '16GB',
        storage: '512GB SSD',
        graphics_card: 'Test GPU',
        screen_size: '15.6"',
        price: 1000,
        cost: 700,
        quantity: 10,
        low_stock_threshold: 5,
        category: 'Test',
        supplier: 'Test Supplier',
        warranty_months: 12
      }

      const added = db.addLaptop(newLaptop)
      expect(added).toBeDefined()
      expect(added.brand).toBe(newLaptop.brand)
      expect(added.model).toBe(newLaptop.model)
      expect(db.getLaptops().length).toBe(initialCount + 1)
    })

    it('updates a laptop', () => {
      const laptop = db.addLaptop({
        brand: 'Update Test',
        model: 'Model',
        processor: 'CPU',
        ram: '8GB',
        storage: '256GB',
        graphics_card: 'GPU',
        screen_size: '13"',
        price: 800,
        cost: 600,
        quantity: 5,
        low_stock_threshold: 2,
        category: 'Test',
        supplier: 'Supplier',
        warranty_months: 12
      })

      const updated = db.updateLaptop(laptop.id, { quantity: 15, price: 900 })
      expect(updated).not.toBeNull()
      expect(updated!.quantity).toBe(15)
      expect(updated!.price).toBe(900)
    })

    it('deletes a laptop', () => {
      const laptop = db.addLaptop({
        brand: 'Delete Test',
        model: 'Model',
        processor: 'CPU',
        ram: '8GB',
        storage: '256GB',
        graphics_card: 'GPU',
        screen_size: '13"',
        price: 800,
        cost: 600,
        quantity: 5,
        low_stock_threshold: 2,
        category: 'Test',
        supplier: 'Supplier',
        warranty_months: 12
      })

      const deleted = db.deleteLaptop(laptop.id)
      expect(deleted).toBe(true)
      expect(db.getLaptopById(laptop.id)).toBeUndefined()
    })

    it('identifies low stock laptops', () => {
      db.addLaptop({
        brand: 'Low Stock',
        model: 'Model',
        processor: 'CPU',
        ram: '8GB',
        storage: '256GB',
        graphics_card: 'GPU',
        screen_size: '13"',
        price: 800,
        cost: 600,
        quantity: 2,
        low_stock_threshold: 5,
        category: 'Test',
        supplier: 'Supplier',
        warranty_months: 12
      })

      const lowStock = db.getLowStockLaptops()
      expect(lowStock.some(l => l.brand === 'Low Stock')).toBe(true)
    })
  })

  describe('customer operations', () => {
    it('gets all customers', () => {
      const customers = db.getCustomers()
      expect(Array.isArray(customers)).toBe(true)
    })

    it('adds a new customer', () => {
      const initialCount = db.getCustomers().length
      const newCustomer = {
        name: 'Test Customer',
        email: 'test@example.com',
        phone: '+1234567890',
        address: '123 Test St',
        preferred_brands: 'Dell, HP',
        notes: 'Test customer'
      }

      const added = db.addCustomer(newCustomer)
      expect(added).toBeDefined()
      expect(added.name).toBe(newCustomer.name)
      expect(db.getCustomers().length).toBe(initialCount + 1)
    })

    it('updates a customer', () => {
      const customer = db.addCustomer({
        name: 'Update Test',
        email: 'update@test.com',
        phone: '+1111111111',
        address: '456 Update Ave',
        preferred_brands: 'Apple',
        notes: 'Update test'
      })

      const updated = db.updateCustomer(customer.id, { 
        name: 'Updated Name',
        preferred_brands: 'Dell, Apple'
      })
      expect(updated).not.toBeNull()
      expect(updated!.name).toBe('Updated Name')
      expect(updated!.preferred_brands).toBe('Dell, Apple')
    })

    it('gets customer by id', () => {
      const customer = db.addCustomer({
        name: 'Find Test',
        email: 'find@test.com',
        phone: '+2222222222',
        address: '789 Find Rd',
        preferred_brands: 'HP',
        notes: 'Find test'
      })

      const found = db.getCustomerById(customer.id)
      expect(found).toBeDefined()
      expect(found!.name).toBe('Find Test')
    })

    it('gets customer sales', () => {
      const customer = db.addCustomer({
        name: 'Sales Test',
        email: 'sales@test.com',
        phone: '+3333333333',
        address: '321 Sales St',
        preferred_brands: 'Dell',
        notes: 'Sales test'
      })

      const sales = db.getCustomerSales(customer.id)
      expect(Array.isArray(sales)).toBe(true)
    })

    it('gets customer stats', () => {
      const customer = db.addCustomer({
        name: 'Stats Test',
        email: 'stats@test.com',
        phone: '+4444444444',
        address: '654 Stats Ave',
        preferred_brands: 'Apple',
        notes: 'Stats test'
      })

      const stats = db.getCustomerStats(customer.id)
      expect(stats).toBeDefined()
      expect(typeof stats.totalPurchases).toBe('number')
      expect(typeof stats.totalSpent).toBe('number')
    })
  })

  describe('sales operations', () => {
    it('gets all sales', () => {
      const sales = db.getSales()
      expect(Array.isArray(sales)).toBe(true)
    })

    it('adds a new sale', () => {
      const laptop = db.addLaptop({
        brand: 'Sale Test',
        model: 'Model',
        processor: 'CPU',
        ram: '8GB',
        storage: '256GB',
        graphics_card: 'GPU',
        screen_size: '13"',
        price: 1000,
        cost: 700,
        quantity: 10,
        low_stock_threshold: 2,
        category: 'Test',
        supplier: 'Supplier',
        warranty_months: 12
      })

      const customer = db.addCustomer({
        name: 'Sale Customer',
        email: 'sale@test.com',
        phone: '+5555555555',
        address: '987 Sale Blvd',
        preferred_brands: 'Dell',
        notes: 'Sale test'
      })

      const initialCount = db.getSales().length
      const sale = db.addSale({
        laptop_id: laptop.id,
        customer_id: customer.id,
        user_id: 1,
        quantity: 2,
        unit_price: 1000,
        total_amount: 2000,
        payment_method: 'cash',
        sale_date: new Date().toISOString(),
        warranty_expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'completed'
      })

      expect(sale).toBeDefined()
      expect(db.getSales().length).toBe(initialCount + 1)
      
      // Check that laptop quantity was reduced
      const updatedLaptop = db.getLaptopById(laptop.id)
      expect(updatedLaptop!.quantity).toBe(8) // 10 - 2
    })

    it('creates a complex sale with installments', () => {
      const laptop = db.addLaptop({
        brand: 'Installment Test',
        model: 'Model',
        processor: 'CPU',
        ram: '16GB',
        storage: '512GB',
        graphics_card: 'GPU',
        screen_size: '15"',
        price: 1500,
        cost: 1000,
        quantity: 5,
        low_stock_threshold: 2,
        category: 'Test',
        supplier: 'Supplier',
        warranty_months: 24
      })

      const customer = db.addCustomer({
        name: 'Installment Customer',
        email: 'installment@test.com',
        phone: '+6666666666',
        address: '147 Installment Way',
        preferred_brands: 'HP',
        notes: 'Installment test'
      })

      const saleId = db.createSale({
        customerId: customer.id,
        items: [{ laptopId: laptop.id, quantity: 1, price: 1500 }],
        totalAmount: 1500,
        paymentMethod: 'installment',
        installmentMonths: 12,
        soldBy: 'admin'
      })

      expect(saleId).toBeDefined()
      
      const installments = db.getInstallments()
      const installment = installments.find(i => i.sale_id === saleId)
      expect(installment).toBeDefined()
      expect(installment!.months).toBe(12)
      expect(installment!.monthly_amount).toBe(125) // 1500 / 12
    })
  })

  describe('undo/redo functionality', () => {
    it('can undo and redo laptop operations', () => {
      const initialCount = db.getLaptops().length
      
      const laptop = db.addLaptop({
        brand: 'Undo Test',
        model: 'Model',
        processor: 'CPU',
        ram: '8GB',
        storage: '256GB',
        graphics_card: 'GPU',
        screen_size: '13"',
        price: 800,
        cost: 600,
        quantity: 5,
        low_stock_threshold: 2,
        category: 'Test',
        supplier: 'Supplier',
        warranty_months: 12
      })

      expect(db.getLaptops().length).toBe(initialCount + 1)
      expect(db.canUndo()).toBe(true)
      expect(db.canRedo()).toBe(false)

      const undoResult = db.undo()
      expect(undoResult.success).toBe(true)
      expect(db.getLaptops().length).toBe(initialCount)
      expect(db.canRedo()).toBe(true)

      const redoResult = db.redo()
      expect(redoResult.success).toBe(true)
      expect(db.getLaptops().length).toBe(initialCount + 1)
    })

    it('provides undo/redo descriptions', () => {
      const laptop = db.addLaptop({
        brand: 'Description Test',
        model: 'Model',
        processor: 'CPU',
        ram: '8GB',
        storage: '256GB',
        graphics_card: 'GPU',
        screen_size: '13"',
        price: 800,
        cost: 600,
        quantity: 5,
        low_stock_threshold: 2,
        category: 'Test',
        supplier: 'Supplier',
        warranty_months: 12
      })

      const undoDesc = db.getUndoDescription()
      expect(undoDesc).toContain('Add laptop')
      expect(undoDesc).toContain('Description Test')

      db.undo()
      const redoDesc = db.getRedoDescription()
      expect(redoDesc).toContain('Add laptop')
    })
  })

  describe('profit calculations', () => {
    it('calculates profit margin correctly', () => {
      const laptop = db.addLaptop({
        brand: 'Profit Test',
        model: 'Model',
        processor: 'CPU',
        ram: '8GB',
        storage: '256GB',
        graphics_card: 'GPU',
        screen_size: '13"',
        price: 1000,
        cost: 600,
        quantity: 5,
        low_stock_threshold: 2,
        category: 'Test',
        supplier: 'Supplier',
        warranty_months: 12
      })

      const margin = db.calculateProfitMargin(laptop.id)
      expect(margin).toBe(40) // (1000 - 600) / 1000 * 100 = 40%
    })

    it('calculates total profit from sales', () => {
      const laptop = db.addLaptop({
        brand: 'Total Profit Test',
        model: 'Model',
        processor: 'CPU',
        ram: '8GB',
        storage: '256GB',
        graphics_card: 'GPU',
        screen_size: '13"',
        price: 1000,
        cost: 700,
        quantity: 10,
        low_stock_threshold: 2,
        category: 'Test',
        supplier: 'Supplier',
        warranty_months: 12
      })

      const customer = db.addCustomer({
        name: 'Profit Customer',
        email: 'profit@test.com',
        phone: '+7777777777',
        address: '258 Profit St',
        preferred_brands: 'Dell',
        notes: 'Profit test'
      })

      db.addSale({
        laptop_id: laptop.id,
        customer_id: customer.id,
        user_id: 1,
        quantity: 2,
        unit_price: 1000,
        total_amount: 2000,
        payment_method: 'cash',
        sale_date: new Date().toISOString(),
        warranty_expiry: new Date().toISOString(),
        status: 'completed'
      })

      const totalProfit = db.calculateTotalProfit()
      expect(totalProfit).toBeGreaterThan(0)
    })
  })

  describe('repair operations', () => {
    it('gets all repairs', () => {
      const repairs = db.getRepairs()
      expect(Array.isArray(repairs)).toBe(true)
    })

    it('adds a new repair', () => {
      const laptop = db.addLaptop({
        brand: 'Repair Test',
        model: 'Model',
        processor: 'CPU',
        ram: '8GB',
        storage: '256GB',
        graphics_card: 'GPU',
        screen_size: '13"',
        price: 1000,
        cost: 700,
        quantity: 5,
        low_stock_threshold: 2,
        category: 'Test',
        supplier: 'Supplier',
        warranty_months: 12
      })

      const customer = db.addCustomer({
        name: 'Repair Customer',
        email: 'repair@test.com',
        phone: '+8888888888',
        address: '369 Repair Ave',
        preferred_brands: 'HP',
        notes: 'Repair test'
      })

      const repair = db.addRepair({
        laptop_id: laptop.id,
        customer_id: customer.id,
        issue_description: 'Screen replacement needed',
        repair_cost: 200,
        status: 'pending',
        completed_at: null
      })

      expect(repair).toBeDefined()
      expect(repair.issue_description).toBe('Screen replacement needed')
      expect(repair.status).toBe('pending')
    })

    it('updates a repair', () => {
      const laptop = db.addLaptop({
        brand: 'Update Repair Test',
        model: 'Model',
        processor: 'CPU',
        ram: '8GB',
        storage: '256GB',
        graphics_card: 'GPU',
        screen_size: '13"',
        price: 1000,
        cost: 700,
        quantity: 5,
        low_stock_threshold: 2,
        category: 'Test',
        supplier: 'Supplier',
        warranty_months: 12
      })

      const customer = db.addCustomer({
        name: 'Update Repair Customer',
        email: 'updaterepair@test.com',
        phone: '+9999999999',
        address: '741 Update Repair Blvd',
        preferred_brands: 'Apple',
        notes: 'Update repair test'
      })

      const repair = db.addRepair({
        laptop_id: laptop.id,
        customer_id: customer.id,
        issue_description: 'Battery replacement',
        repair_cost: 150,
        status: 'pending',
        completed_at: null
      })

      const updated = db.updateRepair(repair.id, {
        status: 'completed',
        completed_at: new Date().toISOString()
      })

      expect(updated).not.toBeNull()
      expect(updated!.status).toBe('completed')
      expect(updated!.completed_at).not.toBeNull()
    })
  })

  describe('dummy data generation', () => {
    it('generates comprehensive dummy data', () => {
      const result = db.generateDummyData()
      expect(result.success).toBe(true)
      expect(result.message).toContain('Generated')
      
      expect(db.getLaptops().length).toBeGreaterThan(0)
      expect(db.getCustomers().length).toBeGreaterThan(0)
      expect(db.getSales().length).toBeGreaterThan(0)
    })
  })

  describe('backup operations', () => {
    it('creates a backup', () => {
      const initialBackups = db.getBackups().length
      const backup = db.createBackup('Test backup')
      
      expect(backup).toBeDefined()
      expect(backup.description).toBe('Test backup')
      expect(db.getBackups().length).toBe(initialBackups + 1)
    })

    it('deletes a backup', () => {
      const backup = db.createBackup('Delete test backup')
      const initialCount = db.getBackups().length
      
      const deleted = db.deleteBackup(backup.id)
      expect(deleted).toBe(true)
      expect(db.getBackups().length).toBe(initialCount - 1)
    })
  })

  describe('audit logging', () => {
    it('logs operations in audit trail', () => {
      const initialAuditCount = db.getAuditLogs().length
      
      db.addLaptop({
        brand: 'Audit Test',
        model: 'Model',
        processor: 'CPU',
        ram: '8GB',
        storage: '256GB',
        graphics_card: 'GPU',
        screen_size: '13"',
        price: 800,
        cost: 600,
        quantity: 5,
        low_stock_threshold: 2,
        category: 'Test',
        supplier: 'Supplier',
        warranty_months: 12
      })

      const auditLogs = db.getAuditLogs()
      expect(auditLogs.length).toBeGreaterThan(initialAuditCount)
      
      const latestLog = auditLogs[auditLogs.length - 1]
      expect(latestLog.action).toBe('CREATE')
      expect(latestLog.table_name).toBe('laptops')
    })
  })
})