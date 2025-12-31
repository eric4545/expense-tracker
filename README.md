# Expense Tracker

[![CI/CD](https://github.com/eric4545/expense-tracker/actions/workflows/deploy.yml/badge.svg)](https://github.com/eric4545/expense-tracker/actions/workflows/deploy.yml)

A simple and intuitive expense tracking application built with Vue.js that helps groups track and split expenses. Perfect for trips, shared housing, or any situation where expenses need to be split between multiple people.

## 🌟 Features

- 📝 Create and manage multiple trips or expense groups
- 💰 Add and edit expenses with dates and descriptions
- 👥 Split expenses between group members
- 🧮 Automatically calculate who owes whom
- 💾 Export and import trip data
- 🔄 Local storage for data persistence
- 📱 Responsive design for mobile and desktop
- 🌐 Works offline (PWA support)
- 📊 CSV import and export for bulk expenses with complete amount details
- 🌙 Dark mode support with system preference detection
- 📈 Google Sheets integration for live sync and collaboration

## 🚀 Quick Start

1. Clone the repository:
```bash
git clone https://github.com/eric4545/expense-tracker.git
cd expense-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

4. Build for production:
```bash
npm run build
```

## 🔧 Development

### Prerequisites

- Node.js 20.x LTS
- npm 10.x or higher

### Continuous Integration

This project uses GitHub Actions for CI/CD with the following checks:

- **Tests**: Comprehensive test suite with Vitest
- **Security**: npm audit for vulnerabilities
- **Linting & Formatting**: Biome for fast code quality checks
- **Build**: Verifies production build works
- **Deploy**: Automatic deployment to GitHub Pages on main branch

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run coverage` - Run tests with coverage report
- `npm run lint` - Run Biome linter
- `npm run lint:fix` - Run Biome linter and fix issues
- `npm run format` - Format code with Biome
- `npm run format:check` - Check code formatting
- `npm run check` - Run both linting and formatting checks
- `npm run check:fix` - Run and fix both linting and formatting

## 📱 Usage

1. Create a new trip/group
2. Add members to the group
3. Start adding expenses:
   - Enter amount
   - Select who paid
   - Choose who to split with
   - Add description and date
4. View the settlement summary to see who owes whom

## 💾 Data Storage

The application uses localStorage to persist data locally. You can:
- Export data as JSON for backup
- Import previous trips
- Share trip data with other users
- Access and use the app offline (PWA)

### Offline Support

This app is a Progressive Web App (PWA) that works offline:
- Install it on your device from the browser
- Access all features without an internet connection
- Data syncs automatically when back online
- Automatic updates when new versions are available

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style

- Follow Vue.js style guide
- Use ESLint for code linting
- Write tests for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Vue.js](https://vuejs.org/)
- Powered by [Vite](https://vitejs.dev/)
- Styled with [Bootstrap](https://getbootstrap.com/)

## 📊 Project Structure

```
expense-tracker/
├── src/              # Source files
│   ├── components/   # Vue components
│   └── main.js       # Entry point
├── tests/            # Test files
├── public/           # Static assets
└── dist/            # Built files
```

## 🔍 Data Format

For importing/exporting trip data, use this JSON format:

```json
{
  "tripName": "Trip Name",
  "members": ["Member1", "Member2"],
  "expenses": [
    {
      "description": "Expense Description",
      "amount": 1000,
      "paidBy": "Member1",
      "splitWith": ["Member1", "Member2"],
      "date": "2024-12-21"
    }
  ]
}
```

## 📫 Support

If you have any questions or run into issues, please:
1. Check existing GitHub Issues
2. Open a new issue if needed

## 📖 Example Usage

### CSV Features

The app supports both importing and exporting CSV files:

1. CSV Export:
   - Click the "Export to CSV" button
   - Generates a CSV file with all expenses
   - The exported file is named based on the trip name
   - Format includes: Date, Description, Amount, Paid By, Split With, Notes

2. CSV Import:
   - Click "Download Template" in the CSV Import section
   - Fill in your expenses following the template
   - Upload the file using the import button
   - Review the preview
   - Click "Import" to add all expenses at once

3. CSV Format:
   ```csv
   Date,Description,Amount,Paid By,Split With,Notes
   2024-01-17,Dinner,100,Alice,"Alice,Bob,Charlie",
   2024-01-18,Taxi,60,Bob,"Bob,Charlie",
   ```

### Dark Mode

The app includes a built-in dark mode toggle:

1. **Manual Toggle**: Click the sun/moon icon in the top-right corner to switch between light and dark themes
2. **System Preference**: The app automatically detects your system's color scheme preference
3. **Persistent**: Your theme choice is saved and remembered for future visits
4. **Responsive**: The theme affects all UI elements including forms, tables, and buttons

Features:
- Smooth transitions between themes
- High contrast for better accessibility
- Consistent styling across all components
- Respects system dark mode preference by default

### Google Sheets Integration

Sync your expenses directly to Google Sheets for easy sharing and collaboration:

#### Setup Instructions

1. **Get Google OAuth Client ID**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project or select an existing one
   - Enable the **Google Sheets API**
   - Navigate to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
   - Choose **Web application** as the application type
   - Add authorized redirect URI: `https://eric4545.github.io/expense-tracker/`
   - Copy the Client ID

2. **Connect to Google Sheets**:
   - Click the **"Connect Google Sheets"** button in the app
   - Paste your Client ID when prompted (you only need to do this once)
   - Grant permissions to access Google Sheets
   - You're connected!

3. **Sync Your Expenses**:
   - Click **"Sync to Google Sheets"** to create/update your spreadsheet
   - The app creates three sheets:
     - **Expenses**: Complete expense details with per-person amounts
     - **Summary**: Payment plan showing who owes whom
     - **Balance**: Per-person totals and balances
   - Click **"Open Spreadsheet"** to view in Google Sheets

#### Features

- **Client-side only**: No server required, works with GitHub Pages
- **Secure**: OAuth 2.0 authentication, your data stays private
- **Complete data**: Exports all expense details including individual amounts
- **Live sync**: Update your spreadsheet anytime with one click
- **Persistent**: Connection and spreadsheet ID saved for convenience
- **Smart formatting**: Uses the same format as CSV export for consistency

#### CSV Export Format

The improved CSV export now includes complete expense data:

```csv
Date,Description,Total Amount,Paid By (with amounts),Split With (with amounts)
2024-01-15,Dinner,150,"Alice (¥90), Bob (¥60)","Alice (¥50), Bob (¥50), Charlie (¥50)"
2024-01-16,Taxi,30,"Charlie (¥30)","Alice (¥10), Bob (¥10), Charlie (¥10)"
```

This format preserves all payment and split information, making it perfect for importing into spreadsheets or other financial tools.