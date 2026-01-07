/**
 * IndexedDB Persistence Layer for Query Cache
 * Provides persistent storage that survives page refreshes
 */

const DB_NAME = 'dental-clinic-cache';
const DB_VERSION = 1;
const STORE_NAME = 'query-cache';

interface CachedItem<T = unknown> {
  key: string;
  data: T;
  timestamp: number;
  expiresAt: number;
  category: 'appointments' | 'patients' | 'dentalCharts' | 'general';
}

class IndexedDBCache {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize IndexedDB connection
   */
  async init(): Promise<void> {
    // Return existing promise if already initializing
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      // Check if IndexedDB is available
      if (!window.indexedDB) {
        console.warn('IndexedDB not supported, falling back to memory-only cache');
        resolve();
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        resolve(); // Don't reject, just use memory cache
      };

      request.onsuccess = () => {
        this.db = request.result;
        // Clean up expired entries on startup
        this.cleanExpired();
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'key' });
          // Create indexes for efficient querying
          store.createIndex('category', 'category', { unique: false });
          store.createIndex('expiresAt', 'expiresAt', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Get cached data from IndexedDB
   */
  async get<T>(key: string): Promise<T | null> {
    await this.init();
    if (!this.db) return null;

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);

        request.onsuccess = () => {
          const entry = request.result as CachedItem<T> | undefined;

          if (!entry) {
            resolve(null);
            return;
          }

          // Check if expired
          if (Date.now() > entry.expiresAt) {
            this.delete(key); // Clean up expired entry
            resolve(null);
            return;
          }

          resolve(entry.data);
        };

        request.onerror = () => {
          console.error('IndexedDB get error:', request.error);
          resolve(null);
        };
      } catch {
        resolve(null);
      }
    });
  }

  /**
   * Set cached data in IndexedDB
   */
  async set<T>(
    key: string,
    data: T,
    ttl: number,
    category: CachedItem['category'] = 'general'
  ): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const entry: CachedItem<T> = {
          key,
          data,
          timestamp: Date.now(),
          expiresAt: Date.now() + ttl,
          category,
        };

        const request = store.put(entry);

        request.onsuccess = () => resolve();
        request.onerror = () => {
          console.error('IndexedDB set error:', request.error);
          resolve();
        };
      } catch {
        resolve();
      }
    });
  }

  /**
   * Delete a specific key
   */
  async delete(key: string): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.delete(key);
        resolve();
      } catch {
        resolve();
      }
    });
  }

  /**
   * Delete all entries matching a pattern
   */
  async deletePattern(pattern: string): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.openCursor();
        const regex = new RegExp(pattern);

        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            if (regex.test(cursor.key as string)) {
              cursor.delete();
            }
            cursor.continue();
          } else {
            resolve();
          }
        };

        request.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  /**
   * Clear all entries in a category
   */
  async clearCategory(category: CachedItem['category']): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('category');
        const request = index.openCursor(IDBKeyRange.only(category));

        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            resolve();
          }
        };

        request.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  /**
   * Clear all cached data
   */
  async clearAll(): Promise<void> {
    await this.init();
    if (!this.db) return;

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        store.clear();
        resolve();
      } catch {
        resolve();
      }
    });
  }

  /**
   * Clean up expired entries
   */
  private async cleanExpired(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(STORE_NAME, 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('expiresAt');
        const now = Date.now();
        const request = index.openCursor(IDBKeyRange.upperBound(now));

        request.onsuccess = () => {
          const cursor = request.result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          } else {
            resolve();
          }
        };

        request.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  }

  /**
   * Get all keys in a category (for warming memory cache)
   */
  async getAllInCategory<T>(category: CachedItem['category']): Promise<CachedItem<T>[]> {
    await this.init();
    if (!this.db) return [];

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const index = store.index('category');
        const request = index.getAll(IDBKeyRange.only(category));

        request.onsuccess = () => {
          const entries = (request.result as CachedItem<T>[]).filter(
            (entry) => Date.now() <= entry.expiresAt
          );
          resolve(entries);
        };

        request.onerror = () => resolve([]);
      } catch {
        resolve([]);
      }
    });
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ total: number; byCategory: Record<string, number> }> {
    await this.init();
    if (!this.db) return { total: 0, byCategory: {} };

    return new Promise((resolve) => {
      try {
        const transaction = this.db!.transaction(STORE_NAME, 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const countRequest = store.count();

        countRequest.onsuccess = () => {
          const total = countRequest.result;
          // Get count by category
          const byCategory: Record<string, number> = {};
          const categories: CachedItem['category'][] = ['appointments', 'patients', 'dentalCharts', 'general'];

          let completed = 0;
          categories.forEach((cat) => {
            const index = store.index('category');
            const catRequest = index.count(IDBKeyRange.only(cat));
            catRequest.onsuccess = () => {
              byCategory[cat] = catRequest.result;
              completed++;
              if (completed === categories.length) {
                resolve({ total, byCategory });
              }
            };
            catRequest.onerror = () => {
              completed++;
              if (completed === categories.length) {
                resolve({ total, byCategory });
              }
            };
          });
        };

        countRequest.onerror = () => resolve({ total: 0, byCategory: {} });
      } catch {
        resolve({ total: 0, byCategory: {} });
      }
    });
  }
}

// Singleton instance
export const indexedDBCache = new IndexedDBCache();

export default IndexedDBCache;
