import { useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { SEO } from '../components/SEO';
import { OptimizedImage } from '../components/OptimizedImage';
import { useLanguage, type TranslationKey } from '../context/LanguageContext';

// ============================================================
// DATA
// ============================================================

type StoryDetailData = {
  id: string;
  titleKey: TranslationKey;
  excerptKey: TranslationKey;
  author: string;
  dateKey: TranslationKey;
  categoryKey: TranslationKey;
  tagKey: TranslationKey;
  image: string;
  heroImage: string;
  likes: number;
  readingTime: string;
  contentParagraphs: TranslationKey[];
  quote?: TranslationKey;
};

const STORY_DETAILS: StoryDetailData[] = [
  {
    id: 'dental-anxiety',
    titleKey: 'stories-card-anxiety-title',
    excerptKey: 'stories-card-anxiety-excerpt',
    author: 'Emily R.',
    dateKey: 'stories-date-jun-8-2024',
    categoryKey: 'stories-category-general',
    tagKey: 'stories-tag-deep-cleaning',
    image: '/images/service1.jpg',
    heroImage: '/images/service1.jpg',
    likes: 1205,
    readingTime: '5 min read',
    contentParagraphs: [
      'story-anxiety-p1',
      'story-anxiety-p2',
      'story-anxiety-p3',
      'story-anxiety-p4',
      'story-anxiety-p5'
    ],
    quote: 'story-anxiety-quote'
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
    heroImage: '/images/forest4.jpg',
    likes: 3420,
    readingTime: '6 min read',
    contentParagraphs: [
      'story-invisalign-p1',
      'story-invisalign-p2',
      'story-invisalign-p3',
      'story-invisalign-p4',
      'story-invisalign-p5'
    ],
    quote: 'story-invisalign-quote'
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
    heroImage: '/images/cosmetic-carousel-4.jpg',
    likes: 4521,
    readingTime: '5 min read',
    contentParagraphs: [
      'story-veneers-p1',
      'story-veneers-p2',
      'story-veneers-p3',
      'story-veneers-p4',
      'story-veneers-p5'
    ],
    quote: 'story-veneers-quote'
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
    heroImage: '/images/root-canal-carousel-2.jpg',
    likes: 892,
    readingTime: '4 min read',
    contentParagraphs: [
      'story-rootcanal-p1',
      'story-rootcanal-p2',
      'story-rootcanal-p3',
      'story-rootcanal-p4'
    ],
    quote: 'story-rootcanal-quote'
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
    heroImage: '/images/cosmetic-carousel-3.jpg',
    likes: 5678,
    readingTime: '4 min read',
    contentParagraphs: [
      'story-whitening-p1',
      'story-whitening-p2',
      'story-whitening-p3',
      'story-whitening-p4'
    ],
    quote: 'story-whitening-quote'
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
    heroImage: '/images/family.jpg',
    likes: 2134,
    readingTime: '5 min read',
    contentParagraphs: [
      'story-family-p1',
      'story-family-p2',
      'story-family-p3',
      'story-family-p4',
      'story-family-p5'
    ],
    quote: 'story-family-quote'
  }
];

// ============================================================
// ICONS
// ============================================================

const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <rect x="2" y="3.5" width="12" height="10" rx="2" stroke="#9A8A7C" strokeWidth="1.2" />
    <path d="M2 6.5h12" stroke="#9A8A7C" strokeWidth="1.2" />
    <path d="M5 2v2M11 2v2" stroke="#9A8A7C" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

const HeartIcon = ({ filled = false }: { filled?: boolean }) => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
    <path
      d="M9 16s-6-4-6-8a3.5 3.5 0 0 1 6-2.5A3.5 3.5 0 0 1 15 8c0 4-6 8-6 8z"
      fill={filled ? '#E8A0A0' : 'none'}
      stroke="#D4A0A0"
      strokeWidth="1.3"
    />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M14 9H4M8 5l-4 4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const ClockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="8" cy="8" r="6" stroke="#9A8A7C" strokeWidth="1.2" />
    <path d="M8 4v4l2.5 2.5" stroke="#9A8A7C" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ============================================================
// COMPONENTS
// ============================================================

export const StoryDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { t, currentLanguage } = useLanguage();
  const numberLocale = currentLanguage === 'zh' ? 'zh-CN' : 'en-US';

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  }, [id]);

  const story = STORY_DETAILS.find((s) => s.id === id);

  if (!story) {
    return <Navigate to="/stories" replace />;
  }

  // Get related stories (same category first, then fill with others, excluding current, always 3 cards)
  let relatedStories = STORY_DETAILS.filter(
    (s) => s.categoryKey === story.categoryKey && s.id !== story.id
  );

  // If less than 3, fill with other stories
  if (relatedStories.length < 3) {
    const otherStories = STORY_DETAILS.filter(
      (s) => s.categoryKey !== story.categoryKey && s.id !== story.id
    );
    relatedStories = [...relatedStories, ...otherStories];
  }

  relatedStories = relatedStories.slice(0, 3);

  return (
    <>
      <SEO
        title={`${t(story.titleKey)} | Patient Stories`}
        description={t(story.excerptKey)}
        keywords={`dental patient story, ${t(story.categoryKey)}, ${t(story.tagKey)}`}
        ogTitle={t(story.titleKey)}
        ogDescription={t(story.excerptKey)}
        ogImage={story.heroImage}
      />

      <div style={{ minHeight: '100vh', backgroundColor: '#FDFBF8', position: 'relative' }}>
        {/* Decorative dots - left side (brown/beige) */}
        <div style={{ position: 'absolute', left: '28px', top: '180px', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'rgba(200, 180, 170, 0.5)', zIndex: 0 }} />
        <div style={{ position: 'absolute', left: '45px', top: '320px', width: '14px', height: '14px', borderRadius: '50%', backgroundColor: 'rgba(200, 180, 170, 0.4)', zIndex: 0 }} />
        <div style={{ position: 'absolute', left: '20px', top: '480px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'rgba(200, 180, 170, 0.35)', zIndex: 0 }} />
        <div style={{ position: 'absolute', left: '35px', top: '650px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'rgba(200, 180, 170, 0.4)', zIndex: 0 }} />
        <div style={{ position: 'absolute', left: '18px', top: '820px', width: '19px', height: '19px', borderRadius: '50%', backgroundColor: 'rgba(200, 180, 170, 0.35)', zIndex: 0 }} />

        {/* Decorative dots - right side (yellow/orange) */}
        <div style={{ position: 'absolute', right: '50px', top: '250px', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'rgba(245, 220, 180, 0.5)', zIndex: 0 }} />
        <div style={{ position: 'absolute', right: '30px', top: '400px', width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'rgba(245, 220, 180, 0.4)', zIndex: 0 }} />
        <div style={{ position: 'absolute', right: '65px', top: '540px', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: 'rgba(245, 220, 180, 0.35)', zIndex: 0 }} />
        <div style={{ position: 'absolute', right: '40px', top: '720px', width: '17px', height: '17px', borderRadius: '50%', backgroundColor: 'rgba(245, 220, 180, 0.45)', zIndex: 0 }} />
        <div style={{ position: 'absolute', right: '55px', top: '880px', width: '15px', height: '15px', borderRadius: '50%', backgroundColor: 'rgba(245, 220, 180, 0.4)', zIndex: 0 }} />

        <Navigation variant="plain" />

        <main style={{ position: 'relative', zIndex: 1 }}>
          {/* Hero Image */}
          <section style={{ position: 'relative', marginTop: '24px' }}>
            <div style={{
              position: 'relative',
              height: '460px',
              overflow: 'hidden'
            }}>
              <OptimizedImage
                src={story.heroImage}
                alt={t(story.titleKey)}
                loading="eager"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover'
                }}
              />
              {/* Gradient overlay */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.4) 100%)'
              }} />

              {/* Back Button - floating on hero image, left side */}
              <Link
                to="/stories"
                style={{
                  position: 'absolute',
                  left: '24px',
                  top: '24px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: 500,
                  textDecoration: 'none',
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  padding: '8px 16px',
                  borderRadius: '20px',
                  backdropFilter: 'blur(8px)',
                  transition: 'background-color 0.2s',
                  zIndex: 2
                }}
              >
                <ArrowLeftIcon />
                {t('story-back-to-stories')}
              </Link>

              {/* Tag badge */}
              <span style={{
                position: 'absolute',
                right: '24px',
                top: '24px',
                borderRadius: '9999px',
                backgroundColor: 'rgba(255,255,255,0.95)',
                padding: '6px 18px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#5C5248',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                {t(story.tagKey)}
              </span>
            </div>
          </section>

          {/* Article Title and Info */}
          <header style={{ maxWidth: '720px', margin: '48px auto 0', padding: '0 24px', display: 'block' }}>
            {/* Title - left aligned */}
            <h1 style={{
              fontFamily: 'var(--font-display, Playfair Display, serif)',
              fontSize: '52px',
              fontWeight: 400,
              lineHeight: 1.2,
              color: '#2D2926',
              margin: 0,
              textAlign: 'left'
            }}>
              {t(story.titleKey)}
            </h1>

            {/* Article Info - below title, left aligned */}
            <div style={{
              marginTop: '24px',
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
              paddingBottom: '20px',
              borderBottom: '1px solid #E8E3DD'
            }}>
              <span style={{ fontSize: '14px', color: '#2D2926', fontWeight: 500 }}>
                {story.author}
              </span>
              <span style={{ color: '#CCC5BE' }}>•</span>
              <span style={{ fontSize: '13px', color: '#7A9A7E', fontWeight: 500 }}>
                {t(story.categoryKey)}
              </span>
              <span style={{ color: '#CCC5BE' }}>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#9A8A7C' }}>
                <CalendarIcon />
                {t(story.dateKey)}
              </span>
              <span style={{ color: '#CCC5BE' }}>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#9A8A7C' }}>
                <ClockIcon />
                {story.readingTime}
              </span>
            </div>
          </header>

          {/* Article Content */}
          <article style={{ maxWidth: '720px', margin: '48px auto 0', padding: '0 24px 64px' }}>
            {story.contentParagraphs.map((paragraphKey, index) => (
              <p
                key={paragraphKey}
                style={{
                  fontSize: '16px',
                  lineHeight: 1.8,
                  color: '#4A3F38',
                  marginTop: index === 0 ? 0 : '24px',
                  marginBottom: 0
                }}
              >
                {t(paragraphKey)}
              </p>
            ))}

            {/* Quote Block */}
            {story.quote && (
              <blockquote style={{
                marginTop: '40px',
                marginBottom: '40px',
                padding: '32px',
                backgroundColor: 'rgba(202, 229, 208, 0.15)',
                borderLeft: '4px solid #7A9A7E',
                borderRadius: '12px'
              }}>
                <p style={{
                  fontSize: '20px',
                  lineHeight: 1.6,
                  color: '#3D2F29',
                  fontStyle: 'italic',
                  margin: 0
                }}>
                  "{t(story.quote)}"
                </p>
              </blockquote>
            )}

            {/* Article End - Likes counter at bottom right */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: '40px'
            }}>
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                color: '#D4A0A0',
                fontWeight: 500
              }}>
                <HeartIcon filled />
                {story.likes.toLocaleString(numberLocale)}
              </span>
            </div>
          </article>

          {/* Related Stories */}
          {relatedStories.length > 0 && (
            <section style={{
              backgroundColor: '#F9F6F2',
              padding: '64px 24px',
              marginTop: '64px'
            }}>
              <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                <h2 style={{
                  fontFamily: 'var(--font-display, Playfair Display, serif)',
                  fontSize: '36px',
                  fontWeight: 400,
                  textAlign: 'center',
                  color: '#2D2926',
                  marginBottom: '48px'
                }}>
                  {t('story-more-stories')}
                </h2>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '28px'
                }}>
                  {relatedStories.map((relatedStory) => (
                    <Link
                      key={relatedStory.id}
                      to={`/stories/${relatedStory.id}`}
                      style={{
                        textDecoration: 'none',
                        color: 'inherit',
                        display: 'block',
                        overflow: 'hidden',
                        borderRadius: '20px',
                        backgroundColor: 'white',
                        boxShadow: '0 4px 30px rgba(0,0,0,0.06)',
                        transition: 'transform 0.3s, box-shadow 0.3s'
                      }}
                    >
                      <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
                        <OptimizedImage
                          src={relatedStory.image}
                          alt={t(relatedStory.titleKey)}
                          loading="lazy"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <span style={{
                          position: 'absolute',
                          right: '16px',
                          top: '16px',
                          borderRadius: '9999px',
                          backgroundColor: 'rgba(255,255,255,0.95)',
                          padding: '4px 14px',
                          fontSize: '11px',
                          fontWeight: 500,
                          color: '#5C5248',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                        }}>
                          {t(relatedStory.tagKey)}
                        </span>
                      </div>
                      <div style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#9A8A7C' }}>
                          <CalendarIcon />
                          <span>{t(relatedStory.dateKey)}</span>
                          <span style={{ color: '#CCC5BE' }}>•</span>
                          <span>{t(relatedStory.categoryKey)}</span>
                        </div>
                        <h3 style={{
                          marginTop: '12px',
                          fontFamily: 'var(--font-display, Playfair Display, serif)',
                          fontSize: '18px',
                          fontWeight: 400,
                          lineHeight: 1.4,
                          color: '#2D2926',
                          marginBottom: 0
                        }}>
                          {t(relatedStory.titleKey)}
                        </h3>
                        <p style={{ marginTop: '8px', fontSize: '13px', lineHeight: 1.6, color: '#7A6E64', marginBottom: 0 }}>
                          {t(relatedStory.excerptKey)}
                        </p>
                        <div style={{
                          marginTop: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderTop: '1px solid #F2EDE8',
                          paddingTop: '16px'
                        }}>
                          <span style={{ fontSize: '13px', fontWeight: 500, color: '#5C5248' }}>
                            {relatedStory.author}
                          </span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#D4A0A0' }}>
                            <HeartIcon filled />
                            {relatedStory.likes.toLocaleString(numberLocale)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Decorative bubbles */}
                <div style={{ position: 'relative', marginTop: '48px' }}>
                  <div style={{
                    position: 'absolute',
                    bottom: '-30px',
                    right: '10%',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(202, 229, 208, 0.5)',
                    pointerEvents: 'none',
                    zIndex: 0
                  }} />
                  <div style={{
                    position: 'absolute',
                    bottom: '-10px',
                    right: '15%',
                    width: '35px',
                    height: '35px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(202, 229, 208, 0.35)',
                    pointerEvents: 'none',
                    zIndex: 0
                  }} />
                </div>
              </div>
            </section>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
};

export default StoryDetail;
