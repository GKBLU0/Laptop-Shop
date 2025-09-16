import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AuthService } from './auth'
import { DatabaseService } from './database'

// Mock DatabaseService
vi.mock('./database', () => {
  const mockUsers = [
    { id: 1, username: 'admin', email: 'admin@test.com', password_hash: 'admin123', role: 'admin', created_at: '', updated_at: '', is_active: true },
    { id: 2, username: 'manager', email: 'manager@test.com', password_hash: 'manager123', role: 'manager', created_at: '', updated_at: '', is_active: true },
    { id: 3, username: 'worker', email: 'worker@test.com', password_hash: 'worker123', role: 'worker', created_at: '', updated_at: '', is_active: true },
    { id: 4, username: 'inactive', email: 'inactive@test.com', password_hash: 'inactive123', role: 'worker', created_at: '', updated_at: '', is_active: false },
  ]

  return {
    DatabaseService: {
      getInstance: () => ({
        getUsers: () => mockUsers,
        logAudit: vi.fn()
      })
    }
  }
})

describe('AuthService', () => {
  beforeEach(() => {
    localStorage.clear()
    // Reset static properties
    ;(AuthService as any).currentUser = null
  })

  describe('login', () => {
    it('successfully logs in with valid credentials', () => {
      const user = AuthService.login('admin', 'admin123')
      expect(user).not.toBeNull()
      expect(user!.username).toBe('admin')
      expect(user!.role).toBe('admin')
      expect(AuthService.getCurrentUser()).toEqual(user)
    })

    it('fails login with invalid password', () => {
      const user = AuthService.login('admin', 'wrongpassword')
      expect(user).toBeNull()
      expect(AuthService.getCurrentUser()).toBeNull()
    })

    it('fails login with non-existent user', () => {
      const user = AuthService.login('nonexistent', 'password')
      expect(user).toBeNull()
    })

    it('fails login with inactive user', () => {
      const user = AuthService.login('inactive', 'inactive123')
      expect(user).toBeNull()
    })

    it('handles case-insensitive username', () => {
      const user = AuthService.login('ADMIN', 'admin123')
      expect(user).not.toBeNull()
      expect(user!.username).toBe('admin')
    })

    it('saves session to localStorage on successful login', () => {
      AuthService.login('admin', 'admin123')
      const sessionData = localStorage.getItem('laptop_shop_session')
      expect(sessionData).not.toBeNull()
      
      const session = JSON.parse(sessionData!)
      expect(session.user.username).toBe('admin')
      expect(session.timestamp).toBeDefined()
    })
  })

  describe('logout', () => {
    it('clears current user and session', () => {
      AuthService.login('admin', 'admin123')
      expect(AuthService.getCurrentUser()).not.toBeNull()
      
      AuthService.logout()
      expect(AuthService.getCurrentUser()).toBeNull()
      expect(localStorage.getItem('laptop_shop_session')).toBeNull()
    })
  })

  describe('session management', () => {
    it('loads valid session from localStorage', () => {
      const user = { id: 1, username: 'admin', email: 'admin@test.com', role: 'admin' as const }
      const session = {
        user,
        timestamp: Date.now()
      }
      localStorage.setItem('laptop_shop_session', JSON.stringify(session))
      
      expect(AuthService.getCurrentUser()).toEqual(user)
    })

    it('ignores expired session', () => {
      const user = { id: 1, username: 'admin', email: 'admin@test.com', role: 'admin' as const }
      const session = {
        user,
        timestamp: Date.now() - (9 * 60 * 60 * 1000) // 9 hours ago (expired)
      }
      localStorage.setItem('laptop_shop_session', JSON.stringify(session))
      
      expect(AuthService.getCurrentUser()).toBeNull()
      expect(localStorage.getItem('laptop_shop_session')).toBeNull()
    })

    it('handles corrupted session data', () => {
      localStorage.setItem('laptop_shop_session', 'invalid json')
      expect(AuthService.getCurrentUser()).toBeNull()
      expect(localStorage.getItem('laptop_shop_session')).toBeNull()
    })

    it('validates session correctly', () => {
      expect(AuthService.isSessionValid()).toBe(false)
      
      AuthService.login('admin', 'admin123')
      expect(AuthService.isSessionValid()).toBe(true)
    })

    it('refreshes session timestamp', () => {
      AuthService.login('admin', 'admin123')
      const originalSession = JSON.parse(localStorage.getItem('laptop_shop_session')!)
      
      // Wait a bit and refresh
      setTimeout(() => {
        AuthService.refreshSession()
        const refreshedSession = JSON.parse(localStorage.getItem('laptop_shop_session')!)
        expect(refreshedSession.timestamp).toBeGreaterThan(originalSession.timestamp)
      }, 10)
    })
  })

  describe('permissions', () => {
    it('checks role hierarchy correctly', () => {
      AuthService.login('admin', 'admin123')
      expect(AuthService.hasPermission('admin')).toBe(true)
      expect(AuthService.hasPermission('manager')).toBe(true)
      expect(AuthService.hasPermission('worker')).toBe(true)

      AuthService.login('manager', 'manager123')
      expect(AuthService.hasPermission('admin')).toBe(false)
      expect(AuthService.hasPermission('manager')).toBe(true)
      expect(AuthService.hasPermission('worker')).toBe(true)

      AuthService.login('worker', 'worker123')
      expect(AuthService.hasPermission('admin')).toBe(false)
      expect(AuthService.hasPermission('manager')).toBe(false)
      expect(AuthService.hasPermission('worker')).toBe(true)
    })

    it('denies permissions when not logged in', () => {
      expect(AuthService.hasPermission('worker')).toBe(false)
      expect(AuthService.canAccess('inventory')).toBe(false)
      expect(AuthService.canEdit('inventory')).toBe(false)
      expect(AuthService.canDelete('inventory')).toBe(false)
    })

    it('checks resource access permissions', () => {
      AuthService.login('admin', 'admin123')
      expect(AuthService.canAccess('all')).toBe(true)
      expect(AuthService.canAccess('user_management')).toBe(true)

      AuthService.login('manager', 'manager123')
      expect(AuthService.canAccess('inventory')).toBe(true)
      expect(AuthService.canAccess('user_management')).toBe(false)

      AuthService.login('worker', 'worker123')
      expect(AuthService.canAccess('inventory')).toBe(true)
      expect(AuthService.canAccess('financial_reports')).toBe(true)
    })

    it('checks edit permissions', () => {
      AuthService.login('admin', 'admin123')
      expect(AuthService.canEdit('inventory')).toBe(true)
      
      AuthService.login('manager', 'manager123')
      expect(AuthService.canEdit('inventory')).toBe(true)
      expect(AuthService.canEdit('customers')).toBe(true)
      
      AuthService.login('worker', 'worker123')
      expect(AuthService.canEdit('inventory')).toBe(true)
      expect(AuthService.canEdit('suppliers')).toBe(false)
    })

    it('checks delete permissions', () => {
      AuthService.login('admin', 'admin123')
      expect(AuthService.canDelete('inventory')).toBe(true)
      
      AuthService.login('manager', 'manager123')
      expect(AuthService.canDelete('inventory')).toBe(true)
      expect(AuthService.canDelete('sales')).toBe(false) // managers can't delete sales
      
      AuthService.login('worker', 'worker123')
      expect(AuthService.canDelete('inventory')).toBe(true)
      expect(AuthService.canDelete('customers')).toBe(false)
    })

    it('checks financial access', () => {
      AuthService.login('admin', 'admin123')
      expect(AuthService.canViewFinancials()).toBe(true)
      
      AuthService.login('manager', 'manager123')
      expect(AuthService.canViewFinancials()).toBe(true)
      
      AuthService.login('worker', 'worker123')
      expect(AuthService.canViewFinancials()).toBe(false)
    })

    it('checks user management access', () => {
      AuthService.login('admin', 'admin123')
      expect(AuthService.canManageUsers()).toBe(true)
      
      AuthService.login('manager', 'manager123')
      expect(AuthService.canManageUsers()).toBe(false)
      
      AuthService.login('worker', 'worker123')
      expect(AuthService.canManageUsers()).toBe(false)
    })

    it('checks view permissions', () => {
      AuthService.login('worker', 'worker123')
      expect(AuthService.canView('inventory')).toBe(true)
      expect(AuthService.canView('reports')).toBe(true)
      expect(AuthService.canView('audit_logs')).toBe(true)
    })
  })
})