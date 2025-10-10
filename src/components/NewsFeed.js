import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import NewsSummaryCard from "./NewsSummaryCard";
import { gsap } from "gsap";

export default function NewsFeed({ onStorySelect }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const feedRef = useRef();

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Fetching news from backend...");
        
        const response = await axios.get("https://twosides-backend.onrender.com/api/news", {
          timeout: 60000 // Increased timeout for cold start
        });
        
        console.log("News response:", response.data);

        // Your backend returns an array directly
        const articles = Array.isArray(response.data) ? response.data : [];
        
        if (articles.length === 0) {
          setError("No news articles found");
          return;
        }

        // Process the articles from your API
        const articlesWithSources = articles.slice(0, 12).map((story, index) => ({
          ...story,
          id: story.id || index,
          // Create a 60-word summary from title and description
          summary: createSummary(story.title, story.description, story.content),
          sources: [
            {
              name: "The Hindu",
              bias: "left",
              url: story.url || "#"
            },
            {
              name: "Times of India", 
              bias: "center",
              url: story.url || "#"
            },
            {
              name: "Republic TV",
              bias: "right", 
              url: story.url || "#"
            }
          ]
        }));

        setNews(articlesWithSources);
        setError(null);
        setRetryCount(0);

        // Animate cards in with GSAP
        setTimeout(() => {
          gsap.fromTo(".news-summary-card",
            {
              opacity: 0,
              y: 30,
              scale: 0.95
            },
            {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.6,
              stagger: 0.1,
              ease: "power2.out"
            }
          );
        }, 100);

      } catch (err) {
        console.error("Error fetching news:", err);
        
        // Handle cold start (500 errors) with automatic retry
        if (err.response?.status === 500 && retryCount < 3) {
          setError(`Backend is starting up... Retry ${retryCount + 1}/3 in 10 seconds`);
          setRetryCount(prev => prev + 1);
          
          // Auto retry after 10 seconds for cold start
          setTimeout(() => {
            fetchNews();
          }, 10000);
          
          return;
        }
        
        setError(`Failed to fetch news: ${err.response?.data?.error || err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []); // Remove retryCount dependency to prevent infinite loops

  // Helper function to create ~60 word summary
  const createSummary = (title, description, content) => {
    const text = `${title || ""}. ${description || content || ""}`;
    const words = text.split(' ');
    if (words.length <= 60) return text;
    return words.slice(0, 60).join(' ') + '...';
  };

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    setRetryCount(0);
    // Re-trigger the useEffect
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="loading">
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📰</div>
        <div>
          {retryCount > 0 
            ? `Waking up backend server... (${retryCount}/3)` 
            : "Loading latest news..."
          }
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
          {retryCount > 0 
            ? "Free tier servers sleep after 15min. This may take up to 60 seconds..."
            : "Getting perspectives from multiple sources..."
          }
        </div>
      </div>
    );
  }

  if (error && !loading) {
    return (
      <div className="error">
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>
          {error.includes('starting up') ? '⏰' : '⚠️'}
        </div>
        <h3>
          {error.includes('starting up') ? 'Backend Starting Up' : 'Unable to load news'}
        </h3>
        <p>{error}</p>
        <button onClick={handleRetry}>
          {error.includes('starting up') ? 'Wait & Retry' : 'Try Again'}
        </button>
        {error.includes('500') && (
          <div style={{ 
            fontSize: 'var(--font-size-sm)', 
            color: 'var(--color-text-secondary)', 
            marginTop: 'var(--spacing-md)',
            textAlign: 'center',
            maxWidth: '400px'
          }}>
            <strong>Note:</strong> Free tier backend servers sleep after 15 minutes of inactivity 
            and take 30-60 seconds to wake up. This is normal behavior.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="news-feed" ref={feedRef}>
      {news.map((story) => (
        <NewsSummaryCard 
          key={story.id} 
          story={story} 
          onSelect={onStorySelect}
        />
      ))}
      <div style={{ 
        gridColumn: '1 / -1', 
        textAlign: 'center', 
        padding: 'var(--spacing-lg)',
        color: 'var(--color-text-secondary)',
        fontSize: 'var(--font-size-sm)'
      }}>
        Updated {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
}
