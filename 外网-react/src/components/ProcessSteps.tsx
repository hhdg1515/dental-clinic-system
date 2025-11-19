import { useLanguage, type TranslationKey } from '../context/LanguageContext';

interface ProcessStep {
  numberKey: TranslationKey;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  iconPath?: string;
}

interface ProcessStepsProps {
  titleKey: TranslationKey;
  subtitleKey?: TranslationKey;
  steps: ProcessStep[];
}

export const ProcessSteps = ({ titleKey, subtitleKey, steps }: ProcessStepsProps) => {
  const { t } = useLanguage();

  return (
    <div className="process-steps-section">
      <div className="section-header">
        <h3 className="section-title-elegant">{t(titleKey)}</h3>
        {subtitleKey && <p className="section-subtitle">{t(subtitleKey)}</p>}
      </div>

      <div className="steps-container">
        {steps.map((step) => (
          <div key={step.titleKey} className="step-card">
            <div className="step-number">{t(step.numberKey)}</div>
            <div className="step-content">
              <h4 className="step-title">{t(step.titleKey)}</h4>
              <p className="step-description">{t(step.descriptionKey)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
