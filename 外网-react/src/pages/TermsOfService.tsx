import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { SEO } from '../components/SEO';

export const TermsOfService = () => {
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
                Terms of Service
              </h1>
              <p className="mt-4 text-lg text-neutral-600">
                Effective Date: January 1, 2025
              </p>
            </div>

            {/* Content */}
            <div className="prose prose-lg max-w-none">
              <div className="rounded-lg bg-white p-8 shadow-sm">

                {/* Introduction */}
                <section className="mb-8">
                  <p className="text-neutral-700 leading-relaxed">
                    Welcome to First Ave Dental & Orthodontics. These Terms of Service ("Terms") govern your relationship with our dental practice and use of our services, including our website and online appointment scheduling system. By scheduling an appointment or using our services, you agree to comply with and be bound by these Terms.
                  </p>
                </section>

                {/* 1. Services Provided */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">1. Services Provided</h2>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    First Ave Dental & Orthodontics offers comprehensive dental care services, including but not limited to:
                  </p>
                  <ul className="ml-6 space-y-2 text-neutral-700">
                    <li>• General and preventive dental care (cleanings, examinations, fillings)</li>
                    <li>• Cosmetic dentistry (teeth whitening, veneers, bonding)</li>
                    <li>• Orthodontic treatment (traditional braces, clear aligners)</li>
                    <li>• Restorative procedures (crowns, bridges, implants)</li>
                    <li>• Root canal therapy and endodontic treatment</li>
                    <li>• Periodontal care and gum disease treatment</li>
                    <li>• Oral surgery and tooth extractions</li>
                    <li>• Emergency dental services</li>
                  </ul>
                  <p className="mt-3 text-neutral-700 leading-relaxed">
                    All services are performed by licensed dental professionals in accordance with California state regulations and industry standards.
                  </p>
                </section>

                {/* 2. Appointment Scheduling */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">2. Appointment Scheduling and Cancellation</h2>

                  <h3 className="mb-2 text-xl font-semibold text-neutral-800">2.1 Scheduling</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    Appointments may be scheduled through our online booking system, by telephone, or in person at any of our five locations. When booking online, you will receive a confirmation email. Please verify all appointment details for accuracy.
                  </p>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">2.2 Cancellation Policy</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    We understand that schedules change. If you need to cancel or reschedule an appointment, please provide at least 24 hours advance notice. Cancellations made with less than 24 hours notice may be subject to a cancellation fee of up to $75, depending on the type of appointment.
                  </p>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">2.3 No-Show Policy</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    Patients who fail to attend a scheduled appointment without prior notice ("no-show") may be charged a no-show fee. Repeated no-shows may result in dismissal from our practice and difficulty scheduling future appointments.
                  </p>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">2.4 Late Arrivals</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    Please arrive 10-15 minutes before your scheduled appointment time for check-in. Patients arriving more than 15 minutes late may need to reschedule to ensure adequate time for treatment and consideration of other patients' appointments.
                  </p>
                </section>

                {/* 3. Payment and Insurance */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">3. Payment Terms and Insurance</h2>

                  <h3 className="mb-2 text-xl font-semibold text-neutral-800">3.1 Payment Responsibility</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    Payment for services is due at the time treatment is provided unless prior financial arrangements have been made. We accept cash, credit cards (Visa, Mastercard, American Express, Discover), debit cards, and electronic payment methods.
                  </p>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">3.2 Insurance</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    We accept most major dental insurance plans. As a courtesy, we will submit claims to your insurance provider on your behalf. However, you are ultimately responsible for all charges, regardless of insurance coverage. Any portion not covered by insurance is your responsibility and is due at the time of service.
                  </p>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">3.3 Treatment Estimates</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    We provide treatment cost estimates based on available information. These are estimates only and not guarantees of final cost. Actual costs may vary based on treatment complexity, additional procedures required, or insurance coverage determinations.
                  </p>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">3.4 Outstanding Balances</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    Accounts with outstanding balances for more than 90 days may be referred to a collection agency. You will be responsible for all collection costs, including attorney fees and court costs.
                  </p>
                </section>

                {/* 4. Patient Responsibilities */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">4. Patient Responsibilities</h2>

                  <h3 className="mb-2 text-xl font-semibold text-neutral-800">4.1 Accurate Information</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    You agree to provide complete and accurate personal, medical, and insurance information. You must notify us promptly of any changes to this information, including address, phone number, insurance coverage, or medical conditions.
                  </p>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">4.2 Medical History</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    You must disclose your complete medical history, including all medications, allergies, previous dental work, and existing health conditions. Failure to provide accurate medical information may compromise treatment safety and effectiveness.
                  </p>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">4.3 Treatment Compliance</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    You are responsible for following post-treatment instructions, taking prescribed medications as directed, and attending follow-up appointments. Failure to comply with treatment recommendations may affect outcomes and void warranties on dental work.
                  </p>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">4.4 Minors</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    For patients under 18 years of age, a parent or legal guardian must accompany the minor to appointments and sign all necessary consent forms. The accompanying adult is responsible for payment of all charges.
                  </p>
                </section>

                {/* 5. Consent and Treatment */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">5. Informed Consent and Treatment Authorization</h2>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    Before receiving treatment, you will be informed of the nature of the procedure, expected benefits, potential risks, alternative treatments, and consequences of no treatment. You have the right to ask questions and receive clear answers before consenting to any procedure.
                  </p>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    By proceeding with treatment, you acknowledge that you have been fully informed and consent to the proposed dental care. You understand that dentistry is not an exact science and acknowledge that no guarantees have been made regarding treatment outcomes.
                  </p>
                </section>

                {/* 6. Emergency Treatment */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">6. Emergency Dental Care</h2>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    We provide emergency dental services during regular business hours. For after-hours emergencies, please call our office phone number for instructions. In case of a life-threatening emergency, call 911 or proceed to the nearest emergency room immediately.
                  </p>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    Emergency appointments may require different payment terms and may not be eligible for online scheduling. Emergency treatment may be limited to pain relief and stabilization, with comprehensive treatment scheduled for a later date.
                  </p>
                </section>

                {/* 7. Records and Privacy */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">7. Medical Records and Privacy</h2>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    Your dental and medical records are maintained in accordance with HIPAA (Health Insurance Portability and Accountability Act) regulations and California state law. For detailed information about how we collect, use, and protect your personal health information, please review our Privacy Policy.
                  </p>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    You have the right to access your dental records. Requests for copies of records must be submitted in writing and may be subject to reasonable copying fees as permitted by law.
                  </p>
                </section>

                {/* 8. Online Services and Website Use */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">8. Online Services and Website Use</h2>

                  <h3 className="mb-2 text-xl font-semibold text-neutral-800">8.1 Account Security</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    If you create an account on our website, you are responsible for maintaining the confidentiality of your login credentials. You agree to notify us immediately of any unauthorized access to your account.
                  </p>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">8.2 Acceptable Use</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    You may not use our website or online services for any unlawful purpose or in any way that could damage, disable, overburden, or impair our systems. You may not attempt to gain unauthorized access to any portion of our systems or services.
                  </p>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">8.3 Accuracy of Information</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    While we strive to provide accurate information on our website, we do not warrant that all content is current, complete, or error-free. Information on our website is for general informational purposes and should not replace professional dental advice.
                  </p>
                </section>

                {/* 9. Limitations of Liability */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">9. Limitation of Liability</h2>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    To the fullest extent permitted by law, First Ave Dental & Orthodontics shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or related to your use of our services or website.
                  </p>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    Our liability is limited to the amount paid by you for the specific service giving rise to the claim. This limitation applies regardless of the legal theory upon which the claim is based.
                  </p>
                </section>

                {/* 10. Professional Conduct */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">10. Professional Standards</h2>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    All dental care is provided by licensed professionals who adhere to the ethical standards established by the American Dental Association (ADA) and the California Dental Association (CDA). Our dentists maintain active licenses with the California Dental Board.
                  </p>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    We maintain a professional environment and expect mutual respect between staff and patients. We reserve the right to refuse service or dismiss patients who engage in abusive, threatening, or inappropriate behavior.
                  </p>
                </section>

                {/* 11. Modifications to Terms */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">11. Changes to Terms of Service</h2>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    We reserve the right to modify these Terms of Service at any time. Changes will be effective immediately upon posting to our website. Your continued use of our services after changes are posted constitutes acceptance of the modified terms.
                  </p>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    We will notify patients of significant changes via email or notices posted in our offices. We encourage you to review these Terms periodically.
                  </p>
                </section>

                {/* 12. Governing Law */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">12. Governing Law and Dispute Resolution</h2>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    These Terms are governed by the laws of the State of California, without regard to its conflict of law provisions. Any disputes arising from these Terms or your relationship with our practice shall be resolved in the state or federal courts located in Los Angeles County, California.
                  </p>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    In the event of a dispute, we encourage patients to first contact our practice manager to attempt an informal resolution before pursuing legal action.
                  </p>
                </section>

                {/* 13. Severability */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">13. Severability</h2>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that the remaining provisions remain in full force and effect.
                  </p>
                </section>

                {/* Contact Information */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">14. Contact Information</h2>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    If you have questions about these Terms of Service, please contact us:
                  </p>
                  <div className="ml-6 text-neutral-700">
                    <p className="mb-2"><strong>First Ave Dental & Orthodontics</strong></p>
                    <p className="mb-1">Email: info@firstavedentalortho.com</p>
                    <p className="mb-1">Phone: Available at any of our five locations</p>
                    <p className="mb-1">Locations: Arcadia, Rowland Heights, Irvine, South Pasadena, Eastvale</p>
                  </div>
                </section>

                {/* Acknowledgment */}
                <section className="mt-8 rounded-lg bg-neutral-50 p-6">
                  <p className="text-sm text-neutral-600 italic">
                    By scheduling an appointment or using our services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                  </p>
                  <p className="mt-2 text-sm text-neutral-600 italic">
                    Last Updated: January 1, 2025
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
