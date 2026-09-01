// Save this file as: src/app/terms/page.tsx

export default function TermsOfServicePage() {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-200">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <a href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-8 inline-block">
            ← Back to ScamShield Jobs
          </a>
  
          <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
          <p className="text-slate-400 mb-10">Last Updated: August 31, 2026</p>
  
          <div className="prose prose-invert prose-slate max-w-none space-y-8">
            <p>
              Welcome to ScamShield Jobs ("we," "us," "our," or the "Service"), available at
              scamshieldjobs.com. By creating an account or using the Service, you agree to these
              Terms of Service ("Terms"). If you do not agree, please do not use the Service.
            </p>
  
            <section>
              <h2 className="text-xl font-semibold text-white">1. Description of Service</h2>
              <p>
                ScamShield Jobs is an AI-powered platform that analyzes job postings for
                indicators of fraud, using a combination of a known scam domain database,
                third-party threat intelligence (Google Safe Browsing), and AI content analysis
                (Google Gemini). The Service provides a fraud risk assessment to help users make
                more informed decisions about job postings they encounter.
              </p>
            </section>
  
            <section className="border border-amber-900/50 bg-amber-950/20 rounded-lg p-5">
              <h2 className="text-xl font-semibold text-amber-300">
                2. No Guarantee of Accuracy — Important Disclaimer
              </h2>
              <p>
                <strong>ScamShield Jobs is a decision-support tool, not a guarantee.</strong> Our
                fraud detection combines automated database lookups with AI-generated analysis,
                and while we aim for high accuracy, no automated system can catch every scam or
                guarantee that a "verified" listing is legitimate.
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>A job posting flagged as "likely legitimate" may still turn out to be fraudulent.</li>
                <li>A job posting flagged as "suspicious" may, in some cases, be legitimate.</li>
                <li>
                  You should always use your own judgment, conduct independent research, and
                  never provide sensitive personal or financial information to an employer until
                  you have independently verified their legitimacy.
                </li>
              </ul>
              <p>
                <strong>
                  We are not liable for any financial loss, identity theft, or other harm
                  resulting from your reliance on the Service's analysis.
                </strong>{' '}
                Use of the Service and any decisions made based on its output are entirely at
                your own risk.
              </p>
            </section>
  
            <section>
              <h2 className="text-xl font-semibold text-white">3. User Accounts</h2>
              <p>
                You must provide accurate information when creating an account and are
                responsible for maintaining the confidentiality of your login credentials. You
                are responsible for all activity that occurs under your account.
              </p>
            </section>
  
            <section>
              <h2 className="text-xl font-semibold text-white">4. Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Use the Service for any unlawful purpose</li>
                <li>Attempt to circumvent rate limits, authentication, or other security measures</li>
                <li>Submit content that infringes on the rights of others</li>
                <li>Use automated means (bots, scrapers) to access the Service outside of documented functionality</li>
                <li>Reverse-engineer or attempt to extract our detection methodology for competitive or malicious purposes</li>
              </ul>
              <p>We reserve the right to suspend or terminate accounts that violate these Terms.</p>
            </section>
  
            <section>
              <h2 className="text-xl font-semibold text-white">5. Intellectual Property</h2>
              <p>
                The Service, including its design, code, and detection methodology, is our
                property (or licensed to us) and is protected by applicable intellectual property
                laws. Job postings and content you submit remain your responsibility; you
                represent that you have the right to submit such content for analysis.
              </p>
            </section>
  
            <section>
              <h2 className="text-xl font-semibold text-white">6. Third-Party Services</h2>
              <p>
                The Service relies on third-party providers (Firebase, Google Gemini AI, Google
                Safe Browsing, Resend). We are not responsible for outages, errors, or data
                handling practices of these third parties beyond what is disclosed in our Privacy
                Policy.
              </p>
            </section>
  
            <section>
              <h2 className="text-xl font-semibold text-white">7. Limitation of Liability</h2>
              <p>
                To the fullest extent permitted by law, ScamShield Jobs and its creator shall not
                be liable for any indirect, incidental, special, consequential, or punitive
                damages, including loss of profits, data, or goodwill, arising from your use of
                or inability to use the Service.
              </p>
            </section>
  
            <section>
              <h2 className="text-xl font-semibold text-white">8. Disclaimer of Warranties</h2>
              <p>
                The Service is provided "as is" and "as available," without warranties of any
                kind, either express or implied, including but not limited to warranties of
                merchantability, fitness for a particular purpose, or non-infringement.
              </p>
            </section>
  
            <section>
              <h2 className="text-xl font-semibold text-white">9. Changes to the Service or Terms</h2>
              <p>
                We may modify, suspend, or discontinue the Service at any time. We may also
                update these Terms; continued use of the Service after changes constitutes
                acceptance of the revised Terms.
              </p>
            </section>
  
            <section>
              <h2 className="text-xl font-semibold text-white">10. Beta Status</h2>
              <p>
                ScamShield Jobs is currently in active beta testing. Features, accuracy, and
                availability may change without notice as we continue development.
              </p>
            </section>
  
            <section>
              <h2 className="text-xl font-semibold text-white">11. Contact Us</h2>
              <p>
                Questions about these Terms can be directed to:{' '}
                <a href="mailto:scamshieldjobs@gmail.com" className="text-blue-400 hover:underline">
                  scamshieldjobs@gmail.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    );
  }