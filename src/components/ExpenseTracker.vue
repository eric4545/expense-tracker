<template>
  <div class="container mt-4">
    <h1>{{ tripName }} Expense Tracker</h1>

    <!-- Trip Management -->
    <div class="mb-4">
      <div class="row">
        <div class="col-md-6">
          <select v-model="currentTripId" class="form-select mb-2" @change="loadTrip">
            <option value="">Create New Trip</option>
            <option v-for="trip in tripList" :value="trip.id">
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
          <textarea v-model="tripDescription" class="form-control" placeholder="Trip Description" rows="2"></textarea>
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

    <!-- CSV Import -->
    <CsvImport
      :members="members"
      @import-expenses="handleBulkImport"
    />

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
              <span v-if="editingIndex !== index">¥{{ expense.amount }}</span>
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
                <td>¥{{ Math.round(getTotalPaid(member)) }}</td>
                <td>¥{{ Math.round(getTotalShouldPay(member)) }}</td>
                <td :class="getBalance(member) >= 0 ? 'text-success' : 'text-danger'">
                  ¥{{ Math.round(getBalance(member)) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Cross-table Format -->
    <div class="card mt-4">
      <div class="card-header" style="cursor: pointer" @click="toggleCrossTable">
        <h5 class="card-title mb-0">
          <i :class="showCrossTable ? 'bi bi-chevron-down' : 'bi bi-chevron-right'"></i>
          Cross-table Format
        </h5>
      </div>
      <div class="card-body" v-if="showCrossTable">
        <div class="table-responsive">
          <table class="table table-bordered">
            <thead>
              <tr>
                <th>Expense Item (Paid By)</th>
                <th v-for="member in members" :key="member" class="text-center">{{ member }}</th>
                <th class="text-center">Total</th>
              </tr>
              <tr class="table-secondary">
                <th>Paid By \ For Who</th>
                <th v-for="member in members" :key="member" class="text-center">Should Pay</th>
                <th class="text-center">Total Paid</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="expense in sortedExpenses" :key="expense.description">
                <td>
                  {{ expense.description }}
                  <span class="text-success fw-bold">
                    ({{ expense.paidBy }})
                  </span>
                </td>
                <td v-for="member in members" :key="member" class="text-center">
                  <template v-if="expense.splitWith.includes(member)">
                    <span :class="expense.paidBy === member ? 'text-success fw-bold' : ''">
                      ¥{{ Math.round(getCrossTableAmount(expense, member)) }}
                    </span>
                  </template>
                  <template v-else>-</template>
                </td>
                <td class="text-center">¥{{ Math.round(expense.amount) }}</td>
              </tr>
              <tr class="table-secondary">
                <td><strong>Total</strong></td>
                <td v-for="member in members" :key="member" class="text-center">
                  <strong>¥{{ Math.round(getTotalShouldPay(member)) }}</strong>
                </td>
                <td class="text-center"><strong>¥{{ Math.round(getTotalExpenses()) }}</strong></td>
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
                    ¥{{ Math.round(getCrossPaidAmount(payer, receiver)) }}
                  </template>
                  <template v-else>-</template>
                </td>
                <td class="text-center"><strong>¥{{ Math.round(getTotalPaid(payer)) }}</strong></td>
              </tr>
              <tr class="table-secondary">
                <td><strong>Total Should Pay</strong></td>
                <td v-for="member in members" :key="member" class="text-center">
                  <strong>¥{{ Math.round(getTotalShouldPay(member)) }}</strong>
                </td>
                <td class="text-center"><strong>¥{{ Math.round(getTotalExpenses()) }}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Who Owes Who -->
    <div class="card mt-4">
      <div class="card-header" style="cursor: pointer" @click="toggleWhoOwesWho">
        <h5 class="card-title mb-0">
          <i :class="showWhoOwesWho ? 'bi bi-chevron-down' : 'bi bi-chevron-right'"></i>
          Who Owes Who (Amount to Pay)
        </h5>
      </div>
      <div class="card-body" v-if="showWhoOwesWho">
        <div class="table-responsive">
          <table class="table table-bordered">
            <thead>
              <tr>
                <th>Needs to Pay ↓ \ Should Receive →</th>
                <th v-for="creditor in getCreditors()" :key="creditor" class="text-center">
                  {{ creditor }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="debtor in getDebtors()" :key="debtor">
                <td><strong>{{ debtor }}</strong></td>
                <td v-for="creditor in getCreditors()" :key="creditor" class="text-center">
                  {{ getOwedAmount(debtor, creditor) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="mt-4">
          <h6>Detailed Payment Instructions:</h6>
          <table class="table">
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
                <td>¥{{ Math.round(payment.amount) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Import/Export -->
    <div class="mt-4">
      <button @click="exportData" class="btn btn-primary me-2">Export Data</button>
      <input type="file" @change="importData" class="form-control d-inline-block w-auto me-2" accept=".json">
      <button @click="shareViaURL" class="btn btn-success">Share via URL</button>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import CsvImport from './CsvImport.vue';

export default {
  name: 'ExpenseTracker',
  components: {
    CsvImport
  },
  data() {
    return {
      tripName: 'New Trip',
      tripDescription: '',
      currentTripId: '',
      tripList: [],
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
        date: new Date().toISOString().split('T')[0]
      },
      editingIndex: -1,
      editingExpense: null,
      sortBy: 'index',
      sortDesc: false,
      showCrossTable: true,
      showPaidForWhom: true,
      showWhoOwesWho: true
    }
  },
  computed: {
    sortedExpenses() {
      return [...this.expenses].sort((a, b) => {
        let comparison = 0;
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
    }
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
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    },

    saveTrip() {
      if (!this.tripName.trim()) return

      const trips = JSON.parse(localStorage.getItem('trips') || '[]')

      // If creating a new trip, check for duplicate names
      if (!this.currentTripId) {
        const existingTrip = trips.find(t => t.name === this.tripName.trim())
        if (existingTrip) {
          alert('A trip with this name already exists. Please choose a different name.')
          return
        }
      }

      const tripData = {
        id: this.currentTripId || this.generateTripId(),
        name: this.tripName.trim(),
        description: this.tripDescription,
        members: this.members,
        expenses: this.expenses,
        createdAt: Date.now()
      }

      const existingIndex = trips.findIndex(t => t.id === tripData.id)
      if (existingIndex >= 0) {
        trips[existingIndex] = tripData
      } else {
        trips.push(tripData)
      }

      localStorage.setItem('trips', JSON.stringify(trips))
      this.currentTripId = tripData.id
      this.loadTripList()
    },

    deleteTrip() {
      if (!this.currentTripId) return
      if (!confirm('Are you sure you want to delete this trip?')) return

      const trips = JSON.parse(localStorage.getItem('trips') || '[]')
      const filteredTrips = trips.filter(t => t.id !== this.currentTripId)
      localStorage.setItem('trips', JSON.stringify(filteredTrips))

      this.currentTripId = ''
      this.resetTripData()
      this.loadTripList()
    },

    loadTripList() {
      const trips = JSON.parse(localStorage.getItem('trips') || '[]')
      this.tripList = trips.sort((a, b) => b.createdAt - a.createdAt)
    },

    loadTrip() {
      if (!this.currentTripId) {
        this.resetTripData()
        return
      }

      const trip = this.tripList.find(t => t.id === this.currentTripId)
      if (trip) {
        this.tripName = trip.name
        this.tripDescription = trip.description || ''
        this.members = trip.members
        this.expenses = trip.expenses
      }
    },

    resetTripData() {
      const date = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/\//g, '')

      this.tripName = `New Trip (${date})`
      this.tripDescription = ''
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
        date: new Date().toISOString().split('T')[0]
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
      this.members = this.members.filter(m => m !== member)
      this.saveTrip()
    },

    addExpense() {
      if (this.newExpense.description &&
          this.newExpense.amount &&
          this.newExpense.paidBy.length > 0 &&
          this.newExpense.splitWith.length > 0) {

        // Verify total paid amounts match expense amount
        const totalPaid = Object.values(this.newExpense.paidAmounts).reduce((sum, amount) => sum + amount, 0)
        if (Math.abs(totalPaid - this.newExpense.amount) > 0.01) {
          alert('Total paid amounts must equal the expense amount')
          return
        }

        // Initialize split amounts if not set
        if (Object.keys(this.newExpense.splitAmounts).length === 0) {
          this.updateSplitAmounts()
        }

        this.expenses.push({...this.newExpense})
        this.newExpense = {
          description: '',
          amount: null,
          paidBy: [],
          paidAmounts: {},
          splitWith: [],
          splitAmounts: {},
          date: new Date().toISOString().split('T')[0]
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
        paidBy: Array.isArray(expense.paidBy) ? [...expense.paidBy] : [expense.paidBy],
        paidAmounts: expense.paidAmounts ? {...expense.paidAmounts} :
          { [expense.paidBy]: expense.amount },
        splitWith: [...expense.splitWith],
        splitAmounts: {...(expense.splitAmounts || {})}
      }
    },

    saveEdit() {
      if (this.editingExpense.description &&
          this.editingExpense.amount &&
          this.editingExpense.paidBy.length > 0 &&
          this.editingExpense.splitWith.length > 0) {

        // Verify total paid amounts match expense amount
        const totalPaid = Object.values(this.editingExpense.paidAmounts).reduce((sum, amount) => sum + amount, 0)
        if (Math.abs(totalPaid - this.editingExpense.amount) > 0.01) {
          alert('Total paid amounts must equal the expense amount')
          return
        }

        // Initialize split amounts if not set
        if (Object.keys(this.editingExpense.splitAmounts).length === 0) {
          const equalShare = this.editingExpense.amount / this.editingExpense.splitWith.length
          this.editingExpense.splitAmounts = {}
          this.editingExpense.splitWith.forEach(member => {
            this.editingExpense.splitAmounts[member] = equalShare
          })
        }

        this.expenses[this.editingIndex] = { ...this.editingExpense }
        this.editingIndex = -1
        this.editingExpense = null
        this.saveTrip()
      }
    },

    cancelEdit() {
      this.editingIndex = -1
      this.editingExpense = null
    },

    getTotalPaid(member) {
      return this.expenses.reduce((sum, expense) => {
        if (Array.isArray(expense.paidBy)) {
          // If multiple payers with specific amounts
          return sum + (expense.paidAmounts[member] || 0)
        } else if (expense.paidBy === member) {
          // Single payer
          return sum + expense.amount
        }
        return sum
      }, 0)
    },

    getTotalShouldPay(member) {
      let total = 0;
      for (const expense of this.expenses) {
        if (expense.splitWith.includes(member)) {
          if (expense.splitAmounts && expense.splitAmounts[member]) {
            total += expense.splitAmounts[member];
          } else {
            total += expense.amount / expense.splitWith.length;
          }
        }
      }
      return total;
    },

    getBalance(member) {
      const paid = this.getTotalPaid(member)
      const shouldPay = this.getTotalShouldPay(member)
      return Math.round((paid - shouldPay) * 100) / 100
    },

    getPaymentPlan() {
      const payments = []
      const balances = {}

      // Calculate initial balances
      this.members.forEach(member => {
        balances[member] = this.getBalance(member)
      })

      // Sort members by balance
      const creditors = [...this.members]
        .filter(m => balances[m] > 0)
        .sort((a, b) => balances[b] - balances[a])

      const debtors = [...this.members]
        .filter(m => balances[m] < 0)
        .sort((a, b) => balances[a] - balances[b]) // Most negative first

      // Process each debtor
      debtors.forEach(debtor => {
        let remainingDebt = Math.abs(balances[debtor])

        // Try to settle with creditors
        creditors.forEach(creditor => {
          if (remainingDebt > 0 && balances[creditor] > 0) {
            const amount = Math.min(remainingDebt, balances[creditor])
            if (amount > 0.01) { // Only add payments greater than 1 cent
              payments.push({
                from: debtor,
                to: creditor,
                amount: Math.round(amount * 100) / 100
              })
              remainingDebt -= amount
              balances[creditor] -= amount
            }
          }
        })
      })

      return payments.sort((a, b) => b.amount - a.amount) // Sort by amount descending
    },

    exportData() {
      const data = JSON.stringify({
        tripList: this.tripList
      }, null, 2)
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'expense_tracker_data.json'
      a.click()
    },

    importData(event) {
      const file = event.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result)
            const existingTrips = JSON.parse(localStorage.getItem('trips') || '[]')

            // Handle old format (single trip)
            if (data.tripName !== undefined) {
              const tripData = {
                id: data.id || this.generateTripId(), // Use existing ID if available
                name: data.tripName,
                members: data.members || [],
                expenses: data.expenses || [],
                createdAt: data.createdAt || Date.now()
              }

              // Update or add the trip
              const existingIndex = existingTrips.findIndex(t => t.id === tripData.id)
              if (existingIndex >= 0) {
                existingTrips[existingIndex] = tripData
              } else {
                existingTrips.push(tripData)
              }
              localStorage.setItem('trips', JSON.stringify(existingTrips))
              this.loadTripList()
              this.currentTripId = tripData.id
              this.loadTrip()
            }
            // Handle new format (trip list)
            else if (data.tripList) {
              // Merge trips, overriding existing ones with same ID
              const mergedTrips = [...existingTrips]
              data.tripList.forEach(importedTrip => {
                const existingIndex = mergedTrips.findIndex(t => t.id === importedTrip.id)
                if (existingIndex >= 0) {
                  mergedTrips[existingIndex] = importedTrip
                } else {
                  mergedTrips.push(importedTrip)
                }
              })
              localStorage.setItem('trips', JSON.stringify(mergedTrips))
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
      return this.expenses
        .filter(e => {
          if (Array.isArray(e.paidBy)) {
            return e.paidBy.includes(payer) && e.splitWith.includes(receiver)
          }
          return e.paidBy === payer && e.splitWith.includes(receiver)
        })
        .reduce((sum, e) => {
          if (Array.isArray(e.paidBy)) {
            // For multiple payers
            const paidAmount = e.paidAmounts[payer] || 0
            const splitShare = e.splitAmounts?.[receiver] || e.amount / e.splitWith.length
            if (payer === receiver) {
              return sum + splitShare
            }
            return sum + splitShare
          } else {
            // For single payer
            if (e.splitAmounts && e.splitAmounts[receiver]) {
              return sum + e.splitAmounts[receiver]
            }
            return sum + (e.amount / e.splitWith.length)
          }
        }, 0)
    },

    getTotalExpenses() {
      return this.expenses.reduce((sum, e) => sum + e.amount, 0)
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
        .filter(m => this.getBalance(m) > 0)
        .sort((a, b) => this.getBalance(b) - this.getBalance(a))
    },

    getDebtors() {
      return this.members
        .filter(m => this.getBalance(m) < 0)
        .sort((a, b) => this.getBalance(a) - this.getBalance(b))
    },

    getOwedAmount(debtor, creditor) {
      const payment = this.getPaymentPlan()
        .find(p => p.from === debtor && p.to === creditor)
      return payment ? `¥${Math.round(payment.amount)}` : '-'
    },

    getCrossTableAmount(expense, member) {
      if (!expense.splitWith.includes(member)) return 0;
      if (expense.splitAmounts && expense.splitAmounts[member]) {
        return expense.splitAmounts[member];
      }
      return expense.amount / expense.splitWith.length;
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
        return expense.paidBy.map(p => `${p} (¥${expense.paidAmounts[p]})`).join(', ')
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
      if (!this.editingExpense.amount || this.editingExpense.paidBy.length === 0) return

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
      return expense.splitWith.map(m =>
        `${m} (¥${Math.round(expense.splitAmounts?.[m] || expense.amount / expense.splitWith.length)})`
      ).join(', ')
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
      const tripData = {
        name: this.tripName,
        description: this.tripDescription,
        members: this.members,
        expenses: this.expenses
      }
      const compressed = this.compressData(JSON.stringify(tripData))
      const url = `${window.location.origin}${window.location.pathname}#data=${compressed}`

      // Copy to clipboard
      navigator.clipboard.writeText(url)
        .then(() => alert('Share URL copied to clipboard!'))
        .catch(() => {
          // Fallback if clipboard API fails
          const input = document.createElement('input')
          input.value = url
          document.body.appendChild(input)
          input.select()
          document.execCommand('copy')
          document.body.removeChild(input)
          alert('Share URL copied to clipboard!')
        })
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

    handleBulkImport(expenses) {
      expenses.forEach(expense => {
        const newExpense = {
          description: expense.description,
          amount: expense.amount,
          date: expense.date,
          paidBy: [expense.paidBy],
          splitWith: expense.splitWith,
          paidAmounts: { [expense.paidBy]: expense.amount },
          splitAmounts: {}
        };

        // Calculate split amounts
        const perPerson = expense.amount / expense.splitWith.length;
        expense.splitWith.forEach(member => {
          newExpense.splitAmounts[member] = perPerson;
        });

        this.expenses.push(newExpense);
      });

      // Save after bulk import
      this.saveTrip();
    }
  },
  mounted() {
    this.loadTripList()

    // Check for shared data in URL
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
    'newExpense.paidAmounts': {
      deep: true,
      handler(newVal) {
        if (!newVal) return
        const total = Object.values(newVal).reduce((sum, amount) => sum + (amount || 0), 0)
        if (total > 0 && Math.abs(total - this.newExpense.amount) > 0.01) {
          this.newExpense.amount = total
          this.updateSplitAmounts()
        }
      }
    },
    'editingExpense.paidAmounts': {
      deep: true,
      handler(newVal) {
        if (!newVal || !this.editingExpense) return
        const total = Object.values(newVal).reduce((sum, amount) => sum + (amount || 0), 0)
        if (total > 0 && Math.abs(total - this.editingExpense.amount) > 0.01) {
          this.editingExpense.amount = total
          this.updateEditSplitAmounts()
        }
      }
    }
  }
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
</style>