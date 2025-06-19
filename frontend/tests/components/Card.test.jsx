import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter 
} from '@/components/ui/card'

describe('Card Components', () => {
  describe('Card', () => {
    test('should render card container', () => {
      render(
        <Card data-testid="card">
          <div>Card content</div>
        </Card>
      )
      
      const card = screen.getByTestId('card')
      expect(card).toBeInTheDocument()
      expect(screen.getByText('Card content')).toBeInTheDocument()
    })

    test('should apply default styling classes', () => {
      render(
        <Card data-testid="card">
          Content
        </Card>
      )
      
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('rounded-lg', 'border', 'bg-card', 'shadow-sm')
    })

    test('should apply custom className', () => {
      render(
        <Card className="custom-card" data-testid="card">
          Content
        </Card>
      )
      
      const card = screen.getByTestId('card')
      expect(card).toHaveClass('custom-card')
    })

    test('should forward additional props', () => {
      render(
        <Card data-testid="card" id="test-card" role="region">
          Content
        </Card>
      )
      
      const card = screen.getByTestId('card')
      expect(card).toHaveAttribute('id', 'test-card')
      expect(card).toHaveAttribute('role', 'region')
    })
  })

  describe('CardHeader', () => {
    test('should render card header', () => {
      render(
        <CardHeader data-testid="card-header">
          <div>Header content</div>
        </CardHeader>
      )
      
      const header = screen.getByTestId('card-header')
      expect(header).toBeInTheDocument()
      expect(screen.getByText('Header content')).toBeInTheDocument()
    })

    test('should apply header styling', () => {
      render(
        <CardHeader data-testid="card-header">
          Header
        </CardHeader>
      )
      
      const header = screen.getByTestId('card-header')
      expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6')
    })
  })

  describe('CardTitle', () => {
    test('should render as h3 element', () => {
      render(
        <CardTitle>Card Title</CardTitle>
      )
      
      const title = screen.getByRole('heading', { level: 3 })
      expect(title).toBeInTheDocument()
      expect(title).toHaveTextContent('Card Title')
    })

    test('should apply title styling', () => {
      render(
        <CardTitle data-testid="card-title">
          Title
        </CardTitle>
      )
      
      const title = screen.getByTestId('card-title')
      expect(title).toHaveClass('text-2xl', 'font-semibold', 'leading-none')
    })

    test('should support custom className', () => {
      render(
        <CardTitle className="custom-title" data-testid="card-title">
          Title
        </CardTitle>
      )
      
      const title = screen.getByTestId('card-title')
      expect(title).toHaveClass('custom-title')
    })
  })

  describe('CardDescription', () => {
    test('should render description text', () => {
      render(
        <CardDescription>
          This is a card description
        </CardDescription>
      )
      
      expect(screen.getByText('This is a card description')).toBeInTheDocument()
    })

    test('should apply description styling', () => {
      render(
        <CardDescription data-testid="card-description">
          Description
        </CardDescription>
      )
      
      const description = screen.getByTestId('card-description')
      expect(description).toHaveClass('text-sm', 'text-muted-foreground')
    })

    test('should be a paragraph element', () => {
      render(
        <CardDescription>Description text</CardDescription>
      )
      
      const description = screen.getByText('Description text')
      expect(description.tagName).toBe('P')
    })
  })

  describe('CardContent', () => {
    test('should render card content', () => {
      render(
        <CardContent data-testid="card-content">
          <p>Main content here</p>
        </CardContent>
      )
      
      const content = screen.getByTestId('card-content')
      expect(content).toBeInTheDocument()
      expect(screen.getByText('Main content here')).toBeInTheDocument()
    })

    test('should apply content styling', () => {
      render(
        <CardContent data-testid="card-content">
          Content
        </CardContent>
      )
      
      const content = screen.getByTestId('card-content')
      expect(content).toHaveClass('p-6', 'pt-0')
    })
  })

  describe('CardFooter', () => {
    test('should render card footer', () => {
      render(
        <CardFooter data-testid="card-footer">
          <button>Action</button>
        </CardFooter>
      )
      
      const footer = screen.getByTestId('card-footer')
      expect(footer).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument()
    })

    test('should apply footer styling', () => {
      render(
        <CardFooter data-testid="card-footer">
          Footer
        </CardFooter>
      )
      
      const footer = screen.getByTestId('card-footer')
      expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0')
    })
  })

  describe('Complete Card', () => {
    test('should render complete card with all components', () => {
      render(
        <Card data-testid="complete-card">
          <CardHeader>
            <CardTitle>Exam Results</CardTitle>
            <CardDescription>
              Your recent test results are available
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Test content goes here</p>
          </CardContent>
          <CardFooter>
            <button>View Details</button>
            <button>Download PDF</button>
          </CardFooter>
        </Card>
      )
      
      // Verify all parts are rendered
      expect(screen.getByTestId('complete-card')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: 'Exam Results' })).toBeInTheDocument()
      expect(screen.getByText('Your recent test results are available')).toBeInTheDocument()
      expect(screen.getByText('Test content goes here')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'View Details' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Download PDF' })).toBeInTheDocument()
    })

    test('should maintain proper semantic structure', () => {
      render(
        <Card role="article">
          <CardHeader>
            <CardTitle>Article Title</CardTitle>
            <CardDescription>Article subtitle</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Article content</p>
          </CardContent>
        </Card>
      )
      
      const card = screen.getByRole('article')
      const title = screen.getByRole('heading')
      
      expect(card).toContainElement(title)
      expect(card).toBeInTheDocument()
    })

    test('should support nested interactive elements', () => {
      render(
        <Card>
          <CardContent>
            <form>
              <input type="text" placeholder="Search" />
              <button type="submit">Search</button>
            </form>
          </CardContent>
          <CardFooter>
            <a href="#link">Learn more</a>
          </CardFooter>
        </Card>
      )
      
      expect(screen.getByPlaceholderText('Search')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Learn more' })).toBeInTheDocument()
    })
  })
})