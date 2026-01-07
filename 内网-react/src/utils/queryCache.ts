/**
 * Hybrid Cache System for Firebase queries
 * - Memory cache for fast access
 * - IndexedDB for persistence across page reloads
 * Reduces redundant Firestore reads and improves performance
 */

import { indexedDBCache } from './indexedDBCache';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxEntries?: number;
  persist?: boolean; // Whether to persist to IndexedDB
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const DEFAULT_MAX_ENTRIES = 100;

type CacheCategory = 'appointments' | 'patients' | 'dentalCharts' | 'general';

class QueryCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private maxEntries: number;
  private category: CacheCategory;
  private persistEnabled: boolean;
  private initialized: boolean = false;

  constructor(
    maxEntries = DEFAULT_MAX_ENTRIES,
    category: CacheCategory = 'general',
    persistEnabled = true
  ) {
    this.maxEntries = maxEntries;
    this.category = category;
    this.persistEnabled = persistEnabled;

    // Initialize IndexedDB and warm cache from persistent storage
    if (persistEnabled) {
      this.warmFromIndexedDB();
    }
  }

  /**
   * Warm memory cache from IndexedDB on startup
   */
  private async warmFromIndexedDB(): Promise<void> {
    if (this.initialized) return;

    try {
      const entries = await indexedDBCache.getAllInCategory<unknown>(this.category);

      entries.forEach((entry) => {
        // Only add to memory if not expired and under limit
        if (Date.now() <= entry.expiresAt && this.cache.size < this.maxEntries) {
          this.cache.set(entry.key, {
            data: entry.data,
            timestamp: entry.timestamp,
            expiresAt: entry.expiresAt,
          });
        }
      });

      this.initialized = true;
    } catch (error) {
      console.warn('Failed to warm cache from IndexedDB:', error);
      this.initialized = true;
    }
  }

  /**
   * Get cached data if valid (memory first, then IndexedDB)
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      // Also clean from IndexedDB (async, don't wait)
      if (this.persistEnabled) {
        indexedDBCache.delete(key);
      }
      return null;
    }

    return entry.data;
  }

  /**
   * Async get - checks IndexedDB if not in memory
   */
  async getAsync<T>(key: string): Promise<T | null> {
    // First check memory
    const memoryResult = this.get<T>(key);
    if (memoryResult !== null) return memoryResult;

    // Then check IndexedDB
    if (this.persistEnabled) {
      const indexedResult = await indexedDBCache.get<T>(key);
      if (indexedResult !== null) {
        // Add back to memory cache
        this.cache.set(key, {
          data: indexedResult,
          timestamp: Date.now(),
          expiresAt: Date.now() + DEFAULT_TTL,
        });
        return indexedResult;
      }
    }

    return null;
  }

  /**
   * Set cache data with TTL
   */
  set<T>(key: string, data: T, ttl = DEFAULT_TTL): void {
    // Evict oldest entries if at capacity
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    };

    this.cache.set(key, entry);

    // Persist to IndexedDB (async, don't wait)
    if (this.persistEnabled) {
      indexedDBCache.set(key, data, ttl, this.category);
    }
  }

  /**
   * Invalidate specific cache key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
    if (this.persistEnabled) {
      indexedDBCache.delete(key);
    }
  }

  /**
   * Invalidate all keys matching a pattern
   */
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
    if (this.persistEnabled) {
      indexedDBCache.deletePattern(pattern);
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    if (this.persistEnabled) {
      indexedDBCache.clearCategory(this.category);
    }
  }

  /**
   * Get cache stats
   */
  getStats(): { size: number; maxEntries: number; category: string } {
    return {
      size: this.cache.size,
      maxEntries: this.maxEntries,
      category: this.category,
    };
  }

  /**
   * Get full stats including IndexedDB
   */
  async getFullStats(): Promise<{
    memory: { size: number; maxEntries: number };
    indexedDB: { total: number; byCategory: Record<string, number> };
  }> {
    const indexedStats = await indexedDBCache.getStats();
    return {
      memory: { size: this.cache.size, maxEntries: this.maxEntries },
      indexedDB: indexedStats,
    };
  }
}

// Singleton instance for appointments (with persistence)
export const appointmentsCache = new QueryCache(50, 'appointments', true);

// Singleton instance for patients (with persistence)
export const patientsCache = new QueryCache(100, 'patients', true);

// Singleton instance for dental charts (with persistence)
export const dentalChartsCache = new QueryCache(30, 'dentalCharts', true);

/**
 * Cache key generators
 */
export const cacheKeys = {
  appointments: {
    all: (clinics: string[], dateRange?: string) =>
      `appointments:all:${clinics.sort().join(',')}:${dateRange || 'default'}`,
    byDate: (dateKey: string, clinics: string[]) =>
      `appointments:date:${dateKey}:${clinics.sort().join(',')}`,
    byDateRange: (start: string, end: string, clinics: string[]) =>
      `appointments:range:${start}:${end}:${clinics.sort().join(',')}`,
    pending: (clinics: string[]) =>
      `appointments:pending:${clinics.sort().join(',')}`,
    cancelled: (clinics: string[]) =>
      `appointments:cancelled:${clinics.sort().join(',')}`,
  },
  patients: {
    profile: (patientName: string) => `patient:profile:${patientName}`,
    list: (clinics: string[]) => `patients:list:${clinics.sort().join(',')}`,
  },
  dentalCharts: {
    chart: (userId: string) => `dental:chart:${userId}`,
    snapshots: (userId: string) => `dental:snapshots:${userId}`,
  },
};

/**
 * Wrapper for cached queries (sync memory check + async fallback)
 */
export async function cachedQuery<T>(
  cache: QueryCache,
  key: string,
  queryFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttl = DEFAULT_TTL } = options;

  // Try sync memory cache first
  const syncCached = cache.get<T>(key);
  if (syncCached !== null) {
    return syncCached;
  }

  // Try async IndexedDB cache
  const asyncCached = await cache.getAsync<T>(key);
  if (asyncCached !== null) {
    return asyncCached;
  }

  // Execute query
  const result = await queryFn();

  // Cache result
  cache.set(key, result, ttl);

  return result;
}

/**
 * Invalidate appointment caches (call after mutations)
 */
export function invalidateAppointmentCaches(): void {
  appointmentsCache.clear();
}

/**
 * Invalidate patient caches (call after mutations)
 */
export function invalidatePatientCaches(patientName?: string): void {
  if (patientName) {
    patientsCache.invalidate(cacheKeys.patients.profile(patientName));
  } else {
    patientsCache.clear();
  }
}

/**
 * Invalidate dental chart caches (call after mutations)
 */
export function invalidateDentalChartCaches(userId?: string): void {
  if (userId) {
    dentalChartsCache.invalidate(cacheKeys.dentalCharts.chart(userId));
    dentalChartsCache.invalidate(cacheKeys.dentalCharts.snapshots(userId));
  } else {
    dentalChartsCache.clear();
  }
}

/**
 * Clear all caches (memory + IndexedDB)
 */
export async function clearAllCaches(): Promise<void> {
  appointmentsCache.clear();
  patientsCache.clear();
  dentalChartsCache.clear();
  await indexedDBCache.clearAll();
}

/**
 * Get combined cache statistics
 */
export async function getCacheStats(): Promise<{
  appointments: { size: number; maxEntries: number };
  patients: { size: number; maxEntries: number };
  dentalCharts: { size: number; maxEntries: number };
  indexedDB: { total: number; byCategory: Record<string, number> };
}> {
  const indexedStats = await indexedDBCache.getStats();
  return {
    appointments: { size: appointmentsCache.getStats().size, maxEntries: 50 },
    patients: { size: patientsCache.getStats().size, maxEntries: 100 },
    dentalCharts: { size: dentalChartsCache.getStats().size, maxEntries: 30 },
    indexedDB: indexedStats,
  };
}

export default QueryCache;
