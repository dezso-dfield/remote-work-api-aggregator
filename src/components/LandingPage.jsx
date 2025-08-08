import React, { useMemo } from 'react';
import SearchWithVoice from './SearchWithVoice';
import JobCard from './JobCard';
import { categoryIcons, categoryDescriptions } from '../utils/constants';

// Placeholder for predefined jobs
const predefinedJobs = [
  { id: 'pre-1', title: 'Senior Frontend Developer', company: 'Tech Innovators Inc.', category: 'Tech', location: 'Worldwide', salary: '$120,000 - $150,000', url: '#', source: 'Internal' },
  { id: 'pre-2', title: 'Digital Marketing Manager', company: 'Creative Solutions Co.', category: 'Marketing & Sales', location: 'Remote Europe', salary: '$80,000 - $100,000', url: '#', source: 'Internal' },
  { id: 'pre-3', title: 'Data Scientist', company: 'Global Data Analytics', category: 'Data', location: 'Remote US', salary: '$130,000 - $160,000', url: '#', source: 'Internal' },
  { id: 'pre-4', title: 'Customer Support Specialist', company: 'NextGen Services', category: 'Customer Service', location: 'Remote', salary: '$50,000 - $70,000', url: '#', source: 'Internal' },
];

const LandingPage = ({ userLocation, categories, platforms, onCategoryClick, onPlatformClick, onSearch, onAIJobSearch, landingSearchTerm, setLandingSearchTerm, isLoading, jobs = [] }) => {
  
  const getGreetingEmoji = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅';
    if (hour < 18) return '☀️';
    return '🌙';
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter' && landingSearchTerm) {
      onSearch(landingSearchTerm);
    }
  };

  const displayedJobs = useMemo(() => {
    if (jobs.length > 0) {
      const shuffled = [...jobs].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 4);
    }
    return predefinedJobs.slice(0, 4);
  }, [jobs]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      
      {/* Hero Section */}
      <div className="py-20 bg-gradient-to-br from-white to-blue-50">
        <div className="container mx-auto max-w-7xl text-center px-4">
          <h1 className="text-4xl sm:text-6xl font-extrabold text-blue-600 mb-4 animate-fade-in">
            Unlock Your Remote Career.
          </h1>
          <p className="text-xl sm:text-2xl text-gray-700 font-light max-w-3xl mx-auto mb-10 animate-fade-in-up">
            <strong>RemNavi</strong> is the fastest and smartest way to find your next remote job. We aggregate opportunities from the best platforms, so you don't have to. {getGreetingEmoji()}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 p-5 rounded-2xl bg-white shadow-2xl max-w-2xl mx-auto animate-zoom-in">
            <SearchWithVoice onAIJobSearch={onAIJobSearch} searchTerm={landingSearchTerm} setSearchTerm={setLandingSearchTerm} />
            <button
              onClick={() => onSearch(landingSearchTerm)}
              className="w-full sm:w-auto p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl flex items-center justify-center transform hover:scale-105"
              aria-label="Search"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          {userLocation && (
            <p className="mt-6 text-lg text-gray-600 animate-fade-in">
              Hello from <span className="font-semibold text-blue-500">{userLocation}</span>!
            </p>
          )}

        </div>
      </div>
      {/* Trust & Stats Section */}
      <div className="py-16 bg-white text-center">
        <div className="container mx-auto max-w-2xl px-4">
          <div className="flex flex-col items-center gap-10">
            {/* Stats */}
            <div className="bg-gray-50 rounded-2xl p-6 shadow-2xl w-full">
                <div className="flex flex-row justify-between items-center w-full mb-4">
                  <div className="text-left">
                    <h3 className="text-4xl font-bold text-gray-700 mb-2">
                      {isLoading ? '...' : jobs.length > 0 ? jobs.length : '100+'}
                    </h3>
                    <p className="text-xl text-gray-500">
                      Live Jobs Indexed
                    </p>
                  </div>
                  <button
                    onClick={() => onSearch('')}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors duration-200"
                  >
                    View All Jobs &rarr;
                  </button>
                </div>
              
              {/* Job Previews */}
              <div className="w-full text-left">
                <h4 className="font-semibold text-gray-700 mb-2">Some jobs you'll find:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {displayedJobs.map((job) => (
                    <div key={job.id} className="p-4 bg-white rounded-lg shadow-inner flex flex-col sm:flex-col sm:items-start sm:justify-between">
                      <div className="flex-grow">
                        <h4 className="font-semibold text-gray-800">{job.title}</h4>
                        <p className="text-sm text-gray-500">{job.company}</p>
                      </div>
                      <button
                        onClick={() => onSearch(job.title)}
                        className="mt-2 sm:mt-4 px-4 py-2 text-xs font-medium text-blue-600 bg-blue-100 rounded-full hover:bg-blue-200 transition-colors duration-200"
                      >
                        Find more like this
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Logos */}
            <div className="bg-gray-50 rounded-2xl p-6 shadow-2xl flex-1 max-w-2xl w-full">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Including {platforms.length}+ platforms.</h3>
              <div className="flex flex-wrap justify-center items-center gap-6">
                {platforms.map(platform => (
                  <img key={platform.name} src={platform.logo} alt={`${platform.name} logo`} className="h-8 w-auto object-contain" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* --- */}
      
      {/* Explore by Category Section */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto max-w-7xl px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-700 mb-6">Explore by Category</h2>
          
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-gray-200 animate-spin"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-4 border-blue-500 animate-spin-reverse"></div>
              </div>
              <p className="mt-4 text-lg text-gray-500 font-medium animate-pulse">Loading categories...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {categories.filter(cat => cat !== 'All').map((category) => (
                <button
                  key={category}
                  onClick={() => onCategoryClick(category)}
                  className="group block w-full bg-white rounded-2xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50"
                >
                  <div className="mb-2 mx-auto w-12">
                    {categoryIcons[category]}
                  </div>
                  <h3 className="text-xl font-bold text-blue-600 group-hover:text-blue-500 transition-colors duration-300">
                    {category}
                  </h3>
                  <p className="text-sm text-gray-500 mt-2">{categoryDescriptions[category]}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- */}
      {/* --- */}
      
      {/* Why RemNavi Section */}
      <div className="py-16 bg-white">
        <div className="container mx-auto max-w-7xl px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-700 mb-12">Why Choose RemNavi?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Feature 1 */}
            <div className="bg-gray-50 rounded-2xl p-8 shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500 mx-auto mb-4" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                <path d="M3.6 9h16.8" />
                <path d="M3.6 15h16.8" />
                <path d="M11.5 3a17 17 0 0 0 0 18" />
                <path d="M12.5 3a17 17 0 0 1 0 18" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Massive Job Pool</h3>
              <p className="text-gray-500">
                We pull thousands of jobs from over {platforms.length}+ top remote platforms, giving you a single, comprehensive dashboard for your job hunt.
              </p>
            </div>
            {/* Feature 2 */}
            <div className="bg-gray-50 rounded-2xl p-8 shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500 mx-auto mb-4" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
                <path d="M12 9v4l2 2" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Save Time & Energy</h3>
              <p className="text-gray-500">
                Stop wasting hours on endless scrolling. Our platform delivers a curated list of opportunities so you can focus on applying, not searching.
              </p>
            </div>
            {/* Feature 3 */}
            <div className="bg-gray-50 rounded-2xl p-8 shadow-md">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500 mx-auto mb-4" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
                <path d="M10.85 18.85l-1.397 -1.397a6.5 6.5 0 0 1 -3.253 -4.103a1.5 1.5 0 0 1 .832 -1.745l.397 -.198a2.5 2.5 0 0 0 1.258 -2.146v-1.561a2.5 2.5 0 0 0 -1.414 -2.317" />
                <path d="M13.15 18.85l1.397 -1.397a6.5 6.5 0 0 0 3.253 -4.103a1.5 1.5 0 0 0 -.832 -1.745l-.397 -.198a2.5 2.5 0 0 1 -1.258 -2.146v-1.561a2.5 2.5 0 0 1 1.414 -2.317" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Smart & Personalized</h3>
              <p className="text-gray-500">
                Our AI analyzes your search to show you the most relevant jobs first, cutting through the noise to deliver exactly what you're looking for.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* --- */}

      {/* How it Works Section */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto max-w-7xl px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-700 mb-12">How It Works: The Smart Way to Search</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {/* Step 1 */}
            <div className="bg-white rounded-2xl p-8 shadow-md relative">
              <span className="absolute top-4 left-4 text-5xl font-extrabold text-blue-200">1</span>
              <div className="pt-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500 mx-auto mb-4" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M12 12m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
                  <path d="M13.8 21a9 9 0 0 0 6.2 -14.6" />
                  <path d="M4 11h.01" />
                  <path d="M4 15h.01" />
                  <path d="M18 16h.01" />
                  <path d="M17 19h.01" />
                  <path d="M14 21h.01" />
                  <path d="M9 21h.01" />
                  <path d="M6 18h.01" />
                  <path d="M5 14h.01" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Speak Your Dream Job</h3>
                <p className="text-gray-500">
                  Click the microphone icon and simply say what you're looking for, like "frontend developer jobs in Europe with React."
                </p>
              </div>
            </div>
            {/* Step 2 */}
            <div className="bg-white rounded-2xl p-8 shadow-md relative">
              <span className="absolute top-4 left-4 text-5xl font-extrabold text-blue-200">2</span>
              <div className="pt-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500 mx-auto mb-4" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
                  <path d="M12 12v.01" />
                  <path d="M12 9l-3 3l3 3l3 -3l-3 -3" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">AI Finds Your Match</h3>
                <p className="text-gray-500">
                  Our advanced AI transcribes your voice and intelligently searches thousands of jobs to find the best-fitting opportunities for you.
                </p>
              </div>
            </div>
            {/* Step 3 */}
            <div className="bg-white rounded-2xl p-8 shadow-md relative">
              <span className="absolute top-4 left-4 text-5xl font-extrabold text-blue-200">3</span>
              <div className="pt-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500 mx-auto mb-4" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M12 12a4 4 0 1 0 4 4v4h-8v-4a4 4 0 1 0 4-4" />
                  <path d="M12 12c-2.45 -2.45 -4 -4 -4-7a4 4 0 1 1 8 0c0 3 -1.55 4.55 -4 7" />
                  <path d="M12 16a2 2 0 1 0 0 4a2 2 0 0 0 0 -4" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Start Applying</h3>
                <p className="text-gray-500">
                  Browse your personalized job list and click through to apply. Your dream remote job is just a few clicks away!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* --- */}

      {/* Call to Action Section */}
      <div className="py-20 bg-blue-600 text-white text-center">
        <div className="container mx-auto max-w-7xl px-4">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to Find Your Perfect Remote Job?</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            Join thousands of others who are using RemNavi to find their next great opportunity. It’s free, fast, and simple.
          </p>
          <button
            onClick={() => onSearch('')}
            className="px-8 py-4 bg-white text-blue-600 font-bold rounded-full text-lg shadow-xl hover:bg-gray-200 transition-colors duration-300 transform hover:scale-105"
          >
            Start Your Free Search Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;