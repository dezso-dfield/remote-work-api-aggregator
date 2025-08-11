// src/components/JobsPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Fuse from 'fuse.js';
import JobCard from './JobCard';
import SearchWithVoice from './SearchWithVoice';
import { initialCategories } from '../utils/constants';
import { Head } from 'vite-react-ssg';

// ——— Helpers ———
const parseSalary = (sal) => {
  if (sal == null) return null;
  if (typeof sal === 'number') return sal;
  let s = String(sal).trim();
  s = s.replace(/[, ]/g, '').replace(/\$/g, '');
  const rangeParts = s.split(/[-–—to]+/i).map(p => p.trim());
  const normalizePart = (p) => {
    const low = p.toLowerCase();
    if (low.endsWith('k')) return parseFloat(low) * 1000;
    if (low.endsWith('m')) return parseFloat(low) * 1_000_000;
    if (low.endsWith('$')) return parseFloat(low.slice(0, -1));
    const n = parseFloat(low);
    return Number.isNaN(n) ? null : n;
  };
  if (rangeParts.length > 1) {
    const n0 = normalizePart(rangeParts[0]);
    const n1 = normalizePart(rangeParts[1]);
    if (n0 != null && n1 != null) return (n0 + n1) / 2;
    if (n0 != null) return n0;
    if (n1 != null) return n1;
    return null;
  }
  return normalizePart(s);
};

// Map continents to their member countries for substring matching
const continentToCountries = {
  Africa: ['Nigeria', 'South Africa', 'Egypt'],
  Asia: ['China', 'India', 'Japan'],
  Europe: ['Germany', 'UK', 'Spain', 'France', 'Netherlands'],
  'North America': ['USA', 'Canada', 'Mexico'],
  'South America': ['Brazil', 'Argentina', 'Chile'],
  Oceania: ['Australia', 'New Zealand'],
};

const JobsPage = ({
  jobs,
  isLoading,
  error,
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  selectedPlatform,
  setSelectedPlatform,
  categories,
  platforms,
  setCurrentPage,
  clearFilters,
}) => {
  const [selectedContinent, setSelectedContinent] = useState('All');
  const [selectedCountry, setSelectedCountry] = useState('All');
  const [selectedSalary, setSelectedSalary] = useState('All');
  const [selectedJobType, setSelectedJobType] = useState('All');
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm || '');
  const [currentFilteredJobs, setCurrentFilteredJobs] = useState(jobs);

  // keep local input synced with prop (prop may come from URL)
  useEffect(() => {
    setLocalSearchTerm(searchTerm || '');
  }, [searchTerm]);

  const platformList = platforms || [];
  const continents = ['All', 'Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania', 'Worldwide'];
  const countries = {
    Europe: ['All', 'Germany', 'UK', 'Spain', 'France', 'Netherlands'],
    'North America': ['All', 'USA', 'Canada', 'Mexico'],
  };
  const salaryRanges = ['All', '< $50k', '$50k - $80k', '$80k - $120k', '$120k+'];
  const jobTypes = ['All', 'full-time', 'part-time', 'contract', 'internship'];

  // Fuzzy search over incoming jobs
  const fuse = useMemo(
    () =>
      new Fuse(jobs, {
        keys: ['title', 'company', 'description', 'location'],
        threshold: 0.3,
        includeScore: true,
      }),
    [jobs]
  );

  const handleSearch = useCallback(() => {
    let filtered = Array.isArray(jobs) ? [...jobs] : [];

    // Platform (use queryPrefix to match sources like "Greenhouse:*")
    if (selectedPlatform && selectedPlatform !== 'All') {
      const plat = platformList.find(p => p.name === selectedPlatform);
      const prefix = (plat?.queryPrefix || selectedPlatform).toLowerCase();
      filtered = filtered.filter(j => (j.source || '').toLowerCase().startsWith(prefix));
    }

    // Category (use keyword map if available, else fallback to label substring)
    if (selectedCategory && selectedCategory !== 'All') {
      const keywords = (initialCategories && initialCategories[selectedCategory]) || [];
      const catLower = selectedCategory.toLowerCase();

      if (Array.isArray(keywords) && keywords.length > 0) {
        const keysLower = keywords.map(k => String(k).toLowerCase());
        filtered = filtered.filter(job => {
          const rawCat = job.category;
          let catStr = '';
          if (typeof rawCat === 'string') catStr = rawCat;
          else if (Array.isArray(rawCat)) catStr = rawCat.join(' ');
          else if (rawCat != null) catStr = JSON.stringify(rawCat);
          const jobCatLower = catStr.toLowerCase();
          return keysLower.some(k => jobCatLower.includes(k));
        });
      } else {
        filtered = filtered.filter(job =>
          (job.category || '').toLowerCase().includes(catLower)
        );
      }
    }

    // Continent (field or substring)
    if (selectedContinent !== 'All' && selectedContinent !== 'Worldwide') {
      const countriesInContinent = continentToCountries[selectedContinent] || [];
      filtered = filtered.filter(job => {
        const loc = (job.location || '').toLowerCase();
        const continentMatch = job.continent?.toLowerCase() === selectedContinent.toLowerCase();
        const countryMatch = countriesInContinent.some(country => loc.includes(country.toLowerCase()));
        return continentMatch || countryMatch;
      });
    }

    // Country (field or substring)
    if (selectedCountry !== 'All') {
      const countryLower = selectedCountry.toLowerCase();
      filtered = filtered.filter(job => {
        const loc = (job.location || '').toLowerCase();
        const locMatch = loc.includes(countryLower);
        const countryFieldMatch = (job.country || '').toLowerCase() === countryLower;
        return locMatch || countryFieldMatch;
      });
    }

    // Salary
    if (selectedSalary !== 'All') {
      const [minRaw, maxRaw] = selectedSalary.replace(/[$,k+]/g, '').split(' - ');
      const min = parseInt(minRaw, 10) * 1000;
      const max = maxRaw ? parseInt(maxRaw, 10) * 1000 : Infinity;

      filtered = filtered.filter(job => {
        const num = parseSalary(job.salary);
        return num != null && (selectedSalary.includes('+') ? num >= min : num >= min && num <= max);
      });
    }

    // Job type (optional field)
    if (selectedJobType !== 'All') {
      filtered = filtered.filter(
        job => (job.job_type || '').toLowerCase() === selectedJobType.toLowerCase()
      );
    }

    // Fuzzy search
    if (localSearchTerm && localSearchTerm.trim().length >= 2 && filtered.length > 0) {
      const ids = new Set(filtered.map(j => j.id));
      const results = fuse.search(localSearchTerm.trim()).map(r => r.item).filter(j => ids.has(j.id));
      filtered = results.length ? results.slice(0, 100) : filtered;
    }

    setCurrentFilteredJobs(filtered);
  }, [
    jobs,
    selectedPlatform,
    selectedCategory,
    selectedContinent,
    selectedCountry,
    selectedSalary,
    selectedJobType,
    localSearchTerm,
    fuse,
    platformList
  ]);

  // run filtering whenever inputs change
  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

  // ——— Real-time URL sync ———
  useEffect(() => {
    if (typeof window === 'undefined' || window.location.pathname !== '/jobs') return;

    const sp = new URLSearchParams(window.location.search);

    const q = (localSearchTerm || '').trim();
    if (q) sp.set('q', q); else sp.delete('q');

    if (selectedCategory && selectedCategory !== 'All') sp.set('category', selectedCategory);
    else sp.delete('category');

    // map selected platform -> source prefix (e.g., "Greenhouse", "Jobicy")
    if (selectedPlatform && selectedPlatform !== 'All') {
      const plat = (platformList || []).find(p => p.name === selectedPlatform);
      const prefix = plat?.queryPrefix || selectedPlatform;
      sp.set('source', prefix);
    } else {
      sp.delete('source');
    }

    // client-only filters, useful for sharing deep links
    if (selectedContinent && selectedContinent !== 'All') sp.set('cont', selectedContinent); else sp.delete('cont');
    if (selectedCountry && selectedCountry !== 'All')   sp.set('country', selectedCountry);   else sp.delete('country');
    if (selectedSalary && selectedSalary !== 'All')     sp.set('salary', selectedSalary);     else sp.delete('salary');
    if (selectedJobType && selectedJobType !== 'All')   sp.set('type', selectedJobType);      else sp.delete('type');

    const qs = sp.toString();
    const url = qs ? `/jobs?${qs}` : '/jobs';
    window.history.replaceState({}, '', url);
  }, [
    localSearchTerm,
    selectedCategory,
    selectedPlatform,
    selectedContinent,
    selectedCountry,
    selectedSalary,
    selectedJobType,
    platformList
  ]);

  const handleClearFilters = () => {
    setLocalSearchTerm('');
    setSelectedCategory('All');
    setSelectedPlatform('All');
    setSelectedContinent('All');
    setSelectedCountry('All');
    setSelectedSalary('All');
    setSelectedJobType('All');
    setCurrentFilteredJobs(jobs);
  };

  const handleContinentChange = (e) => {
    setSelectedContinent(e.target.value);
    setSelectedCountry('All');
  };

  const isDataLoading = isLoading;

  // ——— UI ———
  return (
    <>
      <Head prioritizeSeoTags htmlAttributes={{ lang: 'en' }}>
        {/* SEO head */}
        <title>Browse Remote Jobs — RemNavi</title>
        <meta name="description" content="Browse curated remote job listings in English. Filter by category, salary, continent, country, and job type. Updated from top remote job boards." />
        <meta name="robots" content="index,follow" />
        <link rel="canonical" href="https://remnavi.com/jobs" />
      </Head>

      <div className="min-h-screen bg-gray-50 text-gray-800 font-sans p-4 sm:p-8">
        <div className="container mx-auto max-w-7xl">
          {/* Header */}
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div className="flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                <path d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v2H2V8a2 2 0 012-2h2zm0 2h8V5a1 1 0 00-1-1H9a1 1 0 00-1 1v1z" />
                <path d="M2 10h16v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
              </svg>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-600">Jobs Dashboard</h1>
            </div>
            <button
              onClick={() => setCurrentPage('landing')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-800 shadow-md"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 1.293a1 1 0 00-1.414 0L2 8.586V17a2 2 0 002 2h4a1 1 0 001-1v-4h2v4a1 1 0 001 1h4a2 2 0 002-2V8.586l-7.293-7.293z"/></svg>
              Back to Home
            </button>
          </header>

          {/* Search & Filters Panel */}
          <div className="mb-8 p-5 bg-white rounded-2xl shadow-2xl">
            <fieldset className="space-y-4">
              <legend className="sr-only">Search and filters</legend>

              {/* Search row */}
              <div className="flex flex-col lg:flex-row gap-4">
                {/* Keyword Search */}
                <div className="flex-1">
                  <label htmlFor="job-search" className="block text-sm font-medium text-gray-700 mb-1">
                    Keywords
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 10.89 7.876l4.817 4.817a1 1 0 101.414-1.414l-4.816-4.816A6 6 0 108 4z" clipRule="evenodd"/></svg>
                    </div>
                    <div className="pl-9 pr-2 rounded-xl border border-gray-300 bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500">
                      <SearchWithVoice
                        id="job-search"
                        placeholder="e.g., react, fintech, senior"
                        aria-label="Search jobs by keyword"
                        searchTerm={localSearchTerm}
                        setSearchTerm={setLocalSearchTerm}
                      />
                    </div>
                  </div>
                </div>

                {/* Category */}
                <div className="w-full lg:w-72">
                  <label htmlFor="category-select" className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path d="M17.707 10.293l-7-7A1 1 0 009.586 3H4a1 1 0 00-1 1v5.586a1 1 0 00.293.707l7 7a1 1 0 001.414 0l6-6a1 1 0 000-1.414zM7 7a1 1 0 110-2 1 1 0 010 2z"/></svg>
                    </div>
                    <select
                      id="category-select"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full appearance-none pl-9 pr-10 py-3 rounded-xl bg-gray-50 text-gray-800 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 pr-3 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                    </div>
                  </div>
                </div>

                {/* Platform */}
                <div className="w-full lg:w-64">
                  <label htmlFor="platform-select" className="block text-sm font-medium text-gray-700 mb-1">
                    Platform
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v14H3a1 1 0 100 2h14a1 1 0 100-2h-2V3a1 1 0 00-1-1H6zm2 2h1v2H8V4zm3 0h1v2h-1V4zM8 8h1v2H8V8zm3 0h1v2h-1V8zM8 12h1v2H8v-2zm3 0h1v2h-1v-2z" clipRule="evenodd"/></svg>
                    </div>
                    <select
                      id="platform-select"
                      value={selectedPlatform}
                      onChange={(e) => setSelectedPlatform(e.target.value)}
                      className="w-full appearance-none pl-9 pr-10 py-3 rounded-xl bg-gray-50 text-gray-800 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="All">All</option>
                      {platformList.map((p) => (
                        <option key={p.name} value={p.name}>{p.name}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 pr-3 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                    </div>
                  </div>
                </div>

                {/* Search action */}
                <div className="w-full lg:w-auto flex items-end">
                  <button
                    onClick={handleSearch}
                    className="w-full lg:w-auto px-5 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white shadow-lg"
                    aria-label="Run search"
                  >
                    Search
                  </button>
                </div>
              </div>

              {/* Secondary filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                {/* Continent */}
                <div>
                  <label htmlFor="continent-select" className="block text-sm font-medium text-gray-700 mb-1">
                    Continent
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm-1 14A6 6 0 015 6.1V6a6 6 0 1111.9 1H16a6 6 0 01-7 9z"/></svg>
                    </div>
                    <select
                      id="continent-select"
                      value={selectedContinent}
                      onChange={handleContinentChange}
                      className="w-full appearance-none pl-9 pr-10 py-3 rounded-xl bg-gray-50 text-gray-800 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {continents.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 pr-3 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                    </div>
                  </div>
                </div>

                {/* Country */}
                <div>
                  <label htmlFor="country-select" className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path d="M3 2a1 1 0 000 2h9l1 2 2-2h2v10h-2l-1 2-2-2H4v4H2V2h1z"/></svg>
                    </div>
                    <select
                      id="country-select"
                      value={selectedCountry}
                      onChange={(e) => setSelectedCountry(e.target.value)}
                      disabled={!countries[selectedContinent]}
                      className="w-full appearance-none pl-9 pr-10 py-3 rounded-xl bg-gray-50 text-gray-800 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {countries[selectedContinent]?.map((ct) => <option key={ct} value={ct}>{ct}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 pr-3 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                    </div>
                  </div>
                </div>

                {/* Salary */}
                <div>
                  <label htmlFor="salary-select" className="block text-sm font-medium text-gray-700 mb-1">
                    Salary Range
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v1H2V6z"/><path d="M2 9h16v5a2 2 0 01-2 2H4a2 2 0 01-2-2V9z"/></svg>
                    </div>
                    <select
                      id="salary-select"
                      value={selectedSalary}
                      onChange={(e) => setSelectedSalary(e.target.value)}
                      className="w-full appearance-none pl-9 pr-10 py-3 rounded-xl bg-gray-50 text-gray-800 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {salaryRanges.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 pr-3 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                    </div>
                  </div>
                </div>

                {/* Job Type */}
                <div>
                  <label htmlFor="jobtype-select" className="block text-sm font-medium text-gray-700 mb-1">
                    Job Type
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 00-1 1v1H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V6a2 2 0 00-2-2h-2V3a1 1 0 00-1-1H9zM8 7h4a1 1 0 010 2H8a1 1 0 010-2z"/></svg>
                    </div>
                    <select
                      id="jobtype-select"
                      value={selectedJobType}
                      onChange={(e) => setSelectedJobType(e.target.value)}
                      className="w-full appearance-none pl-9 pr-10 py-3 rounded-xl bg-gray-50 text-gray-800 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {jobTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 pr-3 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <p className="text-sm text-gray-500">
                  {currentFilteredJobs.length} result{currentFilteredJobs.length === 1 ? '' : 's'}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleClearFilters}
                    className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white shadow"
                  >
                    Clear Filters
                  </button>
                  <button
                    onClick={handleSearch}
                    className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white shadow"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </fieldset>
          </div>

          {/* Job List */}
          {isDataLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-4 border-gray-200 animate-spin"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full border-4 border-blue-500 animate-spin-reverse"></div>
              </div>
              <p className="mt-4 text-lg text-gray-500 font-medium animate-pulse">Loading jobs…</p>
            </div>
          ) : error ? (
            <div className="bg-red-100 text-red-700 p-6 rounded-2xl text-center">{error}</div>
          ) : currentFilteredJobs.length === 0 ? (
            <div className="text-center p-8 bg-white rounded-2xl shadow">
              <p className="text-gray-600">No jobs match your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentFilteredJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default JobsPage;
