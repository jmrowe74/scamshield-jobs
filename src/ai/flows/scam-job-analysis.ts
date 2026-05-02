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

export async function scamJobAnalysis(input: ScamJobAnalysisInput): Promise<ScamJobAnalysisOutput> {
  try {
    return await scamJobAnalysisFlow(input);
  } catch (error: any) {
    // Specifically handle the 404 model not found error which is common in configuration issues
    if (error.message?.includes('404')) {
      throw new Error(`AI Configuration Error: The model "gemini-1.5-flash" was not found (404). This usually means the "Generative Language API" is not enabled in your Google Cloud project or is unavailable in your region. Please visit https://aistudio.google.com/ to ensure your API key is active and has access to Gemini 1.5 Flash.`);
    }
    
    // Check for API key issues
    if (error.message?.includes('API_KEY') || error.message?.includes('401') || error.message?.includes('403')) {
      throw new Error('AI Authentication Error: Invalid or unauthorized API key. Please check your GOOGLE_GENAI_API_KEY in the project environment settings.');
    }

    throw new Error(error.message || 'An unexpected error occurred during AI analysis.');
  }
}

const scamJobAnalysisPrompt = ai.definePrompt({
  name: 'scamJobAnalysisPrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: ScamJobAnalysisInputSchema },
  output: { schema: ScamJobAnalysisOutputSchema },
  prompt: `You are an expert in identifying fraudulent job postings. Analyze the following details:

Job Title: {{{jobTitle}}}
Job Description: {{{jobDescription}}}
Company Name: {{{companyName}}}
Job URL: {{{jobUrl}}}
Website Creation Date: {{{websiteCreationDate}}}

Google Search Results:
{{#each googleSearchResults}}
- {{{this}}}
{{/each}}

Reddit Discussions:
{{#each redditSearchResults}}
- {{{this}}}
{{/each}}

Determine the legitimacy score (0-100), classification, and reasoning. Focus on red flags like inconsistent info or very recent domains for established companies.`,
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
      throw new Error('Failed to get output from AI model.');
    }
    return output;
  }
);
