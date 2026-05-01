export interface JobPost {
  id: string;
  title: string;
  company: string;
  description: string;
  url: string;
  source: string;
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
  },
  {
    id: '4',
    title: 'Product Designer',
    company: 'Innovate AI',
    description: 'Join our fast-growing startup to lead the design of our next-gen AI workspace.',
    url: 'https://builtin.com/jobs/designer',
    source: 'Built In',
    postedAt: '2023-10-27T09:00:00Z',
    legitimacyScore: 92,
    classification: 'legitimate',
    reasoning: 'Verified startup on Built In with clear funding history and employee reviews.',
    websiteCreatedAt: '2021-02-15'
  },
  {
    id: '5',
    title: 'Full Stack Developer',
    company: 'RemoteFlow Inc.',
    description: 'Build scalable systems for remote teams. Full-stack experience with Next.js is a must.',
    url: 'https://weworkremotely.com/jobs/full-stack',
    source: 'We Work Remotely',
    postedAt: '2023-10-27T11:20:00Z',
    legitimacyScore: 88,
    classification: 'legitimate',
    reasoning: 'Reputable company with a long history of remote-first operations.',
    websiteCreatedAt: '2015-11-30'
  },
  {
    id: '6',
    title: 'Content Strategist',
    company: 'GrowthHackers',
    description: 'Manage content production pipelines and SEO strategy for our clients.',
    url: 'https://indeed.com/viewjob?jk=77889',
    source: 'Indeed',
    postedAt: '2023-10-27T15:45:00Z',
    legitimacyScore: 85,
    classification: 'legitimate',
    reasoning: 'Established agency with verifiable client list and professional social media presence.',
    websiteCreatedAt: '2012-06-18'
  }
];
