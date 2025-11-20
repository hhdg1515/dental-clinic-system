import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { SEO } from '../components/SEO';
import { useLanguage } from '../context/LanguageContext';

export const TermsOfService = () => {
  const { t } = useLanguage();

  return (
    <>
      <SEO
        title="Terms of Service | First Ave Dental & Orthodontics"
        description="Terms and conditions for using First Ave Dental & Orthodontics services. Learn about our patient policies, appointment procedures, and service agreements."
        keywords="dental terms of service, patient policies, dental care agreement, appointment terms, California dental practice"
      />
      <div className="flex min-h-screen flex-col">
        <Navigation />

        <main className="flex-1 bg-surface-base py-16 sm:py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-12 text-center">
              <h1 className="font-display text-4xl text-neutral-900 sm:text-5xl">
                {t('terms-title')}
              </h1>
              <p className="mt-4 text-lg text-neutral-600">
                {t('terms-effective')}
              </p>
            </div>

            {/* Content */}
            <div className="prose prose-lg max-w-none">
              <div className="rounded-lg bg-white p-8 shadow-sm">

                {/* Introduction */}
                <section className="mb-8">
                  <p className="text-neutral-700 leading-relaxed">
                    {t('terms-intro')}
                  </p>
                </section>

                {/* 1. Services Provided */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">{t('terms-section1-title')}</h2>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('terms-section1-intro')}
                  </p>
                  <ul className="ml-6 space-y-2 text-neutral-700">
                    <li>{t('terms-section1-item1')}</li>
                    <li>{t('terms-section1-item2')}</li>
                    <li>{t('terms-section1-item3')}</li>
                    <li>{t('terms-section1-item4')}</li>
                    <li>{t('terms-section1-item5')}</li>
                    <li>{t('terms-section1-item6')}</li>
                    <li>{t('terms-section1-item7')}</li>
                    <li>{t('terms-section1-item8')}</li>
                  </ul>
                  <p className="mt-3 text-neutral-700 leading-relaxed">
                    {t('terms-section1-note')}
                  </p>
                </section>

                {/* 2. Appointment Scheduling */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">{t('terms-section2-title')}</h2>

                  <h3 className="mb-2 text-xl font-semibold text-neutral-800">{t('terms-section2-1-title')}</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('terms-section2-1-desc')}
                  </p>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">{t('terms-section2-2-title')}</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('terms-section2-2-desc')}
                  </p>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">{t('terms-section2-3-title')}</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('terms-section2-3-desc')}
                  </p>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">{t('terms-section2-4-title')}</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('terms-section2-4-desc')}
                  </p>
                </section>

                {/* 3. Payment and Insurance */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">{t('terms-section3-title')}</h2>

                  <h3 className="mb-2 text-xl font-semibold text-neutral-800">{t('terms-section3-1-title')}</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('terms-section3-1-desc')}
                  </p>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">{t('terms-section3-2-title')}</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('terms-section3-2-desc')}
                  </p>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">{t('terms-section3-3-title')}</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('terms-section3-3-desc')}
                  </p>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">{t('terms-section3-4-title')}</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('terms-section3-4-desc')}
                  </p>
                </section>

                {/* 4. Patient Responsibilities */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">{t('terms-section4-title')}</h2>

                  <h3 className="mb-2 text-xl font-semibold text-neutral-800">{t('terms-section4-1-title')}</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('terms-section4-1-desc')}
                  </p>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">{t('terms-section4-2-title')}</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('terms-section4-2-desc')}
                  </p>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">{t('terms-section4-3-title')}</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('terms-section4-3-desc')}
                  </p>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">{t('terms-section4-4-title')}</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('terms-section4-4-desc')}
                  </p>
                </section>

                {/* 5. Consent and Treatment */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">{t('terms-section5-title')}</h2>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('terms-section5-p1')}
                  </p>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('terms-section5-p2')}
                  </p>
                </section>

                {/* 6. Emergency Treatment */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">{t('terms-section6-title')}</h2>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('terms-section6-p1')}
                  </p>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('terms-section6-p2')}
                  </p>
                </section>

                {/* 7. Records and Privacy */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">{t('terms-section7-title')}</h2>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('terms-section7-p1')}
                  </p>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('terms-section7-p2')}
                  </p>
                </section>

                {/* 8. Online Services and Website Use */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">{t('terms-section8-title')}</h2>

                  <h3 className="mb-2 text-xl font-semibold text-neutral-800">{t('terms-section8-1-title')}</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('terms-section8-1-desc')}
                  </p>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">{t('terms-section8-2-title')}</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('terms-section8-2-desc')}
                  </p>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">{t('terms-section8-3-title')}</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('terms-section8-3-desc')}
                  </p>
                </section>

                {/* 9. Limitations of Liability */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">{t('terms-section9-title')}</h2>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('terms-section9-p1')}
                  </p>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('terms-section9-p2')}
                  </p>
                </section>

                {/* 10. Professional Conduct */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">{t('terms-section10-title')}</h2>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('terms-section10-p1')}
                  </p>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('terms-section10-p2')}
                  </p>
                </section>

                {/* 11. Modifications to Terms */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">{t('terms-section11-title')}</h2>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('terms-section11-p1')}
                  </p>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('terms-section11-p2')}
                  </p>
                </section>

                {/* 12. Governing Law */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">{t('terms-section12-title')}</h2>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('terms-section12-p1')}
                  </p>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('terms-section12-p2')}
                  </p>
                </section>

                {/* 13. Severability */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">{t('terms-section13-title')}</h2>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('terms-section13-desc')}
                  </p>
                </section>

                {/* Contact Information */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">{t('terms-section14-title')}</h2>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    {t('terms-section14-intro')}
                  </p>
                  <div className="ml-6 text-neutral-700">
                    <p className="mb-2"><strong>{t('privacy-section11-practice-name')}</strong></p>
                    <p className="mb-1">{t('privacy-section12-general-email')}</p>
                    <p className="mb-1">{t('privacy-section11-phone')}</p>
                    <p className="mb-1">{t('privacy-section12-locations')}</p>
                  </div>
                </section>

                {/* Acknowledgment */}
                <section className="mt-8 rounded-lg bg-neutral-50 p-6">
                  <p className="text-sm text-neutral-600 italic">
                    {t('terms-acknowledgment-p1')}
                  </p>
                  <p className="mt-2 text-sm text-neutral-600 italic">
                    {t('terms-acknowledgment-p2')}
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
