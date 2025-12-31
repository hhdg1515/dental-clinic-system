import { useState, useEffect } from 'react';
import { useLanguage, type TranslationKey } from '../context/LanguageContext';

interface ProcessStep {
  numberKey: TranslationKey;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  imageUrl?: string;
}

interface ProcessStepsProps {
  titleKey: TranslationKey;
  subtitleKey?: TranslationKey;
  steps: ProcessStep[];
}

export const ProcessSteps = ({ titleKey, subtitleKey, steps }: ProcessStepsProps) => {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);

  // Auto-advance carousel every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [steps.length]);

  const goToStep = (index: number) => {
    setCurrentStep(index);
  };

  return (
    <div className="process-steps-carousel" style={{ position: 'relative' }}>
      <div className="section-header">
        <h3 className="section-title-elegant">{t(titleKey)}</h3>
        {subtitleKey && <p className="section-subtitle">{t(subtitleKey)}</p>}
      </div>

      <div className="carousel-wrapper" style={{ position: 'relative' }}>
        {/* Gold bubble decorations - bottom right corner */}
        <div style={{ position: 'absolute', bottom: '20px', right: '30px', width: '45px', height: '45px', borderRadius: '50%', backgroundColor: 'rgba(212, 165, 116, 0.25)', zIndex: 1, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '45px', right: '55px', width: '25px', height: '25px', borderRadius: '50%', backgroundColor: 'rgba(212, 165, 116, 0.2)', zIndex: 1, pointerEvents: 'none' }} />

        {/* Carousel Container with Image Background */}
        <div className="carousel-container">
          {steps.map((step, index) => (
            <div
              key={step.titleKey}
              className={`carousel-slide ${index === currentStep ? 'active' : ''}`}
              style={{
                backgroundImage: step.imageUrl ? `url(${step.imageUrl})` : undefined,
              }}
            >
              {/* Dark overlay for better text readability */}
              <div className="carousel-overlay"></div>

              {/* Text content - Left side */}
              <div className="carousel-text-content">
                <h4 className="step-title">{t(step.titleKey)}</h4>
                <p className="step-description">{t(step.descriptionKey)}</p>
              </div>

              {/* Step number - Right bottom corner */}
              <div className="step-number-badge">{t(step.numberKey)}</div>
            </div>
          ))}
        </div>

        {/* Navigation Dots */}
        <div className="carousel-dots">
          {steps.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentStep ? 'active' : ''}`}
              onClick={() => goToStep(index)}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
