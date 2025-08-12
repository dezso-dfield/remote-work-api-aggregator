// src/hooks/useJobsState.js
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { initialCategoryNames } from '../utils/constants'
import Jobicy from '../assets/jobicy.png'
import Remoteok from '../assets/remoteok.webp'
import Remotive from '../assets/remotive.png'
import Lever from '../assets/lever.avif'
import Greenhouse from '../assets/greenhouse.png'
import Wwr from '../assets/wwr.webp'
import Hacker from '../assets/hacker.png'

const API_BASE = 'https://remnavi.com/jobs_api.php'

const safeSearchParams = () => {
  try {
    if (typeof window === 'undefined') return new URLSearchParams();
    return new URLSearchParams(window.location.search);
  } catch { return new URLSearchParams(); }
};

export default function useJobsState() {
  const navigate = useNavigate()
  const location = useLocation()

  // platforms (prefix must match backend)
  const platformSources = useMemo(
    () => [
      { name: 'Jobicy', nameKey: 'jobicy', queryPrefix: 'Jobicy', logo: Jobicy },
      { name: 'Remote OK', nameKey: 'remoteok', queryPrefix: 'Remote OK', logo: Remoteok },
      { name: 'We Work Remotely', nameKey: 'weworkremotely', queryPrefix: 'We Work Remotely', logo: Wwr },
      { name: 'Greenhouse (all)', nameKey: 'greenhouse', queryPrefix: 'Greenhouse', logo: Greenhouse },
      { name: 'Lever (all)', nameKey: 'lever', queryPrefix: 'Lever', logo: Lever },
      { name: 'Hacker News', nameKey: 'hn', queryPrefix: 'HN', logo: Hacker },
      { name: 'Remotive', nameKey: '', queryPrefix: '', logo: Remotive },
    ],
    []
  )

  // read initial filters from URL
  const initialParams = useMemo(() => {
    const sp = safeSearchParams()
    return {
      q: sp.get('q') || '',
      category: sp.get('category') || 'All',
      source: sp.get('source') || '', // prefix like "Greenhouse" or "Jobicy"
    }
  }, [])

  // state
  const [jobs, setJobs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const [searchTerm, setSearchTerm] = useState(initialParams.q)
  const [selectedCategory, setSelectedCategory] = useState(initialParams.category)
  const [selectedPlatform, setSelectedPlatform] = useState('All')

  const [userLocation, setUserLocation] = useState(null)
  const [landingSearchTerm, setLandingSearchTerm] = useState('')

  const [categories] = useState(['All', ...initialCategoryNames])

  // if ?source= prefix is present, map it to a platform name
  useEffect(() => {
    if (!initialParams.source) return
    const found = platformSources.find(p => initialParams.source.toLowerCase().startsWith(p.queryPrefix.toLowerCase()))
    if (found) setSelectedPlatform(found.name)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platformSources])

  const platformQueryPrefix = useMemo(() => {
    if (selectedPlatform === 'All') return ''
    const found = platformSources.find(p => p.name === selectedPlatform || p.nameKey === selectedPlatform)
    return found?.queryPrefix || ''
  }, [selectedPlatform, platformSources])

  // keep URL in sync (so refresh/back/links preserve current filters)
  useEffect(() => {
    const sp = safeSearchParams()
    if (searchTerm?.trim()) sp.set('q', searchTerm.trim()); else sp.delete('q')
    if (selectedCategory && selectedCategory !== 'All') sp.set('category', selectedCategory); else sp.delete('category')
    if (platformQueryPrefix) sp.set('source', platformQueryPrefix); else sp.delete('source')
    const qs = sp.toString()
    // Only update on /jobs (avoid rewriting Landing’s URL)
    if (location.pathname === '/jobs') {
      window.history.replaceState({}, '', qs ? `/jobs?${qs}` : '/jobs')
    }
  }, [searchTerm, selectedCategory, platformQueryPrefix, location.pathname])

  // API URL (no FE limit)
  const buildApiUrl = useCallback(() => {
    try {
      const url = new URL(API_BASE, window.location.origin)
      if (searchTerm.trim()) url.searchParams.set('q', searchTerm.trim())
      if (selectedCategory !== 'All') url.searchParams.set('category', selectedCategory)
      if (platformQueryPrefix) url.searchParams.set('source', platformQueryPrefix)
      url.searchParams.set('order', 'recent')
      return url.toString()
    } catch {
      const params = new URLSearchParams()
      if (searchTerm.trim()) params.set('q', searchTerm.trim())
      if (selectedCategory !== 'All') params.set('category', selectedCategory)
      if (platformQueryPrefix) params.set('source', platformQueryPrefix)
      params.set('order', 'recent')
      const base = API_BASE.startsWith('http') || API_BASE.startsWith('/') ? API_BASE : `/${API_BASE}`
      return `${base}?${params.toString()}`
    }
  }, [searchTerm, selectedCategory, platformQueryPrefix])

  // fetch
  const loadJobs = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(buildApiUrl(), { method: 'GET' })
      if (!res.ok) throw new Error(`API ${res.status}`)
      const json = await res.json()
      const rows = Array.isArray(json.jobs) ? json.jobs : []
      setJobs(rows.map((j, i) => ({
        id: j.url || `${j.source || 'src'}-${(j.title || 'untitled')}-${(j.company || 'co')}-${i}`,
        title: j.title || 'Untitled',
        company: j.company || 'Unknown',
        url: j.url || '#',
        source: j.source || 'Unknown',
        category: j.category || 'Unknown',
        location: j.location || 'Remote',
        salary: j.salary ?? null,
        postedAt: j.posted_at ?? null,
      })))
    } catch (e) {
      console.error(e)
      setError('Failed to load jobs from backend.')
      setJobs([])
    } finally {
      setIsLoading(false)
    }
  }, [buildApiUrl])

  // initial geo
  useEffect(() => {
    ;(async () => {
      try {
        const r = await fetch('https://ipapi.co/json/')
        const g = await r.json()
        setUserLocation(g.country_name || g.country_code)
      } catch {}
    })()
  }, [])

  // refetch on filter change
  useEffect(() => { loadJobs() }, [loadJobs])

  // actions used by Landing (navigate with query so Jobs sees them)
  const clearFilters = () => {
    setSearchTerm('')
    setSelectedCategory('All')
    setSelectedPlatform('All')
  }

  const setCurrentPageRoute = useCallback(
    (page) => { navigate(page === 'jobs' ? '/jobs' : '/') },
    [navigate]
  )

  const handleCategoryClick = (category) => {
    // go to /jobs with ?category=...
    const sp = new URLSearchParams()
    sp.set('category', category)
    navigate(`/jobs?${sp.toString()}`)
    // local state (Jobs page will also read from URL on mount)
    setSelectedCategory(category)
    setSearchTerm('')
    setSelectedPlatform('All')
  }

  const handlePlatformClick = (platform) => {
    const found = platformSources.find(p => p.nameKey === platform || p.name === platform)
    const prefix = found?.queryPrefix || ''
    const sp = new URLSearchParams()
    if (prefix) sp.set('source', prefix)
    navigate(`/jobs?${sp.toString()}`)
    setSelectedPlatform(found?.name || platform)
    setSelectedCategory('All')
    setSearchTerm('')
  }

  const handleLandingSearch = (term) => {
    const q = (term || '').trim()
    const sp = new URLSearchParams()
    if (q) sp.set('q', q)
    navigate(`/jobs?${sp.toString()}`)
    setSearchTerm(q)
    setSelectedCategory('All')
    setSelectedPlatform('All')
  }

  const handleAIJobSearch = async (transcript) => {
    const q = (transcript || '').trim()
    const sp = new URLSearchParams()
    if (q) sp.set('q', q)
    navigate(`/jobs?${sp.toString()}`)
    setSearchTerm(q)
    setSelectedCategory('All')
    setSelectedPlatform('All')
  }

  return {
    jobs, isLoading, error,
    searchTerm, setSearchTerm,
    selectedCategory, setSelectedCategory,
    selectedPlatform, setSelectedPlatform,
    categories, platformSources,
    userLocation, landingSearchTerm, setLandingSearchTerm,
    clearFilters, setCurrentPageRoute,
    handleCategoryClick, handlePlatformClick, handleLandingSearch, handleAIJobSearch,
  }
}
