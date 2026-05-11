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
    description: 'Fetches essential metadata and text from a job URL for scam analysis.',
    inputSchema: z.object({ url: z.string().url() }),
    outputSchema: z.string(),
  },
  async (input) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const response = await fetch(input.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return `Error: HTTP ${response.status} when accessing URL.`;
      }

      const html = await response.text();
      const text = html
        .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '')
        .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, '')
        .replace(/<[^>]*>?/gm, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 1000);

      return text || 'The page returned no readable text content.';
    } catch (error: any) {
      return `Error fetching content: ${error.message}`;
    }
  }
);

export async function scamJobAnalysis(
  input: ScamJobAnalysisInput
): Promise<ScamJobAnalysisOutput> {
  try {
    const { output } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: `Analyze this job posting for fraud markers: ${input.jobUrl}
      
      Provided Context:
      - Title: ${input.jobTitle || 'Unknown'}
      - Company: ${input.companyName || 'Unknown'}
      
      Instructions:
      1. Use fetchUrlContent for live validation.
      2. Scan for red flags: generic domains, Telegram/WhatsApp hiring, pay-to-work schemes.
      3. Output a score, classification, and reasoning. Be concise but thorough.`,
      tools: [fetchUrlContent],
      output: { schema: ScamJobAnalysisOutputSchema },
      config: {
        safetySettings: [
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
        ]
      }
    });

    if (!output) {
      return {
        legitimacyScore: 50,
        classification: 'suspicious' as const,
        confidence: 30,
        reasoning: 'Could not fully analyze this URL. The page may be behind a login wall or block automated access. Please verify this job posting manually.',
        title: 'Unable to fully analyze',
        company: 'Unknown',
        description: 'The AI could not access this page content directly.'
      };
    }

    return output;
  } catch (error: any) {
    console.error('Scam analysis error:', error);
    throw error;
  }
}
