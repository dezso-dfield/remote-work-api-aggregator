import React, { useState, useEffect, useCallback, useMemo } from 'react';
import LandingPage from './components/LandingPage';
import JobsPage from './components/JobsPage';
import { initialCategoryNames } from './utils/constants';

function App() {
  const [jobs, setJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPlatform, setSelectedPlatform] = useState('All');
  const [userLocation, setUserLocation] = useState(null);
  const [currentPage, setCurrentPage] = useState('landing');
  const [landingSearchTerm, setLandingSearchTerm] = useState('');

  const [categories] = useState(['All', ...initialCategoryNames]);

  const platformSources = useMemo(() => ([
    { name: 'Jobicy', logo: 'https://placehold.co/100x40/f0f9ff/0369a1?text=Jobicy' },
    { name: 'Remote OK', logo: 'https://placehold.co/100x40/f0f9ff/10b981?text=RemoteOK' },
    { name: 'Remotive', logo: 'https://placehold.co/100x40/f0f9ff/ef4444?text=Remotive' },
    { name: 'Himalayas.app', logo: 'https://placehold.co/100x40/f0f9ff/c084fc?text=Himalayas' },
    { name: 'We Work Remotely', logo: 'https://placehold.co/100x40/f0f9ff/f97316?text=WWR' },
    { name: 'Arbeitnow', logo: 'https://placehold.co/100x40/f0f9ff/4b5563?text=Arbeitnow' },
    { name: 'Working Nomads', logo: 'https://placehold.co/100x40/f0f9ff/3b82f6?text=Nomads' },
    { name: 'RemoteWx', logo: 'https://placehold.co/100x40/f0f9ff/38bdf8?text=RemoteWx' },
    { name: 'Jobspresso', logo: 'https://placehold.co/100x40/f0f9ff/991b1b?text=Jobspresso' },
    { name: '4DayWeek.io', logo: 'https://placehold.co/100x40/f0f9ff/fb923c?text=4DayWeek' },
    { name: 'Nodesk', logo: 'https://placehold.co/100x40/f0f9ff/5b21b6?text=Nodesk' },
  ]), []);
  
  const processAIQuery = async (query) => {
    try {
      const backendUrl = `http://localhost:7861/api/chat`;
      
      const payload = {
        message: `Extract job details from this query: "${query}" as a JSON object with keys "keywords", "category", "location", and "contract_type".`,
        history: [{ role: 'system', content: 'You are an AI job search assistant. When a user provides a query, extract job details and respond with a JSON object. The object should have the keys: "keywords", "category", "location", and "contract_type". Your response must only be the JSON object.' }]
      };

      const response = await fetch(backendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`);
      }
      
      const result = await response.json();
      const content = result.history?.pop()?.content || query;
      return JSON.parse(content);
    } catch (err) {
      console.error("AI Query processing failed:", err);
      return { keywords: query, category: 'All', location: 'All', contract_type: 'All' };
    }
  };

  const fetchApiData = async (url, sourceName) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return { data, sourceName };
    } catch (err) {
      console.error(`Failed to fetch from ${sourceName} API:`, err);
      return { data: null, sourceName };
    }
  };

  useEffect(() => {
    const fetchJobsAndLocation = async () => {
      try {
        const geoResponse = await fetch('https://ipapi.co/json/');
        const geoData = await geoResponse.json();
        setUserLocation(geoData.country_name || geoData.country_code);
      } catch (err) {
        console.error("Failed to fetch user location:", err);
      }

      const allApiUrls = [
        { url: '/api/jobicy/remote-jobs', sourceName: 'Jobicy' },
        { url: '/api/remoteok', sourceName: 'Remote OK' },
        { url: '/api/remotive/remote-jobs', sourceName: 'Remotive' },
        { url: '/api/himalayas', sourceName: 'Himalayas.app' },
        { url: '/api/weworkremotely/remote-jobs.json', sourceName: 'We Work Remotely' },
        { url: '/api/arbeitnow/job-board-api', sourceName: 'Arbeitnow' },
        { url: '/api/workingnomads/jobs', sourceName: 'Working Nomads' },
        { url: '/api/remotewx/jobs', sourceName: 'RemoteWx' },
        { url: '/api/jobspresso/jobs.json', sourceName: 'Jobspresso' },
        { url: '/api/4dayweek/jobs', sourceName: '4DayWeek.io' },
        { url: '/api/nodesk', sourceName: 'Nodesk' },
      ];

      let allJobs = [];

      const results = await Promise.all(allApiUrls.map(api => fetchApiData(api.url, api.sourceName)));

      results.forEach(({ data, sourceName }) => {
        if (!data) return;

        switch (sourceName) {
          case 'Jobicy':
            if (data.jobs && Array.isArray(data.jobs)) {
              allJobs = [...allJobs, ...data.jobs.map(job => ({
                id: `jobicy-${job.id}`,
                title: job.jobTitle,
                company: job.companyName,
                url: job.url,
                source: sourceName,
                category: job.jobIndustry,
                location: job.jobGeo,
                salary: null,
              }))];
            }
            break;
          case 'Remote OK':
            if (data && Array.isArray(data) && data.length > 1) {
              allJobs = [...allJobs, ...data.slice(1).map(job => ({
                id: `remoteok-${job.slug}`,
                title: job.position,
                company: job.company,
                url: job.url,
                source: sourceName,
                category: job.tags?.join(', ') || 'Unknown',
                location: job.location,
                salary: job.salary_min && job.salary_max ? `${job.salary_min} - ${job.salary_max} ${job.salary_currency}` : job.salary,
              }))];
            }
            break;
          case 'Remotive':
            if (data.jobs && Array.isArray(data.jobs)) {
              allJobs = [...allJobs, ...data.jobs.map(job => ({
                id: `remotive-${job.id}`,
                title: job.title,
                company: job.company_name,
                url: job.url,
                source: sourceName,
                category: job.category,
                location: job.job_type,
                salary: job.salary || null,
              }))];
            }
            break;
          case 'Himalayas.app':
            if (data && Array.isArray(data)) {
              allJobs = [...allJobs, ...data.map(job => ({
                id: `himalayas-${job.guid}`,
                title: job.title,
                company: job.companyName,
                url: job.applicationLink,
                source: sourceName,
                category: job.parentCategories?.join(', ') || 'Unknown',
                location: job.locationRestrictions?.join(', ') || 'Worldwide',
              }))];
            }
            break;
          case 'We Work Remotely':
            if (data.jobs && Array.isArray(data.jobs)) {
              allJobs = [...allJobs, ...data.jobs.map(job => ({
                id: `weworkremotely-${job.id}`,
                title: job.title,
                company: job.company,
                url: job.url,
                source: sourceName,
                category: job.category,
                location: job.job_type,
                salary: job.salary || null,
              }))];
            }
            break;
          case 'Working Nomads':
            if (data && Array.isArray(data)) {
              allJobs = [...allJobs, ...data.map(job => ({
                id: `workingnomads-${job.id}`,
                title: job.title,
                company: job.companyName,
                url: job.url,
                source: sourceName,
                category: job.category?.name || 'Unknown',
                location: job.location,
                salary: job.salary || null,
              }))];
            }
            break;
          case 'Arbeitnow':
            if (data.data && Array.isArray(data.data)) {
              allJobs = [...allJobs, ...data.data.map(job => ({
                id: `arbeitnow-${job.slug}`,
                title: job.title,
                company: job.company_name,
                url: job.url,
                source: sourceName,
                category: job.tags?.join(', ') || 'Unknown',
                location: job.location || 'Remote',
                salary: job.salary || null,
              }))];
            }
            break;
          case 'JustRemote':
            if (data.jobs && Array.isArray(data.jobs)) {
              allJobs = [...allJobs, ...data.jobs.map(job => ({
                id: `justremote-${job.slug}`,
                title: job.title,
                company: job.company,
                url: job.url,
                source: sourceName,
                category: job.category,
                location: job.location || 'Remote',
                salary: null,
              }))];
            }
            break;
          case '4DayWeek.io':
          case 'RemoteWx':
          case 'Nodesk':
          case 'Jobspresso':
            if (Array.isArray(data)) {
              allJobs = [...allJobs, ...data.map(job => ({
                id: `${sourceName.toLowerCase().replace(/\s/g, '')}-${job.id || job.slug || job.guid || job.url}`,
                title: job.title,
                company: job.company || job.company_name || 'Unknown',
                url: job.url || job.link,
                source: sourceName,
                category: job.category || job.tags?.join(', ') || 'Unknown',
                location: job.location || 'Remote',
                salary: job.salary || null,
              }))];
            }
            break;
          default:
            break;
        }
      });

      if (allJobs.length === 0) {
        setError("No jobs were found from any of the APIs. Please try again later.");
      }

      const uniqueJobs = allJobs.reduce((acc, current) => {
        const x = acc.find(item => item.title === current.title && item.company === current.company);
        if (!x) {
          return acc.concat([current]);
        }
        return acc;
      }, []);

      setJobs(uniqueJobs);
      setIsLoading(false);
    };

    fetchJobsAndLocation();
  }, []);

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('All');
    setSelectedPlatform('All');
  };

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
    setSearchTerm('');
    setSelectedPlatform('All');
    setCurrentPage('jobs');
  };

  const handlePlatformClick = (platform) => {
    setSelectedPlatform(platform);
    setSelectedCategory('All');
    setSearchTerm('');
    setCurrentPage('jobs');
  };

  const handleLandingSearch = (term) => {
    setSearchTerm(term);
    setSelectedCategory('All');
    setSelectedPlatform('All');
    setCurrentPage('jobs');
  };
  
  const handleAIJobSearch = async (transcript) => {
    setIsLoading(true);
    const aiResponse = await processAIQuery(transcript);
    setSearchTerm(aiResponse.keywords);
    setSelectedCategory(aiResponse.category);
    setSelectedPlatform(aiResponse.platform);
    setCurrentPage('jobs');
    setIsLoading(false);
  }

  if (currentPage === 'landing') {
    return (
      <LandingPage
        userLocation={userLocation}
        categories={initialCategoryNames}
        platforms={platformSources}
        onCategoryClick={handleCategoryClick}
        onPlatformClick={handlePlatformClick}
        onSearch={handleLandingSearch}
        onAIJobSearch={handleAIJobSearch}
        landingSearchTerm={landingSearchTerm}
        setLandingSearchTerm={setLandingSearchTerm}
        isLoading={isLoading}
        jobs={jobs}
      />
    );
  } else {
    return (
      <JobsPage
        jobs={jobs}
        isLoading={isLoading}
        error={error}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedPlatform={selectedPlatform}
        setSelectedPlatform={setSelectedPlatform}
        categories={categories}
        platforms={platformSources}
        setCurrentPage={setCurrentPage}
        clearFilters={clearFilters}
        onAIJobSearch={handleAIJobSearch}
      />
    );
  }
}

export default App;