/**
 * CurrencyService - Handles all currency operations
 * Single Responsibility: Currency conversions and validations
 */

import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  formatCurrency,
  getCurrencySymbol,
} from '../utils/currencies.js'

/**
 * Calculate base amount from expense amount and exchange rate
 * @param {number} amount - Original amount
 * @param {number} exchangeRate - Exchange rate
 * @returns {number} Amount in base currency
 */
export function calculateBaseAmount(amount, exchangeRate = 1) {
  return amount * exchangeRate
}

/**
 * Calculate exchange rate from two amounts
 * @param {number} foreignAmount - Amount in foreign currency
 * @param {number} baseAmount - Amount in base currency
 * @returns {number} Exchange rate
 */
export function calculateExchangeRate(foreignAmount, baseAmount) {
  if (foreignAmount === 0) return 1
  return baseAmount / foreignAmount
}

/**
 * Validate exchange rate is reasonable
 * @param {number} rate - Exchange rate
 * @returns {boolean} True if valid
 */
export function isValidExchangeRate(rate) {
  return rate > 0.000001 && rate < 1000000
}

/**
 * Get the base amount from an expense (with fallbacks)
 * @param {Object} expense - Expense object
 * @returns {number} Amount in base currency
 */
export function getExpenseBaseAmount(expense) {
  if (expense.baseAmount !== null && expense.baseAmount !== undefined) {
    return expense.baseAmount
  }
  if (expense.exchangeRate && expense.exchangeRate !== 1) {
    return expense.amount * expense.exchangeRate
  }
  return expense.amount
}

/**
 * Normalize expense currency fields (for backward compatibility)
 * @param {Object} expense - Expense object
 * @param {string} baseCurrency - Base currency code
 * @returns {Object} Normalized expense
 */
export function normalizeExpense(expense, baseCurrency) {
  return {
    ...expense,
    currency: expense.currency || baseCurrency,
    exchangeRate: expense.exchangeRate || 1,
    baseAmount: expense.baseAmount || expense.amount,
  }
}

/**
 * Prepare expense for saving (remove UI-only fields)
 * @param {Object} expense - Expense object
 * @param {string} baseCurrency - Base currency code
 * @returns {Object} Clean expense object
 */
export function prepareExpenseForSave(expense, baseCurrency) {
  const prepared = { ...expense }

  // Set currency fields correctly
  if (!prepared.useCustomCurrency) {
    prepared.currency = baseCurrency
    prepared.exchangeRate = 1
    prepared.baseAmount = prepared.amount
  } else if (!prepared.baseAmount) {
    prepared.baseAmount = calculateBaseAmount(
      prepared.amount,
      prepared.exchangeRate
    )
  }

  // Remove UI-only fields
  prepared.useCustomCurrency = undefined
  prepared.exchangeRateMode = undefined
  prepared.manualRate = undefined
  prepared.foreignAmount = undefined
  prepared.calculatedBaseAmount = undefined

  return prepared
}

/**
 * Initialize currency form state for editing
 * @param {Object} expense - Expense to edit
 * @param {string} baseCurrency - Base currency code
 * @returns {Object} Form state
 */
export function initializeEditFormState(expense, baseCurrency) {
  return {
    currency: expense.currency || baseCurrency,
    exchangeRate: expense.exchangeRate || 1,
    baseAmount: expense.baseAmount || expense.amount,
    useCustomCurrency: expense.currency && expense.currency !== baseCurrency,
    exchangeRateMode: 'manual',
    manualRate: expense.exchangeRate || 1,
    foreignAmount: expense.amount,
    calculatedBaseAmount: expense.baseAmount || expense.amount,
  }
}

/**
 * Get all available currencies
 * @returns {Array} List of currency objects
 */
export function getCurrencies() {
  return CURRENCIES
}

/**
 * Get currency symbol
 * @param {string} code - Currency code
 * @returns {string} Currency symbol
 */
export function getSymbol(code) {
  return getCurrencySymbol(code)
}

/**
 * Format currency amount
 * @param {number} amount - Amount to format
 * @param {string} currencyCode - Currency code
 * @param {boolean} showDecimals - Show decimal places
 * @returns {string} Formatted string
 */
export function format(
  amount,
  currencyCode = DEFAULT_CURRENCY,
  showDecimals = false
) {
  return formatCurrency(amount, currencyCode, showDecimals)
}

// For backward compatibility - export as named object
export const CurrencyService = {
  calculateBaseAmount,
  calculateExchangeRate,
  isValidExchangeRate,
  getExpenseBaseAmount,
  normalizeExpense,
  prepareExpenseForSave,
  initializeEditFormState,
  getCurrencies,
  getSymbol,
  format,
}
