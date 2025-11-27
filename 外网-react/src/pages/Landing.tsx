import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { OptimizedImage } from '../components/OptimizedImage';
import { LoginForm } from '../components/LoginForm';
import { UserDashboard } from '../components/UserDashboard';
import { SEO } from '../components/SEO';
import { useLanguage } from '../context/LanguageContext';
import type { TranslationKey } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useClinicMap } from '../hooks/useClinicMap';
import { useCommunityCarousel } from '../hooks/useCommunityCarousel';

export const Landing = () => {
  const { t } = useLanguage();
  const { currentUser, requestAuthInit } = useAuth();
  const [loginToolsVisible, setLoginToolsVisible] = useState(false);

  const heroServices: Array<{
    id: string;
    image: string;
    titleKey: TranslationKey;
    descriptionKeys: TranslationKey[];
    link: string;
    ariaLabel: string;
    ctaKey: TranslationKey;
  }> = [
    {
      id: 'general-family',
      image: '/images/family.jpg',
      titleKey: 'service-general-title',
      descriptionKeys: [
        'service-general-exams',
        'service-general-cleanings',
        'service-general-fillings'
      ],
      link: '/services/general-family#general-family',
      ariaLabel: 'General and family dentistry services',
      ctaKey: 'service-cosmetic-cta'
    },
    {
      id: 'cosmetic',
      image: '/images/cosmetic.jpg',
      titleKey: 'service-cosmetic-title',
      descriptionKeys: [
        'service-general-exams',
        'service-cosmetic-veneers',
        'service-cosmetic-bonding'
      ],
      link: '/services/cosmetic#cosmetic',
      ariaLabel: 'Cosmetic dentistry services',
      ctaKey: 'service-cosmetic-cta'
    },
    {
      id: 'root-canals',
      image: '/images/ro.jpg',
      titleKey: 'service-rootcanal-title',
      descriptionKeys: [
        'service-rootcanal-diagnosis',
        'service-rootcanal-procedures',
        'service-rootcanal-retreatment'
      ],
      link: '/services/root-canals#root-canals',
      ariaLabel: 'Root canal services',
      ctaKey: 'service-cosmetic-cta'
    }
  ] as const;

  // Clinic map carousel state
  const { currentSlide: clinicSlide, currentClinicData, prevSlide: prevClinic, nextSlide: nextClinic, goToSlide: goToClinic } = useClinicMap();

  // Community showcase carousel state
  const { currentSlide: communitySlide, prevSlide: prevCommunity, nextSlide: nextCommunity, goToSlide: goToCommunity, pauseAutoSlide, resumeAutoSlide } = useCommunityCarousel(3, 5000);

  // Scroll to anchor on page load if hash exists
  useEffect(() => {
    if (window.location.hash) {
      const id = window.location.hash.substring(1);
      const VALID_ANCHORS = ['login-section', 'general-family', 'cosmetic', 'root-canals'];
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

  useEffect(() => {
    if (loginToolsVisible) {
      return;
    }

    const section = document.getElementById('login-section');
    if (!section || typeof IntersectionObserver === 'undefined') {
      setLoginToolsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setLoginToolsVisible(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '200px 0px' }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [loginToolsVisible]);

  useEffect(() => {
    if (loginToolsVisible) {
      requestAuthInit();
    }
  }, [loginToolsVisible, requestAuthInit]);

  // Handle scroll to login section
  const scrollToLogin = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const loginSection = document.getElementById('login-section');
    if (loginSection) {
      loginSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <>
      <SEO
        title="First Ave Dental & Orthodontics - Professional Dental Care"
        description="专业牙科诊所，提供家庭牙科、美容牙科、根管治疗、口腔正畸等全方位牙科服务。服务地点：Arcadia, Rowland Heights, Irvine, Pasadena, Eastvale。预约电话咨询，享受专业护理。"
        keywords="牙科诊所, 牙医, 美容牙科, 根管治疗, 洗牙, 口腔正畸, Arcadia牙科, Irvine牙医, Pasadena牙科"
        ogTitle="First Ave Dental & Orthodontics - 家庭与美容牙科服务"
        ogDescription="提供全方位牙科服务，5个便利地点。专业团队，先进设备，温馨环境。"
        ogImage="/images/og-image.jpg"
      />
      <div className="flex min-h-screen flex-col">
        <div className="flex-1">
        {/* Hero Section */}
    <section
      className="relative isolate overflow-hidden text-white"
    >
      {/* Background Image using OptimizedImage */}
      <div className="absolute inset-0" style={{ zIndex: 0 }}>
        <OptimizedImage
          src="/images/forest-hero.jpg"
          alt="Hero Background"
          loading="eager"
          fetchPriority="high"
          aspectRatio="16/9"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center'
          }}
        />
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/45" style={{ zIndex: 1 }} />

      <div className="relative z-10">
        <Navigation variant="overlay" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-[1180px] px-4 pb-16 pt-12 md:pl-12 md:pr-20 md:pb-24 md:pt-16">
        <div className="flex flex-col items-center gap-12 md:flex-row md:items-start md:justify-start md:gap-20">
          <div className="w-full space-y-8 text-center md:w-[36%] md:space-y-12 md:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.38em] text-white/80 md:tracking-[0.42em]">
              {t('hero-subtitle')}
            </p>
            <h1 className="font-display text-[1.9rem] leading-[1.35] tracking-[0.05em] text-white md:text-[2.75rem] md:leading-[1.4] md:tracking-[0.08em]">
              <span className="block">{t('hero-title1')}</span>
              <span className="block">{t('hero-title2')}</span>
              <span className="block">{t('hero-title3')}</span>
            </h1>
            <a
              href="#login-section"
              onClick={scrollToLogin}
              className="inline-flex items-center justify-center rounded-[8px] border border-transparent bg-brand-primary px-6 py-4 font-semibold uppercase tracking-[0.32em] text-white transition duration-200 hover:bg-brand-primaryDark md:tracking-[0.35em]"
            >
              {t('hero-cta')}
            </a>
          </div>

          <ul className="mx-auto flex w-full flex-col gap-12 md:mx-0 md:grid md:grid-cols-3 md:gap-12 md:justify-items-start">
            {heroServices.map((service) => (
              <li key={service.id} className="w-full text-left">
                <Link to={service.link} aria-label={service.ariaLabel}>
                  <OptimizedImage
                    src={service.image}
                    alt={t(service.titleKey)}
                    className="h-[288px] w-full rounded-[10px] object-cover shadow-[10px_10px_10px_rgba(0,0,0,0.2)] transition duration-300 hover:scale-[1.02]"
                    loading="lazy"
                    aspectRatio="4/3"
                  />
                </Link>
                <p className="mt-5 font-display text-sm uppercase tracking-[0.16em] text-white md:text-base md:tracking-[0.18em]">
                  {t(service.titleKey)}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-white/80">
                  {service.descriptionKeys.map((key, index) => (
                    <span key={key}>
                      {t(key)}
                      {index < service.descriptionKeys.length - 1 && <br />}
                    </span>
                  ))}
                </p>
                <Link
                  to={service.link}
                  className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-white transition hover:text-white/80"
                  aria-label={service.ariaLabel}
                >
                  {t(service.ctaKey)}
                  <img src="/images/arrows.svg" alt="" className="h-3 w-6" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>

    {/* Appointment Form Section */}
    <section
      id="login-section"
      className="relative overflow-hidden bg-surface-base py-20 sm:py-24"
    >
      <div className="pointer-events-none absolute inset-x-1/2 top-0 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-primary/15 blur-3xl md:h-80 md:w-80" />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-12 px-4 text-left lg:flex-row lg:items-start lg:gap-12">
        <div className="flex w-full flex-col items-start gap-6 text-neutral-700 lg:w-1/2">
          <h2 className="font-display text-2xl text-neutral-900 md:text-4xl">
            {t('form-description')}
          </h2>
          <p className="text-sm leading-relaxed text-neutral-600">
            {t('form-detail')}
          </p>
          <OptimizedImage
            src="/images/blue.jpg"
            alt="Dental clinic interior"
            className="w-full max-w-[360px] object-cover"
            loading="lazy"
            aspectRatio="4/3"
          />
        </div>

        <div className="relative flex w-full justify-center text-left lg:w-[45%]">
          <div className="w-full max-w-[400px]">
            {loginToolsVisible ? (
              currentUser ? (
                <UserDashboard />
              ) : (
                <LoginForm />
              )
            ) : (
              <div className="rounded-2xl border border-dashed border-neutral-200 bg-white/80 p-8 text-sm text-neutral-600">
                {t('form-description')}
              </div>
            )}
          </div>
          <img
            src="/images/fern.svg"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute top-8 left-full w-44 -translate-x-6 rotate-[12deg] opacity-25 md:top-12 md:w-52"
          />
        </div>
      </div>
    </section>

      {/* Community Showcase Section */}
      <section className="community-showcase">
        <div className="community-container">
          <div className="community-header">
            <h2 className="community-main-title">{t('community-main-title')}</h2>
            <h3 className="community-subtitle">{t('community-subtitle')}</h3>
          </div>

          <div
            className="community-carousel"
            onMouseEnter={pauseAutoSlide}
            onMouseLeave={resumeAutoSlide}
          >
            <div className="community-carousel-content">
              <div className={`community-slide ${communitySlide === 0 ? 'active' : ''}`}>
                <div className="photo-grid">
                  <div className="photo-item">
                    <div className="photo-placeholder">
                      <span className="photo-label">Community Partnership</span>
                    </div>
                  </div>
                  <div className="photo-item">
                    <div className="photo-placeholder">
                      <span className="photo-label">Health Fair</span>
                    </div>
                  </div>
                  <div className="photo-item">
                    <div className="photo-placeholder">
                      <span className="photo-label">Recognition</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`community-slide ${communitySlide === 1 ? 'active' : ''}`}>
                <div className="photo-grid">
                  <div className="photo-item">
                    <div className="photo-placeholder">
                      <span className="photo-label">Mayor Meeting</span>
                    </div>
                  </div>
                  <div className="photo-item">
                    <div className="photo-placeholder">
                      <span className="photo-label">Local Business</span>
                    </div>
                  </div>
                  <div className="photo-item">
                    <div className="photo-placeholder">
                      <span className="photo-label">Media Feature</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`community-slide ${communitySlide === 2 ? 'active' : ''}`}>
                <div className="photo-grid">
                  <div className="photo-item">
                    <div className="photo-placeholder">
                      <span className="photo-label">Celebrity Visit</span>
                    </div>
                  </div>
                  <div className="photo-item">
                    <div className="photo-placeholder">
                      <span className="photo-label">Awards</span>
                    </div>
                  </div>
                  <div className="photo-item">
                    <div className="photo-placeholder">
                      <span className="photo-label">Community Care</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              className="community-nav-btn community-prev"
              onClick={prevCommunity}
              aria-label="Previous community slide"
            >
              <i className="fas fa-chevron-left"></i>
            </button>
            <button
              className="community-nav-btn community-next"
              onClick={nextCommunity}
              aria-label="Next community slide"
            >
              <i className="fas fa-chevron-right"></i>
            </button>

            <div className="community-indicators">
              <span
                className={`community-indicator ${communitySlide === 0 ? 'active' : ''}`}
                onClick={() => goToCommunity(0)}
              ></span>
              <span
                className={`community-indicator ${communitySlide === 1 ? 'active' : ''}`}
                onClick={() => goToCommunity(1)}
              ></span>
              <span
                className={`community-indicator ${communitySlide === 2 ? 'active' : ''}`}
                onClick={() => goToCommunity(2)}
              ></span>
            </div>
          </div>
        </div>
      </section>

      {/* Visit Amenities Section - 保留原始结构 */}
      <section className="visit-amenities-section">
        <div className="fern2"></div>
        <div className="fern3"></div>
        <div className="visit-amenities-background">
          <div className="visit-amenities-container">
            <div className="image-cards-row">
              <div className="image-card amenities-card">
                <div className="image-container">
                  <OptimizedImage src="/images/local.jpg" alt="Local Amenities" className="card-image" loading="lazy" aspectRatio="4/3" />
                  <div className="image-overlay">
                    <div className="image-content">
                      <h2 className="card-title">{t('amenities-title')}</h2>
                      <p className="card-description">{t('amenities-description')}</p>
                      <Link to="/faq" className="card-button amenities-btn">{t('amenities-button')}</Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="image-card plan-card">
                <div className="image-container">
                  <OptimizedImage src="/images/todo.jpg" alt="Plan Your Visit" className="card-image" loading="lazy" aspectRatio="4/3" />
                  <div className="image-overlay">
                    <div className="image-content">
                      <h2 className="card-title">{t('plan-title')}</h2>
                      <p className="card-description">{t('plan-description')}</p>
                      <Link to="/faq" className="card-button plan-btn">{t('plan-button')}</Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="info-cards-row">
              <div className="info-card tips-card">
                <div className="tips-header">
                  <div className="tips-accent-line"></div>
                  <h2 className="tips-title">{t('tips-title')}</h2>
                </div>
                <div className="tips-content">
                  <div className="tip-item">
                    <h3 className="tip-heading">{t('tip-insurance-title')}</h3>
                    <p className="tip-text">{t('tip-insurance-text')}</p>
                  </div>
                  <div className="tip-item">
                    <h3 className="tip-heading">{t('tip-comfort-title')}</h3>
                    <p className="tip-text">{t('tip-comfort-text')}</p>
                  </div>
                  <div className="tip-item">
                    <h3 className="tip-heading">{t('tip-aftercare-title')}</h3>
                    <p className="tip-text">{t('tip-aftercare-text')}</p>
                  </div>
                </div>
              </div>

              <div className="info-card story-card">
                <div className="story-content">
                  <h2 className="story-title">{t('story-title')}</h2>
                  <p className="story-subtitle">{t('story-subtitle')}</p>
                  <div className="story-icon">
                    <i className="fas fa-comment-dots"></i>
                  </div>
                  <button className="story-button">{t('story-button')}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clinic Map Section - Simplified but UI preserved */}
      <section className="clinic-map-section">
        <div className="fern4"></div>
        <div className="fern5"></div>
        <div className="fern7"></div>
        <div className="map-background-grid">
          <div className="map-container">
            <div className="map-trip-card">
              <div className="trip-icon">
                <i className="fas fa-map-marked-alt"></i>
              </div>
              <h3 className="trip-title">{t('map-trip-title')}</h3>
              <div className="trip-contact">
                <p className="trip-phone">XXX-XXX-XXXX</p>
              </div>
              <a href="#login-section" className="trip-book-btn" onClick={scrollToLogin} aria-label="Book appointment now">Book Now</a>
            </div>

            <div className="map-slider-area">
              <div className="map-slider" id="map-slider">
                {/* Arcadia */}
                <div className={`map-slide ${clinicSlide === 0 ? 'active' : ''} ${clinicSlide > 0 ? 'prev' : ''}`} data-clinic="arcadia">
                  <div className="map-display">
                    <a href="https://maps.google.com/maps?q=Arcadia,CA" target="_blank" className="map-link" rel="noreferrer" aria-label="View Arcadia location on Google Maps">
                      <div className="city-image-container">
                        <OptimizedImage src="/images/arcadia2.jpg" alt="Arcadia" className="city-image" loading="lazy" aspectRatio="16/9" />
                        <div className="city-overlay">
                          <div className="city-content">
                            <h3 className="city-name">{t('data-clinic-arcadia')}</h3>
                          </div>
                        </div>
                      </div>
                    </a>
                  </div>
                </div>

                {/* Rowland Heights */}
                <div className={`map-slide ${clinicSlide === 1 ? 'active' : ''} ${clinicSlide > 1 ? 'prev' : ''}`} data-clinic="rowland">
                  <div className="map-display">
                    <a href="https://maps.google.com/maps?q=Rowland+Heights,CA" target="_blank" className="map-link" rel="noreferrer" aria-label="View Rowland Heights location on Google Maps">
                      <div className="city-image-container">
                        <OptimizedImage src="/images/rowland.jpg" alt="Rowland Heights" className="city-image" loading="lazy" aspectRatio="16/9" />
                        <div className="city-overlay">
                          <div className="city-content">
                            <h3 className="city-name">{t('data-clinic-rowland-heights')}</h3>
                          </div>
                        </div>
                      </div>
                    </a>
                  </div>
                </div>

                {/* Irvine */}
                <div className={`map-slide ${clinicSlide === 2 ? 'active' : ''} ${clinicSlide > 2 ? 'prev' : ''}`} data-clinic="irvine">
                  <div className="map-display">
                    <a href="https://maps.google.com/maps?q=Irvine,CA" target="_blank" className="map-link" rel="noreferrer" aria-label="View Irvine location on Google Maps">
                      <div className="city-image-container">
                        <OptimizedImage src="/images/irvine2.jpg" alt="Irvine" className="city-image" loading="lazy" aspectRatio="16/9" />
                        <div className="city-overlay">
                          <div className="city-content">
                            <h3 className="city-name">{t('data-clinic-irvine')}</h3>
                          </div>
                        </div>
                      </div>
                    </a>
                  </div>
                </div>

                {/* South Pasadena */}
                <div className={`map-slide ${clinicSlide === 3 ? 'active' : ''} ${clinicSlide > 3 ? 'prev' : ''}`} data-clinic="south-pasadena">
                  <div className="map-display">
                    <a href="https://maps.google.com/maps?q=South+Pasadena,CA" target="_blank" className="map-link" rel="noreferrer" aria-label="View South Pasadena location on Google Maps">
                      <div className="city-image-container">
                        <OptimizedImage src="/images/pasadena2.jpg" alt="South Pasadena" className="city-image" loading="lazy" aspectRatio="16/9" />
                        <div className="city-overlay">
                          <div className="city-content">
                            <h3 className="city-name">{t('data-clinic-south-pasadena')}</h3>
                          </div>
                        </div>
                      </div>
                    </a>
                  </div>
                </div>

                {/* Eastvale */}
                <div className={`map-slide ${clinicSlide === 4 ? 'active' : ''}`} data-clinic="eastvale">
                  <div className="map-display">
                    <a href="https://www.google.com/maps/place/Eastvale,+CA" target="_blank" className="map-link" rel="noreferrer" aria-label="View Eastvale location on Google Maps">
                      <div className="city-image-container">
                        <OptimizedImage src="/images/eastvale.jpg" alt="Eastvale" className="city-image" loading="lazy" aspectRatio="16/9" />
                        <div className="city-overlay">
                          <div className="city-content">
                            <h3 className="city-name">{t('data-clinic-eastvale')}</h3>
                          </div>
                        </div>
                      </div>
                    </a>
                  </div>
                </div>
              </div>

              <button
                className="map-nav-btn prev-btn"
                id="prev-clinic"
                onClick={prevClinic}
                aria-label="Previous clinic location"
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <button
                className="map-nav-btn next-btn"
                id="next-clinic"
                onClick={nextClinic}
                aria-label="Next clinic location"
              >
                <i className="fas fa-chevron-right"></i>
              </button>

              <div className="map-indicators">
                <span
                  className={`indicator ${clinicSlide === 0 ? 'active' : ''}`}
                  onClick={() => goToClinic(0)}
                  data-slide="0"
                ></span>
                <span
                  className={`indicator ${clinicSlide === 1 ? 'active' : ''}`}
                  onClick={() => goToClinic(1)}
                  data-slide="1"
                ></span>
                <span
                  className={`indicator ${clinicSlide === 2 ? 'active' : ''}`}
                  onClick={() => goToClinic(2)}
                  data-slide="2"
                ></span>
                <span
                  className={`indicator ${clinicSlide === 3 ? 'active' : ''}`}
                  onClick={() => goToClinic(3)}
                  data-slide="3"
                ></span>
                <span
                  className={`indicator ${clinicSlide === 4 ? 'active' : ''}`}
                  onClick={() => goToClinic(4)}
                  data-slide="4"
                ></span>
              </div>
            </div>

            <div className="distance-info">
              <div className="distance-card">
                <div className="distance-title-container">
                  <h3 className="distance-title-fancy">{t('distance-title-fancy')}</h3>
                  <h4 className="distance-title-regular">{t('distance-title-regular')}</h4>
                </div>
                <div className="distance-list" id="distance-list">
                  {/* Dynamically render distance information */}
                  {currentClinicData.distances.map((distance, index) => (
                    <div key={index} className="distance-item">
                      <span className="city-name">{distance.city}</span>
                      <div className="distance-details">
                        <div className="distance-miles">{distance.miles}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="visit-california-container">
                  <a href="https://www.visitcalifornia.com" target="_blank" className="visit-california-btn" rel="noreferrer" aria-label="Visit California tourism website">
                    <span>{t('visit-california')}</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      </div>

      <Footer />
      </div>
    </>
  );
};
