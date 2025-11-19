import { useEffect } from 'react';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { OptimizedImage } from '../components/OptimizedImage';
import { SEO } from '../components/SEO';
import { ServiceOverview } from '../components/ServiceOverview';
import { ProcessSteps } from '../components/ProcessSteps';
import { BenefitsGrid } from '../components/BenefitsGrid';
import { IdealCandidates } from '../components/IdealCandidates';
import { ServiceFAQ } from '../components/ServiceFAQ';
import { useLanguage } from '../context/LanguageContext';

export const ServicesDetail1 = () => {
  const { t } = useLanguage();

  // Scroll to anchor on page load if hash exists
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.substring(1);
      const VALID_ANCHORS = ['general-family', 'cosmetic', 'orthodontics', 'root-canals'];
      if (VALID_ANCHORS.includes(id)) {
        const element = document.getElementById(id);
        if (element) {
          setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }
      }
    }
  }, []);

  return (


    <>
      <SEO
        title="General & Family Dentistry | First Ave Dental"
        description="家庭牙科服务：定期检查、洗牙、补牙、拔牙等基础牙科护理。提供温和、专业的家庭式牙科服务，适合全家人。"
        keywords="家庭牙科, 综合牙科, 定期检查, 洗牙, 补牙, 预防性护理"
        ogTitle="家庭与综合牙科 - First Ave Dental"
        ogDescription="温和专业的家庭牙科服务，适合全家人的口腔健康"
      />
    <div className="flex min-h-screen flex-col">
      <div className="flex-1">
      {/* Hero Section */}
      <section className="hero-section">
        <Navigation />

        <div className="hero-content">
          <div className="breadcrumb-wrapper">
            <ul className="breadcrumbs">
              <li><a href="/" aria-label="Go to home page">{t('nav-home')}</a></li>
              <li>&gt; <a href="/service" aria-label="Go to services page">{t('nav-services')}</a></li>
              <li>{t('detail-breadcrumb')}</li>
            </ul>
          </div>

          <h1>{t('detail-1-title')}</h1>
          <p className="hero-description">{t('detail-1-desc')}</p>
        </div>
      </section>

      {/* Services Content Section */}
      <section className="content-section">
        <div className="content-container">

          {/* Service 1: General & Family */}
          <div id="general-family" className="service-detail-block">
            <div className="section-header">
              <h2 className="section-title-elegant">{t('general-service-title')}</h2>
              <h3 className="section-subtitle-bold">{t('general-service-subtitle')}</h3>
            </div>

            {/* Hero Image */}
            <div className="service-hero-image">
              <OptimizedImage
                className="service-image"
                src="/images/family.jpg"
                alt={t('general-card-title')}
                loading="lazy"
                aspectRatio="16/9"
              />
            </div>

            {/* Service Overview */}
            <ServiceOverview
              titleKey="general-overview-title"
              paragraphs={[
                'general-overview-p1',
                'general-overview-p2',
                'general-overview-p3'
              ]}
              highlightKey="general-overview-highlight"
            />

            {/* Process Steps */}
            <ProcessSteps
              titleKey="general-process-title"
              subtitleKey="general-process-subtitle"
              steps={[
                {
                  numberKey: 'general-process-step1-num',
                  titleKey: 'general-process-step1-title',
                  descriptionKey: 'general-process-step1-desc'
                },
                {
                  numberKey: 'general-process-step2-num',
                  titleKey: 'general-process-step2-title',
                  descriptionKey: 'general-process-step2-desc'
                },
                {
                  numberKey: 'general-process-step3-num',
                  titleKey: 'general-process-step3-title',
                  descriptionKey: 'general-process-step3-desc'
                },
                {
                  numberKey: 'general-process-step4-num',
                  titleKey: 'general-process-step4-title',
                  descriptionKey: 'general-process-step4-desc'
                }
              ]}
            />

            {/* Benefits */}
            <BenefitsGrid
              titleKey="general-benefits-title"
              subtitleKey="general-benefits-subtitle"
              benefits={[
                {
                  iconKey: 'general-benefit1-icon',
                  titleKey: 'general-benefit1-title',
                  descriptionKey: 'general-benefit1-desc'
                },
                {
                  iconKey: 'general-benefit2-icon',
                  titleKey: 'general-benefit2-title',
                  descriptionKey: 'general-benefit2-desc'
                },
                {
                  iconKey: 'general-benefit3-icon',
                  titleKey: 'general-benefit3-title',
                  descriptionKey: 'general-benefit3-desc'
                },
                {
                  iconKey: 'general-benefit4-icon',
                  titleKey: 'general-benefit4-title',
                  descriptionKey: 'general-benefit4-desc'
                },
                {
                  iconKey: 'general-benefit5-icon',
                  titleKey: 'general-benefit5-title',
                  descriptionKey: 'general-benefit5-desc'
                },
                {
                  iconKey: 'general-benefit6-icon',
                  titleKey: 'general-benefit6-title',
                  descriptionKey: 'general-benefit6-desc'
                }
              ]}
            />

            {/* Ideal Candidates */}
            <IdealCandidates
              titleKey="general-candidates-title"
              introKey="general-candidates-intro"
              candidateKeys={[
                'general-candidate1',
                'general-candidate2',
                'general-candidate3',
                'general-candidate4',
                'general-candidate5',
                'general-candidate6'
              ]}
            />

            {/* FAQ */}
            <ServiceFAQ
              titleKey="general-faq-title"
              subtitleKey="general-faq-subtitle"
              faqs={[
                {
                  questionKey: 'general-faq1-q',
                  answerKey: 'general-faq1-a'
                },
                {
                  questionKey: 'general-faq2-q',
                  answerKey: 'general-faq2-a'
                },
                {
                  questionKey: 'general-faq3-q',
                  answerKey: 'general-faq3-a'
                },
                {
                  questionKey: 'general-faq4-q',
                  answerKey: 'general-faq4-a'
                },
                {
                  questionKey: 'general-faq5-q',
                  answerKey: 'general-faq5-a'
                }
              ]}
            />

            {/* Pricing Section - Now at the end */}
            <div className="pricing-section">
              <h3 className="pricing-title">{t('pricing-title')}</h3>
              <div className="pricing-cards">
                <div className="pricing-card">
                  <h4 className="package-name">{t('general-package-1-name')}</h4>
                  <p className="package-price">$150 - $300</p>
                  <ul className="package-features">
                    <li>{t('general-package-1-item1')}</li>
                    <li>{t('general-package-1-item2')}</li>
                    <li>{t('general-package-1-item3')}</li>
                  </ul>
                </div>
                <div className="pricing-card featured">
                  <div className="featured-badge">{t('popular-badge')}</div>
                  <h4 className="package-name">{t('general-package-2-name')}</h4>
                  <p className="package-price">$500 - $800</p>
                  <ul className="package-features">
                    <li>{t('general-package-2-item1')}</li>
                    <li>{t('general-package-2-item2')}</li>
                    <li>{t('general-package-2-item3')}</li>
                  </ul>
                </div>
                <div className="pricing-card">
                  <h4 className="package-name">{t('general-package-3-name')}</h4>
                  <p className="package-price">$1,200</p>
                  <ul className="package-features">
                    <li>{t('general-package-3-item1')}</li>
                    <li>{t('general-package-3-item2')}</li>
                    <li>{t('general-package-3-item3')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Service 2: Cosmetic */}
          <div id="cosmetic" className="service-detail-block">
            <div className="section-header">
              <h2 className="section-title-elegant">{t('cosmetic-service-title')}</h2>
              <h3 className="section-subtitle-bold">{t('cosmetic-service-subtitle')}</h3>
            </div>

            <div className="service-carousel">
              <div className="carousel-content">
                <div className="carousel-item active">
                  <div className="image-section">
                    <OptimizedImage className="service-image" src="/images/cosmetic.jpg" alt={t('cosmetic-card-title')} loading="lazy" aspectRatio="16/9" />
                  </div>
                  <div className="text-section">
                    <h3 className="service-card-title">{t('cosmetic-card-title')}</h3>
                    <ul className="service-details">
                      <li>{t('cosmetic-detail-1')}</li>
                      <li>{t('cosmetic-detail-2')}</li>
                      <li>{t('cosmetic-detail-3')}</li>
                      <li>{t('cosmetic-detail-4')}</li>
                      <li>{t('cosmetic-detail-5')}</li>
                      <li>{t('cosmetic-detail-6')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="pricing-section">
              <h3 className="pricing-title">{t('pricing-title')}</h3>
              <div className="pricing-cards">
                <div className="pricing-card">
                  <h4 className="package-name">{t('cosmetic-package-1-name')}</h4>
                  <p className="package-price">$300 - $600</p>
                  <ul className="package-features">
                    <li>{t('cosmetic-package-1-item1')}</li>
                    <li>{t('cosmetic-package-1-item2')}</li>
                    <li>{t('cosmetic-package-1-item3')}</li>
                  </ul>
                </div>
                <div className="pricing-card featured">
                  <div className="featured-badge">{t('popular-badge')}</div>
                  <h4 className="package-name">{t('cosmetic-package-2-name')}</h4>
                  <p className="package-price">$800 - $1,500</p>
                  <p className="price-note">{t('per-tooth')}</p>
                  <ul className="package-features">
                    <li>{t('cosmetic-package-2-item1')}</li>
                    <li>{t('cosmetic-package-2-item2')}</li>
                    <li>{t('cosmetic-package-2-item3')}</li>
                    <li>{t('cosmetic-package-2-item4')}</li>
                  </ul>
                </div>
                <div className="pricing-card">
                  <h4 className="package-name">{t('cosmetic-package-3-name')}</h4>
                  <p className="package-price">$3,000+</p>
                  <ul className="package-features">
                    <li>{t('cosmetic-package-3-item1')}</li>
                    <li>{t('cosmetic-package-3-item2')}</li>
                    <li>{t('cosmetic-package-3-item3')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Service 3: Orthodontics */}
          <div id="orthodontics" className="service-detail-block">
            <div className="section-header">
              <h2 className="section-title-elegant">{t('orthodontics-service-title')}</h2>
              <h3 className="section-subtitle-bold">{t('orthodontics-service-subtitle')}</h3>
            </div>

            <div className="service-carousel">
              <div className="carousel-content">
                <div className="carousel-item active">
                  <div className="image-section">
                    <OptimizedImage className="service-image" src="/images/or.jpg" alt={t('orthodontics-card-title')} loading="lazy" aspectRatio="16/9" />
                  </div>
                  <div className="text-section">
                    <h3 className="service-card-title">{t('orthodontics-card-title')}</h3>
                    <ul className="service-details">
                      <li>{t('orthodontics-detail-1')}</li>
                      <li>{t('orthodontics-detail-2')}</li>
                      <li>{t('orthodontics-detail-3')}</li>
                      <li>{t('orthodontics-detail-4')}</li>
                      <li>{t('orthodontics-detail-5')}</li>
                      <li>{t('orthodontics-detail-6')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="pricing-section">
              <h3 className="pricing-title">{t('pricing-title')}</h3>
              <div className="pricing-cards">
                <div className="pricing-card">
                  <h4 className="package-name">{t('orthodontics-package-1-name')}</h4>
                  <p className="package-price">$3,500 - $5,500</p>
                  <ul className="package-features">
                    <li>{t('orthodontics-package-1-item1')}</li>
                    <li>{t('orthodontics-package-1-item2')}</li>
                    <li>{t('orthodontics-package-1-item3')}</li>
                  </ul>
                </div>
                <div className="pricing-card featured">
                  <div className="featured-badge">{t('popular-badge')}</div>
                  <h4 className="package-name">{t('orthodontics-package-2-name')}</h4>
                  <p className="package-price">$4,500 - $7,000</p>
                  <ul className="package-features">
                    <li>{t('orthodontics-package-2-item1')}</li>
                    <li>{t('orthodontics-package-2-item2')}</li>
                    <li>{t('orthodontics-package-2-item3')}</li>
                    <li>{t('orthodontics-package-2-item4')}</li>
                  </ul>
                </div>
                <div className="pricing-card">
                  <h4 className="package-name">{t('orthodontics-package-3-name')}</h4>
                  <p className="package-price">{t('flexible-payment')}</p>
                  <ul className="package-features">
                    <li>{t('orthodontics-package-3-item1')}</li>
                    <li>{t('orthodontics-package-3-item2')}</li>
                    <li>{t('orthodontics-package-3-item3')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Service 4: Root Canals */}
          <div id="root-canals" className="service-detail-block">
            <div className="section-header">
              <h2 className="section-title-elegant">{t('rootcanal-service-title')}</h2>
              <h3 className="section-subtitle-bold">{t('rootcanal-service-subtitle')}</h3>
            </div>

            <div className="service-carousel">
              <div className="carousel-content">
                <div className="carousel-item active">
                  <div className="image-section">
                    <OptimizedImage className="service-image" src="/images/ro.jpg" alt={t('rootcanal-card-title')} loading="lazy" aspectRatio="16/9" />
                  </div>
                  <div className="text-section">
                    <h3 className="service-card-title">{t('rootcanal-card-title')}</h3>
                    <ul className="service-details">
                      <li>{t('rootcanal-detail-1')}</li>
                      <li>{t('rootcanal-detail-2')}</li>
                      <li>{t('rootcanal-detail-3')}</li>
                      <li>{t('rootcanal-detail-4')}</li>
                      <li>{t('rootcanal-detail-5')}</li>
                      <li>{t('rootcanal-detail-6')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="pricing-section">
              <h3 className="pricing-title">{t('pricing-title')}</h3>
              <div className="pricing-cards">
                <div className="pricing-card">
                  <h4 className="package-name">{t('rootcanal-package-1-name')}</h4>
                  <p className="package-price">$600 - $900</p>
                  <ul className="package-features">
                    <li>{t('rootcanal-package-1-item1')}</li>
                    <li>{t('rootcanal-package-1-item2')}</li>
                    <li>{t('rootcanal-package-1-item3')}</li>
                  </ul>
                </div>
                <div className="pricing-card featured">
                  <div className="featured-badge">{t('popular-badge')}</div>
                  <h4 className="package-name">{t('rootcanal-package-2-name')}</h4>
                  <p className="package-price">$900 - $1,500</p>
                  <ul className="package-features">
                    <li>{t('rootcanal-package-2-item1')}</li>
                    <li>{t('rootcanal-package-2-item2')}</li>
                    <li>{t('rootcanal-package-2-item3')}</li>
                    <li>{t('rootcanal-package-2-item4')}</li>
                  </ul>
                </div>
                <div className="pricing-card">
                  <h4 className="package-name">{t('rootcanal-package-3-name')}</h4>
                  <p className="package-price">$1,500 - $2,500</p>
                  <ul className="package-features">
                    <li>{t('rootcanal-package-3-item1')}</li>
                    <li>{t('rootcanal-package-3-item2')}</li>
                    <li>{t('rootcanal-package-3-item3')}</li>
                  </ul>
                </div>
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
