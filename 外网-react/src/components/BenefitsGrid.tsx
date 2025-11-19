import { useLanguage, type TranslationKey } from '../context/LanguageContext';

interface Benefit {
  iconKey: TranslationKey;
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
}

interface BenefitsGridProps {
  titleKey: TranslationKey;
  subtitleKey?: TranslationKey;
  benefits: Benefit[];
}

export const BenefitsGrid = ({ titleKey, subtitleKey, benefits }: BenefitsGridProps) => {
  const { t } = useLanguage();

  return (
    <div className="benefits-section">
      <div className="section-header">
        <h3 className="section-title-elegant">{t(titleKey)}</h3>
        {subtitleKey && <p className="section-subtitle">{t(subtitleKey)}</p>}
      </div>

      <div className="benefits-grid">
        {benefits.map((benefit) => (
          <div key={benefit.titleKey} className="benefit-card">
            <div className="benefit-icon">
              <span className="icon-text">{t(benefit.iconKey)}</span>
            </div>
            <h4 className="benefit-title">{t(benefit.titleKey)}</h4>
            <p className="benefit-description">{t(benefit.descriptionKey)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
