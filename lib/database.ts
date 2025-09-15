// Database schema and utilities for laptop shop management
export interface User {
  id: number
  username: string
  email: string
  password_hash: string
  role: "admin" | "manager" | "worker"
  created_at: string
  updated_at: string
  is_active: boolean
  phone?: string
}

export interface RegistrationRequest {
  id: number
  username: string
  email: string
  phone: string
  password_hash: string
  requested_role: "manager" | "worker"
  status: "pending" | "approved" | "rejected"
  submitted_at: string
  reviewed_by_role?: "admin" | "manager"
  reviewed_by_id?: number
  reviewed_by_username?: string
  reviewed_at?: string
  note?: string
  email_token: string
  email_confirmed: boolean
}

export interface Laptop {
  id: number
  brand: string
  model: string
  processor: string
  ram: string
  storage: string
  graphics_card: string
  screen_size: string
  price: number
  cost: number
  quantity: number
  low_stock_threshold: number
  category: string
  supplier: string
  warranty_months: number
  description?: string
  image_url?: string
  created_at: string
  updated_at: string
}

export interface Customer {
  id: number
  name: string
  email: string
  phone: string
  address: string
  preferred_brands: string
  notes: string
  created_at: string
  updated_at: string
}

export interface Sale {
  id: number
  laptop_id: number
  customer_id: number
  user_id: number
  quantity: number
  unit_price: number
  total_amount: number
  payment_method: "cash" | "card" | "installment"
  sale_date: string
  warranty_expiry: string
  status: "completed" | "pending" | "cancelled"
}

export interface Installment {
  id: number
  sale_id: number
  customer_id: number
  total_amount: number
  monthly_amount: number
  months: number
  paid_months: number
  next_due_date: string
  status: "active" | "completed" | "overdue" | "cancelled"
  created_at: string
}

export interface Repair {
  id: number
  laptop_id: number
  customer_id: number
  issue_description: string
  repair_cost: number
  status: "pending" | "in_progress" | "completed" | "cancelled"
  created_at: string
  completed_at: string | null
}

export interface CartItem {
  id: string
  laptopId: number
  laptop: Laptop
  quantity: number
  price: number
}

export interface AuditLog {
  id: number
  user_id: number
  action: string
  table_name: string
  record_id: number
  old_values: string
  new_values: string
  timestamp: string
}

export interface Backup {
  id: number
  filename: string
  created_at: string
  size: string
  records_count: number
  description: string
}

// Mock data for development
export const mockUsers: User[] = [
  {
    id: 1,
    username: "admin",
    email: "admin@zanzibar.shop",
    password_hash: "admin123",
    role: "admin",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_active: true,
  },
  {
    id: 2,
    username: "manager",
    email: "manager@zanzibar.shop",
    password_hash: "manager123",
    role: "manager",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_active: true,
  },
  {
    id: 3,
    username: "worker",
    email: "worker@zanzibar.shop",
    password_hash: "worker123",
    role: "worker",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    is_active: true,
  },
]

export const mockLaptops: Laptop[] = [
  {
    id: 1,
    brand: "Dell",
    model: "XPS 13",
    processor: "Intel i7-1165G7",
    ram: "16GB",
    storage: "512GB SSD",
    graphics_card: "Intel Iris Xe",
    screen_size: '13.3"',
    price: 1299,
    cost: 950,
    quantity: 15,
    low_stock_threshold: 5,
    category: "Ultrabook",
    supplier: "Dell Direct",
    warranty_months: 12,
    image_url: `https://source.unsplash.com/640x480/?${encodeURIComponent("Dell XPS 13")}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    brand: "MacBook",
    model: "Air M2",
    processor: "Apple M2",
    ram: "8GB",
    storage: "256GB SSD",
    graphics_card: "Apple M2 GPU",
    screen_size: '13.6"',
    price: 1199,
    cost: 900,
    quantity: 3,
    low_stock_threshold: 5,
    category: "Ultrabook",
    supplier: "Apple Authorized",
    warranty_months: 12,
    image_url: `https://source.unsplash.com/640x480/?${encodeURIComponent("MacBook Air M2")}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 3,
    brand: "HP",
    model: "Pavilion Gaming",
    processor: "AMD Ryzen 5 5600H",
    ram: "16GB",
    storage: "512GB SSD",
    graphics_card: "NVIDIA GTX 1650",
    screen_size: '15.6"',
    price: 899,
    cost: 650,
    quantity: 8,
    low_stock_threshold: 5,
    category: "Gaming",
    supplier: "HP Direct",
    warranty_months: 12,
    image_url: `https://source.unsplash.com/640x480/?${encodeURIComponent("HP Pavilion Gaming")}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export const mockCustomers: Customer[] = [
  {
    id: 1,
    name: "John Smith",
    email: "john@email.com",
    phone: "+1234567890",
    address: "123 Main St, City",
    preferred_brands: "Dell, HP",
    notes: "Prefers business laptops, good payment history",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 2,
    name: "Sarah Johnson",
    email: "sarah@email.com",
    phone: "+1234567891",
    address: "456 Oak Ave, City",
    preferred_brands: "MacBook",
    notes: "Designer, needs high-resolution displays",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

// Command pattern interfaces for undo/redo functionality
interface Command {
  execute(): void
  undo(): void
  description: string
}

class AddLaptopCommand implements Command {
  constructor(
    private service: DatabaseService,
    private laptop: Omit<Laptop, "id" | "created_at" | "updated_at">,
    private addedLaptop?: Laptop,
  ) {}

  execute(): void {
    this.addedLaptop = this.service.addLaptopDirect(this.laptop)
  }

  undo(): void {
    if (this.addedLaptop) {
      this.service.deleteLaptopDirect(this.addedLaptop.id)
    }
  }

  get description(): string {
    return `Add laptop: ${this.laptop.brand} ${this.laptop.model}`
  }
}

class UpdateLaptopCommand implements Command {
  constructor(
    private service: DatabaseService,
    private laptopId: number,
    private updates: Partial<Laptop>,
    private oldLaptop?: Laptop,
  ) {}

  execute(): void {
    this.oldLaptop = this.service.getLaptopById(this.laptopId)
    this.service.updateLaptopDirect(this.laptopId, this.updates)
  }

  undo(): void {
    if (this.oldLaptop) {
      this.service.updateLaptopDirect(this.laptopId, this.oldLaptop)
    }
  }

  get description(): string {
    return `Update laptop ID: ${this.laptopId}`
  }
}

class DeleteLaptopCommand implements Command {
  constructor(
    private service: DatabaseService,
    private laptopId: number,
    private deletedLaptop?: Laptop,
  ) {}

  execute(): void {
    this.deletedLaptop = this.service.getLaptopById(this.laptopId)
    this.service.deleteLaptopDirect(this.laptopId)
  }

  undo(): void {
    if (this.deletedLaptop) {
      this.service.restoreLaptopDirect(this.deletedLaptop)
    }
  }

  get description(): string {
    return `Delete laptop ID: ${this.laptopId}`
  }
}

// Database utility functions
export class DatabaseService {
  private static instance: DatabaseService
  private laptops: Laptop[] = [...mockLaptops]
  private customers: Customer[] = [...mockCustomers]
  private users: User[] = [...mockUsers]
  private registrationRequests: RegistrationRequest[] = []
  private sales: Sale[] = []
  private installments: Installment[] = []
  private repairs: Repair[] = []
  private auditLogs: AuditLog[] = []
  private storageKey = "zanzibar_db_v1"

  private undoStack: Command[] = []
  private redoStack: Command[] = []
  private maxHistorySize = 50

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService()
      DatabaseService.instance.loadStateFromStorage()
      // Also try to load from server-side file if available
      if (typeof window !== 'undefined') {
        fetch('/api/data', { cache: 'no-store' })
          .then((r) => r.json())
          .then((state) => {
            if (state && typeof state === 'object') {
              try {
                DatabaseService.instance!.laptops = state.laptops ?? DatabaseService.instance!.laptops
                DatabaseService.instance!.customers = state.customers ?? DatabaseService.instance!.customers
                DatabaseService.instance!.users = state.users ?? DatabaseService.instance!.users
                DatabaseService.instance!.registrationRequests = state.registrationRequests ?? DatabaseService.instance!.registrationRequests
                DatabaseService.instance!.sales = state.sales ?? DatabaseService.instance!.sales
                DatabaseService.instance!.installments = state.installments ?? DatabaseService.instance!.installments
                DatabaseService.instance!.repairs = state.repairs ?? DatabaseService.instance!.repairs
                DatabaseService.instance!.auditLogs = state.auditLogs ?? DatabaseService.instance!.auditLogs
                DatabaseService.instance!.backups = state.backups ?? DatabaseService.instance!.backups
                DatabaseService.instance!.saveStateToStorage()
              } catch {}
            }
          })
          .catch(() => {})

        // Try to load from MySQL snapshot as well
        fetch('/api/data/mysql', { cache: 'no-store' })
          .then((r) => r.ok ? r.json() : null)
          .then((state) => {
            if (!state) return
            try {
              // Only override if tables exist and not empty to avoid wiping mocks
              if (Array.isArray(state.users) && state.users.length) this.users = state.users
              if (Array.isArray(state.laptops) && state.laptops.length) this.laptops = state.laptops
              if (Array.isArray(state.customers) && state.customers.length) this.customers = state.customers
              if (Array.isArray(state.sales) && state.sales.length) this.sales = state.sales
              if (Array.isArray(state.installments) && state.installments.length) this.installments = state.installments
              if (Array.isArray(state.repairs) && state.repairs.length) this.repairs = state.repairs
              if (Array.isArray(state.registrationRequests) && state.registrationRequests.length) this.registrationRequests = state.registrationRequests
              if (Array.isArray(state.auditLogs) && state.auditLogs.length) this.auditLogs = state.auditLogs
              this.saveStateToStorage()
            } catch {}
          })
          .catch(() => {})
      }
      // Ensure default demo users exist if none are loaded from any source yet
      DatabaseService.instance.ensureDefaultUsers()
    }
    return DatabaseService.instance
  }

  async refreshFromServer(): Promise<void> {
    if (typeof window === 'undefined') return
    try {
      const r = await fetch('/api/data/mysql', { cache: 'no-store' })
      if (!r.ok) return
      const state = await r.json()
      if (state && typeof state === 'object') {
        if (Array.isArray(state.users)) this.users = state.users
        if (Array.isArray(state.laptops)) this.laptops = state.laptops
        if (Array.isArray(state.customers)) this.customers = state.customers
        if (Array.isArray(state.sales)) this.sales = state.sales
        if (Array.isArray(state.installments)) this.installments = state.installments
        if (Array.isArray(state.repairs)) this.repairs = state.repairs
        if (Array.isArray(state.registrationRequests)) this.registrationRequests = state.registrationRequests
        if (Array.isArray(state.auditLogs)) this.auditLogs = state.auditLogs
        this.saveStateToStorage()
      }
    } catch {}
  }

  private ensureDefaultUsers(): void {
    if (!this.users || this.users.length === 0) {
      // Leave empty and rely on seed-users.js or user registration
      this.saveStateToStorage()
    }
  }

  private loadStateFromStorage(): void {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem(this.storageKey)
      if (!raw) return
      const state = JSON.parse(raw)
      this.laptops = state.laptops ?? this.laptops
      this.customers = state.customers ?? this.customers
      this.users = state.users ?? this.users
      this.registrationRequests = state.registrationRequests ?? this.registrationRequests
      this.sales = state.sales ?? this.sales
      this.installments = state.installments ?? this.installments
      this.repairs = state.repairs ?? this.repairs
      this.auditLogs = state.auditLogs ?? this.auditLogs
      this.backups = state.backups ?? this.backups
    } catch {}
  }

  private saveStateToStorage(): void {
    if (typeof window === 'undefined') return
    try {
      const state = {
        laptops: this.laptops,
        customers: this.customers,
        users: this.users,
        registrationRequests: this.registrationRequests,
        sales: this.sales,
        installments: this.installments,
        repairs: this.repairs,
        auditLogs: this.auditLogs,
        backups: this.backups,
      }
      window.localStorage.setItem(this.storageKey, JSON.stringify(state))
      // Persist to server file as well (fire-and-forget)
      fetch('/api/data', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(state) }).catch(() => {})
      // Also persist to MySQL backend if available
      fetch('/api/data/mysql', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(state) }).catch(() => {})
    } catch {}
  }

  private generateImageUrl(brand: string, model: string): string {
    const query = `${brand} ${model}`
    return `https://source.unsplash.com/640x480/?${encodeURIComponent(query)}`
  }

  private executeCommand(command: Command): void {
    command.execute()
    this.undoStack.push(command)
    this.redoStack = [] // Clear redo stack when new command is executed

    // Limit history size
    if (this.undoStack.length > this.maxHistorySize) {
      this.undoStack.shift()
    }
  }

  undo(): { success: boolean; message: string } {
    if (this.undoStack.length === 0) {
      return { success: false, message: "No operations to undo" }
    }

    const command = this.undoStack.pop()!
    command.undo()
    this.redoStack.push(command)

    return { success: true, message: `Undone: ${command.description}` }
  }

  redo(): { success: boolean; message: string } {
    if (this.redoStack.length === 0) {
      return { success: false, message: "No operations to redo" }
    }

    const command = this.redoStack.pop()!
    command.execute()
    this.undoStack.push(command)

    return { success: true, message: `Redone: ${command.description}` }
  }

  canUndo(): boolean {
    return this.undoStack.length > 0
  }

  canRedo(): boolean {
    return this.redoStack.length > 0
  }

  getUndoDescription(): string | null {
    if (this.undoStack.length === 0) return null
    return this.undoStack[this.undoStack.length - 1].description
  }

  getRedoDescription(): string | null {
    if (this.redoStack.length === 0) return null
    return this.redoStack[this.redoStack.length - 1].description
  }

  // Laptop operations
  getLaptops(): Laptop[] {
    return this.laptops
  }

  getLaptopById(id: number): Laptop | undefined {
    return this.laptops.find((laptop) => laptop.id === id)
  }

  addLaptop(laptop: Omit<Laptop, "id" | "created_at" | "updated_at">): Laptop {
    const command = new AddLaptopCommand(this, laptop)
    this.executeCommand(command)
    return this.laptops[this.laptops.length - 1]
  }

  addLaptopDirect(laptop: Omit<Laptop, "id" | "created_at" | "updated_at">): Laptop {
    const newLaptop: Laptop = {
      ...laptop,
      id: Math.max(...this.laptops.map((l) => l.id), 0) + 1,
      image_url: laptop.image_url || this.generateImageUrl(laptop.brand, laptop.model),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    this.laptops.push(newLaptop)
    this.logAudit(1, "CREATE", "laptops", newLaptop.id, "", JSON.stringify(newLaptop))
    this.saveStateToStorage()
    return newLaptop
  }

  updateLaptop(id: number, updates: Partial<Laptop>): Laptop | null {
    const command = new UpdateLaptopCommand(this, id, updates)
    this.executeCommand(command)
    return this.getLaptopById(id) || null
  }

  updateLaptopDirect(id: number, updates: Partial<Laptop>): Laptop | null {
    const index = this.laptops.findIndex((laptop) => laptop.id === id)
    if (index === -1) return null

    const oldLaptop = { ...this.laptops[index] }
    this.laptops[index] = {
      ...this.laptops[index],
      ...updates,
      updated_at: new Date().toISOString(),
    }

    this.logAudit(1, "UPDATE", "laptops", id, JSON.stringify(oldLaptop), JSON.stringify(this.laptops[index]))
    this.saveStateToStorage()
    return this.laptops[index]
  }

  deleteLaptop(id: number): boolean {
    const command = new DeleteLaptopCommand(this, id)
    this.executeCommand(command)
    return true
  }

  deleteLaptopDirect(id: number): boolean {
    const index = this.laptops.findIndex((laptop) => laptop.id === id)
    if (index === -1) return false

    const deletedLaptop = this.laptops[index]
    this.laptops.splice(index, 1)
    this.logAudit(1, "DELETE", "laptops", id, JSON.stringify(deletedLaptop), "")
    this.saveStateToStorage()
    return true
  }

  restoreLaptopDirect(laptop: Laptop): void {
    this.laptops.push(laptop)
    this.logAudit(1, "RESTORE", "laptops", laptop.id, "", JSON.stringify(laptop))
    this.saveStateToStorage()
  }


  updateRepair(id: number, updates: Partial<Repair>): Repair | null {
    const index = this.repairs.findIndex((repair) => repair.id === id)
    if (index === -1) return null

    const oldRepair = { ...this.repairs[index] }
    this.repairs[index] = {
      ...this.repairs[index],
      ...updates,
    }

    this.logAudit(1, "UPDATE", "repairs", id, JSON.stringify(oldRepair), JSON.stringify(this.repairs[index]))
    this.saveStateToStorage()
    return this.repairs[index]
  }

  // Customer operations
  getCustomers(): Customer[] {
    return this.customers
  }

  getCustomerById(id: number): Customer | undefined {
    return this.customers.find((customer) => customer.id === id)
  }

  getCustomerSales(customerId: number): Sale[] {
    return this.sales.filter((sale) => sale.customer_id === customerId)
  }

  getCustomerStats(customerId: number) {
    const customerSales = this.getCustomerSales(customerId)
    const totalPurchases = customerSales.length
    const totalSpent = customerSales.reduce((total, sale) => total + sale.total_amount, 0)
    
    return {
      totalPurchases,
      totalSpent,
      lastPurchase: customerSales.length > 0 ? customerSales[customerSales.length - 1].sale_date : null
    }
  }

  // Installment operations
  getInstallments(): Installment[] {
    return this.installments
  }

  getInstallmentById(id: number): Installment | undefined {
    return this.installments.find((installment) => installment.id === id)
  }

  updateInstallmentProgress(id: number, paidMonths: number, updatedBy: string): Installment | null {
    const installment = this.getInstallmentById(id)
    if (!installment) return null

    const oldInstallment = { ...installment }
    
    // Update the installment
    installment.paid_months = paidMonths
    installment.next_due_date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    
    // Update status based on progress
    if (paidMonths >= installment.months) {
      installment.status = "completed"
    } else if (paidMonths > 0) {
      installment.status = "active"
    } else {
      installment.status = "pending"
    }

    // Log the audit
    this.logAudit(1, "UPDATE", "installments", id, JSON.stringify(oldInstallment), JSON.stringify(installment))
    this.saveStateToStorage()
    return installment
  }

  addCustomer(customer: Omit<Customer, "id" | "created_at" | "updated_at">): Customer {
    const newCustomer: Customer = {
      ...customer,
      id: Math.max(...this.customers.map((c) => c.id), 0) + 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    this.customers.push(newCustomer)
    this.logAudit(1, "CREATE", "customers", newCustomer.id, "", JSON.stringify(newCustomer))
    this.saveStateToStorage()
    return newCustomer
  }

  updateCustomer(id: number, updates: Partial<Customer>): Customer | null {
    const index = this.customers.findIndex((customer) => customer.id === id)
    if (index === -1) return null

    const oldCustomer = { ...this.customers[index] }
    this.customers[index] = {
      ...this.customers[index],
      ...updates,
      updated_at: new Date().toISOString(),
    }

    this.logAudit(1, "UPDATE", "customers", id, JSON.stringify(oldCustomer), JSON.stringify(this.customers[index]))
    this.saveStateToStorage()
    return this.customers[index]
  }

  // Sales operations
  getSales(): Sale[] {
    return this.sales
  }

  addSale(sale: Omit<Sale, "id">): Sale {
    const newSale: Sale = {
      ...sale,
      id: Math.max(...this.sales.map((s) => s.id), 0) + 1,
    }
    this.sales.push(newSale)

    // Update laptop quantity
    const laptop = this.getLaptopById(sale.laptop_id)
    if (laptop) {
      this.updateLaptopDirect(sale.laptop_id, { quantity: laptop.quantity - sale.quantity })
    }

    this.logAudit(sale.user_id, "CREATE", "sales", newSale.id, "", JSON.stringify(newSale))
    this.saveStateToStorage()
    return newSale
  }

  createSale(saleData: {
    customerId: number
    items: Array<{ laptopId: number; quantity: number; price: number }>
    totalAmount: number
    paymentMethod: "cash" | "card" | "installment"
    installmentMonths?: number
    notes?: string
    soldBy: string
  }): number {
    console.log("Database createSale called with:", saleData)
    
    const saleId = Math.max(...this.sales.map((s) => s.id), 0) + 1
    const saleDate = new Date().toISOString()
    
    console.log("Generated saleId:", saleId, "saleDate:", saleDate)

    // Create individual sale records for each item
    saleData.items.forEach((item, index) => {
      const laptop = this.getLaptopById(item.laptopId)
      if (!laptop) throw new Error(`Laptop with ID ${item.laptopId} not found`)

      const sale: Sale = {
        id: saleId + index,
        laptop_id: item.laptopId,
        customer_id: saleData.customerId,
        user_id: this.users.find((u) => u.username === saleData.soldBy)?.id || 1,
        quantity: item.quantity,
        unit_price: item.price,
        total_amount: item.price * item.quantity,
        payment_method: saleData.paymentMethod,
        sale_date: saleDate,
        warranty_expiry: new Date(Date.now() + laptop.warranty_months * 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: "completed",
      }

      this.sales.push(sale)
      this.logAudit(sale.user_id, "CREATE", "sales", sale.id, "", JSON.stringify(sale))
    })

    // Create installment plan if needed
    if (saleData.paymentMethod === "installment" && saleData.installmentMonths) {
      const installment: Installment = {
        id: Math.max(...this.installments.map((i) => i.id), 0) + 1,
        sale_id: saleId,
        customer_id: saleData.customerId,
        total_amount: saleData.totalAmount,
        monthly_amount: saleData.totalAmount / saleData.installmentMonths,
        months: saleData.installmentMonths,
        paid_months: 0,
        next_due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: "active" as "active" | "completed" | "overdue" | "cancelled",
        created_at: saleDate,
      }

      this.installments.push(installment)
      this.logAudit(installment.sale_id, "CREATE", "installments", installment.id, "", JSON.stringify(installment))
    }

    this.saveStateToStorage()
    return saleId
  }

  // Low stock alerts
  getLowStockLaptops(): Laptop[] {
    return this.laptops.filter((laptop) => laptop.quantity <= laptop.low_stock_threshold)
  }

  // Audit logging
  private logAudit(
    userId: number,
    action: string,
    tableName: string,
    recordId: number,
    oldValues: string,
    newValues: string,
  ) {
    const auditLog: AuditLog = {
      id: this.auditLogs.length + 1,
      user_id: userId,
      action,
      table_name: tableName,
      record_id: recordId,
      old_values: oldValues,
      new_values: newValues,
      timestamp: new Date().toISOString(),
    }
    this.auditLogs.push(auditLog)
    this.saveStateToStorage()
  }

  getAuditLogs(): AuditLog[] {
    return this.auditLogs
  }

  // User and Registration operations
  getUsers(): User[] {
    return this.users
  }

  findUserByUsername(username: string): User | undefined {
    return this.users.find((u) => u.username.toLowerCase() === username.toLowerCase())
  }

  registerUserRequest(data: { username: string; email: string; phone: string; password: string; requested_role: "manager" | "worker" }): RegistrationRequest {
    const existing = this.findUserByUsername(data.username)
    if (existing) {
      throw new Error("Username already exists")
    }
    const req: RegistrationRequest = {
      id: Math.max(...this.registrationRequests.map((r) => r.id), 0) + 1,
      username: data.username,
      email: data.email,
      phone: data.phone,
      password_hash: data.password,
      requested_role: data.requested_role,
      status: "pending",
      submitted_at: new Date().toISOString(),
      email_token: Math.random().toString(36).slice(2, 10),
      email_confirmed: false,
    }
    this.registrationRequests.unshift(req)
    this.logAudit(0, "CREATE", "registration_requests", req.id, "", JSON.stringify({ ...req, password_hash: "***" }))
    this.saveStateToStorage()
    return req
  }

  confirmRegistrationEmail(token: string): { success: boolean; message: string } {
    const req = this.registrationRequests.find((r) => r.email_token === token)
    if (!req) return { success: false, message: "Invalid token" }
    if (req.email_confirmed) return { success: true, message: "Email already confirmed" }
    req.email_confirmed = true
    this.logAudit(0, "UPDATE", "registration_requests", req.id, "", JSON.stringify({ id: req.id, email_confirmed: true }))
    this.saveStateToStorage()
    return { success: true, message: "Email confirmed" }
  }

  getRegistrationRequests(): RegistrationRequest[] {
    return this.registrationRequests
  }

  approveRegistration(
    requestId: number,
    approver: { id: number; username: string; role: "admin" | "manager" },
  ): { success: boolean; message: string } {
    const req = this.registrationRequests.find((r) => r.id === requestId)
    if (!req) return { success: false, message: "Request not found" }
    // Rules: manager can approve worker only; admin can approve manager or worker
    if (req.requested_role === "manager" && approver.role !== "admin") {
      return { success: false, message: "Only admins can approve manager registrations" }
    }
    if (!req.email_confirmed) return { success: false, message: "Email not confirmed yet" }
    if (req.status !== "pending") return { success: false, message: "Request already processed" }

    req.status = "approved"
    req.reviewed_by_role = approver.role
    req.reviewed_by_id = approver.id
    req.reviewed_by_username = approver.username
    req.reviewed_at = new Date().toISOString()

    const newUser: User = {
      id: Math.max(...this.users.map((u) => u.id), 0) + 1,
      username: req.username,
      email: req.email,
      phone: req.phone,
      password_hash: req.password_hash,
      role: req.requested_role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
    }
    this.users.push(newUser)
    this.logAudit(
      approver.id,
      "APPROVE_REGISTRATION",
      "registration_requests",
      req.id,
      "",
      JSON.stringify({
        approver: { id: approver.id, username: approver.username, role: approver.role },
        approved_user: { id: newUser.id, username: newUser.username, role: newUser.role, email: newUser.email },
      }),
    )
    this.logAudit(approver.id, "CREATE", "users", newUser.id, "", JSON.stringify({ ...newUser, password_hash: "***" }))
    this.saveStateToStorage()
    return { success: true, message: "Registration approved and user created" }
  }

  rejectRegistration(
    requestId: number,
    approver: { id: number; username: string; role: "admin" | "manager" },
    note?: string,
  ): { success: boolean; message: string } {
    const req = this.registrationRequests.find((r) => r.id === requestId)
    if (!req) return { success: false, message: "Request not found" }
    if (req.status !== "pending") return { success: false, message: "Request already processed" }
    req.status = "rejected"
    req.reviewed_by_role = approver.role
    req.reviewed_at = new Date().toISOString()
    req.note = note
    this.logAudit(
      approver.id,
      "REJECT_REGISTRATION",
      "registration_requests",
      req.id,
      "",
      JSON.stringify({ approver: { id: approver.id, username: approver.username, role: approver.role }, request: req }),
    )
    this.saveStateToStorage()
    return { success: true, message: "Registration rejected" }
  }

  updateUserRole(userId: number, newRole: "admin" | "manager" | "worker"): { success: boolean; message: string } {
    const user = this.users.find((u) => u.id === userId)
    if (!user) return { success: false, message: "User not found" }
    const old = { ...user }
    user.role = newRole
    user.updated_at = new Date().toISOString()
    this.logAudit(0, "UPDATE", "users", userId, JSON.stringify(old), JSON.stringify(user))
    this.saveStateToStorage()
    return { success: true, message: "User role updated" }
  }

  // Repair operations
  getRepairs(): Repair[] {
    return this.repairs
  }

  getRepairById(id: number): Repair | undefined {
    return this.repairs.find((repair) => repair.id === id)
  }

  addRepair(repair: Omit<Repair, "id" | "created_at">): Repair {
    const newRepair: Repair = {
      ...repair,
      id: Math.max(...this.repairs.map((r) => r.id), 0) + 1,
      created_at: new Date().toISOString(),
    }
    this.repairs.push(newRepair)
    this.logAudit(1, "CREATE", "repairs", newRepair.id, "", JSON.stringify(newRepair))
    this.saveStateToStorage()
    return newRepair
  }

  updateRepair(id: number, updates: Partial<Repair>): Repair | null {
    const index = this.repairs.findIndex((repair) => repair.id === id)
    if (index === -1) return null

    const oldRepair = { ...this.repairs[index] }
    this.repairs[index] = {
      ...this.repairs[index],
      ...updates,
      updated_at: new Date().toISOString(),
    }

    this.logAudit(1, "UPDATE", "repairs", id, JSON.stringify(oldRepair), JSON.stringify(this.repairs[index]))
    this.saveStateToStorage()
    return this.repairs[index]
  }

  deleteRepair(id: number): boolean {
    const index = this.repairs.findIndex((repair) => repair.id === id)
    if (index === -1) return false

    const deletedRepair = this.repairs[index]
    this.repairs.splice(index, 1)
    this.logAudit(1, "DELETE", "repairs", id, JSON.stringify(deletedRepair), "")
    this.saveStateToStorage()
    return true
  }

  // Profit calculations
  calculateProfitMargin(laptopId: number): number {
    const laptop = this.getLaptopById(laptopId)
    if (!laptop) return 0
    return ((laptop.price - laptop.cost) / laptop.price) * 100
  }

  calculateTotalProfit(): number {
    return this.sales.reduce((total, sale) => {
      const laptop = this.getLaptopById(sale.laptop_id)
      if (!laptop) return total
      const profit = (sale.unit_price - laptop.cost) * sale.quantity
      return total + profit
    }, 0)
  }

  generateDummyData(): { success: boolean; message: string } {
    try {
      // Clear existing data except users
      this.laptops = []
      this.customers = []
      this.sales = []
      this.installments = []
      this.repairs = []

      // Generate 30 diverse laptops
      const brands = ["Dell", "HP", "Lenovo", "ASUS", "Acer", "MSI", "Apple", "Samsung", "LG", "Razer"]
      const processors = [
        "Intel i5-12400H",
        "Intel i7-12700H",
        "AMD Ryzen 5 5600H",
        "AMD Ryzen 7 5800H",
        "Apple M2",
        "Intel i3-1115G4",
      ]
      const ramOptions = ["8GB", "16GB", "32GB", "64GB"]
      const storageOptions = ["256GB SSD", "512GB SSD", "1TB SSD", "2TB SSD", "1TB HDD + 256GB SSD"]
      const categories = ["Gaming", "Business", "Ultrabook", "Workstation", "Budget"]
      const suppliers = ["Direct Supplier", "Tech Distributors", "Global Electronics", "Premium Partners"]

      for (let i = 1; i <= 30; i++) {
        const brand = brands[Math.floor(Math.random() * brands.length)]
        const cost = 400 + Math.floor(Math.random() * 1200)
        const price = cost + Math.floor(cost * (0.3 + Math.random() * 0.5))

        this.laptops.push({
          id: i,
          brand,
          model: `${brand === "Apple" ? "MacBook" : "Model"} ${i}${Math.random() > 0.5 ? "X" : "Pro"}`,
          processor: processors[Math.floor(Math.random() * processors.length)],
          ram: ramOptions[Math.floor(Math.random() * ramOptions.length)],
          storage: storageOptions[Math.floor(Math.random() * storageOptions.length)],
          graphics_card: Math.random() > 0.6 ? "NVIDIA RTX 3060" : "Integrated Graphics",
          screen_size: Math.random() > 0.5 ? '15.6"' : '13.3"',
          price,
          cost,
          quantity: Math.floor(Math.random() * 25) + 1,
          low_stock_threshold: 5,
          category: categories[Math.floor(Math.random() * categories.length)],
          supplier: suppliers[Math.floor(Math.random() * suppliers.length)],
          warranty_months: Math.random() > 0.5 ? 12 : 24,
          created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
      }

      // Generate 25 customers
      const firstNames = [
        "John",
        "Sarah",
        "Michael",
        "Emma",
        "David",
        "Lisa",
        "James",
        "Anna",
        "Robert",
        "Maria",
        "William",
        "Jennifer",
        "Richard",
        "Jessica",
        "Thomas",
      ]
      const lastNames = [
        "Smith",
        "Johnson",
        "Williams",
        "Brown",
        "Jones",
        "Garcia",
        "Miller",
        "Davis",
        "Rodriguez",
        "Martinez",
        "Hernandez",
        "Lopez",
        "Gonzalez",
        "Wilson",
        "Anderson",
      ]
      const domains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "company.com"]
      const brandPrefs = ["Dell, HP", "Apple", "Gaming brands", "Business laptops", "Budget options"]

      for (let i = 1; i <= 25; i++) {
        const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
        const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]

        this.customers.push({
          id: i,
          name: `${firstName} ${lastName}`,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domains[Math.floor(Math.random() * domains.length)]}`,
          phone: `+1${Math.floor(Math.random() * 900000000) + 100000000}`,
          address: `${Math.floor(Math.random() * 9999) + 1} ${["Main St", "Oak Ave", "Pine Rd", "Elm Dr", "Cedar Ln"][Math.floor(Math.random() * 5)]}, City`,
          preferred_brands: brandPrefs[Math.floor(Math.random() * brandPrefs.length)],
          notes: [
            "Excellent customer",
            "Prefers premium products",
            "Price-sensitive buyer",
            "Tech enthusiast",
            "Business user",
          ][Math.floor(Math.random() * 5)],
          created_at: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
      }

      // Generate 35 sales records
      for (let i = 1; i <= 35; i++) {
        const laptop = this.laptops[Math.floor(Math.random() * this.laptops.length)]
        const customer = this.customers[Math.floor(Math.random() * this.customers.length)]
        const quantity = Math.floor(Math.random() * 3) + 1
        const saleDate = new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000)

        this.sales.push({
          id: i,
          laptop_id: laptop.id,
          customer_id: customer.id,
          user_id: Math.random() > 0.5 ? 1 : 2,
          quantity,
          unit_price: laptop.price,
          total_amount: laptop.price * quantity,
          payment_method: ["cash", "card", "installment"][Math.floor(Math.random() * 3)] as
            | "cash"
            | "card"
            | "installment",
          sale_date: saleDate.toISOString(),
          warranty_expiry: new Date(
            saleDate.getTime() + laptop.warranty_months * 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
          status: Math.random() > 0.1 ? "completed" : ("pending" as "completed" | "pending" | "cancelled"),
        })
      }

      // Generate 15 repair requests
      for (let i = 1; i <= 15; i++) {
        const laptop = this.laptops[Math.floor(Math.random() * this.laptops.length)]
        const customer = this.customers[Math.floor(Math.random() * this.customers.length)]
        const issues = [
          "Screen replacement needed",
          "Keyboard malfunction",
          "Battery not charging",
          "Overheating issues",
          "Hard drive failure",
          "RAM upgrade required",
        ]

        this.repairs.push({
          id: i,
          laptop_id: laptop.id,
          customer_id: customer.id,
          issue_description: issues[Math.floor(Math.random() * issues.length)],
          repair_cost: Math.floor(Math.random() * 300) + 50,
          status: ["pending", "in_progress", "completed"][Math.floor(Math.random() * 3)] as
            | "pending"
            | "in_progress"
            | "completed"
            | "cancelled",
          created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          completed_at: Math.random() > 0.5 ? new Date().toISOString() : null,
        })
      }

      // Generate installment plans for installment sales
      this.sales
        .filter((sale) => sale.payment_method === "installment")
        .forEach((sale, index) => {
          const months = [6, 12, 18, 24][Math.floor(Math.random() * 4)]
          const monthlyAmount = sale.total_amount / months
          const paidMonths = Math.floor(Math.random() * months)

          this.installments.push({
            id: index + 1,
            sale_id: sale.id,
            customer_id: sale.customer_id,
            total_amount: sale.total_amount,
            monthly_amount: monthlyAmount,
            months,
            paid_months: paidMonths,
            next_due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            status:
              paidMonths >= months
                ? "completed"
                : ((Math.random() > 0.8 ? "overdue" : "active") as "active" | "completed" | "overdue" | "cancelled"),
            created_at: sale.sale_date,
          })
        })

      this.logAudit(1, "GENERATE", "system", 0, "", "Generated comprehensive dummy data")
      this.saveStateToStorage()
      if (typeof window !== 'undefined') {
        const state = {
          laptops: this.laptops,
          customers: this.customers,
          users: this.users,
          registrationRequests: this.registrationRequests,
          sales: this.sales,
          installments: this.installments,
          repairs: this.repairs,
          auditLogs: this.auditLogs,
          backups: this.backups,
        }
        fetch('/api/data/mysql', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(state) }).catch(() => {})
      }
      return {
        success: true,
        message: `Generated 30 laptops, 25 customers, 35 sales, ${this.installments.length} installments, and 15 repair requests`,
      }
    } catch (error) {
      return { success: false, message: "Failed to generate dummy data" }
    }
  }

  // Backup Management Methods
  private backups: Backup[] = []

  getBackups(): Backup[] {
    return [...this.backups]
  }

  createBackup(description: string = "Manual backup"): Backup {
    const newBackup: Backup = {
      id: this.backups.length + 1,
      filename: `laptop_shop_backup_${new Date().toISOString().replace(/[:.]/g, "").slice(0, 15)}.db`,
      created_at: new Date().toISOString(),
      size: "2.5 MB",
      records_count: this.laptops.length + this.customers.length + this.sales.length + this.installments.length + this.repairs.length,
      description,
    }

    this.backups.unshift(newBackup)
    
    // Log the backup creation
    this.logAudit(1, "BACKUP", "system", 0, "", JSON.stringify(newBackup))
    this.saveStateToStorage()
    return newBackup
  }

  deleteBackup(backupId: number): boolean {
    const index = this.backups.findIndex(b => b.id === backupId)
    if (index !== -1) {
      const deletedBackup = this.backups.splice(index, 1)[0]
      this.logAudit(1, "BACKUP_DELETE", "system", 0, "", `Deleted backup: ${deletedBackup.filename}`)
      this.saveStateToStorage()
      return true
    }
    return false
  }
}
