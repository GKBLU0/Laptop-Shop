import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProtectedRoute } from './protected-route'
import { AuthService } from '@/lib/auth'

// Mock AuthService
vi.mock('@/lib/auth', () => ({
  AuthService: {
    getCurrentUser: vi.fn(),
    hasPermission: vi.fn(),
    canAccess: vi.fn()
  }
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Shield: ({ className, ...props }: any) => <div data-testid="shield-icon" className={className} {...props} />,
  AlertTriangle: ({ className, ...props }: any) => <div data-testid="alert-triangle-icon" className={className} {...props} />
}))

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading spinner initially', () => {
    vi.mocked(AuthService.getCurrentUser).mockReturnValue(null)
    
    render(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>
    )
    
    // Should show loading spinner initially
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('renders children when user is authenticated and has no role requirements', async () => {
    const mockUser = { id: 1, username: 'test', email: 'test@test.com', role: 'worker' as const }
    vi.mocked(AuthService.getCurrentUser).mockReturnValue(mockUser)
    
    render(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>
    )
    
    // Wait for loading to complete and content to render
    await vi.waitFor(() => {
      expect(screen.getByText('Protected content')).toBeInTheDocument()
    })
  })

  it('shows access denied when user is not authenticated', async () => {
    vi.mocked(AuthService.getCurrentUser).mockReturnValue(null)
    
    render(
      <ProtectedRoute>
        <div>Protected content</div>
      </ProtectedRoute>
    )
    
    await vi.waitFor(() => {
      expect(screen.getByText('Access Denied')).toBeInTheDocument()
      expect(screen.getByText('You must be logged in to access this resource.')).toBeInTheDocument()
      expect(screen.getByTestId('shield-icon')).toBeInTheDocument()
    })
  })

  it('shows insufficient permissions when user lacks required role', async () => {
    const mockUser = { id: 1, username: 'test', email: 'test@test.com', role: 'worker' as const }
    vi.mocked(AuthService.getCurrentUser).mockReturnValue(mockUser)
    vi.mocked(AuthService.hasPermission).mockReturnValue(false)
    
    render(
      <ProtectedRoute requiredRole="admin">
        <div>Admin content</div>
      </ProtectedRoute>
    )
    
    await vi.waitFor(() => {
      expect(screen.getByText('Insufficient Permissions')).toBeInTheDocument()
      expect(screen.getByText('You need admin role or higher to access this resource.')).toBeInTheDocument()
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument()
    })
  })

  it('shows access restricted when user lacks required permission', async () => {
    const mockUser = { id: 1, username: 'test', email: 'test@test.com', role: 'worker' as const }
    vi.mocked(AuthService.getCurrentUser).mockReturnValue(mockUser)
    vi.mocked(AuthService.canAccess).mockReturnValue(false)
    
    render(
      <ProtectedRoute requiredPermission="user_management">
        <div>User management content</div>
      </ProtectedRoute>
    )
    
    await vi.waitFor(() => {
      expect(screen.getByText('Access Restricted')).toBeInTheDocument()
      expect(screen.getByText("You don't have permission to access this feature.")).toBeInTheDocument()
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument()
    })
  })

  it('renders children when user has required role', async () => {
    const mockUser = { id: 1, username: 'admin', email: 'admin@test.com', role: 'admin' as const }
    vi.mocked(AuthService.getCurrentUser).mockReturnValue(mockUser)
    vi.mocked(AuthService.hasPermission).mockReturnValue(true)
    
    render(
      <ProtectedRoute requiredRole="admin">
        <div>Admin content</div>
      </ProtectedRoute>
    )
    
    await vi.waitFor(() => {
      expect(screen.getByText('Admin content')).toBeInTheDocument()
    })
  })

  it('renders children when user has required permission', async () => {
    const mockUser = { id: 1, username: 'manager', email: 'manager@test.com', role: 'manager' as const }
    vi.mocked(AuthService.getCurrentUser).mockReturnValue(mockUser)
    vi.mocked(AuthService.canAccess).mockReturnValue(true)
    
    render(
      <ProtectedRoute requiredPermission="inventory">
        <div>Inventory content</div>
      </ProtectedRoute>
    )
    
    await vi.waitFor(() => {
      expect(screen.getByText('Inventory content')).toBeInTheDocument()
    })
  })

  it('renders custom fallback when provided', async () => {
    vi.mocked(AuthService.getCurrentUser).mockReturnValue(null)
    
    const customFallback = <div>Custom access denied message</div>
    
    render(
      <ProtectedRoute fallback={customFallback}>
        <div>Protected content</div>
      </ProtectedRoute>
    )
    
    await vi.waitFor(() => {
      expect(screen.getByText('Custom access denied message')).toBeInTheDocument()
      expect(screen.queryByText('Access Denied')).not.toBeInTheDocument()
    })
  })

  it('checks both role and permission when both are provided', async () => {
    const mockUser = { id: 1, username: 'manager', email: 'manager@test.com', role: 'manager' as const }
    vi.mocked(AuthService.getCurrentUser).mockReturnValue(mockUser)
    vi.mocked(AuthService.hasPermission).mockReturnValue(true)
    vi.mocked(AuthService.canAccess).mockReturnValue(false)
    
    render(
      <ProtectedRoute requiredRole="manager" requiredPermission="user_management">
        <div>Manager user management</div>
      </ProtectedRoute>
    )
    
    await vi.waitFor(() => {
      expect(screen.getByText('Access Restricted')).toBeInTheDocument()
      expect(AuthService.hasPermission).toHaveBeenCalledWith('manager')
      expect(AuthService.canAccess).toHaveBeenCalledWith('user_management')
    })
  })

  it('renders children when user meets both role and permission requirements', async () => {
    const mockUser = { id: 1, username: 'admin', email: 'admin@test.com', role: 'admin' as const }
    vi.mocked(AuthService.getCurrentUser).mockReturnValue(mockUser)
    vi.mocked(AuthService.hasPermission).mockReturnValue(true)
    vi.mocked(AuthService.canAccess).mockReturnValue(true)
    
    render(
      <ProtectedRoute requiredRole="admin" requiredPermission="user_management">
        <div>Admin user management</div>
      </ProtectedRoute>
    )
    
    await vi.waitFor(() => {
      expect(screen.getByText('Admin user management')).toBeInTheDocument()
    })
  })
})