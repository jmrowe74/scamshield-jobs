'use server';
/**
 * @fileOverview A Genkit flow for analyzing job postings to determine their legitimacy.
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
  legitimacyScore: z
    .number()
    .min(0)
    .max(100)
    .describe('A score from 0 to 100, where 0 is a definite scam.'),
  classification: z
    .enum(['scam', 'legitimate', 'suspicious'])
    .describe("Verdict: 'scam', 'legitimate', or 'suspicious'."),
  confidence: z
    .number()
    .min(0)
    .max(100)
    .describe('Confidence level in this classification.'),
  reasoning: z.string().describe('Detailed explanation of factors and red flags.'),
  title: z.string().optional().describe('Extracted job title if not provided.'),
  company: z.string().optional().describe('Extracted company name if not provided.'),
  description: z.string().optional().describe('Extracted summary of the job description.'),
});

/**
 * Tool to fetch the text content of a URL.
 */
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
      // Very basic HTML to text conversion to keep tokens low
      const text = html
        .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '')
        .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gim, '')
        .replace(/<[^>]*>?/gm, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 15000); // Take a large chunk but respect limits
      return text || "No readable content found on the page.";
    } catch (error: any) {
      return `Failed to fetch URL content: ${error.message}. Please use provided input or search for the job title manually.`;
    }
  }
);

/**
 * Waits for a given number of milliseconds.
 */
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Analyzes a job posting for legitimacy using AI.
 * Automatically retries on rate limit errors with exponential backoff.
 */
export async function scamJobAnalysis(input: z.infer<typeof ScamJobAnalysisInputSchema>): Promise<z.infer<typeof ScamJobAnalysisOutputSchema>> {
  const maxRetries = 3;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const { output } = await ai.generate({
        model: 'googleai/gemini-1.5-flash',
        prompt: `You are an expert fraud investigator. Analyze the job posting at this URL: ${input.jobUrl}
        
        Use the fetchUrlContent tool to read the page. If a job title, company, or description was provided in the input, use them as additional context.
        
        Identify red flags such as:
        - Telegram/WhatsApp-only interviews
        - Unusually high pay for entry-level work
        - Vague company details
        - Suspicious domain names
        
        Provide a legitimacy score (0-100), classification, and detailed reasoning.`,
        tools: [fetchUrlContent],
        input: input,
        output: { schema: ScamJobAnalysisOutputSchema }
      });
      
      if (!output) {
        throw new Error('The AI model returned an empty response.');
      }
      
      return output;
    } catch (error: any) {
      const errorMessage = error.message || '';
      console.error(`AI Analysis Attempt ${attempt + 1} failed:`, errorMessage);

      const isRateLimit = 
        errorMessage.includes('429') || 
        errorMessage.includes('RESOURCE_EXHAUSTED') || 
        errorMessage.includes('quota');

      if (isRateLimit && attempt < maxRetries) {
        attempt++;
        const delaySeconds = Math.pow(2, attempt) * 2;
        await wait(delaySeconds * 1000);
        continue;
      }

      throw new Error(`AI Analysis Error: ${errorMessage || 'An unexpected error occurred.'}`);
    }
  }

  throw new Error('AI Analysis failed after multiple retries.');
}
