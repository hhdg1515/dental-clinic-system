// Global Cache Manager - Pure RAM-based caching for optimal performance
// No LocalStorage - Simple and fast in-memory caching only

class GlobalCacheManager {
    constructor() {
        // 分类缓存存储 (纯内存 Map 对象)
        this.dateCache = new Map();              // 单日期查询缓存 {dateKey: appointments[]}
        this.allAppointmentsCache = null;        // getAllAppointments 缓存
        this.cancelledAppointmentsCache = null;  // 取消的预约缓存

        // 时间戳管理
        this.dateCacheTimestamps = new Map();    // {dateKey: timestamp}
        this.allAppointmentsTimestamp = null;
        this.cancelledAppointmentsTimestamp = null;

        // 缓存配置
        this.CACHE_DURATION = 5 * 60 * 1000;     // 5分钟过期
        this.MAX_DATE_CACHE = 30;                 // 最多缓存30个日期

        // 统计数据 (可选 - 用于监控)
        this.stats = {
            hits: 0,
            misses: 0,
            savedReads: 0
        };

        console.log('✅ GlobalCacheManager initialized (Pure RAM-based)');
    }

    // ========== 单日期缓存 ==========

    /**
     * 获取单日期缓存
     * @param {string} dateKey - 日期键 (YYYY-MM-DD)
     * @returns {Array|null} - 缓存的预约数据或null
     */
    getDateCache(dateKey) {
        if (!this.isDateCacheValid(dateKey)) {
            this.stats.misses++;
            return null;
        }

        this.stats.hits++;
        this.stats.savedReads++;
        console.log(`📦 Cache HIT: ${dateKey} (saved Firebase read)`);
        return this.dateCache.get(dateKey);
    }

    /**
     * 设置单日期缓存
     * @param {string} dateKey - 日期键
     * @param {Array} data - 预约数据
     */
    setDateCache(dateKey, data) {
        // LRU管理：如果超出最大缓存数，删除最旧的
        if (this.dateCache.size >= this.MAX_DATE_CACHE) {
            this.evictOldestDateCache();
        }

        this.dateCache.set(dateKey, data);
        this.dateCacheTimestamps.set(dateKey, Date.now());
        console.log(`💾 Cached: ${dateKey} (${data.length} appointments)`);
    }

    /**
     * 检查单日期缓存是否有效
     */
    isDateCacheValid(dateKey) {
        if (!this.dateCache.has(dateKey) || !this.dateCacheTimestamps.has(dateKey)) {
            return false;
        }

        const timestamp = this.dateCacheTimestamps.get(dateKey);
        const age = Date.now() - timestamp;
        return age < this.CACHE_DURATION;
    }

    /**
     * 删除最旧的日期缓存 (LRU)
     */
    evictOldestDateCache() {
        let oldestKey = null;
        let oldestTime = Infinity;

        for (const [key, timestamp] of this.dateCacheTimestamps.entries()) {
            if (timestamp < oldestTime) {
                oldestTime = timestamp;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.dateCache.delete(oldestKey);
            this.dateCacheTimestamps.delete(oldestKey);
            console.log(`🗑️ Evicted oldest cache: ${oldestKey}`);
        }
    }

    /**
     * 使某个日期的缓存失效
     */
    invalidateDate(dateKey) {
        if (this.dateCache.has(dateKey)) {
            this.dateCache.delete(dateKey);
            this.dateCacheTimestamps.delete(dateKey);
            console.log(`❌ Invalidated cache: ${dateKey}`);
        }
    }

    // ========== 全量预约缓存 ==========

    /**
     * 获取全量预约缓存
     * @returns {Array|null}
     */
    getAllCache() {
        if (!this.isAllCacheValid()) {
            this.stats.misses++;
            return null;
        }

        this.stats.hits++;
        this.stats.savedReads++;
        console.log('📦 Cache HIT: getAllAppointments (saved Firebase read)');
        return this.allAppointmentsCache;
    }

    /**
     * 设置全量预约缓存
     */
    setAllCache(data) {
        this.allAppointmentsCache = data;
        this.allAppointmentsTimestamp = Date.now();
        console.log(`💾 Cached: getAllAppointments (${data.length} appointments)`);
    }

    /**
     * 检查全量缓存是否有效
     */
    isAllCacheValid() {
        if (!this.allAppointmentsCache || !this.allAppointmentsTimestamp) {
            return false;
        }

        const age = Date.now() - this.allAppointmentsTimestamp;
        return age < this.CACHE_DURATION;
    }

    /**
     * 使全量缓存失效
     */
    invalidateAll() {
        this.allAppointmentsCache = null;
        this.allAppointmentsTimestamp = null;
        console.log('❌ Invalidated cache: getAllAppointments');
    }

    // ========== 取消的预约缓存 ==========

    /**
     * 获取取消预约缓存
     */
    getCancelledCache() {
        if (!this.isCancelledCacheValid()) {
            this.stats.misses++;
            return null;
        }

        this.stats.hits++;
        this.stats.savedReads++;
        console.log('📦 Cache HIT: cancelledAppointments (saved Firebase read)');
        return this.cancelledAppointmentsCache;
    }

    /**
     * 设置取消预约缓存
     */
    setCancelledCache(data) {
        this.cancelledAppointmentsCache = data;
        this.cancelledAppointmentsTimestamp = Date.now();
        console.log(`💾 Cached: cancelledAppointments (${data.length} appointments)`);
    }

    /**
     * 检查取消预约缓存是否有效
     */
    isCancelledCacheValid() {
        if (!this.cancelledAppointmentsCache || !this.cancelledAppointmentsTimestamp) {
            return false;
        }

        const age = Date.now() - this.cancelledAppointmentsTimestamp;
        return age < this.CACHE_DURATION;
    }

    /**
     * 使取消预约缓存失效
     */
    invalidateCancelled() {
        this.cancelledAppointmentsCache = null;
        this.cancelledAppointmentsTimestamp = null;
        console.log('❌ Invalidated cache: cancelledAppointments');
    }

    // ========== 智能缓存失效策略 ==========

    /**
     * 当创建新预约时调用
     * @param {string} dateKey - 预约日期
     */
    onAppointmentCreated(dateKey) {
        // 清除该日期缓存
        this.invalidateDate(dateKey);

        // 清除全量缓存（因为总数变了）
        this.invalidateAll();

        console.log(`🔄 Cache invalidated after creating appointment on ${dateKey}`);
    }

    /**
     * 当更新预约状态时调用
     * @param {string} dateKey - 预约日期
     * @param {string} newStatus - 新状态
     */
    onAppointmentUpdated(dateKey, newStatus) {
        // 清除该日期缓存
        this.invalidateDate(dateKey);

        // 如果变为cancelled状态，需要清除全量和取消缓存
        if (newStatus === 'cancelled') {
            this.invalidateAll();
            this.invalidateCancelled();
        }

        console.log(`🔄 Cache invalidated after updating appointment on ${dateKey} to ${newStatus}`);
    }

    /**
     * 当删除预约时调用
     * @param {string} dateKey - 预约日期
     */
    onAppointmentDeleted(dateKey) {
        // 清除该日期缓存
        this.invalidateDate(dateKey);

        // 清除全量缓存
        this.invalidateAll();

        console.log(`🔄 Cache invalidated after deleting appointment on ${dateKey}`);
    }

    // ========== 工具方法 ==========

    /**
     * 清除所有缓存 (仅在必要时使用，如用户主动刷新)
     */
    clearAll() {
        this.dateCache.clear();
        this.dateCacheTimestamps.clear();
        this.allAppointmentsCache = null;
        this.allAppointmentsTimestamp = null;
        this.cancelledAppointmentsCache = null;
        this.cancelledAppointmentsTimestamp = null;

        console.log('🗑️ All caches cleared');
    }

    /**
     * 清理过期缓存
     */
    cleanupExpired() {
        const now = Date.now();
        let cleanedCount = 0;

        // 清理过期的日期缓存
        for (const [dateKey, timestamp] of this.dateCacheTimestamps.entries()) {
            if (now - timestamp >= this.CACHE_DURATION) {
                this.dateCache.delete(dateKey);
                this.dateCacheTimestamps.delete(dateKey);
                cleanedCount++;
            }
        }

        // 清理过期的全量缓存
        if (this.allAppointmentsTimestamp && now - this.allAppointmentsTimestamp >= this.CACHE_DURATION) {
            this.invalidateAll();
            cleanedCount++;
        }

        // 清理过期的取消缓存
        if (this.cancelledAppointmentsTimestamp && now - this.cancelledAppointmentsTimestamp >= this.CACHE_DURATION) {
            this.invalidateCancelled();
            cleanedCount++;
        }

        if (cleanedCount > 0) {
            console.log(`🧹 Cleaned ${cleanedCount} expired cache entries`);
        }
    }

    /**
     * 获取缓存统计信息
     */
    getStats() {
        const hitRate = this.stats.hits + this.stats.misses > 0
            ? ((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(1)
            : '0.0';

        return {
            hits: this.stats.hits,
            misses: this.stats.misses,
            hitRate: `${hitRate}%`,
            savedReads: this.stats.savedReads,
            dateCacheSize: this.dateCache.size,
            hasAllCache: !!this.allAppointmentsCache,
            hasCancelledCache: !!this.cancelledAppointmentsCache,
            totalCacheSize: this.dateCache.size + (this.allAppointmentsCache ? 1 : 0) + (this.cancelledAppointmentsCache ? 1 : 0)
        };
    }

    /**
     * 打印缓存状态到控制台
     */
    printStats() {
        const stats = this.getStats();
        console.log('📊 Cache Statistics:', stats);
    }
}

// 创建全局单例实例
window.cacheManager = new GlobalCacheManager();

// 自动清理过期缓存 (每分钟执行一次)
setInterval(() => {
    window.cacheManager.cleanupExpired();
}, 60 * 1000);

// 导出给模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GlobalCacheManager;
}

console.log('✅ GlobalCacheManager loaded and ready');
