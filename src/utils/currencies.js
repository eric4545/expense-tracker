/**
 * Currency configuration and utilities for multi-currency support
 */

export const CURRENCIES = [
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', popular: true },
  { code: 'USD', symbol: '$', name: 'US Dollar', popular: true },
  { code: 'EUR', symbol: '€', name: 'Euro', popular: true },
  { code: 'GBP', symbol: '£', name: 'British Pound', popular: true },
  { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', popular: true },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', popular: true },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', popular: true },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', popular: true },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', popular: true },
  { code: 'THB', symbol: '฿', name: 'Thai Baht', popular: true },
  { code: 'KRW', symbol: '₩', name: 'South Korean Won', popular: true },
  { code: 'TWD', symbol: 'NT$', name: 'Taiwan Dollar', popular: true },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso', popular: true },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit', popular: true },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah', popular: true },
  { code: 'VND', symbol: '₫', name: 'Vietnamese Dong', popular: true },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', popular: true },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', popular: true },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona', popular: true },
  { code: 'NOK', symbol: 'kr', name: 'Norwegian Krone', popular: true },
]

export const DEFAULT_CURRENCY = 'JPY'
export const DEFAULT_SYMBOL = '¥'

/**
 * Get currency configuration by code
 * @param {string} code - Currency code (e.g., 'USD', 'JPY')
 * @returns {object|null} Currency object or null if not found
 */
export function getCurrency(code) {
  return CURRENCIES.find(c => c.code === code) || null
}

/**
 * Get currency symbol by code
 * @param {string} code - Currency code
 * @returns {string} Currency symbol or the code itself if not found
 */
export function getCurrencySymbol(code) {
  const currency = getCurrency(code)
  return currency ? currency.symbol : code
}

/**
 * Format amount with currency symbol
 * @param {number} amount - Amount to format
 * @param {string} currencyCode - Currency code
 * @param {boolean} showDecimals - Whether to show decimal places
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, currencyCode = DEFAULT_CURRENCY, showDecimals = false) {
  const symbol = getCurrencySymbol(currencyCode)
  const formattedAmount = showDecimals
    ? amount.toFixed(2)
    : Math.round(amount).toString()
  return `${symbol}${formattedAmount}`
}

/**
 * Calculate base amount from expense amount and exchange rate
 * @param {number} amount - Original expense amount
 * @param {number} exchangeRate - Exchange rate to base currency
 * @returns {number} Amount in base currency
 */
export function calculateBaseAmount(amount, exchangeRate = 1) {
  return amount * exchangeRate
}

/**
 * Calculate exchange rate from two amounts
 * @param {number} foreignAmount - Amount in foreign currency
 * @param {number} baseAmount - Amount in base currency
 * @returns {number} Exchange rate (foreignAmount × rate = baseAmount)
 */
export function calculateExchangeRate(foreignAmount, baseAmount) {
  if (foreignAmount === 0) return 1
  return baseAmount / foreignAmount
}

/**
 * Validate exchange rate is reasonable (between 0.000001 and 1000000)
 * @param {number} rate - Exchange rate to validate
 * @returns {boolean} True if valid
 */
export function isValidExchangeRate(rate) {
  return rate > 0.000001 && rate < 1000000
}
