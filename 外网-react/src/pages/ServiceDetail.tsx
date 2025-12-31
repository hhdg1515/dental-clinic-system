import { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { SEO } from '../components/SEO';
import { ServiceOverview } from '../components/ServiceOverview';
import { ProcessSteps } from '../components/ProcessSteps';
import { IdealCandidates } from '../components/IdealCandidates';
import { ServiceFAQ } from '../components/ServiceFAQ';
import { useLanguage } from '../context/LanguageContext';
import { getServiceBySlug } from '../config/servicesConfig';

// ============================================================
// DECORATIVE COMPONENTS
// ============================================================

// Diamond Divider - uses CSS classes
const DiamondDivider = () => (
  <div className="sd-divider">
    <span className="sd-divider__line" />
    <span className="sd-divider__diamond" />
    <span className="sd-divider__line" />
  </div>
);

// Floating Decorations - consistent with other pages
const FloatingDecorations = () => (
  <div className="sd-decorations" aria-hidden="true">
    {/* Left side - gold tones */}
    <div className="sd-dot sd-dot--gold sd-dot--animate" style={{ left: '4%', top: '15%', width: 14, height: 14, animationDelay: '0.2s' }} />
    <div className="sd-dot sd-dot--blur" style={{ left: '6%', top: '35%', width: 90, height: 90, animationDelay: '0.4s' }} />
    <div className="sd-dot sd-dot--sage" style={{ left: '3%', top: '55%', width: 18, height: 18, animationDelay: '0.6s' }} />
    <div className="sd-dot sd-dot--gold sd-dot--animate" style={{ left: '5%', top: '75%', width: 12, height: 12, animationDelay: '0.8s' }} />

    {/* Right side - sage accents */}
    <div className="sd-dot sd-dot--sage sd-dot--animate" style={{ right: '5%', top: '20%', width: 16, height: 16, animationDelay: '0.3s' }} />
    <div className="sd-dot sd-dot--blur" style={{ right: '4%', top: '50%', width: 70, height: 70, animationDelay: '0.5s' }} />
    <div className="sd-dot sd-dot--gold sd-dot--animate" style={{ right: '6%', top: '70%', width: 20, height: 20, animationDelay: '0.7s' }} />
    <div className="sd-dot sd-dot--sage" style={{ right: '3%', top: '85%', width: 10, height: 10, animationDelay: '0.9s' }} />
  </div>
);

// Pricing Bubbles - decorative bubbles near pricing section
const PricingBubbles = () => (
  <div className="sd-pricing-bubbles" aria-hidden="true">
    <div className="sd-bubble sd-bubble--1" />
    <div className="sd-bubble sd-bubble--2" />
    <div className="sd-bubble sd-bubble--3" />
  </div>
);

// ============================================================
// MAIN COMPONENT
// ============================================================

export const ServiceDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useLanguage();

  // Get service configuration
  const service = slug ? getServiceBySlug(slug) : undefined;

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  // If service not found, redirect to services page
  if (!service) {
    return <Navigate to="/service" replace />;
  }

  return (
    <>
      <SEO
        title={service.seoTitle}
        description={service.seoDescription}
        keywords={service.seoKeywords}
        ogTitle={service.seoTitle}
        ogDescription={service.seoDescription}
      />

      <div className="service-detail-page">
        <FloatingDecorations />

        {/* Hero Section */}
        <section
          className="hero-section"
          style={
            service.heroImage
              ? {
                  backgroundImage: `url(${service.heroImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundAttachment: 'fixed'
                }
              : undefined
          }
        >
          <Navigation />

          <div className="hero-content">
            <div className="breadcrumb-wrapper">
              <ul className="breadcrumbs">
                <li>
                  <a href="/" aria-label="Go to home page">
                    {t('nav-home')}
                  </a>
                </li>
                <li>
                  &gt;{' '}
                  <a href="/service" aria-label="Go to services page">
                    {t('nav-services')}
                  </a>
                </li>
                <li>{t(service.titleKey)}</li>
              </ul>
            </div>

            <h1>{t(service.titleKey)}</h1>
            <p className="hero-description">{t(service.subtitleKey)}</p>
          </div>
        </section>

        {/* Services Content Section */}
        <section className="content-section">
          <div className="content-container">
            <div className="service-detail-block">
              <div className="section-header">
                <h2 className="section-title-elegant">{t(service.titleKey)}</h2>
                <h3 className="section-subtitle-bold">{t(service.subtitleKey)}</h3>
              </div>

              {/* Service Overview with Image on Left */}
              <ServiceOverview
                titleKey={service.overviewTitleKey}
                paragraphs={service.overviewParagraphs}
                highlightKey={service.overviewHighlightKey}
                imageSrc={service.overviewImage}
                imageAlt={t(service.overviewImageAltKey)}
              />

              <DiamondDivider />

              {/* Process Steps Carousel */}
              <ProcessSteps
                titleKey={service.processTitleKey}
                subtitleKey={service.processSubtitleKey}
                steps={service.processSteps}
              />

              <DiamondDivider />

              {/* Ideal Candidates */}
              <IdealCandidates
                titleKey={service.candidatesTitleKey}
                introKey={service.candidatesIntroKey}
                candidateKeys={service.candidatesKeys}
              />

              <DiamondDivider />

              {/* FAQ */}
              <ServiceFAQ
                titleKey={service.faqTitleKey}
                subtitleKey={service.faqSubtitleKey}
                faqs={service.faqKeys}
              />

              <DiamondDivider />

              {/* Pricing Section */}
              <div className="pricing-section">
                <PricingBubbles />
                <h3 className="pricing-title">{t(service.pricingTitleKey)}</h3>

                <div className="pricing-cards">
                  {service.pricingPackages.map((pkg, index) => (
                    <div
                      key={index}
                      className={`pricing-card ${pkg.featured ? 'featured' : ''}`}
                    >
                      {pkg.featured && (
                        <div className="featured-badge">{t('popular-badge')}</div>
                      )}
                      <h4 className="package-name">{t(pkg.nameKey)}</h4>
                      <p className="package-price">
                        {pkg.price === 'flexible-payment' ? t('flexible-payment') : pkg.price}
                      </p>
                      {pkg.priceNoteKey && (
                        <p className="price-note">{t(pkg.priceNoteKey)}</p>
                      )}
                      <ul className="package-features">
                        {pkg.featuresKeys.map((featureKey) => (
                          <li key={featureKey}>{t(featureKey)}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <Footer />
      </div>
    </>
  );
};
