import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import ExpenseTracker from '../src/components/ExpenseTracker.vue'

// Mock ThemeToggle component
vi.mock('../src/components/ThemeToggle.vue', () => ({
  default: {
    name: 'ThemeToggle',
    template: '<div>Theme Toggle</div>'
  }
}))

describe('ExpenseTracker', () => {
  let wrapper
  let mockRouter
  let mockRoute

  beforeEach(() => {
    // Reset localStorage mock
    localStorage.clear()
    localStorage.getItem.mockClear()
    localStorage.setItem.mockClear()

    // Mock router and route
    mockRouter = {
      push: vi.fn(),
      replace: vi.fn()
    }
    mockRoute = {
      params: {},
      path: '/'
    }

    wrapper = mount(ExpenseTracker, {
      global: {
        mocks: {
          $router: mockRouter,
          $route: mockRoute
        }
      }
    })
  })

  describe('Component Initialization', () => {
    it('should render successfully', () => {
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('h1').text()).toContain('Expense Tracker')
    })

    it('should initialize with default trip name', () => {
      expect(wrapper.vm.tripName).toMatch(/New Trip/)
    })

    it('should load trip list on mount', () => {
      expect(localStorage.getItem).toHaveBeenCalledWith('trips')
    })
  })

  describe('Trip Management', () => {
    it('should generate unique trip IDs', () => {
      const id1 = wrapper.vm.generateTripId()
      const id2 = wrapper.vm.generateTripId()

      expect(id1).toMatch(/^[0-9a-f-]{36}$/)
      expect(id2).toMatch(/^[0-9a-f-]{36}$/)
      expect(id1).not.toBe(id2)
    })

    it('should save trip and update URL', async () => {
      wrapper.vm.tripName = 'Test Trip'
      wrapper.vm.members = ['Alice', 'Bob']

      await wrapper.vm.saveTrip()

      expect(localStorage.setItem).toHaveBeenCalled()
      expect(wrapper.vm.currentTripId).toBeTruthy()
      expect(mockRouter.replace).toHaveBeenCalledWith(`/trip/${wrapper.vm.currentTripId}`)
    })

    it('should navigate when trip selection changes', async () => {
      const tripId = 'test-trip-123'
      wrapper.vm.currentTripId = tripId

      await wrapper.vm.onTripChange()

      expect(mockRouter.push).toHaveBeenCalledWith(`/trip/${tripId}`)
    })

    it('should navigate to home when no trip selected', async () => {
      wrapper.vm.currentTripId = ''

      await wrapper.vm.onTripChange()

      expect(mockRouter.push).toHaveBeenCalledWith('/')
    })
  })

  describe('Route Parameter Handling', () => {
    it('should load trip from routeTripId prop', () => {
      const tripId = 'test-trip-456'
      const mockTripData = {
        id: tripId,
        name: 'Test Trip',
        members: ['Alice', 'Bob'],
        expenses: []
      }

      localStorage.getItem.mockReturnValue(JSON.stringify([mockTripData]))

      const wrapperWithRoute = mount(ExpenseTracker, {
        props: {
          routeTripId: tripId
        },
        global: {
          mocks: {
            $router: mockRouter,
            $route: { params: { tripId } }
          }
        }
      })

      expect(wrapperWithRoute.vm.currentTripId).toBe(tripId)
    })

    it('should handle routeExpenseId prop', () => {
      const expenseId = 'test-expense-789'

      const wrapperWithExpense = mount(ExpenseTracker, {
        props: {
          routeExpenseId: expenseId
        },
        global: {
          mocks: {
            $router: mockRouter,
            $route: { params: { expenseId } }
          }
        }
      })

      expect(wrapperWithExpense.props().routeExpenseId).toBe(expenseId)
    })
  })

  describe('Member Management', () => {
    it('should add new member', async () => {
      wrapper.vm.newMember = 'Charlie'
      await wrapper.vm.addMember()

      expect(wrapper.vm.members).toContain('Charlie')
      expect(wrapper.vm.newMember).toBe('')
    })

    it('should not add duplicate members', async () => {
      wrapper.vm.members = ['Alice']
      wrapper.vm.newMember = 'Alice'

      await wrapper.vm.addMember()

      expect(wrapper.vm.members).toEqual(['Alice'])
    })

    it('should remove member', async () => {
      wrapper.vm.members = ['Alice', 'Bob']

      await wrapper.vm.removeMember('Alice')

      expect(wrapper.vm.members).toEqual(['Bob'])
    })
  })

  describe('Expense Management', () => {
    beforeEach(() => {
      wrapper.vm.members = ['Alice', 'Bob']
      wrapper.vm.newExpense = {
        description: 'Test Expense',
        amount: 100,
        paidBy: ['Alice'],
        paidAmounts: { Alice: 100 },
        splitWith: ['Alice', 'Bob'],
        splitAmounts: { Alice: 50, Bob: 50 },
        date: '2024-01-01'
      }
    })

    it('should add expense with valid data', async () => {
      await wrapper.vm.addExpense()

      expect(wrapper.vm.expenses).toHaveLength(1)
      expect(wrapper.vm.expenses[0].description).toBe('Test Expense')
    })

    it('should not add expense with invalid paid amounts', async () => {
      wrapper.vm.newExpense.paidAmounts = { Alice: 50 } // Should be 100

      // Mock alert
      window.alert = vi.fn()

      await wrapper.vm.addExpense()

      expect(wrapper.vm.expenses).toHaveLength(0)
      expect(window.alert).toHaveBeenCalledWith('Total paid amounts must equal the expense amount')
    })

    it('should remove expense', async () => {
      wrapper.vm.expenses = [{ description: 'Test' }]

      await wrapper.vm.removeExpense(0)

      expect(wrapper.vm.expenses).toHaveLength(0)
    })
  })

  describe('URL Sharing', () => {
    it('should generate correct trip URL', async () => {
      wrapper.vm.currentTripId = 'test-trip-123'

      // Mock clipboard
      navigator.clipboard.writeText = vi.fn().mockResolvedValue()
      window.alert = vi.fn()

      await wrapper.vm.shareViaURL()

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        'http://localhost:3000/expense-tracker/trip/test-trip-123'
      )
      expect(window.alert).toHaveBeenCalledWith('Trip URL copied to clipboard!')
    })
  })

  describe('Calculations', () => {
    beforeEach(() => {
      wrapper.vm.members = ['Alice', 'Bob']
      wrapper.vm.expenses = [
        {
          description: 'Dinner',
          amount: 100,
          paidBy: 'Alice',
          splitWith: ['Alice', 'Bob'],
          splitAmounts: { Alice: 50, Bob: 50 }
        }
      ]
    })

    it('should calculate total paid correctly', () => {
      expect(wrapper.vm.getTotalPaid('Alice')).toBe(100)
      expect(wrapper.vm.getTotalPaid('Bob')).toBe(0)
    })

    it('should calculate total should pay correctly', () => {
      expect(wrapper.vm.getTotalShouldPay('Alice')).toBe(50)
      expect(wrapper.vm.getTotalShouldPay('Bob')).toBe(50)
    })

    it('should calculate balance correctly', () => {
      expect(wrapper.vm.getBalance('Alice')).toBe(50) // Paid 100, should pay 50
      expect(wrapper.vm.getBalance('Bob')).toBe(-50) // Paid 0, should pay 50
    })
  })

  describe('Data Persistence', () => {
    it('should export data correctly', async () => {
      // Mock URL and blob creation
      global.URL.createObjectURL = vi.fn(() => 'blob:url')
      global.URL.revokeObjectURL = vi.fn()

      wrapper.vm.tripList = [{ id: '1', name: 'Test Trip' }]

      await wrapper.vm.exportData()

      expect(document.createElement).toHaveBeenCalledWith('a')
    })

    it('should handle import data', async () => {
      const mockData = {
        tripList: [
          {
            id: 'test-trip',
            name: 'Imported Trip',
            members: ['Alice'],
            expenses: []
          }
        ]
      }

      const mockEvent = {
        target: {
          files: [new File([JSON.stringify(mockData)], 'test.json')],
          value: ''
        }
      }

      // Mock FileReader
      const mockFileReader = {
        readAsText: vi.fn(),
        onload: null,
        result: JSON.stringify(mockData)
      }

      global.FileReader = vi.fn(() => mockFileReader)

      // Call the import function
      wrapper.vm.importData(mockEvent)

      // Simulate file read completion
      mockFileReader.onload({ target: { result: JSON.stringify(mockData) } })

      expect(localStorage.setItem).toHaveBeenCalled()
    })
  })
})