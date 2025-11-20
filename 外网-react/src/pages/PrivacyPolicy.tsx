import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { SEO } from '../components/SEO';
import { useLanguage } from '../context/LanguageContext';

export const PrivacyPolicy = () => {
  const { t } = useLanguage();

  return (
    <>
      <SEO
        title="Privacy Policy | First Ave Dental & Orthodontics"
        description="Learn how First Ave Dental & Orthodontics protects your personal health information in compliance with HIPAA and California privacy laws."
        keywords="HIPAA privacy policy, dental privacy, patient confidentiality, health information security, California CMIA"
      />
      <div className="flex min-h-screen flex-col">
        <Navigation />

        <main className="flex-1 bg-surface-base py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-12 text-center">
              <h1 className="font-display text-4xl text-neutral-900 sm:text-5xl">
                {t('privacy-title')}
              </h1>
              <p className="mt-4 text-lg text-neutral-600">
                {t('privacy-subtitle')}
              </p>
              <p className="mt-2 text-base text-neutral-500">
                {t('privacy-effective')}
              </p>
            </div>

            {/* Content */}
            <div className="prose prose-lg max-w-none">
              <div className="rounded-lg bg-white p-8 shadow-sm">

                {/* Introduction */}
                <section className="mb-8">
                  <p className="text-neutral-700 leading-relaxed">
                    {t('privacy-intro-p1')}
                  </p>
                  <p className="mt-3 text-neutral-700 leading-relaxed">
                    {t('privacy-intro-p2')}
                  </p>
                </section>

                {/* HIPAA Compliance Notice */}
                <section className="mb-8 rounded-lg bg-blue-50 p-6">
                  <h3 className="mb-3 text-xl font-semibold text-blue-900">{t('privacy-hipaa-title')}</h3>
                  <p className="text-blue-800 leading-relaxed">
                    {t('privacy-hipaa-desc')}
                  </p>
                </section>

                {/* 1. Information We Collect */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">{t('privacy-section1-title')}</h2>

                  <h3 className="mb-2 text-xl font-semibold text-neutral-800">{t('privacy-section1-1-title')}</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('privacy-section1-1-intro')}
                  </p>
                  <ul className="ml-6 space-y-2 text-neutral-700">
                    <li>{t('privacy-section1-1-item1')}</li>
                    <li>{t('privacy-section1-1-item2')}</li>
                    <li>{t('privacy-section1-1-item3')}</li>
                    <li>{t('privacy-section1-1-item4')}</li>
                    <li>{t('privacy-section1-1-item5')}</li>
                    <li>{t('privacy-section1-1-item6')}</li>
                    <li>{t('privacy-section1-1-item7')}</li>
                    <li>{t('privacy-section1-1-item8')}</li>
                  </ul>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">{t('privacy-section1-2-title')}</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('privacy-section1-2-intro')}
                  </p>
                  <ul className="ml-6 space-y-2 text-neutral-700">
                    <li>{t('privacy-section1-2-item1')}</li>
                    <li>{t('privacy-section1-2-item2')}</li>
                    <li>{t('privacy-section1-2-item3')}</li>
                    <li>{t('privacy-section1-2-item4')}</li>
                    <li>{t('privacy-section1-2-item5')}</li>
                    <li>{t('privacy-section1-2-item6')}</li>
                  </ul>
                </section>

                {/* 2. How We Use Your Information */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">{t('privacy-section2-title')}</h2>

                  <h3 className="mb-2 text-xl font-semibold text-neutral-800">{t('privacy-section2-1-title')}</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('privacy-section2-1-intro')}
                  </p>
                  <ul className="ml-6 space-y-2 text-neutral-700">
                    <li>{t('privacy-section2-1-item1')}</li>
                    <li>{t('privacy-section2-1-item2')}</li>
                    <li>{t('privacy-section2-1-item3')}</li>
                    <li>{t('privacy-section2-1-item4')}</li>
                    <li>{t('privacy-section2-1-item5')}</li>
                  </ul>
                  <p className="mt-3 text-neutral-700 leading-relaxed">
                    <em>{t('privacy-section2-1-example')}</em>
                  </p>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">{t('privacy-section2-2-title')}</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('privacy-section2-2-intro')}
                  </p>
                  <ul className="ml-6 space-y-2 text-neutral-700">
                    <li>{t('privacy-section2-2-item1')}</li>
                    <li>{t('privacy-section2-2-item2')}</li>
                    <li>{t('privacy-section2-2-item3')}</li>
                    <li>{t('privacy-section2-2-item4')}</li>
                    <li>{t('privacy-section2-2-item5')}</li>
                  </ul>
                  <p className="mt-3 text-neutral-700 leading-relaxed">
                    <em>{t('privacy-section2-2-example')}</em>
                  </p>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">{t('privacy-section2-3-title')}</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('privacy-section2-3-intro')}
                  </p>
                  <ul className="ml-6 space-y-2 text-neutral-700">
                    <li>{t('privacy-section2-3-item1')}</li>
                    <li>{t('privacy-section2-3-item2')}</li>
                    <li>{t('privacy-section2-3-item3')}</li>
                    <li>{t('privacy-section2-3-item4')}</li>
                    <li>{t('privacy-section2-3-item5')}</li>
                  </ul>
                  <p className="mt-3 text-neutral-700 leading-relaxed">
                    <em>{t('privacy-section2-3-example')}</em>
                  </p>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">{t('privacy-section2-4-title')}</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('privacy-section2-4-desc')}
                  </p>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">{t('privacy-section2-5-title')}</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('privacy-section2-5-desc')}
                  </p>
                </section>

                {/* 3. Disclosures Without Authorization */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">{t('privacy-section3-title')}</h2>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('privacy-section3-intro')}
                  </p>

                  <ul className="ml-6 space-y-3 text-neutral-700">
                    <li>{t('privacy-section3-item1')}</li>
                    <li>{t('privacy-section3-item2')}</li>
                    <li>{t('privacy-section3-item3')}</li>
                    <li>{t('privacy-section3-item4')}</li>
                    <li>{t('privacy-section3-item5')}</li>
                    <li>{t('privacy-section3-item6')}</li>
                    <li>{t('privacy-section3-item7')}</li>
                  </ul>
                </section>

                {/* 4. Your Privacy Rights */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">{t('privacy-section4-title')}</h2>

                  <h3 className="mb-2 text-xl font-semibold text-neutral-800">{t('privacy-section4-1-title')}</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('privacy-section4-1-desc')}
                  </p>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">{t('privacy-section4-2-title')}</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('privacy-section4-2-desc')}
                  </p>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">{t('privacy-section4-3-title')}</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('privacy-section4-3-desc')}
                  </p>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">{t('privacy-section4-4-title')}</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('privacy-section4-4-desc')}
                  </p>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">{t('privacy-section4-5-title')}</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('privacy-section4-5-desc')}
                  </p>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">{t('privacy-section4-6-title')}</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('privacy-section4-6-desc')}
                  </p>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">{t('privacy-section4-7-title')}</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('privacy-section4-7-desc')}
                  </p>
                </section>

                {/* 5. Security Measures */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">{t('privacy-section5-title')}</h2>

                  <h3 className="mb-2 text-xl font-semibold text-neutral-800">{t('privacy-section5-1-title')}</h3>
                  <ul className="ml-6 space-y-2 text-neutral-700">
                    <li>{t('privacy-section5-1-item1')}</li>
                    <li>{t('privacy-section5-1-item2')}</li>
                    <li>{t('privacy-section5-1-item3')}</li>
                    <li>{t('privacy-section5-1-item4')}</li>
                  </ul>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">{t('privacy-section5-2-title')}</h3>
                  <ul className="ml-6 space-y-2 text-neutral-700">
                    <li>{t('privacy-section5-2-item1')}</li>
                    <li>{t('privacy-section5-2-item2')}</li>
                    <li>{t('privacy-section5-2-item3')}</li>
                    <li>{t('privacy-section5-2-item4')}</li>
                    <li>{t('privacy-section5-2-item5')}</li>
                    <li>{t('privacy-section5-2-item6')}</li>
                  </ul>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">{t('privacy-section5-3-title')}</h3>
                  <ul className="ml-6 space-y-2 text-neutral-700">
                    <li>{t('privacy-section5-3-item1')}</li>
                    <li>{t('privacy-section5-3-item2')}</li>
                    <li>{t('privacy-section5-3-item3')}</li>
                    <li>{t('privacy-section5-3-item4')}</li>
                    <li>{t('privacy-section5-3-item5')}</li>
                  </ul>
                </section>

                {/* 6. Website Privacy */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">{t('privacy-section6-title')}</h2>

                  <h3 className="mb-2 text-xl font-semibold text-neutral-800">{t('privacy-section6-1-title')}</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('privacy-section6-1-desc')}
                  </p>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">{t('privacy-section6-2-title')}</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('privacy-section6-2-desc')}
                  </p>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">{t('privacy-section6-3-title')}</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('privacy-section6-3-desc')}
                  </p>
                </section>

                {/* 7. Data Retention */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">{t('privacy-section7-title')}</h2>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('privacy-section7-p1')}
                  </p>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('privacy-section7-p2')}
                  </p>
                </section>

                {/* 8. Children's Privacy */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">{t('privacy-section8-title')}</h2>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('privacy-section8-desc')}
                  </p>
                </section>

                {/* 9. California Privacy Rights */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">{t('privacy-section9-title')}</h2>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('privacy-section9-intro')}
                  </p>
                  <ul className="ml-6 space-y-2 text-neutral-700">
                    <li>{t('privacy-section9-item1')}</li>
                    <li>{t('privacy-section9-item2')}</li>
                    <li>{t('privacy-section9-item3')}</li>
                    <li>{t('privacy-section9-item4')}</li>
                    <li>{t('privacy-section9-item5')}</li>
                    <li>{t('privacy-section9-item6')}</li>
                    <li>{t('privacy-section9-item7')}</li>
                  </ul>
                  <p className="mt-3 text-neutral-700 leading-relaxed">
                    {t('privacy-section9-note')}
                  </p>
                </section>

                {/* 10. Changes to Privacy Policy */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">{t('privacy-section10-title')}</h2>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('privacy-section10-p1')}
                  </p>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('privacy-section10-p2')}
                  </p>
                </section>

                {/* 11. Complaints */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">{t('privacy-section11-title')}</h2>

                  <h3 className="mb-2 text-xl font-semibold text-neutral-800">{t('privacy-section11-subtitle')}</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('privacy-section11-intro')}
                  </p>

                  <div className="ml-6 mt-4 text-neutral-700">
                    <p className="mb-3"><strong>{t('privacy-section11-contact-title')}</strong></p>
                    <p className="mb-1">{t('privacy-section11-practice-name')}</p>
                    <p className="mb-1">{t('privacy-section11-privacy-officer')}</p>
                    <p className="mb-1">{t('privacy-section11-email')}</p>
                    <p className="mb-1">{t('privacy-section11-phone')}</p>
                  </div>

                  <div className="ml-6 mt-4 text-neutral-700">
                    <p className="mb-3"><strong>{t('privacy-section11-federal-title')}</strong></p>
                    <p className="mb-1">{t('privacy-section11-hhs')}</p>
                    <p className="mb-1">{t('privacy-section11-ocr')}</p>
                    <p className="mb-1">{t('privacy-section11-website')}</p>
                    <p className="mb-1">{t('privacy-section11-hhs-phone')}</p>
                  </div>
                </section>

                {/* Contact Information */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">{t('privacy-section12-title')}</h2>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('privacy-section12-intro')}
                  </p>
                  <div className="ml-6 text-neutral-700">
                    <p className="mb-2"><strong>{t('privacy-section11-practice-name')}</strong></p>
                    <p className="mb-1">{t('privacy-section11-privacy-officer')}</p>
                    <p className="mb-1">{t('privacy-section11-email')}</p>
                    <p className="mb-1">{t('privacy-section12-general-email')}</p>
                    <p className="mb-1">{t('privacy-section12-locations')}</p>
                  </div>
                </section>

                {/* Acknowledgment */}
                <section className="mt-8 rounded-lg bg-neutral-50 p-6">
                  <p className="mb-3 text-sm text-neutral-600 font-semibold">
                    {t('privacy-acknowledgment-title')}
                  </p>
                  <p className="text-sm text-neutral-600">
                    {t('privacy-acknowledgment-p1')}
                  </p>
                  <p className="mt-4 text-sm text-neutral-600 italic">
                    {t('privacy-acknowledgment-p2')}
                  </p>
                </section>

              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};
