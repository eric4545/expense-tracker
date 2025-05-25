import { createRouter, createWebHistory } from 'vue-router'
import ExpenseTracker from '../components/ExpenseTracker.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: ExpenseTracker
  },
  {
    path: '/trip/:tripId',
    name: 'Trip',
    component: ExpenseTracker,
    props: route => ({ routeTripId: route.params.tripId })
  },
  {
    path: '/expense/:expenseId',
    name: 'Expense',
    component: ExpenseTracker,
    props: route => ({ routeExpenseId: route.params.expenseId })
  },
  {
    // Catch all route - redirect to home
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory('/expense-tracker/'),
  routes
})

export default router