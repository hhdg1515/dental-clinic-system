import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { SEO } from '../components/SEO';
import { OptimizedImage } from '../components/OptimizedImage';
import { useLanguage } from '../context/LanguageContext';
import '../styles/promotion-detail.css';

// ============================================================
// ICONS
// ============================================================

const ArrowLeftIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.5 4L5.5 10L2.5 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SparkleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10 1L11.5 7L18 8.5L11.5 10L10 17L8.5 10L2 8.5L8.5 7L10 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ============================================================
// DECORATIVE ELEMENTS
// ============================================================

const FloatingDecorations = () => (
  <div className="promo-decorations" aria-hidden="true">
    {/* Left side - warm gold tones */}
    <div className="promo-dot promo-dot--gold promo-dot--animate" style={{ left: '5%', top: '15%', width: 16, height: 16, animationDelay: '0.2s' }} />
    <div className="promo-dot promo-dot--blur" style={{ left: '8%', top: '35%', width: 80, height: 80, animationDelay: '0.4s' }} />
    <div className="promo-dot promo-dot--gold promo-dot--animate" style={{ left: '3%', top: '55%', width: 12, height: 12, animationDelay: '0.6s' }} />
    <div className="promo-dot promo-dot--sage" style={{ left: '6%', top: '75%', width: 20, height: 20, animationDelay: '0.8s' }} />

    {/* Right side - sage green accents */}
    <div className="promo-dot promo-dot--sage promo-dot--animate" style={{ right: '4%', top: '25%', width: 18, height: 18, animationDelay: '0.3s' }} />
    <div className="promo-dot promo-dot--blur" style={{ right: '6%', top: '50%', width: 60, height: 60, animationDelay: '0.5s' }} />
    <div className="promo-dot promo-dot--gold promo-dot--animate" style={{ right: '5%', top: '70%', width: 14, height: 14, animationDelay: '0.7s' }} />
    <div className="promo-dot promo-dot--sage" style={{ right: '8%', top: '85%', width: 10, height: 10, animationDelay: '0.9s' }} />
  </div>
);

// ============================================================
// COMPONENT
// ============================================================

export const PromotionDetail = () => {
  const { t } = useLanguage();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const heroImage = '/images/whitening-hero.jpg';

  return (
    <>
      <SEO
        title={t('promo-spring-whitening-title')}
        description={t('promo-spring-whitening-subtitle')}
        ogImage={heroImage}
      />

      <Navigation />

      <div className="promo-page">
        <FloatingDecorations />

        {/* Hero Section */}
        <section className="promo-hero">
          <div className="promo-hero__image">
            <OptimizedImage
              src={heroImage}
              alt={t('promo-spring-whitening-title')}
              loading="eager"
            />
          </div>
          <div className="promo-hero__overlay" />

          <Link to="/stories" className="promo-hero__back">
            <ArrowLeftIcon />
            {t('promo-back-to-stories')}
          </Link>

          <span className="promo-hero__tag">
            {t('promo-spring-whitening-tag')}
          </span>

          <div className="promo-hero__content">
            <h1 className="promo-hero__title">
              {t('promo-spring-whitening-title')}
            </h1>
            <p className="promo-hero__subtitle">
              {t('promo-spring-whitening-subtitle')}
            </p>
          </div>
        </section>

        {/* Article Content */}
        <article className="promo-article">

          {/* Introduction Section */}
          <section className="promo-section">
            <p className="promo-text">{t('promo-spring-intro-p1')}</p>
            <p className="promo-text">{t('promo-spring-intro-p2')}</p>
            <p className="promo-text">{t('promo-spring-intro-p3')}</p>
          </section>

          <div className="promo-divider" />

          {/* Treatment Options Section */}
          <section className="promo-section">
            <h2 className="promo-h2">{t('promo-treatment-options-title')}</h2>

            <div className="promo-treatments">
              {/* Treatment 1 */}
              <div className="promo-treatment-card">
                <span className="promo-treatment-card__number">01</span>
                <h3 className="promo-h3">{t('promo-treatment-1-title')}</h3>
                <p className="promo-text">{t('promo-treatment-1-desc')}</p>
                <p className="promo-text promo-text--small">{t('promo-treatment-1-detail')}</p>
              </div>

              {/* Treatment 2 */}
              <div className="promo-treatment-card">
                <span className="promo-treatment-card__number">02</span>
                <h3 className="promo-h3">{t('promo-treatment-2-title')}</h3>
                <p className="promo-text">{t('promo-treatment-2-desc')}</p>
                <p className="promo-text promo-text--small">{t('promo-treatment-2-detail')}</p>
              </div>

              {/* Treatment 3 */}
              <div className="promo-treatment-card">
                <span className="promo-treatment-card__number">03</span>
                <h3 className="promo-h3">{t('promo-treatment-3-title')}</h3>
                <p className="promo-text">{t('promo-treatment-3-desc')}</p>
                <p className="promo-text promo-text--small">{t('promo-treatment-3-detail')}</p>
              </div>
            </div>
          </section>

          {/* Why Choose Us Section */}
          <section className="promo-section">
            <h2 className="promo-h2">{t('promo-why-choose-title')}</h2>

            <div className="promo-checklist">
              {[1, 2, 3, 4].map((num) => (
                <div key={num} className="promo-checklist__item">
                  <div className="promo-checklist__icon">
                    <CheckIcon />
                  </div>
                  <p className="promo-text">
                    {t(`promo-why-point-${num}` as any)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Ideal Candidates Section */}
          <section className="promo-section">
            <h2 className="promo-h2">{t('promo-ideal-candidates-title')}</h2>
            <p className="promo-text" style={{ marginBottom: 24 }}>{t('promo-ideal-intro')}</p>

            <div className="promo-bullets">
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <div key={num} className="promo-bullets__item">
                  <span className="promo-bullets__dot" />
                  <p className="promo-text promo-text--small">
                    {t(`promo-candidate-${num}` as any)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Expected Results Section */}
          <section className="promo-section">
            <h2 className="promo-h2">{t('promo-results-title')}</h2>
            <p className="promo-text">{t('promo-results-p1')}</p>
            <p className="promo-text">{t('promo-results-p2')}</p>
            <p className="promo-text">{t('promo-results-p3')}</p>
          </section>

          {/* CTA Section */}
          <section className="promo-section">
            <div className="promo-cta">
              <div className="promo-cta__content">
                <h2 className="promo-cta__title">{t('promo-cta-title')}</h2>
                <p className="promo-cta__subtitle">{t('promo-cta-subtitle')}</p>

                <Link to="/" className="promo-cta__button">
                  <SparkleIcon />
                  {t('promo-cta-button')}
                </Link>

                <p className="promo-cta__phone">{t('promo-cta-phone')}</p>
                <p className="promo-cta__urgent">{t('promo-cta-urgent')}</p>
              </div>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="promo-section">
            <h2 className="promo-h2">{t('promo-faq-title')}</h2>

            <div className="promo-faq">
              {[1, 2, 3, 4, 5].map((num) => (
                <div key={num} className="promo-faq__item">
                  <h3 className="promo-faq__question">
                    {t(`promo-faq-q${num}` as any)}
                  </h3>
                  <p className="promo-faq__answer">
                    {t(`promo-faq-a${num}` as any)}
                  </p>
                </div>
              ))}
            </div>
          </section>

        </article>

        <Footer />
      </div>
    </>
  );
};

export default PromotionDetail;
