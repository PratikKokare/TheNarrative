import React, { useEffect, useRef, useState, useCallback, Suspense, lazy, useMemo } from "react";
import "./App.css";
import { ThemeProvider } from "./ThemeContext";
import { gsap } from "gsap";
import { ErrorBoundary } from "react-error-boundary";

// Lazy load components for better performance and code splitting
const NewsFeed = lazy(() => import("./components/NewsFeed"));
const SportsSchedule = lazy(() => import("./components/SportsSchedule"));
const MarketUpdates = lazy(() => import("./components/MarketUpdates"));
const WeatherWidget = lazy(() => import("./components/WeatherWidget"));
const ThemeToggle = lazy(() => import("./components/ThemeToggle"));
const CompareCoverage = lazy(() => import("./components/CompareCoverage"));

/**
 * Enhanced Loading component with better UX
 */
const LoadingSpinner = React.memo(({ text = "Loading..." }) => (
  <div className="loading-spinner" role="status" aria-live="polite">
    <div className="spinner-ring" aria-hidden="true">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
    <p className="loading-text">{text}</p>
  </div>
));

LoadingSpinner.displayName = 'LoadingSpinner';

/**
 * Error Fallback component for error boundaries
 */
const ErrorFallback = ({ error, resetErrorBoundary }) => (
  <div className="error-fallback" role="alert">
    <h2>🚫 Something went wrong</h2>
    <details className="error-details">
      <summary>Error Details</summary>
      <pre>{error.message}</pre>
    </details>
    <button 
      onClick={resetErrorBoundary}
      className="retry-button"
      type="button"
    >
      Try Again
    </button>
  </div>
);

/**
 * Header component with enhanced navigation
 */
const Header = React.memo(({ onNavigationChange, currentView }) => {
  const headerRef = useRef(null);
  
  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(headerRef.current, 
        { opacity: 0, y: -20 }, 
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
      );
    }
  }, []);

  const navigationItems = useMemo(() => [
    { key: 'news', label: '📰 News Feed', description: 'Latest news articles' },
    { key: 'weather', label: '🌤️ Weather', description: 'Current weather updates' },
    { key: 'sports', label: '⚽ Sports', description: 'Sports schedules' },
    { key: 'markets', label: '📈 Markets', description: 'Market updates' }
  ], []);

  return (
    <header ref={headerRef} className="app-header" role="banner">
      <div className="header-content">
        <div className="logo-section">
          <h1 className="app-title">
            <span className="title-main">TwoSides</span>
            <span className="title-sub">News</span>
          </h1>
          <p className="app-tagline">Multi-perspective news analysis</p>
        </div>
        
        <nav className="main-navigation" role="navigation" aria-label="Main navigation">
          <ul className="nav-list">
            {navigationItems.map(({ key, label, description }) => (
              <li key={key} className="nav-item">
                <button
                  onClick={() => onNavigationChange(key)}
                  className={`nav-button ${currentView === key ? 'active' : ''}`}
                  aria-pressed={currentView === key}
                  title={description}
                  type="button"
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="header-actions">
          <Suspense fallback={<div className="theme-toggle-placeholder" />}>
            <ThemeToggle />
          </Suspense>
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';

/**
 * Main App component with enhanced architecture
 */
function App() {
  const [currentView, setCurrentView] = useState('news');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const appRef = useRef(null);

  /**
   * Initialize application with loading state
   */
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoading(true);
        
        // Simulate initialization (API checks, etc.)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Animate app entrance
        if (appRef.current) {
          gsap.fromTo(appRef.current, 
            { opacity: 0, scale: 0.95 }, 
            { opacity: 1, scale: 1, duration: 1, ease: "power3.out" }
          );
        }
        
        setError(null);
      } catch (err) {
        console.error('App initialization error:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  /**
   * Handle view changes with smooth transitions
   */
  const handleViewChange = useCallback((newView) => {
    if (newView === currentView) return;
    
    // Add exit animation
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      gsap.to(mainContent, {
        opacity: 0,
        y: 20,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          setCurrentView(newView);
          // Entrance animation will be handled by individual components
          gsap.fromTo(mainContent, 
            { opacity: 0, y: 20 }, 
            { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
          );
        }
      });
    } else {
      setCurrentView(newView);
    }
  }, [currentView]);

  /**
   * Render current view component
   */
  const renderCurrentView = useMemo(() => {
    const views = {
      news: <NewsFeed />,
      weather: <WeatherWidget />,
      sports: <SportsSchedule />,
      markets: <MarketUpdates />
    };

    return views[currentView] || views.news;
  }, [currentView]);

  /**
   * Error recovery handler
   */
  const handleErrorRecovery = useCallback(() => {
    setError(null);
    setIsLoading(true);
    // Trigger re-initialization
    setTimeout(() => setIsLoading(false), 500);
  }, []);

  // Show loading state during initialization
  if (isLoading) {
    return (
      <div className="app-loading">
        <LoadingSpinner text="Initializing TwoSides News..." />
      </div>
    );
  }

  // Show error state if initialization failed
  if (error) {
    return (
      <div className="app-error">
        <ErrorFallback 
          error={{ message: error }} 
          resetErrorBoundary={handleErrorRecovery} 
        />
      </div>
    );
  }

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('App Error Boundary caught an error:', error, errorInfo);
      }}
      onReset={() => {
        window.location.reload();
      }}
    >
      <ThemeProvider>
        <div ref={appRef} className="app" role="main">
          <Header 
            onNavigationChange={handleViewChange} 
            currentView={currentView} 
          />
          
          <main className="main-content" role="main" aria-live="polite">
            <Suspense 
              fallback={
                <LoadingSpinner 
                  text={`Loading ${currentView}...`} 
                />
              }
            >
              {renderCurrentView}
            </Suspense>
          </main>

          {/* Accessibility improvements */}
          <div id="announcements" className="sr-only" aria-live="polite" aria-atomic="true">
            {/* Screen reader announcements will be inserted here */}
          </div>
        </div>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

// Performance monitoring (development only)
if (process.env.NODE_ENV === 'development') {
  // Add performance observers
  if ('PerformanceObserver' in window) {
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'largest-contentful-paint') {
          console.log('LCP:', entry.startTime);
        }
        if (entry.entryType === 'cumulative-layout-shift') {
          console.log('CLS:', entry.value);
        }
      });
    });
    
    try {
      observer.observe({ entryTypes: ['largest-contentful-paint', 'layout-shift'] });
    } catch (e) {
      // Browser might not support all entry types
      console.warn('Performance observer setup failed:', e);
    }
  }
}

export default App;
