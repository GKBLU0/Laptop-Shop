import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card'

describe('Card Components', () => {
  describe('Card', () => {
    it('renders with default classes', () => {
      render(<Card data-testid="card">Card content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('rounded-lg')
      expect(card).toHaveClass('border')
      expect(card).toHaveClass('bg-card')
      expect(card).toHaveClass('shadow-sm')
    })

    it('applies custom className', () => {
      render(<Card className="custom-card" data-testid="card">Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('custom-card')
    })

    it('forwards props', () => {
      render(<Card id="test-card" data-testid="card">Content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toHaveAttribute('id', 'test-card')
    })

    it('has correct display name', () => {
      expect(Card.displayName).toBe('Card')
    })
  })

  describe('CardHeader', () => {
    it('renders with default classes', () => {
      render(<CardHeader data-testid="header">Header content</CardHeader>)
      const header = screen.getByTestId('header')
      expect(header).toHaveClass('flex')
      expect(header).toHaveClass('flex-col')
      expect(header).toHaveClass('space-y-1.5')
      expect(header).toHaveClass('p-6')
    })

    it('applies custom className', () => {
      render(<CardHeader className="custom-header" data-testid="header">Content</CardHeader>)
      const header = screen.getByTestId('header')
      expect(header).toHaveClass('custom-header')
    })

    it('has correct display name', () => {
      expect(CardHeader.displayName).toBe('CardHeader')
    })
  })

  describe('CardTitle', () => {
    it('renders with default classes', () => {
      render(<CardTitle data-testid="title">Title content</CardTitle>)
      const title = screen.getByTestId('title')
      expect(title).toHaveClass('text-2xl')
      expect(title).toHaveClass('font-semibold')
      expect(title).toHaveClass('leading-none')
      expect(title).toHaveClass('tracking-tight')
    })

    it('applies custom className', () => {
      render(<CardTitle className="custom-title" data-testid="title">Content</CardTitle>)
      const title = screen.getByTestId('title')
      expect(title).toHaveClass('custom-title')
    })

    it('has correct display name', () => {
      expect(CardTitle.displayName).toBe('CardTitle')
    })
  })

  describe('CardDescription', () => {
    it('renders with default classes', () => {
      render(<CardDescription data-testid="description">Description content</CardDescription>)
      const description = screen.getByTestId('description')
      expect(description).toHaveClass('text-sm')
      expect(description).toHaveClass('text-muted-foreground')
    })

    it('applies custom className', () => {
      render(<CardDescription className="custom-desc" data-testid="description">Content</CardDescription>)
      const description = screen.getByTestId('description')
      expect(description).toHaveClass('custom-desc')
    })

    it('has correct display name', () => {
      expect(CardDescription.displayName).toBe('CardDescription')
    })
  })

  describe('CardContent', () => {
    it('renders with default classes', () => {
      render(<CardContent data-testid="content">Content</CardContent>)
      const content = screen.getByTestId('content')
      expect(content).toHaveClass('p-6')
      expect(content).toHaveClass('pt-0')
    })

    it('applies custom className', () => {
      render(<CardContent className="custom-content" data-testid="content">Content</CardContent>)
      const content = screen.getByTestId('content')
      expect(content).toHaveClass('custom-content')
    })

    it('has correct display name', () => {
      expect(CardContent.displayName).toBe('CardContent')
    })
  })

  describe('CardFooter', () => {
    it('renders with default classes', () => {
      render(<CardFooter data-testid="footer">Footer content</CardFooter>)
      const footer = screen.getByTestId('footer')
      expect(footer).toHaveClass('flex')
      expect(footer).toHaveClass('items-center')
      expect(footer).toHaveClass('p-6')
      expect(footer).toHaveClass('pt-0')
    })

    it('applies custom className', () => {
      render(<CardFooter className="custom-footer" data-testid="footer">Content</CardFooter>)
      const footer = screen.getByTestId('footer')
      expect(footer).toHaveClass('custom-footer')
    })

    it('has correct display name', () => {
      expect(CardFooter.displayName).toBe('CardFooter')
    })
  })

  describe('Complete Card Structure', () => {
    it('renders a complete card with all components', () => {
      render(
        <Card data-testid="complete-card">
          <CardHeader>
            <CardTitle>Test Title</CardTitle>
            <CardDescription>Test Description</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Test content</p>
          </CardContent>
          <CardFooter>
            <button>Test Action</button>
          </CardFooter>
        </Card>
      )

      expect(screen.getByTestId('complete-card')).toBeInTheDocument()
      expect(screen.getByText('Test Title')).toBeInTheDocument()
      expect(screen.getByText('Test Description')).toBeInTheDocument()
      expect(screen.getByText('Test content')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Test Action' })).toBeInTheDocument()
    })
  })
})