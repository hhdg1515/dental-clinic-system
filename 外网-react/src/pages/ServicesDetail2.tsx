import { useEffect } from 'react';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { OptimizedImage } from '../components/OptimizedImage';
import { SEO } from '../components/SEO';
import { useLanguage } from '../context/LanguageContext';

export const ServicesDetail2 = () => {
  const { t } = useLanguage();

  // Scroll to anchor on page load if hash exists
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.substring(1);
      const VALID_ANCHORS = ['detail-page-2', 'periodontics', 'restorations', 'preventive', 'oral-surgery'];
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
        title="Cosmetic Dentistry & Orthodontics | First Ave Dental"
        description="美容牙科与正畸服务：牙齿美白、贴面、隐形矫正、传统矫正等。专业美容牙医，打造完美笑容。"
        keywords="美容牙科, 牙齿美白, 牙齿贴面, 隐形矫正, 牙齿矫正, 正畸"
        ogTitle="美容牙科与正畸服务 - First Ave Dental"
        ogDescription="专业美容牙科和正畸服务，打造完美笑容"
      />
      <div id="detail-page-2" className="flex min-h-screen flex-col">
        <div className="flex-1">
        {/* Hero Section */}
      <section className="hero-section">
        <Navigation />

        <div className="hero-content">
          <div className="breadcrumb-wrapper">
            <ul className="breadcrumbs">
              <li><a href="/" aria-label="Go to home page">{t('nav-home')}</a></li>
              <li>&gt; <a href="/service" aria-label="Go to services page">{t('nav-services')}</a></li>
              <li>{t('detail-breadcrumb-2')}</li>
            </ul>
          </div>

          <h1>{t('detail-2-title')}</h1>
          <p className="hero-description">{t('detail-2-desc')}</p>
        </div>
      </section>

      {/* Services Content Section */}
      <section className="content-section">
        <div className="content-container">

          {/* Service 5: Periodontics */}
          <div id="periodontics" className="service-detail-block">
            <div className="section-header">
              <h2 className="section-title-elegant">{t('periodontics-service-title')}</h2>
              <h3 className="section-subtitle-bold">{t('periodontics-service-subtitle')}</h3>
            </div>

            <div className="service-carousel">
              <div className="carousel-content">
                <div className="carousel-item active">
                  <div className="image-section">
                    <OptimizedImage className="service-image" src="/images/pe.jpg" alt={t('periodontics-card-title')} loading="lazy" aspectRatio="16/9" />
                  </div>
                  <div className="text-section">
                    <h3 className="service-card-title">{t('periodontics-card-title')}</h3>
                    <ul className="service-details">
                      <li>{t('periodontics-detail-1')}</li>
                      <li>{t('periodontics-detail-2')}</li>
                      <li>{t('periodontics-detail-3')}</li>
                      <li>{t('periodontics-detail-4')}</li>
                      <li>{t('periodontics-detail-5')}</li>
                      <li>{t('periodontics-detail-6')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="pricing-section">
              <h3 className="pricing-title">{t('pricing-title')}</h3>
              <div className="pricing-cards">
                <div className="pricing-card">
                  <h4 className="package-name">{t('periodontics-package-1-name')}</h4>
                  <p className="package-price">$200 - $400</p>
                  <p className="price-note">{t('per-quadrant')}</p>
                  <ul className="package-features">
                    <li>{t('periodontics-package-1-item1')}</li>
                    <li>{t('periodontics-package-1-item2')}</li>
                    <li>{t('periodontics-package-1-item3')}</li>
                  </ul>
                </div>
                <div className="pricing-card featured">
                  <div className="featured-badge">{t('popular-badge')}</div>
                  <h4 className="package-name">{t('periodontics-package-2-name')}</h4>
                  <p className="package-price">$800 - $1,400</p>
                  <ul className="package-features">
                    <li>{t('periodontics-package-2-item1')}</li>
                    <li>{t('periodontics-package-2-item2')}</li>
                    <li>{t('periodontics-package-2-item3')}</li>
                  </ul>
                </div>
                <div className="pricing-card">
                  <h4 className="package-name">{t('periodontics-package-3-name')}</h4>
                  <p className="package-price">$100 - $200</p>
                  <p className="price-note">{t('per-visit')}</p>
                  <ul className="package-features">
                    <li>{t('periodontics-package-3-item1')}</li>
                    <li>{t('periodontics-package-3-item2')}</li>
                    <li>{t('periodontics-package-3-item3')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Service 6: Restorations */}
          <div id="restorations" className="service-detail-block">
            <div className="section-header">
              <h2 className="section-title-elegant">{t('restorations-service-title')}</h2>
              <h3 className="section-subtitle-bold">{t('restorations-service-subtitle')}</h3>
            </div>

            <div className="service-carousel">
              <div className="carousel-content">
                <div className="carousel-item active">
                  <div className="image-section">
                    <OptimizedImage className="service-image" src="/images/res.jpg" alt={t('restorations-card-title')} loading="lazy" aspectRatio="16/9" />
                  </div>
                  <div className="text-section">
                    <h3 className="service-card-title">{t('restorations-card-title')}</h3>
                    <ul className="service-details">
                      <li>{t('restorations-detail-1')}</li>
                      <li>{t('restorations-detail-2')}</li>
                      <li>{t('restorations-detail-3')}</li>
                      <li>{t('restorations-detail-4')}</li>
                      <li>{t('restorations-detail-5')}</li>
                      <li>{t('restorations-detail-6')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="pricing-section">
              <h3 className="pricing-title">{t('pricing-title')}</h3>
              <div className="pricing-cards">
                <div className="pricing-card">
                  <h4 className="package-name">{t('restorations-package-1-name')}</h4>
                  <p className="package-price">$800 - $1,500</p>
                  <ul className="package-features">
                    <li>{t('restorations-package-1-item1')}</li>
                    <li>{t('restorations-package-1-item2')}</li>
                    <li>{t('restorations-package-1-item3')}</li>
                  </ul>
                </div>
                <div className="pricing-card featured">
                  <div className="featured-badge">{t('popular-badge')}</div>
                  <h4 className="package-name">{t('restorations-package-2-name')}</h4>
                  <p className="package-price">$2,400 - $4,500</p>
                  <ul className="package-features">
                    <li>{t('restorations-package-2-item1')}</li>
                    <li>{t('restorations-package-2-item2')}</li>
                    <li>{t('restorations-package-2-item3')}</li>
                    <li>{t('restorations-package-2-item4')}</li>
                  </ul>
                </div>
                <div className="pricing-card">
                  <h4 className="package-name">{t('restorations-package-3-name')}</h4>
                  <p className="package-price">$1,500 - $3,500</p>
                  <ul className="package-features">
                    <li>{t('restorations-package-3-item1')}</li>
                    <li>{t('restorations-package-3-item2')}</li>
                    <li>{t('restorations-package-3-item3')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Service 7: Preventive Care */}
          <div id="preventive" className="service-detail-block">
            <div className="section-header">
              <h2 className="section-title-elegant">{t('preventive-service-title')}</h2>
              <h3 className="section-subtitle-bold">{t('preventive-service-subtitle')}</h3>
            </div>

            <div className="service-carousel">
              <div className="carousel-content">
                <div className="carousel-item active">
                  <div className="image-section">
                    <OptimizedImage className="service-image" src="/images/preventive.png" alt={t('preventive-card-title')} loading="lazy" aspectRatio="16/9" />
                  </div>
                  <div className="text-section">
                    <h3 className="service-card-title">{t('preventive-card-title')}</h3>
                    <ul className="service-details">
                      <li>{t('preventive-detail-1')}</li>
                      <li>{t('preventive-detail-2')}</li>
                      <li>{t('preventive-detail-3')}</li>
                      <li>{t('preventive-detail-4')}</li>
                      <li>{t('preventive-detail-5')}</li>
                      <li>{t('preventive-detail-6')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="pricing-section">
              <h3 className="pricing-title">{t('pricing-title')}</h3>
              <div className="pricing-cards">
                <div className="pricing-card">
                  <h4 className="package-name">{t('preventive-package-1-name')}</h4>
                  <p className="package-price">$100 - $180</p>
                  <ul className="package-features">
                    <li>{t('preventive-package-1-item1')}</li>
                    <li>{t('preventive-package-1-item2')}</li>
                    <li>{t('preventive-package-1-item3')}</li>
                  </ul>
                </div>
                <div className="pricing-card featured">
                  <div className="featured-badge">{t('popular-badge')}</div>
                  <h4 className="package-name">{t('preventive-package-2-name')}</h4>
                  <p className="package-price">$80 - $150</p>
                  <ul className="package-features">
                    <li>{t('preventive-package-2-item1')}</li>
                    <li>{t('preventive-package-2-item2')}</li>
                    <li>{t('preventive-package-2-item3')}</li>
                    <li>{t('preventive-package-2-item4')}</li>
                  </ul>
                </div>
                <div className="pricing-card">
                  <h4 className="package-name">{t('preventive-package-3-name')}</h4>
                  <p className="package-price">$299</p>
                  <ul className="package-features">
                    <li>{t('preventive-package-3-item1')}</li>
                    <li>{t('preventive-package-3-item2')}</li>
                    <li>{t('preventive-package-3-item3')}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Service 8: Oral Surgery */}
          <div id="oral-surgery" className="service-detail-block">
            <div className="section-header">
              <h2 className="section-title-elegant">{t('oral-surgery-service-title')}</h2>
              <h3 className="section-subtitle-bold">{t('oral-surgery-service-subtitle')}</h3>
            </div>

            <div className="service-carousel">
              <div className="carousel-content">
                <div className="carousel-item active">
                  <div className="image-section">
                    <OptimizedImage className="service-image" src="/images/oral.jpg" alt={t('oral-surgery-card-title')} loading="lazy" aspectRatio="16/9" />
                  </div>
                  <div className="text-section">
                    <h3 className="service-card-title">{t('oral-surgery-card-title')}</h3>
                    <ul className="service-details">
                      <li>{t('oral-surgery-detail-1')}</li>
                      <li>{t('oral-surgery-detail-2')}</li>
                      <li>{t('oral-surgery-detail-3')}</li>
                      <li>{t('oral-surgery-detail-4')}</li>
                      <li>{t('oral-surgery-detail-5')}</li>
                      <li>{t('oral-surgery-detail-6')}</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="pricing-section">
              <h3 className="pricing-title">{t('pricing-title')}</h3>
              <div className="pricing-cards">
                <div className="pricing-card">
                  <h4 className="package-name">{t('oral-surgery-package-1-name')}</h4>
                  <p className="package-price">$150 - $300</p>
                  <ul className="package-features">
                    <li>{t('oral-surgery-package-1-item1')}</li>
                    <li>{t('oral-surgery-package-1-item2')}</li>
                    <li>{t('oral-surgery-package-1-item3')}</li>
                  </ul>
                </div>
                <div className="pricing-card featured">
                  <div className="featured-badge">{t('popular-badge')}</div>
                  <h4 className="package-name">{t('oral-surgery-package-2-name')}</h4>
                  <p className="package-price">$250 - $600</p>
                  <p className="price-note">{t('per-tooth')}</p>
                  <ul className="package-features">
                    <li>{t('oral-surgery-package-2-item1')}</li>
                    <li>{t('oral-surgery-package-2-item2')}</li>
                    <li>{t('oral-surgery-package-2-item3')}</li>
                    <li>{t('oral-surgery-package-2-item4')}</li>
                  </ul>
                </div>
                <div className="pricing-card">
                  <h4 className="package-name">{t('oral-surgery-package-3-name')}</h4>
                  <p className="package-price">$2,500 - $4,500</p>
                  <ul className="package-features">
                    <li>{t('oral-surgery-package-3-item1')}</li>
                    <li>{t('oral-surgery-package-3-item2')}</li>
                    <li>{t('oral-surgery-package-3-item3')}</li>
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
