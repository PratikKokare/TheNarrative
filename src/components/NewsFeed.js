import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import axios from 'axios';
import moment from 'moment';
import { gsap } from 'gsap';
import { useIntersectionObserver } from 'react-intersection-observer';
import NewsSummaryCard from './NewsSummaryCard';
import CompareCoverage from './CompareCoverage';
import FilterSidebar from './FilterSidebar';

/**
 * Enhanced NewsFeed component with performance optimizations
 */
const NewsFeed = React.memo(() => {
  // State management
  const [articles, setArticles] = useState([]);
  const [storyGroups, setStoryGroups] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStory, setSelectedStory] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [view, setView] = useState('articles'); // 'articles' or 'stories'
  const [filters, setFilters] = useState({
    category: 'all',
    bias: 'all',
    sortBy: 'publishedAt',
    sortOrder: 'desc',
    dateFrom: '',
    dateTo: '',
    search: '',
    page: 1
  });
  const [stats, setStats] = useState({
    totalArticles: 0,
    lastUpdate: null,
    biasStats: {},
    categoryStats: {}
  });

  // Refs and observers
  const containerRef = useRef();
  const searchTimeoutRef = useRef();
  const { ref: sentryRef, inView } = useIntersectionObserver();

  // Memoized API URL
  const API_URL = useMemo(() => 
    process.env.REACT_APP_API_URL || 'https://twosides-backend.onrender.com', 
    []
  );

  /**
   * Load initial data on component mount
   */
  useEffect(() => {
    loadInitialData();
    loadStats();
    
    // Cleanup function
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Handle filter changes with debouncing
   */
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      if (filters.page === 1) {
        loadInitialData();
      }
    }, filters.search ? 300 : 0); // Debounce search queries
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [filters.category, filters.bias, filters.sortBy, filters.sortOrder, filters.search, filters.dateFrom, filters.dateTo, view]);

  /**
   * Load initial data with error handling
   */
  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setArticles([]);
    setStoryGroups([]);
    
    try {
      if (view === 'articles') {
        await loadArticles(true);
      } else {
        await loadStoryGroups(true);
      }
    } catch (err) {
      console.error('Error loading initial data:', err);
      setError('Failed to load news data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [view, API_URL]);

  /**
   * Load articles with optimized parameters
   */
  const loadArticles = useCallback(async (reset = false) => {
    try {
      const params = new URLSearchParams({
        page: reset ? '1' : filters.page.toString(),
        limit: '20',
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        ...(filters.category !== 'all' && { category: filters.category }),
        ...(filters.bias !== 'all' && { bias: filters.bias }),
        ...(filters.search && { search: filters.search.trim() }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo })
      });

      const response = await axios.get(`${API_URL}/api/news?${params}`, {
        timeout: 10000, // 10 second timeout
        signal: AbortController ? new AbortController().signal : undefined
      });

      const { articles: newArticles, pagination } = response.data;

      if (reset) {
        setArticles(newArticles);
        setFilters(prev => ({ ...prev, page: 1 }));
      } else {
        setArticles(prev => [...prev, ...newArticles]);
      }

      setHasMore(pagination.hasMore);
      setError(null);

      // Animate new articles
      if (newArticles.length > 0 && !reset) {
        const newElements = document.querySelectorAll('.article-card:not(.animated)');
        gsap.fromTo(newElements, 
          { opacity: 0, y: 20 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: "power2.out" }
        );
        newElements.forEach(el => el.classList.add('animated'));
      }

    } catch (err) {
      console.error('Error loading articles:', err);
      setError('Failed to load articles. Please check your connection.');
      setHasMore(false);
    }
  }, [filters, API_URL]);

  /**
   * Load story groups with error handling
   */
  const loadStoryGroups = useCallback(async (reset = false) => {
    try {
      const params = new URLSearchParams({
        page: reset ? '1' : filters.page.toString(),
        limit: '10',
        ...(filters.category !== 'all' && { category: filters.category })
      });

      const response = await axios.get(`${API_URL}/api/news/stories?${params}`, {
        timeout: 10000
      });

      const { storyGroups: newStoryGroups, pagination } = response.data;

      if (reset) {
        setStoryGroups(newStoryGroups);
        setFilters(prev => ({ ...prev, page: 1 }));
      } else {
        setStoryGroups(prev => [...prev, ...newStoryGroups]);
      }

      setHasMore(pagination.hasMore);
      setError(null);

    } catch (err) {
      console.error('Error loading story groups:', err);
      setError('Failed to load story groups. Please try again.');
      setHasMore(false);
    }
  }, [filters, API_URL]);

  /**
   * Load statistics data
   */
  const loadStats = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/api/news/stats`, {
        timeout: 5000
      });
      setStats(response.data);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, [API_URL]);

  /**
   * Load more content for infinite scroll
   */
  const loadMore = useCallback(() => {
    setFilters(prev => ({ ...prev, page: prev.page + 1 }));
    if (view === 'articles') {
      loadArticles();
    } else {
      loadStoryGroups();
    }
  }, [view, loadArticles, loadStoryGroups]);

  /**
   * Handle story selection
   */
  const handleStoryClick = useCallback(async (storyId) => {
    try {
      const response = await axios.get(`${API_URL}/api/news/stories/${storyId}`, {
        timeout: 10000
      });
      setSelectedStory(response.data);
    } catch (err) {
      console.error('Error loading story details:', err);
      setError('Failed to load story details.');
    }
  }, [API_URL]);

  /**
   * Handle filter changes
   */
  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  /**
   * Handle view toggle
   */
  const handleViewToggle = useCallback((newView) => {
    if (newView !== view) {
      setView(newView);
      setFilters(prev => ({ ...prev, page: 1 }));
    }
  }, [view]);

  /**
   * Utility functions
   */
  const getBiasColor = useCallback((bias) => {
    const colors = {
      'left': '#4285f4',
      'center': '#9c27b0',
      'right': '#f44336',
      'unknown': '#9e9e9e'
    };
    return colors[bias] || colors.unknown;
  }, []);

  const getBiasLabel = useCallback((bias) => {
    const labels = {
      'left': 'Left Leaning',
      'center': 'Center',
      'right': 'Right Leaning',
      'unknown': 'Unknown'
    };
    return labels[bias] || labels.unknown;
  }, []);

  const formatTimeAgo = useCallback((date) => {
    return moment(date).fromNow();
  }, []);

  /**
   * Render article card with memoization
   */
  const renderArticleCard = useCallback((article) => (
    <div key={article._id} className="article-card" ref={sentryRef}>
      <NewsSummaryCard 
        article={article}
        onBiasClick={(bias) => setFilters(prev => ({ ...prev, bias, page: 1 }))}
        onCategoryClick={(category) => setFilters(prev => ({ ...prev, category, page: 1 }))}
      />
    </div>
  ), [sentryRef]);

  /**
   * Render story group card
   */
  const renderStoryGroupCard = useCallback((storyGroup) => (
    <div key={storyGroup._id} className="story-group-card">
      <div className="story-header">
        <h3 
          className="story-headline"
          onClick={() => handleStoryClick(storyGroup._id)}
          role="button"
          tabIndex={0}
        >
          {storyGroup.mainHeadline}
        </h3>
        <div className="story-meta">
          <span className="article-count">
            {storyGroup.articles.length} articles
          </span>
          <span className="story-category">
            {storyGroup.category}
          </span>
        </div>
      </div>
      
      <p className="story-summary">{storyGroup.summary}</p>
      
      <div className="bias-distribution">
        {Object.entries(storyGroup.biasDistribution).map(([bias, count]) => (
          count > 0 && (
            <div key={bias} className="bias-indicator">
              <div 
                className="bias-bar"
                style={{ 
                  backgroundColor: getBiasColor(bias),
                  width: `${(count / storyGroup.articles.length) * 100}%`
                }}
              />
              <span className="bias-count">{count}</span>
            </div>
          )
        ))}
      </div>
    </div>
  ), [handleStoryClick, getBiasColor]);

  /**
   * Render loading skeleton
   */
  const renderSkeleton = useCallback(() => (
    <div className="skeleton-container">
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="skeleton-card">
          <Skeleton height={40} />
          <Skeleton count={3} />
          <div className="skeleton-meta">
            <Skeleton width={100} />
            <Skeleton width={80} />
          </div>
        </div>
      ))}
    </div>
  ), []);

  /**
   * Render end message
   */
  const renderEndMessage = useCallback(() => (
    <div className="end-message">
      <h3>🎉 You've reached the end of the feed!</h3>
      <p>Check back later for more {view === 'articles' ? 'articles' : 'stories'}.</p>
      <button 
        onClick={loadStats} 
        className="refresh-button"
        type="button"
      >
        Refresh Stats
      </button>
    </div>
  ), [view, loadStats]);

  /**
   * Main render
   */
  return (
    <div className="news-feed" ref={containerRef}>
      <FilterSidebar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        isOpen={showFilters}
        onToggle={() => setShowFilters(!showFilters)}
        stats={stats}
      />

      <div className={`news-content ${showFilters ? 'filters-open' : ''}`}>
        {/* Header Controls */}
        <div className="news-header">
          <div className="view-controls">
            <button
              onClick={() => handleViewToggle('articles')}
              className={`view-button ${view === 'articles' ? 'active' : ''}`}
              type="button"
              aria-pressed={view === 'articles'}
            >
              📰 Articles ({stats.totalArticles})
            </button>
            <button
              onClick={() => handleViewToggle('stories')}
              className={`view-button ${view === 'stories' ? 'active' : ''}`}
              type="button"
              aria-pressed={view === 'stories'}
            >
              📚 Stories ({storyGroups.length})
            </button>
          </div>

          <div className="feed-actions">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="filter-toggle"
              type="button"
              aria-expanded={showFilters}
            >
              🔍 Filters
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="error-message" role="alert">
            <p>{error}</p>
            <button onClick={loadInitialData} type="button">
              Try Again
            </button>
          </div>
        )}

        {/* Content */}
        {loading ? (
          renderSkeleton()
        ) : (
          <InfiniteScroll
            dataLength={view === 'articles' ? articles.length : storyGroups.length}
            next={loadMore}
            hasMore={hasMore && !error}
            loader={<LoadingSpinner text={`Loading more ${view}...`} />}
            endMessage={renderEndMessage()}
            scrollThreshold={0.8}
            className="infinite-scroll-container"
          >
            <div className="feed-grid">
              {view === 'articles' ? (
                articles.length > 0 ? (
                  articles.map(renderArticleCard)
                ) : (
                  <div className="empty-state">
                    <h3>No articles found</h3>
                    <p>Try adjusting your filters or search terms.</p>
                  </div>
                )
              ) : (
                storyGroups.length > 0 ? (
                  storyGroups.map(renderStoryGroupCard)
                ) : (
                  <div className="empty-state">
                    <h3>No story groups found</h3>
                    <p>Stories are automatically grouped from similar articles.</p>
                  </div>
                )
              )}
            </div>
          </InfiniteScroll>
        )}
      </div>

      {/* Story Detail Modal */}
      {selectedStory && (
        <CompareCoverage
          story={selectedStory}
          onClose={() => setSelectedStory(null)}
        />
      )}

      {/* Accessibility announcements */}
      <div 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
      >
        {loading && `Loading ${view}...`}
        {error && `Error: ${error}`}
      </div>
    </div>
  );
});

// Performance optimization
const LoadingSpinner = React.memo(({ text }) => (
  <div className="loading-spinner" role="status" aria-live="polite">
    <div className="spinner" aria-hidden="true"></div>
    <span className="loading-text">{text}</span>
  </div>
));

NewsFeed.displayName = 'NewsFeed';
LoadingSpinner.displayName = 'LoadingSpinner';

export default NewsFeed;
