import React, { useState, useRef } from 'react';

// src/components/SearchWithVoice.jsx
const SearchWithVoice = ({ onAIJobSearch, searchTerm, setSearchTerm }) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState('');
  const recognitionRef = useRef(null);

  const startVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window)) {
      setError('Your browser does not support the Web Speech API. Please use Google Chrome.');
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setError('');
    };

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setSearchTerm(transcript);
      if (onAIJobSearch) {
        onAIJobSearch(transcript);
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setError('An error occurred. Please try again.');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const stopVoiceSearch = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  return (
    <div className="flex items-center gap-4 w-full">
      <input
        type="text"
        placeholder="Search with text or voice..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-3 rounded-xl bg-gray-100 text-gray-800 placeholder-gray-400 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner"
      />
      <button
        onClick={isListening ? stopVoiceSearch : startVoiceSearch}
        className={`p-3 rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 ${isListening ? 'bg-red-500 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
        aria-label="Search with voice"
      >
        {isListening ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.635c.66.425 1.706.674 3.327.674h.014c.731.002 1.455-.121 2.115-.369M14.935 14.493a1.23 1.23 0 01-.41 1.635c-.66.425-1.706.674-3.327.674h-.014c-.731.002-1.455-.121-2.115-.369" clipRule="evenodd" />
          </svg>
        )}
      </button>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
};

export default SearchWithVoice;