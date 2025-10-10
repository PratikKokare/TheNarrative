import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import { ThemeProvider } from "./ThemeContext";
import NewsFeed from "./components/NewsFeed";
import SportsSchedule from "./components/SportsSchedule";
import MarketUpdates from "./components/MarketUpdates";
import WeatherWidget from "./components/WeatherWidget";
import ThemeToggle from "./components/ThemeToggle";
import CompareCoverage from "./components/CompareCoverage";
import { gsap } from "gsap";

function App() {
  const [selectedStory, setSelectedStory] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const appRef = useRef();

  const categories = [
    "All", "Politics", "Science", "Technology", "Finance",
    "Sports", "Weather", "Entertainment", "Current Affairs"
  ];

  useEffect(() => {
    // GSAP animations on mount
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
      duration: 0.6,
      ease: "power2.out"
    }, "-=0.4")
    .from(".app-main", {
      opacity: 0,
      duration: 0.4,
      ease: "power2.out"
    }, "-=0.2");
  }, []);

  const handleStorySelect = (story) => {
    setSelectedStory(story);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setTimeout(() => setSelectedStory(null), 300);
  };

  return (
    <ThemeProvider>
      <div className="app" ref={appRef}>
        <header className="app-header">
          <div className="header-brand">
            <div className="header-logo">The Narrative</div>
            <div className="header-tagline">One Story, Every Perspective</div>
          </div>
          <ThemeToggle />
        </header>

        <aside className="app-sidebar">
          <div className="sidebar-section">
            <h3 className="sidebar-title">Categories</h3>
            <div className="category-filters">
              {categories.map((category) => (
                <button key={category} className="category-btn">
                  {category}
                </button>
              ))}
            </div>
          </div>

          <div className="sidebar-section">
            <h3 className="sidebar-title">Filter by Bias</h3>
            <div className="bias-filters">
              <button className="filter-btn left">
                <div className="bias-indicator left"></div>
                Left Leaning
              </button>
              <button className="filter-btn center">
                <div className="bias-indicator center"></div>
                Centrist
              </button>
              <button className="filter-btn right">
                <div className="bias-indicator right"></div>
                Right Leaning
              </button>
            </div>
          </div>

          <div className="sidebar-section">
            <SportsSchedule />
          </div>

          <div className="sidebar-section">
            <MarketUpdates />
          </div>

          <div className="sidebar-section">
            <WeatherWidget />
          </div>
        </aside>

        <main className="app-main">
          <div className="news-header">
            <h2>Today's News Stories</h2>
            <p>Explore different perspectives on the same story</p>
          </div>
          <NewsFeed onStorySelect={handleStorySelect} />
        </main>

        {showModal && selectedStory && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Compare Coverage</h3>
                <button className="modal-close" onClick={handleCloseModal}>×</button>
              </div>
              <CompareCoverage story={selectedStory} />
            </div>
          </div>
        )}
      </div>
    </ThemeProvider>
  );
}

export default App;





// Vercel redeploy trigger: Thu Oct 9, 9:00PM



