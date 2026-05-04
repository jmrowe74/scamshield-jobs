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
        signal: AbortSignal.timeout(5000), // Slightly tighter timeout for faster response
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const html = await response.text();
      // Improved text extraction to stay under token limits
      const text = html
        .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '')
        .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, '')
        .replace(/<[^>]*>?/gm, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 1200); // reduced length for token efficiency and faster analysis
      return text || 'No readable content found.';
    } catch (error: any) {
      return `Error: ${error.message}`;
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
        prompt: `Audit this job posting: ${input.jobUrl}
        
        Input Context:
        - Title: ${input.jobTitle || 'Unknown'}
        - Company: ${input.companyName || 'Unknown'}
        
        Task:
        1. Use fetchUrlContent to audit the source.
        2. Check for red flags: high pay/low skill, Telegram interviews, brand new domains.
        
        Output: score (0-100), classification, and reasoning.`,
        tools: [fetchUrlContent],
        output: { schema: ScamJobAnalysisOutputSchema },
      });

      if (!output) {
        throw new Error('AI failed to respond.');
      }

      return output;
    } catch (error: any) {
      const errorMessage = error.message || '';
      const isRetryable = errorMessage.includes('429') || errorMessage.includes('RESOURCE_EXHAUSTED');

      if (isRetryable && attempt < maxRetries) {
        attempt++;
        await wait(500 * attempt); // Lower wait time to stay under gateway timeout
        continue;
      }
      throw new Error(`Audit Failure: ${errorMessage}`);
    }
  }
  throw new Error('Service busy. Please try again.');
}