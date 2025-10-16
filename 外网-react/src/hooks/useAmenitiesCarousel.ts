import { useState, useEffect, useCallback } from 'react';

/**
 * Amenities Carousel Hook
 * 管理 6 个设施轮播项的状态和自动切换逻辑
 * 自动播放间隔：5 秒
 */
export const useAmenitiesCarousel = (totalSlides: number = 6, autoSlideInterval: number = 5000) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // 下一张
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  // 上一张
  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  // 跳转到指定幻灯片
  const goToSlide = useCallback((index: number) => {
    if (index >= 0 && index < totalSlides) {
      setCurrentSlide(index);
    }
  }, [totalSlides]);

  // 暂停自动播放
  const pauseAutoSlide = useCallback(() => setIsPaused(true), []);

  // 恢复自动播放
  const resumeAutoSlide = useCallback(() => setIsPaused(false), []);

  // 自动轮播
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(nextSlide, autoSlideInterval);
    return () => clearInterval(timer);
  }, [isPaused, nextSlide, autoSlideInterval]);

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  // 页面可见性控制
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsPaused(true);
      } else {
        setIsPaused(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // 窗口焦点控制
  useEffect(() => {
    const handleBlur = () => setIsPaused(true);
    const handleFocus = () => setIsPaused(false);

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return {
    currentSlide,
    nextSlide,
    prevSlide,
    goToSlide,
    pauseAutoSlide,
    resumeAutoSlide
  };
};
