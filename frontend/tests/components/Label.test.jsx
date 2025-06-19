import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Label } from '@/components/ui/label'

describe('Label Component', () => {
  test('should render label with text', () => {
    render(<Label>Username</Label>)
    
    expect(screen.getByText('Username')).toBeInTheDocument()
  })

  test('should apply htmlFor attribute correctly', () => {
    render(<Label htmlFor="username">Username</Label>)
    
    const label = screen.getByText('Username')
    expect(label).toHaveAttribute('for', 'username')
  })

  test('should apply custom className', () => {
    render(<Label className="custom-label">Username</Label>)
    
    const label = screen.getByText('Username')
    expect(label).toHaveClass('custom-label')
  })

  test('should render with default styling classes', () => {
    render(<Label>Username</Label>)
    
    const label = screen.getByText('Username')
    expect(label).toHaveClass('text-sm', 'font-medium')
  })

  test('should be associated with form control', () => {
    render(
      <div>
        <Label htmlFor="email">Email Address</Label>
        <input id="email" type="email" />
      </div>
    )
    
    const label = screen.getByText('Email Address')
    const input = screen.getByRole('textbox')
    
    expect(label).toHaveAttribute('for', 'email')
    expect(input).toHaveAttribute('id', 'email')
  })

  test('should support required indicator', () => {
    render(<Label>Password <span className="text-red-500">*</span></Label>)
    
    expect(screen.getByText('Password')).toBeInTheDocument()
    expect(screen.getByText('*')).toBeInTheDocument()
    expect(screen.getByText('*')).toHaveClass('text-red-500')
  })

  test('should handle click events', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <Label htmlFor="checkbox">Accept Terms</Label>
        <input id="checkbox" type="checkbox" />
      </div>
    )
    
    const label = screen.getByText('Accept Terms')
    const checkbox = screen.getByRole('checkbox')
    
    // Clicking label should focus/trigger associated input
    await user.click(label)
    expect(checkbox).toHaveFocus()
  })

  test('should support ARIA attributes', () => {
    render(
      <Label 
        htmlFor="password"
        aria-describedby="password-help"
      >
        Password
      </Label>
    )
    
    const label = screen.getByText('Password')
    expect(label).toHaveAttribute('aria-describedby', 'password-help')
  })

  test('should render inline with form controls', () => {
    render(
      <div className="flex items-center space-x-2">
        <input id="remember" type="checkbox" />
        <Label htmlFor="remember">Remember me</Label>
      </div>
    )
    
    const label = screen.getByText('Remember me')
    const checkbox = screen.getByRole('checkbox')
    
    expect(label).toBeInTheDocument()
    expect(checkbox).toBeInTheDocument()
  })

  test('should handle disabled state styling', () => {
    render(
      <Label className="text-muted-foreground cursor-not-allowed">
        Disabled Field
      </Label>
    )
    
    const label = screen.getByText('Disabled Field')
    expect(label).toHaveClass('text-muted-foreground', 'cursor-not-allowed')
  })
})