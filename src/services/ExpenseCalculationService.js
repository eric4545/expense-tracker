/**
 * ExpenseCalculationService - Handles all expense-related calculations
 * Single Responsibility: Settlement calculations, balances, payment plans
 */

import * as CurrencyService from './CurrencyService.js'

/**
 * Calculate total amount paid by a member (in base currency)
 * @param {Array} expenses - List of expenses
 * @param {string} member - Member name
 * @returns {number} Total paid in base currency
 */
export function getTotalPaid(expenses, member) {
  return expenses.reduce((sum, expense) => {
    const baseAmount = CurrencyService.getExpenseBaseAmount(expense)

    if (Array.isArray(expense.paidBy)) {
      // Multi-payer: convert proportionally
      if (expense.paidAmounts[member]) {
        const paidRatio = expense.paidAmounts[member] / expense.amount
        return sum + baseAmount * paidRatio
      }
      return sum
    }

    if (expense.paidBy === member) {
      // Single payer
      return sum + baseAmount
    }

    return sum
  }, 0)
}

/**
 * Calculate total amount a member should pay (in base currency)
 * @param {Array} expenses - List of expenses
 * @param {string} member - Member name
 * @returns {number} Total should pay in base currency
 */
export function getTotalShouldPay(expenses, member) {
  let total = 0

  for (const expense of expenses) {
    const baseAmount = CurrencyService.getExpenseBaseAmount(expense)

    if (expense.splitWith.includes(member)) {
      if (expense.splitAmounts?.[member]) {
        // Convert split amount proportionally to base currency
        const splitRatio = expense.splitAmounts[member] / expense.amount
        total += baseAmount * splitRatio
      } else {
        // Calculate remaining amount after specified splits
        const specifiedTotal = Object.values(expense.splitAmounts || {}).reduce(
          (sum, amount) => sum + amount,
          0
        )
        const specifiedRatio = specifiedTotal / expense.amount
        const remainingAmount = baseAmount * (1 - specifiedRatio)
        const membersWithoutSpecifiedAmount = expense.splitWith.filter(
          (m) => !expense.splitAmounts?.[m]
        ).length

        if (membersWithoutSpecifiedAmount > 0) {
          total += remainingAmount / membersWithoutSpecifiedAmount
        } else {
          // Fallback: equal split
          total += baseAmount / expense.splitWith.length
        }
      }
    }
  }

  return total
}

/**
 * Calculate balance for a member
 * @param {Array} expenses - List of expenses
 * @param {string} member - Member name
 * @returns {number} Balance (positive = owed, negative = owes)
 */
export function getBalance(expenses, member) {
  const paid = getTotalPaid(expenses, member)
  const shouldPay = getTotalShouldPay(expenses, member)
  return Math.round((paid - shouldPay) * 100) / 100
}

/**
 * Calculate balances for all members
 * @param {Array} expenses - List of expenses
 * @param {Array} members - List of member names
 * @returns {Object} Map of member -> balance
 */
export function getAllBalances(expenses, members) {
  const balances = {}
  for (const member of members) {
    balances[member] = getBalance(expenses, member)
  }
  return balances
}

/**
 * Generate optimized payment plan
 * @param {Array} expenses - List of expenses
 * @param {Array} members - List of member names
 * @returns {Array} List of {from, to, amount} payments
 */
export function getPaymentPlan(expenses, members) {
  const payments = []
  const balances = getAllBalances(expenses, members)

  // Sort creditors (positive balance) and debtors (negative balance)
  const creditors = [...members]
    .filter((m) => balances[m] > 0)
    .sort((a, b) => balances[b] - balances[a])

  const debtors = [...members]
    .filter((m) => balances[m] < 0)
    .sort((a, b) => balances[a] - balances[b]) // Most negative first

  // Greedy algorithm to minimize transactions
  for (const debtor of debtors) {
    let remainingDebt = Math.abs(balances[debtor])

    for (const creditor of creditors) {
      if (remainingDebt > 0 && balances[creditor] > 0) {
        const amount = Math.min(remainingDebt, balances[creditor])

        if (amount > 0.01) {
          // Only add payments greater than 1 cent
          payments.push({
            from: debtor,
            to: creditor,
            amount: Math.round(amount * 100) / 100,
          })
          remainingDebt -= amount
          balances[creditor] -= amount
        }
      }
    }
  }

  return payments.sort((a, b) => b.amount - a.amount) // Sort by amount descending
}

/**
 * Calculate total expenses (in base currency)
 * @param {Array} expenses - List of expenses
 * @returns {number} Total expenses
 */
export function getTotalExpenses(expenses) {
  return expenses.reduce((sum, expense) => {
    return sum + CurrencyService.getExpenseBaseAmount(expense)
  }, 0)
}

/**
 * Calculate cross-table amount for a member in an expense
 * @param {Object} expense - Expense object
 * @param {string} member - Member name
 * @returns {number} Amount member should pay
 */
export function getCrossTableAmount(expense, member) {
  if (!expense.splitWith.includes(member)) return 0

  const baseAmount = CurrencyService.getExpenseBaseAmount(expense)

  if (expense.splitAmounts?.[member]) {
    // Convert split amount proportionally
    const splitRatio = expense.splitAmounts[member] / expense.amount
    return baseAmount * splitRatio
  }

  // Calculate remaining amount
  const specifiedTotal = Object.values(expense.splitAmounts || {}).reduce(
    (sum, amount) => sum + amount,
    0
  )
  const specifiedRatio = specifiedTotal / expense.amount
  const remainingAmount = baseAmount * (1 - specifiedRatio)
  const membersWithoutSpecifiedAmount = expense.splitWith.filter(
    (m) => !expense.splitAmounts?.[m]
  ).length

  if (membersWithoutSpecifiedAmount > 0) {
    return remainingAmount / membersWithoutSpecifiedAmount
  }

  return baseAmount / expense.splitWith.length
}

/**
 * Calculate how much payer paid for receiver
 * @param {Array} expenses - List of expenses
 * @param {string} payer - Payer name
 * @param {string} receiver - Receiver name
 * @returns {number} Amount paid for receiver
 */
export function getCrossPaidAmount(expenses, payer, receiver) {
  if (payer === receiver) return 0

  return expenses.reduce((sum, expense) => {
    if (expense.paidBy === payer && expense.splitWith.includes(receiver)) {
      return sum + getCrossTableAmount(expense, receiver)
    }
    return sum
  }, 0)
}

/**
 * Validate expense amounts
 * @param {Object} expense - Expense to validate
 * @returns {Object} {valid: boolean, error: string}
 */
export function validateExpense(expense) {
  if (!expense.description) {
    return { valid: false, error: 'Description is required' }
  }

  if (!expense.amount || expense.amount <= 0) {
    return { valid: false, error: 'Amount must be greater than 0' }
  }

  if (expense.paidBy.length === 0) {
    return { valid: false, error: 'At least one payer is required' }
  }

  if (expense.splitWith.length === 0) {
    return {
      valid: false,
      error: 'At least one person to split with is required',
    }
  }

  // Verify total paid amounts match expense amount
  const totalPaid = Object.values(expense.paidAmounts).reduce(
    (sum, amount) => sum + amount,
    0
  )

  if (Math.abs(totalPaid - expense.amount) > 0.01) {
    return {
      valid: false,
      error: 'Total paid amounts must equal the expense amount',
    }
  }

  return { valid: true }
}

// For backward compatibility - export as named object
export const ExpenseCalculationService = {
  getTotalPaid,
  getTotalShouldPay,
  getBalance,
  getAllBalances,
  getPaymentPlan,
  getTotalExpenses,
  getCrossTableAmount,
  getCrossPaidAmount,
  validateExpense,
}
