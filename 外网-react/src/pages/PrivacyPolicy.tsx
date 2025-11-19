import { Navigation } from '../components/Navigation';
import { Footer } from '../components/Footer';
import { SEO } from '../components/SEO';

export const PrivacyPolicy = () => {
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
                Privacy Policy
              </h1>
              <p className="mt-4 text-lg text-neutral-600">
                Notice of Privacy Practices
              </p>
              <p className="mt-2 text-base text-neutral-500">
                Effective Date: January 1, 2025
              </p>
            </div>

            {/* Content */}
            <div className="prose prose-lg max-w-none">
              <div className="rounded-lg bg-white p-8 shadow-sm">

                {/* Introduction */}
                <section className="mb-8">
                  <p className="text-neutral-700 leading-relaxed">
                    This Notice of Privacy Practices describes how First Ave Dental & Orthodontics may use and disclose your protected health information (PHI) to carry out treatment, payment, or health care operations, and for other purposes permitted or required by law. It also describes your rights regarding your health information.
                  </p>
                  <p className="mt-3 text-neutral-700 leading-relaxed">
                    We are required by law to maintain the privacy and security of your protected health information, to notify you of our legal duties and privacy practices with respect to your health information, and to follow the terms of our current Notice of Privacy Practices.
                  </p>
                </section>

                {/* HIPAA Compliance Notice */}
                <section className="mb-8 rounded-lg bg-blue-50 p-6">
                  <h3 className="mb-3 text-xl font-semibold text-blue-900">HIPAA and California Law Compliance</h3>
                  <p className="text-blue-800 leading-relaxed">
                    First Ave Dental & Orthodontics complies with the Health Insurance Portability and Accountability Act (HIPAA) Privacy Rule and the California Confidentiality of Medical Information Act (CMIA). This notice outlines our obligations and your rights under these laws.
                  </p>
                </section>

                {/* 1. Information We Collect */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">1. Information We Collect</h2>

                  <h3 className="mb-2 text-xl font-semibold text-neutral-800">1.1 Protected Health Information (PHI)</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    We collect and maintain health information necessary to provide quality dental care, including:
                  </p>
                  <ul className="ml-6 space-y-2 text-neutral-700">
                    <li>• Personal identification (name, date of birth, address, phone number, email)</li>
                    <li>• Social Security number and insurance information</li>
                    <li>• Medical and dental history</li>
                    <li>• Current medications and allergies</li>
                    <li>• Treatment records, diagnosis, and clinical notes</li>
                    <li>• X-rays, photographs, and other diagnostic images</li>
                    <li>• Payment and billing information</li>
                    <li>• Emergency contact information</li>
                  </ul>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">1.2 Website and Online Information</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    When you use our website or online services, we may collect:
                  </p>
                  <ul className="ml-6 space-y-2 text-neutral-700">
                    <li>• Login credentials and account information</li>
                    <li>• Appointment scheduling information</li>
                    <li>• Communication preferences</li>
                    <li>• Device information and IP address</li>
                    <li>• Browser type and usage patterns</li>
                    <li>• Cookies and similar tracking technologies</li>
                  </ul>
                </section>

                {/* 2. How We Use Your Information */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">2. How We Use and Disclose Your Health Information</h2>

                  <h3 className="mb-2 text-xl font-semibold text-neutral-800">2.1 Treatment</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    We use your health information to provide dental treatment and services. This includes:
                  </p>
                  <ul className="ml-6 space-y-2 text-neutral-700">
                    <li>• Diagnosing and treating dental conditions</li>
                    <li>• Coordinating care with other healthcare providers</li>
                    <li>• Consulting with specialists about your care</li>
                    <li>• Obtaining pre-authorization for procedures</li>
                    <li>• Prescribing medications</li>
                  </ul>
                  <p className="mt-3 text-neutral-700 leading-relaxed">
                    <em>Example:</em> We may share your X-rays with an oral surgeon if you need a tooth extraction, or send treatment records to your general physician if requested.
                  </p>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">2.2 Payment</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    We use your information to obtain payment for services rendered, including:
                  </p>
                  <ul className="ml-6 space-y-2 text-neutral-700">
                    <li>• Billing you or your insurance company</li>
                    <li>• Submitting claims to your dental insurance</li>
                    <li>• Determining insurance eligibility and coverage</li>
                    <li>• Collecting outstanding balances</li>
                    <li>• Processing payment arrangements</li>
                  </ul>
                  <p className="mt-3 text-neutral-700 leading-relaxed">
                    <em>Example:</em> We send your treatment information to your insurance company to process claims and determine coverage.
                  </p>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">2.3 Health Care Operations</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    We may use your information to support our business operations, such as:
                  </p>
                  <ul className="ml-6 space-y-2 text-neutral-700">
                    <li>• Quality assessment and improvement activities</li>
                    <li>• Staff training and credentialing</li>
                    <li>• Auditing and compliance programs</li>
                    <li>• Business planning and management</li>
                    <li>• Patient satisfaction surveys</li>
                  </ul>
                  <p className="mt-3 text-neutral-700 leading-relaxed">
                    <em>Example:</em> We may review patient records to evaluate the quality of care provided by our dentists.
                  </p>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">2.4 Appointment Reminders and Communications</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    We may contact you to provide appointment reminders, treatment follow-ups, and information about services that may benefit you. We may contact you via phone, email, text message, or mail unless you opt out.
                  </p>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">2.5 Other Uses Requiring Authorization</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    Other uses and disclosures not described in this notice will be made only with your written authorization. You may revoke such authorization in writing at any time, except to the extent we have already taken action in reliance on it.
                  </p>
                </section>

                {/* 3. Disclosures Without Authorization */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">3. Disclosures Without Your Authorization</h2>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    In certain situations, we may disclose your health information without your authorization as required or permitted by law:
                  </p>

                  <ul className="ml-6 space-y-3 text-neutral-700">
                    <li>
                      <strong>• Public Health Activities:</strong> Reporting communicable diseases, adverse reactions to medications, or suspected abuse/neglect to appropriate authorities.
                    </li>
                    <li>
                      <strong>• Health Oversight:</strong> Providing information to government agencies authorized to oversee the healthcare system, such as licensing boards or fraud investigators.
                    </li>
                    <li>
                      <strong>• Legal Proceedings:</strong> Responding to court orders, subpoenas, or other lawful requests in legal proceedings.
                    </li>
                    <li>
                      <strong>• Law Enforcement:</strong> Complying with law enforcement requests in specific circumstances, such as identifying suspects or reporting gunshot wounds.
                    </li>
                    <li>
                      <strong>• Worker's Compensation:</strong> Disclosing information necessary to process worker's compensation claims.
                    </li>
                    <li>
                      <strong>• Emergencies:</strong> Using or disclosing information to prevent serious threats to health or safety.
                    </li>
                    <li>
                      <strong>• Coroners and Funeral Directors:</strong> Providing information to coroners, medical examiners, or funeral directors as necessary.
                    </li>
                  </ul>
                </section>

                {/* 4. Your Privacy Rights */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">4. Your Rights Regarding Your Health Information</h2>

                  <h3 className="mb-2 text-xl font-semibold text-neutral-800">4.1 Right to Inspect and Copy</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    You have the right to inspect and obtain a copy of your health information, including dental records and billing records. To request copies, submit a written request to our Privacy Officer. We may charge a reasonable fee for copying and mailing records as permitted by California law.
                  </p>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">4.2 Right to Amend</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    If you believe information in your records is incorrect or incomplete, you may request that we amend it. Your request must be in writing and include the reason for the amendment. We may deny your request in certain circumstances, such as when the information is accurate and complete.
                  </p>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">4.3 Right to an Accounting of Disclosures</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    You have the right to request an accounting of certain disclosures of your health information made by our practice. This does not include disclosures for treatment, payment, or healthcare operations. Submit your request in writing to our Privacy Officer.
                  </p>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">4.4 Right to Request Restrictions</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    You have the right to request restrictions on how we use or disclose your health information. We are not required to agree to your request except in cases where you pay out-of-pocket in full and request that we not disclose information to your health plan for payment purposes.
                  </p>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">4.5 Right to Confidential Communications</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    You may request that we communicate with you about your health information by alternative means or at alternative locations. For example, you may request that we contact you only at work or via a specific email address. We will accommodate reasonable requests.
                  </p>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">4.6 Right to a Paper Copy</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    You have the right to obtain a paper copy of this Notice of Privacy Practices at any time, even if you have agreed to receive it electronically. You may request a copy from any of our office locations.
                  </p>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">4.7 Right to Notification of Breach</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    You have the right to be notified if there is a breach of your unsecured protected health information. We will notify you in writing within 60 days of discovering such a breach.
                  </p>
                </section>

                {/* 5. Security Measures */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">5. How We Protect Your Information</h2>

                  <h3 className="mb-2 text-xl font-semibold text-neutral-800">5.1 Physical Safeguards</h3>
                  <ul className="ml-6 space-y-2 text-neutral-700">
                    <li>• Secure storage of paper records in locked filing cabinets</li>
                    <li>• Restricted access to areas containing patient records</li>
                    <li>• Proper disposal of records through shredding</li>
                    <li>• Secure facilities with controlled access</li>
                  </ul>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">5.2 Technical Safeguards</h3>
                  <ul className="ml-6 space-y-2 text-neutral-700">
                    <li>• Encrypted electronic health records systems</li>
                    <li>• Secure, password-protected computer systems</li>
                    <li>• Firewalls and anti-virus protection</li>
                    <li>• Regular security assessments and updates</li>
                    <li>• Automatic logoff of inactive sessions</li>
                    <li>• Secure data backup and recovery systems</li>
                  </ul>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">5.3 Administrative Safeguards</h3>
                  <ul className="ml-6 space-y-2 text-neutral-700">
                    <li>• Staff training on HIPAA and privacy practices</li>
                    <li>• Written policies and procedures</li>
                    <li>• Business Associate Agreements with vendors</li>
                    <li>• Designated Privacy Officer and Security Officer</li>
                    <li>• Regular compliance audits</li>
                  </ul>
                </section>

                {/* 6. Website Privacy */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">6. Website Privacy and Cookies</h2>

                  <h3 className="mb-2 text-xl font-semibold text-neutral-800">6.1 Cookies and Tracking</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    Our website uses cookies and similar technologies to enhance your browsing experience, remember your preferences, and analyze site traffic. You can control cookie settings through your browser preferences.
                  </p>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">6.2 Third-Party Services</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    We may use third-party services such as Google Analytics to analyze website usage. These services may collect information about your use of our website. We ensure all third-party vendors sign Business Associate Agreements and comply with HIPAA requirements.
                  </p>

                  <h3 className="mb-2 mt-4 text-xl font-semibold text-neutral-800">6.3 Secure Communications</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    Our website uses SSL/TLS encryption to protect information transmitted between your browser and our servers. However, email is not a secure method of transmitting health information. Please use our secure patient portal for confidential communications.
                  </p>
                </section>

                {/* 7. Data Retention */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">7. Data Retention</h2>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    We retain patient records in accordance with California law and dental practice standards. Adult patient records are typically maintained for a minimum of 7 years from the date of last treatment. Records for minors are retained until the patient reaches age 19 or for 7 years from the date of last treatment, whichever is longer.
                  </p>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    When records are no longer needed, they are destroyed in a manner that protects confidentiality, such as shredding paper records and securely wiping electronic media.
                  </p>
                </section>

                {/* 8. Children's Privacy */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">8. Minors and Parental Access</h2>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    For patients under 18 years of age, parents or legal guardians generally have the right to access their child's health information. However, California law provides certain privacy rights to minors regarding sensitive services. We comply with all applicable state and federal laws regarding minors' privacy rights.
                  </p>
                </section>

                {/* 9. California Privacy Rights */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">9. California Privacy Rights (CCPA/CPRA)</h2>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    California residents have additional rights under the California Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA), including:
                  </p>
                  <ul className="ml-6 space-y-2 text-neutral-700">
                    <li>• Right to know what personal information is collected</li>
                    <li>• Right to know if personal information is sold or shared</li>
                    <li>• Right to opt-out of the sale or sharing of personal information</li>
                    <li>• Right to request deletion of personal information</li>
                    <li>• Right to correct inaccurate personal information</li>
                    <li>• Right to limit use of sensitive personal information</li>
                    <li>• Right to non-discrimination for exercising privacy rights</li>
                  </ul>
                  <p className="mt-3 text-neutral-700 leading-relaxed">
                    Note: We do not sell patient health information. Health information regulated by HIPAA is generally exempt from CCPA/CPRA, but we respect all California privacy rights.
                  </p>
                </section>

                {/* 10. Changes to Privacy Policy */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">10. Changes to This Privacy Policy</h2>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    We reserve the right to change our privacy practices and this Notice of Privacy Practices. Any changes will apply to health information we already have as well as information we receive in the future. We will post the current notice in our offices and on our website. The effective date is noted at the top of the notice.
                  </p>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    If we make significant changes to our privacy practices, we will notify patients by mail or email and provide a revised notice at your next visit.
                  </p>
                </section>

                {/* 11. Complaints */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">11. Complaints and Questions</h2>

                  <h3 className="mb-2 text-xl font-semibold text-neutral-800">Filing a Complaint</h3>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    If you believe your privacy rights have been violated, you may file a complaint with our practice or with the U.S. Department of Health and Human Services. You will not be retaliated against for filing a complaint.
                  </p>

                  <div className="ml-6 mt-4 text-neutral-700">
                    <p className="mb-3"><strong>Contact Our Privacy Officer:</strong></p>
                    <p className="mb-1">First Ave Dental & Orthodontics</p>
                    <p className="mb-1">Privacy Officer</p>
                    <p className="mb-1">Email: privacy@firstavedentalortho.com</p>
                    <p className="mb-1">Phone: Available at any of our five locations</p>
                  </div>

                  <div className="ml-6 mt-4 text-neutral-700">
                    <p className="mb-3"><strong>Or File with the Federal Government:</strong></p>
                    <p className="mb-1">U.S. Department of Health and Human Services</p>
                    <p className="mb-1">Office for Civil Rights</p>
                    <p className="mb-1">Website: www.hhs.gov/ocr/privacy/hipaa/complaints</p>
                    <p className="mb-1">Phone: 1-877-696-6775</p>
                  </div>
                </section>

                {/* Contact Information */}
                <section className="mb-8">
                  <h2 className="mb-4 font-display text-2xl text-neutral-900">12. Contact Information</h2>
                  <p className="mb-3 text-neutral-700 leading-relaxed">
                    For questions about this Privacy Policy or to exercise your rights:
                  </p>
                  <div className="ml-6 text-neutral-700">
                    <p className="mb-2"><strong>First Ave Dental & Orthodontics</strong></p>
                    <p className="mb-1">Privacy Officer</p>
                    <p className="mb-1">Email: privacy@firstavedentalortho.com</p>
                    <p className="mb-1">General Email: info@firstavedentalortho.com</p>
                    <p className="mb-1">Locations: Arcadia, Rowland Heights, Irvine, South Pasadena, Eastvale</p>
                  </div>
                </section>

                {/* Acknowledgment */}
                <section className="mt-8 rounded-lg bg-neutral-50 p-6">
                  <p className="mb-3 text-sm text-neutral-600 font-semibold">
                    Acknowledgment of Receipt
                  </p>
                  <p className="text-sm text-neutral-600">
                    You will be asked to acknowledge receipt of this Notice of Privacy Practices at your first visit or when significant changes are made. Your signature acknowledges that you have been provided with a copy of this notice.
                  </p>
                  <p className="mt-4 text-sm text-neutral-600 italic">
                    This Notice of Privacy Practices is effective as of January 1, 2025, and complies with the Health Insurance Portability and Accountability Act (HIPAA) Privacy Rule (45 CFR Part 160 and Part 164, Subparts A and E) and the California Confidentiality of Medical Information Act (CMIA).
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
