/**
 * useCurrencyForm - Reusable currency form logic
 * DRY: Eliminates duplication between add and edit forms
 */

import { computed, reactive } from 'vue'
import { CurrencyService } from '../services/CurrencyService.js'
import { CURRENCIES, DEFAULT_CURRENCY } from '../utils/currencies.js'

export function useCurrencyForm(baseCurrency) {
  const state = reactive({
    currency: baseCurrency.value || DEFAULT_CURRENCY,
    exchangeRate: 1,
    baseAmount: null,
    useCustomCurrency: false,
    exchangeRateMode: 'manual',
    manualRate: 1,
    foreignAmount: null,
    calculatedBaseAmount: null,
  })

  /**
   * Initialize form with expense data (for editing)
   */
  function initialize(expense) {
    const currencyState = CurrencyService.initializeEditFormState(
      expense,
      baseCurrency.value
    )
    Object.assign(state, currencyState)
  }

  /**
   * Reset to base currency
   */
  function reset() {
    state.currency = baseCurrency.value
    state.exchangeRate = 1
    state.baseAmount = null
    state.useCustomCurrency = false
    state.exchangeRateMode = 'manual'
    state.manualRate = 1
    state.foreignAmount = null
    state.calculatedBaseAmount = null
  }

  /**
   * Toggle custom currency
   */
  function toggleCustomCurrency(amount) {
    if (!state.useCustomCurrency) {
      // Reset to base currency
      state.currency = baseCurrency.value
      state.exchangeRate = 1
      state.baseAmount = amount
    } else {
      // Initialize with default values
      if (state.currency === baseCurrency.value) {
        // Pick a different currency as default
        const differentCurrency = CURRENCIES.find(
          (c) => c.code !== baseCurrency.value
        )
        state.currency = differentCurrency ? differentCurrency.code : 'USD'
      }
      state.manualRate = 1
      state.foreignAmount = amount
      state.calculatedBaseAmount = amount
    }
  }

  /**
   * Handle currency change
   */
  function onCurrencyChange(amount) {
    state.manualRate = 1
    state.foreignAmount = amount
    state.calculatedBaseAmount = amount
  }

  /**
   * Handle exchange rate mode change
   */
  function onExchangeRateModeChange(amount) {
    if (state.exchangeRateMode === 'manual') {
      if (state.foreignAmount && state.calculatedBaseAmount) {
        state.manualRate = CurrencyService.calculateExchangeRate(
          state.foreignAmount,
          state.calculatedBaseAmount
        )
      }
    } else {
      state.foreignAmount = amount
      if (state.manualRate) {
        state.calculatedBaseAmount = CurrencyService.calculateBaseAmount(
          amount,
          state.manualRate
        )
      }
    }
  }

  /**
   * Handle manual rate change
   */
  function onManualRateChange(amount) {
    if (
      state.manualRate &&
      CurrencyService.isValidExchangeRate(state.manualRate)
    ) {
      state.exchangeRate = state.manualRate
      state.baseAmount = CurrencyService.calculateBaseAmount(
        amount,
        state.manualRate
      )
    }
  }

  /**
   * Handle foreign amount change
   */
  function onForeignAmountChange() {
    if (
      state.foreignAmount &&
      state.calculatedBaseAmount &&
      state.foreignAmount > 0
    ) {
      const rate = CurrencyService.calculateExchangeRate(
        state.foreignAmount,
        state.calculatedBaseAmount
      )
      if (CurrencyService.isValidExchangeRate(rate)) {
        state.exchangeRate = rate
        state.baseAmount = state.calculatedBaseAmount
      }
    }
  }

  /**
   * Handle calculated base amount change
   */
  function onCalculatedBaseAmountChange() {
    if (
      state.foreignAmount &&
      state.calculatedBaseAmount &&
      state.foreignAmount > 0
    ) {
      const rate = CurrencyService.calculateExchangeRate(
        state.foreignAmount,
        state.calculatedBaseAmount
      )
      if (CurrencyService.isValidExchangeRate(rate)) {
        state.exchangeRate = rate
        state.baseAmount = state.calculatedBaseAmount
      }
    }
  }

  /**
   * Get currency data to merge into expense
   */
  function getCurrencyData() {
    return {
      currency: state.currency,
      exchangeRate: state.exchangeRate,
      baseAmount: state.baseAmount,
      useCustomCurrency: state.useCustomCurrency,
      exchangeRateMode: state.exchangeRateMode,
      manualRate: state.manualRate,
      foreignAmount: state.foreignAmount,
      calculatedBaseAmount: state.calculatedBaseAmount,
    }
  }

  /**
   * Computed: Show converted amount preview
   */
  const convertedPreview = computed(() => {
    if (!state.useCustomCurrency) return null
    if (state.exchangeRateMode === 'manual' && state.manualRate) {
      return {
        rate: state.manualRate,
        formula: `${state.foreignAmount || 0} ${state.currency} × ${state.manualRate} = ${CurrencyService.format((state.foreignAmount || 0) * state.manualRate, baseCurrency.value)}`,
      }
    }
    if (state.foreignAmount && state.calculatedBaseAmount) {
      const rate = CurrencyService.calculateExchangeRate(
        state.foreignAmount,
        state.calculatedBaseAmount
      )
      return {
        rate,
        formula: `1 ${state.currency} = ${rate.toFixed(6)} ${baseCurrency.value}`,
      }
    }
    return null
  })

  return {
    state,
    initialize,
    reset,
    toggleCustomCurrency,
    onCurrencyChange,
    onExchangeRateModeChange,
    onManualRateChange,
    onForeignAmountChange,
    onCalculatedBaseAmountChange,
    getCurrencyData,
    convertedPreview,
  }
}
