import React, { useState } from "react";
import "./App.css";

/**
 * Ultra-simple App component that will definitely load
 */
function App() {
  const [currentView, setCurrentView] = useState('news');
  const [loading, setLoading] = useState(false);

  // Simple view rendering without external components that might fail
  const renderContent = () => {
    switch (currentView) {
      case 'news':
        return (
          <div className="content-section">
            <h2>📰 News Feed</h2>
            <p>Welcome to TwoSides News - Multi-perspective news analysis</p>
            <div className="news-placeholder">
              <div className="news-card">
                <h3>News Loading...</h3>
                <p>Your news feed will appear here once the backend is connected.</p>
                <small>Backend API: {process.env.REACT_APP_API_URL || 'https://twosides-backend.onrender.com'}</small>
              </div>
            </div>
          </div>
        );
      case 'weather':
        return (
          <div className="content-section">
            <h2>🌤️ Weather</h2>
            <p>Weather updates coming soon...</p>
          </div>
        );
      case 'sports':
        return (
          <div className="content-section">
            <h2>⚽ Sports</h2>
            <p>Sports schedules coming soon...</p>
          </div>
        );
      case 'markets':
        return (
          <div className="content-section">
            <h2>📈 Markets</h2>
            <p>Market updates coming soon...</p>
          </div>
        );
      default:
        return (
          <div className="content-section">
            <h2>Welcome to TwoSides News</h2>
            <p>Select a section from the navigation above.</p>
          </div>
        );
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo-section">
            <h1 className="app-title">
              <span className="title-main">TwoSides</span>
              <span className="title-sub">News</span>
            </h1>
            <p className="app-tagline">Multi-perspective news analysis</p>
          </div>
          
          {/* Navigation */}
          <nav className="main-navigation">
            <ul className="nav-list">
              <li className="nav-item">
                <button
                  onClick={() => setCurrentView('news')}
                  className={`nav-button ${currentView === 'news' ? 'active' : ''}`}
                  type="button"
                >
                  📰 News Feed
                </button>
              </li>
              <li className="nav-item">
                <button
                  onClick={() => setCurrentView('weather')}
                  className={`nav-button ${currentView === 'weather' ? 'active' : ''}`}
                  type="button"
                >
                  🌤️ Weather
                </button>
              </li>
              <li className="nav-item">
                <button
                  onClick={() => setCurrentView('sports')}
                  className={`nav-button ${currentView === 'sports' ? 'active' : ''}`}
                  type="button"
                >
                  ⚽ Sports
                </button>
              </li>
              <li className="nav-item">
                <button
                  onClick={() => setCurrentView('markets')}
                  className={`nav-button ${currentView === 'markets' ? 'active' : ''}`}
                  type="button"
                >
                  📈 Markets
                </button>
              </li>
            </ul>
          </nav>

          {/* Theme Toggle Placeholder */}
          <div className="header-actions">
            <button 
              className="theme-toggle" 
              onClick={() => {
                document.body.classList.toggle('dark-theme');
              }}
              type="button"
            >
              🌓
            </button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="main-content">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        ) : (
          renderContent()
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>&copy; 2025 TwoSides News. Multi-perspective news analysis.</p>
        <p>
          <small>
            Status: <span style={{color: 'green'}}>✅ App Loaded Successfully</span> | 
            API: <span style={{color: 'orange'}}>🔄 Connecting...</span>
          </small>
        </p>
      </footer>
    </div>
  );
}

export default App;
