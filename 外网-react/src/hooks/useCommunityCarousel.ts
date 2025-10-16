import { useState, useCallback, useEffect } from 'react';

export const useCommunityCarousel = (totalSlides: number = 3, autoSlideInterval: number = 5000) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoSliding, setIsAutoSliding] = useState(true);

  // Navigate to previous slide
  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  }, [totalSlides]);

  // Navigate to next slide
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === totalSlides - 1 ? 0 : prev + 1));
  }, [totalSlides]);

  // Go to specific slide
  const goToSlide = useCallback((index: number) => {
    if (index >= 0 && index < totalSlides) {
      setCurrentSlide(index);
    }
  }, [totalSlides]);

  // Pause auto-sliding (on hover)
  const pauseAutoSlide = useCallback(() => {
    setIsAutoSliding(false);
  }, []);

  // Resume auto-sliding (on mouse leave)
  const resumeAutoSlide = useCallback(() => {
    setIsAutoSliding(true);
  }, []);

  // Auto-slide effect
  useEffect(() => {
    if (!isAutoSliding) return;

    const timer = setInterval(() => {
      nextSlide();
    }, autoSlideInterval);

    return () => clearInterval(timer);
  }, [isAutoSliding, nextSlide, autoSlideInterval]);

  return {
    currentSlide,
    totalSlides,
    prevSlide,
    nextSlide,
    goToSlide,
    pauseAutoSlide,
    resumeAutoSlide
  };
};
