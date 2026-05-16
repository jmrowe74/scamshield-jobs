import { NextRequest, NextResponse } from 'next/server';
import { scamJobAnalysis } from '@/ai/flows/scam-job-analysis';
import { checkKnownScamDomain } from '@/lib/scam-domains';
import { checkGoogleSafeBrowsing } from '@/lib/safe-browsing';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.jobUrl) {
      return NextResponse.json(
        { error: 'jobUrl is required' },
        { status: 400 }
      );
    }

    console.log('Starting AI analysis for:', body.jobUrl);

    // Step 1 — Check known scam domains first (instant, no API call needed)
    const scamDomainCheck = checkKnownScamDomain(body.jobUrl);
    if (scamDomainCheck.isScam) {
      console.log('Known scam domain detected:', body.jobUrl);
      return NextResponse.json({
        legitimacyScore: 0,
        classification: 'scam',
        confidence: 99,
        reasoning: `⚠️ KNOWN SCAM SITE DETECTED: ${scamDomainCheck.reason} This domain has been identified as a known job scam site. Do not apply or provide any personal information.`,
        title: body.jobTitle || 'Suspicious Job Posting',
        company: body.companyName || 'Unknown - Likely Fraudulent',
        description: 'This URL is from a known scam domain.',
        redFlags: [scamDomainCheck.reason],
        legitimacyIndicators: []
      });
    }

    // Step 2 — Check Google Safe Browsing
    const safeBrowsingCheck = await checkGoogleSafeBrowsing(body.jobUrl);
    if (safeBrowsingCheck.isMalicious) {
      console.log('Google Safe Browsing threat detected:', body.jobUrl);
      return NextResponse.json({
        legitimacyScore: 0,
        classification: 'scam',
        confidence: 99,
        reasoning: `⚠️ DANGEROUS SITE DETECTED BY GOOGLE: This URL has been flagged by Google Safe Browsing as malicious. Threat types: ${safeBrowsingCheck.threats.join(', ')}. Do not visit this site or provide any personal information.`,
        title: body.jobTitle || 'Dangerous Job Posting',
        company: body.companyName || 'Unknown - Flagged by Google',
        description: 'This URL has been flagged as malicious by Google Safe Browsing.',
        redFlags: safeBrowsingCheck.threats,
        legitimacyIndicators: []
      });
    }

    // Step 3 — Run AI analysis
    const result = await scamJobAnalysis(body);
    
    console.log('AI analysis complete:', result.classification);
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('API Route Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Analysis failed' },
      { status: 500 }
    );
  }
}

export const maxDuration = 60;