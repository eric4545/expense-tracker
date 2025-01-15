# Expense Tracker

A simple expense tracking application built with Vue.js that helps groups track and split expenses.

> This project was created using Cursor's Agent Mode powered by Claude-3.5-sonnet.

## Features

- Create and manage multiple trips
- Add and edit expenses with dates
- Split expenses between group members
- Calculate who owes whom
- Export and import trip data
- Local storage for persistence

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Deployment to GitHub Pages

1. Update `vite.config.js` with your repository name:
```js
base: '/your-repo-name/'
```

2. Build the project:
```bash
npm run build
```

3. Deploy to GitHub Pages:
   - Push the `dist` folder to a new branch called `gh-pages`
   - Or use GitHub Actions for automatic deployment (workflow provided below)

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install Dependencies
        run: npm install

      - name: Build
        run: npm run build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

## Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run coverage
```

## Project Structure

```
expense-tracker/
├── src/
│   ├── components/
│   │   └── ExpenseTracker.vue
│   └── main.js
├── tests/
│   └── ExpenseTracker.test.js
├── public/
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## Test Cases

The application includes tests for:

1. Trip Management
   - Creating new trips
   - Loading existing trips

2. Expense Calculations
   - Total paid calculations
   - Should pay calculations
   - Balance calculations

3. Member Management
   - Adding new members
   - Preventing duplicate members

4. Expense Management
   - Adding new expenses
   - Input validation

## Local Storage

The application uses localStorage to persist:
- Trip information
- Member lists
- Expense records

Data can be exported and imported as JSON files.

## Import/Export Data Format

The application supports two formats for importing data:

1. Single Trip Format:
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

2. Multiple Trips Format:
```json
{
  "tripList": [
    {
      "id": "trip-id",
      "name": "Trip Name",
      "description": "Trip Description",
      "members": ["Member1", "Member2"],
      "expenses": [...],
      "createdAt": 1703376000000
    }
  ]
}
```

## Credits

This project was created using:
- [Cursor](https://cursor.sh/) - AI-powered code editor
- Claude-3.5-sonnet - AI model by Anthropic
- Vue.js 3 - Frontend framework
- Vite - Build tool
- Bootstrap 5 - UI framework