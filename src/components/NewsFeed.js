import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import axios from "axios";
import NewsSummaryCard from "./NewsSummaryCard";
import { gsap } from "gsap";

export default function NewsFeed({ onStorySelect }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [summaryProgress, setSummaryProgress] = useState({ current: 0, total: 0 });
  const feedRef = useRef();
  const maxRetries = 3;

  // Memoized API endpoints
  const NEWS_ENDPOINT = useMemo(() => "https://twosides-backend.onrender.com/api/news", []);
  const ANALYZE_ENDPOINT = useMemo(() => "https://twosides-backend.onrender.com/api/analyze", []);

  // Function to generate summary for an article
  const generateSummary = async (article) => {
    try {
      console.log(`Generating summary for: ${article.title?.substring(0, 50)}...`);
      
      // Use article content (description) for summary
      const textToSummarize = article.content || article.description || article.title || "";
      
      if (!textToSummarize.trim()) {
        console.log("No content to summarize for article");
        return "No summary available - insufficient article content.";
      }

      const response = await axios.post(ANALYZE_ENDPOINT, {
        text: textToSummarize
      }, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      console.log("Summary response:", response.data);
      return response.data.summary || "No summary available";

    } catch (error) {
      console.error("Error generating summary:", error);
      
      if (error.response?.status === 400) {
        return "No summary available - insufficient content.";
      } else if (error.response?.status === 429) {
        return "Summary temporarily unavailable - rate limit exceeded.";
      } else if (error.response?.status >= 500) {
        return "Summary temporarily unavailable - server error.";
      } else {
        return "Summary temporarily unavailable.";
      }
    }
  };

  const fetchNews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setSummaryProgress({ current: 0, total: 0 });
      
      console.log("Fetching news from The Narrative backend...");
      
      const response = await axios.get(NEWS_ENDPOINT, {
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

      // First, set articles without summaries
      const articlesWithoutSummaries = articles.map((article, index) => ({
        id: article.id || `story-${index}`,
        title: article.title || "Untitled Article",
        summary: "Generating summary...", // Temporary placeholder
        timestamp: article.publishedAt || article.timestamp || new Date().toISOString(),
        sources: [{
          name: article.source?.name || "Unknown Source",
          url: article.url || "#",
          bias: "center" // Default bias
        }],
        category: article.category || "General",
        readingTime: Math.ceil((article.content?.length || article.description?.length || 200) / 200),
        originalArticle: article // Keep original data for summary generation
      }));

      setNews(articlesWithoutSummaries);
      setSummaryProgress({ current: 0, total: articles.length });

      // Now generate summaries for each article
      console.log(`Starting summary generation for ${articles.length} articles...`);
      
      const updatedArticles = [...articlesWithoutSummaries];
      
      for (let i = 0; i < articles.length; i++) {
        try {
          setSummaryProgress({ current: i + 1, total: articles.length });
          
          const summary = await generateSummary(articles[i]);
          updatedArticles[i] = {
            ...updatedArticles[i],
            summary: summary
          };
          
          // Update the news state with the new summary
          setNews([...updatedArticles]);
          
          console.log(`Summary ${i + 1}/${articles.length} completed`);
          
          // Small delay to avoid overwhelming the API
          if (i < articles.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
          
        } catch (error) {
          console.error(`Failed to generate summary for article ${i + 1}:`, error);
          updatedArticles[i] = {
            ...updatedArticles[i],
            summary: "Summary generation failed."
          };
          setNews([...updatedArticles]);
        }
      }

      console.log("All summaries generated successfully!");
      setSummaryProgress({ current: articles.length, total: articles.length });
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
  }, [NEWS_ENDPOINT, ANALYZE_ENDPOINT]);

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
      <div className="news-feed-container">
        <div className="loading-spinner">
          <div className="spinner-ring"></div>
          <div className="loading-text">
            <h3>Fetching the latest stories from multiple perspectives</h3>
            {summaryProgress.total > 0 && (
              <p className="summary-progress">
                Generating summaries: {summaryProgress.current}/{summaryProgress.total}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="news-feed-error">
        <div className="error-content">
          <h3>Unable to Load News</h3>
          <p>{error}</p>
          {retryCount < maxRetries && (
            <button 
              onClick={handleRetry}
              className="retry-button"
            >
              Try Again ({maxRetries - retryCount} attempts remaining)
            </button>
          )}
          <p className="error-help">
            If this issue persists, please check if the backend service is running.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="news-feed-container" ref={feedRef}>
      <div className="news-feed-header">
        <h2>{news.length} perspectives available</h2>
        {summaryProgress.current < summaryProgress.total && (
          <p className="summary-status">
            Generating summaries: {summaryProgress.current}/{summaryProgress.total}
          </p>
        )}
      </div>

      {news.length > 0 ? (
        <div className="news-grid">
          {news.map((story) => (
            <NewsSummaryCard 
              key={story.id} 
              story={story} 
              onClick={() => onStorySelect && onStorySelect(story)}
            />
          ))}
        </div>
      ) : (
        <div className="no-news">
          <p>No stories available at the moment.</p>
        </div>
      )}
    </div>
  );
}
