import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { OptimizedImage } from '../components/OptimizedImage';
import { useLanguage } from '../context/LanguageContext';
import { useAmenitiesCarousel } from '../hooks/useAmenitiesCarousel';
import { useTipsCarousel } from '../hooks/useTipsCarousel';

export const FAQ = () => {
  const { t } = useLanguage();

  // Amenities carousel state
  const {
    currentSlide: amenitiesSlide,
    nextSlide: nextAmenity,
    prevSlide: prevAmenity,
    goToSlide: goToAmenity,
    pauseAutoSlide: pauseAmenities,
    resumeAutoSlide: resumeAmenities
  } = useAmenitiesCarousel(6, 5000);

  // Tips carousel state
  const {
    currentSlide: tipsSlide,
    nextSlide: nextTip,
    prevSlide: prevTip,
    goToSlide: goToTip,
    pauseAutoSlide: pauseTips,
    resumeAutoSlide: resumeTips
  } = useTipsCarousel(4, 6000);

  // Things to Bring 数据
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

  // Amenities 轮播数据
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

  // Tips 轮播数据
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

  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex-1">
      {/* Hero Section - 使用OptimizedImage替代CSS background */}
      <section className="hero-section" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Background Image using OptimizedImage */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0
        }}>
          <OptimizedImage
            src="/images/forest35.jpg"
            alt="FAQ Background"
            loading="eager"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center'
            }}
          />
        </div>

        {/* Content overlay */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Navigation variant="plain" />

          <div className="hero-content">
            <div className="breadcrumb-wrapper">
              <ul className="breadcrumbs">
                <li><a href="/">{t('nav-home')}</a></li>
                <li>{t('breadcrumb-faq')}</li>
              </ul>
            </div>

            <h1>{t('faq-page-title')}</h1>
            <p className="hero-description">{t('faq-page-desc')}</p>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="content-section">
        <div className="content-container">
          {/* Things to Bring Section */}
          <div className="section-header">
            <h2 className="section-title-elegant">{t('things-to-bring-elegant')}</h2>
            <h3 className="section-subtitle-bold">{t('for-your-visit')}</h3>
          </div>

          {/* 装饰图片元素 */}
          <div className="maples"></div>
          <div className="maple2"></div>
          <div className="pinecone"></div>

          {/* Things to Bring Card - 使用内联样式避免CSS冲突 */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: '15px',
            boxShadow: '0 15px 40px rgba(0, 0, 0, 0.1)',
            padding: '50px',
            margin: '0 auto 80px',
            maxWidth: '100%',
            position: 'relative',
            border: '1px solid #D4A574'
          }}>
            {/* 三列布局 */}
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              gap: '40px',
              position: 'relative',
              zIndex: 2
            }}>
              {/* FOR SAFETY 部分 */}
              <div style={{ flex: 1, textAlign: 'center' }}>
                <h4 style={{
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  color: '#263C38',
                  margin: '0 0 20px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  {t('for-safety-title')}
                </h4>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  alignItems: 'center'
                }}>
                  {thingsToBringData.safety.map((itemKey) => (
                    <li key={itemKey} style={{
                      padding: '5px 0',
                      fontSize: '1rem',
                      color: '#333',
                      lineHeight: '1.5'
                    }}>
                      {t(itemKey as any)}
                    </li>
                  ))}
                </ul>
              </div>

              {/* FOR COMFORT 部分 */}
              <div style={{ flex: 1, textAlign: 'center' }}>
                <h4 style={{
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  color: '#263C38',
                  margin: '0 0 20px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  {t('for-comfort-title')}
                </h4>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  alignItems: 'center'
                }}>
                  {thingsToBringData.comfort.map((itemKey) => (
                    <li key={itemKey} style={{
                      padding: '5px 0',
                      fontSize: '1rem',
                      color: '#333',
                      lineHeight: '1.5'
                    }}>
                      {t(itemKey as any)}
                    </li>
                  ))}
                </ul>
              </div>

              {/* FOR CONVENIENCE 部分 */}
              <div style={{ flex: 1, textAlign: 'center' }}>
                <h4 style={{
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  color: '#263C38',
                  margin: '0 0 20px 0',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  {t('for-convenience-title')}
                </h4>
                <ul style={{
                  listStyle: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  alignItems: 'center'
                }}>
                  {thingsToBringData.convenience.map((itemKey) => (
                    <li key={itemKey} style={{
                      padding: '5px 0',
                      fontSize: '1rem',
                      color: '#333',
                      lineHeight: '1.5'
                    }}>
                      {t(itemKey as any)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Other Sections */}
          <div className="other-sections">
            {/* Things to Know Section */}
            <div className="section-header">
              <h2 className="section-title-elegant">{t('things-to-know-title')}</h2>
              <h3 className="section-subtitle-bold">{t('nearby-amenities')}</h3>
            </div>
            <div className="maple6"></div>
            <div className="maple3"></div>

            {/* Amenities Carousel */}
            <div
              className="amenities-carousel"
              onMouseEnter={pauseAmenities}
              onMouseLeave={resumeAmenities}
            >
              <div className="carousel-content">
                {amenitiesData.map((amenity, index) => (
                  <div
                    key={amenity.id}
                    className={`carousel-item ${index === amenitiesSlide ? 'active' : ''}`}
                  >
                    <div className="image-section">
                      <OptimizedImage
                        className="left-image"
                        src={amenity.image}
                        alt={t(amenity.titleKey as any)}
                        loading="lazy"
                      />
                    </div>
                    <div className="text-section">
                      <h3 className="amenity-title">{t(amenity.titleKey as any)}</h3>
                      <ul className="amenity-details">
                        {amenity.items.map((itemKey) => (
                          <li key={itemKey}>{t(itemKey as any)}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>

              {/* 导航按钮 */}
              <button
                className="carousel-nav prev"
                onClick={prevAmenity}
                aria-label="Previous nearby amenity"
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <button
                className="carousel-nav next"
                onClick={nextAmenity}
                aria-label="Next nearby amenity"
              >
                <i className="fas fa-chevron-right"></i>
              </button>

              {/* 指示器 */}
              <div className="carousel-indicators">
                {amenitiesData.map((_, index) => (
                  <span
                    key={index}
                    className={`indicator ${index === amenitiesSlide ? 'active' : ''}`}
                    onClick={() => goToAmenity(index)}
                  />
                ))}
              </div>
            </div>

            {/* Tips for Smooth Visits Section */}
            <section className="tips-section">
              <div className="tips-container">
                {/* 章节标题 */}
                <div className="tips-header">
                  <h3 className="tips-subtitle-bold">{t('tips-comfort-guide')}</h3>
                </div>
                <div className="maple4"></div>
                <div className="maple5"></div>

                {/* Tips Carousel */}
                <div
                  className="tips-carousel"
                  onMouseEnter={pauseTips}
                  onMouseLeave={resumeTips}
                >
                  <div className="tips-carousel-content">
                    {tipsData.map((tip, index) => (
                      <div
                        key={tip.id}
                        className={`tips-carousel-item ${index === tipsSlide ? 'active' : ''}`}
                      >
                        <OptimizedImage
                          className="tips-image-section"
                          src={tip.image}
                          alt={t(tip.titleKey as any)}
                          loading="lazy"
                        />

                        <div className="tips-text-section">
                          <h3 className="tips-card-title">{t(tip.titleKey as any)}</h3>
                          <ul className="tips-card-list">
                            {tip.items.map((itemKey) => (
                              <li key={itemKey}>{t(itemKey as any)}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* 导航箭头 */}
                  <button
                    className="tips-carousel-nav tips-prev"
                    onClick={prevTip}
                    aria-label="Previous tip"
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  <button
                    className="tips-carousel-nav tips-next"
                    onClick={nextTip}
                    aria-label="Next tip"
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>

                  {/* 轮播指示器 */}
                  <div className="tips-carousel-indicators">
                    {tipsData.map((_, index) => (
                      <span
                        key={index}
                        className={`tips-indicator ${index === tipsSlide ? 'active' : ''}`}
                        onClick={() => goToTip(index)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};
