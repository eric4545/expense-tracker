import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach } from 'vitest'
import ExpenseTracker from '../src/components/ExpenseTracker.vue'

describe('ExpenseTracker', () => {
  let wrapper

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    wrapper = mount(ExpenseTracker)
  })

  describe('Trip Management', () => {
    it('creates a new trip', async () => {
      await wrapper.setData({ tripName: 'Test Trip' })
      await wrapper.find('button').trigger('click')

      const trips = JSON.parse(localStorage.getItem('trips') || '[]')
      expect(trips.length).toBe(1)
      expect(trips[0].name).toBe('Test Trip')
    })

    it('loads existing trips', async () => {
      const testTrip = {
        id: '123',
        name: 'Test Trip',
        members: ['Alice', 'Bob'],
        expenses: [],
        createdAt: Date.now()
      }
      localStorage.setItem('trips', JSON.stringify([testTrip]))

      await wrapper.vm.loadTripList()
      expect(wrapper.vm.tripList.length).toBe(1)
      expect(wrapper.vm.tripList[0].name).toBe('Test Trip')
    })
  })

  describe('Expense Calculations', () => {
    beforeEach(async () => {
      await wrapper.setData({
        members: ['Alice', 'Bob', 'Charlie'],
        expenses: [
          {
            description: 'Dinner',
            amount: 3000,
            paidBy: 'Alice',
            splitWith: ['Alice', 'Bob', 'Charlie']
          },
          {
            description: 'Taxi',
            amount: 1500,
            paidBy: 'Bob',
            splitWith: ['Bob', 'Charlie']
          }
        ]
      })
    })

    it('calculates total paid correctly', () => {
      expect(wrapper.vm.getTotalPaid('Alice')).toBe(3000)
      expect(wrapper.vm.getTotalPaid('Bob')).toBe(1500)
      expect(wrapper.vm.getTotalPaid('Charlie')).toBe(0)
    })

    it('calculates amount should pay correctly', () => {
      expect(wrapper.vm.getTotalShouldPay('Alice')).toBe(1000) // 3000/3
      expect(wrapper.vm.getTotalShouldPay('Bob')).toBe(1750) // 3000/3 + 1500/2
      expect(wrapper.vm.getTotalShouldPay('Charlie')).toBe(1750) // 3000/3 + 1500/2
    })

    it('calculates balances correctly', () => {
      expect(wrapper.vm.getBalance('Alice')).toBe(2000) // 3000 - 1000
      expect(wrapper.vm.getBalance('Bob')).toBe(-250) // 1500 - 1750
      expect(wrapper.vm.getBalance('Charlie')).toBe(-1750) // 0 - 1750
    })
  })

  describe('Member Management', () => {
    it('adds new members', async () => {
      await wrapper.setData({ newMember: 'Alice' })
      await wrapper.find('.input-group button').trigger('click')

      expect(wrapper.vm.members).toContain('Alice')
    })

    it('prevents duplicate members', async () => {
      await wrapper.setData({
        members: ['Alice'],
        newMember: 'Alice'
      })
      await wrapper.find('.input-group button').trigger('click')

      expect(wrapper.vm.members.length).toBe(1)
    })
  })

  describe('Expense Management', () => {
    it('adds new expense', async () => {
      await wrapper.setData({
        members: ['Alice', 'Bob'],
        newExpense: {
          description: 'Lunch',
          amount: 1000,
          paidBy: 'Alice',
          splitWith: ['Alice', 'Bob'],
          date: '2024-12-21'
        }
      })

      await wrapper.find('.card-body button.btn-success').trigger('click')
      expect(wrapper.vm.expenses.length).toBe(1)
      expect(wrapper.vm.expenses[0].description).toBe('Lunch')
    })

    it('validates expense input', async () => {
      await wrapper.setData({
        newExpense: {
          description: '',
          amount: null,
          paidBy: '',
          splitWith: []
        }
      })

      await wrapper.find('.card-body button.btn-success').trigger('click')
      expect(wrapper.vm.expenses.length).toBe(0)
    })
  })
})