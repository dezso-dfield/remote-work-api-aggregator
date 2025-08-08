// src/utils/constants.js
export const initialCategories = {
  'Tech': ['software', 'development', 'engineering', 'it', 'cloud', 'cybersecurity', 'frontend', 'backend', 'full-stack', 'developer', 'devops', 'blockchain', 'react', 'python', 'java', 'ruby', 'go', 'php', 'javascript', 'rust', 'c#', 'node', 'swift', 'data', 'ai', 'machine learning'],
  'Finance & Legal': ['finance', 'legal', 'accounting', 'analyst', 'bookkeeper', 'tax', 'fintech'],
  'Marketing & Sales': ['marketing', 'sales', 'seo', 'sem', 'social media', 'advertising', 'business development', 'growth', 'account executive', 'lead generation'],
  'Creative': ['design', 'ux', 'ui', 'visual', 'graphic', 'art', 'creative', 'product design', 'web designer', 'illustrator'],
  'Customer Service': ['customer support', 'customer service', 'help desk', 'customer success', 'support'],
  'Operations': ['operations', 'project management', 'product management', 'business analyst', 'scrum master', 'program manager', 'logistics', 'product'],
  'Data': ['data science', 'data analysis', 'analytics', 'data engineering', 'bi', 'machine learning', 'ai', 'scientist', 'big data'],
  'Writing & Content': ['writing', 'content creation', 'editing', 'copywriting', 'copywriter', 'blogger', 'technical writer']
};

export const initialCategoryNames = Object.keys(initialCategories);

export const categoryIcons = {
  'Tech': (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500 mb-2" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M10 10l-2 2l2 2" />
      <path d="M14 10l2 2l-2 2" />
      <path d="M12 10l0 4" />
      <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
    </svg>
  ),
  'Finance & Legal': (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500 mb-2" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
      <path d="M12 8v4h3.5" />
      <path d="M3.6 9h16.8" />
      <path d="M3.6 15h16.8" />
      <path d="M11.5 3a17 17 0 0 0 0 18" />
      <path d="M12.5 3a17 17 0 0 1 0 18" />
    </svg>
  ),
  'Marketing & Sales': (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500 mb-2" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M3 3v18" />
      <path d="M18.5 15a2.5 2.5 0 1 0 -2.5 -2.5" />
      <path d="M18.5 15a2.5 2.5 0 1 0 2.5 -2.5" />
      <path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" />
      <path d="M14 12v6l-2 2l-2 -2v-6" />
      <path d="M12 12a2 2 0 1 0 0 -4a2 2 0 0 0 0 4" />
      <path d="M12 14v6" />
      <path d="M10 18h4" />
      <path d="M12 18h.01" />
    </svg>
  ),
  'Creative': (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500 mb-2" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M3 19h18" />
      <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
      <path d="M12 12v.01" />
      <path d="M12 12l-3 3l3 3l3 -3l-3 -3" />
      <path d="M12 12a2 2 0 1 0 0 -4a2 2 0 0 0 0 4" />
      <path d="M12 14v6" />
      <path d="M12 18h.01" />
    </svg>
  ),
  'Customer Service': (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500 mb-2" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
      <path d="M12 8v4h3.5" />
      <path d="M3.6 9h16.8" />
      <path d="M3.6 15h16.8" />
      <path d="M11.5 3a17 17 0 0 0 0 18" />
      <path d="M12.5 3a17 17 0 0 1 0 18" />
    </svg>
  ),
  'Operations': (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500 mb-2" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
      <path d="M12 8v4h3.5" />
      <path d="M3.6 9h16.8" />
      <path d="M3.6 15h16.8" />
      <path d="M11.5 3a17 17 0 0 0 0 18" />
      <path d="M12.5 3a17 17 0 0 1 0 18" />
    </svg>
  ),
  'Data': (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500 mb-2" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
      <path d="M12 8v4h3.5" />
      <path d="M3.6 9h16.8" />
      <path d="M3.6 15h16.8" />
      <path d="M11.5 3a17 17 0 0 0 0 18" />
      <path d="M12.5 3a17 17 0 0 1 0 18" />
    </svg>
  ),
  'Writing & Content': (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500 mb-2" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
      <path d="M12 8v4h3.5" />
      <path d="M3.6 9h16.8" />
      <path d="M3.6 15h16.8" />
      <path d="M11.5 3a17 17 0 0 0 0 18" />
      <path d="M12.5 3a17 17 0 0 1 0 18" />
    </svg>
  )
};

export const categoryDescriptions = {
  'Tech': 'Find your next role in software, engineering, and IT.',
  'Finance & Legal': 'Explore opportunities in accounting, analysis, and law.',
  'Marketing & Sales': 'Discover jobs in SEO, content, and business development.',
  'Creative': 'Unleash your creativity with roles in design, UX, and art.',
  'Customer Service': 'Connect with customers in support and success roles.',
  'Operations': 'Manage projects and streamline business processes.',
  'Data': 'Shape the future with data science, analytics, and AI jobs.',
  'Writing & Content': 'Create compelling content as a writer or editor.'
};