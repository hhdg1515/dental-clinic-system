import { useState } from 'react';
import { useLanguage, type TranslationKey } from '../context/LanguageContext';

interface FAQItem {
  questionKey: TranslationKey;
  answerKey: TranslationKey;
}

interface ServiceFAQProps {
  titleKey: TranslationKey;
  subtitleKey?: TranslationKey;
  faqs: FAQItem[];
}

export const ServiceFAQ = ({ titleKey, subtitleKey, faqs }: ServiceFAQProps) => {
  const { t } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="service-faq-section">
      <div className="section-header">
        <h3 className="section-title-elegant">{t(titleKey)}</h3>
        {subtitleKey && <p className="section-subtitle">{t(subtitleKey)}</p>}
      </div>

      <div className="faq-container">
        {faqs.map((faq, index) => (
          <div
            key={faq.questionKey}
            className={`faq-item ${openIndex === index ? 'open' : ''}`}
          >
            <button
              className="faq-question"
              onClick={() => toggleFAQ(index)}
              aria-expanded={openIndex === index}
            >
              <span className="question-text">{t(faq.questionKey)}</span>
              <span className="toggle-icon">{openIndex === index ? '−' : '+'}</span>
            </button>
            {openIndex === index && (
              <div className="faq-answer">
                <p>{t(faq.answerKey)}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
