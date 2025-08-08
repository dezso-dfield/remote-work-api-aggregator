// JobCard.jsx
import React from 'react';
import { categoryIcons, categoryDescriptions } from '../utils/constants';

const knownJobTypes = ['full-time', 'part-time', 'contract', 'internship'];

const JobCard = ({ job }) => {
  const loc = job.location || '';
  const isValidLocation = loc && !knownJobTypes.includes(loc.toLowerCase());

  return (
    <a
      href={job.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-transform transform hover:-translate-y-1"
    >
      <h2 className="text-xl font-bold text-blue-600 mb-3">{job.title}</h2>
      <div className="text-sm text-gray-700 space-y-3">

        {/* Category */}
        {job.category && (
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              {categoryIcons[job.category]}
              <strong>{job.category}</strong>
            </div>
            {categoryDescriptions[job.category] && (
              <p className="text-xs text-gray-500 pl-6">
                {categoryDescriptions[job.category]}
              </p>
            )}
          </div>
        )}

        {/* Company */}
        {job.company && (
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg"
                 className="h-5 w-5 text-gray-500"
                 viewBox="0 0 20 20"
                 fill="currentColor">
              <path fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"/>
            </svg>
            <span>{job.company}</span>
          </div>
        )}

        {/* Location */}
        {isValidLocation && (
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg"
                 className="h-5 w-5 text-gray-500"
                 viewBox="0 0 20 20"
                 fill="currentColor">
              <path fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"/>
            </svg>
            <span>{loc}</span>
          </div>
        )}

        {/* Salary (cash icon) */}
        {job.salary && (
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg"
                 className="h-5 w-5 text-green-500"
                 viewBox="0 0 20 20"
                 fill="currentColor">
              <path d="M10 2a6 6 0 00-6 6v4a6 6 0 006 6 6 6 0 006-6V8a6 6 0 00-6-6z"/>
              <path fillRule="evenodd"
                    d="M8 9a1 1 0 011-1h2a1 1 0 010 2H9v1h2a1 1 0 110 2H9v1h2a1 1 0 110 2H9a1 1 0 110-2H8v-1h1a1 1 0 110-2H8V9z"
                    clipRule="evenodd"/>
            </svg>
            <span>{job.salary}</span>
          </div>
        )}

        {/* Source */}
        {job.source && (
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg"
                 className="h-5 w-5 text-gray-500"
                 viewBox="0 0 20 20"
                 fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
              <path fillRule="evenodd"
                    d="M4 5a2 2 0 012-2h2V1a1 1 0 112 0v2h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm2 0h8v14H6V5zm2 5h4v4H8v-4z"
                    clipRule="evenodd"/>
            </svg>
            <span>{job.source}</span>
          </div>
        )}

      </div>
    </a>
  );
};

export default JobCard;