import { config } from '@vue/test-utils'

// Global test configuration
config.global.mocks = {
  $router: {
    push: vi.fn(),
    replace: vi.fn(),
  },
  $route: {
    params: {},
    path: '/',
  },
}

// Store original createElement before mocking
const originalCreateElement = document.createElement.bind(document)

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

// Mock window.matchMedia - simple but comprehensive mock
window.matchMedia = vi.fn((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}))

// Enhanced createElement mock for file download tests and Vue compatibility
document.createElement = vi.fn((tagName) => {
  const element = originalCreateElement(tagName)

  // Ensure all elements have the methods Vue needs
  if (!element.setAttribute) {
    element.setAttribute = vi.fn()
  }
  if (!element.getAttribute) {
    element.getAttribute = vi.fn()
  }
  if (!element.removeAttribute) {
    element.removeAttribute = vi.fn()
  }
  if (!element.hasAttribute) {
    element.hasAttribute = vi.fn(() => false)
  }
  if (!element.classList) {
    element.classList = {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn(() => false),
      toggle: vi.fn(),
    }
  }

  // Special handling for specific elements
  if (tagName === 'a') {
    element.href = ''
    element.download = ''
    element.click = vi.fn()
    element.style = { display: '' }
  }
  if (tagName === 'input') {
    element.value = ''
    element.select = vi.fn()
  }

  return element
})

// Mock document.body methods
document.body.appendChild = vi.fn()
document.body.removeChild = vi.fn()

// Mock document methods
document.execCommand = vi.fn(() => true)

// Mock window.alert and other dialog methods
window.alert = vi.fn()
window.confirm = vi.fn(() => true)

// Mock HTMLElement methods that Vue might need
if (typeof HTMLElement !== 'undefined') {
  if (!HTMLElement.prototype.click) {
    HTMLElement.prototype.click = vi.fn()
  }
  if (!HTMLElement.prototype.focus) {
    HTMLElement.prototype.focus = vi.fn()
  }
  if (!HTMLElement.prototype.scrollIntoView) {
    HTMLElement.prototype.scrollIntoView = vi.fn()
  }
}
