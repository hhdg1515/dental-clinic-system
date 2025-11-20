import { Link } from 'react-router-dom';
import { useLanguage, type TranslationKey } from '../context/LanguageContext';

const HOURS: Array<{ dayKey: TranslationKey; time: string }> = [
  { dayKey: 'day-monday', time: '9:00am - 5:00pm' },
  { dayKey: 'day-tuesday', time: '9:00am - 5:00pm' },
  { dayKey: 'day-wednesday', time: '9:00am - 5:00pm' },
  { dayKey: 'day-thursday', time: '9:00am - 5:00pm' },
  { dayKey: 'day-friday', time: '9:00am - 5:00pm' },
  { dayKey: 'day-saturday', time: '9:00am - 2:00pm' },
  { dayKey: 'day-sunday', time: '9:00am - 2:00pm' }
];

const FOOTER_NAV: Array<{ to: string; labelKey: TranslationKey; external?: boolean }> = [
  { to: '/service', labelKey: 'footer-nav-services' },
  { to: '/faq', labelKey: 'footer-nav-faq' },
  { to: '#', labelKey: 'footer-nav-contact', external: true },
  { to: '/#login-section', labelKey: 'footer-nav-book' }
];

const SOCIAL_LINKS: Array<{ iconClass: string; label: string }> = [
  { iconClass: 'fab fa-facebook-f', label: 'Facebook' },
  { iconClass: 'fab fa-spotify', label: 'Spotify' },
  { iconClass: 'fab fa-instagram', label: 'Instagram' },
  { iconClass: 'fab fa-youtube', label: 'YouTube' }
];

export const Footer = () => {
  const { t } = useLanguage();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="mt-auto">
      {/* Main Footer Content - Light Green Section */}
      <footer className="relative z-[60] bg-[#263C38] pt-[50px] text-white">
        <div className="mx-auto w-[80%] max-w-[1200px] px-[20px]">
          <div className="flex flex-col gap-[30px] pb-12 md:flex-row md:justify-center md:gap-x-[80px]">
            <section className="flex w-full flex-col gap-5 text-left md:max-w-[320px]">
              <h3 className="text-[0.9rem] font-semibold uppercase tracking-[0.5px]">
                {t('footer-contact-title')}
              </h3>
              <div className="space-y-[20px] text-[0.9rem] text-white/90">
                <div className="leading-[1.6]">
                  <p className="m-0">65 N First Ave # 203,</p>
                  <p className="m-0">Arcadia,</p>
                  <p className="m-0">CA 91006</p>
                </div>
                <a
                  href="mailto:XXXXXXXXXXX@gmail.com"
                  className="text-white transition duration-300 hover:text-[#8CC8A8] hover:underline"
                >
                  XXXXXXXXXXX@gmail.com
                </a>
                <div className="flex flex-row flex-wrap items-center gap-3">
                  {SOCIAL_LINKS.map((link) => (
                    <button
                      key={link.label}
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition duration-300 ease-out hover:-translate-y-[3px] hover:bg-white/20 hover:shadow-[0_5px_15px_rgba(0,0,0,0.2)] active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                      aria-label={link.label}
                    >
                      <i className={`${link.iconClass} text-[14px]`} aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="flex w-full flex-col gap-5 text-left md:max-w-[280px]">
              <h3 className="text-[0.9rem] font-semibold uppercase tracking-[0.5px]">
                {t('footer-hours-title')}
              </h3>
              <div className="flex flex-col gap-[6px]">
                {HOURS.map(({ dayKey, time }) => (
                  <div key={dayKey} className="flex items-center gap-4 py-[2px] whitespace-nowrap">
                    <span className="min-w-[110px] text-[0.9rem] font-medium text-white/90 whitespace-nowrap">
                      {t(dayKey)}
                    </span>
                    <span className="text-[0.9rem] text-white whitespace-nowrap">{time}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="flex w-full flex-col gap-5 text-left md:ml-auto md:max-w-[260px]">
              <h3 className="text-[0.9rem] font-semibold uppercase tracking-[0.5px]">
                {t('footer-nav-title')}
              </h3>
              <nav className="flex flex-col gap-2 text-[0.9rem] text-white/90">
                {FOOTER_NAV.map(({ to, labelKey, external }) => {
                  const label = t(labelKey);
                  const baseClasses =
                    'cursor-pointer py-[6px] transition duration-300 hover:translate-x-[5px] hover:text-white';
                  if (external) {
                    return (
                      <a key={labelKey} href={to} className={baseClasses}>
                        {label}
                      </a>
                    );
                  }
                  return (
                    <Link key={labelKey} to={to} className={baseClasses}>
                      {label}
                    </Link>
                  );
                })}
              </nav>
            </section>
          </div>
        </div>
      </footer>

      {/* Bottom Bar - Deep Green Section - Sticky to bottom */}
      <div className="relative z-[61] bg-[#213330] text-white">
        <div className="mx-auto w-[80%] max-w-[1200px] px-8 py-5">
          <div className="flex flex-wrap items-center justify-center gap-4 text-[0.9rem] text-white/80">
            <button
              type="button"
              onClick={scrollToTop}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 transition duration-300 hover:bg-white/20 hover:shadow-[0_5px_15px_rgba(0,0,0,0.3)] hover:-translate-y-[3px] active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              aria-label="Back to top"
            >
              <i className="fas fa-chevron-up text-[16px]" aria-hidden="true" />
            </button>
            <p className="text-center tracking-[0.5px]">
              Ac 2025 XXXXX – All rights reserved{' '}
              <i className="fas fa-heart px-[4px] text-[#ff6b6b]" aria-hidden="true" /> to all our amazing patients
            </p>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[0.85rem] text-white/60">
            <Link
              to="/privacy-policy"
              className="transition duration-300 hover:text-white hover:underline"
            >
              Privacy Policy
            </Link>
            <span className="hidden sm:inline text-white/40">•</span>
            <Link
              to="/terms-of-service"
              className="transition duration-300 hover:text-white hover:underline"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
