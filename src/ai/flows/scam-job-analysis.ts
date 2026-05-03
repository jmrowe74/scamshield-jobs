'use server';

/**
 * @fileOverview AI Flow for analyzing job postings for potential scams.
 * 
 * This flow takes a job URL and optional metadata, fetches the content of the page,
 * and uses Gemini to identify red flags and provide a legitimacy score.
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
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const html = await response.text();
      // Basic HTML text extraction
      const text = html
        .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '')
        .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, '')
        .replace(/<[^>]*>?/gm, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 15000);
      return text || 'No readable content found on the page.';
    } catch (error: any) {
      return `Failed to fetch URL content: ${error.message}.`;
    }
  }
);

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Primary server action for analyzing a job posting.
 */
export async function scamJobAnalysis(
  input: ScamJobAnalysisInput
): Promise<ScamJobAnalysisOutput> {
  const maxRetries = 5; // Increased retries for better rate limit handling
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const { output } = await ai.generate({
        model: 'googleai/gemini-2.0-flash-lite',
        prompt: `You are an expert fraud investigator specializing in employment scams. 
        Analyze the job posting at this URL: ${input.jobUrl}
        
        Use the fetchUrlContent tool to read the page content. 
        
        Additional context provided (if any):
        - Title: ${input.jobTitle || 'Not provided'}
        - Company: ${input.companyName || 'Not provided'}
        - Description: ${input.jobDescription || 'Not provided'}
        
        Identify red flags such as:
        - Interviews conducted solely via Telegram, WhatsApp, or Signal.
        - High-paying "Data Entry" or "Virtual Assistant" roles for unskilled labor ($30-50+/hr).
        - Requests for personal info, bank details, or equipment purchases via check.
        - Vague or generic company descriptions.
        - Domain names registered very recently or slightly misspelled.
        
        Provide a legitimacy score (0-100), classification, and detailed reasoning explaining your findings.`,
        tools: [fetchUrlContent],
        output: { schema: ScamJobAnalysisOutputSchema },
      });

      if (!output) {
        throw new Error('The AI model returned an empty response.');
      }

      return output;
    } catch (error: any) {
      const errorMessage = error.message || '';
      
      // Check for rate limit or quota errors
      const isRetryable = 
        errorMessage.includes('429') || 
        errorMessage.includes('RESOURCE_EXHAUSTED') || 
        errorMessage.includes('quota') ||
        errorMessage.includes('fetch');

      if (isRetryable && attempt < maxRetries) {
        attempt++;
        // Use exponential backoff with a base of 3 seconds
        const delaySeconds = Math.pow(2, attempt) * 3;
        await wait(delaySeconds * 1000);
        continue;
      }

      // Handle specific errors for clearer UI feedback
      if (errorMessage.includes('404')) {
        throw new Error('AI Model Error: The requested model was not found. Please ensure gemini-2.0-flash-lite is enabled in your project.');
      }

      if (errorMessage.includes('401') || errorMessage.includes('403')) {
        throw new Error('AI Authentication Error: Your API key is invalid or lacks the necessary permissions.');
      }

      throw new Error(`AI Analysis Error: ${errorMessage || 'An unexpected error occurred during the analysis process.'}`);
    }
  }

  throw new Error('AI Analysis failed after multiple retries due to service rate limits. Please wait a few moments and try again.');
}