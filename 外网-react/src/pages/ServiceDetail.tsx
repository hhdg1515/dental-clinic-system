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
      <div className="flex min-h-screen flex-col">
        <div className="flex-1">
          {/* Hero Section */}
          <section className="hero-section">
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

                {/* Process Steps Carousel */}
                <ProcessSteps
                  titleKey={service.processTitleKey}
                  subtitleKey={service.processSubtitleKey}
                  steps={service.processSteps}
                />

                {/* Ideal Candidates */}
                <IdealCandidates
                  titleKey={service.candidatesTitleKey}
                  introKey={service.candidatesIntroKey}
                  candidateKeys={service.candidatesKeys}
                />

                {/* FAQ */}
                <ServiceFAQ
                  titleKey={service.faqTitleKey}
                  subtitleKey={service.faqSubtitleKey}
                  faqs={service.faqKeys}
                />

                {/* Pricing Section */}
                <div className="pricing-section">
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
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </>
  );
};
