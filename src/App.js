import React, { useEffect, useRef, useState, useCallback, Suspense, lazy } from "react";
import "./App.css";
import { ThemeProvider } from "./ThemeContext";
import { gsap } from "gsap";

// Lazy load components for better performance
const NewsFeed = lazy(() => import("./components/NewsFeed"));
const SportsSchedule = lazy(() => import("./components/SportsSchedule"));
const MarketUpdates = lazy(() => import("./components/MarketUpdates"));
const WeatherWidget = lazy(() => import("./components/WeatherWidget"));
const ThemeToggle = lazy(() => import("./components/ThemeToggle"));
const CompareCoverage = lazy(() => import("./components/CompareCoverage"));

// Loading component for better UX
const LoadingSpinner = () => (
  <div className="loading-spinner">
    <div className="spinner"></div>
  </div>
);

function App() {
  const [selectedStory, setSelectedStory] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const appRef = useRef();

  const categories = [
    "All", "Politics", "Science", "Technology", "Finance",
    "Sports", "Weather", "Entertainment", "Current Affairs"
  ];

  const handleStorySelect = useCallback((story) => {
    setSelectedStory(story);
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setTimeout(() => setSelectedStory(null), 300); // Delay to allow exit animation
  }, []);

  // Optimized GSAP animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      tl.from(".app-header", {
        y: -50,
        opacity: 0,
        duration: 0.6,
        ease: "power2.out"
      })
      .from(".app-sidebar", {
        x: -280,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
      }, "-=0.4")
      .from(".app-main", {
        opacity: 0,
        y: 30,
        duration: 0.8,
        ease: "power2.out"
      }, "-=0.6");
    }, appRef);

    return () => ctx.revert(); // Clean up GSAP context
  }, []);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && showModal) {
        closeModal();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showModal, closeModal]);

  return (
    <ThemeProvider>
      <div className="app" ref={appRef}>
        <header className="app-header">
          <div className="header-brand">
            <div className="header-logo">📰</div>
            <div className="header-content">
              <h1 className="header-title">The Narrative</h1>
              <p className="header-tagline">Multiple perspectives, one story</p>
            </div>
          </div>
          <Suspense fallback={<div>🌙</div>}>
            <ThemeToggle />
          </Suspense>
        </header>

        <aside className="app-sidebar">
          <Suspense fallback={<LoadingSpinner />}>
            <WeatherWidget />
            <SportsSchedule />
            <MarketUpdates />
          </Suspense>
        </aside>

        <main className="app-main">
          <Suspense fallback={<LoadingSpinner />}>
            <NewsFeed onStorySelect={handleStorySelect} />
          </Suspense>
        </main>

        {showModal && selectedStory && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Coverage Comparison</h3>
                <button 
                  className="modal-close" 
                  onClick={closeModal}
                  aria-label="Close modal"
                >
                  ×
                </button>
              </div>
              <Suspense fallback={<LoadingSpinner />}>
                <CompareCoverage story={selectedStory} />
              </Suspense>
            </div>
          </div>
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;
