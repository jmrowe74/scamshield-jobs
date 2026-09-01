// Save this file as: src/app/privacy/page.tsx

export default function PrivacyPolicyPage() {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <a href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-8 inline-block">
            ← Back to ScamShield Jobs
          </a>
  
          <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-slate-400 mb-10">Last Updated: August 31, 2026</p>
  
          <div className="prose prose-invert prose-slate max-w-none space-y-8">
            <p>
              ScamShield Jobs ("we," "us," or "our") operates the website scamshieldjobs.com
              (the "Service"). This Privacy Policy explains how we collect, use, and protect
              your information when you use our Service.
            </p>
  
            <section>
              <h2 className="text-xl font-semibold text-white">1. Information We Collect</h2>
              <p>
                <strong>Account Information:</strong> When you create an account, we collect
                your email address and a securely hashed password (via Firebase Authentication).
                We do not store your password in plain text.
              </p>
              <p>
                <strong>Job Posting Data:</strong> When you submit a job posting URL or text for
                analysis, we process and store that content, along with the resulting fraud
                analysis, in your account's history.
              </p>
              <p>
                <strong>Usage Data:</strong> We may collect standard technical data such as IP
                address, browser type, and pages visited, for security and rate-limiting purposes.
              </p>
            </section>
  
            <section>
              <h2 className="text-xl font-semibold text-white">2. How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>To provide the core scam detection service</li>
                <li>To maintain your account and analysis history</li>
                <li>To send you email alerts about flagged job postings, if enabled</li>
                <li>To enforce rate limits and prevent abuse of the Service</li>
                <li>To improve the accuracy of our detection systems over time</li>
              </ul>
            </section>
  
            <section>
              <h2 className="text-xl font-semibold text-white">3. Third-Party Services</h2>
              <p>We use the following third-party services to operate ScamShield Jobs:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <strong>Firebase (Google):</strong> Authentication and database storage
                  (Firestore). See{' '}
                  <a href="https://policies.google.com/privacy" className="text-blue-400 hover:underline">
                    Google's Privacy Policy
                  </a>.
                </li>
                <li>
                  <strong>Google Gemini AI:</strong> Job posting content you submit is sent to
                  Google's Gemini API for fraud analysis.
                </li>
                <li>
                  <strong>Google Safe Browsing API:</strong> Used to cross-reference submitted
                  URLs against known threat databases.
                </li>
                <li>
                  <strong>Resend:</strong> Used to send email alerts. See{' '}
                  <a href="https://resend.com/legal/privacy-policy" className="text-blue-400 hover:underline">
                    Resend's Privacy Policy
                  </a>.
                </li>
              </ul>
              <p>We do not sell your personal information to third parties.</p>
            </section>
  
            <section>
              <h2 className="text-xl font-semibold text-white">4. Data Retention</h2>
              <p>
                We retain your account data and job analysis history for as long as your account
                remains active. You may request deletion of your account and associated data at
                any time by contacting us (see Section 8).
              </p>
            </section>
  
            <section>
              <h2 className="text-xl font-semibold text-white">5. Data Security</h2>
              <p>
                We implement industry-standard security measures, including JWT-based
                authentication, rate limiting, and per-user data isolation in our database, to
                protect your information. However, no method of transmission or storage is 100%
                secure, and we cannot guarantee absolute security.
              </p>
            </section>
  
            <section>
              <h2 className="text-xl font-semibold text-white">6. Your Rights</h2>
              <p>Depending on your location, you may have the right to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Access the personal data we hold about you</li>
                <li>Request correction or deletion of your data</li>
                <li>Withdraw consent for data processing</li>
                <li>Request a copy of your data in a portable format</li>
              </ul>
              <p>To exercise these rights, contact us at the email below.</p>
            </section>
  
            <section>
              <h2 className="text-xl font-semibold text-white">7. Children's Privacy</h2>
              <p>
                ScamShield Jobs is not intended for use by individuals under the age of 18. We do
                not knowingly collect personal information from minors.
              </p>
            </section>
  
            <section>
              <h2 className="text-xl font-semibold text-white">8. Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy or wish to exercise your data
                rights, contact us at:{' '}
                <a href="mailto:scamshieldjobs@gmail.com" className="text-blue-400 hover:underline">
                  scamshieldjobs@gmail.com
                </a>
              </p>
            </section>
  
            <section>
              <h2 className="text-xl font-semibold text-white">9. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify users of
                significant changes by updating the "Last Updated" date above.
              </p>
            </section>
          </div>
        </div>
      </div>
    );
  }