export interface AuthUser {
  id: number
  username: string
  email: string
  role: "admin" | "manager" | "worker"
}

import { DatabaseService } from "@/lib/database"

export class AuthService {
  private static currentUser: AuthUser | null = null
  private static readonly SESSION_KEY = "laptop_shop_session"
  private static readonly SESSION_TIMEOUT = 8 * 60 * 60 * 1000 // 8 hours

  static login(username: string, password: string): AuthUser | null {
    const db = DatabaseService.getInstance()
    const normalizedUsername = (username || "").trim()
    const user = db
      .getUsers()
      .find(
        (u) =>
          u.username.toLowerCase() === normalizedUsername.toLowerCase() &&
          u.password_hash === password &&
          u.is_active,
      )
    if (!user) {
      try { db['logAudit']?.(0, 'LOGIN_FAIL', 'auth', 0, '', JSON.stringify({ username })) } catch {}
      return null
    }
    this.currentUser = { id: user.id, username: user.username, email: user.email, role: user.role }
    this.saveSession()
    try { db['logAudit']?.(user.id, 'LOGIN', 'auth', user.id, '', JSON.stringify({ username: user.username })) } catch {}
    return this.currentUser
  }

  static logout(): void {
    this.currentUser = null
    if (typeof window !== "undefined") {
      localStorage.removeItem(this.SESSION_KEY)
    }
  }

  static getCurrentUser(): AuthUser | null {
    if (!this.currentUser && typeof window !== "undefined") {
      this.loadSession()
    }
    return this.currentUser
  }

  private static saveSession(): void {
    if (typeof window !== "undefined" && this.currentUser) {
      const session = {
        user: this.currentUser,
        timestamp: Date.now(),
      }
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session))
    }
  }

  private static loadSession(): void {
    if (typeof window !== "undefined") {
      const sessionData = localStorage.getItem(this.SESSION_KEY)
      if (sessionData) {
        try {
          const session = JSON.parse(sessionData)
          const now = Date.now()

          // Check if session is still valid
          if (now - session.timestamp < this.SESSION_TIMEOUT) {
            this.currentUser = session.user
          } else {
            // Session expired, remove it
            localStorage.removeItem(this.SESSION_KEY)
          }
        } catch (error) {
          // Invalid session data, remove it
          localStorage.removeItem(this.SESSION_KEY)
        }
      }
    }
  }

  static hasPermission(requiredRole: "admin" | "manager" | "worker"): boolean {
    if (!this.currentUser) return false

    const roleHierarchy = { admin: 3, manager: 2, worker: 1 }
    return roleHierarchy[this.currentUser.role] >= roleHierarchy[requiredRole]
  }

  static canAccess(resource: string): boolean {
    if (!this.currentUser) return false

    const permissions = {
      admin: [
        "all",
        "user_management",
        "system_settings",
        "audit_logs",
        "financial_reports",
        "database_backup",
        "advanced_analytics",
      ],
      manager: [
        "inventory",
        "inventory_edit",
        "sales",
        "sales_edit",
        "customers",
        "customers_edit",
        "reports",
        "repairs",
        "installments",
        "repair",
        "suppliers",
        "profit_analysis",
        "stock_alerts",
        "warranty_management",
        "backup_create", // Added backup_create permission for managers
        "audit_logs", // Added audit_logs permission for managers
      ],
      worker: [
        "inventory",
        "inventory_edit",
        "customers",
        "customers_edit",
        "sales",
        "reports", // Added reports permission for workers
        "basic_reports",
        "repairs",
        "repair",
        "warranty_check",
        "stock_alerts",
        "installments", // Added installments permission for workers
        "warranty_management", // Added warranty management permission for workers
      ],
    }

    const userPermissions = permissions[this.currentUser.role]
    return userPermissions.includes("all") || userPermissions.includes(resource)
  }

  static canEdit(resource: string): boolean {
    if (!this.currentUser) return false

    const editPermissions = {
      admin: ["all"],
      manager: ["inventory", "customers", "sales", "repairs", "suppliers"],
      worker: ["inventory", "customers", "sales", "repairs"],
    }

    const userPermissions = editPermissions[this.currentUser.role]
    return userPermissions.includes("all") || userPermissions.includes(resource)
  }

  static canDelete(resource: string): boolean {
    if (!this.currentUser) return false

    // Only admins and managers can delete, with restrictions
    const deletePermissions = {
      admin: ["all"],
      manager: ["inventory", "customers"], // Managers cannot delete sales/financial records
      worker: ["inventory", "repairs"], // Workers can delete repairs
    }

    const userPermissions = deletePermissions[this.currentUser.role]
    return userPermissions.includes("all") || userPermissions.includes(resource)
  }

  static canViewFinancials(): boolean {
    return this.hasPermission("manager")
  }

  static canManageUsers(): boolean {
    return this.hasPermission("admin")
  }

  // New method: Check if user can view a resource (view-only access)
  static canView(resource: string): boolean {
    if (!this.currentUser) return false

    // All authenticated users can view most resources
    const viewPermissions = {
      admin: ["all"],
      manager: [
        "inventory", "customers", "sales", "reports", "repairs", "installments", 
        "suppliers", "profit_analysis", "stock_alerts", "warranty_management", 
        "audit_logs", "financial_reports", "database_backup", "advanced_analytics"
      ],
      worker: [
        "inventory", "customers", "sales", "reports", "repairs", "installments", 
        "suppliers", "profit_analysis", "stock_alerts", "warranty_management", 
        "audit_logs", "financial_reports", "database_backup", "advanced_analytics"
      ],
    }

    const userPermissions = viewPermissions[this.currentUser.role]
    return userPermissions.includes("all") || userPermissions.includes(resource)
  }

  static isSessionValid(): boolean {
    if (typeof window !== "undefined") {
      const sessionData = localStorage.getItem(this.SESSION_KEY)
      if (sessionData) {
        try {
          const session = JSON.parse(sessionData)
          const now = Date.now()
          return now - session.timestamp < this.SESSION_TIMEOUT
        } catch {
          return false
        }
      }
    }
    return false
  }

  static refreshSession(): void {
    if (this.currentUser) {
      this.saveSession()
    }
  }
}
