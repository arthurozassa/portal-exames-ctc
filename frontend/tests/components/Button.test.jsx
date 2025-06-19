import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/button'

describe('Button Component', () => {
  test('should render button with text', () => {
    render(<Button>Click me</Button>)
    
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  test('should handle click events', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    
    render(<Button onClick={handleClick}>Click me</Button>)
    
    await user.click(screen.getByRole('button'))
    
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  test('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled button</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  test('should not call onClick when disabled', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    
    render(<Button disabled onClick={handleClick}>Disabled button</Button>)
    
    await user.click(screen.getByRole('button'))
    
    expect(handleClick).not.toHaveBeenCalled()
  })

  test('should apply variant classes correctly', () => {
    const { rerender } = render(<Button variant="destructive">Button</Button>)
    
    let button = screen.getByRole('button')
    expect(button).toHaveClass('bg-destructive')
    
    rerender(<Button variant="outline">Button</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('border')
    
    rerender(<Button variant="secondary">Button</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('bg-secondary')
  })

  test('should apply size classes correctly', () => {
    const { rerender } = render(<Button size="sm">Button</Button>)
    
    let button = screen.getByRole('button')
    expect(button).toHaveClass('h-9')
    
    rerender(<Button size="lg">Button</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('h-11')
    
    rerender(<Button size="icon">Button</Button>)
    button = screen.getByRole('button')
    expect(button).toHaveClass('h-10', 'w-10')
  })

  test('should apply custom className', () => {
    render(<Button className="custom-class">Button</Button>)
    
    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  test('should work as submit button', () => {
    render(
      <form>
        <Button type="submit">Submit</Button>
      </form>
    )
    
    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('type', 'submit')
  })

  test('should be keyboard accessible', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    
    render(<Button onClick={handleClick}>Button</Button>)
    
    const button = screen.getByRole('button')
    
    // Tab to button
    await user.tab()
    expect(button).toHaveFocus()
    
    // Press Enter
    await user.keyboard('{Enter}')
    expect(handleClick).toHaveBeenCalledTimes(1)
    
    // Press Space
    await user.keyboard(' ')
    expect(handleClick).toHaveBeenCalledTimes(2)
  })

  test('should display loading state if specified', () => {
    render(
      <Button disabled>
        <span data-testid="loading-spinner">Loading...</span>
        Loading
      </Button>
    )
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    expect(screen.getByRole('button')).toBeDisabled()
  })
})