import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ProtectedRoute from '@/components/ProtectedRoute'

// Mock the useAuth hook
const mockUseAuth = vi.fn()
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockUseAuth()
}))

// Mock Navigate component
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    Navigate: ({ to, state }) => {
      mockNavigate(to, state)
      return <div data-testid="navigate-mock">Redirecting to {to}</div>
    }
  }
})

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('should show loading spinner when authentication is loading', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      loading: true
    })

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    const loadingContainer = document.querySelector('.min-h-screen')
    expect(loadingContainer).toBeInTheDocument()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  test('should render loading spinner with correct styling', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      loading: true
    })

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    const loadingContainer = document.querySelector('.min-h-screen')
    expect(loadingContainer).toHaveClass('min-h-screen', 'flex', 'items-center', 'justify-center')
    
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toHaveClass('animate-spin', 'rounded-full', 'h-8', 'w-8', 'border-b-2', 'border-blue-600')
  })

  test('should redirect to login when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      loading: false
    })

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    expect(mockNavigate).toHaveBeenCalledWith('/login', {
      from: expect.objectContaining({
        pathname: '/dashboard'
      })
    })
    
    expect(screen.getByTestId('navigate-mock')).toBeInTheDocument()
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument()
  })

  test('should render children when authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false
    })

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    expect(screen.getByText('Protected content')).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  test('should render complex children when authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false
    })

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>
            <h1>Dashboard</h1>
            <p>Welcome to the protected area</p>
            <button>Click me</button>
          </div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByText('Welcome to the protected area')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  test('should preserve current location for redirect after login', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      loading: false
    })

    render(
      <MemoryRouter initialEntries={['/exams/123']}>
        <ProtectedRoute>
          <div>Exam details</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    expect(mockNavigate).toHaveBeenCalledWith('/login', {
      from: expect.objectContaining({
        pathname: '/exams/123'
      })
    })
  })

  test('should handle search params in location', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      loading: false
    })

    render(
      <MemoryRouter initialEntries={['/dashboard?tab=exams&filter=recent']}>
        <ProtectedRoute>
          <div>Dashboard content</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    expect(mockNavigate).toHaveBeenCalledWith('/login', {
      from: expect.objectContaining({
        pathname: '/dashboard',
        search: '?tab=exams&filter=recent'
      })
    })
  })

  test('should not show loading or redirect when already authenticated', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false
    })

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div data-testid="protected-content">Secret data</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    expect(screen.getByTestId('protected-content')).toBeInTheDocument()
    expect(document.querySelector('.animate-spin')).not.toBeInTheDocument()
    expect(screen.queryByTestId('navigate-mock')).not.toBeInTheDocument()
  })

  test('should handle multiple children', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: false
    })

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <header>Header</header>
          <main>Main content</main>
          <footer>Footer</footer>
        </ProtectedRoute>
      </MemoryRouter>
    )

    expect(screen.getByText('Header')).toBeInTheDocument()
    expect(screen.getByText('Main content')).toBeInTheDocument()
    expect(screen.getByText('Footer')).toBeInTheDocument()
  })

  test('should maintain loading state priority over authentication state', () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      loading: true
    })

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Should not show while loading</div>
        </ProtectedRoute>
      </MemoryRouter>
    )

    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
    expect(screen.queryByText('Should not show while loading')).not.toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})