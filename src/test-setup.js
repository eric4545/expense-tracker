import { config } from '@vue/test-utils'

// Global test configuration
config.global.mocks = {
  $router: {
    push: vi.fn(),
    replace: vi.fn()
  },
  $route: {
    params: {},
    path: '/'
  }
}

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(() => null),
    removeItem: vi.fn(() => null),
    clear: vi.fn(() => null),
  },
  writable: true,
})

// Mock navigator.clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn(() => Promise.resolve()),
  },
  writable: true,
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock document.createElement for file download tests
const originalCreateElement = document.createElement
document.createElement = vi.fn((tagName) => {
  if (tagName === 'a') {
    return {
      href: '',
      download: '',
      click: vi.fn(),
      style: { display: '' }
    }
  }
  if (tagName === 'input') {
    return {
      value: '',
      select: vi.fn()
    }
  }
  return originalCreateElement.call(document, tagName)
})

// Mock document.body methods
document.body.appendChild = vi.fn()
document.body.removeChild = vi.fn()

// Mock document.execCommand
document.execCommand = vi.fn(() => true)