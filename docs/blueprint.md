# **App Name**: ScamShield Jobs

## Core Features:

- Job Feed Ingestion: Ingest and parse RSS feeds from LinkedIn, ZipRecruiter, Glassdoor, and other specified job platforms to extract job postings.
- Company Info Extraction & URL Analysis: Automatically extract company names from job postings and analyze linked URLs to prepare for external lookups.
- External Information Retrieval: Perform web searches on Google and Reddit, and WHOIS lookups via services like CentralOps.net, to gather information about the job's company and website creation date.
- Scam Likelihood Assessment Tool: Utilize a generative AI tool to analyze all collected data from company information, search results, and WHOIS records, generating a legitimacy score and classification (scam/legitimate) for each job post.
- Job Post Review Dashboard: Provide a user interface to display processed job postings, their associated legitimacy scores, and AI-generated classifications, allowing for user review and manual overrides.
- LinkedIn Scam Job Notifier: Automatically post identified scam job listings to a designated LinkedIn channel every 6 hours, clearly indicating their high confidence as scam posts.

## Style Guidelines:

- The overall scheme is light, conveying clarity and alertness. The primary color is a deep, trustworthy blue (#1F6BCE), representing security and reliability, chosen to stand out clearly against a lighter background. The background is a very subtle blue-grey (#F2F5F8), designed for unobtrusive readability. The accent color is a bright, clear cyan (#42E6FF), providing visual emphasis for critical actions or notifications, while remaining distinct and modern.
- The font for all text, including headlines and body content, is 'Inter' (sans-serif), chosen for its modern, neutral, and highly readable characteristics, which supports clear communication of job information and legitimacy statuses.
- Utilize clean and distinct icons to quickly convey job status, such as checkmarks for legitimate posts, warning signs for potential scams, and magnifying glasses for information retrieval. Icons should maintain a modern, flat aesthetic.
- Implement a clean, card-based layout for displaying individual job postings, with prominent visual indicators for their legitimacy status. Information should be organized logically to allow for quick scanning and detailed inspection of each job post.
- Incorporate subtle, functional animations for feedback during data loading, filtering job postings, and state changes (e.g., when a job's status is updated), enhancing user experience without distracting from critical information.