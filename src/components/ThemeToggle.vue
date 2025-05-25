<template>
  <div class="theme-toggle">
    <button
      @click="toggleTheme"
      class="btn btn-outline-secondary btn-sm"
      :title="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
    >
      <i :class="isDark ? 'bi bi-sun-fill' : 'bi bi-moon-fill'"></i>
      {{ isDark ? 'Light' : 'Dark' }}
    </button>
  </div>
</template>

<script>
export default {
  name: 'ThemeToggle',
  data() {
    return {
      isDark: false
    }
  },
  methods: {
    toggleTheme() {
      this.isDark = !this.isDark;
      this.applyTheme();
      this.saveTheme();
    },

    applyTheme() {
      if (this.isDark) {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.body.classList.add('dark-theme');
      } else {
        document.documentElement.setAttribute('data-theme', 'light');
        document.body.classList.remove('dark-theme');
      }
    },

    saveTheme() {
      localStorage.setItem('expense-tracker-theme', this.isDark ? 'dark' : 'light');
    },

    loadTheme() {
      const savedTheme = localStorage.getItem('expense-tracker-theme');
      if (savedTheme) {
        this.isDark = savedTheme === 'dark';
      } else {
        // Check user's system preference
        this.isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }
      this.applyTheme();
    }
  },

  mounted() {
    this.loadTheme();

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('expense-tracker-theme')) {
        this.isDark = e.matches;
        this.applyTheme();
      }
    });
  }
}
</script>

<style scoped>
.theme-toggle {
  display: inline-block;
}

.btn i {
  margin-right: 0.25rem;
}
</style>