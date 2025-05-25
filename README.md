# Expense Tracker

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
- 📊 CSV import and export for bulk expenses
- 🌙 Dark mode support with system preference detection

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

- Node.js 20.x or higher
- npm 10.x or higher

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run coverage` - Run tests with coverage report

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