// src/components/LandingPage.jsx
import React, { useMemo } from 'react';
import SearchWithVoice from './SearchWithVoice';
import { categoryDescriptions } from '../utils/constants';
import { Head } from 'vite-react-ssg';

import {
  FaTag, FaLaptopCode, FaCogs, FaDatabase, FaPalette, FaProjectDiagram, FaBullhorn,
  FaHandshake, FaHeadset, FaTasks, FaUserTie, FaMoneyBillWave, FaGavel, FaServer,
  FaShieldAlt, FaBug, FaPenNib, FaChalkboardTeacher, FaStethoscope, FaLifeRing,
  FaWrench, FaChartLine, FaMobileAlt, FaRobot, FaCloud, FaCompass, FaRocket,
  FaLightbulb, FaGlobeAmericas, FaLeaf, FaAnchor, FaBicycle, FaBolt, FaFlask,
  FaGamepad, FaSearch, FaBriefcase, FaGlobe, FaClock, FaMagic
} from 'react-icons/fa';

// Placeholder for predefined jobs
const predefinedJobs = [
  { id: 'pre-1', title: 'Senior Frontend Developer', company: 'Tech Innovators Inc.', category: 'Tech', location: 'Worldwide', salary: '$120,000 - $150,000', url: '#', source: 'Internal' },
  { id: 'pre-2', title: 'Digital Marketing Manager', company: 'Creative Solutions Co.', category: 'Marketing & Sales', location: 'Remote Europe', salary: '$80,000 - $100,000', url: '#', source: 'Internal' },
  { id: 'pre-3', title: 'Data Scientist', company: 'Global Data Analytics', category: 'Data', location: 'Remote US', salary: '$130,000 - $160,000', url: '#', source: 'Internal' },
  { id: 'pre-4', title: 'Customer Support Specialist', company: 'NextGen Services', category: 'Customer Service', location: 'Remote', salary: '$50,000 - $70,000', url: '#', source: 'Internal' },
];

const quickSearches = [
  'frontend react',
  'python backend',
  'product manager',
  'data scientist',
  'designer figma',
  'devops aws',
];

// Fixed unique picks for common categories
const FIXED_CATEGORY_ICON = {
  Tech: FaLaptopCode,
  Engineering: FaCogs,
  Data: FaDatabase,
  Design: FaPalette,
  Product: FaProjectDiagram,
  'Marketing & Sales': FaBullhorn,
  Sales: FaHandshake,
  'Customer Service': FaHeadset,
  Operations: FaTasks,
  HR: FaUserTie,
  Finance: FaMoneyBillWave,
  Legal: FaGavel,
  DevOps: FaServer,
  Security: FaShieldAlt,
  QA: FaBug,
  Content: FaPenNib,
  Education: FaChalkboardTeacher,
  Healthcare: FaStethoscope,
  Support: FaLifeRing,
  Admin: FaWrench,
  Analytics: FaChartLine,
  Mobile: FaMobileAlt,
  'AI/ML': FaRobot,
  Cloud: FaCloud,
};

// Extra pool for any unknown categories (kept large to maintain distinctness)
const FALLBACK_ICON_POOL = [
  FaCompass, FaRocket, FaLightbulb, FaGlobeAmericas, FaLeaf, FaAnchor, FaBicycle,
  FaBolt, FaFlask, FaGamepad, FaGlobe, FaClock, FaBriefcase, FaSearch, FaMagic,
];

// Pure helper to build a unique icon map (no hooks here)
function buildIconMap(categories = []) {
  const map = new Map();
  const used = new Set(Object.values(FIXED_CATEGORY_ICON));
  const pool = [...FALLBACK_ICON_POOL];

  const list = categories.filter((c) => c && c !== 'All');
  for (const cat of list) {
    let Icon = FIXED_CATEGORY_ICON[cat];
    if (!Icon || used.has(Icon)) {
      Icon = pool.find((I) => !used.has(I)) || FaTag;
    }
    used.add(Icon);
    map.set(cat, Icon);
  }
  return map;
}

const LandingPage = ({
  userLocation,
  categories = [],
  platforms = [],
  onSearch,
  onAIJobSearch,
  landingSearchTerm,
  setLandingSearchTerm,
  isLoading,
  jobs = [],
}) => {
  const getGreetingEmoji = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '🌅';
    if (hour < 18) return '☀️';
    return '🌙';
  };

  // HOOKS — always called, never conditionally
  const displayedJobs = useMemo(() => {
    if (jobs.length > 0) {
      const shuffled = [...jobs].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, 4);
    }
    return predefinedJobs.slice(0, 4);
  }, [jobs]);

  const iconMap = useMemo(() => buildIconMap(categories), [categories]);

  return (
    <>
      <Head prioritizeSeoTags htmlAttributes={{ lang: 'en' }}>
        <title>RemNavi — International Remote Jobs (English)</title>
        <meta
          name="description"
          content="Discover international remote jobs in English across engineering, design, product, marketing and more. Fast search, salary filters, and curated listings from top platforms."
        />
        <meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1" />
        <link rel="canonical" href="https://remnavi.com/" />
        <link rel="alternate" hrefLang="en" href="https://remnavi.com/" />
      </Head>

      <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
        {/* Hero Section */}
        <div className="py-20 bg-gradient-to-br from-white to-blue-50 min-h-[70vh] flex flex-col items-center justify-center">
          <div className="container mx-auto max-w-7xl text-center px-4">
            <h1 className="text-4xl sm:text-6xl font-extrabold text-blue-600 mb-4">
              Unlock Your Remote Career.
            </h1>
            <p className="text-xl sm:text-2xl text-gray-700 font-light max-w-3xl mx-auto mb-10">
              <strong>RemNavi</strong> aggregates the best remote jobs so you don’t have to. {/*{getGreetingEmoji()}*/}
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 p-5 rounded-2xl bg-white shadow-2xl max-w-2xl mx-auto">
              <SearchWithVoice
                onAIJobSearch={onAIJobSearch}
                searchTerm={landingSearchTerm}
                setSearchTerm={setLandingSearchTerm}
              />
              <button
                onClick={() => onSearch(landingSearchTerm)}
                className="w-full sm:w-auto p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                aria-label="Search"
              >
                <FaSearch className="h-5 w-5" />
                <span>Search</span>
              </button>
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {quickSearches.map((q) => (
                <button
                  key={q}
                  onClick={() => onSearch(q)}
                  className="px-3 py-1.5 text-sm rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100"
                >
                  {q}
                </button>
              ))}
            </div>

            {userLocation && (
              <p className="mt-6 text-lg text-gray-600">
                Yes, we also find remote jobs for <span className="font-semibold text-blue-500">{userLocation}</span>!
              </p>
            )}
          </div>
        </div>

        {/* Stats + previews */}
        <div className="py-16 bg-white text-center">
          <div className="container mx-auto max-w-2xl px-4">
            <div className="flex flex-col items-center gap-10">
              <div className="bg-gray-50 rounded-2xl p-6 shadow-2xl w-full">
                <div className="flex flex-row justify-between items-center w-full mb-4">
                  <div className="text-left">
                    <h3 className="text-4xl font-bold text-gray-700 mb-2">
                      {isLoading ? '...' : jobs.length > 0 ? jobs.length : '100+'}
                    </h3>
                    <p className="text-xl text-gray-500">Live Jobs Indexed</p>
                  </div>
                  <button
                    onClick={() => onSearch('')}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800 inline-flex items-center gap-2"
                  >
                    <FaBriefcase />
                    View All Jobs &rarr;
                  </button>
                </div>

                <div className="w-full text-left">
                  <h4 className="font-semibold text-gray-700 mb-2">Some jobs you'll find:</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {displayedJobs.map((job) => (
                      <div key={job.id} className="p-4 bg-white rounded-lg shadow-inner">
                        <h4 className="font-semibold text-gray-800">{job.title}</h4>
                        <p className="text-sm text-gray-500">{job.company}</p>
                        <button
                          onClick={() => onSearch(job.title)}
                          className="mt-3 px-4 py-2 text-xs font-medium text-blue-600 bg-blue-100 rounded-full hover:bg-blue-200"
                        >
                          Find more like this
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Logos */}
              <div className="bg-gray-50 rounded-2xl p-6 shadow-2xl max-w-2xl w-full">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">
                  Including {platforms.length}+ platforms.
                </h3>
                <div className="flex flex-wrap justify-center items-center gap-6">
                  {platforms.map((platform) => (
                    <img
                      key={platform.name}
                      src={platform.logo}
                      alt={`${platform.name} logo`}
                      className="max-h-8 w-auto object-cover"
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

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
                {categories
                  .filter((cat) => cat !== 'All')
                  .map((category) => {
                    const Icon = iconMap.get(category) || FaTag;
                    return (
                      <button
                        key={category}
                        onClick={() => onSearch(category)} // use as search input, not base filter
                        className="group block w-full bg-white rounded-2xl p-6 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2 focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50"
                      >
                        <div className="mb-2 mx-auto w-12 h-12 flex items-center justify-center">
                          <Icon className="w-12 h-12 text-blue-500" />
                        </div>
                        <h3 className="text-xl font-bold text-blue-600 group-hover:text-blue-500 transition-colors duration-300">
                          {category}
                        </h3>
                        <p className="text-sm text-gray-500 mt-2">{categoryDescriptions[category]}</p>
                      </button>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* Why RemNavi Section */}
        <div className="py-16 bg-white">
          <div className="container mx-auto max-w-7xl px-4 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-700 mb-12">Why Choose RemNavi?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="bg-gray-50 rounded-2xl p-8 shadow-md">
                <FaGlobe className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Massive Job Pool</h3>
                <p className="text-gray-500">
                  We pull thousands of jobs from over {platforms.length}+ top remote platforms, giving you a single,
                  comprehensive dashboard for your job hunt.
                </p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-8 shadow-md">
                <FaClock className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Save Time & Energy</h3>
                <p className="text-gray-500">
                  Stop wasting hours on endless scrolling. Our platform delivers a curated list of opportunities so you can
                  focus on applying, not searching.
                </p>
              </div>
              <div className="bg-gray-50 rounded-2xl p-8 shadow-md">
                <FaMagic className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Smart & Personalized</h3>
                <p className="text-gray-500">
                  Our AI analyzes your search to show you the most relevant jobs first, cutting through the noise to deliver
                  exactly what you're looking for.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* How it Works Section */}
        <div className="py-16 bg-gray-50">
          <div className="container mx-auto max-w-7xl px-4 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-700 mb-12">How It Works: The Smart Way to Search</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="bg-white rounded-2xl p-8 shadow-md relative">
                <span className="absolute top-4 left-4 text-5xl font-extrabold text-blue-200">1</span>
                <div className="pt-8">
                  <FaSearch className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Speak Your Dream Job</h3>
                  <p className="text-gray-500">
                    Click the microphone icon and simply say what you're looking for, like "frontend developer jobs in Europe
                    with React."
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-md relative">
                <span className="absolute top-4 left-4 text-5xl font-extrabold text-blue-200">2</span>
                <div className="pt-8">
                  <FaMagic className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">AI Finds Your Match</h3>
                  <p className="text-gray-500">
                    Our advanced AI transcribes your voice and intelligently searches thousands of jobs to find the best-fitting
                    opportunities for you.
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-md relative">
                <span className="absolute top-4 left-4 text-5xl font-extrabold text-blue-200">3</span>
                <div className="pt-8">
                  <FaRocket className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">Start Applying</h3>
                  <p className="text-gray-500">
                    Browse your personalized job list and click through to apply. Your dream remote job is just a few clicks away!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

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
    </>
  );
};

export default LandingPage;
