import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import ExpenseTracker from '../src/components/ExpenseTracker.vue'

// Mock ThemeToggle component
vi.mock('../src/components/ThemeToggle.vue', () => ({
  default: {
    name: 'ThemeToggle',
    template: '<div>Theme Toggle</div>',
  },
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
      replace: vi.fn(),
    }
    mockRoute = {
      params: {},
      path: '/',
    }

    wrapper = mount(ExpenseTracker, {
      global: {
        mocks: {
          $router: mockRouter,
          $route: mockRoute,
        },
      },
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
      expect(mockRouter.replace).toHaveBeenCalledWith(
        `/trip/${wrapper.vm.currentTripId}`
      )
    })

    it('should navigate when trip selection changes', async () => {
      const tripId = 'test-trip-123'

      // Set up a spy to watch for router calls
      mockRouter.push.mockClear()

      // Trigger the reactive change by setting currentTripId
      wrapper.vm.currentTripId = tripId

      // Wait for Vue's reactivity to trigger the watcher
      await wrapper.vm.$nextTick()

      expect(mockRouter.push).toHaveBeenCalledWith(`/trip/${tripId}`)
    })

    it('should navigate to home when no trip selected', async () => {
      // First set a trip ID, then clear it to trigger navigation
      wrapper.vm.currentTripId = 'some-trip-id'
      await wrapper.vm.$nextTick()

      // Update mock route to simulate being on a trip page
      mockRoute.path = '/trip/some-trip-id'

      mockRouter.push.mockClear()
      wrapper.vm.currentTripId = ''

      // Wait for Vue's reactivity to trigger the watcher
      await wrapper.vm.$nextTick()

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
        expenses: [],
      }

      localStorage.getItem.mockReturnValue(JSON.stringify([mockTripData]))

      const wrapperWithRoute = mount(ExpenseTracker, {
        props: {
          routeTripId: tripId,
        },
        global: {
          mocks: {
            $router: mockRouter,
            $route: { params: { tripId } },
          },
        },
      })

      expect(wrapperWithRoute.vm.currentTripId).toBe(tripId)
    })

    it('should handle routeExpenseId prop', () => {
      const expenseId = 'test-expense-789'

      const wrapperWithExpense = mount(ExpenseTracker, {
        props: {
          routeExpenseId: expenseId,
        },
        global: {
          mocks: {
            $router: mockRouter,
            $route: { params: { expenseId } },
          },
        },
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
        date: '2024-01-01',
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
      expect(window.alert).toHaveBeenCalledWith(
        'Total paid amounts must equal the expense amount'
      )
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
          splitAmounts: { Alice: 50, Bob: 50 },
        },
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

    describe('Partial Split Amounts', () => {
      beforeEach(() => {
        wrapper.vm.members = ['Alice', 'Bob', 'Charlie']
        wrapper.vm.expenses = [
          {
            description: 'Accommodation',
            amount: 300,
            paidBy: 'Alice',
            splitWith: ['Alice', 'Bob', 'Charlie'],
            splitAmounts: { Alice: 100 }, // Only Alice has a specified amount
          },
        ]
      })

      it('should calculate total should pay correctly with partial split amounts', () => {
        // Alice has specified amount of 100
        expect(wrapper.vm.getTotalShouldPay('Alice')).toBe(100)

        // Bob and Charlie should split the remaining 200 equally (100 each)
        expect(wrapper.vm.getTotalShouldPay('Bob')).toBeCloseTo(100, 2)
        expect(wrapper.vm.getTotalShouldPay('Charlie')).toBeCloseTo(100, 2)

        // Total should equal the expense amount
        const total =
          wrapper.vm.getTotalShouldPay('Alice') +
          wrapper.vm.getTotalShouldPay('Bob') +
          wrapper.vm.getTotalShouldPay('Charlie')
        expect(total).toBe(300)
      })

      it('should calculate getCrossTableAmount correctly with partial split amounts', () => {
        const expense = wrapper.vm.expenses[0]

        expect(wrapper.vm.getCrossTableAmount(expense, 'Alice')).toBe(100)
        expect(wrapper.vm.getCrossTableAmount(expense, 'Bob')).toBeCloseTo(100, 2)
        expect(wrapper.vm.getCrossTableAmount(expense, 'Charlie')).toBeCloseTo(100, 2)
      })

      it('should handle complex scenario with multiple members and partial splits', () => {
        // Simulate a scenario with 13 people where one person has a different split amount
        wrapper.vm.members = [
          'Person1',
          'Person2',
          'Person3',
          'Person4',
          'Person5',
          'Person6',
          'Person7',
          'Person8',
          'Person9',
          'Person10',
          'Person11',
          'Person12',
          'Person13',
        ]
        wrapper.vm.expenses = [
          {
            description: 'Hotel',
            amount: 1300,
            paidBy: ['Person1'],
            paidAmounts: { Person1: 1300 },
            splitWith: [
              'Person1',
              'Person2',
              'Person3',
              'Person4',
              'Person5',
              'Person6',
              'Person7',
              'Person8',
              'Person9',
              'Person10',
              'Person11',
              'Person12',
              'Person13',
            ],
            splitAmounts: { Person12: 200 }, // Person12 has a special rate
            date: '2024-01-01',
          },
          {
            description: 'Museum Tickets',
            amount: 650,
            paidBy: ['Person8'],
            paidAmounts: { Person8: 650 },
            splitWith: [
              'Person1',
              'Person2',
              'Person3',
              'Person4',
              'Person5',
              'Person6',
              'Person7',
              'Person8',
              'Person9',
              'Person10',
              'Person11',
              'Person12',
              'Person13',
            ],
            splitAmounts: { Person12: 50 }, // Person12 has a special rate
            date: '2024-01-01',
          },
        ]

        // Person12 should pay only their specified amounts
        const person12ShouldPay = wrapper.vm.getTotalShouldPay('Person12')
        expect(person12ShouldPay).toBe(250) // 200 + 50

        // Person9 should pay their share of the remaining amounts
        // For Hotel: (1300 - 200) / 12 = 91.67
        // For Museum: (650 - 50) / 12 = 50
        const person9ShouldPay = wrapper.vm.getTotalShouldPay('Person9')
        expect(Math.round(person9ShouldPay * 100) / 100).toBe(
          Math.round((1100 / 12 + 600 / 12) * 100) / 100
        )

        // Verify total adds up correctly
        const totalShouldPay = wrapper.vm.members.reduce(
          (sum, member) => sum + wrapper.vm.getTotalShouldPay(member),
          0
        )
        expect(Math.round(totalShouldPay)).toBe(1300 + 650)
      })

      it('should handle comprehensive real-world scenario with multiple expenses', () => {
        // Set up 13 members
        wrapper.vm.members = [
          'Alice',
          'Bob',
          'Charlie',
          'David',
          'Eve',
          'Frank',
          'Grace',
          'Henry',
          'Iris',
          'Jack',
          'Kate',
          'Leo',
          'Mike',
        ]

        // Alice pays for most expenses
        wrapper.vm.expenses = [
          {
            description: 'Drinks',
            amount: 12754,
            paidBy: ['Alice'],
            paidAmounts: { Alice: 12754 },
            splitWith: [
              'Alice',
              'Bob',
              'Charlie',
              'David',
              'Eve',
              'Grace',
              'Henry',
              'Iris',
              'Jack',
              'Leo',
              'Mike',
            ], // 11 people
            splitAmounts: {
              Alice: 1159,
              Bob: 1159,
              Charlie: 1159,
              David: 1159,
              Eve: 1159,
              Grace: 1159,
              Henry: 1159,
              Iris: 1159,
              Jack: 1159,
              Leo: 1159,
              Mike: 1164,
            },
            date: '2024-01-01',
          },
          {
            description: 'Accommodation',
            amount: 98500,
            paidBy: ['Alice'],
            paidAmounts: { Alice: 98500 },
            splitWith: [
              'Alice',
              'Bob',
              'Charlie',
              'David',
              'Eve',
              'Frank',
              'Grace',
              'Henry',
              'Iris',
              'Jack',
              'Kate',
              'Leo',
              'Mike',
            ], // All 13 people
            splitAmounts: { Leo: 10000 }, // Leo has special amount, rest split equally
            date: '2024-01-01',
          },
          {
            description: 'Groceries',
            amount: 4178,
            paidBy: ['Alice'],
            paidAmounts: { Alice: 4178 },
            splitWith: [
              'Alice',
              'Bob',
              'Charlie',
              'David',
              'Eve',
              'Frank',
              'Grace',
              'Henry',
              'Iris',
              'Jack',
              'Kate',
              'Leo',
              'Mike',
            ],
            splitAmounts: {
              Alice: 321,
              Bob: 321,
              Charlie: 321,
              David: 321,
              Eve: 321,
              Frank: 321,
              Grace: 321,
              Henry: 321,
              Iris: 321,
              Jack: 321,
              Kate: 321,
              Leo: 321,
              Mike: 326,
            },
            date: '2024-01-01',
          },
          {
            description: 'Zoo Tickets',
            amount: 58900,
            paidBy: ['Henry'],
            paidAmounts: { Henry: 58900 },
            splitWith: [
              'Alice',
              'Bob',
              'Charlie',
              'David',
              'Eve',
              'Frank',
              'Grace',
              'Henry',
              'Iris',
              'Jack',
              'Kate',
              'Leo',
              'Mike',
            ],
            splitAmounts: { Leo: 6500 }, // Leo has special amount
            date: '2024-01-01',
          },
          {
            description: 'Ramen',
            amount: 10900,
            paidBy: ['Iris'],
            paidAmounts: { Iris: 10900 },
            splitWith: ['Alice', 'Iris', 'Eve', 'Bob', 'Grace', 'David', 'Leo'], // 7 people
            splitAmounts: {
              Alice: 1557,
              Iris: 1557,
              Eve: 1557,
              Bob: 1557,
              Grace: 1557,
              David: 1557,
              Leo: 1558,
            },
            date: '2024-01-02',
          },
        ]

        // Alice paid: 12754 + 98500 + 4178 = 115432
        const alicePaid = wrapper.vm.getTotalPaid('Alice')
        expect(alicePaid).toBe(115432)

        // Alice should pay:
        // - Drinks: 1159
        // - Accommodation: (98500 - 10000) / 12 = 7375
        // - Groceries: 321
        // - Zoo: (58900 - 6500) / 12 = 4366.67
        // - Ramen: 1557
        // Total: 1159 + 7375 + 321 + 4366.67 + 1557 = 14778.67
        const aliceShouldPay = wrapper.vm.getTotalShouldPay('Alice')
        expect(Math.round(aliceShouldPay)).toBe(
          Math.round(1159 + 7375 + 321 + 4366.67 + 1557),
        )

        // Alice's balance should be: 115432 - 14778.67 = 100653.33
        const aliceBalance = wrapper.vm.getBalance('Alice')
        expect(Math.round(aliceBalance)).toBe(
          Math.round(115432 - (1159 + 7375 + 321 + 4366.67 + 1557)),
        )

        // Leo should pay:
        // - Drinks: 1159
        // - Accommodation: 10000 (special amount)
        // - Groceries: 321
        // - Zoo: 6500 (special amount)
        // - Ramen: 1558
        // Total: 19538
        const leoShouldPay = wrapper.vm.getTotalShouldPay('Leo')
        expect(leoShouldPay).toBe(1159 + 10000 + 321 + 6500 + 1558)

        // Verify all totals add up correctly
        const totalExpenses = 12754 + 98500 + 4178 + 58900 + 10900
        const totalShouldPay = wrapper.vm.members.reduce(
          (sum, member) => sum + wrapper.vm.getTotalShouldPay(member),
          0,
        )
        expect(Math.round(totalShouldPay)).toBe(totalExpenses)
      })
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
            expenses: [],
          },
        ],
      }

      const mockEvent = {
        target: {
          files: [new File([JSON.stringify(mockData)], 'test.json')],
          value: '',
        },
      }

      // Mock FileReader
      const mockFileReader = {
        readAsText: vi.fn(),
        onload: null,
        result: JSON.stringify(mockData),
      }

      global.FileReader = vi.fn(() => mockFileReader)

      // Call the import function
      wrapper.vm.importData(mockEvent)

      // Simulate file read completion
      mockFileReader.onload({ target: { result: JSON.stringify(mockData) } })

      expect(localStorage.setItem).toHaveBeenCalled()
    })
  })

  describe('Multi-Currency Support', () => {
    beforeEach(() => {
      wrapper.vm.tripName = 'Multi-Currency Trip'
      wrapper.vm.baseCurrency = 'JPY'
      wrapper.vm.currencySymbol = '¥'
      wrapper.vm.members = ['Alice', 'Bob', 'Charlie']
    })

    describe('Currency Configuration', () => {
      it('should initialize with default currency (JPY)', () => {
        expect(wrapper.vm.baseCurrency).toBe('JPY')
        expect(wrapper.vm.currencySymbol).toBe('¥')
      })

      it('should allow changing base currency', async () => {
        wrapper.vm.baseCurrency = 'USD'
        wrapper.vm.onBaseCurrencyChange()

        expect(wrapper.vm.currencySymbol).toBe('$')
        expect(wrapper.vm.newExpense.currency).toBe('USD')
      })

      it('should include currency fields in saved trip', async () => {
        wrapper.vm.tripName = 'USD Trip'
        wrapper.vm.baseCurrency = 'USD'
        wrapper.vm.currencySymbol = '$'
        await wrapper.vm.saveTrip()

        // Get the last setItem call (most recent save)
        const lastCallIndex = localStorage.setItem.mock.calls.length - 1
        const savedData = JSON.parse(localStorage.setItem.mock.calls[lastCallIndex][1])
        const savedTrip = savedData[savedData.length - 1]

        expect(savedTrip.baseCurrency).toBe('USD')
        expect(savedTrip.currencySymbol).toBe('$')
      })
    })

    describe('Base Amount Calculation', () => {
      it('should return amount when no exchange rate', () => {
        const expense = { amount: 100 }
        expect(wrapper.vm.getBaseAmount(expense)).toBe(100)
      })

      it('should use baseAmount if available', () => {
        const expense = { amount: 100, exchangeRate: 20, baseAmount: 2000 }
        expect(wrapper.vm.getBaseAmount(expense)).toBe(2000)
      })

      it('should calculate baseAmount from exchangeRate', () => {
        const expense = { amount: 500, exchangeRate: 20 }
        expect(wrapper.vm.getBaseAmount(expense)).toBe(10000)
      })

      it('should handle exchange rate of 1', () => {
        const expense = { amount: 100, exchangeRate: 1 }
        expect(wrapper.vm.getBaseAmount(expense)).toBe(100)
      })
    })

    describe('Exchange Rate Input - Manual Mode', () => {
      it('should calculate baseAmount when manual rate changes', () => {
        wrapper.vm.newExpense.amount = 500
        wrapper.vm.newExpense.manualRate = 20
        wrapper.vm.onManualRateChange()

        expect(wrapper.vm.newExpense.exchangeRate).toBe(20)
        expect(wrapper.vm.newExpense.baseAmount).toBe(10000)
      })

      it('should handle decimal exchange rates', () => {
        wrapper.vm.newExpense.amount = 100
        wrapper.vm.newExpense.manualRate = 0.05
        wrapper.vm.onManualRateChange()

        expect(wrapper.vm.newExpense.exchangeRate).toBe(0.05)
        expect(wrapper.vm.newExpense.baseAmount).toBe(5)
      })
    })

    describe('Exchange Rate Input - Calculate Mode', () => {
      it('should calculate exchange rate from two amounts', () => {
        wrapper.vm.newExpense.foreignAmount = 500
        wrapper.vm.newExpense.calculatedBaseAmount = 10000
        wrapper.vm.onForeignAmountChange()

        expect(wrapper.vm.newExpense.exchangeRate).toBe(20)
        expect(wrapper.vm.newExpense.amount).toBe(500)
        expect(wrapper.vm.newExpense.baseAmount).toBe(10000)
      })

      it('should update when base amount changes', () => {
        wrapper.vm.newExpense.foreignAmount = 500
        wrapper.vm.newExpense.calculatedBaseAmount = 15000
        wrapper.vm.onCalculatedBaseAmountChange()

        expect(wrapper.vm.newExpense.exchangeRate).toBe(30)
        expect(wrapper.vm.newExpense.amount).toBe(500)
        expect(wrapper.vm.newExpense.baseAmount).toBe(15000)
      })

      it('should handle fractional exchange rates', () => {
        wrapper.vm.newExpense.foreignAmount = 1000
        wrapper.vm.newExpense.calculatedBaseAmount = 850
        wrapper.vm.onCalculatedBaseAmountChange()

        expect(wrapper.vm.newExpense.exchangeRate).toBe(0.85)
      })
    })

    describe('Expense Addition with Foreign Currency', () => {
      it('should add expense in foreign currency with correct base amount', async () => {
        wrapper.vm.newExpense = {
          description: 'Hong Kong Dinner',
          amount: 500,
          paidBy: ['Alice'],
          paidAmounts: { Alice: 500 },
          splitWith: ['Alice', 'Bob', 'Charlie'],
          splitAmounts: {},
          date: '2024-01-01',
          currency: 'HKD',
          exchangeRate: 20,
          baseAmount: 10000,
          useCustomCurrency: true,
        }

        await wrapper.vm.addExpense()

        expect(wrapper.vm.expenses.length).toBe(1)
        const expense = wrapper.vm.expenses[0]
        expect(expense.currency).toBe('HKD')
        expect(expense.exchangeRate).toBe(20)
        expect(expense.baseAmount).toBe(10000)
        expect(expense.amount).toBe(500)
      })

      it('should default to base currency when not using custom currency', async () => {
        wrapper.vm.newExpense = {
          description: 'Local Expense',
          amount: 3000,
          paidBy: ['Bob'],
          paidAmounts: { Bob: 3000 },
          splitWith: ['Alice', 'Bob'],
          splitAmounts: {},
          date: '2024-01-01',
          useCustomCurrency: false,
        }

        await wrapper.vm.addExpense()

        const expense = wrapper.vm.expenses[0]
        expect(expense.currency).toBe('JPY')
        expect(expense.exchangeRate).toBe(1)
        expect(expense.baseAmount).toBe(3000)
      })
    })

    describe('Multi-Currency Calculations', () => {
      beforeEach(() => {
        wrapper.vm.baseCurrency = 'JPY'
        wrapper.vm.expenses = [
          {
            description: 'Hotel in HK',
            amount: 500,
            paidBy: 'Alice',
            splitWith: ['Alice', 'Bob', 'Charlie'],
            splitAmounts: {},
            currency: 'HKD',
            exchangeRate: 20,
            baseAmount: 10000,
          },
          {
            description: 'Train in Tokyo',
            amount: 3000,
            paidBy: 'Bob',
            splitWith: ['Alice', 'Bob', 'Charlie'],
            splitAmounts: {},
            currency: 'JPY',
            exchangeRate: 1,
            baseAmount: 3000,
          },
          {
            description: 'Dinner in USD',
            amount: 100,
            paidBy: 'Charlie',
            splitWith: ['Alice', 'Bob', 'Charlie'],
            splitAmounts: {},
            currency: 'USD',
            exchangeRate: 150,
            baseAmount: 15000,
          },
        ]
      })

      it('should calculate total paid in base currency', () => {
        expect(wrapper.vm.getTotalPaid('Alice')).toBe(10000)
        expect(wrapper.vm.getTotalPaid('Bob')).toBe(3000)
        expect(wrapper.vm.getTotalPaid('Charlie')).toBe(15000)
      })

      it('should calculate total should pay in base currency', () => {
        const total = 10000 + 3000 + 15000
        const expectedPerPerson = total / 3

        expect(wrapper.vm.getTotalShouldPay('Alice')).toBeCloseTo(expectedPerPerson, 2)
        expect(wrapper.vm.getTotalShouldPay('Bob')).toBeCloseTo(expectedPerPerson, 2)
        expect(wrapper.vm.getTotalShouldPay('Charlie')).toBeCloseTo(expectedPerPerson, 2)
      })

      it('should calculate correct balances', () => {
        const totalExpenses = 10000 + 3000 + 15000
        const perPerson = totalExpenses / 3

        const aliceBalance = 10000 - perPerson
        const bobBalance = 3000 - perPerson
        const charlieBalance = 15000 - perPerson

        expect(wrapper.vm.getBalance('Alice')).toBeCloseTo(aliceBalance, 2)
        expect(wrapper.vm.getBalance('Bob')).toBeCloseTo(bobBalance, 2)
        expect(wrapper.vm.getBalance('Charlie')).toBeCloseTo(charlieBalance, 2)
      })

      it('should generate correct payment plan with multi-currency', () => {
        const payments = wrapper.vm.getPaymentPlan()

        expect(payments.length).toBeGreaterThan(0)

        // Verify all payments are positive
        payments.forEach(payment => {
          expect(payment.amount).toBeGreaterThan(0)
        })
      })
    })

    describe('Multi-Currency with Custom Split Amounts', () => {
      it('should handle custom split amounts proportionally', () => {
        wrapper.vm.expenses = [
          {
            description: 'Hotel',
            amount: 600,
            paidBy: 'Alice',
            splitWith: ['Alice', 'Bob', 'Charlie'],
            splitAmounts: { Alice: 300, Bob: 200, Charlie: 100 },
            currency: 'HKD',
            exchangeRate: 20,
            baseAmount: 12000,
          },
        ]

        // Alice should pay: 300/600 * 12000 = 6000
        // Bob should pay: 200/600 * 12000 = 4000
        // Charlie should pay: 100/600 * 12000 = 2000

        expect(wrapper.vm.getTotalShouldPay('Alice')).toBeCloseTo(6000, 2)
        expect(wrapper.vm.getTotalShouldPay('Bob')).toBeCloseTo(4000, 2)
        expect(wrapper.vm.getTotalShouldPay('Charlie')).toBeCloseTo(2000, 2)
      })
    })

    describe('Multi-Payer with Foreign Currency', () => {
      it('should handle multiple payers with foreign currency', () => {
        wrapper.vm.expenses = [
          {
            description: 'Shared expense',
            amount: 200,
            paidBy: ['Alice', 'Bob'],
            paidAmounts: { Alice: 100, Bob: 100 },
            splitWith: ['Alice', 'Bob', 'Charlie'],
            splitAmounts: {},
            currency: 'USD',
            exchangeRate: 150,
            baseAmount: 30000,
          },
        ]

        // Alice paid 100/200 * 30000 = 15000 JPY
        // Bob paid 100/200 * 30000 = 15000 JPY
        expect(wrapper.vm.getTotalPaid('Alice')).toBe(15000)
        expect(wrapper.vm.getTotalPaid('Bob')).toBe(15000)
        expect(wrapper.vm.getTotalPaid('Charlie')).toBe(0)

        // Each should pay 30000/3 = 10000 JPY
        expect(wrapper.vm.getTotalShouldPay('Alice')).toBe(10000)
        expect(wrapper.vm.getTotalShouldPay('Bob')).toBe(10000)
        expect(wrapper.vm.getTotalShouldPay('Charlie')).toBe(10000)

        // Balances: Alice +5000, Bob +5000, Charlie -10000
        expect(wrapper.vm.getBalance('Alice')).toBe(5000)
        expect(wrapper.vm.getBalance('Bob')).toBe(5000)
        expect(wrapper.vm.getBalance('Charlie')).toBe(-10000)
      })
    })

    describe('Backward Compatibility', () => {
      it('should handle legacy expenses without currency fields', () => {
        wrapper.vm.baseCurrency = 'JPY'
        wrapper.vm.expenses = [
          {
            description: 'Old Expense',
            amount: 5000,
            paidBy: 'Alice',
            splitWith: ['Alice', 'Bob'],
            splitAmounts: {},
          },
        ]

        // Should treat as JPY with rate 1
        expect(wrapper.vm.getBaseAmount(wrapper.vm.expenses[0])).toBe(5000)
        expect(wrapper.vm.getTotalPaid('Alice')).toBe(5000)
        expect(wrapper.vm.getTotalShouldPay('Alice')).toBe(2500)
        expect(wrapper.vm.getTotalShouldPay('Bob')).toBe(2500)
      })

      it('should migrate legacy trip on load', () => {
        const legacyTrip = {
          id: 'legacy-trip',
          name: 'Old Trip',
          members: ['Alice', 'Bob'],
          expenses: [
            {
              description: 'Expense 1',
              amount: 1000,
              paidBy: 'Alice',
              splitWith: ['Alice', 'Bob'],
              splitAmounts: {},
            },
          ],
        }

        wrapper.vm.tripList = [legacyTrip]
        wrapper.vm.currentTripId = 'legacy-trip'
        wrapper.vm.loadTrip()

        // Should have default currency
        expect(wrapper.vm.baseCurrency).toBe('JPY')
        expect(wrapper.vm.currencySymbol).toBe('¥')

        // Expenses should be migrated
        expect(wrapper.vm.expenses[0].currency).toBe('JPY')
        expect(wrapper.vm.expenses[0].exchangeRate).toBe(1)
        expect(wrapper.vm.expenses[0].baseAmount).toBe(1000)
      })
    })

    describe('Real-World Scenario: Japan-Hong Kong Trip', () => {
      it('should handle complex multi-currency trip correctly', () => {
        wrapper.vm.baseCurrency = 'JPY'
        wrapper.vm.members = ['Alice', 'Bob', 'Charlie']
        wrapper.vm.expenses = [
          {
            description: 'Flight tickets (paid in Tokyo)',
            amount: 30000,
            paidBy: 'Alice',
            splitWith: ['Alice', 'Bob', 'Charlie'],
            splitAmounts: {},
            currency: 'JPY',
            exchangeRate: 1,
            baseAmount: 30000,
          },
          {
            description: 'Hotel in Hong Kong',
            amount: 1500,
            paidBy: 'Bob',
            splitWith: ['Alice', 'Bob', 'Charlie'],
            splitAmounts: {},
            currency: 'HKD',
            exchangeRate: 19.5,
            baseAmount: 29250,
          },
          {
            description: 'Dinner in Hong Kong',
            amount: 800,
            paidBy: 'Charlie',
            splitWith: ['Alice', 'Bob', 'Charlie'],
            splitAmounts: {},
            currency: 'HKD',
            exchangeRate: 19.5,
            baseAmount: 15600,
          },
          {
            description: 'Shopping in Tokyo',
            amount: 15000,
            paidBy: ['Alice', 'Bob'],
            paidAmounts: { Alice: 8000, Bob: 7000 },
            splitWith: ['Alice', 'Bob'],
            splitAmounts: {},
            currency: 'JPY',
            exchangeRate: 1,
            baseAmount: 15000,
          },
        ]

        const totalExpenses = 30000 + 29250 + 15600 + 15000 // 89850 JPY

        // Alice paid: 30000 + (8000/15000)*15000 = 38000 JPY
        // Bob paid: (7000/15000)*15000 + 29250 = 36250 JPY
        // Charlie paid: 15600 JPY

        expect(wrapper.vm.getTotalPaid('Alice')).toBeCloseTo(38000, 0)
        expect(wrapper.vm.getTotalPaid('Bob')).toBeCloseTo(36250, 0)
        expect(wrapper.vm.getTotalPaid('Charlie')).toBeCloseTo(15600, 0)

        // Should pay:
        // Flights split 3 ways: 30000/3 = 10000 each
        // Hotel split 3 ways: 29250/3 = 9750 each
        // Dinner split 3 ways: 15600/3 = 5200 each
        // Shopping split 2 ways (Alice, Bob): 15000/2 = 7500 each

        // Alice: 10000 + 9750 + 5200 + 7500 = 32450
        // Bob: 10000 + 9750 + 5200 + 7500 = 32450
        // Charlie: 10000 + 9750 + 5200 = 24950

        expect(wrapper.vm.getTotalShouldPay('Alice')).toBeCloseTo(32450, 0)
        expect(wrapper.vm.getTotalShouldPay('Bob')).toBeCloseTo(32450, 0)
        expect(wrapper.vm.getTotalShouldPay('Charlie')).toBeCloseTo(24950, 0)

        // Balances
        expect(wrapper.vm.getBalance('Alice')).toBeCloseTo(5550, 0)
        expect(wrapper.vm.getBalance('Bob')).toBeCloseTo(3800, 0)
        expect(wrapper.vm.getBalance('Charlie')).toBeCloseTo(-9350, 0)

        // Payment plan should have Charlie paying Alice and Bob
        const payments = wrapper.vm.getPaymentPlan()
        expect(payments.length).toBeGreaterThan(0)

        const charliePayments = payments.filter(p => p.from === 'Charlie')
        expect(charliePayments.length).toBeGreaterThan(0)
      })
    })
  })
})
