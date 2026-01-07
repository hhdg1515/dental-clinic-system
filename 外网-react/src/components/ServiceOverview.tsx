import { useLanguage, type TranslationKey } from '../context/LanguageContext';
import { OptimizedImage } from './OptimizedImage';

interface ServiceOverviewProps {
  titleKey: TranslationKey;
  paragraphs: TranslationKey[];
  highlightKey?: TranslationKey;
  imageSrc?: string;
  imageAlt?: string;
}

export const ServiceOverview = ({ titleKey, paragraphs, highlightKey, imageSrc, imageAlt }: ServiceOverviewProps) => {
  const { t } = useLanguage();

  return (
    <div className="service-overview-split">
      {/* Left side - Image */}
      {imageSrc && (
        <div className="overview-image-container">
          <OptimizedImage src={imageSrc} alt={imageAlt || t(titleKey)} className="overview-image" loading="lazy" />
        </div>
      )}

      {/* Right side - Text content */}
      <div className="overview-text-container">
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
    </div>
  );
};
