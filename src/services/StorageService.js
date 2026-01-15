/**
 * StorageService - Abstract storage operations
 * Dependency Inversion: Components depend on this interface, not localStorage directly
 * Open/Closed: Easy to swap storage implementation (localStorage, IndexedDB, API, etc.)
 */

export class StorageService {
  constructor(storage = localStorage) {
    this.storage = storage
  }

  /**
   * Get all trips
   * @returns {Array} List of trip objects
   */
  getTrips() {
    try {
      const data = this.storage.getItem('trips')
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Error loading trips:', error)
      return []
    }
  }

  /**
   * Save trips
   * @param {Array} trips - List of trips to save
   * @returns {boolean} Success status
   */
  saveTrips(trips) {
    try {
      this.storage.setItem('trips', JSON.stringify(trips))
      return true
    } catch (error) {
      console.error('Error saving trips:', error)
      return false
    }
  }

  /**
   * Get specific trip by ID
   * @param {string} tripId - Trip ID
   * @returns {Object|null} Trip object or null
   */
  getTrip(tripId) {
    const trips = this.getTrips()
    return trips.find((t) => t.id === tripId) || null
  }

  /**
   * Save or update a trip
   * @param {Object} trip - Trip object to save
   * @returns {boolean} Success status
   */
  saveTrip(trip) {
    const trips = this.getTrips()
    const existingIndex = trips.findIndex((t) => t.id === trip.id)

    if (existingIndex >= 0) {
      trips[existingIndex] = trip
    } else {
      trips.push(trip)
    }

    return this.saveTrips(trips)
  }

  /**
   * Delete a trip
   * @param {string} tripId - Trip ID to delete
   * @returns {boolean} Success status
   */
  deleteTrip(tripId) {
    const trips = this.getTrips()
    const filteredTrips = trips.filter((t) => t.id !== tripId)
    return this.saveTrips(filteredTrips)
  }

  /**
   * Export all data
   * @returns {Object} All data as object
   */
  exportData() {
    return {
      tripList: this.getTrips(),
    }
  }

  /**
   * Import data
   * @param {Object} data - Data to import
   * @returns {boolean} Success status
   */
  importData(data) {
    if (data.tripList && Array.isArray(data.tripList)) {
      return this.saveTrips(data.tripList)
    }
    return false
  }

  /**
   * Clear all data
   * @returns {boolean} Success status
   */
  clearAll() {
    try {
      this.storage.removeItem('trips')
      return true
    } catch (error) {
      console.error('Error clearing data:', error)
      return false
    }
  }
}

// Export singleton instance
export const storageService = new StorageService()
