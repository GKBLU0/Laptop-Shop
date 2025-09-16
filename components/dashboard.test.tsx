import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Dashboard } from './dashboard'
import { AuthService } from '@/lib/auth'
import { DatabaseService } from '@/lib/database'

// Mock all dependencies
vi.mock('@/lib/auth')
vi.mock('@/lib/database')
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn()
}))

// Mock all child components
vi.mock('@/components/inventory-tab', () => ({
  InventoryTab: () => <div data-testid="inventory-tab">Inventory Tab</div>
}))
vi.mock('@/components/sales-tab', () => ({
  SalesTab: () => <div data-testid="sales-tab">Sales Tab</div>
}))
vi.mock('@/components/customers-tab', () => ({
  CustomersTab: () => <div data-testid="customers-tab">Customers Tab</div>
}))
vi.mock('@/components/reports-tab', () => ({
  ReportsTab: () => <div data-testid="reports-tab">Reports Tab</div>
}))
vi.mock('@/components/advanced-features', () => ({
  AdvancedFeatures: () => <div data-testid="advanced-features">Advanced Features</div>
}))
vi.mock('@/components/cart-tab', () => ({
  CartTab: () => <div data-testid="cart-tab">Cart Tab</div>
}))
vi.mock('@/components/repair-tab', () => ({
  RepairTab: () => <div data-testid="repair-tab">Repair Tab</div>
}))
vi.mock('@/components/theme-toggle', () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">Theme Toggle</div>
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Package: () => <div data-testid="package-icon" />,
  ShoppingCart: () => <div data-testid="shopping-cart-icon" />,
  Users: () => <div data-testid="users-icon" />,
  AlertTriangle: () => <div data-testid="alert-triangle-icon" />,
  DollarSign: () => <div data-testid="dollar-sign-icon" />,
  LogOut: () => <div data-testid="logout-icon" />,
  Shield: () => <div data-testid="shield-icon" />,
  Undo: () => <div data-testid="undo-icon" />,
  Redo: () => <div data-testid="redo-icon" />,
  Database: () => <div data-testid="database-icon" />,
  CreditCard: () => <div data-testid="credit-card-icon" />,
  Plus: () => <div data-testid="plus-icon" />,
  HelpCircle: () => <div data-testid="help-circle-icon" />
}))

describe('Dashboard', () => {
  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@test.com',
    role: 'admin' as const
  }

  const mockOnLogout = vi.fn()
  const mockDb = {
    getLaptops: vi.fn(),
    getCustomers: vi.fn(),
    getSales: vi.fn(),
    getLowStockLaptops: vi.fn(),
    calculateTotalProfit: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    canUndo: vi.fn(),
    canRedo: vi.fn(),
    getUndoDescription: vi.fn(),
    getRedoDescription: vi.fn(),
    generateDummyData: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup DatabaseService mock
    vi.mocked(DatabaseService.getInstance).mockReturnValue(mockDb as any)
    
    // Setup default mock data
    mockDb.getLaptops.mockReturnValue([
      { id: 1, brand: 'Dell', model: 'XPS 13', quantity: 10, price: 1000, cost: 800 },
      { id: 2, brand: 'HP', model: 'Pavilion', quantity: 2, price: 800, cost: 600, low_stock_threshold: 5 }
    ])
    mockDb.getCustomers.mockReturnValue([
      { id: 1, name: 'John Doe' },
      { id: 2, name: 'Jane Smith' }
    ])
    mockDb.getSales.mockReturnValue([
      { id: 1, total_amount: 1000 },
      { id: 2, total_amount: 800 }
    ])
    mockDb.getLowStockLaptops.mockReturnValue([
      { id: 2, brand: 'HP', model: 'Pavilion', quantity: 2 }
    ])
    mockDb.calculateTotalProfit.mockReturnValue(400)
    mockDb.canUndo.mockReturnValue(true)
    mockDb.canRedo.mockReturnValue(false)
    mockDb.getUndoDescription.mockReturnValue('Add laptop: Dell XPS 13')
    
    // Setup AuthService mock
    vi.mocked(AuthService.canAccess).mockReturnValue(true)
  })

  it('renders dashboard header with user info', () => {
    render(<Dashboard user={mockUser} onLogout={mockOnLogout} />)
    
    expect(screen.getByText('Zanzibar')).toBeInTheDocument()
    expect(screen.getByText('Welcome, testuser')).toBeInTheDocument()
    expect(screen.getByText('ADMIN')).toBeInTheDocument()
  })

  it('displays key metrics cards', () => {
    render(<Dashboard user={mockUser} onLogout={mockOnLogout} />)
    
    expect(screen.getByText('Total Inventory')).toBeInTheDocument()
    expect(screen.getByText('Total Sales')).toBeInTheDocument()
    expect(screen.getAllByText('Customers')).toHaveLength(2) // One in tab, one in card
    expect(screen.getByText('Total Profit')).toBeInTheDocument()
    
    // Check calculated values
    expect(screen.getByText('12')).toBeInTheDocument() // Total inventory quantity
    expect(screen.getAllByText('2')).toHaveLength(2) // Total sales count and customers count
    expect(screen.getByText('$400')).toBeInTheDocument() // Total profit
  })

  it('shows low stock alert when items are low', () => {
    render(<Dashboard user={mockUser} onLogout={mockOnLogout} />)
    
    expect(screen.getByText('Low Stock Alert')).toBeInTheDocument()
    expect(screen.getByText('1 items are running low on stock')).toBeInTheDocument()
    expect(screen.getByText('HP Pavilion')).toBeInTheDocument()
    expect(screen.getByText('2 left')).toBeInTheDocument()
  })

  it('handles logout button click', () => {
    render(<Dashboard user={mockUser} onLogout={mockOnLogout} />)
    
    const logoutButton = screen.getByRole('button', { name: /logout/i })
    fireEvent.click(logoutButton)
    
    expect(mockOnLogout).toHaveBeenCalled()
  })

  it('handles undo operation', async () => {
    mockDb.undo.mockReturnValue({ success: true, message: 'Operation undone' })
    
    render(<Dashboard user={mockUser} onLogout={mockOnLogout} />)
    
    const undoButton = screen.getByRole('button', { name: /undo/i })
    fireEvent.click(undoButton)
    
    expect(mockDb.undo).toHaveBeenCalled()
  })

  it('handles redo operation', async () => {
    mockDb.canRedo.mockReturnValue(true)
    mockDb.redo.mockReturnValue({ success: true, message: 'Operation redone' })
    
    render(<Dashboard user={mockUser} onLogout={mockOnLogout} />)
    
    const redoButton = screen.getByRole('button', { name: /redo/i })
    fireEvent.click(redoButton)
    
    expect(mockDb.redo).toHaveBeenCalled()
  })

  it('handles generate dummy data for admin users', () => {
    mockDb.generateDummyData.mockReturnValue({ success: true, message: 'Data generated' })
    
    render(<Dashboard user={mockUser} onLogout={mockOnLogout} />)
    
    const generateButton = screen.getByRole('button', { name: /generate data/i })
    fireEvent.click(generateButton)
    
    expect(mockDb.generateDummyData).toHaveBeenCalled()
  })

  it('does not show generate data button for non-admin users', () => {
    const workerUser = { ...mockUser, role: 'worker' as const }
    
    render(<Dashboard user={workerUser} onLogout={mockOnLogout} />)
    
    expect(screen.queryByRole('button', { name: /generate data/i })).not.toBeInTheDocument()
  })

  it('disables undo button when no operations to undo', () => {
    mockDb.canUndo.mockReturnValue(false)
    
    render(<Dashboard user={mockUser} onLogout={mockOnLogout} />)
    
    const undoButton = screen.getByRole('button', { name: /undo/i })
    expect(undoButton).toBeDisabled()
  })

  it('disables redo button when no operations to redo', () => {
    mockDb.canRedo.mockReturnValue(false)
    
    render(<Dashboard user={mockUser} onLogout={mockOnLogout} />)
    
    const redoButton = screen.getByRole('button', { name: /redo/i })
    expect(redoButton).toBeDisabled()
  })

  it('switches between tabs', async () => {
    render(<Dashboard user={mockUser} onLogout={mockOnLogout} />)
    
    // Initially on overview tab
    expect(screen.getByText('Dashboard Overview')).toBeInTheDocument()
    
    // Switch to inventory tab
    const inventoryTab = screen.getByRole('tab', { name: /inventory/i })
    fireEvent.click(inventoryTab)
    
    await waitFor(() => {
      expect(screen.getByTestId('inventory-tab')).toBeInTheDocument()
    })
  })

  it('shows help section when help button is clicked', () => {
    render(<Dashboard user={mockUser} onLogout={mockOnLogout} />)
    
    const helpButton = screen.getByRole('button', { name: /show help/i })
    fireEvent.click(helpButton)
    
    expect(screen.getByText('📊 Dashboard Features Guide:')).toBeInTheDocument()
    expect(screen.getByText('📈 Key Metrics')).toBeInTheDocument()
    expect(screen.getByText('🔧 Quick Actions')).toBeInTheDocument()
  })

  it('hides help section when hide help button is clicked', () => {
    render(<Dashboard user={mockUser} onLogout={mockOnLogout} />)
    
    // Show help first
    const showHelpButton = screen.getByRole('button', { name: /show help/i })
    fireEvent.click(showHelpButton)
    
    // Then hide it
    const hideHelpButton = screen.getByRole('button', { name: /hide help/i })
    fireEvent.click(hideHelpButton)
    
    expect(screen.queryByText('📊 Dashboard Features Guide:')).not.toBeInTheDocument()
  })

  it('disables tabs based on user permissions', () => {
    vi.mocked(AuthService.canAccess).mockImplementation((resource) => {
      return resource !== 'sales' // Disable sales tab
    })
    
    render(<Dashboard user={mockUser} onLogout={mockOnLogout} />)
    
    const salesTab = screen.getByRole('tab', { name: /sales/i })
    expect(salesTab).toHaveAttribute('data-disabled', 'true')
  })

  it('displays correct role badge styling', () => {
    render(<Dashboard user={mockUser} onLogout={mockOnLogout} />)
    
    const roleBadge = screen.getByText('ADMIN')
    expect(roleBadge.closest('.bg-primary')).toBeInTheDocument()
  })

  it('calculates and displays inventory value correctly', () => {
    render(<Dashboard user={mockUser} onLogout={mockOnLogout} />)
    
    // (10 * 1000) + (2 * 800) = 11,600
    expect(screen.getByText('$11,600 value')).toBeInTheDocument()
  })

  it('calculates and displays revenue correctly', () => {
    render(<Dashboard user={mockUser} onLogout={mockOnLogout} />)
    
    // 1000 + 800 = 1800
    expect(screen.getByText('$1,800 revenue')).toBeInTheDocument()
  })

  it('does not show low stock alert when no items are low', () => {
    mockDb.getLowStockLaptops.mockReturnValue([])
    
    render(<Dashboard user={mockUser} onLogout={mockOnLogout} />)
    
    expect(screen.queryByText('Low Stock Alert')).not.toBeInTheDocument()
  })

  it('shows limited low stock items with more indicator', () => {
    const manyLowStockItems = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      brand: `Brand${i + 1}`,
      model: `Model${i + 1}`,
      quantity: 1
    }))
    
    mockDb.getLowStockLaptops.mockReturnValue(manyLowStockItems)
    
    render(<Dashboard user={mockUser} onLogout={mockOnLogout} />)
    
    expect(screen.getByText('+2 more items')).toBeInTheDocument()
  })

  it('includes theme toggle component', () => {
    render(<Dashboard user={mockUser} onLogout={mockOnLogout} />)
    
    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument()
  })
})