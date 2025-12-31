import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { OptimizedImage } from '../components/OptimizedImage';
import { useLanguage, type TranslationKey } from '../context/LanguageContext';
import { SEO } from '../components/SEO';

// Floating Decorations - consistent with other themed pages
const FloatingDecorations = () => (
  <div className="sv-decorations" aria-hidden="true">
    {/* Left side - gold tones */}
    <div className="sv-dot sv-dot--gold sv-dot--animate" style={{ left: '4%', top: '15%', width: 14, height: 14, animationDelay: '0.2s' }} />
    <div className="sv-dot sv-dot--blur" style={{ left: '6%', top: '35%', width: 90, height: 90, animationDelay: '0.4s' }} />
    <div className="sv-dot sv-dot--sage" style={{ left: '3%', top: '55%', width: 18, height: 18, animationDelay: '0.6s' }} />
    <div className="sv-dot sv-dot--gold sv-dot--animate" style={{ left: '5%', top: '75%', width: 12, height: 12, animationDelay: '0.8s' }} />

    {/* Right side - sage accents */}
    <div className="sv-dot sv-dot--sage sv-dot--animate" style={{ right: '5%', top: '20%', width: 16, height: 16, animationDelay: '0.3s' }} />
    <div className="sv-dot sv-dot--blur" style={{ right: '4%', top: '50%', width: 70, height: 70, animationDelay: '0.5s' }} />
    <div className="sv-dot sv-dot--gold sv-dot--animate" style={{ right: '6%', top: '70%', width: 20, height: 20, animationDelay: '0.7s' }} />
    <div className="sv-dot sv-dot--sage" style={{ right: '3%', top: '85%', width: 10, height: 10, animationDelay: '0.9s' }} />
  </div>
);

type ServiceCard = {
  id: string;
  image: string;
  titleKey: TranslationKey;
  items: TranslationKey[];
  detailLink: string;
  ctaKey: TranslationKey;
};

export const Service = () => {
  const { t } = useLanguage();

  const renderServiceCard = (service: ServiceCard) => {
    return (
      <li key={service.id} className="w-full text-left">
        <a
          href={service.detailLink}
          aria-label={`${t(service.titleKey)} services`}
          className="block overflow-hidden rounded-[10px] hover:opacity-100 focus-visible:opacity-100"
        >
          <OptimizedImage
            src={service.image}
            alt={t(service.titleKey)}
            loading="lazy"
            className="h-[288px] w-full rounded-[10px] object-cover shadow-[10px_10px_10px_rgba(0,0,0,0.2)] transition duration-300 hover:scale-[1.02]"
          />
        </a>
        <p className="mt-5 font-display text-sm uppercase tracking-[0.16em] text-neutral-900 md:text-base md:tracking-[0.18em]">
          {t(service.titleKey)}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          {service.items.map((itemKey, index) => (
            <span key={itemKey}>
              {t(itemKey)}
              {index < service.items.length - 1 && <br />}
            </span>
          ))}
        </p>
        <a
          href={service.detailLink}
          className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-neutral-900 transition hover:text-neutral-700"
          aria-label={`View ${t(service.titleKey)} service information`}
        >
          <span>{t(service.ctaKey)}</span>
          <img src="/images/arrows-black.svg" alt="" className="h-3 w-6" />
        </a>
      </li>
    );
  };

  const firstRowServices = [
    {
      id: 'general-family',
      image: '/images/family.jpg',
      titleKey: 'service-general-title',
      items: [
        'service-general-exams',
        'service-general-cleanings',
        'service-general-fillings'
      ],
      detailLink: '/services/general-family',
      ctaKey: 'service-general-cta'
    },
    {
      id: 'cosmetic',
      image: '/images/cosmetic.jpg',
      titleKey: 'service-cosmetic-title',
      items: [
        'service-cosmetic-whitening',
        'service-cosmetic-veneers',
        'service-cosmetic-bonding'
      ],
      detailLink: '/services/cosmetic',
      ctaKey: 'service-cosmetic-cta'
    },
    {
      id: 'orthodontics',
      image: '/images/or.jpg',
      titleKey: 'service-orthodontics-title',
      items: [
        'service-orthodontics-item1',
        'service-orthodontics-item2',
        'service-orthodontics-item3'
      ],
      detailLink: '/services/orthodontics',
      ctaKey: 'service-cosmetic-cta'
    },
    {
      id: 'root-canals',
      image: '/images/ro.jpg',
      titleKey: 'service-rootcanal-title',
      items: [
        'service-rootcanal-diagnosis',
        'service-rootcanal-procedures',
        'service-rootcanal-retreatment'
      ],
      detailLink: '/services/root-canals',
      ctaKey: 'service-cosmetic-cta'
    }
  ] satisfies ServiceCard[];

  const secondRowServices = [
    {
      id: 'periodontics',
      image: '/images/pe.jpg',
      titleKey: 'service-periodontics-title',
      items: [
        'service-periodontics-item1',
        'service-periodontics-item2',
        'service-periodontics-item3'
      ],
      detailLink: '/services/periodontics',
      ctaKey: 'service-cosmetic-cta'
    },
    {
      id: 'restorations',
      image: '/images/res.jpg',
      titleKey: 'service-restorations-title',
      items: [
        'service-restorations-item1',
        'service-restorations-item2',
        'service-restorations-item3'
      ],
      detailLink: '/services/restorations',
      ctaKey: 'service-cosmetic-cta'
    },
    {
      id: 'preventive',
      image: '/images/preventive.png',
      titleKey: 'service-preventive-title',
      items: [
        'service-preventive-item1',
        'service-preventive-item2',
        'service-preventive-item3'
      ],
      detailLink: '/services/preventive',
      ctaKey: 'service-cosmetic-cta'
    },
    {
      id: 'oral-surgery',
      image: '/images/oral.jpg',
      titleKey: 'service-oral-surgery-title',
      items: [
        'service-oral-surgery-item1',
        'service-oral-surgery-item2',
        'service-oral-surgery-item3'
      ],
      detailLink: '/services/oral-surgery',
      ctaKey: 'service-cosmetic-cta'
    }
  ] satisfies ServiceCard[];

  return (


    <>
      <SEO
        title="Our Services - Comprehensive Dental Care | First Ave Dental"
        description="提供全方位牙科服务：家庭牙科、美容牙科、根管治疗、口腔正畸、牙周病治疗、儿童牙科等。专业团队，先进设备，5个便利地点。"
        keywords="牙科服务, 牙科治疗, 美容牙科, 根管治疗, 口腔正畸, 牙周病, 儿童牙科"
        ogTitle="牙科服务项目 - First Ave Dental & Orthodontics"
        ogDescription="专业牙科服务：家庭、美容、正畸、根管治疗等"
      />
    <div className="service-page flex min-h-screen flex-col">
      <FloatingDecorations />
      <div className="flex-1">
        {/* Sub Hero Section with Navigation */}
        <div className="sub-hero">
        <div className="wrapper no-padding">
          <Navigation variant="plain" />
        </div>

        <div className="wrapper hero">
          <div className="main-copy">
            {/* Breadcrumbs */}
            <div className="bread-wrapper">
              <ul className="breadcrumbs">
                <li><a href="/" aria-label="Go to home page">{t('service-breadcrumb-home')}</a></li>
                <li>&gt; <span>{t('service-breadcrumb-current')}</span></li>
              </ul>
            </div>

            {/* Page Title */}
            <h1>
              <span>{t('service-page-title')}</span>
            </h1>

            {/* Description */}
            <p className="sub-desc">{t('service-hero-desc')}</p>
          </div>

          {/* First Row of Service Cards */}
          <ul className="featured-cabins grid gap-12 md:grid-cols-2 xl:grid-cols-4">
            {firstRowServices.map((service) => renderServiceCard(service))}
          </ul>
        </div>
        </div>

        {/* Main Content - Second Row of Service Cards */}
        <main className="services-main-content">
        <div className="wrapper">
          <ul className="featured-cabins grid gap-12 md:grid-cols-2 xl:grid-cols-4">
            {secondRowServices.map((service) => renderServiceCard(service))}
          </ul>
        </div>
        </main>
      </div>

      {/* Footer */}
      <Footer />
      </div>
    </>
  );
};
