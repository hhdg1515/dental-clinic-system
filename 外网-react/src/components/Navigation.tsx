import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage, type TranslationKey } from '../context/LanguageContext';

type NavigationVariant = 'overlay' | 'plain';

type NavLinkConfig = {
  to: string;
  labelKey: TranslationKey;
  isActive: (path: string) => boolean;
};

const NAV_LINKS: NavLinkConfig[] = [
  {
    to: '/',
    labelKey: 'nav-home',
    isActive: (path) => path === '/'
  },
  {
    to: '/service',
    labelKey: 'nav-services',
    isActive: (path) =>
      path.startsWith('/service') || path.startsWith('/services')
  },
  {
    to: '/stories',
    labelKey: 'nav-stories',
    isActive: (path) => path.startsWith('/stories')
  },
  {
    to: '/faq',
    labelKey: 'nav-faq',
    isActive: (path) => path.startsWith('/faq')
  }
];

const disableScroll = () => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = 'hidden';
  }
};

const enableScroll = () => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = '';
  }
};

export const Navigation = ({ variant = 'overlay' }: { variant?: NavigationVariant }) => {
  const { t, toggle, currentLanguage } = useLanguage();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
        enableScroll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (isMenuOpen) {
      setIsMenuOpen(false);
      enableScroll();
    }
  }, [location.pathname, isMenuOpen]);

  useEffect(() => enableScroll, []);

  const headerVisual: CSSProperties = {
    backgroundColor:
      variant === 'overlay' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.08)',
    WebkitBackdropFilter: 'blur(8px)',
    backdropFilter: 'blur(8px)'
  };

  const logoShadow =
    variant === 'overlay'
      ? '0 2px 4px rgba(0, 0, 0, 0.3)'
      : '0 1px 3px rgba(0, 0, 0, 0.6), 0 0 8px rgba(0, 0, 0, 0.4)';

  const linkShadow =
    variant === 'overlay'
      ? '0 2px 4px rgba(0, 0, 0, 0.3)'
      : '0 1px 3px rgba(0, 0, 0, 0.6), 0 0 8px rgba(0, 0, 0, 0.4)';

  const currentPath = location.pathname;

  const navItems = useMemo(
    () =>
      NAV_LINKS.map(({ to, labelKey, isActive }) => ({
        to,
        label: t(labelKey),
        active: isActive(currentPath)
      })),
    [currentPath, t]
  );

  const openMenu = () => {
    setIsMenuOpen(true);
    disableScroll();
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    enableScroll();
  };

  const desktopLinkClasses =
    'relative inline-flex items-center whitespace-nowrap px-[1.1rem] py-[0.4rem] text-[0.9rem] font-medium uppercase tracking-[0.28em] text-white transition duration-300 ease-out hover:opacity-80';

  const languageLabel = `${String.fromCharCode(0x4E2D)} / EN`;
  const languageToggleAria =
    currentLanguage === 'en' ? 'Switch language to Chinese' : 'Switch language to English';

  return (
    <header
      className="sticky top-0 z-[70] w-full py-5"
      style={headerVisual}
    >
      <div className="mx-auto flex w-full max-w-[1360px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-10">
        <Link
          to="/"
          className="text-[0.95rem] font-semibold uppercase tracking-[0.3em] text-white transition duration-300 ease-out hover:opacity-90"
          style={{ textShadow: logoShadow }}
        >
          FIRST AVE DENTAL &amp; ORTHODONTICS
        </Link>

        <div className="flex items-center gap-4 md:hidden">
          <button
            type="button"
            onClick={toggle}
            className="whitespace-nowrap rounded-full border border-white/30 px-4 py-1 text-[0.85rem] font-semibold uppercase tracking-[0.24em] text-white transition duration-300 ease-out hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            style={{ textShadow: linkShadow }}
            aria-label={languageToggleAria}
          >
            {languageLabel}
          </button>

          <button
            type="button"
            onClick={openMenu}
            className="hidden h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition duration-300 ease-out hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            aria-label="Open menu"
          >
            <img src="/images/menu.svg" alt="" className="h-6 w-6" />
          </button>
        </div>

        <nav className="hidden items-center gap-4 md:flex">
          <ul className="flex items-center gap-2">
            {navItems.map(({ to, label, active }) => (
              <li key={to}>
                <Link
                  to={to}
                  className={`${desktopLinkClasses} ${active ? 'font-semibold' : ''}`}
                  style={{ textShadow: linkShadow }}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={toggle}
            className={`${desktopLinkClasses} rounded-full border border-white/30 px-[1.4rem] tracking-[0.24em]`}
            style={{ textShadow: linkShadow }}
            aria-label={languageToggleAria}
          >
            {languageLabel}
          </button>
        </nav>
      </div>

      <div
        className={`fixed inset-0 z-[90] transition-opacity duration-300 ease-out ${
          isMenuOpen ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
        style={{ backgroundColor: '#72A84A' }}
        onClick={closeMenu}
      >
        <div
          className="relative mx-auto flex h-full w-full max-w-[480px] flex-col gap-6 px-8 pb-16 pt-24 text-white"
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={closeMenu}
            className="absolute right-6 top-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 transition duration-300 ease-out hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            aria-label="Close menu"
          >
            <img src="/images/exit.svg" alt="" className="h-6 w-6" />
          </button>

          <ul className="flex flex-col gap-6 text-center text-[1.6rem] font-semibold uppercase tracking-[0.35em]">
            {navItems.map(({ to, label }) => (
              <li key={`mobile-${to}`}>
                <Link
                  to={to}
                  onClick={closeMenu}
                  className="inline-flex items-center justify-center py-2 transition duration-300 ease-out hover:opacity-80"
                >
                  {label}
                </Link>
              </li>
            ))}
            <li>
              <button
                type="button"
                onClick={() => {
                  toggle();
                  closeMenu();
                }}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-full border border-white/40 px-6 py-2 text-[1.2rem] tracking-[0.24em] transition duration-300 ease-out hover:bg-white/20"
                aria-label={languageToggleAria}
              >
                {languageLabel}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
};
