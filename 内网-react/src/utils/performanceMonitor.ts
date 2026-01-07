/**
 * Performance Monitoring Utility
 * Tracks Core Web Vitals and custom metrics using native Performance API
 * Lightweight implementation without external dependencies
 */

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

interface PerformanceReport {
  metrics: PerformanceMetric[];
  navigation: {
    domContentLoaded: number;
    loadComplete: number;
    firstPaint: number;
    firstContentfulPaint: number;
  };
  resources: {
    totalSize: number;
    totalCount: number;
    byType: Record<string, { count: number; size: number }>;
  };
}

// Thresholds based on Google's Core Web Vitals
const THRESHOLDS = {
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  FID: { good: 100, poor: 300 },   // First Input Delay
  CLS: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte
  INP: { good: 200, poor: 500 },   // Interaction to Next Paint
};

type MetricName = keyof typeof THRESHOLDS;

function getRating(name: MetricName, value: number): PerformanceMetric['rating'] {
  const threshold = THRESHOLDS[name];
  if (!threshold) return 'good';
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: Map<string, PerformanceObserver> = new Map();
  private isEnabled: boolean = true;

  constructor() {
    // Only enable in browser environment
    this.isEnabled = typeof window !== 'undefined' && 'performance' in window;
  }

  /**
   * Initialize performance monitoring
   */
  init(): void {
    if (!this.isEnabled) return;

    // Observe paint timing
    this.observePaintTiming();

    // Observe largest contentful paint
    this.observeLCP();

    // Observe first input delay
    this.observeFID();

    // Observe cumulative layout shift
    this.observeCLS();

    // Observe long tasks
    this.observeLongTasks();

    // Collect navigation timing on load
    if (document.readyState === 'complete') {
      this.collectNavigationTiming();
    } else {
      window.addEventListener('load', () => {
        // Delay to ensure all metrics are available
        setTimeout(() => this.collectNavigationTiming(), 0);
      });
    }
  }

  /**
   * Observe First Paint and First Contentful Paint
   */
  private observePaintTiming(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.addMetric('FCP', entry.startTime);
          }
        }
      });

      observer.observe({ type: 'paint', buffered: true });
      this.observers.set('paint', observer);
    } catch {
      // Observer not supported
    }
  }

  /**
   * Observe Largest Contentful Paint
   */
  private observeLCP(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          this.addMetric('LCP', lastEntry.startTime);
        }
      });

      observer.observe({ type: 'largest-contentful-paint', buffered: true });
      this.observers.set('lcp', observer);
    } catch {
      // Observer not supported
    }
  }

  /**
   * Observe First Input Delay
   */
  private observeFID(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        const firstEntry = list.getEntries()[0] as PerformanceEventTiming | undefined;
        if (firstEntry) {
          this.addMetric('FID', firstEntry.processingStart - firstEntry.startTime);
        }
      });

      observer.observe({ type: 'first-input', buffered: true });
      this.observers.set('fid', observer);
    } catch {
      // Observer not supported
    }
  }

  /**
   * Observe Cumulative Layout Shift
   */
  private observeCLS(): void {
    if (!('PerformanceObserver' in window)) return;

    let clsValue = 0;
    let sessionValue = 0;
    let sessionEntries: PerformanceEntry[] = [];

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // Only count layout shifts without recent user input
          const layoutShift = entry as PerformanceEntry & {
            hadRecentInput: boolean;
            value: number;
          };

          if (!layoutShift.hadRecentInput) {
            const firstEntry = sessionEntries[0] as PerformanceEntry | undefined;
            const lastEntry = sessionEntries[sessionEntries.length - 1] as PerformanceEntry | undefined;

            // Start new session if gap > 1s or total > 5s
            if (
              sessionValue &&
              (entry.startTime - (lastEntry?.startTime ?? 0) > 1000 ||
                entry.startTime - (firstEntry?.startTime ?? 0) > 5000)
            ) {
              if (sessionValue > clsValue) {
                clsValue = sessionValue;
              }
              sessionValue = layoutShift.value;
              sessionEntries = [entry];
            } else {
              sessionValue += layoutShift.value;
              sessionEntries.push(entry);
            }

            // Update metric with current max
            const maxCLS = Math.max(clsValue, sessionValue);
            this.addMetric('CLS', maxCLS);
          }
        }
      });

      observer.observe({ type: 'layout-shift', buffered: true });
      this.observers.set('cls', observer);
    } catch {
      // Observer not supported
    }
  }

  /**
   * Observe long tasks (>50ms)
   */
  private observeLongTasks(): void {
    if (!('PerformanceObserver' in window)) return;

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          // Log long tasks for debugging
          if (entry.duration > 100) {
            console.debug(
              `[Performance] Long task detected: ${entry.duration.toFixed(0)}ms`,
              entry
            );
          }
        }
      });

      observer.observe({ type: 'longtask', buffered: true });
      this.observers.set('longtask', observer);
    } catch {
      // Observer not supported
    }
  }

  /**
   * Collect navigation timing metrics
   */
  private collectNavigationTiming(): void {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

    if (navigation) {
      // Time to First Byte
      const ttfb = navigation.responseStart - navigation.requestStart;
      this.addMetric('TTFB', ttfb);
    }
  }

  /**
   * Add a metric to the collection
   */
  private addMetric(name: MetricName, value: number): void {
    // Update existing metric or add new one
    const existingIndex = this.metrics.findIndex((m) => m.name === name);
    const metric: PerformanceMetric = {
      name,
      value,
      rating: getRating(name, value),
      timestamp: Date.now(),
    };

    if (existingIndex >= 0) {
      this.metrics[existingIndex] = metric;
    } else {
      this.metrics.push(metric);
    }
  }

  /**
   * Track a custom metric
   */
  trackCustomMetric(name: string, value: number): void {
    if (!this.isEnabled) return;

    this.metrics.push({
      name,
      value,
      rating: 'good', // Custom metrics don't have thresholds
      timestamp: Date.now(),
    });
  }

  /**
   * Measure execution time of an async function
   */
  async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    if (!this.isEnabled) return fn();

    const start = performance.now();
    try {
      return await fn();
    } finally {
      const duration = performance.now() - start;
      this.trackCustomMetric(name, duration);
    }
  }

  /**
   * Get all collected metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get a full performance report
   */
  getReport(): PerformanceReport {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paintEntries = performance.getEntriesByType('paint');
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];

    // Calculate resource stats
    const byType: Record<string, { count: number; size: number }> = {};
    let totalSize = 0;

    resources.forEach((resource) => {
      const type = resource.initiatorType || 'other';
      const size = resource.transferSize || 0;
      totalSize += size;

      if (!byType[type]) {
        byType[type] = { count: 0, size: 0 };
      }
      byType[type].count++;
      byType[type].size += size;
    });

    return {
      metrics: this.getMetrics(),
      navigation: {
        domContentLoaded: navigation?.domContentLoadedEventEnd - navigation?.fetchStart || 0,
        loadComplete: navigation?.loadEventEnd - navigation?.fetchStart || 0,
        firstPaint: paintEntries.find((e) => e.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paintEntries.find((e) => e.name === 'first-contentful-paint')?.startTime || 0,
      },
      resources: {
        totalSize,
        totalCount: resources.length,
        byType,
      },
    };
  }

  /**
   * Log metrics to console
   */
  logReport(): void {
    if (!this.isEnabled) return;

    const report = this.getReport();

    console.group('%c📊 Performance Report', 'font-size: 14px; font-weight: bold;');

    // Core Web Vitals
    console.group('Core Web Vitals');
    report.metrics.forEach((metric) => {
      const color =
        metric.rating === 'good'
          ? 'color: #059669'
          : metric.rating === 'needs-improvement'
          ? 'color: #d97706'
          : 'color: #dc2626';

      const unit = metric.name === 'CLS' ? '' : 'ms';
      const value = metric.name === 'CLS'
        ? metric.value.toFixed(3)
        : metric.value.toFixed(0);

      console.log(
        `%c${metric.name}: ${value}${unit} (${metric.rating})`,
        color
      );
    });
    console.groupEnd();

    // Navigation Timing
    console.group('Navigation Timing');
    console.log(`DOM Content Loaded: ${report.navigation.domContentLoaded.toFixed(0)}ms`);
    console.log(`Load Complete: ${report.navigation.loadComplete.toFixed(0)}ms`);
    console.log(`First Paint: ${report.navigation.firstPaint.toFixed(0)}ms`);
    console.log(`First Contentful Paint: ${report.navigation.firstContentfulPaint.toFixed(0)}ms`);
    console.groupEnd();

    // Resource Stats
    console.group('Resources');
    console.log(`Total: ${report.resources.totalCount} requests, ${(report.resources.totalSize / 1024).toFixed(0)} KB`);
    Object.entries(report.resources.byType).forEach(([type, stats]) => {
      console.log(`  ${type}: ${stats.count} requests, ${(stats.size / 1024).toFixed(0)} KB`);
    });
    console.groupEnd();

    console.groupEnd();
  }

  /**
   * Clean up observers
   */
  destroy(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers.clear();
    this.metrics = [];
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Auto-initialize in development
if (import.meta.env.DEV) {
  performanceMonitor.init();

  // Log report after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      performanceMonitor.logReport();
    }, 3000); // Wait for metrics to settle
  });
}

export default PerformanceMonitor;
