import { useState, useCallback } from 'react';

// Clinic distance data type
interface DistanceItem {
  city: string;
  miles: string;
}

interface ClinicData {
  name: string;
  distances: DistanceItem[];
}

type ClinicKey = 'arcadia' | 'rowland' | 'irvine' | 'south-pasadena' | 'eastvale';

// Complete distance data for all 5 clinics (from original landingpage.js)
const clinicDistances: Record<ClinicKey, ClinicData> = {
  arcadia: {
    name: 'Arcadia',
    distances: [
      { city: 'Downtown LA', miles: '18 miles' },
      { city: 'Pasadena', miles: '8 miles' },
      { city: 'San Gabriel', miles: '5 miles' },
      { city: 'Glendale', miles: '15 miles' },
      { city: 'Burbank', miles: '20 miles' },
      { city: 'Santa Monica', miles: '35 miles' },
      { city: 'Torrance', miles: '40 miles' },
      { city: 'Huntington Beach', miles: '45 miles' }
    ]
  },
  rowland: {
    name: 'Rowland Heights',
    distances: [
      { city: 'Downtown LA', miles: '28 miles' },
      { city: 'San Gabriel', miles: '12 miles' },
      { city: 'Pasadena', miles: '18 miles' },
      { city: 'Glendale', miles: '25 miles' },
      { city: 'Burbank', miles: '30 miles' },
      { city: 'Santa Monica', miles: '45 miles' },
      { city: 'Torrance', miles: '42 miles' },
      { city: 'Huntington Beach', miles: '35 miles' }
    ]
  },
  irvine: {
    name: 'Irvine',
    distances: [
      { city: 'Huntington Beach', miles: '12 miles' },
      { city: 'Torrance', miles: '25 miles' },
      { city: 'Downtown LA', miles: '42 miles' },
      { city: 'Santa Monica', miles: '38 miles' },
      { city: 'Pasadena', miles: '48 miles' },
      { city: 'San Gabriel', miles: '45 miles' },
      { city: 'Glendale', miles: '50 miles' },
      { city: 'Burbank', miles: '52 miles' }
    ]
  },
  'south-pasadena': {
    name: 'South Pasadena',
    distances: [
      { city: 'Downtown LA', miles: '8 miles' },
      { city: 'Pasadena', miles: '3 miles' },
      { city: 'Glendale', miles: '8 miles' },
      { city: 'San Gabriel', miles: '10 miles' },
      { city: 'Burbank', miles: '12 miles' },
      { city: 'Santa Monica', miles: '25 miles' },
      { city: 'Torrance', miles: '30 miles' },
      { city: 'Huntington Beach', miles: '45 miles' }
    ]
  },
  eastvale: {
    name: 'Eastvale',
    distances: [
      { city: 'Downtown LA', miles: '35 miles' },
      { city: 'San Gabriel', miles: '25 miles' },
      { city: 'Pasadena', miles: '35 miles' },
      { city: 'Glendale', miles: '40 miles' },
      { city: 'Burbank', miles: '45 miles' },
      { city: 'Santa Monica', miles: '55 miles' },
      { city: 'Torrance', miles: '40 miles' },
      { city: 'Huntington Beach', miles: '30 miles' }
    ]
  }
};

const clinicKeys: ClinicKey[] = ['arcadia', 'rowland', 'irvine', 'south-pasadena', 'eastvale'];

export const useClinicMap = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = clinicKeys.length;

  // Get current clinic data
  const getCurrentClinicData = useCallback((): ClinicData => {
    const clinicKey = clinicKeys[currentSlide];
    return clinicDistances[clinicKey];
  }, [currentSlide]);

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

  return {
    currentSlide,
    totalSlides,
    currentClinicData: getCurrentClinicData(),
    prevSlide,
    nextSlide,
    goToSlide
  };
};
