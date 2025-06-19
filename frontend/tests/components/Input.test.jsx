import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '@/components/ui/input'

describe('Input Component', () => {
  test('should render input element', () => {
    render(<Input placeholder="Enter text" />)
    
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
  })

  test('should handle value changes', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    
    render(<Input onChange={handleChange} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, 'Hello World')
    
    expect(handleChange).toHaveBeenCalled()
    expect(input).toHaveValue('Hello World')
  })

  test('should be disabled when disabled prop is true', () => {
    render(<Input disabled />)
    
    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
  })

  test('should apply custom className', () => {
    render(<Input className="custom-input" />)
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('custom-input')
  })

  test('should work with different input types', () => {
    const { rerender } = render(<Input type="email" />)
    
    let input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('type', 'email')
    
    rerender(<Input type="password" />)
    input = screen.getByDisplayValue('')
    expect(input).toHaveAttribute('type', 'password')
    
    rerender(<Input type="number" />)
    input = screen.getByRole('spinbutton')
    expect(input).toHaveAttribute('type', 'number')
  })

  test('should handle maxLength attribute', async () => {
    const user = userEvent.setup()
    render(<Input maxLength={5} />)
    
    const input = screen.getByRole('textbox')
    await user.type(input, '123456789')
    
    expect(input).toHaveValue('12345')
  })

  test('should work with controlled value', () => {
    const { rerender } = render(<Input value="initial" readOnly />)
    
    let input = screen.getByRole('textbox')
    expect(input).toHaveValue('initial')
    
    rerender(<Input value="updated" readOnly />)
    input = screen.getByRole('textbox')
    expect(input).toHaveValue('updated')
  })

  test('should handle focus and blur events', async () => {
    const user = userEvent.setup()
    const handleFocus = vi.fn()
    const handleBlur = vi.fn()
    
    render(<Input onFocus={handleFocus} onBlur={handleBlur} />)
    
    const input = screen.getByRole('textbox')
    
    await user.click(input)
    expect(handleFocus).toHaveBeenCalledTimes(1)
    
    await user.tab()
    expect(handleBlur).toHaveBeenCalledTimes(1)
  })

  test('should be keyboard accessible', async () => {
    const user = userEvent.setup()
    render(<Input />)
    
    const input = screen.getByRole('textbox')
    
    await user.tab()
    expect(input).toHaveFocus()
    
    await user.keyboard('Test input')
    expect(input).toHaveValue('Test input')
  })

  test('should support ARIA attributes', () => {
    render(
      <Input 
        aria-label="Username"
        aria-required="true"
        aria-invalid="false"
      />
    )
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('aria-label', 'Username')
    expect(input).toHaveAttribute('aria-required', 'true')
    expect(input).toHaveAttribute('aria-invalid', 'false')
  })

  test('should handle file input type', () => {
    render(<Input type="file" data-testid="file-input" />)
    
    const input = screen.getByTestId('file-input')
    expect(input).toHaveAttribute('type', 'file')
  })

  test('should render with default styling classes', () => {
    render(<Input />)
    
    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('flex', 'h-10', 'w-full', 'rounded-md')
  })
})