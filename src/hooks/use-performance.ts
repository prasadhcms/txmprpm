/**
 * Performance monitoring hook
 * Tracks page load times and provides performance insights
 */

import { useEffect, useState } from 'react'

interface PerformanceMetrics {
  pageLoadTime: number
  dataFetchTime: number
  renderTime: number
}

export function usePerformance(pageName: string) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    pageLoadTime: 0,
    dataFetchTime: 0,
    renderTime: 0
  })
  
  const [startTime] = useState(performance.now())
  const [dataFetchStart, setDataFetchStart] = useState<number | null>(null)

  // Track page load time
  useEffect(() => {
    const loadTime = performance.now() - startTime
    setMetrics(prev => ({ ...prev, pageLoadTime: loadTime }))
    
    // Log performance in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 ${pageName} Performance:`, {
        pageLoadTime: `${loadTime.toFixed(2)}ms`,
        timestamp: new Date().toISOString()
      })
    }
  }, [pageName, startTime])

  // Track data fetch performance
  const trackDataFetch = {
    start: () => {
      setDataFetchStart(performance.now())
    },
    end: () => {
      if (dataFetchStart) {
        const fetchTime = performance.now() - dataFetchStart
        setMetrics(prev => ({ ...prev, dataFetchTime: fetchTime }))
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔄 ${pageName} Data Fetch: ${fetchTime.toFixed(2)}ms`)
        }
      }
    }
  }

  // Track render performance
  const trackRender = {
    start: () => {
      const renderStart = performance.now()
      return () => {
        const renderTime = performance.now() - renderStart
        setMetrics(prev => ({ ...prev, renderTime }))
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`🎨 ${pageName} Render: ${renderTime.toFixed(2)}ms`)
        }
      }
    }
  }

  return {
    metrics,
    trackDataFetch,
    trackRender
  }
}