/**
 * Simple in-memory cache with TTL (Time To Live) support
 * Reduces redundant API calls and improves performance
 */

interface CacheItem<T> {
  data: T
  timestamp: number
  ttl: number
}

class DataCache {
  private cache = new Map<string, CacheItem<any>>()
  
  // Default TTL: 5 minutes for most data, 1 minute for real-time data
  private defaultTTL = 5 * 60 * 1000 // 5 minutes
  private realtimeTTL = 1 * 60 * 1000 // 1 minute

  set<T>(key: string, data: T, ttl?: number): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    }
    this.cache.set(key, item)
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key)
    
    if (!item) {
      return null
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data as T
  }

  has(key: string): boolean {
    const item = this.cache.get(key)
    
    if (!item) {
      return false
    }

    // Check if item has expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Clear expired items
  cleanup(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key)
      }
    }
  }

  // Get cache stats for debugging
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    }
  }

  // Specific cache methods for common data types
  setProfiles(profiles: any[], ttl?: number) {
    this.set('profiles', profiles, ttl || this.defaultTTL)
  }

  getProfiles() {
    return this.get<any[]>('profiles')
  }

  setDashboardStats(userId: string, stats: any, ttl?: number) {
    this.set(`dashboard-stats-${userId}`, stats, ttl || this.realtimeTTL)
  }

  getDashboardStats(userId: string) {
    return this.get<any>(`dashboard-stats-${userId}`)
  }

  setTasks(userId: string, tasks: any[], ttl?: number) {
    this.set(`tasks-${userId}`, tasks, ttl || this.realtimeTTL)
  }

  getTasks(userId: string) {
    return this.get<any[]>(`tasks-${userId}`)
  }

  setLeaveRequests(userId: string, leaves: any[], ttl?: number) {
    this.set(`leaves-${userId}`, leaves, ttl || this.realtimeTTL)
  }

  getLeaveRequests(userId: string) {
    return this.get<any[]>(`leaves-${userId}`)
  }

  // Invalidate related caches when data changes
  invalidateUserData(userId: string) {
    this.delete(`dashboard-stats-${userId}`)
    this.delete(`tasks-${userId}`)
    this.delete(`leaves-${userId}`)
  }

  invalidateGlobalData() {
    this.delete('profiles')
    // Clear all dashboard stats
    for (const key of this.cache.keys()) {
      if (key.startsWith('dashboard-stats-')) {
        this.delete(key)
      }
    }
  }
}

// Export singleton instance
export const dataCache = new DataCache()

// Auto cleanup every 10 minutes
setInterval(() => {
  dataCache.cleanup()
}, 10 * 60 * 1000)