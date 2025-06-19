import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

describe('Alert Components', () => {
  describe('Alert', () => {
    test('should render alert with content', () => {
      render(
        <Alert>
          <div>Alert content</div>
        </Alert>
      )
      
      expect(screen.getByText('Alert content')).toBeInTheDocument()
    })

    test('should apply variant classes correctly', () => {
      const { rerender } = render(
        <Alert variant="destructive" data-testid="alert">
          Content
        </Alert>
      )
      
      let alert = screen.getByTestId('alert')
      expect(alert).toHaveClass('border-destructive/50', 'text-destructive')
      
      rerender(
        <Alert variant="default" data-testid="alert">
          Content
        </Alert>
      )
      alert = screen.getByTestId('alert')
      expect(alert).toHaveClass('bg-background', 'text-foreground')
    })

    test('should apply custom className', () => {
      render(
        <Alert className="custom-alert" data-testid="alert">
          Content
        </Alert>
      )
      
      const alert = screen.getByTestId('alert')
      expect(alert).toHaveClass('custom-alert')
    })

    test('should render with default styling', () => {
      render(
        <Alert data-testid="alert">
          Content
        </Alert>
      )
      
      const alert = screen.getByTestId('alert')
      expect(alert).toHaveClass('relative', 'w-full', 'rounded-lg', 'border')
    })

    test('should have proper ARIA role', () => {
      render(
        <Alert role="alert">
          Important message
        </Alert>
      )
      
      const alert = screen.getByRole('alert')
      expect(alert).toBeInTheDocument()
    })
  })

  describe('AlertTitle', () => {
    test('should render title correctly', () => {
      render(
        <Alert>
          <AlertTitle>Warning</AlertTitle>
        </Alert>
      )
      
      expect(screen.getByText('Warning')).toBeInTheDocument()
    })

    test('should apply title styling', () => {
      render(
        <AlertTitle data-testid="alert-title">
          Error Title
        </AlertTitle>
      )
      
      const title = screen.getByTestId('alert-title')
      expect(title).toHaveClass('mb-1', 'font-medium')
    })

    test('should be a heading element', () => {
      render(
        <AlertTitle>System Alert</AlertTitle>
      )
      
      const title = screen.getByRole('heading', { level: 5 })
      expect(title).toBeInTheDocument()
    })
  })

  describe('AlertDescription', () => {
    test('should render description correctly', () => {
      render(
        <Alert>
          <AlertDescription>
            This is a detailed alert message
          </AlertDescription>
        </Alert>
      )
      
      expect(screen.getByText('This is a detailed alert message')).toBeInTheDocument()
    })

    test('should apply description styling', () => {
      render(
        <AlertDescription data-testid="alert-description">
          Description text
        </AlertDescription>
      )
      
      const description = screen.getByTestId('alert-description')
      expect(description).toHaveClass('text-sm')
    })
  })

  describe('Complete Alert', () => {
    test('should render complete alert with title and description', () => {
      render(
        <Alert>
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>
            Your changes have been saved successfully.
          </AlertDescription>
        </Alert>
      )
      
      expect(screen.getByText('Success')).toBeInTheDocument()
      expect(screen.getByText('Your changes have been saved successfully.')).toBeInTheDocument()
    })

    test('should handle destructive variant', () => {
      render(
        <Alert variant="destructive" data-testid="destructive-alert">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Something went wrong. Please try again.
          </AlertDescription>
        </Alert>
      )
      
      const alert = screen.getByTestId('destructive-alert')
      expect(alert).toHaveClass('border-destructive/50', 'text-destructive')
      expect(screen.getByText('Error')).toBeInTheDocument()
      expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument()
    })

    test('should be accessible with proper structure', () => {
      render(
        <Alert role="alert">
          <AlertTitle>Important Notice</AlertTitle>
          <AlertDescription>
            Please review the following information carefully.
          </AlertDescription>
        </Alert>
      )
      
      const alert = screen.getByRole('alert')
      const title = screen.getByRole('heading')
      
      expect(alert).toBeInTheDocument()
      expect(title).toBeInTheDocument()
      expect(alert).toContainElement(title)
    })

    test('should support icons and additional content', () => {
      render(
        <Alert>
          <div data-testid="alert-icon">⚠️</div>
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>
            Check your input and try again.
          </AlertDescription>
        </Alert>
      )
      
      expect(screen.getByTestId('alert-icon')).toBeInTheDocument()
      expect(screen.getByText('Warning')).toBeInTheDocument()
      expect(screen.getByText('Check your input and try again.')).toBeInTheDocument()
    })

    test('should handle long content gracefully', () => {
      const longMessage = 'This is a very long alert message that should wrap properly and maintain good readability even when the content extends beyond normal line lengths.'
      
      render(
        <Alert data-testid="long-alert">
          <AlertTitle>Long Message Alert</AlertTitle>
          <AlertDescription>
            {longMessage}
          </AlertDescription>
        </Alert>
      )
      
      expect(screen.getByText(longMessage)).toBeInTheDocument()
      const alert = screen.getByTestId('long-alert')
      expect(alert).toBeInTheDocument()
    })
  })
})