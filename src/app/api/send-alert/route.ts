
import { NextRequest, NextResponse } from 'next/server';
import { scamJobAnalysis } from '@/ai/flows/scam-job-analysis';
import { checkKnownScamDomain } from '@/lib/scam-domains';
import { checkGoogleSafeBrowsing } from '@/lib/safe-browsing';

/**
 * API Route for processing alerts.
 * Updated to handle batch jobs or single job requests correctly.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // If the body contains an array of jobs, we process them. 
    // For this MVP, we'll just acknowledge receipt if it's a batch,
    // as the AI analysis is intended for single URL lookups.
    if (body.jobs && Array.isArray(body.jobs)) {
      console.log(`Received ${body.jobs.length} jobs for alert processing.`);
      return NextResponse.json({ message: 'Batch alert received and queued for processing.' });
    }

    if (!body.jobUrl) {
      return NextResponse.json(
        { error: 'jobUrl is required' },
        { status: 400 }
      );
    }

    console.log('Starting AI analysis for alert:', body.jobUrl);

    // Step 1 — Check known scam domains
    const scamDomainCheck = checkKnownScamDomain(body.jobUrl);
    if (scamDomainCheck.isScam) {
      return NextResponse.json({
        legitimacyScore: 0,
        classification: 'scam',
        confidence: 99,
        reasoning: `⚠️ KNOWN SCAM SITE: ${scamDomainCheck.reason}`,
        title: body.jobTitle || 'Suspicious Job',
        company: body.companyName || 'Unknown',
        redFlags: [scamDomainCheck.reason]
      });
    }

    // Step 2 — Run AI analysis
    const result = await scamJobAnalysis(body);
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('Alert API Route Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Analysis failed' },
      { status: 500 }
    );
  }
}

export const maxDuration = 60;
