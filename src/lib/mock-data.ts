export interface JobPost {
  id: string;
  title: string;
  company: string;
  description: string;
  url: string;
  source: 'LinkedIn' | 'ZipRecruiter' | 'Glassdoor' | 'Indeed';
  postedAt: string;
  legitimacyScore?: number;
  classification?: 'scam' | 'legitimate' | 'suspicious';
  reasoning?: string;
  websiteCreatedAt?: string;
}

export const MOCK_JOBS: JobPost[] = [
  {
    id: '1',
    title: 'Senior Software Engineer',
    company: 'TechCorp Global',
    description: 'Looking for a senior engineer with 10+ years of experience in React and Node.js. Remote position with great benefits.',
    url: 'https://linkedin.com/jobs/12345',
    source: 'LinkedIn',
    postedAt: '2023-10-25T10:00:00Z',
    legitimacyScore: 95,
    classification: 'legitimate',
    reasoning: 'Well-established company, verified job posting, consistent information across platforms.',
    websiteCreatedAt: '1998-05-12'
  },
  {
    id: '2',
    title: 'Entry Level Data Entry',
    company: 'FastHire Solutions LLC',
    description: 'Work from home! $45/hour. No experience required. We provide all equipment. Instant messaging interview only.',
    url: 'https://ziprecruiter.com/jobs/67890',
    source: 'ZipRecruiter',
    postedAt: '2023-10-26T08:30:00Z',
    legitimacyScore: 12,
    classification: 'scam',
    reasoning: 'Extremely high pay for unskilled labor, website registered 2 days ago, "interview only via messaging" is a major red flag.',
    websiteCreatedAt: '2023-10-24'
  },
  {
    id: '3',
    title: 'Marketing Coordinator',
    company: 'BrightEdge Media',
    description: 'Help us manage our social media presence and coordinate marketing campaigns.',
    url: 'https://glassdoor.com/jobs/11223',
    source: 'Glassdoor',
    postedAt: '2023-10-26T14:15:00Z',
    legitimacyScore: 78,
    classification: 'suspicious',
    reasoning: 'Company exists but website creation date is recent (6 months). Some reports on Reddit about unusual hiring processes.',
    websiteCreatedAt: '2023-04-10'
  }
];