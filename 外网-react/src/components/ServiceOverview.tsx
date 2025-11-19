import { useLanguage, type TranslationKey } from '../context/LanguageContext';

interface ServiceOverviewProps {
  titleKey: TranslationKey;
  paragraphs: TranslationKey[];
  highlightKey?: TranslationKey;
}

export const ServiceOverview = ({ titleKey, paragraphs, highlightKey }: ServiceOverviewProps) => {
  const { t } = useLanguage();

  return (
    <div className="service-overview">
      <h3 className="overview-title">{t(titleKey)}</h3>
      <div className="overview-content">
        {paragraphs.map((paragraphKey, index) => (
          <p key={paragraphKey} className={index === 0 ? 'lead-paragraph' : 'body-paragraph'}>
            {t(paragraphKey)}
          </p>
        ))}
      </div>
      {highlightKey && (
        <div className="overview-highlight">
          <p>{t(highlightKey)}</p>
        </div>
      )}
    </div>
  );
};
