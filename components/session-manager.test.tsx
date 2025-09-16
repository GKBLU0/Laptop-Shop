import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { SessionManager } from './session-manager'
import { AuthService } from '@/lib/auth'

// Mock AuthService
vi.mock('@/lib/auth', () => ({
  AuthService: {
    isSessionValid: vi.fn(),
    refreshSession: vi.fn()
  }
}))

// Mock lucide-react
vi.mock('lucide-react', () => ({
  Clock: ({ className, ...props }: any) => <div data-testid="clock-icon" className={className} {...props} />
}))

describe('SessionManager', () => {
  const mockOnSessionExpired = vi.fn()
  
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders nothing when session is valid and not near expiry', () => {
    vi.mocked(AuthService.isSessionValid).mockReturnValue(true)
    
    // Set session that expires in 2 hours (not near expiry)
    const session = {
      user: { id: 1, username: 'test', email: 'test@test.com', role: 'admin' },
      timestamp: Date.now() - (6 * 60 * 60 * 1000) // 6 hours ago (2 hours left)
    }
    localStorage.setItem('laptop_shop_session', JSON.stringify(session))

    const { container } = render(<SessionManager onSessionExpired={mockOnSessionExpired} />)
    expect(container.firstChild).toBeNull()
  })

  it('shows warning when session is near expiry', () => {
    vi.mocked(AuthService.isSessionValid).mockReturnValue(true)
    
    // Set session that expires in 10 minutes (near expiry)
    const session = {
      user: { id: 1, username: 'test', email: 'test@test.com', role: 'admin' },
      timestamp: Date.now() - (7 * 60 * 60 * 1000 + 50 * 60 * 1000) // 7h 50m ago (10 minutes left)
    }
    
    // Mock localStorage.getItem to return the session
    vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(session))

    render(<SessionManager onSessionExpired={mockOnSessionExpired} />)
    
    expect(screen.getByText('Session Expiring Soon')).toBeInTheDocument()
    expect(screen.getByText(/Your session will expire in \d+ minutes/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Extend Session' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Logout Now' })).toBeInTheDocument()
  })

  it('calls onSessionExpired when session is invalid', () => {
    vi.mocked(AuthService.isSessionValid).mockReturnValue(false)

    render(<SessionManager onSessionExpired={mockOnSessionExpired} />)
    
    expect(mockOnSessionExpired).toHaveBeenCalled()
  })

  it('calls onSessionExpired when session data is corrupted', () => {
    vi.mocked(AuthService.isSessionValid).mockReturnValue(true)
    localStorage.setItem('laptop_shop_session', 'invalid json')

    render(<SessionManager onSessionExpired={mockOnSessionExpired} />)
    
    expect(mockOnSessionExpired).toHaveBeenCalled()
  })

  it('extends session when extend button is clicked', () => {
    vi.mocked(AuthService.isSessionValid).mockReturnValue(true)
    
    // Set session near expiry
    const session = {
      user: { id: 1, username: 'test', email: 'test@test.com', role: 'admin' },
      timestamp: Date.now() - (7 * 60 * 60 * 1000 + 50 * 60 * 1000)
    }
    localStorage.setItem('laptop_shop_session', JSON.stringify(session))

    render(<SessionManager onSessionExpired={mockOnSessionExpired} />)
    
    const extendButton = screen.getByRole('button', { name: 'Extend Session' })
    fireEvent.click(extendButton)
    
    expect(AuthService.refreshSession).toHaveBeenCalled()
  })

  it('calls onSessionExpired when logout button is clicked', () => {
    vi.mocked(AuthService.isSessionValid).mockReturnValue(true)
    
    // Set session near expiry
    const session = {
      user: { id: 1, username: 'test', email: 'test@test.com', role: 'admin' },
      timestamp: Date.now() - (7 * 60 * 60 * 1000 + 50 * 60 * 1000)
    }
    localStorage.setItem('laptop_shop_session', JSON.stringify(session))

    render(<SessionManager onSessionExpired={mockOnSessionExpired} />)
    
    const logoutButton = screen.getByRole('button', { name: 'Logout Now' })
    fireEvent.click(logoutButton)
    
    expect(mockOnSessionExpired).toHaveBeenCalled()
  })

  it('displays correct time left in minutes', () => {
    vi.mocked(AuthService.isSessionValid).mockReturnValue(true)
    
    // Set session that expires in exactly 10 minutes
    const session = {
      user: { id: 1, username: 'test', email: 'test@test.com', role: 'admin' },
      timestamp: Date.now() - (7 * 60 * 60 * 1000 + 50 * 60 * 1000) // 10 minutes left
    }
    localStorage.setItem('laptop_shop_session', JSON.stringify(session))

    render(<SessionManager onSessionExpired={mockOnSessionExpired} />)
    
    expect(screen.getByText('Your session will expire in 10 minutes')).toBeInTheDocument()
  })

  it('checks session periodically', () => {
    vi.mocked(AuthService.isSessionValid).mockReturnValue(true)
    
    const session = {
      user: { id: 1, username: 'test', email: 'test@test.com', role: 'admin' },
      timestamp: Date.now() - (6 * 60 * 60 * 1000) // 2 hours left
    }
    localStorage.setItem('laptop_shop_session', JSON.stringify(session))

    render(<SessionManager onSessionExpired={mockOnSessionExpired} />)
    
    // Fast-forward 1 minute
    act(() => {
      vi.advanceTimersByTime(60000)
    })
    
    // Should have checked session again
    expect(AuthService.isSessionValid).toHaveBeenCalledTimes(2)
  })

  it('cleans up interval on unmount', () => {
    vi.mocked(AuthService.isSessionValid).mockReturnValue(true)
    
    const { unmount } = render(<SessionManager onSessionExpired={mockOnSessionExpired} />)
    
    // Unmount component
    unmount()
    
    // Fast-forward time - should not call isSessionValid again
    const callCountBeforeUnmount = vi.mocked(AuthService.isSessionValid).mock.calls.length
    
    act(() => {
      vi.advanceTimersByTime(60000)
    })
    
    expect(vi.mocked(AuthService.isSessionValid).mock.calls.length).toBe(callCountBeforeUnmount)
  })

  it('hides warning after extending session', () => {
    vi.mocked(AuthService.isSessionValid).mockReturnValue(true)
    
    // Set session near expiry
    const session = {
      user: { id: 1, username: 'test', email: 'test@test.com', role: 'admin' },
      timestamp: Date.now() - (7 * 60 * 60 * 1000 + 50 * 60 * 1000)
    }
    localStorage.setItem('laptop_shop_session', JSON.stringify(session))

    const { container } = render(<SessionManager onSessionExpired={mockOnSessionExpired} />)
    
    // Warning should be visible
    expect(screen.getByText('Session Expiring Soon')).toBeInTheDocument()
    
    // Click extend session
    const extendButton = screen.getByRole('button', { name: 'Extend Session' })
    fireEvent.click(extendButton)
    
    // Warning should be hidden
    expect(container.firstChild).toBeNull()
  })

  it('displays clock icon', () => {
    vi.mocked(AuthService.isSessionValid).mockReturnValue(true)
    
    // Set session near expiry
    const session = {
      user: { id: 1, username: 'test', email: 'test@test.com', role: 'admin' },
      timestamp: Date.now() - (7 * 60 * 60 * 1000 + 50 * 60 * 1000)
    }
    localStorage.setItem('laptop_shop_session', JSON.stringify(session))

    render(<SessionManager onSessionExpired={mockOnSessionExpired} />)
    
    expect(screen.getByTestId('clock-icon')).toBeInTheDocument()
  })

  it('applies correct styling classes', () => {
    vi.mocked(AuthService.isSessionValid).mockReturnValue(true)
    
    // Set session near expiry
    const session = {
      user: { id: 1, username: 'test', email: 'test@test.com', role: 'admin' },
      timestamp: Date.now() - (7 * 60 * 60 * 1000 + 50 * 60 * 1000)
    }
    localStorage.setItem('laptop_shop_session', JSON.stringify(session))

    render(<SessionManager onSessionExpired={mockOnSessionExpired} />)
    
    const container = screen.getByText('Session Expiring Soon').closest('.fixed')
    expect(container).toHaveClass('fixed', 'top-4', 'right-4', 'z-50')
  })
})