import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Fuse from 'fuse.js';
import JobCard from './JobCard';
import SearchWithVoice from './SearchWithVoice';
import { initialCategories } from '../utils/constants';

// Map continents to their member countries for substring matching
const continentToCountries = {
  Africa: ['Nigeria', 'South Africa', 'Egypt', /* add more */],
  Asia: ['China', 'India', 'Japan', /* add more */],
  Europe: ['Germany', 'UK', 'Spain', 'France', 'Netherlands', /* add more */],
  'North America': ['USA', 'Canada', 'Mexico', /* add more */],
  'South America': ['Brazil', 'Argentina', 'Chile', /* add more */],
  Oceania: ['Australia', 'New Zealand', /* add more */],
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
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const [currentFilteredJobs, setCurrentFilteredJobs] = useState(jobs);

  const continents = ['All', 'Africa', 'Asia', 'Europe', 'North America', 'South America', 'Oceania', 'Worldwide'];
  // countries object now only for dropdown options; continentToCountries used for filtering
  const countries = {
    Europe: ['All', 'Germany', 'UK', 'Spain', 'France', 'Netherlands'],
    'North America': ['All', 'USA', 'Canada', 'Mexico'],
    // add more if needed
  };
  const salaryRanges = ['All', '< $50k', '$50k - $80k', '$80k - $120k', '$120k+'];
  const jobTypes = ['All', 'full-time', 'part-time', 'contract', 'internship'];

  // Fuse.js instance for fuzzy search
  const fuse = useMemo(
    () => new Fuse(jobs, {
      keys: ['title', 'company', 'description', 'location'],
      threshold: 0.3,
      includeScore: true,
    }),
    [jobs]
  );

  const handleSearch = useCallback(() => {
    let filtered = [...jobs];

    // Platform filter
    if (selectedPlatform !== 'All') {
      filtered = filtered.filter(job => job.source === selectedPlatform);
    }

    // Category filter
    if (selectedCategory !== 'All') {
      const keywords = initialCategories[selectedCategory] || [];
      const catKeys = keywords.map(k => k.toLowerCase());
      filtered = filtered.filter(job => {
const rawCat = job.category;
let catStr = '';
if (typeof rawCat === 'string') {
  catStr = rawCat;
} else if (Array.isArray(rawCat)) {
  catStr = rawCat.join(' ');
} else if (rawCat != null) {
  catStr = JSON.stringify(rawCat);
}
const catLower = catStr.toLowerCase();
return catKeys.some(k => catLower.includes(k));
      });
    }

    // Continent filter (by continent field OR by location substring matching)
    if (selectedContinent !== 'All' && selectedContinent !== 'Worldwide') {
      const countriesInContinent = continentToCountries[selectedContinent] || [];
      filtered = filtered.filter(job => {
        const loc = (job.location || '').toLowerCase();
        const continentMatch = job.continent?.toLowerCase() === selectedContinent.toLowerCase();
        const countryMatch = countriesInContinent.some(country => loc.includes(country.toLowerCase()));
        return continentMatch || countryMatch;
      });
    }

    // Country filter (substring match against location or explicit country field)
    if (selectedCountry !== 'All') {
      const countryLower = selectedCountry.toLowerCase();
      filtered = filtered.filter(job => {
        const loc = (job.location || '').toLowerCase();
        const locMatch = loc.includes(countryLower);
        const countryFieldMatch = job.country?.toLowerCase() === countryLower;
        return locMatch || countryFieldMatch;
      });
    }

    // Salary filter
    if (selectedSalary !== 'All') {
      filtered = filtered.filter(job => {
        if (!job.salary) return false;
        const [min, max] = selectedSalary
          .replace(/[$,k+]/g, '')
          .split(' - ')
          .map(s => parseInt(s) * 1000);
        const jobSal = parseInt(
          job.salary.replace(/[$,k+]/g, '').split(' - ')[0]
        ) * 1000;
        return selectedSalary.includes('+')
          ? jobSal >= min
          : jobSal >= min && jobSal <= max;
      });
    }

    // Job type filter
    if (selectedJobType !== 'All') {
      filtered = filtered.filter(
        job => job.job_type?.toLowerCase() === selectedJobType.toLowerCase()
      );
    }

    // Fuzzy pre-ranking with Fuse.js
    if (localSearchTerm.length >= 2 && filtered.length > 0) {
      const results = fuse
        .search(localSearchTerm)
        .slice(0, 100)
        .map(r => r.item);
      filtered = results;
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
  ]);

  useEffect(() => {
    handleSearch();
  }, [handleSearch]);

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

  const handleContinentChange = e => {
    setSelectedContinent(e.target.value);
    setSelectedCountry('All');
  };

  const isDataLoading = isLoading;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans p-4 sm:p-8">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <header className="flex flex-col sm:flex-row items-center justify-between mb-6">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-blue-600 mb-2 sm:mb-0">
            Jobs Dashboard
          </h1>
          <button
            onClick={() => setCurrentPage('landing')}
            className="p-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl shadow-md flex items-center gap-2"
          >
            Back to Home
          </button>
        </header>

        {/* Search & Filters Panel */}
        <div className="mb-8 p-5 bg-white rounded-2xl shadow-2xl flex flex-col gap-4">
          {/* Keyword + Category */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-2/3 flex gap-2">
              <div className="w-full">
                <label
                  htmlFor="search-input"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Search by keyword:
                </label>
                <SearchWithVoice
                  searchTerm={localSearchTerm}
                  setSearchTerm={setLocalSearchTerm}
                />
              </div>
              <button
                onClick={handleSearch}
                className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-lg"
              >
                🔍
              </button>
            </div>
            <div className="w-full sm:w-1/3">
              <label
                htmlFor="category-select"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Category:
              </label>
              <select
                id="category-select"
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full p-3 bg-gray-100 rounded-xl"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Continent, Country, Salary, Job Type, Clear */}
          <div className="flex flex-wrap gap-4">
            {/* Continent */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Continent:
              </label>
              <select
                value={selectedContinent}
                onChange={handleContinentChange}
                className="w-full p-3 bg-gray-100 rounded-xl"
              >
                {continents.map(c => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Country */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Country:
              </label>
              <select
                value={selectedCountry}
                onChange={e => setSelectedCountry(e.target.value)}
                disabled={!countries[selectedContinent]}
                className="w-full p-3 bg-gray-100 rounded-xl disabled:opacity-50"
              >
                {countries[selectedContinent]?.map(ct => (
                  <option key={ct} value={ct}>
                    {ct}
                  </option>
                ))}
              </select>
            </div>

            {/* Salary */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Salary Range:
              </label>
              <select
                value={selectedSalary}
                onChange={e => setSelectedSalary(e.target.value)}
                className="w-full p-3 bg-gray-100 rounded-xl"
              >
                {salaryRanges.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            {/* Job Type */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Type:
              </label>
              <select
                value={selectedJobType}
                onChange={e => setSelectedJobType(e.target.value)}
                className="w-full p-3 bg-gray-100 rounded-xl"
              >
                {jobTypes.map(t => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear */}
            <button
              onClick={handleClearFilters}
              className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-lg"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Job List */}
        {isDataLoading ? (
          <p className="text-center text-gray-500">Loading jobs…</p>
        ) : error ? (
          <div className="bg-red-100 text-red-700 p-8 rounded-2xl text-center">
            {error}
          </div>
        ) : currentFilteredJobs.length === 0 ? (
          <p className="text-center text-gray-500">No jobs match your filters.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {currentFilteredJobs.map(job => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobsPage;
