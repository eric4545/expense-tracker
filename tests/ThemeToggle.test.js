import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ThemeToggle from '../src/components/ThemeToggle.vue'

describe('ThemeToggle', () => {
  let wrapper

  beforeEach(() => {
    // Reset localStorage mock
    localStorage.clear()
    localStorage.getItem.mockClear()
    localStorage.setItem.mockClear()

    // Reset document mock
    document.documentElement.getAttribute = vi.fn()
    document.documentElement.setAttribute = vi.fn()
    document.body.classList.add = vi.fn()
    document.body.classList.remove = vi.fn()

    wrapper = mount(ThemeToggle)
  })

  it('should render toggle button', () => {
    expect(wrapper.find('button').exists()).toBe(true)
    expect(wrapper.find('i').exists()).toBe(true)
  })

  it('should initialize with light theme by default', () => {
    expect(wrapper.vm.isDark).toBe(false)
    expect(wrapper.find('button').text()).toContain('Dark')
    expect(wrapper.find('i').classes()).toContain('bi-moon-fill')
  })

  it('should toggle theme on button click', async () => {
    await wrapper.find('button').trigger('click')

    expect(wrapper.vm.isDark).toBe(true)
    expect(wrapper.find('button').text()).toContain('Light')
    expect(wrapper.find('i').classes()).toContain('bi-sun-fill')
  })

  it('should apply dark theme to document', () => {
    wrapper.vm.isDark = true
    wrapper.vm.applyTheme()

    expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'dark')
    expect(document.body.classList.add).toHaveBeenCalledWith('dark-theme')
  })

  it('should apply light theme to document', () => {
    wrapper.vm.isDark = false
    wrapper.vm.applyTheme()

    expect(document.documentElement.setAttribute).toHaveBeenCalledWith('data-theme', 'light')
    expect(document.body.classList.remove).toHaveBeenCalledWith('dark-theme')
  })

  it('should save theme preference to localStorage', () => {
    wrapper.vm.isDark = true
    wrapper.vm.saveTheme()

    expect(localStorage.setItem).toHaveBeenCalledWith('expense-tracker-theme', 'dark')

    wrapper.vm.isDark = false
    wrapper.vm.saveTheme()

    expect(localStorage.setItem).toHaveBeenCalledWith('expense-tracker-theme', 'light')
  })

  it('should load saved theme from localStorage', () => {
    localStorage.getItem.mockReturnValue('dark')

    wrapper.vm.loadTheme()

    expect(wrapper.vm.isDark).toBe(true)
    expect(localStorage.getItem).toHaveBeenCalledWith('expense-tracker-theme')
  })

  it('should use system preference when no saved theme', () => {
    localStorage.getItem.mockReturnValue(null)

    // Mock matchMedia to return dark preference
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: true
    }))

    wrapper.vm.loadTheme()

    expect(wrapper.vm.isDark).toBe(true)
  })

  it('should have correct button titles', () => {
    wrapper.vm.isDark = false
    wrapper.vm.$forceUpdate()
    expect(wrapper.find('button').attributes('title')).toBe('Switch to Dark Mode')

    wrapper.vm.isDark = true
    wrapper.vm.$forceUpdate()
    expect(wrapper.find('button').attributes('title')).toBe('Switch to Light Mode')
  })
})