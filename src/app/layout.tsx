import type {Metadata} from 'next';
import './globals.css';
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from '@/firebase/client-provider';
export const metadata: Metadata = {
  title: 'ScamShield Jobs | Identify Fraudulent Job Postings',
  description: 'A powerful tool to analyze job postings and protect yourself from scams.',
  metadataBase: new URL('https://www.scamshieldjobs.com'),
  openGraph: {
    title: 'ScamShield Jobs | Identify Fraudulent Job Postings',
    description: 'Check a job posting before you share anything personal.',
    url: 'https://www.scamshieldjobs.com',
    siteName: 'ScamShield Jobs',
    type: 'website',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'ScamShield Jobs' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ScamShield Jobs | Identify Fraudulent Job Postings',
    description: 'Check a job posting before you share anything personal.',
    images: ['/og-image.png'],
  },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background text-foreground min-h-screen flex flex-col" suppressHydrationWarning>
        <FirebaseClientProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <div className="flex-1">
              {children}
            </div>
            <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
              <p>
                © 2026 ScamShield Jobs ·{' '}
                <a href="/privacy" className="underline hover:text-foreground">
                  Privacy Policy
                </a>{' '}
                ·{' '}
                <a href="/terms" className="underline hover:text-foreground">
                  Terms of Service
                </a>
              </p>
            </footer>
            <Toaster />
          </ThemeProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
