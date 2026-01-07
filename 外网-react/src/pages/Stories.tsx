import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { SEO } from '../components/SEO';
import { OptimizedImage } from '../components/OptimizedImage';
import { useLanguage, type TranslationKey } from '../context/LanguageContext';
import '../styles/stories.css';

// ============================================================
// DATA
// ============================================================

type FeaturedStory = {
  titleKey: TranslationKey;
  descriptionKey: TranslationKey;
  offerKey: TranslationKey;
  seasonKey: TranslationKey;
  views: number;
  image: string;
};

const featuredStory: FeaturedStory = {
  titleKey: 'stories-featured-title',
  descriptionKey: 'stories-featured-desc',
  offerKey: 'stories-featured-offer',
  seasonKey: 'stories-featured-season',
  views: 2341,
  image: '/images/cosmetic-carousel-1.jpg'
};

const STORY_FILTERS: TranslationKey[] = [
  'stories-filter-all',
  'stories-filter-implants',
  'stories-filter-orthodontics',
  'stories-filter-cosmetic',
  'stories-filter-general'
];

type StoryCard = {
  id: string;
  titleKey: TranslationKey;
  excerptKey: TranslationKey;
  author: string;
  dateKey: TranslationKey;
  categoryKey: TranslationKey;
  tagKey: TranslationKey;
  image: string;
  likes: number;
};

const STORY_CARDS: StoryCard[] = [
  {
    id: 'dental-anxiety',
    titleKey: 'stories-card-anxiety-title',
    excerptKey: 'stories-card-anxiety-excerpt',
    author: 'Emily R.',
    dateKey: 'stories-date-jun-8-2024',
    categoryKey: 'stories-category-general',
    tagKey: 'stories-tag-deep-cleaning',
    image: '/images/service1.jpg',
    likes: 1205
  },
  {
    id: 'invisalign-journey',
    titleKey: 'stories-card-invisalign-title',
    excerptKey: 'stories-card-invisalign-excerpt',
    author: 'Jessica K.',
    dateKey: 'stories-date-oct-22-2024',
    categoryKey: 'stories-category-orthodontics',
    tagKey: 'stories-tag-invisalign',
    image: '/images/forest4.jpg',
    likes: 3420
  },
  {
    id: 'veneers-confidence',
    titleKey: 'stories-card-veneers-title',
    excerptKey: 'stories-card-veneers-excerpt',
    author: 'Amanda T.',
    dateKey: 'stories-date-dec-5-2024',
    categoryKey: 'stories-category-cosmetic',
    tagKey: 'stories-tag-veneers',
    image: '/images/cosmetic-carousel-4.jpg',
    likes: 4521
  },
  {
    id: 'root-canal',
    titleKey: 'stories-card-rootcanal-title',
    excerptKey: 'stories-card-rootcanal-excerpt',
    author: 'Maria S.',
    dateKey: 'stories-date-apr-3-2024',
    categoryKey: 'stories-category-general',
    tagKey: 'stories-tag-root-canal',
    image: '/images/root-canal-carousel-2.jpg',
    likes: 892
  },
  {
    id: 'wedding-whitening',
    titleKey: 'stories-card-whitening-title',
    excerptKey: 'stories-card-whitening-excerpt',
    author: 'Christina N.',
    dateKey: 'stories-date-jul-18-2024',
    categoryKey: 'stories-category-cosmetic',
    tagKey: 'stories-tag-whitening',
    image: '/images/cosmetic-carousel-3.jpg',
    likes: 5678
  },
  {
    id: 'family-first-visit',
    titleKey: 'stories-card-family-title',
    excerptKey: 'stories-card-family-excerpt',
    author: 'Rachel P.',
    dateKey: 'stories-date-sep-12-2024',
    categoryKey: 'stories-category-general',
    tagKey: 'stories-tag-family-checkup',
    image: '/images/family.jpg',
    likes: 2134
  }
];

// ============================================================
// ICONS
// ============================================================

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <rect x="1.5" y="2.5" width="11" height="10" rx="2" stroke="currentColor" strokeWidth="1.2" />
    <path d="M1.5 5.5h11" stroke="currentColor" strokeWidth="1.2" />
    <path d="M4.5 1v2M9.5 1v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const HeartIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path
      d="M8 14s-5.5-3.5-5.5-7a3 3 0 0 1 5.5-1.7A3 3 0 0 1 13.5 7c0 3.5-5.5 7-5.5 7z"
      fill={filled ? '#E8A0A0' : 'none'}
      stroke={filled ? '#E8A0A0' : 'currentColor'}
      strokeWidth="1.2"
    />
  </svg>
);

const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronLeftIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M9 3L5 7l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
    <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ============================================================
// DECORATIVE ELEMENTS
// ============================================================

const FloatingDecorations = () => (
  <div className="stories-decorations" aria-hidden="true">
    {/* Left side */}
    <div className="stories-dot stories-dot--gold" style={{ left: '4%', top: '12%', width: 14, height: 14, animationDelay: '0.1s' }} />
    <div className="stories-dot stories-dot--blur" style={{ left: '6%', top: '30%', width: 100, height: 100, animationDelay: '0.2s' }} />
    <div className="stories-dot stories-dot--sage" style={{ left: '3%', top: '50%', width: 18, height: 18, animationDelay: '0.3s' }} />
    <div className="stories-dot stories-dot--gold" style={{ left: '5%', top: '70%', width: 12, height: 12, animationDelay: '0.4s' }} />

    {/* Right side */}
    <div className="stories-dot stories-dot--sage" style={{ right: '5%', top: '18%', width: 16, height: 16, animationDelay: '0.15s' }} />
    <div className="stories-dot stories-dot--blur" style={{ right: '4%', top: '45%', width: 80, height: 80, animationDelay: '0.25s' }} />
    <div className="stories-dot stories-dot--gold" style={{ right: '6%', top: '65%', width: 20, height: 20, animationDelay: '0.35s' }} />
    <div className="stories-dot stories-dot--sage" style={{ right: '3%', top: '85%', width: 10, height: 10, animationDelay: '0.45s' }} />
  </div>
);

// ============================================================
// COMPONENT
// ============================================================

export const Stories = () => {
  const { t, currentLanguage } = useLanguage();
  const [activeFilter, setActiveFilter] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const numberLocale = currentLanguage === 'zh' ? 'zh-CN' : 'en-US';

  return (
    <>
      <SEO
        title="Patient Stories & Smile Blog | First Ave Dental"
        description="Explore heartfelt patient stories about Invisalign, cosmetic dentistry, root canals, and family visits at First Ave Dental & Orthodontics."
        keywords="dental patient stories, smile blog, Invisalign journey, cosmetic dentistry success"
        ogTitle="Patient Stories That Bloom | First Ave Dental"
        ogDescription="Discover how patients renewed their smiles with Invisalign, veneers, whitening, and compassionate general care."
        ogImage="/images/cosmetic-carousel-3.jpg"
      />

      <div className="stories-page">
        <FloatingDecorations />

        <Navigation variant="plain" />

        <main>
          {/* Header Section */}
          <header className="stories-header">
            <p className="stories-header__label">{t('nav-stories')}</p>
            <h1 className="stories-header__title">{t('stories-hero-title')}</h1>
            <p className="stories-header__desc">{t('stories-hero-desc')}</p>

            <div className="stories-header__divider">
              <span className="stories-header__divider-line" />
              <span className="stories-header__divider-diamond" />
              <span className="stories-header__divider-line" />
            </div>
          </header>

          {/* Featured Card */}
          <section className="stories-featured">
            <div className="stories-featured__card">
              {/* Image */}
              <div className="stories-featured__image">
                <OptimizedImage src={featuredStory.image} alt={t(featuredStory.titleKey)} loading="eager" />
                <span className="stories-featured__badge">
                  <span className="stories-featured__badge-icon">✿</span>
                  {t('stories-seasonal-special')}
                </span>
              </div>

              {/* Content */}
              <div className="stories-featured__content">
                <div className="stories-featured__tags">
                  <span className="stories-featured__tag">{t('stories-limited-time-tag')}</span>
                  <span className="stories-featured__date">
                    <CalendarIcon />
                    {t(featuredStory.seasonKey)}
                  </span>
                </div>

                <h2 className="stories-featured__title">{t(featuredStory.titleKey)}</h2>
                <p className="stories-featured__desc">{t(featuredStory.descriptionKey)}</p>

                <div className="stories-featured__offer">
                  <p className="stories-featured__offer-label">{t('stories-special-offer')}</p>
                  <p className="stories-featured__offer-text">{t(featuredStory.offerKey)}</p>
                </div>

                <div className="stories-featured__footer">
                  <span className="stories-featured__views">
                    <HeartIcon />
                    {featuredStory.views.toLocaleString(numberLocale)} {t('stories-views')}
                  </span>
                  <Link to="/promotions/spring-whitening" className="stories-featured__link">
                    {t('stories-learn-more')}
                    <ArrowRightIcon />
                  </Link>
                </div>
              </div>

              {/* Decorative Bubbles */}
              <div className="stories-featured__bubble" style={{ bottom: -20, right: -20, width: 70, height: 70, opacity: 0.6 }} />
              <div className="stories-featured__bubble" style={{ bottom: 10, right: 20, width: 40, height: 40, opacity: 0.4 }} />
              <div className="stories-featured__bubble" style={{ bottom: -10, right: 45, width: 25, height: 25, opacity: 0.5 }} />
            </div>
          </section>

          {/* Filter Tabs */}
          <section className="stories-filters">
            {STORY_FILTERS.map((filterKey, index) => (
              <button
                key={filterKey}
                type="button"
                onClick={() => setActiveFilter(index)}
                className={`stories-filter-btn ${activeFilter === index ? 'stories-filter-btn--active' : ''}`}
              >
                {t(filterKey)}
              </button>
            ))}
          </section>

          {/* Story Cards Grid */}
          <section className="stories-grid">
            {STORY_CARDS.map((story) => (
              <Link key={story.id} to={`/stories/${story.id}`} className="stories-card">
                {/* Card Image */}
                <div className="stories-card__image">
                  <OptimizedImage src={story.image} alt={t(story.titleKey)} loading="lazy" />
                  <span className="stories-card__tag">{t(story.tagKey)}</span>
                </div>

                {/* Card Content */}
                <div className="stories-card__content">
                  <div className="stories-card__meta">
                    <CalendarIcon />
                    <span>{t(story.dateKey)}</span>
                    <span className="stories-card__meta-dot" />
                    <span>{t(story.categoryKey)}</span>
                  </div>

                  <h3 className="stories-card__title">{t(story.titleKey)}</h3>
                  <p className="stories-card__excerpt">{t(story.excerptKey)}</p>

                  <div className="stories-card__footer">
                    <span className="stories-card__author">{story.author}</span>
                    <span className="stories-card__likes">
                      <HeartIcon filled />
                      {story.likes.toLocaleString(numberLocale)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </section>

          {/* Pagination */}
          <nav className="stories-pagination">
            <button
              type="button"
              className="stories-pagination__arrow"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              aria-label="Previous page"
            >
              <ChevronLeftIcon />
            </button>

            <div className="stories-pagination__pages">
              {[1, 2].map((page) => (
                <button
                  key={page}
                  type="button"
                  onClick={() => setCurrentPage(page)}
                  className={`stories-pagination__page ${currentPage === page ? 'stories-pagination__page--active' : ''}`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="stories-pagination__arrow"
              onClick={() => setCurrentPage(Math.min(2, currentPage + 1))}
              aria-label="Next page"
            >
              <ChevronRightIcon />
            </button>
          </nav>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Stories;
