import { useState, useEffect, useRef } from 'react';

interface UseAnimatedNumberOptions {
  duration?: number;      // Animation duration in ms
  delay?: number;         // Delay before starting
  easing?: 'linear' | 'easeOut' | 'easeInOut' | 'spring';
  decimals?: number;      // Number of decimal places
  formatFn?: (value: number) => string;  // Custom formatting
}

// Easing functions
const easings = {
  linear: (t: number) => t,
  easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
  easeInOut: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  spring: (t: number) => {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
};

export function useAnimatedNumber(
  targetValue: number,
  options: UseAnimatedNumberOptions = {}
): number {
  const {
    duration = 1000,
    delay = 0,
    easing = 'easeOut',
    decimals = 0,
  } = options;

  const [displayValue, setDisplayValue] = useState(0);
  const startValueRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const previousTargetRef = useRef(targetValue);

  useEffect(() => {
    // Cancel any existing animation
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    // Store the starting value (current display value)
    startValueRef.current = displayValue;

    // Delay start if specified
    const timeoutId = setTimeout(() => {
      startTimeRef.current = null;

      const animate = (timestamp: number) => {
        if (startTimeRef.current === null) {
          startTimeRef.current = timestamp;
        }

        const elapsed = timestamp - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easings[easing](progress);

        const currentValue = startValueRef.current + (targetValue - startValueRef.current) * easedProgress;

        // Round to specified decimals
        const roundedValue = Number(currentValue.toFixed(decimals));
        setDisplayValue(roundedValue);

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };

      animationRef.current = requestAnimationFrame(animate);
    }, delay);

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [targetValue, duration, delay, easing, decimals]);

  // Update previous target
  useEffect(() => {
    previousTargetRef.current = targetValue;
  }, [targetValue]);

  return displayValue;
}

// Hook for formatted animated number (returns string)
export function useFormattedAnimatedNumber(
  targetValue: number,
  options: UseAnimatedNumberOptions = {}
): string {
  const { formatFn, ...rest } = options;
  const animatedValue = useAnimatedNumber(targetValue, rest);

  if (formatFn) {
    return formatFn(animatedValue);
  }

  return animatedValue.toLocaleString();
}

// Hook for percentage animation
export function useAnimatedPercentage(
  targetValue: number,
  options: Omit<UseAnimatedNumberOptions, 'decimals'> = {}
): string {
  const animatedValue = useAnimatedNumber(targetValue, { ...options, decimals: 1 });
  return `${animatedValue}%`;
}

export default useAnimatedNumber;
