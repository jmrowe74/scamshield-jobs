'use server';

/**
 * @fileOverview AI Flow for analyzing job postings for potential scams.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ScamJobAnalysisInputSchema = z.object({
  jobUrl: z.string().describe('The URL of the job posting to analyze.'),
  jobTitle: z.string().optional().describe('The title of the job posting.'),
  jobDescription: z.string().optional().describe('The full description of the job posting.'),
  companyName: z.string().optional().describe('The name of the company offering the job.'),
});

const ScamJobAnalysisOutputSchema = z.object({
  legitimacyScore: z.number().min(0).max(100).describe('A score from 0 to 100, where 0 is a definite scam.'),
  classification: z.enum(['scam', 'legitimate', 'suspicious']).describe("Verdict: 'scam', 'legitimate', or 'suspicious'."),
  confidence: z.number().min(0).max(100).describe('Confidence level in this classification.'),
  reasoning: z.string().describe('Detailed explanation of factors and red flags.'),
  title: z.string().optional().describe('Extracted job title if not provided.'),
  company: z.string().optional().describe('Extracted company name if not provided.'),
  description: z.string().optional().describe('Extracted summary of the job description.'),
});

export type ScamJobAnalysisInput = z.infer<typeof ScamJobAnalysisInputSchema>;
export type ScamJobAnalysisOutput = z.infer<typeof ScamJobAnalysisOutputSchema>;

const fetchUrlContent = ai.defineTool(
  {
    name: 'fetchUrlContent',
    description: 'Fetches the text content of a job posting URL to analyze it for scams.',
    inputSchema: z.object({ url: z.string().url() }),
    outputSchema: z.string(),
  },
  async (input) => {
    try {
      const response = await fetch(input.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
        signal: AbortSignal.timeout(8000), // 8 second timeout for fetching
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const html = await response.text();
      // Fast text extraction
      const text = html
        .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '')
        .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, '')
        .replace(/<[^>]*>?/gm, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 3000); // Shorter length to stay fast
      return text || 'No readable content found on the page.';
    } catch (error: any) {
      return `Failed to fetch URL content: ${error.message}.`;
    }
  }
);

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function scamJobAnalysis(
  input: ScamJobAnalysisInput
): Promise<ScamJobAnalysisOutput> {
  const maxRetries = 1; 
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const { output } = await ai.generate({
        model: 'googleai/gemini-2.0-flash-lite',
        prompt: `You are an expert fraud investigator. Analyze this job: ${input.jobUrl}
        
        Step 1: Use fetchUrlContent to read the page.
        Step 2: Compare the page content with user-provided info:
           - Title: ${input.jobTitle || 'Unknown'}
           - Company: ${input.companyName || 'Unknown'}
        
        Step 3: Look for red flags:
           - "Data Entry" paying >$30/hr
           - Interviews on Telegram/WhatsApp/Signal
           - Vague company details or brand new domains
           - Requests for personal payment or equipment purchase checks
        
        Provide score (0-100), classification, and reasoning.`,
        tools: [fetchUrlContent],
        output: { schema: ScamJobAnalysisOutputSchema },
      });

      if (!output) {
        throw new Error('AI failed to generate a verdict.');
      }

      return output;
    } catch (error: any) {
      const errorMessage = error.message || '';
      const isRetryable = errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED');

      if (isRetryable && attempt < maxRetries) {
        attempt++;
        await wait(1000); 
        continue;
      }
      throw new Error(`AI Analysis Error: ${errorMessage}`);
    }
  }
  throw new Error('Analysis service is currently busy. Please try again in 1 minute.');
}