/**
 * Simple in-memory cache for Firebase queries
 * Reduces redundant Firestore reads and improves performance
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxEntries?: number;
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
const DEFAULT_MAX_ENTRIES = 100;

class QueryCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private maxEntries: number;

  constructor(maxEntries = DEFAULT_MAX_ENTRIES) {
    this.maxEntries = maxEntries;
  }

  /**
   * Get cached data if valid
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
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

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    });
  }

  /**
   * Invalidate specific cache key
   */
  invalidate(key: string): void {
    this.cache.delete(key);
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
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  getStats(): { size: number; maxEntries: number } {
    return {
      size: this.cache.size,
      maxEntries: this.maxEntries,
    };
  }
}

// Singleton instance for appointments
export const appointmentsCache = new QueryCache(50);

// Singleton instance for patients
export const patientsCache = new QueryCache(100);

// Singleton instance for dental charts
export const dentalChartsCache = new QueryCache(30);

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
 * Wrapper for cached queries
 */
export async function cachedQuery<T>(
  cache: QueryCache,
  key: string,
  queryFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttl = DEFAULT_TTL } = options;

  // Try cache first
  const cached = cache.get<T>(key);
  if (cached !== null) {
    return cached;
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

export default QueryCache;
