/**
 * Development Tools Component
 * Shows cache statistics and performance metrics
 * Only visible in development mode
 */

import { useState, useEffect, useCallback } from 'react';
import { getCacheStats, clearAllCaches } from '../utils/queryCache';
import { performanceMonitor } from '../utils/performanceMonitor';

interface CacheStats {
  appointments: { size: number; maxEntries: number };
  patients: { size: number; maxEntries: number };
  dentalCharts: { size: number; maxEntries: number };
  indexedDB: { total: number; byCategory: Record<string, number> };
}

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

export function DevTools() {
  const [isOpen, setIsOpen] = useState(false);
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);

  // Only render in development
  if (import.meta.env.PROD) return null;

  const refreshStats = useCallback(async () => {
    const stats = await getCacheStats();
    setCacheStats(stats);
    setMetrics(performanceMonitor.getMetrics());
  }, []);

  useEffect(() => {
    if (isOpen) {
      refreshStats();
      // Auto-refresh every 5 seconds when open
      const interval = setInterval(refreshStats, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen, refreshStats]);

  const handleClearCache = async () => {
    await clearAllCaches();
    refreshStats();
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good':
        return 'text-green-600';
      case 'needs-improvement':
        return 'text-yellow-600';
      case 'poor':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatValue = (name: string, value: number) => {
    if (name === 'CLS') return value.toFixed(3);
    return `${value.toFixed(0)}ms`;
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 w-10 h-10 rounded-full bg-gray-800 text-white shadow-lg flex items-center justify-center hover:bg-gray-700 transition-colors"
        title="Developer Tools"
      >
        <i className="fas fa-cog"></i>
      </button>

      {/* Panel */}
      {isOpen && (
        <div className="fixed bottom-16 right-4 z-50 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gray-800 text-white px-4 py-3 flex items-center justify-between">
            <span className="font-semibold text-sm">Dev Tools</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {/* Cache Stats */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Cache Stats</h3>
                <button
                  onClick={handleClearCache}
                  className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
                >
                  Clear All
                </button>
              </div>

              {cacheStats ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Memory Cache</span>
                    <span className="font-medium">
                      {cacheStats.appointments.size +
                        cacheStats.patients.size +
                        cacheStats.dentalCharts.size}{' '}
                      entries
                    </span>
                  </div>
                  <div className="pl-3 space-y-1 text-gray-500">
                    <div className="flex justify-between">
                      <span>Appointments</span>
                      <span>
                        {cacheStats.appointments.size}/{cacheStats.appointments.maxEntries}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Patients</span>
                      <span>
                        {cacheStats.patients.size}/{cacheStats.patients.maxEntries}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Dental Charts</span>
                      <span>
                        {cacheStats.dentalCharts.size}/{cacheStats.dentalCharts.maxEntries}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-gray-100">
                    <span className="text-gray-500">IndexedDB</span>
                    <span className="font-medium">{cacheStats.indexedDB.total} entries</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-gray-400">Loading...</div>
              )}
            </div>

            {/* Performance Metrics */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700">Web Vitals</h3>
                <button
                  onClick={refreshStats}
                  className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                >
                  Refresh
                </button>
              </div>

              {metrics.length > 0 ? (
                <div className="space-y-2 text-xs">
                  {metrics.map((metric) => (
                    <div key={metric.name} className="flex justify-between items-center">
                      <span className="text-gray-500">{metric.name}</span>
                      <span className={`font-medium ${getRatingColor(metric.rating)}`}>
                        {formatValue(metric.name, metric.value)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-400">
                  Metrics will appear after page load
                </div>
              )}

              {/* Legend */}
              <div className="mt-3 pt-3 border-t border-gray-100 flex gap-3 text-xs">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Good
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                  Needs work
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                  Poor
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-4 bg-gray-50 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Quick Actions</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => performanceMonitor.logReport()}
                  className="flex-1 text-xs px-3 py-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                >
                  Log Report
                </button>
                <button
                  onClick={() => {
                    localStorage.clear();
                    sessionStorage.clear();
                    alert('Storage cleared!');
                  }}
                  className="flex-1 text-xs px-3 py-2 bg-orange-100 text-orange-600 rounded hover:bg-orange-200 transition-colors"
                >
                  Clear Storage
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default DevTools;
