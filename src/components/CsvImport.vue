<!-- CSV Import Component -->
<template>
  <div class="csv-import">
    <div class="mb-3">
      <label for="csvFile" class="form-label">Import Expenses from CSV</label>
      <input
        type="file"
        class="form-control"
        id="csvFile"
        accept=".csv"
        @change="handleFileUpload"
      >
    </div>
    <div class="mb-3">
      <button class="btn btn-secondary" @click="downloadTemplate">
        Download Template
      </button>
    </div>
    <div v-if="error" class="alert alert-danger">
      {{ error }}
    </div>
    <div v-if="preview.length" class="preview-section">
      <h4>Preview</h4>
      <div class="table-responsive">
        <table class="table table-sm">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Paid By</th>
              <th>Split With</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in preview" :key="index">
              <td>{{ row.date }}</td>
              <td>{{ row.description }}</td>
              <td>{{ row.amount }}</td>
              <td>{{ row.paidBy }}</td>
              <td>{{ row.splitWith.join(', ') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="d-flex justify-content-end gap-2">
        <button class="btn btn-secondary" @click="preview = []">
          Cancel
        </button>
        <button class="btn btn-primary" @click="confirmImport">
          Import {{ preview.length }} Expenses
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref } from 'vue';
import Papa from 'papaparse';

export default {
  name: 'CsvImport',
  props: {
    members: {
      type: Array,
      required: true
    }
  },
  emits: ['import-expenses'],
  setup(props, { emit }) {
    const preview = ref([]);
    const error = ref('');

    const validateRow = (row, lineNumber) => {
      const errors = [];

      // Check required fields
      if (!row.date) errors.push('Date is required');
      if (!row.description) errors.push('Description is required');
      if (!row.amount) errors.push('Amount is required');
      if (!row.paidBy) errors.push('Paid By is required');
      if (!row.splitWith) errors.push('Split With is required');

      // Validate date format (YYYY-MM-DD)
      if (row.date && !/^\d{4}-\d{2}-\d{2}$/.test(row.date)) {
        errors.push('Date must be in YYYY-MM-DD format');
      }

      // Validate amount is a number
      if (row.amount && isNaN(parseFloat(row.amount))) {
        errors.push('Amount must be a number');
      }

      // Validate paidBy is a member
      if (row.paidBy && !props.members.includes(row.paidBy)) {
        errors.push(`Paid By member "${row.paidBy}" not found in group`);
      }

      // Validate splitWith members exist
      const splitWith = row.splitWith.split(',').map(m => m.trim());
      splitWith.forEach(member => {
        if (!props.members.includes(member)) {
          errors.push(`Split With member "${member}" not found in group`);
        }
      });

      if (errors.length) {
        throw new Error(`Line ${lineNumber}: ${errors.join(', ')}`);
      }

      return {
        ...row,
        amount: parseFloat(row.amount),
        splitWith
      };
    };

    const handleFileUpload = (event) => {
      const file = event.target.files[0];
      if (!file) return;

      error.value = '';
      preview.value = [];

      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const validRows = results.data.map((row, index) =>
              validateRow(row, index + 2) // +2 because of header row and 0-based index
            );
            preview.value = validRows;
          } catch (err) {
            error.value = err.message;
          }
        },
        error: (err) => {
          error.value = `Error parsing CSV: ${err.message}`;
        }
      });
    };

    const confirmImport = () => {
      emit('import-expenses', preview.value);
      preview.value = [];
    };

    const downloadTemplate = () => {
      const template = [
        ['date', 'description', 'amount', 'paidBy', 'splitWith'],
        ['2024-01-17', 'Dinner', '100', 'John', 'John,Mary,Bob'],
        ['2024-01-18', 'Taxi', '50', 'Mary', 'Mary,Bob']
      ];

      const csv = Papa.unparse(template);
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'expense-template.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    };

    return {
      preview,
      error,
      handleFileUpload,
      confirmImport,
      downloadTemplate
    };
  }
};
</script>

<style scoped>
.csv-import {
  margin: 1rem 0;
  padding: 1rem;
  border: 1px solid #dee2e6;
  border-radius: 0.25rem;
}

.preview-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #dee2e6;
}
</style>