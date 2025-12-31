# Google Sheets Integration Design

## Overview
Add Google Sheets API integration to sync expense data directly to user's Google Spreadsheet, working entirely client-side (no server required) for GitHub Pages deployment.

## Architecture

### Authentication Flow (OAuth 2.0 - Client-side)
```
┌─────────────────┐
│   User clicks   │
│ "Connect to     │
│ Google Sheets"  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Google OAuth 2.0 (Implicit Flow)    │
│ - Client ID (registered in Console) │
│ - Redirect to GitHub Pages URL      │
│ - Scopes: spreadsheets              │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Store access token in localStorage  │
│ - Key: 'google-sheets-token'        │
│ - Expiry: ~1 hour                   │
│ - Auto-refresh when expired         │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│ Ready to sync with Google Sheets    │
└─────────────────────────────────────┘
```

### Required Scopes
- `https://www.googleapis.com/auth/spreadsheets` - Read/write spreadsheet data

### Google Cloud Console Setup (User must do)
1. Create project at console.cloud.google.com
2. Enable Google Sheets API
3. Create OAuth 2.0 Client ID (Web application)
4. Add authorized redirect URI: `https://eric4545.github.io/expense-tracker/`
5. Copy Client ID to app settings

## Data Sync Strategy

### 1. Spreadsheet Structure
Each trip creates a new spreadsheet with multiple sheets:

**Sheet 1: "Expenses" (Main Data)**
```
| Date       | Description | Total Amount | Paid By (amounts)           | Split With (amounts)                    |
|------------|-------------|--------------|-----------------------------|-----------------------------------------|
| 2024-01-15 | Dinner      | 150          | Alice (¥90), Bob (¥60)      | Alice (¥50), Bob (¥50), Charlie (¥50)   |
| 2024-01-16 | Taxi        | 30           | Charlie (¥30)               | Alice (¥10), Bob (¥10), Charlie (¥10)   |
```

**Sheet 2: "Summary" (Who Owes Whom)**
```
| From    | To      | Amount |
|---------|---------|--------|
| Bob     | Alice   | ¥40    |
| Charlie | Alice   | ¥50    |
```

**Sheet 3: "Balance" (Per-person Totals)**
```
| Member  | Paid   | Owes   | Balance |
|---------|--------|--------|---------|
| Alice   | ¥90    | ¥50    | +¥40    |
| Bob     | ¥60    | ¥50    | +¥10    |
| Charlie | ¥30    | ¥10    | -¥20    |
```

### 2. Sync Modes

#### **Manual Sync**
- "Sync to Google Sheets" button
- User confirms action
- Full sync of all expenses

#### **Auto Sync** (Future enhancement)
- Toggle in settings
- Sync on every add/edit/delete
- Debounced (wait 2 seconds after last change)
- Queue changes when offline

### 3. Offline Support
```javascript
{
  pendingChanges: [
    { action: 'add', expense: {...}, timestamp: 1234567890 },
    { action: 'update', expense: {...}, timestamp: 1234567891 },
    { action: 'delete', expenseId: 'abc123', timestamp: 1234567892 }
  ]
}
```
- Store in localStorage: `google-sheets-pending-sync`
- Process queue when back online
- Show badge count of pending changes

## Implementation Plan

### Phase 1: Core Google Sheets Integration

#### 1.1 Create Google Sheets Composable
**File:** `src/composables/useGoogleSheets.js`

```javascript
import { ref } from 'vue'

export function useGoogleSheets() {
  const isAuthenticated = ref(false)
  const isSyncing = ref(false)
  const lastSyncTime = ref(null)
  const currentSpreadsheetId = ref(null)

  // OAuth 2.0 Authentication
  const authenticate = async () => {
    // Use Google Identity Services
    // https://developers.google.com/identity/gsi/web/guides/overview
  }

  const signOut = () => {
    // Clear tokens
    localStorage.removeItem('google-sheets-token')
    localStorage.removeItem('google-sheets-spreadsheet-id')
    isAuthenticated.value = false
  }

  // Create new spreadsheet for trip
  const createSpreadsheet = async (tripName) => {
    // POST https://sheets.googleapis.com/v4/spreadsheets
  }

  // Sync all expenses to sheet
  const syncExpenses = async (expenses, members, tripName) => {
    // 1. Get or create spreadsheet
    // 2. Clear existing data
    // 3. Write "Expenses" sheet
    // 4. Calculate and write "Summary" sheet
    // 5. Calculate and write "Balance" sheet
  }

  // Write to specific sheet
  const writeToSheet = async (spreadsheetId, sheetName, data) => {
    // PUT https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values/{range}
  }

  return {
    isAuthenticated,
    isSyncing,
    lastSyncTime,
    currentSpreadsheetId,
    authenticate,
    signOut,
    createSpreadsheet,
    syncExpenses,
  }
}
```

#### 1.2 Update ExpenseTracker.vue

Add Google Sheets UI:
```vue
<template>
  <!-- In the export/import section -->
  <div class="mb-4">
    <button @click="connectGoogleSheets" class="btn btn-success me-2">
      <i class="bi bi-google"></i> Connect Google Sheets
    </button>
    <button v-if="isGoogleSheetsConnected"
            @click="syncToGoogleSheets"
            class="btn btn-primary me-2"
            :disabled="isSyncing">
      <span v-if="isSyncing">
        <span class="spinner-border spinner-border-sm me-1"></span>
        Syncing...
      </span>
      <span v-else>
        <i class="bi bi-cloud-upload"></i> Sync to Google Sheets
      </span>
    </button>
    <button v-if="isGoogleSheetsConnected"
            @click="openSpreadsheet"
            class="btn btn-outline-primary me-2">
      <i class="bi bi-box-arrow-up-right"></i> Open Spreadsheet
    </button>
    <button v-if="isGoogleSheetsConnected"
            @click="disconnectGoogleSheets"
            class="btn btn-outline-danger">
      <i class="bi bi-x-circle"></i> Disconnect
    </button>
  </div>

  <!-- Last sync info -->
  <div v-if="lastSyncTime" class="text-muted small mb-2">
    Last synced: {{ formatLastSyncTime(lastSyncTime) }}
  </div>
</template>

<script>
import { useGoogleSheets } from '@/composables/useGoogleSheets'

export default {
  setup() {
    const {
      isAuthenticated,
      isSyncing,
      lastSyncTime,
      authenticate,
      syncExpenses,
      signOut,
    } = useGoogleSheets()

    return {
      isGoogleSheetsConnected: isAuthenticated,
      isSyncing,
      lastSyncTime,
      connectGoogleSheets: authenticate,
      disconnectGoogleSheets: signOut,
    }
  },

  methods: {
    async syncToGoogleSheets() {
      try {
        await this.syncExpenses(this.expenses, this.members, this.tripName)
        alert('Successfully synced to Google Sheets!')
      } catch (error) {
        console.error('Sync failed:', error)
        alert('Failed to sync to Google Sheets. Please try again.')
      }
    },

    openSpreadsheet() {
      const spreadsheetId = this.currentSpreadsheetId
      window.open(`https://docs.google.com/spreadsheets/d/${spreadsheetId}`, '_blank')
    },
  }
}
</script>
```

### Phase 2: Google API Integration

#### 2.1 Load Google Identity Services

Update `index.html`:
```html
<head>
  <!-- Existing head content -->
  <script src="https://accounts.google.com/gsi/client" async defer></script>
</head>
```

#### 2.2 Environment Configuration

**File:** `.env` (NOT committed)
```
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

**File:** `.env.example` (committed)
```
# Google OAuth 2.0 Client ID
# Get from: https://console.cloud.google.com/apis/credentials
VITE_GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

Access in code:
```javascript
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
```

### Phase 3: Data Transformation

#### 3.1 Format Data for Sheets

```javascript
// Transform expenses to sheet rows
function formatExpensesForSheet(expenses) {
  const headers = [
    ['Date', 'Description', 'Total Amount', 'Paid By (amounts)', 'Split With (amounts)']
  ]

  const rows = expenses.map(expense => [
    expense.date || '',
    expense.description,
    expense.amount,
    formatPayers(expense),
    formatSplitWith(expense),
  ])

  return [...headers, ...rows]
}

// Calculate payment plan for Summary sheet
function formatSummaryForSheet(paymentPlan) {
  const headers = [['From', 'To', 'Amount']]

  const rows = paymentPlan.map(payment => [
    payment.from,
    payment.to,
    `¥${Math.round(payment.amount)}`,
  ])

  return [...headers, ...rows]
}

// Calculate balances for Balance sheet
function formatBalanceForSheet(members, expenses) {
  const headers = [['Member', 'Paid', 'Owes', 'Balance']]

  const rows = members.map(member => {
    const totalPaid = calculateTotalPaid(member, expenses)
    const totalOwed = calculateTotalOwed(member, expenses)
    const balance = totalPaid - totalOwed

    return [
      member,
      `¥${Math.round(totalPaid)}`,
      `¥${Math.round(totalOwed)}`,
      `${balance >= 0 ? '+' : ''}¥${Math.round(balance)}`,
    ]
  })

  return [...headers, ...rows]
}
```

## Security Considerations

1. **Token Storage**
   - Store access token in localStorage (acceptable for GitHub Pages)
   - Never commit Client ID to git (use .env)
   - Token expires after ~1 hour (auto-refresh)

2. **Permissions**
   - Only request `spreadsheets` scope (minimal permissions)
   - User explicitly grants permission via Google OAuth

3. **Data Privacy**
   - Data goes directly from browser to Google Sheets
   - No intermediate server
   - User owns their spreadsheet

## Error Handling

```javascript
try {
  await syncToGoogleSheets()
} catch (error) {
  if (error.status === 401) {
    // Token expired, re-authenticate
    await authenticate()
    await syncToGoogleSheets()
  } else if (error.status === 403) {
    // Permission denied
    alert('Permission denied. Please reconnect to Google Sheets.')
  } else if (error.status === 404) {
    // Spreadsheet not found, create new
    await createSpreadsheet()
    await syncToGoogleSheets()
  } else {
    // Generic error
    console.error('Sync error:', error)
    alert('Failed to sync. Please try again.')
  }
}
```

## Testing Strategy

### Unit Tests
- Test data transformation functions
- Test error handling
- Mock Google API responses

### Integration Tests
- Test OAuth flow (with mock)
- Test sync with sample data
- Test offline queue

### Manual Testing
1. Connect to Google account
2. Sync expenses
3. Verify data in Google Sheets
4. Test offline behavior
5. Test token expiry

## Future Enhancements

1. **Two-way Sync**
   - Import expenses from Google Sheets
   - Detect conflicts and merge

2. **Real-time Collaboration**
   - Multiple users editing same trip
   - WebSocket or polling for changes

3. **Advanced Features**
   - Charts and graphs in Google Sheets
   - Conditional formatting (highlight who owes most)
   - Email notifications on sync

4. **Alternative Storage**
   - Google Drive API for JSON backup
   - Sheets as primary data store (no localStorage)

## Dependencies

No new npm dependencies required! Using:
- Google Identity Services (CDN)
- Google Sheets API v4 (REST API via fetch)
- Existing Vue 3 reactivity system

## Timeline Estimate

- **Phase 1**: Core Integration (3-4 hours)
- **Phase 2**: Google API Setup (1-2 hours)
- **Phase 3**: Data Transformation (2-3 hours)
- **Testing & Polish**: (2-3 hours)

**Total**: ~8-12 hours of development

## Documentation for Users

Add to README.md:

### Setting up Google Sheets Integration

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google Sheets API
4. Create OAuth 2.0 Client ID (Web application)
5. Add authorized redirect URI: `https://eric4545.github.io/expense-tracker/`
6. Copy Client ID
7. In app, click "Connect Google Sheets" and paste Client ID when prompted
8. Grant permissions
9. Click "Sync to Google Sheets" to export your expenses!

---

## Next Steps

1. ✅ Design completed
2. ⏳ Implement useGoogleSheets composable
3. ⏳ Add UI buttons and state management
4. ⏳ Test with real Google account
5. ⏳ Update documentation
