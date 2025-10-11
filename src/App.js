import React, { useEffect, useRef, useState, useCallback } from "react";
import "./App.css";
import { ThemeProvider } from "./ThemeContext";
import { gsap } from "gsap";

// Direct imports (no lazy loading to avoid complexity)
import NewsFeed from "./components/NewsFeed";
import SportsSchedule from "./components/SportsSchedule";
import MarketUpdates from "./components/MarketUpdates";
import WeatherWidget from "./components/WeatherWidget";
import ThemeToggle from "./components/ThemeToggle";

/**
 * Simple Loading component
 */
const LoadingSpinner = ({ text = "Loading..." }) => (
  <div className="loading-spinner">
    <div className="spinner-ring">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
    <p className="loading-text">{text}</p>
  </div>
);

/**
 * Simple Error component
 */
const ErrorMessage = ({ message, onRetry }) => (
  <div className="error-fallback">
    <h2>🚫 Something went wrong</h2>
    <p>{message}</p>
    <button onClick={onRetry} className="retry-button">
      Try Again
    </button>
  </div>
);

/**
 * Header component
 */
const Header = ({ onNavigationChange, currentView }) => {
  const headerRef = useRef(null);
  
  useEffect(() => {
    if (headerRef.current) {
      gsap.fromTo(headerRef.current, 
        { opacity: 0, y: -20 }, 
        { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
      );
    }
  }, []);

  const navigationItems = [
    { key: 'news', label: '📰 News Feed' },
    { key: 'weather', label: '🌤️ Weather' },
    { key: 'sports', label: '⚽ Sports' },
    { key: 'markets', label: '📈 Markets' }
  ];

  return (
    <header ref={headerRef} className="app-header">
      <div className="header-content">
        <div className="logo-section">
          <h1 className="app-title">
            <span className="title-main">TwoSides</span>
            <span className="title-sub">News</span>
          </h1>
          <p className="app-tagline">Multi-perspective news analysis</p>
        </div>
        
        <nav className="main-navigation">
          <ul className="nav-list">
            {navigationItems.map(({ key, label }) => (
              <li key={key} className="nav-item">
                <button
                  onClick={() => onNavigationChange(key)}
                  className={`nav-button ${currentView === key ? 'active' : ''}`}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="header-actions">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
};

/**
 * Main App component - simplified version
 */
function App() {
  const [currentView, setCurrentView] = useState('news');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const appRef = useRef(null);

  // Initialize application
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsLoading(true);
        
        // Simulate initialization
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

  // Handle view changes with transitions
  const handleViewChange = useCallback((newView) => {
    if (newView === currentView) return;
    
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      gsap.to(mainContent, {
        opacity: 0,
        y: 20,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          setCurrentView(newView);
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

  // Render current view
  const renderCurrentView = () => {
    try {
      switch (currentView) {
        case 'news':
          return <NewsFeed />;
        case 'weather':
          return <WeatherWidget />;
        case 'sports':
          return <SportsSchedule />;
        case 'markets':
          return <MarketUpdates />;
        default:
          return <NewsFeed />;
      }
    } catch (componentError) {
      console.error('Component render error:', componentError);
      return (
        <ErrorMessage 
          message={`Failed to load ${currentView} component`}
          onRetry={() => window.location.reload()}
        />
      );
    }
  };

  // Error recovery
  const handleErrorRecovery = () => {
    setError(null);
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 500);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="app-loading">
        <LoadingSpinner text="Initializing TwoSides News..." />
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="app-error">
        <ErrorMessage 
          message={error} 
          onRetry={handleErrorRecovery} 
        />
      </div>
    );
  }

  return (
    <ThemeProvider>
      <div ref={appRef} className="app">
        <Header 
          onNavigationChange={handleViewChange} 
          currentView={currentView} 
        />
        
        <main className="main-content">
          {renderCurrentView()}
        </main>

        {/* Accessibility announcements */}
        <div className="sr-only" aria-live="polite">
          {/* Screen reader announcements will be inserted here */}
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
