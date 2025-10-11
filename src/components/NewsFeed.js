import React, { useState, useEffect, useCallback, useRef } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import axios from 'axios';
import moment from 'moment';
import { gsap } from 'gsap';

import NewsSummaryCard from './NewsSummaryCard';
import CompareCoverage from './CompareCoverage';
import FilterSidebar from './FilterSidebar';

const NewsFeed = () => {
  const [articles, setArticles] = useState([]);
  const [storyGroups, setStoryGroups] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
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

  const containerRef = useRef();
  // Fixed API URL
  const API_URL = 'https://twosides-backend.onrender.com';

  useEffect(() => {
    loadInitialData();
    loadStats();
  }, []);

  // FIXED: Only trigger when actual filter values change, not when page changes
  useEffect(() => {
    if (filters.page === 1) {
      loadInitialData();
    }
  }, [filters.category, filters.bias, filters.sortBy, filters.sortOrder, filters.search, filters.dateFrom, filters.dateTo, view]);

  const loadInitialData = async () => {
    setLoading(true);
    setArticles([]);
    setStoryGroups([]);
    
    try {
      if (view === 'articles') {
        await loadArticles(true);
      } else {
        await loadStoryGroups(true);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadArticles = async (reset = false) => {
    try {
      console.log('Loading articles, reset:', reset);
      const params = new URLSearchParams({
        page: reset ? '1' : filters.page.toString(),
        limit: '20',
        ...(filters.category !== 'all' && { category: filters.category }),
        ...(filters.bias !== 'all' && { bias: filters.bias }),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        ...(filters.search && { search: filters.search }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo })
      });

      const response = await axios.get(`${API_URL}/api/news?${params}`);
      const { articles: newArticles, pagination } = response.data;
      
      console.log('Articles received:', newArticles.length);
      console.log('First article:', newArticles[0]);

      if (reset) {
        setArticles(newArticles);
        setFilters(prev => ({ ...prev, page: 1 }));
      } else {
        setArticles(prev => [...prev, ...newArticles]);
      }

      setHasMore(pagination.hasMore);
      
      // Removed problematic GSAP animation that might cause issues

    } catch (error) {
      console.error('Error loading articles:', error);
      setHasMore(false);
    }
  };

  const loadStoryGroups = async (reset = false) => {
    try {
      const params = new URLSearchParams({
        page: reset ? '1' : filters.page.toString(),
        limit: '10',
        ...(filters.category !== 'all' && { category: filters.category })
      });

      const response = await axios.get(`${API_URL}/api/news/stories?${params}`);
      const { storyGroups: newStoryGroups, pagination } = response.data;

      if (reset) {
        setStoryGroups(newStoryGroups);
        setFilters(prev => ({ ...prev, page: 1 }));
      } else {
        setStoryGroups(prev => [...prev, ...newStoryGroups]);
      }

      setHasMore(pagination.hasMore);

    } catch (error) {
      console.error('Error loading story groups:', error);
      setHasMore(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/news/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadMore = () => {
    setFilters(prev => ({ ...prev, page: prev.page + 1 }));
    
    if (view === 'articles') {
      loadArticles();
    } else {
      loadStoryGroups();
    }
  };

  const handleStoryClick = async (storyId) => {
    try {
      const response = await axios.get(`${API_URL}/api/news/stories/${storyId}`);
      setSelectedStory(response.data);
    } catch (error) {
      console.error('Error loading story details:', error);
    }
  };

  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(newFilters);
  }, []);

  const getBiasColor = (bias) => {
    switch(bias) {
      case 'left': return '#4285f4';
      case 'center': return '#9c27b0';  
      case 'right': return '#f44336';
      default: return '#9e9e9e';
    }
  };

  const getBiasLabel = (bias) => {
    switch(bias) {
      case 'left': return 'Left Leaning';
      case 'center': return 'Center';
      case 'right': return 'Right Leaning';
      default: return 'Unknown';
    }
  };

  const formatTimeAgo = (date) => {
    return moment(date).fromNow();
  };

  const renderArticleCard = (article) => (
    <div key={article._id} className="news-card" data-bias={article.articleBias}>
      <div className="news-card-content">
        {article.imageUrl && (
          <div className="news-image">
            <img 
              src={article.imageUrl} 
              alt={article.title} 
              loading="lazy"
              onError={(e) => {
                e.target.style.display = 'none'; // Hide broken images
              }}
            />
          </div>
        )}
        
        <div className="news-text">
          <div className="news-meta">
            <span className="news-source">{article.source.name}</span>
            <span className="news-date">{formatTimeAgo(article.publishedAt)}</span>
            <div className="news-badges">
              <span className="category-badge">{article.category}</span>
              <span 
                className="bias-badge"
                style={{ backgroundColor: getBiasColor(article.articleBias) }}
              >
                {getBiasLabel(article.articleBias)}
              </span>
              {article.biasConfidence > 0.7 && (
                <span className="confidence-badge">High Confidence</span>
              )}
            </div>
          </div>
          
          <h3 className="news-title">
            {article.aiHeading || article.title}
          </h3>
          
          <p className="news-summary">
            {article.summary || article.description}
          </p>
          
          {article.keywords && article.keywords.length > 0 && (
            <div className="news-keywords">
              {article.keywords.slice(0, 3).map((keyword, index) => (
                <span key={index} className="keyword-tag">
                  {keyword}
                </span>
              ))}
            </div>
          )}
          
          <div className="news-actions">
            <a 
              href={article.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="read-more-btn"
            >
              Read Full Article
            </a>
            {article.biasReasoning && (
              <button 
                className="bias-info-btn"
                title={article.biasReasoning}
              >
                ℹ️ Bias Info
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStoryGroupCard = (storyGroup) => (
    <div key={storyGroup._id} className="story-group-card">
      <div className="story-group-header">
        <h3 className="story-group-title">{storyGroup.mainHeadline}</h3>
        <p className="story-group-summary">{storyGroup.summary}</p>
        
        <div className="story-group-meta">
          <span className="story-category">{storyGroup.category}</span>
          <span className="story-date">{formatTimeAgo(storyGroup.createdAt)}</span>
        </div>
      </div>
      
      <div className="story-bias-distribution">
        <div className="bias-breakdown">
          <span>Coverage by political leaning:</span>
          <div className="bias-counts">
            <div className="bias-count left">
              <span className="bias-dot" style={{ backgroundColor: getBiasColor('left') }}></span>
              Left: {storyGroup.biasDistribution.left}
            </div>
            <div className="bias-count center">
              <span className="bias-dot" style={{ backgroundColor: getBiasColor('center') }}></span>
              Center: {storyGroup.biasDistribution.center}
            </div>
            <div className="bias-count right">
              <span className="bias-dot" style={{ backgroundColor: getBiasColor('right') }}></span>
              Right: {storyGroup.biasDistribution.right}
            </div>
          </div>
        </div>
      </div>
      
      <button 
        className="compare-coverage-btn"
        onClick={() => handleStoryClick(storyGroup._id)}
      >
        📊 Compare Coverage ({storyGroup.articles.length} sources)
      </button>
    </div>
  );

  const renderLoadingSkeleton = () => (
    <div className="loading-skeleton">
      {[...Array(5)].map((_, index) => (
        <div key={index} className="skeleton-card">
          <Skeleton height={200} />
          <div className="skeleton-content">
            <Skeleton count={3} />
          </div>
        </div>
      ))}
    </div>
  );

  if (selectedStory) {
    return (
      <CompareCoverage 
        story={selectedStory} 
        onClose={() => setSelectedStory(null)} 
      />
    );
  }

  return (
    <div className="news-feed-container">
      {/* Filter Sidebar */}
      <FilterSidebar
        filters={filters}
        onFiltersChange={handleFiltersChange}
        isOpen={showFilters}
        onToggle={() => setShowFilters(!showFilters)}
      />

      {/* Main Content */}
      <div className="news-feed-main">
        {/* Header */}
        <div className="news-feed-header">
          <div className="header-top">
            <h1>📰 The Narrative</h1>
            <button 
              className="filter-toggle-btn"
              onClick={() => setShowFilters(!showFilters)}
            >
              🔍 Filters
            </button>
          </div>
          
          {/* Stats Bar */}
          <div className="stats-bar">
            <div className="stat-item">
              <span className="stat-number">{stats.totalArticles.toLocaleString()}</span>
              <span className="stat-label">Total Articles</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">
                {stats.lastUpdate ? formatTimeAgo(stats.lastUpdate) : 'N/A'}
              </span>
              <span className="stat-label">Last Updated</span>
            </div>
            <div className="bias-stats">
              {Object.entries(stats.biasStats).map(([bias, count]) => (
                <div key={bias} className="bias-stat">
                  <span 
                    className="bias-dot"
                    style={{ backgroundColor: getBiasColor(bias) }}
                  ></span>
                  <span>{bias}: {count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* View Toggle */}
          <div className="view-toggle">
            <button 
              className={`view-btn ${view === 'articles' ? 'active' : ''}`}
              onClick={() => setView('articles')}
            >
              📄 Individual Articles
            </button>
            <button 
              className={`view-btn ${view === 'stories' ? 'active' : ''}`}
              onClick={() => setView('stories')}
            >
              📰 Story Groups
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="news-content" ref={containerRef}>
          {loading ? (
            renderLoadingSkeleton()
          ) : (
            <InfiniteScroll
              dataLength={view === 'articles' ? articles.length : storyGroups.length}
              next={loadMore}
              hasMore={hasMore}
              loader={<div className="loading-more">Loading more...</div>}
              endMessage={
                <div className="end-message">
                  <p>🎉 You've reached the end of the feed!</p>
                  <p>Check back later for more articles.</p>
                </div>
              }
              refreshFunction={loadInitialData}
              pullDownToRefresh
              pullDownToRefreshContent={
                <h3 style={{ textAlign: 'center' }}>⬇️ Pull down to refresh</h3>
              }
              releaseToRefreshContent={
                <h3 style={{ textAlign: 'center' }}>⬆️ Release to refresh</h3>
              }
            >
              <div className="news-grid">
                {view === 'articles' ? (
                  articles.length > 0 ? articles.map(renderArticleCard) : <p>No articles found</p>
                ) : (
                  storyGroups.length > 0 ? storyGroups.map(renderStoryGroupCard) : <p>No story groups found</p>
                )}
              </div>
            </InfiniteScroll>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewsFeed;
