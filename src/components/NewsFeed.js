import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import axios from "axios";
import NewsSummaryCard from "./NewsSummaryCard";
import { gsap } from "gsap";

export default function NewsFeed({ onStorySelect }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const feedRef = useRef();
  const maxRetries = 3;

  // Memoized API endpoint
  const API_ENDPOINT = useMemo(() => "https://twosides-backend.onrender.com/api/news", []);

  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log("Fetching news from The Narrative backend...");

      const response = await axios.get(API_ENDPOINT, { 
        timeout: 60000,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log("News response:", response.data);

      const articles = Array.isArray(response.data) ? response.data : [];

      if (articles.length === 0) {
        setError("No news articles found. Please try again later.");
        return;
      }

      // Process articles with enhanced data structure
      const articlesWithSources = articles.map((article, index) => ({
        id: article.id || `story-${index}`,
        title: article.title || article.summary?.substring(0, 100) + "...",
        summary: article.summary || "No summary available",
        timestamp: article.timestamp || new Date().toISOString(),
        sources: article.sources || [],
        category: article.category || "General",
        readingTime: Math.ceil((article.summary?.length || 0) / 200) // Estimate reading time
      }));

      setNews(articlesWithSources);
      setRetryCount(0); // Reset retry count on success

    } catch (error) {
      console.error("Error fetching news:", error);

      let errorMessage = "Unable to load news articles.";

      if (error.code === 'ECONNABORTED') {
        errorMessage = "Request timed out. The server might be starting up.";
      } else if (error.response?.status === 429) {
        errorMessage = "Too many requests. Please wait a moment and try again.";
      } else if (error.response?.status >= 500) {
        errorMessage = "Server error. Please try again later.";
      } else if (!navigator.onLine) {
        errorMessage = "No internet connection. Please check your network.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [API_ENDPOINT]);

  const handleRetry = useCallback(() => {
    if (retryCount < maxRetries) {
      setRetryCount(prev => prev + 1);
      fetchNews();
    }
  }, [retryCount, maxRetries, fetchNews]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  // Animate cards when news updates
  useEffect(() => {
    if (news.length > 0 && feedRef.current) {
      gsap.fromTo(
        ".news-summary-card",
        { opacity: 0, y: 30, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out"
        }
      );
    }
  }, [news]);

  if (loading) {
    return (
      <div className="loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
        <h3>Loading The Narrative...</h3>
        <p>Fetching the latest stories from multiple perspectives</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <h3>⚠️ Unable to Load Stories</h3>
        <p>{error}</p>
        {retryCount < maxRetries && (
          <button onClick={handleRetry} className="retry-button">
            Retry ({maxRetries - retryCount} attempts left)
          </button>
        )}
        <p className="error-details">
          If this issue persists, please check if the backend service is running.
        </p>
      </div>
    );
  }

  return (
    <div className="news-feed" ref={feedRef}>
      <div className="feed-header">
        <h2>Latest Stories</h2>
        <p>{news.length} perspectives available</p>
      </div>

      {news.map((story) => (
        <NewsSummaryCard
          key={story.id}
          story={story}
          onClick={() => onStorySelect(story)}
        />
      ))}

      {news.length === 0 && (
        <div className="no-stories">
          <p>No stories available at the moment.</p>
          <button onClick={fetchNews} className="refresh-button">
            Refresh Feed
          </button>
        </div>
      )}
    </div>
  );
}
