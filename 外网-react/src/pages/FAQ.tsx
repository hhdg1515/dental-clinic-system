import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { OptimizedImage } from '../components/OptimizedImage';
import { SEO } from '../components/SEO';
import { useLanguage } from '../context/LanguageContext';
import { useAmenitiesCarousel } from '../hooks/useAmenitiesCarousel';
import { useTipsCarousel } from '../hooks/useTipsCarousel';
import '../styles/faq.css';

// ============================================================
// ICONS
// ============================================================

const ChevronLeftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M12.5 5L7.5 10L12.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);


// ============================================================
// DECORATIVE ELEMENTS
// ============================================================

const FloatingDecorations = () => (
  <div className="faq-decorations" aria-hidden="true">
    {/* Left side - gold tones */}
    <div className="faq-dot faq-dot--gold faq-dot--animate" style={{ left: '4%', top: '15%', width: 14, height: 14, animationDelay: '0.2s' }} />
    <div className="faq-dot faq-dot--blur" style={{ left: '6%', top: '35%', width: 90, height: 90, animationDelay: '0.4s' }} />
    <div className="faq-dot faq-dot--sage" style={{ left: '3%', top: '55%', width: 18, height: 18, animationDelay: '0.6s' }} />
    <div className="faq-dot faq-dot--gold faq-dot--animate" style={{ left: '5%', top: '75%', width: 12, height: 12, animationDelay: '0.8s' }} />

    {/* Right side - sage accents */}
    <div className="faq-dot faq-dot--sage faq-dot--animate" style={{ right: '5%', top: '20%', width: 16, height: 16, animationDelay: '0.3s' }} />
    <div className="faq-dot faq-dot--blur" style={{ right: '4%', top: '50%', width: 70, height: 70, animationDelay: '0.5s' }} />
    <div className="faq-dot faq-dot--gold faq-dot--animate" style={{ right: '6%', top: '70%', width: 20, height: 20, animationDelay: '0.7s' }} />
    <div className="faq-dot faq-dot--sage" style={{ right: '3%', top: '85%', width: 10, height: 10, animationDelay: '0.9s' }} />
  </div>
);

// ============================================================
// DATA
// ============================================================

const thingsToBringData = {
  safety: [
    'safety-insurance',
    'safety-medical',
    'safety-allergies',
    'safety-emergency',
    'safety-history',
    'safety-referral'
  ],
  comfort: [
    'comfort-headphones',
    'comfort-blanket',
    'comfort-entertainment',
    'comfort-clothing',
    'comfort-snacks',
    'comfort-water',
    'comfort-sunglasses'
  ],
  convenience: [
    'convenience-payment',
    'convenience-forms',
    'convenience-questions',
    'convenience-transport',
    'convenience-childcare',
    'convenience-work'
  ]
};

const amenitiesData = [
  {
    id: 'parking',
    image: '/images/parking.jpg',
    titleKey: 'amenity-parking-title',
    items: ['amenity-parking-1', 'amenity-parking-2', 'amenity-parking-3']
  },
  {
    id: 'dining',
    image: '/images/dining2.jpg',
    titleKey: 'amenity-dining-title',
    items: ['amenity-dining-1', 'amenity-dining-2', 'amenity-dining-3']
  },
  {
    id: 'pharmacy',
    image: '/images/drug.jpg',
    titleKey: 'amenity-pharmacy-title',
    items: ['amenity-pharmacy-1', 'amenity-pharmacy-2', 'amenity-pharmacy-3']
  },
  {
    id: 'waiting',
    image: '/images/relax.jpg',
    titleKey: 'amenity-waiting-title',
    items: ['amenity-waiting-1', 'amenity-waiting-2', 'amenity-waiting-3']
  },
  {
    id: 'transport',
    image: '/images/bus.jpg',
    titleKey: 'amenity-transport-title',
    items: ['amenity-transport-1', 'amenity-transport-2', 'amenity-transport-3', 'amenity-transport-4']
  },
  {
    id: 'accessibility',
    image: '/images/wheelchair.jpg',
    titleKey: 'amenity-accessibility-title',
    items: ['amenity-accessibility-1', 'amenity-accessibility-2', 'amenity-accessibility-3', 'amenity-accessibility-4']
  }
];

const tipsData = [
  {
    id: 'appointment',
    image: '/images/Appointment.jpg',
    titleKey: 'tips-appointment-title',
    items: ['tips-appointment-1', 'tips-appointment-2', 'tips-appointment-3', 'tips-appointment-4']
  },
  {
    id: 'during',
    image: '/images/during.jpg',
    titleKey: 'tips-during-title',
    items: ['tips-during-1', 'tips-during-2', 'tips-during-3', 'tips-during-4']
  },
  {
    id: 'after',
    image: '/images/after.jpg',
    titleKey: 'tips-after-title',
    items: ['tips-after-1', 'tips-after-2', 'tips-after-3', 'tips-after-4']
  },
  {
    id: 'general',
    image: '/images/health.jpg',
    titleKey: 'tips-general-title',
    items: ['tips-general-1', 'tips-general-2', 'tips-general-3', 'tips-general-4']
  }
];

// ============================================================
// COMPONENT
// ============================================================

export const FAQ = () => {
  const { t } = useLanguage();

  const {
    currentSlide: amenitiesSlide,
    nextSlide: nextAmenity,
    prevSlide: prevAmenity,
    goToSlide: goToAmenity,
    pauseAutoSlide: pauseAmenities,
    resumeAutoSlide: resumeAmenities
  } = useAmenitiesCarousel(6, 5000);

  const {
    currentSlide: tipsSlide,
    nextSlide: nextTip,
    prevSlide: prevTip,
    goToSlide: goToTip,
    pauseAutoSlide: pauseTips,
    resumeAutoSlide: resumeTips
  } = useTipsCarousel(4, 6000);

  return (
    <>
      <SEO
        title="FAQ - Frequently Asked Questions | First Ave Dental"
        description="常见问题解答：了解牙科治疗、预约流程、保险覆盖、诊所设施等信息。提供专业牙科建议，解答您的疑问。"
        keywords="牙科FAQ, 牙科常见问题, 牙科预约, 牙科保险, 治疗费用, 洗牙问题"
        ogTitle="牙科常见问题 - First Ave Dental & Orthodontics"
        ogDescription="专业解答牙科相关问题，提供详细的治疗说明和建议"
      />

      <div className="faq-page">
        <FloatingDecorations />

        {/* Hero Section */}
        <section className="faq-hero">
          <div className="faq-hero__bg">
            <OptimizedImage
              src="/images/forest35.jpg"
              alt="FAQ Background"
              loading="eager"
            />
          </div>
          <div className="faq-hero__overlay" />

          <Navigation variant="plain" />

          <div className="faq-hero__content">
            <nav className="faq-hero__breadcrumb">
              <a href="/" aria-label="Go to home page">{t('nav-home')}</a>
              <span className="faq-hero__breadcrumb-separator">›</span>
              <span className="faq-hero__breadcrumb-current">{t('breadcrumb-faq')}</span>
            </nav>

            <h1 className="faq-hero__title">{t('faq-page-title')}</h1>
            <p className="faq-hero__desc">{t('faq-page-desc')}</p>

            <div className="faq-hero__divider">
              <span className="faq-hero__divider-line" />
              <span className="faq-hero__divider-diamond" />
              <span className="faq-hero__divider-line" />
            </div>
          </div>
        </section>

        {/* Main Content */}
        <main className="faq-content">
          {/* Things to Bring Section */}
          <div className="faq-section-header">
            <p className="faq-section-header__elegant">{t('things-to-bring-elegant')}</p>
            <h2 className="faq-section-header__bold">{t('for-your-visit')}</h2>
            <div className="faq-section-header__divider">
              <span className="faq-section-header__divider-line" />
              <span className="faq-section-header__divider-dot" />
              <span className="faq-section-header__divider-line" />
            </div>
          </div>

          <div className="faq-bring-card">
            <div className="faq-bring-card__grid">
              {/* Safety Column */}
              <div className="faq-bring-card__column">
                <div className="faq-bring-card__header">
                  <span className="faq-bring-card__dot faq-bring-card__dot--safety" />
                  <h3 className="faq-bring-card__title">{t('for-safety-title')}</h3>
                </div>
                <ul className="faq-bring-card__list">
                  {thingsToBringData.safety.map((itemKey) => (
                    <li key={itemKey} className="faq-bring-card__item">
                      {t(itemKey as any)}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Comfort Column */}
              <div className="faq-bring-card__column">
                <div className="faq-bring-card__header">
                  <span className="faq-bring-card__dot faq-bring-card__dot--comfort" />
                  <h3 className="faq-bring-card__title">{t('for-comfort-title')}</h3>
                </div>
                <ul className="faq-bring-card__list">
                  {thingsToBringData.comfort.map((itemKey) => (
                    <li key={itemKey} className="faq-bring-card__item">
                      {t(itemKey as any)}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Convenience Column */}
              <div className="faq-bring-card__column">
                <div className="faq-bring-card__header">
                  <span className="faq-bring-card__dot faq-bring-card__dot--convenience" />
                  <h3 className="faq-bring-card__title">{t('for-convenience-title')}</h3>
                </div>
                <ul className="faq-bring-card__list">
                  {thingsToBringData.convenience.map((itemKey) => (
                    <li key={itemKey} className="faq-bring-card__item">
                      {t(itemKey as any)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Amenities Section */}
          <div className="faq-section-header">
            <p className="faq-section-header__elegant">{t('things-to-know-title')}</p>
            <h2 className="faq-section-header__bold">{t('nearby-amenities')}</h2>
            <div className="faq-section-header__divider">
              <span className="faq-section-header__divider-line" />
              <span className="faq-section-header__divider-dot" />
              <span className="faq-section-header__divider-line" />
            </div>
          </div>

          <div
            className="faq-carousel"
            onMouseEnter={pauseAmenities}
            onMouseLeave={resumeAmenities}
          >
            <div className="faq-carousel__container">
              {amenitiesData.map((amenity, index) => (
                <div
                  key={amenity.id}
                  className={`faq-carousel__slide ${index === amenitiesSlide ? 'active' : ''}`}
                >
                  <div className="faq-carousel__image">
                    <OptimizedImage
                      src={amenity.image}
                      alt={t(amenity.titleKey as any)}
                      loading="lazy"
                    />
                  </div>
                  <div className="faq-carousel__content">
                    <span className="faq-carousel__badge">
                      Nearby
                    </span>
                    <h3 className="faq-carousel__title">{t(amenity.titleKey as any)}</h3>
                    <ul className="faq-carousel__list">
                      {amenity.items.map((itemKey) => (
                        <li key={itemKey} className="faq-carousel__list-item">
                          {t(itemKey as any)}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            <button
              className="faq-carousel__nav faq-carousel__nav--prev"
              onClick={prevAmenity}
              aria-label="Previous amenity"
            >
              <ChevronLeftIcon />
            </button>
            <button
              className="faq-carousel__nav faq-carousel__nav--next"
              onClick={nextAmenity}
              aria-label="Next amenity"
            >
              <ChevronRightIcon />
            </button>

            <div className="faq-carousel__indicators">
              {amenitiesData.map((_, index) => (
                <span
                  key={index}
                  className={`faq-carousel__indicator ${index === amenitiesSlide ? 'active' : ''}`}
                  onClick={() => goToAmenity(index)}
                />
              ))}
            </div>
          </div>

          {/* Tips Section */}
          <section className="faq-tips">
            <div className="faq-tips__container">
              <div className="faq-section-header">
                <p className="faq-section-header__elegant">Helpful Tips</p>
                <h2 className="faq-section-header__bold">{t('tips-comfort-guide')}</h2>
                <div className="faq-section-header__divider">
                  <span className="faq-section-header__divider-line" />
                  <span className="faq-section-header__divider-dot" />
                  <span className="faq-section-header__divider-line" />
                </div>
              </div>

              <div
                className="faq-tips-carousel"
                onMouseEnter={pauseTips}
                onMouseLeave={resumeTips}
              >
                <div className="faq-tips-carousel__container">
                  {tipsData.map((tip, index) => (
                    <div
                      key={tip.id}
                      className={`faq-tips-carousel__slide ${index === tipsSlide ? 'active' : ''}`}
                    >
                      <div className="faq-tips-carousel__image">
                        <OptimizedImage
                          src={tip.image}
                          alt={t(tip.titleKey as any)}
                          loading="lazy"
                        />
                      </div>
                      <div className="faq-tips-carousel__content">
                        <span className="faq-tips-carousel__number">0{index + 1}</span>
                        <h3 className="faq-tips-carousel__title">{t(tip.titleKey as any)}</h3>
                        <ul className="faq-tips-carousel__list">
                          {tip.items.map((itemKey) => (
                            <li key={itemKey} className="faq-tips-carousel__list-item">
                              {t(itemKey as any)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  className="faq-tips-carousel__nav faq-tips-carousel__nav--prev"
                  onClick={prevTip}
                  aria-label="Previous tip"
                >
                  <ChevronLeftIcon />
                </button>
                <button
                  className="faq-tips-carousel__nav faq-tips-carousel__nav--next"
                  onClick={nextTip}
                  aria-label="Next tip"
                >
                  <ChevronRightIcon />
                </button>

                <div className="faq-tips-carousel__indicators">
                  {tipsData.map((_, index) => (
                    <span
                      key={index}
                      className={`faq-tips-carousel__indicator ${index === tipsSlide ? 'active' : ''}`}
                      onClick={() => goToTip(index)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default FAQ;
