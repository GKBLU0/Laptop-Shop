import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ThemeToggle } from './theme-toggle'

// Mock next-themes
const mockSetTheme = vi.fn()
vi.mock('next-themes', () => ({
  useTheme: () => ({
    setTheme: mockSetTheme,
    theme: 'light'
  })
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Sun: ({ className, ...props }: any) => <div data-testid="sun-icon" className={className} {...props} />,
  Moon: ({ className, ...props }: any) => <div data-testid="moon-icon" className={className} {...props} />
}))

describe('ThemeToggle', () => {
  beforeEach(() => {
    mockSetTheme.mockClear()
  })

  it('renders theme toggle button', () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveAttribute('aria-haspopup', 'menu')
  })

  it('displays sun and moon icons', () => {
    render(<ThemeToggle />)
    expect(screen.getByTestId('sun-icon')).toBeInTheDocument()
    expect(screen.getByTestId('moon-icon')).toBeInTheDocument()
  })

  it('has screen reader text', () => {
    render(<ThemeToggle />)
    expect(screen.getByText('Toggle theme')).toBeInTheDocument()
  })

  it('opens dropdown menu when clicked', () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    expect(screen.getByText('Light')).toBeInTheDocument()
    expect(screen.getByText('Dark')).toBeInTheDocument()
    expect(screen.getByText('System')).toBeInTheDocument()
  })

  it('calls setTheme with light when light option is clicked', () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    const lightOption = screen.getByText('Light')
    fireEvent.click(lightOption)
    
    expect(mockSetTheme).toHaveBeenCalledWith('light')
  })

  it('calls setTheme with dark when dark option is clicked', () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    const darkOption = screen.getByText('Dark')
    fireEvent.click(darkOption)
    
    expect(mockSetTheme).toHaveBeenCalledWith('dark')
  })

  it('calls setTheme with system when system option is clicked', () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button')
    fireEvent.click(button)
    
    const systemOption = screen.getByText('System')
    fireEvent.click(systemOption)
    
    expect(mockSetTheme).toHaveBeenCalledWith('system')
  })

  it('applies correct button styling', () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-background')
    expect(button).toHaveClass('hover:bg-accent')
    expect(button).toHaveClass('border-border')
  })
})