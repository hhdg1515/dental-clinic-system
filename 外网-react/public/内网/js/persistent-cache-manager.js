/**
 * 持久化缓存管理器 (Persistent Cache Manager)
 *
 * 继承 GlobalCacheManager,添加 IndexedDB 持久化层
 *
 * 架构:
 * - L1: 内存缓存 (Map) - 最快,页面内有效
 * - L2: IndexedDB - 持久化,页面刷新后仍有效
 *
 * 安全边界:
 * ✅ 可缓存: 预约数据、统计数据、UI偏好
 * ❌ 不可缓存: 用户角色、权限、Token
 */

class PersistentCacheManager extends GlobalCacheManager {
  constructor() {
    super();

    this.persistent = null;
    this.isReady = false;

    // 安全边界:禁止缓存的敏感字段
    this.SENSITIVE_KEYS = [
      'user-role',
      'user-clinics',
      'auth-token',
      'currentuser',
      'firebase-token',
      'uid',
      'role',
      'clinics',
      'permissions'
    ];

    this.init();
  }

  async init() {
    try {
      // 检查 IndexedDB 是否可用
      if (!window.indexedDB) {
        console.warn('⚠️ IndexedDB not supported, falling back to memory-only cache');
        return;
      }

      // 使用 localforage 初始化 IndexedDB
      if (typeof localforage !== 'undefined') {
        this.persistent = localforage.createInstance({
          name: 'dental-clinic-cache',
          storeName: 'appointments-data',
          description: 'Persistent cache for appointment data'
        });

        this.isReady = true;
        console.log('✅ PersistentCacheManager initialized with IndexedDB');

        // 清理过期的持久化缓存
        await this.cleanupExpiredPersistent();
      } else {
        console.warn('⚠️ localforage not loaded, using memory-only cache');
      }

    } catch (error) {
      console.warn('⚠️ IndexedDB initialization failed, falling back to memory-only cache:', error);
      this.isReady = false;
    }
  }

  /**
   * 验证 key 是否安全(不包含敏感信息)
   */
  isSafeKey(key) {
    const lowerKey = key.toLowerCase();
    return !this.SENSITIVE_KEYS.some(sensitive => lowerKey.includes(sensitive));
  }

  /**
   * 获取缓存(两层查询)
   * @override
   */
  async getDateCache(dateKey) {
    // L1: 内存缓存(最快)
    const memoryCache = super.getDateCache(dateKey);
    if (memoryCache) {
      return memoryCache;
    }

    // L2: IndexedDB 持久化缓存
    if (!this.isReady || !this.persistent) {
      return null;
    }

    try {
      const cacheKey = `date:${dateKey}`;
      const stored = await this.persistent.getItem(cacheKey);

      if (!stored) {
        return null;
      }

      // 检查是否过期
      const age = Date.now() - stored.timestamp;
      if (age >= this.CACHE_DURATION) {
        // 过期,删除
        await this.persistent.removeItem(cacheKey);
        return null;
      }

      // 有效,回填到 L1 内存缓存
      super.setDateCache(dateKey, stored.data);
      this.stats.hits++;
      this.stats.savedReads++;

      console.log(`📦 L2 Cache HIT (IndexedDB): ${dateKey} (saved Firebase read)`);
      return stored.data;

    } catch (error) {
      console.warn('IndexedDB read error:', error);
      return null;
    }
  }

  /**
   * 设置缓存(同时写入两层)
   * @override
   */
  async setDateCache(dateKey, data) {
    // 验证安全性
    if (!this.isSafeKey(dateKey)) {
      console.error(`🚨 Security: Attempted to cache sensitive data: ${dateKey}`);
      return;
    }

    // L1: 内存缓存
    super.setDateCache(dateKey, data);

    // L2: IndexedDB 持久化
    if (!this.isReady || !this.persistent) {
      return;
    }

    try {
      const cacheKey = `date:${dateKey}`;
      const entry = {
        data: data,
        timestamp: Date.now(),
        version: '1.0'
      };

      await this.persistent.setItem(cacheKey, entry);
      console.log(`💾 Cached to IndexedDB: ${dateKey} (${data.length} appointments)`);

    } catch (error) {
      console.warn('IndexedDB write error:', error);
    }
  }

  /**
   * 获取全量缓存(两层查询)
   * @override
   */
  async getAllCache() {
    // L1: 内存
    const memoryCache = super.getAllCache();
    if (memoryCache) {
      return memoryCache;
    }

    // L2: IndexedDB
    if (!this.isReady || !this.persistent) {
      return null;
    }

    try {
      const cacheKey = 'all-appointments';
      const stored = await this.persistent.getItem(cacheKey);

      if (!stored) {
        return null;
      }

      const age = Date.now() - stored.timestamp;
      if (age >= this.CACHE_DURATION) {
        await this.persistent.removeItem(cacheKey);
        return null;
      }

      super.setAllCache(stored.data);
      console.log('📦 L2 Cache HIT: getAllAppointments (IndexedDB)');
      return stored.data;

    } catch (error) {
      console.warn('IndexedDB read error:', error);
      return null;
    }
  }

  /**
   * 设置全量缓存(同时写入两层)
   * @override
   */
  async setAllCache(data) {
    // L1: 内存
    super.setAllCache(data);

    // L2: IndexedDB
    if (!this.isReady || !this.persistent) {
      return;
    }

    try {
      const cacheKey = 'all-appointments';
      const entry = {
        data: data,
        timestamp: Date.now(),
        version: '1.0'
      };

      await this.persistent.setItem(cacheKey, entry);
      console.log(`💾 Cached all appointments to IndexedDB (${data.length} total)`);

    } catch (error) {
      console.warn('IndexedDB write error:', error);
    }
  }

  /**
   * 清理所有缓存(包括持久化)
   * @override
   */
  async clearAll() {
    // 清理内存缓存
    super.clearAll();

    // 清理 IndexedDB
    if (this.isReady && this.persistent) {
      try {
        await this.persistent.clear();
        console.log('🗑️ IndexedDB cache cleared');
      } catch (error) {
        console.warn('IndexedDB clear error:', error);
      }
    }
  }

  /**
   * 清理过期的持久化缓存
   */
  async cleanupExpiredPersistent() {
    if (!this.isReady || !this.persistent) {
      return;
    }

    try {
      const keys = await this.persistent.keys();
      let cleanedCount = 0;

      for (const key of keys) {
        const stored = await this.persistent.getItem(key);

        if (stored && stored.timestamp) {
          const age = Date.now() - stored.timestamp;
          if (age >= this.CACHE_DURATION) {
            await this.persistent.removeItem(key);
            cleanedCount++;
          }
        }
      }

      if (cleanedCount > 0) {
        console.log(`🧹 Cleaned ${cleanedCount} expired entries from IndexedDB`);
      }

    } catch (error) {
      console.warn('IndexedDB cleanup error:', error);
    }
  }

  /**
   * 当预约创建时,同时清理持久化缓存
   * @override
   */
  async onAppointmentCreated(dateKey) {
    super.onAppointmentCreated(dateKey);

    if (this.isReady && this.persistent) {
      try {
        await this.persistent.removeItem(`date:${dateKey}`);
        await this.persistent.removeItem('all-appointments');
      } catch (error) {
        console.warn('IndexedDB invalidation error:', error);
      }
    }
  }

  /**
   * 当预约更新时,同时清理持久化缓存
   * @override
   */
  async onAppointmentUpdated(dateKey, newStatus) {
    super.onAppointmentUpdated(dateKey, newStatus);

    if (this.isReady && this.persistent) {
      try {
        await this.persistent.removeItem(`date:${dateKey}`);

        if (newStatus === 'cancelled') {
          await this.persistent.removeItem('all-appointments');
          await this.persistent.removeItem('cancelled-appointments');
        }
      } catch (error) {
        console.warn('IndexedDB invalidation error:', error);
      }
    }
  }

  /**
   * 获取缓存统计(包括 IndexedDB)
   * @override
   */
  async getStats() {
    const baseStats = super.getStats();

    if (!this.isReady || !this.persistent) {
      return {
        ...baseStats,
        indexedDBStatus: 'unavailable'
      };
    }

    try {
      const keys = await this.persistent.keys();
      const dbSize = keys.length;

      return {
        ...baseStats,
        indexedDBStatus: 'available',
        indexedDBEntries: dbSize,
        persistenceEnabled: true
      };
    } catch (error) {
      return {
        ...baseStats,
        indexedDBStatus: 'error',
        persistenceEnabled: false
      };
    }
  }
}

// 导出到全局
if (typeof window !== 'undefined') {
  window.PersistentCacheManager = PersistentCacheManager;

  // 自动替换全局 cacheManager 为持久化版本
  if (window.cacheManager) {
    console.log('🔄 Upgrading to PersistentCacheManager...');
    window.cacheManager = new PersistentCacheManager();
    console.log('✅ PersistentCacheManager is now active');
  }
}
