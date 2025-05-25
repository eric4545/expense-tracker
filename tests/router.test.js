import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it } from 'vitest'
import { createRouter, createWebHistory } from 'vue-router'
import App from '../src/App.vue'
import router from '../src/router'

describe('Router', () => {
  beforeEach(() => {
    router.push('/')
  })

  it('should navigate to home page', async () => {
    await router.push('/')
    expect(router.currentRoute.value.path).toBe('/')
    expect(router.currentRoute.value.name).toBe('Home')
  })

  it('should navigate to trip page with tripId', async () => {
    const tripId = 'test-trip-123'
    await router.push(`/trip/${tripId}`)

    expect(router.currentRoute.value.path).toBe(`/trip/${tripId}`)
    expect(router.currentRoute.value.name).toBe('Trip')
    expect(router.currentRoute.value.params.tripId).toBe(tripId)
  })

  it('should navigate to expense page with expenseId', async () => {
    const expenseId = 'test-expense-456'
    await router.push(`/expense/${expenseId}`)

    expect(router.currentRoute.value.path).toBe(`/expense/${expenseId}`)
    expect(router.currentRoute.value.name).toBe('Expense')
    expect(router.currentRoute.value.params.expenseId).toBe(expenseId)
  })

  it('should redirect unknown routes to home', async () => {
    await router.push('/unknown-route')
    expect(router.currentRoute.value.path).toBe('/')
  })

  it('should have correct base URL for GitHub Pages', () => {
    expect(router.options.history.base).toContain('/expense-tracker')
  })

  it('should pass route params as props', async () => {
    const tripId = 'test-trip-789'
    await router.push(`/trip/${tripId}`)

    const route = router.currentRoute.value
    const tripRoute = router.options.routes.find((r) => r.name === 'Trip')
    const props = tripRoute.props(route)

    expect(props.routeTripId).toBe(tripId)
  })
})
