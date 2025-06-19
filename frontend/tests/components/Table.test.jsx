import { describe, test, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption
} from '@/components/ui/table'

describe('Table Components', () => {
  describe('Table', () => {
    test('should render table element', () => {
      render(
        <Table>
          <tbody>
            <tr>
              <td>Cell content</td>
            </tr>
          </tbody>
        </Table>
      )
      
      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()
      expect(screen.getByText('Cell content')).toBeInTheDocument()
    })

    test('should apply table styling classes', () => {
      render(
        <Table data-testid="table">
          <tbody>
            <tr>
              <td>Content</td>
            </tr>
          </tbody>
        </Table>
      )
      
      const table = screen.getByRole('table')
      expect(table).toHaveClass('w-full', 'caption-bottom', 'text-sm')
    })

    test('should have overflow wrapper', () => {
      render(
        <Table>
          <tbody>
            <tr>
              <td>Content</td>
            </tr>
          </tbody>
        </Table>
      )
      
      const table = screen.getByRole('table')
      const wrapper = table.parentElement
      expect(wrapper).toHaveClass('relative', 'w-full', 'overflow-auto')
    })
  })

  describe('TableHeader', () => {
    test('should render thead element', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      )
      
      const header = screen.getByText('Header').closest('thead')
      expect(header).toBeInTheDocument()
    })

    test('should apply header styling', () => {
      render(
        <Table>
          <TableHeader data-testid="table-header">
            <TableRow>
              <TableHead>Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      )
      
      const header = screen.getByTestId('table-header')
      expect(header).toHaveClass('[&_tr]:border-b')
    })
  })

  describe('TableBody', () => {
    test('should render tbody element', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Body content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
      
      const body = screen.getByText('Body content').closest('tbody')
      expect(body).toBeInTheDocument()
    })

    test('should apply body styling', () => {
      render(
        <Table>
          <TableBody data-testid="table-body">
            <TableRow>
              <TableCell>Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
      
      const body = screen.getByTestId('table-body')
      expect(body).toHaveClass('[&_tr:last-child]:border-0')
    })
  })

  describe('TableFooter', () => {
    test('should render tfoot element', () => {
      render(
        <Table>
          <TableFooter>
            <TableRow>
              <TableCell>Footer content</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      )
      
      const footer = screen.getByText('Footer content').closest('tfoot')
      expect(footer).toBeInTheDocument()
    })

    test('should apply footer styling', () => {
      render(
        <Table>
          <TableFooter data-testid="table-footer">
            <TableRow>
              <TableCell>Footer</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      )
      
      const footer = screen.getByTestId('table-footer')
      expect(footer).toHaveClass('border-t', 'bg-muted/50', 'font-medium')
    })
  })

  describe('TableRow', () => {
    test('should render tr element', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Row content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
      
      const row = screen.getByText('Row content').closest('tr')
      expect(row).toBeInTheDocument()
    })

    test('should apply row styling', () => {
      render(
        <Table>
          <TableBody>
            <TableRow data-testid="table-row">
              <TableCell>Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
      
      const row = screen.getByTestId('table-row')
      expect(row).toHaveClass('border-b', 'transition-colors', 'hover:bg-muted/50')
    })

    test('should support selected state', () => {
      render(
        <Table>
          <TableBody>
            <TableRow data-state="selected" data-testid="selected-row">
              <TableCell>Selected content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
      
      const row = screen.getByTestId('selected-row')
      expect(row).toHaveAttribute('data-state', 'selected')
    })
  })

  describe('TableHead', () => {
    test('should render th element', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Column Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      )
      
      const header = screen.getByRole('columnheader', { name: 'Column Header' })
      expect(header).toBeInTheDocument()
    })

    test('should apply head styling', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead data-testid="table-head">Header</TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      )
      
      const head = screen.getByTestId('table-head')
      expect(head).toHaveClass('h-12', 'px-4', 'text-left', 'align-middle', 'font-medium')
    })

    test('should support sorting indication', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                Name
                <span aria-label="Sort ascending">↑</span>
              </TableHead>
            </TableRow>
          </TableHeader>
        </Table>
      )
      
      expect(screen.getByLabelText('Sort ascending')).toBeInTheDocument()
    })
  })

  describe('TableCell', () => {
    test('should render td element', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>Cell data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
      
      const cell = screen.getByRole('cell', { name: 'Cell data' })
      expect(cell).toBeInTheDocument()
    })

    test('should apply cell styling', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell data-testid="table-cell">Content</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
      
      const cell = screen.getByTestId('table-cell')
      expect(cell).toHaveClass('p-4', 'align-middle')
    })

    test('should support interactive content', () => {
      render(
        <Table>
          <TableBody>
            <TableRow>
              <TableCell>
                <button>Edit</button>
                <a href="#view">View</a>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
      
      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'View' })).toBeInTheDocument()
    })
  })

  describe('TableCaption', () => {
    test('should render caption element', () => {
      render(
        <Table>
          <TableCaption>Table showing exam results</TableCaption>
          <TableBody>
            <TableRow>
              <TableCell>Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
      
      const caption = screen.getByText('Table showing exam results')
      expect(caption.tagName).toBe('CAPTION')
    })

    test('should apply caption styling', () => {
      render(
        <Table>
          <TableCaption data-testid="table-caption">Caption text</TableCaption>
          <TableBody>
            <TableRow>
              <TableCell>Data</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
      
      const caption = screen.getByTestId('table-caption')
      expect(caption).toHaveClass('mt-4', 'text-sm', 'text-muted-foreground')
    })
  })

  describe('Complete Table', () => {
    test('should render complete exam results table', () => {
      render(
        <Table>
          <TableCaption>Recent exam results</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Exam Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>2024-01-15</TableCell>
              <TableCell>Blood Test</TableCell>
              <TableCell>Complete</TableCell>
              <TableCell>
                <button>View</button>
                <button>Download</button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>2024-01-10</TableCell>
              <TableCell>X-Ray</TableCell>
              <TableCell>Pending</TableCell>
              <TableCell>
                <button disabled>View</button>
              </TableCell>
            </TableRow>
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={4}>
                Total: 2 exams
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      )
      
      // Verify table structure
      expect(screen.getByText('Recent exam results')).toBeInTheDocument()
      
      // Verify headers
      expect(screen.getByRole('columnheader', { name: 'Date' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'Exam Type' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument()
      expect(screen.getByRole('columnheader', { name: 'Actions' })).toBeInTheDocument()
      
      // Verify data rows
      expect(screen.getByText('2024-01-15')).toBeInTheDocument()
      expect(screen.getByText('Blood Test')).toBeInTheDocument()
      expect(screen.getByText('Complete')).toBeInTheDocument()
      expect(screen.getByText('X-Ray')).toBeInTheDocument()
      expect(screen.getByText('Pending')).toBeInTheDocument()
      
      // Verify interactive elements
      const viewButtons = screen.getAllByText('View')
      expect(viewButtons).toHaveLength(2)
      expect(viewButtons[1]).toBeDisabled()
      
      expect(screen.getByText('Download')).toBeInTheDocument()
      expect(screen.getByText('Total: 2 exams')).toBeInTheDocument()
    })

    test('should be accessible with proper ARIA attributes', () => {
      render(
        <Table role="table" aria-label="Exam results">
          <TableHeader>
            <TableRow>
              <TableHead scope="col">Date</TableHead>
              <TableHead scope="col">Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>2024-01-15</TableCell>
              <TableCell>Blood Test</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
      
      const table = screen.getByRole('table', { name: 'Exam results' })
      expect(table).toBeInTheDocument()
      
      const headers = screen.getAllByRole('columnheader')
      headers.forEach(header => {
        expect(header).toHaveAttribute('scope', 'col')
      })
    })

    test('should handle empty state', () => {
      render(
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={2} className="text-center">
                No exams found
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )
      
      expect(screen.getByText('No exams found')).toBeInTheDocument()
    })
  })
})