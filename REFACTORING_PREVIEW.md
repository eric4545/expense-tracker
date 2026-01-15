# 🔄 Refactoring Preview - Key Changes

## Script Section Changes

### Before (imports):
```javascript
import { computed, onMounted, ref } from 'vue'
import ThemeToggle from './ThemeToggle.vue'
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  DEFAULT_SYMBOL,
  getCurrencySymbol,
  formatCurrency,
  calculateBaseAmount,
  calculateExchangeRate,
  isValidExchangeRate,
} from '../utils/currencies.js'
```

### After (imports):
```javascript
import { computed, onMounted, ref } from 'vue'
import ThemeToggle from './ThemeToggle.vue'
import { CURRENCIES, DEFAULT_CURRENCY, DEFAULT_SYMBOL } from '../utils/currencies.js'
import { CurrencyService } from '../services/CurrencyService.js'
import { ExpenseCalculationService } from '../services/ExpenseCalculationService.js'
import { storageService } from '../services/StorageService.js'
import { useCurrencyForm } from '../composables/useCurrencyForm.js'
```

---

## Method Replacements

### 1. Calculation Methods

**Before** (~300 lines total):
```javascript
getTotalPaid(member) {
  return this.expenses.reduce((sum, expense) => {
    const baseAmount = this.getBaseAmount(expense)
    // ... 20+ lines of logic
  }, 0)
}

getTotalShouldPay(member) {
  let total = 0
  for (const expense of this.expenses) {
    // ... 30+ lines of logic
  }
  return total
}

getBalance(member) {
  const paid = this.getTotalPaid(member)
  const shouldPay = this.getTotalShouldPay(member)
  return Math.round((paid - shouldPay) * 100) / 100
}

getPaymentPlan() {
  // ... 50+ lines of complex logic
}
```

**After** (~10 lines total):
```javascript
getTotalPaid(member) {
  return ExpenseCalculationService.getTotalPaid(this.expenses, member)
}

getTotalShouldPay(member) {
  return ExpenseCalculationService.getTotalShouldPay(this.expenses, member)
}

getBalance(member) {
  return ExpenseCalculationService.getBalance(this.expenses, member)
}

getPaymentPlan() {
  return ExpenseCalculationService.getPaymentPlan(this.expenses, this.members)
}
```

---

### 2. Storage Methods

**Before**:
```javascript
loadTripList() {
  const trips = JSON.parse(localStorage.getItem('trips') || '[]')
  this.tripList = trips.sort((a, b) => b.createdAt - a.createdAt)
}

saveTrip() {
  const trips = JSON.parse(localStorage.getItem('trips') || '[]')
  // ... complex save logic
  localStorage.setItem('trips', JSON.stringify(trips))
}

deleteTrip() {
  const trips = JSON.parse(localStorage.getItem('trips') || '[]')
  const filteredTrips = trips.filter((t) => t.id !== this.currentTripId)
  localStorage.setItem('trips', JSON.stringify(filteredTrips))
}
```

**After**:
```javascript
loadTripList() {
  this.tripList = storageService.getTrips()
    .sort((a, b) => b.createdAt - a.createdAt)
}

saveTrip() {
  const tripData = {
    id: this.currentTripId || this.generateTripId(),
    name: this.tripName.trim(),
    // ...
  }
  storageService.saveTrip(tripData)
}

deleteTrip() {
  storageService.deleteTrip(this.currentTripId)
  this.resetTripData()
  this.loadTripList()
}
```

---

### 3. Currency Form Logic (DRY - Biggest Win!)

**Before** (duplicated ~200 lines):
```javascript
// ADD FORM - ~100 lines
onCustomCurrencyToggle() {
  if (!this.newExpense.useCustomCurrency) {
    this.newExpense.currency = this.baseCurrency
    this.newExpense.exchangeRate = 1
    this.newExpense.baseAmount = this.newExpense.amount
  } else {
    // ... 20 lines of logic
  }
}

onExpenseCurrencyChange() {
  this.newExpense.manualRate = 1
  this.newExpense.foreignAmount = this.newExpense.amount
  // ... more logic
}

onManualRateChange() {
  if (this.newExpense.manualRate && isValidExchangeRate(this.newExpense.manualRate)) {
    this.newExpense.exchangeRate = this.newExpense.manualRate
    // ... more logic
  }
}

// EDIT FORM - DUPLICATE ~100 lines
onEditCustomCurrencyToggle() {
  if (!this.editingExpense.useCustomCurrency) {
    this.editingExpense.currency = this.baseCurrency
    // ... SAME LOGIC DUPLICATED
  }
}

onEditExpenseCurrencyChange() {
  // ... SAME LOGIC DUPLICATED
}

onEditManualRateChange() {
  // ... SAME LOGIC DUPLICATED
}

// ... 5 more duplicate methods
```

**After** (single composable):
```javascript
// Setup (in setup() or data())
const newExpenseCurrency = useCurrencyForm(computed(() => this.baseCurrency))
const editExpenseCurrency = useCurrencyForm(computed(() => this.baseCurrency))

// Usage - just delegate!
onCustomCurrencyToggle() {
  newExpenseCurrency.toggleCustomCurrency(this.newExpense.amount)
  Object.assign(this.newExpense, newExpenseCurrency.getCurrencyData())
}

onExpenseCurrencyChange() {
  newExpenseCurrency.onCurrencyChange(this.newExpense.amount)
  Object.assign(this.newExpense, newExpenseCurrency.getCurrencyData())
}

onManualRateChange() {
  newExpenseCurrency.onManualRateChange(this.newExpense.amount)
  Object.assign(this.newExpense, newExpenseCurrency.getCurrencyData())
}

// Edit form uses same composable - NO DUPLICATION!
```

---

## Component Size Reduction

| Section | Before | After | Reduction |
|---------|--------|-------|-----------|
| Calculation methods | ~300 lines | ~30 lines | 90% ↓ |
| Storage methods | ~80 lines | ~20 lines | 75% ↓ |
| Currency form logic | ~200 lines (duplicated) | ~50 lines | 75% ↓ |
| **Total component** | **1,853 lines** | **~1,200 lines** | **35% ↓** |

---

## Testing Improvements

### Before: Component Testing Only
```javascript
describe('ExpenseTracker', () => {
  it('should calculate balance', () => {
    const wrapper = mount(ExpenseTracker, {
      // ... complex setup
    })
    wrapper.vm.expenses = mockExpenses
    wrapper.vm.members = ['Alice', 'Bob']

    expect(wrapper.vm.getBalance('Alice')).toBe(100)
  })
})
```

**Issues**:
- Slow (must mount component)
- Hard to set up
- Tests UI and logic together

### After: Service Testing
```javascript
describe('ExpenseCalculationService', () => {
  it('should calculate balance', () => {
    const expenses = mockExpenses
    const result = ExpenseCalculationService.getBalance(expenses, 'Alice')

    expect(result).toBe(100)
  })
})
```

**Benefits**:
- Fast (pure functions)
- Easy to set up
- Tests logic in isolation

---

## Future Extensibility Examples

### Adding API Storage (Open/Closed)
```javascript
// Create new service without modifying existing code
export class ApiStorageService {
  async getTrips() {
    return await fetch('/api/trips').then(r => r.json())
  }

  async saveTrip(trip) {
    return await fetch('/api/trips', {
      method: 'POST',
      body: JSON.stringify(trip)
    })
  }
}

// Swap in component
import { ApiStorageService } from '../services/ApiStorageService.js'
const storageService = new ApiStorageService()
```

### Adding Real-time Exchange Rates
```javascript
export class LiveCurrencyService extends CurrencyService {
  static async getExchangeRate(from, to) {
    const rate = await fetch(`/api/rates/${from}/${to}`)
      .then(r => r.json())
    return rate
  }
}

// Component doesn't need to change!
```

---

## Summary

✅ **DRY**: Eliminated 200+ lines of duplicate code
✅ **SOLID**: Clear separation of responsibilities
✅ **Testable**: Services can be unit tested
✅ **Maintainable**: Easy to modify and extend
✅ **Readable**: Smaller, focused modules

**Next**: Apply these changes to ExpenseTracker.vue
