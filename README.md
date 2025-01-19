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
- 📊 CSV import for bulk expenses

## 📖 Example Usage

### Basic Example

Let's say you're on a trip with friends: Alice, Bob, and Charlie.

1. Create a new trip:
   - Name: "Weekend Trip"
   - Add members: Alice, Bob, Charlie

2. Add expenses:
   ```
   Expense 1:
   - Description: Dinner
   - Amount: $100
   - Paid by: Alice
   - Split with: Everyone equally
   Result: Each person owes Alice $33.33

   Expense 2:
   - Description: Taxi
   - Amount: $60
   - Paid by: Bob
   - Split with: Bob and Charlie only
   Result: Charlie owes Bob $30

   Expense 3:
   - Description: Museum
   - Amount: $45
   - Paid by: Charlie
   - Split with: Everyone equally
   Result: Alice and Bob each owe Charlie $15
   ```

3. Final Settlement:
   ```
   Alice paid: $100
   Alice should pay: $48.33 ($33.33 for dinner + $15 for museum)
   Alice's balance: +$51.67 (should receive)

   Bob paid: $60
   Bob should pay: $48.33 ($33.33 for dinner + $15 for museum)
   Bob's balance: +$11.67 (should receive)

   Charlie paid: $45
   Charlie should pay: $63.33 ($33.33 for dinner + $30 for taxi)
   Charlie's balance: -$18.33 (should pay)
   ```

### Bulk Import Example

You can import multiple expenses at once using CSV. Here's an example CSV file:

```csv
date,description,amount,paidBy,splitWith
2024-01-17,Dinner,100,Alice,"Alice,Bob,Charlie"
2024-01-17,Taxi,60,Bob,"Bob,Charlie"
2024-01-18,Museum,45,Charlie,"Alice,Bob,Charlie"
```

To use bulk import:
1. Click "Download Template" to get the CSV format
2. Fill in your expenses following the template
3. Upload the file using the import button
4. Review the preview
5. Click "Import" to add all expenses at once

### Advanced Features

1. Custom Split:
   - Split expenses unequally
   - Multiple people can pay for one expense
   - Specify exact amounts for each person

2. Trip Management:
   - Create multiple trips
   - Export/Import trip data
   - Share trips via URL

3. View Options:
   - List view of all expenses
   - Cross-table format showing who paid what
   - Summary of balances
   - Detailed payment instructions

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