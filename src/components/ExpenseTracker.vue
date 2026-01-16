<template>
  <div class="container mt-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1>{{ tripName }} Expense Tracker</h1>
      <ThemeToggle />
    </div>

    <!-- Trip Management -->
    <div class="mb-4">
      <div class="row">
        <div class="col-md-6">
          <select v-model="currentTripId" class="form-select mb-2">
            <option value="">Create New Trip</option>
            <option v-for="trip in tripList" :value="trip.id" :key="trip.id">
              {{ trip.name }} ({{ new Date(trip.createdAt).toLocaleDateString() }})
            </option>
          </select>
        </div>
        <div class="col-md-6">
          <div class="input-group mb-2">
            <input v-model="tripName" class="form-control" placeholder="Trip Name">
            <button @click="saveTrip" class="btn btn-primary">Save Trip</button>
            <button v-if="currentTripId" @click="deleteTrip" class="btn btn-danger">Delete Trip</button>
          </div>
          <textarea v-model="tripDescription" class="form-control mb-2" placeholder="Trip Description" rows="2"></textarea>
          <div class="input-group">
            <span class="input-group-text">Base Currency</span>
            <select v-model="baseCurrency" class="form-select"
                    @change="onBaseCurrencyChange"
                    :disabled="currentTripId !== ''">
              <option v-for="curr in currencies" :key="curr.code" :value="curr.code">
                {{ curr.code }} - {{ curr.name }} ({{ curr.symbol }})
              </option>
            </select>
          </div>
          <small v-if="currentTripId" class="text-muted">Base currency cannot be changed after trip creation</small>
        </div>
      </div>
    </div>

    <!-- Trip Setup -->
    <div class="mb-4">
      <div class="input-group">
        <input v-model="newMember" class="form-control" placeholder="Add Member"
               @keyup.enter="addMember">
        <button @click="addMember" class="btn btn-primary">Add</button>
      </div>
      <div class="mt-2">
        Members:
        <span v-for="member in members" :key="member" class="badge bg-secondary me-1">
          {{ member }}
          <button @click="removeMember(member)" class="btn-close btn-close-white" style="font-size: 0.5em;"></button>
        </span>
      </div>
    </div>

    <!-- Add Expense -->
    <div class="card mb-4">
      <div class="card-body">
        <h5 class="card-title">Add Expense</h5>
        <div class="row g-3">
          <div class="col-md-4">
            <input v-model="newExpense.description" class="form-control" placeholder="Description">
          </div>
          <div class="col-md-2">
            <input v-model.number="newExpense.amount" type="number" class="form-control" placeholder="Amount"
                   @change="updateAmounts">
          </div>
          <div class="col-md-3">
            <input type="date" v-model="newExpense.date" class="form-control">
          </div>

          <!-- Currency Section -->
          <div class="col-12">
            <div class="form-check">
              <input class="form-check-input" type="checkbox" v-model="newExpense.useCustomCurrency"
                     @change="onCustomCurrencyToggle">
              <label class="form-check-label">
                This expense is in a different currency
              </label>
            </div>
          </div>

          <div v-if="newExpense.useCustomCurrency" class="col-12">
            <div class="card bg-light">
              <div class="card-body">
                <div class="row g-3">
                  <div class="col-md-4">
                    <label class="form-label">Expense Currency</label>
                    <select v-model="newExpense.currency" class="form-select" @change="onExpenseCurrencyChange">
                      <option v-for="curr in currencies" :key="curr.code" :value="curr.code">
                        {{ curr.code }} - {{ curr.name }} ({{ curr.symbol }})
                      </option>
                    </select>
                  </div>

                  <div class="col-12">
                    <label class="form-label">Exchange Rate Input Method</label>
                    <div class="btn-group w-100" role="group">
                      <input type="radio" class="btn-check" id="manual-rate" value="manual"
                             v-model="newExpense.exchangeRateMode" @change="onExchangeRateModeChange">
                      <label class="btn btn-outline-primary" for="manual-rate">Manual Rate</label>

                      <input type="radio" class="btn-check" id="calculate-rate" value="calculate"
                             v-model="newExpense.exchangeRateMode" @change="onExchangeRateModeChange">
                      <label class="btn btn-outline-primary" for="calculate-rate">Calculate from Amounts</label>
                    </div>
                  </div>

                  <!-- Manual Rate Mode -->
                  <div v-if="newExpense.exchangeRateMode === 'manual'" class="col-12">
                    <label class="form-label">Exchange Rate</label>
                    <div class="input-group">
                      <span class="input-group-text">1 {{ newExpense.currency }} =</span>
                      <input type="number" v-model.number="newExpense.manualRate" class="form-control"
                             step="0.000001" @input="onManualRateChange">
                      <span class="input-group-text">{{ baseCurrency }}</span>
                    </div>
                    <small class="text-muted">
                      Converted: {{ newExpense.amount }} {{ newExpense.currency }} =
                      {{ formatCurrency(newExpense.amount * newExpense.manualRate, baseCurrency) }}
                    </small>
                  </div>

                  <!-- Calculate Rate Mode -->
                  <div v-if="newExpense.exchangeRateMode === 'calculate'" class="col-12">
                    <div class="row g-2">
                      <div class="col-md-5">
                        <label class="form-label">Amount in {{ newExpense.currency }}</label>
                        <div class="input-group">
                          <input type="number" v-model.number="newExpense.foreignAmount" class="form-control"
                                 @input="onForeignAmountChange">
                          <span class="input-group-text">{{ newExpense.currency }}</span>
                        </div>
                      </div>
                      <div class="col-md-2 text-center pt-4">
                        <strong>=</strong>
                      </div>
                      <div class="col-md-5">
                        <label class="form-label">Amount in {{ baseCurrency }}</label>
                        <div class="input-group">
                          <input type="number" v-model.number="newExpense.calculatedBaseAmount" class="form-control"
                                 @input="onCalculatedBaseAmountChange">
                          <span class="input-group-text">{{ baseCurrency }}</span>
                        </div>
                      </div>
                    </div>
                    <small v-if="newExpense.foreignAmount && newExpense.calculatedBaseAmount" class="text-muted">
                      Exchange rate: 1 {{ newExpense.currency }} =
                      {{ (newExpense.calculatedBaseAmount / newExpense.foreignAmount).toFixed(6) }} {{ baseCurrency }}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="col-12">
            <button @click="selectAllPayers" class="btn btn-outline-secondary mb-2">Select All Payers</button>
            <div class="row">
              <div v-for="member in members" :key="member" class="col-md-3 mb-2">
                <div class="form-check">
                  <input class="form-check-input" type="checkbox"
                         v-model="newExpense.paidBy"
                         :value="member"
                         @change="updatePaidAmounts">
                  <label class="form-check-label">{{ member }}</label>
                </div>
                <input v-if="newExpense.paidBy.includes(member)"
                       type="number"
                       v-model.number="newExpense.paidAmounts[member]"
                       class="form-control form-control-sm"
                       :placeholder="`Amount for ${member}`">
              </div>
            </div>
          </div>
          <div class="col-12">
            <button @click="selectAllMembers" class="btn btn-outline-secondary mb-2">Select All for Split</button>
            <div class="row">
              <div v-for="member in members" :key="member" class="col-md-3 mb-2">
                <div class="form-check">
                  <input class="form-check-input" type="checkbox"
                         v-model="newExpense.splitWith"
                         :value="member"
                         @change="updateSplitAmounts">
                  <label class="form-check-label">{{ member }}</label>
                </div>
                <input v-if="newExpense.splitWith.includes(member)"
                       type="number"
                       v-model.number="newExpense.splitAmounts[member]"
                       class="form-control form-control-sm"
                       :placeholder="`Amount for ${member}`">
              </div>
            </div>
          </div>
          <div class="col-12">
            <button @click="addExpense" class="btn btn-success">Add Expense</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Expenses List -->
    <div class="table-responsive">
      <table class="table table-sm">
        <thead>
          <tr>
            <th>#</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(expense, index) in sortedExpenses" :key="index">
            <td>{{ index + 1 }}</td>
            <td>
              <template v-if="editingIndex !== index">
                {{ expense.description }}
                <br>
                <small class="text-muted">
                  Paid by: {{ formatPayers(expense) }}
                  <br>
                  Split with: {{ formatSplitWith(expense) }}
                </small>
              </template>
              <template v-else>
                <div class="row g-2">
                  <div class="col-md-6">
                    <input v-model="editingExpense.description" class="form-control form-control-sm" placeholder="Description">
                  </div>
                  <div class="col-md-3">
                    <input v-model.number="editingExpense.amount" type="number"
                           class="form-control form-control-sm"
                           placeholder="Amount"
                           @change="updateEditAmounts">
                  </div>
                  <div class="col-md-3">
                    <input type="date" v-model="editingExpense.date" class="form-control form-control-sm">
                  </div>
                </div>

                <!-- Currency Section for Edit -->
                <div class="mt-2">
                  <div class="form-check">
                    <input class="form-check-input" type="checkbox" v-model="editingExpense.useCustomCurrency"
                           @change="onEditCustomCurrencyToggle">
                    <label class="form-check-label">
                      This expense is in a different currency
                    </label>
                  </div>
                </div>

                <div v-if="editingExpense.useCustomCurrency" class="mt-2">
                  <div class="card bg-light">
                    <div class="card-body">
                      <div class="row g-2">
                        <div class="col-md-4">
                          <label class="form-label">Expense Currency</label>
                          <select v-model="editingExpense.currency" class="form-select form-select-sm" @change="onEditExpenseCurrencyChange">
                            <option v-for="curr in currencies" :key="curr.code" :value="curr.code">
                              {{ curr.code }} - {{ curr.name }} ({{ curr.symbol }})
                            </option>
                          </select>
                        </div>

                        <div class="col-12">
                          <label class="form-label">Exchange Rate Input Method</label>
                          <div class="btn-group w-100" role="group">
                            <input type="radio" class="btn-check" id="edit-manual-rate" value="manual"
                                   v-model="editingExpense.exchangeRateMode" @change="onEditExchangeRateModeChange">
                            <label class="btn btn-outline-primary btn-sm" for="edit-manual-rate">Manual Rate</label>

                            <input type="radio" class="btn-check" id="edit-calculate-rate" value="calculate"
                                   v-model="editingExpense.exchangeRateMode" @change="onEditExchangeRateModeChange">
                            <label class="btn btn-outline-primary btn-sm" for="edit-calculate-rate">Calculate from Amounts</label>
                          </div>
                        </div>

                        <!-- Manual Rate Mode -->
                        <div v-if="editingExpense.exchangeRateMode === 'manual'" class="col-12">
                          <label class="form-label">Exchange Rate</label>
                          <div class="input-group input-group-sm">
                            <span class="input-group-text">1 {{ editingExpense.currency }} =</span>
                            <input type="number" v-model.number="editingExpense.manualRate" class="form-control"
                                   step="0.000001" @input="onEditManualRateChange">
                            <span class="input-group-text">{{ baseCurrency }}</span>
                          </div>
                          <small class="text-muted">
                            Converted: {{ editingExpense.amount }} {{ editingExpense.currency }} =
                            {{ formatCurrency(editingExpense.amount * editingExpense.manualRate, baseCurrency) }}
                          </small>
                        </div>

                        <!-- Calculate Rate Mode -->
                        <div v-if="editingExpense.exchangeRateMode === 'calculate'" class="col-12">
                          <div class="row g-2">
                            <div class="col-md-5">
                              <label class="form-label">Amount in {{ editingExpense.currency }}</label>
                              <div class="input-group input-group-sm">
                                <input type="number" v-model.number="editingExpense.foreignAmount" class="form-control"
                                       @input="onEditForeignAmountChange">
                                <span class="input-group-text">{{ editingExpense.currency }}</span>
                              </div>
                            </div>
                            <div class="col-md-2 text-center pt-4">
                              <strong>=</strong>
                            </div>
                            <div class="col-md-5">
                              <label class="form-label">Amount in {{ baseCurrency }}</label>
                              <div class="input-group input-group-sm">
                                <input type="number" v-model.number="editingExpense.calculatedBaseAmount" class="form-control"
                                       @input="onEditCalculatedBaseAmountChange">
                                <span class="input-group-text">{{ baseCurrency }}</span>
                              </div>
                            </div>
                          </div>
                          <small v-if="editingExpense.foreignAmount && editingExpense.calculatedBaseAmount" class="text-muted">
                            Exchange rate: 1 {{ editingExpense.currency }} =
                            {{ (editingExpense.calculatedBaseAmount / editingExpense.foreignAmount).toFixed(6) }} {{ baseCurrency }}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="mt-2">
                  <label class="form-label mb-1"><strong>Paid By:</strong></label>
                  <button @click="selectAllPayersEdit" class="btn btn-outline-secondary btn-sm ms-2">Select All</button>
                  <div class="row g-1">
                    <div v-for="member in members" :key="member" class="col-md-6">
                      <div class="input-group input-group-sm">
                        <div class="input-group-text">
                          <input class="form-check-input mt-0" type="checkbox"
                                 v-model="editingExpense.paidBy"
                                 :value="member"
                                 @change="updateEditPaidAmounts">
                          <label class="ms-1 mb-0">{{ member }}</label>
                        </div>
                        <input v-if="editingExpense.paidBy.includes(member)"
                               type="number"
                               v-model.number="editingExpense.paidAmounts[member]"
                               class="form-control form-control-sm"
                               :placeholder="`Amount`">
                      </div>
                    </div>
                  </div>
                </div>
                <div class="mt-2">
                  <label class="form-label mb-1"><strong>Split With:</strong></label>
                  <button @click="selectAllSplitEdit" class="btn btn-outline-secondary btn-sm ms-2">Select All</button>
                  <div class="row g-1">
                    <div v-for="member in members" :key="member" class="col-md-6">
                      <div class="input-group input-group-sm">
                        <div class="input-group-text">
                          <input class="form-check-input mt-0" type="checkbox"
                                 v-model="editingExpense.splitWith"
                                 :value="member"
                                 @change="updateEditSplitAmounts">
                          <label class="ms-1 mb-0">{{ member }}</label>
                        </div>
                        <input v-if="editingExpense.splitWith.includes(member)"
                               type="number"
                               v-model.number="editingExpense.splitAmounts[member]"
                               class="form-control form-control-sm"
                               :placeholder="`Amount`">
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </td>
            <td>
              <span v-if="editingIndex !== index">
                {{ formatCurrency(expense.amount, expense.currency || baseCurrency) }}
                <span v-if="expense.currency && expense.currency !== baseCurrency" class="text-muted small">
                  <br>({{ formatCurrency(getBaseAmount(expense), baseCurrency) }})
                  <br><small>Rate: 1={{ expense.exchangeRate?.toFixed(4) || 1 }}</small>
                </span>
              </span>
              <input v-else v-model.number="editingExpense.amount" type="number"
                     class="form-control form-control-sm"
                     @change="updateEditPaidAmounts">
            </td>
            <td>
              <div v-if="editingIndex !== index">
                <button @click="startEdit(index)" class="btn btn-warning btn-sm me-1">Edit</button>
                <button @click="removeExpense(index)" class="btn btn-danger btn-sm">Delete</button>
              </div>
              <div v-else>
                <button @click="saveEdit()" class="btn btn-success btn-sm me-1">Save</button>
                <button @click="cancelEdit()" class="btn btn-secondary btn-sm">Cancel</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Summary -->
    <div class="card mt-4">
      <div class="card-body">
        <h5 class="card-title">Summary</h5>
        <div class="table-responsive">
          <table class="table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Paid</th>
                <th>Should Pay</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="member in members" :key="member">
                <td>{{ member }}</td>
                <td>{{ formatCurrency(getTotalPaid(member), baseCurrency) }}</td>
                <td>{{ formatCurrency(getTotalShouldPay(member), baseCurrency) }}</td>
                <td :class="getBalance(member) >= 0 ? 'text-success' : 'text-danger'">
                  {{ formatCurrency(getBalance(member), baseCurrency, true) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Expense Breakdown by Member -->
    <div class="card mt-4">
      <div class="card-header" style="cursor: pointer" @click="toggleCrossTable">
        <h5 class="card-title mb-0">
          <i :class="showCrossTable ? 'bi bi-chevron-down' : 'bi bi-chevron-right'"></i>
          Expense Breakdown by Member
        </h5>
      </div>
      <div class="card-body" v-if="showCrossTable">
        <div class="table-responsive">
          <table class="table table-bordered cross-table">
            <thead>
              <tr>
                <th class="sticky-col">Expense Item (Paid By)</th>
                <th v-for="member in members" :key="member" class="text-center">{{ member }}</th>
                <th class="text-center">Total</th>
              </tr>
              <tr class="table-secondary">
                <th class="sticky-col">Paid By \ For Who</th>
                <th v-for="member in members" :key="member" class="text-center">Should Pay</th>
                <th class="text-center">Total Paid</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="expense in sortedExpenses" :key="expense.description">
                <td class="sticky-col">
                  {{ expense.description }}
                  <span class="text-success fw-bold">
                    ({{ expense.paidBy }})
                  </span>
                </td>
                <td v-for="member in members" :key="member" class="text-center">
                  <template v-if="expense.splitWith.includes(member)">
                    <span :class="expense.paidBy === member ? 'text-success fw-bold' : ''">
                      {{ formatCurrency(getCrossTableAmount(expense, member), baseCurrency) }}
                    </span>
                  </template>
                  <template v-else>-</template>
                </td>
                <td class="text-center">{{ formatCurrency(getBaseAmount(expense), baseCurrency) }}</td>
              </tr>
              <tr class="table-secondary">
                <td class="sticky-col"><strong>Total</strong></td>
                <td v-for="member in members" :key="member" class="text-center">
                  <strong>{{ formatCurrency(getTotalShouldPay(member), baseCurrency) }}</strong>
                </td>
                <td class="text-center"><strong>{{ formatCurrency(getTotalExpenses(), baseCurrency) }}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Who Paid for Whom -->
    <div class="card mt-4">
      <div class="card-header" style="cursor: pointer" @click="togglePaidForWhom">
        <h5 class="card-title mb-0">
          <i :class="showPaidForWhom ? 'bi bi-chevron-down' : 'bi bi-chevron-right'"></i>
          Who Paid for Whom
        </h5>
      </div>
      <div class="card-body" v-if="showPaidForWhom">
        <div class="table-responsive">
          <table class="table table-bordered">
            <thead>
              <tr>
                <th>Paid By \ For Who</th>
                <th v-for="member in members" :key="member" class="text-center">{{ member }}</th>
                <th class="text-center">Total Paid</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="payer in members" :key="payer">
                <td><strong>{{ payer }}</strong></td>
                <td v-for="receiver in members" :key="receiver" class="text-center">
                  <template v-if="payer !== receiver">
                    {{ formatCurrency(getCrossPaidAmount(payer, receiver), baseCurrency) }}
                  </template>
                  <template v-else>-</template>
                </td>
                <td class="text-center"><strong>{{ formatCurrency(getTotalPaid(payer), baseCurrency) }}</strong></td>
              </tr>
              <tr class="table-secondary">
                <td><strong>Total Should Pay</strong></td>
                <td v-for="member in members" :key="member" class="text-center">
                  <strong>{{ formatCurrency(getTotalShouldPay(member), baseCurrency) }}</strong>
                </td>
                <td class="text-center"><strong>{{ formatCurrency(getTotalExpenses(), baseCurrency) }}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Settlement Guide -->
    <div class="card mt-4">
      <div class="card-header" style="cursor: pointer" @click="toggleWhoOwesWho">
        <h5 class="card-title mb-0">
          <i :class="showWhoOwesWho ? 'bi bi-chevron-down' : 'bi bi-chevron-right'"></i>
          Settlement Guide
        </h5>
      </div>
      <div class="card-body" v-if="showWhoOwesWho">
        <h6 class="mb-3">💰 Payment Instructions:</h6>
        <table class="table table-striped">
          <thead>
            <tr>
              <th>From</th>
              <th>To</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(payment, index) in getPaymentPlan()" :key="index">
              <td>{{ payment.from }}</td>
              <td>{{ payment.to }}</td>
              <td class="fw-bold">{{ formatCurrency(payment.amount, baseCurrency) }}</td>
            </tr>
          </tbody>
        </table>

        <div class="mt-4">
          <h6 class="mb-3">📊 Detailed Matrix (Who Owes Whom):</h6>
          <div class="table-responsive">
            <table class="table table-bordered settlement-table">
              <thead>
                <tr>
                  <th class="sticky-col">Needs to Pay ↓ \ Should Receive →</th>
                  <th v-for="creditor in getCreditors()" :key="creditor" class="text-center">
                    {{ creditor }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="debtor in getDebtors()" :key="debtor">
                  <td class="sticky-col"><strong>{{ debtor }}</strong></td>
                  <td v-for="creditor in getCreditors()" :key="creditor" class="text-center">
                    {{ getOwedAmount(debtor, creditor) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <!-- Import/Export -->
    <div class="mt-4">
      <button @click="exportData" class="btn btn-primary me-2">Export Data</button>
      <button @click="exportCsv" class="btn btn-info me-2">Export to CSV</button>
      <input type="file" @change="importData" class="form-control d-inline-block w-auto me-2" accept=".json">
      <button @click="shareViaURL" class="btn btn-success">Share via URL</button>
    </div>
  </div>
</template>

<script>
import { computed, onMounted, ref } from 'vue'
import { CurrencyService } from '../services/CurrencyService.js'
import { ExpenseCalculationService } from '../services/ExpenseCalculationService.js'
import { storageService } from '../services/StorageService.js'
import {
  CURRENCIES,
  DEFAULT_CURRENCY,
  DEFAULT_SYMBOL,
} from '../utils/currencies.js'
import ThemeToggle from './ThemeToggle.vue'

export default {
  name: 'ExpenseTracker',
  components: {
    ThemeToggle,
  },
  props: {
    routeTripId: String,
    routeExpenseId: String,
  },
  data() {
    return {
      tripName: 'New Trip',
      tripDescription: '',
      currentTripId: '',
      tripList: [],
      baseCurrency: DEFAULT_CURRENCY,
      currencySymbol: DEFAULT_SYMBOL,
      currencies: CURRENCIES,
      members: [],
      newMember: '',
      expenses: [],
      newExpense: {
        description: '',
        amount: null,
        paidBy: [],
        paidAmounts: {},
        splitWith: [],
        splitAmounts: {},
        date: new Date().toISOString().split('T')[0],
        currency: DEFAULT_CURRENCY,
        exchangeRate: 1,
        baseAmount: null,
        useCustomCurrency: false,
        exchangeRateMode: 'manual',
        manualRate: 1,
        foreignAmount: null,
        calculatedBaseAmount: null,
      },
      editingIndex: -1,
      editingExpense: null,
      sortBy: 'index',
      sortDesc: false,
      showCrossTable: true,
      showPaidForWhom: true,
      showWhoOwesWho: true,
    }
  },
  computed: {
    sortedExpenses() {
      return [...this.expenses].sort((a, b) => {
        let comparison = 0
        if (this.sortBy === 'description') {
          comparison = a.description.localeCompare(b.description)
        } else if (this.sortBy === 'amount') {
          comparison = a.amount - b.amount
        } else if (this.sortBy === 'paidBy') {
          comparison = a.paidBy.localeCompare(b.paidBy)
        } else if (this.sortBy === 'date') {
          comparison = (a.date || '').localeCompare(b.date || '')
        } else {
          comparison = this.expenses.indexOf(a) - this.expenses.indexOf(b)
        }
        return this.sortDesc ? -comparison : comparison
      })
    },
  },
  methods: {
    toggleSort(field) {
      if (this.sortBy === field) {
        this.sortDesc = !this.sortDesc
      } else {
        this.sortBy = field
        this.sortDesc = false
      }
    },

    generateTripId() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0
        const v = c === 'x' ? r : (r & 0x3) | 0x8
        return v.toString(16)
      })
    },

    saveTrip() {
      if (!this.tripName.trim()) return

      const trips = storageService.getTrips()

      // If creating a new trip, check for duplicate names
      if (!this.currentTripId) {
        const existingTrip = trips.find((t) => t.name === this.tripName.trim())
        if (existingTrip) {
          alert(
            'A trip with this name already exists. Please choose a different name.'
          )
          return
        }
      }

      const tripData = {
        id: this.currentTripId || this.generateTripId(),
        name: this.tripName.trim(),
        description: this.tripDescription,
        members: this.members,
        expenses: this.expenses,
        createdAt: Date.now(),
        baseCurrency: this.baseCurrency,
        currencySymbol: this.currencySymbol,
      }

      storageService.saveTrip(tripData)
      this.currentTripId = tripData.id
      this.loadTripList()
      this.updateURL()
    },

    deleteTrip() {
      if (!this.currentTripId) return
      if (!confirm('Are you sure you want to delete this trip?')) return

      storageService.deleteTrip(this.currentTripId)

      this.currentTripId = ''
      this.resetTripData()
      this.loadTripList()
    },

    loadTripList() {
      const trips = storageService.getTrips()
      this.tripList = trips.sort((a, b) => b.createdAt - a.createdAt)
    },

    loadTrip() {
      if (!this.currentTripId) {
        this.resetTripData()
        return
      }

      const trip = this.tripList.find((t) => t.id === this.currentTripId)
      if (trip) {
        this.tripName = trip.name
        this.tripDescription = trip.description || ''
        this.members = trip.members
        this.expenses = trip.expenses

        // Migration: Add currency fields to existing trips (backward compatibility)
        this.baseCurrency = trip.baseCurrency || DEFAULT_CURRENCY
        this.currencySymbol = trip.currencySymbol || DEFAULT_SYMBOL

        // Migration: Add currency fields to existing expenses
        this.expenses = this.expenses.map((expense) => ({
          ...expense,
          currency: expense.currency || this.baseCurrency,
          exchangeRate: expense.exchangeRate || 1,
          baseAmount: expense.baseAmount || expense.amount,
        }))
      }
    },

    resetTripData() {
      const date = new Date()
        .toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
        })
        .replace(/\//g, '')

      this.tripName = `New Trip (${date})`
      this.tripDescription = ''
      this.baseCurrency = DEFAULT_CURRENCY
      this.currencySymbol = DEFAULT_SYMBOL
      this.members = []
      this.expenses = []
      this.newMember = ''
      this.newExpense = {
        description: '',
        amount: null,
        paidBy: [],
        paidAmounts: {},
        splitWith: [],
        splitAmounts: {},
        date: new Date().toISOString().split('T')[0],
        currency: this.baseCurrency,
        exchangeRate: 1,
        baseAmount: null,
        useCustomCurrency: false,
        exchangeRateMode: 'manual',
        manualRate: 1,
        foreignAmount: null,
        calculatedBaseAmount: null,
      }
    },

    addMember() {
      if (this.newMember && !this.members.includes(this.newMember)) {
        this.members.push(this.newMember)
        this.newMember = ''
        this.saveTrip()
      }
    },

    removeMember(member) {
      this.members = this.members.filter((m) => m !== member)
      this.saveTrip()
    },

    onBaseCurrencyChange() {
      this.currencySymbol = CurrencyService.getSymbol(this.baseCurrency)
      this.newExpense.currency = this.baseCurrency
    },

    onCustomCurrencyToggle() {
      if (!this.newExpense.useCustomCurrency) {
        // Reset to base currency
        this.newExpense.currency = this.baseCurrency
        this.newExpense.exchangeRate = 1
        this.newExpense.baseAmount = this.newExpense.amount
      } else {
        // Initialize with default values
        if (this.newExpense.currency === this.baseCurrency) {
          // Pick a different currency as default
          const differentCurrency = CURRENCIES.find(
            (c) => c.code !== this.baseCurrency
          )
          this.newExpense.currency = differentCurrency
            ? differentCurrency.code
            : 'USD'
        }
        this.newExpense.manualRate = 1
        this.newExpense.foreignAmount = this.newExpense.amount
        this.newExpense.calculatedBaseAmount = this.newExpense.amount
      }
    },

    onExpenseCurrencyChange() {
      // Reset exchange rate when currency changes
      this.newExpense.manualRate = 1
      this.newExpense.foreignAmount = this.newExpense.amount
      this.newExpense.calculatedBaseAmount = this.newExpense.amount
    },

    onExchangeRateModeChange() {
      // Sync values when switching modes
      if (this.newExpense.exchangeRateMode === 'manual') {
        if (
          this.newExpense.foreignAmount &&
          this.newExpense.calculatedBaseAmount
        ) {
          this.newExpense.manualRate = CurrencyService.calculateExchangeRate(
            this.newExpense.foreignAmount,
            this.newExpense.calculatedBaseAmount
          )
        }
      } else {
        this.newExpense.foreignAmount = this.newExpense.amount
        if (this.newExpense.manualRate) {
          this.newExpense.calculatedBaseAmount =
            CurrencyService.calculateBaseAmount(
              this.newExpense.amount,
              this.newExpense.manualRate
            )
        }
      }
    },

    onManualRateChange() {
      if (
        this.newExpense.manualRate &&
        CurrencyService.isValidExchangeRate(this.newExpense.manualRate)
      ) {
        this.newExpense.exchangeRate = this.newExpense.manualRate
        this.newExpense.baseAmount = CurrencyService.calculateBaseAmount(
          this.newExpense.amount,
          this.newExpense.manualRate
        )
      }
    },

    onForeignAmountChange() {
      if (
        this.newExpense.foreignAmount &&
        this.newExpense.calculatedBaseAmount &&
        this.newExpense.foreignAmount > 0
      ) {
        const rate = CurrencyService.calculateExchangeRate(
          this.newExpense.foreignAmount,
          this.newExpense.calculatedBaseAmount
        )
        if (CurrencyService.isValidExchangeRate(rate)) {
          this.newExpense.exchangeRate = rate
          this.newExpense.amount = this.newExpense.foreignAmount
          this.newExpense.baseAmount = this.newExpense.calculatedBaseAmount
        }
      }
    },

    onCalculatedBaseAmountChange() {
      if (
        this.newExpense.foreignAmount &&
        this.newExpense.calculatedBaseAmount &&
        this.newExpense.foreignAmount > 0
      ) {
        const rate = CurrencyService.calculateExchangeRate(
          this.newExpense.foreignAmount,
          this.newExpense.calculatedBaseAmount
        )
        if (CurrencyService.isValidExchangeRate(rate)) {
          this.newExpense.exchangeRate = rate
          this.newExpense.amount = this.newExpense.foreignAmount
          this.newExpense.baseAmount = this.newExpense.calculatedBaseAmount
        }
      }
    },

    // Edit expense currency handlers
    onEditCustomCurrencyToggle() {
      if (!this.editingExpense.useCustomCurrency) {
        // Reset to base currency
        this.editingExpense.currency = this.baseCurrency
        this.editingExpense.exchangeRate = 1
        this.editingExpense.baseAmount = this.editingExpense.amount
      } else {
        // Initialize with default values
        if (this.editingExpense.currency === this.baseCurrency) {
          // Pick a different currency as default
          const differentCurrency = CURRENCIES.find(
            (c) => c.code !== this.baseCurrency
          )
          this.editingExpense.currency = differentCurrency
            ? differentCurrency.code
            : 'USD'
        }
        this.editingExpense.manualRate = this.editingExpense.exchangeRate || 1
        this.editingExpense.foreignAmount = this.editingExpense.amount
        this.editingExpense.calculatedBaseAmount =
          this.editingExpense.baseAmount || this.editingExpense.amount
      }
    },

    onEditExpenseCurrencyChange() {
      // Reset exchange rate when currency changes
      this.editingExpense.manualRate = 1
      this.editingExpense.foreignAmount = this.editingExpense.amount
      this.editingExpense.calculatedBaseAmount = this.editingExpense.amount
    },

    onEditExchangeRateModeChange() {
      // Sync values when switching modes
      if (this.editingExpense.exchangeRateMode === 'manual') {
        if (
          this.editingExpense.foreignAmount &&
          this.editingExpense.calculatedBaseAmount
        ) {
          this.editingExpense.manualRate =
            CurrencyService.calculateExchangeRate(
              this.editingExpense.foreignAmount,
              this.editingExpense.calculatedBaseAmount
            )
        }
      } else {
        this.editingExpense.foreignAmount = this.editingExpense.amount
        if (this.editingExpense.manualRate) {
          this.editingExpense.calculatedBaseAmount =
            CurrencyService.calculateBaseAmount(
              this.editingExpense.amount,
              this.editingExpense.manualRate
            )
        }
      }
    },

    onEditManualRateChange() {
      if (
        this.editingExpense.manualRate &&
        CurrencyService.isValidExchangeRate(this.editingExpense.manualRate)
      ) {
        this.editingExpense.exchangeRate = this.editingExpense.manualRate
        this.editingExpense.baseAmount = CurrencyService.calculateBaseAmount(
          this.editingExpense.amount,
          this.editingExpense.manualRate
        )
      }
    },

    onEditForeignAmountChange() {
      if (
        this.editingExpense.foreignAmount &&
        this.editingExpense.calculatedBaseAmount &&
        this.editingExpense.foreignAmount > 0
      ) {
        const rate = CurrencyService.calculateExchangeRate(
          this.editingExpense.foreignAmount,
          this.editingExpense.calculatedBaseAmount
        )
        if (CurrencyService.isValidExchangeRate(rate)) {
          this.editingExpense.exchangeRate = rate
          this.editingExpense.amount = this.editingExpense.foreignAmount
          this.editingExpense.baseAmount =
            this.editingExpense.calculatedBaseAmount
        }
      }
    },

    onEditCalculatedBaseAmountChange() {
      if (
        this.editingExpense.foreignAmount &&
        this.editingExpense.calculatedBaseAmount &&
        this.editingExpense.foreignAmount > 0
      ) {
        const rate = CurrencyService.calculateExchangeRate(
          this.editingExpense.foreignAmount,
          this.editingExpense.calculatedBaseAmount
        )
        if (CurrencyService.isValidExchangeRate(rate)) {
          this.editingExpense.exchangeRate = rate
          this.editingExpense.amount = this.editingExpense.foreignAmount
          this.editingExpense.baseAmount =
            this.editingExpense.calculatedBaseAmount
        }
      }
    },

    addExpense() {
      if (
        this.newExpense.description &&
        this.newExpense.amount &&
        this.newExpense.paidBy.length > 0 &&
        this.newExpense.splitWith.length > 0
      ) {
        // Verify total paid amounts match expense amount
        const totalPaid = Object.values(this.newExpense.paidAmounts).reduce(
          (sum, amount) => sum + amount,
          0
        )
        if (Math.abs(totalPaid - this.newExpense.amount) > 0.01) {
          alert('Total paid amounts must equal the expense amount')
          return
        }

        // Initialize split amounts if not set
        if (Object.keys(this.newExpense.splitAmounts).length === 0) {
          this.updateSplitAmounts()
        }

        // Ensure currency fields are set correctly
        const expenseToAdd = { ...this.newExpense }
        if (!expenseToAdd.useCustomCurrency) {
          expenseToAdd.currency = this.baseCurrency
          expenseToAdd.exchangeRate = 1
          expenseToAdd.baseAmount = expenseToAdd.amount
        } else if (!expenseToAdd.baseAmount) {
          expenseToAdd.baseAmount = CurrencyService.calculateBaseAmount(
            expenseToAdd.amount,
            expenseToAdd.exchangeRate
          )
        }

        // Remove UI-only fields before saving
        expenseToAdd.useCustomCurrency = undefined
        expenseToAdd.exchangeRateMode = undefined
        expenseToAdd.manualRate = undefined
        expenseToAdd.foreignAmount = undefined
        expenseToAdd.calculatedBaseAmount = undefined

        this.expenses.push(expenseToAdd)
        this.newExpense = {
          description: '',
          amount: null,
          paidBy: [],
          paidAmounts: {},
          splitWith: [],
          splitAmounts: {},
          date: new Date().toISOString().split('T')[0],
          currency: this.baseCurrency,
          exchangeRate: 1,
          baseAmount: null,
          useCustomCurrency: false,
          exchangeRateMode: 'manual',
          manualRate: 1,
          foreignAmount: null,
          calculatedBaseAmount: null,
        }
        this.saveTrip()
      }
    },

    removeExpense(index) {
      this.expenses.splice(index, 1)
      this.saveTrip()
    },

    selectAllMembers() {
      this.newExpense.splitWith = [...this.members]
    },

    startEdit(index) {
      this.editingIndex = index
      const expense = this.expenses[index]
      this.editingExpense = {
        ...expense,
        date: expense.date || new Date().toISOString().split('T')[0],
        paidBy: Array.isArray(expense.paidBy)
          ? [...expense.paidBy]
          : [expense.paidBy],
        paidAmounts: expense.paidAmounts
          ? { ...expense.paidAmounts }
          : { [expense.paidBy]: expense.amount },
        splitWith: [...expense.splitWith],
        splitAmounts: { ...(expense.splitAmounts || {}) },
        // Currency fields
        currency: expense.currency || this.baseCurrency,
        exchangeRate: expense.exchangeRate || 1,
        baseAmount: expense.baseAmount || expense.amount,
        useCustomCurrency:
          expense.currency && expense.currency !== this.baseCurrency,
        exchangeRateMode: 'manual',
        manualRate: expense.exchangeRate || 1,
        foreignAmount: expense.amount,
        calculatedBaseAmount: expense.baseAmount || expense.amount,
      }
    },

    saveEdit() {
      if (
        this.editingExpense.description &&
        this.editingExpense.amount &&
        this.editingExpense.paidBy.length > 0 &&
        this.editingExpense.splitWith.length > 0
      ) {
        // Verify total paid amounts match expense amount
        const totalPaid = Object.values(this.editingExpense.paidAmounts).reduce(
          (sum, amount) => sum + amount,
          0
        )
        if (Math.abs(totalPaid - this.editingExpense.amount) > 0.01) {
          alert('Total paid amounts must equal the expense amount')
          return
        }

        // Initialize split amounts if not set
        if (Object.keys(this.editingExpense.splitAmounts).length === 0) {
          const equalShare =
            this.editingExpense.amount / this.editingExpense.splitWith.length
          this.editingExpense.splitAmounts = {}
          this.editingExpense.splitWith.forEach((member) => {
            this.editingExpense.splitAmounts[member] = equalShare
          })
        }

        // Ensure currency fields are set correctly
        const expenseToSave = { ...this.editingExpense }
        if (!expenseToSave.useCustomCurrency) {
          expenseToSave.currency = this.baseCurrency
          expenseToSave.exchangeRate = 1
          expenseToSave.baseAmount = expenseToSave.amount
        } else if (
          !expenseToSave.baseAmount ||
          expenseToSave.baseAmount === expenseToSave.amount
        ) {
          expenseToSave.baseAmount = CurrencyService.calculateBaseAmount(
            expenseToSave.amount,
            expenseToSave.exchangeRate
          )
        }

        // Remove UI-only fields before saving
        expenseToSave.useCustomCurrency = undefined
        expenseToSave.exchangeRateMode = undefined
        expenseToSave.manualRate = undefined
        expenseToSave.foreignAmount = undefined
        expenseToSave.calculatedBaseAmount = undefined

        this.expenses[this.editingIndex] = expenseToSave
        this.editingIndex = -1
        this.editingExpense = null
        this.saveTrip()
      }
    },

    cancelEdit() {
      this.editingIndex = -1
      this.editingExpense = null
    },

    getBaseAmount(expense) {
      // Get amount in base currency for calculations
      if (expense.baseAmount !== null && expense.baseAmount !== undefined) {
        return expense.baseAmount
      }
      if (expense.exchangeRate && expense.exchangeRate !== 1) {
        return expense.amount * expense.exchangeRate
      }
      return expense.amount
    },

    getTotalPaid(member) {
      return ExpenseCalculationService.getTotalPaid(this.expenses, member)
    },

    getTotalShouldPay(member) {
      return ExpenseCalculationService.getTotalShouldPay(this.expenses, member)
    },

    getBalance(member) {
      return ExpenseCalculationService.getBalance(this.expenses, member)
    },

    getPaymentPlan() {
      return ExpenseCalculationService.getPaymentPlan(
        this.expenses,
        this.members
      )
    },

    exportData() {
      const data = JSON.stringify(storageService.exportData(), null, 2)
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'expense_tracker_data.json'
      a.click()
    },

    exportCsv() {
      // Create CSV header row
      const headers = [
        'Date',
        'Description',
        'Amount',
        'Paid By',
        'Split With',
        'Notes',
      ]

      // Create CSV rows for each expense
      const rows = this.expenses.map((expense) => {
        return [
          expense.date || '',
          expense.description,
          expense.amount,
          Array.isArray(expense.paidBy)
            ? expense.paidBy.join(', ')
            : expense.paidBy,
          expense.splitWith.join(', '),
          '',
        ]
      })

      // Combine header and rows
      const csvContent = [
        headers.join(','),
        ...rows.map((row) =>
          row
            .map((cell) => {
              // Handle commas in cell values by quoting
              if (cell === null || cell === undefined) return ''
              const cellStr = String(cell)
              return cellStr.includes(',') ? `"${cellStr}"` : cellStr
            })
            .join(',')
        ),
      ].join('\n')

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute(
        'download',
        `${this.tripName.replace(/\s+/g, '_')}_expenses.csv`
      )
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    },

    importData(event) {
      const file = event.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result)
            const existingTrips = storageService.getTrips()

            // Handle old format (single trip)
            if (data.tripName !== undefined) {
              const tripData = {
                id: data.id || this.generateTripId(),
                name: data.tripName,
                members: data.members || [],
                expenses: data.expenses || [],
                createdAt: data.createdAt || Date.now(),
              }
              storageService.saveTrip(tripData)
              this.loadTripList()
              this.currentTripId = tripData.id
              this.loadTrip()
            }
            // Handle new format (trip list)
            else if (data.tripList) {
              // Merge trips using storage service
              data.tripList.forEach((importedTrip) => {
                storageService.saveTrip(importedTrip)
              })
              this.loadTripList()
              if (data.tripList.length > 0) {
                this.currentTripId = data.tripList[0].id
                this.loadTrip()
              }
            }

            // Clear the file input
            event.target.value = ''
          } catch (error) {
            console.error('Error importing data:', error)
            alert('Error importing data. Please check the file format.')
          }
        }
        reader.readAsText(file)
      }
    },

    getCrossPaidAmount(payer, receiver) {
      return ExpenseCalculationService.getCrossPaidAmount(
        this.expenses,
        payer,
        receiver
      )
    },

    getTotalExpenses() {
      return ExpenseCalculationService.getTotalExpenses(this.expenses)
    },

    toggleCrossTable() {
      this.showCrossTable = !this.showCrossTable
    },

    togglePaidForWhom() {
      this.showPaidForWhom = !this.showPaidForWhom
    },

    toggleWhoOwesWho() {
      this.showWhoOwesWho = !this.showWhoOwesWho
    },

    getCreditors() {
      return this.members
        .filter((m) => this.getBalance(m) > 0)
        .sort((a, b) => this.getBalance(b) - this.getBalance(a))
    },

    getDebtors() {
      return this.members
        .filter((m) => this.getBalance(m) < 0)
        .sort((a, b) => this.getBalance(a) - this.getBalance(b))
    },

    getOwedAmount(debtor, creditor) {
      const payment = this.getPaymentPlan().find(
        (p) => p.from === debtor && p.to === creditor
      )
      return payment
        ? this.formatCurrency(payment.amount, this.baseCurrency)
        : '-'
    },

    getCrossTableAmount(expense, member) {
      return ExpenseCalculationService.getCrossTableAmount(expense, member)
    },

    updateSplitAmounts() {
      if (!this.newExpense.splitWith.length) return

      const totalAmount = this.newExpense.amount || 0
      const numMembers = this.newExpense.splitWith.length
      const equalShare = Math.round(totalAmount / numMembers)

      const newSplitAmounts = {}
      let remainingAmount = totalAmount

      this.newExpense.splitWith.forEach((member, index) => {
        if (index === this.newExpense.splitWith.length - 1) {
          newSplitAmounts[member] = remainingAmount
        } else {
          newSplitAmounts[member] = equalShare
          remainingAmount -= equalShare
        }
      })

      this.newExpense.splitAmounts = newSplitAmounts
    },

    updateEditSplitAmounts() {
      if (!this.editingExpense.splitWith.length) return

      const totalAmount = this.editingExpense.amount || 0
      const numMembers = this.editingExpense.splitWith.length
      const equalShare = Math.round(totalAmount / numMembers)

      const newSplitAmounts = {}
      let remainingAmount = totalAmount

      this.editingExpense.splitWith.forEach((member, index) => {
        if (index === this.editingExpense.splitWith.length - 1) {
          newSplitAmounts[member] = remainingAmount
        } else {
          newSplitAmounts[member] = equalShare
          remainingAmount -= equalShare
        }
      })

      this.editingExpense.splitAmounts = newSplitAmounts
    },

    selectAllPayers() {
      this.newExpense.paidBy = [...this.members]
      this.updatePaidAmounts()
    },

    updatePaidAmounts() {
      if (!this.newExpense.amount || this.newExpense.paidBy.length === 0) return

      const totalAmount = this.newExpense.amount
      const numPayers = this.newExpense.paidBy.length
      const equalShare = Math.round(totalAmount / numPayers)

      const newPaidAmounts = {}
      let remainingAmount = totalAmount

      this.newExpense.paidBy.forEach((member, index) => {
        if (index === this.newExpense.paidBy.length - 1) {
          newPaidAmounts[member] = remainingAmount
        } else {
          newPaidAmounts[member] = equalShare
          remainingAmount -= equalShare
        }
      })

      this.newExpense.paidAmounts = newPaidAmounts
    },

    formatPayers(expense) {
      if (Array.isArray(expense.paidBy)) {
        const expenseCurrency = expense.currency || this.baseCurrency
        return expense.paidBy
          .map(
            (p) =>
              `${p} (${this.formatCurrency(expense.paidAmounts[p], expenseCurrency)})`
          )
          .join(', ')
      }
      return expense.paidBy
    },

    selectAllPayersEdit() {
      this.editingExpense.paidBy = [...this.members]
      this.updateEditPaidAmounts()
    },

    selectAllSplitEdit() {
      this.editingExpense.splitWith = [...this.members]
      this.updateEditSplitAmounts()
    },

    updateEditPaidAmounts() {
      if (
        !this.editingExpense.amount ||
        this.editingExpense.paidBy.length === 0
      )
        return

      const totalAmount = this.editingExpense.amount
      const numPayers = this.editingExpense.paidBy.length
      const equalShare = Math.round(totalAmount / numPayers)

      const newPaidAmounts = {}
      let remainingAmount = totalAmount

      this.editingExpense.paidBy.forEach((member, index) => {
        if (index === this.editingExpense.paidBy.length - 1) {
          newPaidAmounts[member] = remainingAmount
        } else {
          newPaidAmounts[member] = equalShare
          remainingAmount -= equalShare
        }
      })

      this.editingExpense.paidAmounts = newPaidAmounts
    },

    formatSplitWith(expense) {
      const baseAmount = this.getBaseAmount(expense)
      return expense.splitWith
        .map((m) => {
          let amount
          if (expense.splitAmounts?.[m]) {
            // Convert split amount proportionally to base currency
            const splitRatio = expense.splitAmounts[m] / expense.amount
            amount = baseAmount * splitRatio
          } else {
            // Calculate remaining amount after accounting for specified split amounts
            const specifiedTotal = Object.values(
              expense.splitAmounts || {}
            ).reduce((sum, amt) => sum + amt, 0)
            const specifiedRatio = specifiedTotal / expense.amount
            const remainingAmount = baseAmount * (1 - specifiedRatio)
            const membersWithoutSpecifiedAmount = expense.splitWith.filter(
              (member) => !expense.splitAmounts?.[member]
            ).length
            amount =
              membersWithoutSpecifiedAmount > 0
                ? remainingAmount / membersWithoutSpecifiedAmount
                : baseAmount / expense.splitWith.length
          }
          return `${m} (${this.formatCurrency(amount, this.baseCurrency)})`
        })
        .join(', ')
    },

    formatCurrency(amount, currencyCode, showDecimals = false) {
      return CurrencyService.format(amount, currencyCode, showDecimals)
    },

    updateAmounts() {
      this.updatePaidAmounts()
      this.updateSplitAmounts()
    },

    updateEditAmounts() {
      this.updateEditPaidAmounts()
      this.updateEditSplitAmounts()
    },

    shareViaURL() {
      // Gather all trip data to share
      const tripData = {
        name: this.tripName,
        description: this.tripDescription,
        members: this.members,
        expenses: this.expenses,
        baseCurrency: this.baseCurrency,
        currencySymbol: this.currencySymbol,
      }

      // Compress the data into URL-safe format
      const jsonStr = JSON.stringify(tripData)
      const compressed = this.compressData(jsonStr)

      // Create shareable URL with compressed data in hash
      const tripUrl = `${window.location.origin}/expense-tracker/#data=${compressed}`

      // Copy to clipboard
      navigator.clipboard
        .writeText(tripUrl)
        .then(() =>
          alert(
            'Shareable URL copied to clipboard! Anyone with this link can view the trip data.'
          )
        )
        .catch(() => {
          // Fallback if clipboard API fails
          const input = document.createElement('input')
          input.value = tripUrl
          document.body.appendChild(input)
          input.select()
          document.execCommand('copy')
          document.body.removeChild(input)
          alert(
            'Shareable URL copied to clipboard! Anyone with this link can view the trip data.'
          )
        })
    },

    updateURL() {
      if (
        this.currentTripId &&
        this.$route.params.tripId !== this.currentTripId
      ) {
        this.$router.replace(`/trip/${this.currentTripId}`)
      }
    },

    compressData(str) {
      // Use base64 encoding for URL safety
      return btoa(encodeURIComponent(str))
    },

    decompressData(str) {
      try {
        return decodeURIComponent(atob(str))
      } catch (e) {
        console.error('Error decompressing data:', e)
        return null
      }
    },
  },
  mounted() {
    this.loadTripList()

    // Handle route parameters
    if (this.routeTripId) {
      this.currentTripId = this.routeTripId
      this.loadTrip()
    }

    // Check for shared data in URL (legacy support)
    const hash = window.location.hash
    if (hash.startsWith('#data=')) {
      try {
        const compressed = hash.substring(6) // Remove '#data='
        const jsonStr = this.decompressData(compressed)
        if (jsonStr) {
          const data = JSON.parse(jsonStr)
          this.tripName = data.name
          this.tripDescription = data.description || ''
          this.members = data.members
          this.expenses = data.expenses
        }
      } catch (e) {
        console.error('Error loading shared data:', e)
      }
    }
  },
  watch: {
    currentTripId: {
      handler(newTripId, oldTripId) {
        // Only navigate if the trip ID actually changed and we're not in the initial load
        if (newTripId !== oldTripId && this.$route) {
          if (newTripId) {
            if (this.$route.params.tripId !== newTripId) {
              this.$router.push(`/trip/${newTripId}`)
            }
            this.loadTrip()
          } else {
            if (this.$route.path !== '/') {
              this.$router.push('/')
            }
            this.resetTripData()
          }
        }
      },
    },
    'newExpense.paidAmounts': {
      deep: true,
      handler(newVal) {
        if (!newVal) return
        const total = Object.values(newVal).reduce(
          (sum, amount) => sum + (amount || 0),
          0
        )
        if (total > 0 && Math.abs(total - this.newExpense.amount) > 0.01) {
          this.newExpense.amount = total
          this.updateSplitAmounts()
        }
      },
    },
    'editingExpense.paidAmounts': {
      deep: true,
      handler(newVal) {
        if (!newVal || !this.editingExpense) return
        const total = Object.values(newVal).reduce(
          (sum, amount) => sum + (amount || 0),
          0
        )
        if (total > 0 && Math.abs(total - this.editingExpense.amount) > 0.01) {
          this.editingExpense.amount = total
          this.updateEditSplitAmounts()
        }
      },
    },
  },
}
</script>

<style scoped>
.expense-table th {
  position: sticky;
  top: 0;
  background: white;
}
.total-row {
  font-weight: bold;
}

/* Sticky first column in cross-table and settlement-table */
.cross-table .sticky-col,
.settlement-table .sticky-col {
  position: sticky;
  left: 0;
  z-index: 10;
  background: white;
  min-width: 200px;
  max-width: 300px;
}

.cross-table thead .sticky-col,
.settlement-table thead .sticky-col {
  z-index: 11;
}

.cross-table .table-secondary .sticky-col {
  background: var(--bs-table-bg);
}

/* Add shadow effect when scrolling */
.cross-table .sticky-col::after,
.settlement-table .sticky-col::after {
  content: '';
  position: absolute;
  top: 0;
  right: -10px;
  bottom: 0;
  width: 10px;
  background: linear-gradient(to right, rgba(0,0,0,0.1), transparent);
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s;
}
</style>