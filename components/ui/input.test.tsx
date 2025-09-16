import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Input } from './input'

describe('Input', () => {
  it('renders with default props', () => {
    render(<Input placeholder="Enter text" />)
    const input = screen.getByPlaceholderText('Enter text')
    expect(input).toBeInTheDocument()
  })

  it('applies default classes', () => {
    render(<Input />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('flex')
    expect(input).toHaveClass('h-10')
    expect(input).toHaveClass('w-full')
    expect(input).toHaveClass('rounded-md')
    expect(input).toHaveClass('border')
  })

  it('forwards type prop', () => {
    render(<Input type="email" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('type', 'email')
  })

  it('handles password type', () => {
    render(<Input type="password" />)
    const input = screen.getByLabelText('', { selector: 'input[type="password"]' })
    expect(input).toBeInTheDocument()
  })

  it('handles number type', () => {
    render(<Input type="number" />)
    const input = screen.getByRole('spinbutton')
    expect(input).toHaveAttribute('type', 'number')
  })

  it('applies custom className', () => {
    render(<Input className="custom-input" />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('custom-input')
  })

  it('forwards additional props', () => {
    render(<Input disabled placeholder="Disabled input" />)
    const input = screen.getByPlaceholderText('Disabled input')
    expect(input).toBeDisabled()
  })

  it('handles value changes', () => {
    let value = ''
    render(<Input value={value} onChange={(e) => { value = e.target.value }} />)
    const input = screen.getByRole('textbox')
    
    fireEvent.change(input, { target: { value: 'test value' } })
    expect(value).toBe('test value')
  })

  it('supports ref forwarding', () => {
    let inputRef: HTMLInputElement | null = null
    render(<Input ref={(ref) => { inputRef = ref }} />)
    expect(inputRef).toBeInstanceOf(HTMLInputElement)
  })

  it('handles focus and blur events', () => {
    let focused = false
    let blurred = false
    
    render(
      <Input 
        onFocus={() => { focused = true }}
        onBlur={() => { blurred = true }}
      />
    )
    
    const input = screen.getByRole('textbox')
    fireEvent.focus(input)
    expect(focused).toBe(true)
    
    fireEvent.blur(input)
    expect(blurred).toBe(true)
  })

  it('has correct display name', () => {
    expect(Input.displayName).toBe('Input')
  })

  it('handles required attribute', () => {
    render(<Input required />)
    const input = screen.getByRole('textbox')
    expect(input).toBeRequired()
  })

  it('handles readonly attribute', () => {
    render(<Input readOnly />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('readonly')
  })

  it('handles maxLength attribute', () => {
    render(<Input maxLength={10} />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('maxLength', '10')
  })

  it('handles minLength attribute', () => {
    render(<Input minLength={5} />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('minLength', '5')
  })
})