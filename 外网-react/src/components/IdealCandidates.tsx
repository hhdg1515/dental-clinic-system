import { useLanguage, type TranslationKey } from '../context/LanguageContext';

interface IdealCandidatesProps {
  titleKey: TranslationKey;
  introKey?: TranslationKey;
  candidateKeys: TranslationKey[];
  notSuitableKeys?: TranslationKey[];
}

export const IdealCandidates = ({
  titleKey,
  introKey,
  candidateKeys,
  notSuitableKeys
}: IdealCandidatesProps) => {
  const { t } = useLanguage();

  return (
    <div className="ideal-candidates-section">
      <div className="section-header">
        <h3 className="section-title-elegant">{t(titleKey)}</h3>
        {introKey && <p className="section-intro">{t(introKey)}</p>}
      </div>

      <div className="candidates-content">
        <div className="suitable-candidates">
          <h4 className="candidates-subtitle">{t('ideal-for-title' as TranslationKey)}</h4>
          <ul className="candidates-list">
            {candidateKeys.map((key) => (
              <li key={key} className="candidate-item suitable">
                {t(key)}
              </li>
            ))}
          </ul>
        </div>

        {notSuitableKeys && notSuitableKeys.length > 0 && (
          <div className="not-suitable-candidates">
            <h4 className="candidates-subtitle">{t('not-ideal-for-title' as TranslationKey)}</h4>
          <ul className="candidates-list">
            {notSuitableKeys.map((key) => (
              <li key={key} className="candidate-item not-suitable">
                {t(key)}
              </li>
            ))}
          </ul>
        </div>
        )}
      </div>
    </div>
  );
};
