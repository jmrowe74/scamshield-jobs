// Save this file as: src/app/delete-account/page.tsx

export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <a href="/" className="text-blue-400 hover:text-blue-300 text-sm mb-8 inline-block">
          ← Back to ScamShield Jobs
        </a>

        <h1 className="text-3xl font-bold text-white mb-2">Delete Your Account</h1>
        <p className="text-slate-400 mb-10">Last Updated: September 6, 2026</p>

        <div className="prose prose-invert prose-slate max-w-none space-y-8">
          <p>
            ScamShield Jobs ("we," "us," or "our") allows you to permanently delete your
            account and all associated data directly within the app. No email request or
            manual support process is required.
          </p>

          <section>
            <h2 className="text-xl font-semibold text-white">How to Delete Your Account</h2>
            <ol className="list-decimal pl-6 space-y-1">
              <li>Sign in to your ScamShield Jobs account at scamshieldjobs.com</li>
              <li>Click the "Delete Account" button in the top navigation bar</li>
              <li>Enter your password to confirm the request</li>
              <li>Click "Delete Account" in the confirmation dialog</li>
            </ol>
            <p>
              Your account will be permanently deleted immediately. You will be signed out
              and cannot sign back in using those credentials.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">What Data Is Deleted</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Your account credentials (email address and password)</li>
              <li>All saved job audits and analysis results</li>
              <li>All saved job posting URLs associated with your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">What Data Is Retained</h2>
            <p>
              No user data is retained after account deletion. Deletion is immediate and
              permanent, and cannot be undone.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white">Questions</h2>
            <p>
              If you have questions about account deletion or data handling, contact us at{' '}
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