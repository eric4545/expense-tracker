import { computed, ref } from 'vue'

// Google Sheets API configuration
const SCOPES = 'https://www.googleapis.com/auth/spreadsheets'
const DISCOVERY_DOC = 'https://sheets.googleapis.com/$discovery/rest?version=v4'

export function useGoogleSheets() {
  // State
  const accessToken = ref(localStorage.getItem('google-sheets-token') || null)
  const tokenExpiry = ref(
    localStorage.getItem('google-sheets-token-expiry') || null
  )
  const currentSpreadsheetId = ref(
    localStorage.getItem('google-sheets-spreadsheet-id') || null
  )
  const isSyncing = ref(false)
  const lastSyncTime = ref(
    localStorage.getItem('google-sheets-last-sync') || null
  )
  const clientId = ref(localStorage.getItem('google-sheets-client-id') || null)

  // Computed
  const isAuthenticated = computed(() => {
    if (!accessToken.value || !tokenExpiry.value) return false
    // Check if token is expired
    const now = Date.now()
    const expiry = Number.parseInt(tokenExpiry.value, 10)
    return now < expiry
  })

  // Initialize Google Identity Services
  const initGoogleAuth = () => {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined') {
        reject(new Error('Google Identity Services not loaded'))
        return
      }
      resolve()
    })
  }

  // Authenticate with Google OAuth 2.0
  const authenticate = async (customClientId = null) => {
    try {
      await initGoogleAuth()

      const useClientId = customClientId || clientId.value

      if (!useClientId) {
        throw new Error('Client ID is required. Please configure it first.')
      }

      return new Promise((resolve, reject) => {
        const client = google.accounts.oauth2.initTokenClient({
          client_id: useClientId,
          scope: SCOPES,
          callback: (response) => {
            if (response.error) {
              reject(new Error(response.error))
              return
            }

            // Store token and expiry
            accessToken.value = response.access_token
            const expiry = Date.now() + response.expires_in * 1000
            tokenExpiry.value = expiry.toString()

            localStorage.setItem('google-sheets-token', response.access_token)
            localStorage.setItem(
              'google-sheets-token-expiry',
              expiry.toString()
            )

            if (customClientId) {
              clientId.value = customClientId
              localStorage.setItem('google-sheets-client-id', customClientId)
            }

            resolve(response)
          },
        })

        client.requestAccessToken()
      })
    } catch (error) {
      console.error('Authentication error:', error)
      throw error
    }
  }

  // Sign out
  const signOut = () => {
    if (accessToken.value && typeof google !== 'undefined') {
      google.accounts.oauth2.revoke(accessToken.value, () => {})
    }

    // Clear stored data
    accessToken.value = null
    tokenExpiry.value = null
    currentSpreadsheetId.value = null
    lastSyncTime.value = null

    localStorage.removeItem('google-sheets-token')
    localStorage.removeItem('google-sheets-token-expiry')
    localStorage.removeItem('google-sheets-spreadsheet-id')
    localStorage.removeItem('google-sheets-last-sync')
  }

  // Make authenticated API request
  const apiRequest = async (url, options = {}) => {
    if (!isAuthenticated.value) {
      throw new Error('Not authenticated')
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken.value}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'API request failed')
    }

    return response.json()
  }

  // Create new spreadsheet
  const createSpreadsheet = async (tripName) => {
    try {
      const url = 'https://sheets.googleapis.com/v4/spreadsheets'

      const requestBody = {
        properties: {
          title: `${tripName} - Expense Tracker`,
        },
        sheets: [
          {
            properties: {
              title: 'Expenses',
              gridProperties: {
                frozenRowCount: 1,
              },
            },
          },
          {
            properties: {
              title: 'Summary',
              gridProperties: {
                frozenRowCount: 1,
              },
            },
          },
          {
            properties: {
              title: 'Balance',
              gridProperties: {
                frozenRowCount: 1,
              },
            },
          },
        ],
      }

      const result = await apiRequest(url, {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      currentSpreadsheetId.value = result.spreadsheetId
      localStorage.setItem('google-sheets-spreadsheet-id', result.spreadsheetId)

      return result
    } catch (error) {
      console.error('Error creating spreadsheet:', error)
      throw error
    }
  }

  // Write data to a specific sheet
  const writeToSheet = async (spreadsheetId, sheetName, data) => {
    try {
      const range = `${sheetName}!A1`
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:clear`

      // Clear existing data first
      await apiRequest(url, {
        method: 'POST',
      })

      // Write new data
      const writeUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`

      await apiRequest(writeUrl, {
        method: 'PUT',
        body: JSON.stringify({
          range,
          values: data,
        }),
      })
    } catch (error) {
      console.error(`Error writing to sheet ${sheetName}:`, error)
      throw error
    }
  }

  // Format expenses for sheet (reuses existing formatters)
  const formatExpensesForSheet = (expenses, formatPayers, formatSplitWith) => {
    const headers = [
      [
        'Date',
        'Description',
        'Total Amount',
        'Paid By (amounts)',
        'Split With (amounts)',
      ],
    ]

    const rows = expenses.map((expense) => [
      expense.date || '',
      expense.description,
      expense.amount,
      formatPayers(expense),
      formatSplitWith(expense),
    ])

    return [...headers, ...rows]
  }

  // Format payment plan for Summary sheet
  const formatSummaryForSheet = (paymentPlan) => {
    const headers = [['From', 'To', 'Amount']]

    const rows = paymentPlan.map((payment) => [
      payment.from,
      payment.to,
      `¥${Math.round(payment.amount)}`,
    ])

    return [...headers, ...rows]
  }

  // Calculate and format balance for Balance sheet
  const formatBalanceForSheet = (members, expenses) => {
    const headers = [['Member', 'Paid', 'Owes', 'Balance']]

    const balances = {}
    members.forEach((member) => {
      balances[member] = { paid: 0, owes: 0 }
    })

    // Calculate paid amounts
    expenses.forEach((expense) => {
      if (Array.isArray(expense.paidBy)) {
        expense.paidBy.forEach((payer) => {
          if (balances[payer]) {
            balances[payer].paid += expense.paidAmounts?.[payer] || 0
          }
        })
      }

      // Calculate owed amounts
      expense.splitWith.forEach((member) => {
        if (balances[member]) {
          const splitAmount = expense.splitAmounts?.[member]
          if (splitAmount !== undefined) {
            balances[member].owes += splitAmount
          } else {
            // Calculate equal split for members without specified amount
            const specifiedTotal = Object.values(
              expense.splitAmounts || {}
            ).reduce((sum, amt) => sum + amt, 0)
            const remainingAmount = expense.amount - specifiedTotal
            const membersWithoutSpecifiedAmount = expense.splitWith.filter(
              (m) => !expense.splitAmounts?.[m]
            ).length

            if (membersWithoutSpecifiedAmount > 0) {
              balances[member].owes +=
                remainingAmount / membersWithoutSpecifiedAmount
            } else {
              balances[member].owes += expense.amount / expense.splitWith.length
            }
          }
        }
      })
    })

    const rows = members.map((member) => {
      const { paid, owes } = balances[member]
      const balance = paid - owes

      return [
        member,
        `¥${Math.round(paid)}`,
        `¥${Math.round(owes)}`,
        `${balance >= 0 ? '+' : ''}¥${Math.round(balance)}`,
      ]
    })

    return [...headers, ...rows]
  }

  // Main sync function
  const syncExpenses = async (
    expenses,
    members,
    tripName,
    paymentPlan,
    formatPayers,
    formatSplitWith
  ) => {
    try {
      isSyncing.value = true

      // Create spreadsheet if needed
      let spreadsheetId = currentSpreadsheetId.value
      if (!spreadsheetId) {
        const result = await createSpreadsheet(tripName)
        spreadsheetId = result.spreadsheetId
      }

      // Format data for all three sheets
      const expensesData = formatExpensesForSheet(
        expenses,
        formatPayers,
        formatSplitWith
      )
      const summaryData = formatSummaryForSheet(paymentPlan)
      const balanceData = formatBalanceForSheet(members, expenses)

      // Write to all sheets
      await writeToSheet(spreadsheetId, 'Expenses', expensesData)
      await writeToSheet(spreadsheetId, 'Summary', summaryData)
      await writeToSheet(spreadsheetId, 'Balance', balanceData)

      // Update last sync time
      const now = new Date().toISOString()
      lastSyncTime.value = now
      localStorage.setItem('google-sheets-last-sync', now)

      return {
        success: true,
        spreadsheetId,
        url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
      }
    } catch (error) {
      console.error('Sync error:', error)
      throw error
    } finally {
      isSyncing.value = false
    }
  }

  // Get spreadsheet URL
  const getSpreadsheetUrl = () => {
    if (!currentSpreadsheetId.value) return null
    return `https://docs.google.com/spreadsheets/d/${currentSpreadsheetId.value}`
  }

  // Set client ID
  const setClientId = (newClientId) => {
    clientId.value = newClientId
    localStorage.setItem('google-sheets-client-id', newClientId)
  }

  return {
    // State
    isAuthenticated,
    isSyncing,
    lastSyncTime,
    currentSpreadsheetId,
    clientId,

    // Methods
    authenticate,
    signOut,
    syncExpenses,
    createSpreadsheet,
    getSpreadsheetUrl,
    setClientId,
  }
}
