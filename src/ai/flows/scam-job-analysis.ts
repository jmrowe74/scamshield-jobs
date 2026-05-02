'use server';
/**
 * @fileOverview A Genkit flow for analyzing job postings to determine their legitimacy.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ScamJobAnalysisInputSchema = z.object({
  jobTitle: z.string().describe('The title of the job posting.'),
  jobDescription: z.string().describe('The full description of the job posting.'),
  companyName: z.string().describe('The name of the company offering the job.'),
  jobUrl: z.string().describe('The URL of the job posting.'),
  websiteCreationDate: z
    .string()
    .describe("The creation date of the job posting's website, e.g., '1999-01-01'."),
  googleSearchResults: z
    .array(z.string())
    .describe('Search results relevant to the company legitimacy.'),
  redditSearchResults: z
    .array(z.string())
    .describe('Reddit discussions about legitimacy or scams.'),
});
export type ScamJobAnalysisInput = z.infer<typeof ScamJobAnalysisInputSchema>;

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
});
export type ScamJobAnalysisOutput = z.infer<typeof ScamJobAnalysisOutputSchema>;

/**
 * Analyzes a job posting for legitimacy using AI.
 * Handles common API errors with descriptive guidance.
 */
export async function scamJobAnalysis(input: ScamJobAnalysisInput): Promise<ScamJobAnalysisOutput> {
  try {
    return await scamJobAnalysisFlow(input);
  } catch (error: any) {
    // Specifically handle the 404 model not found error which is common in configuration issues
    if (error.message?.includes('404')) {
      throw new Error(`AI Model Error: The model "gemini-1.5-flash" was not found (404). This usually means the "Generative Language API" is not enabled in your Google Cloud project or is unavailable in your region. Please visit https://aistudio.google.com/ to ensure your API key is active and the API is enabled.`);
    }
    
    // Check for authentication issues (Invalid API Key)
    if (error.message?.includes('401') || error.message?.includes('403') || error.message?.includes('API_KEY')) {
      throw new Error('AI Authentication Error: Your Google AI API key is invalid or unauthorized. Please verify your GOOGLE_GENAI_API_KEY in the project settings.');
    }

    throw new Error(error.message || 'An unexpected error occurred during AI analysis.');
  }
}

const scamJobAnalysisPrompt = ai.definePrompt({
  name: 'scamJobAnalysisPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: ScamJobAnalysisInputSchema },
  output: { schema: ScamJobAnalysisOutputSchema },
  system: 'You are an expert fraud investigator specializing in job recruitment scams.',
  prompt: `Analyze the following job posting details to determine its legitimacy:

Job Title: {{{jobTitle}}}
Job Description: {{{jobDescription}}}
Company Name: {{{companyName}}}
Job URL: {{{jobUrl}}}
Website Creation Date: {{{websiteCreatedAt}}}

Cross-Reference Data:
Google Results:
{{#each googleSearchResults}}
- {{{this}}}
{{/each}}

Reddit Discussions:
{{#each redditSearchResults}}
- {{{this}}}
{{/each}}

Analyze red flags such as:
1. High pay for unskilled work.
2. Direct messaging (Telegram, WhatsApp) for interviews.
3. Website domains created very recently (e.g., within the last 30 days).
4. Lack of official corporate social presence.

Provide a legitimacy score (0-100), classification, and clear reasoning for your verdict.`,
});

const scamJobAnalysisFlow = ai.defineFlow(
  {
    name: 'scamJobAnalysisFlow',
    inputSchema: ScamJobAnalysisInputSchema,
    outputSchema: ScamJobAnalysisOutputSchema,
  },
  async (input) => {
    const { output } = await scamJobAnalysisPrompt(input);
    if (!output) {
      throw new Error('The AI model failed to produce a valid legitimacy analysis.');
    }
    return output;
  }
);
