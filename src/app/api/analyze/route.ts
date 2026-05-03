import { NextRequest, NextResponse } from 'next/server';
import { scamJobAnalysis } from '@/ai/flows/scam-job-analysis';

/**
 * API route to handle job analysis requests.
 * Proxies requests to the Genkit flow to avoid direct Server Action issues in some environments.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.jobUrl) {
      return NextResponse.json(
        { error: 'jobUrl is required' },
        { status: 400 }
      );
    }

    const result = await scamJobAnalysis(body);
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('API Route Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Analysis failed' },
      { status: 500 }
    );
  }
}
