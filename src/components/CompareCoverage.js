import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import moment from 'moment';

export default function CompareCoverage({ story, onClose }) {
  const containerRef = useRef();
  
  useEffect(() => {
    // Animate coverage cards in
    gsap.fromTo(".coverage-column", 
      { opacity: 0, y: 30, scale: 0.95 }, 
      { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.15, ease: "power2.out" }
    );
  }, []);

  if (!story || !story.articlesByBias) {
    return (
      <div className="compare-coverage-container">
        <div className="loading-state">
          <h2>Loading story details...</h2>
        </div>
      </div>
    );
  }

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

  const renderArticleCard = (article, bias) => (
    <div key={article._id} className={`coverage-article bias-${bias}`}>
      <div className="article-header">
        <div className="source-info">
          <span className="source-name">{article.source.name}</span>
          <div className="bias-indicators">
            <span 
              className="source-bias-badge"
              style={{ backgroundColor: getBiasColor(article.source.bias) }}
            >
              Source: {getBiasLabel(article.source.bias)}
            </span>
            <span 
              className="article-bias-badge"
              style={{ backgroundColor: getBiasColor(article.articleBias) }}
            >
              Article: {getBiasLabel(article.articleBias)}
            </span>
            {article.biasConfidence > 0.7 && (
              <span className="confidence-badge high-confidence">
                {Math.round(article.biasConfidence * 100)}% confidence
              </span>
            )}
          </div>
        </div>
        <span className="publish-time">{formatTimeAgo(article.publishedAt)}</span>
      </div>

      <h4 className="article-title">
        {article.aiHeading || article.title}
      </h4>
      
      {article.summary && (
        <p className="article-summary">
          {article.summary}
        </p>
      )}

      {article.biasReasoning && (
        <div className="bias-reasoning">
          <details>
            <summary>🔍 Why this bias classification?</summary>
            <p>{article.biasReasoning}</p>
          </details>
        </div>
      )}

      {article.keywords && article.keywords.length > 0 && (
        <div className="article-keywords">
          {article.keywords.slice(0, 4).map((keyword, index) => (
            <span key={index} className="keyword-tag">
              {keyword}
            </span>
          ))}
        </div>
      )}

      <button 
        className="read-article-btn"
        onClick={(e) => {
          // Add click animation
          gsap.to(e.target, { 
            scale: 0.95, 
            duration: 0.1, 
            yoyo: true, 
            repeat: 1, 
            ease: "power2.inOut" 
          });
          // Open article
          window.open(article.url, '_blank');
        }}
      >
        Read Full Article
      </button>
    </div>
  );

  const renderBiasColumn = (biasType, biasLabel, articles, missingMessage) => (
    <div className={`coverage-column bias-${biasType}`} key={biasType}>
      <div className="column-header">
        <div className="bias-indicator">
          <span 
            className="bias-dot"
            style={{ backgroundColor: getBiasColor(biasType) }}
          ></span>
          <h3>{biasLabel}</h3>
          <span className="article-count">({articles.length} articles)</span>
        </div>
      </div>
      
      <div className="column-content">
        {articles.length > 0 ? (
          articles.map(article => renderArticleCard(article, biasType))
        ) : (
          <div className="no-coverage">
            <div className="no-coverage-icon">📰</div>
            <h4>No {biasLabel} Coverage Found</h4>
            <p>{missingMessage}</p>
          </div>
        )}
      </div>
    </div>
  );

  const { storyGroup, articlesByBias, missingBiases } = story;

  return (
    <div className="compare-coverage-container" ref={containerRef}>
      {/* Header */}
      <div className="coverage-header">
        <button className="back-button" onClick={onClose}>
          ← Back to Feed
        </button>
        
        <div className="story-info">
          <h1 className="story-headline">{storyGroup.mainHeadline}</h1>
          <p className="story-summary">{storyGroup.summary}</p>
          
          <div className="story-meta">
            <span className="story-category">{storyGroup.category}</span>
            <span className="story-date">
              Updated {formatTimeAgo(storyGroup.lastUpdated)}
            </span>
            <span className="total-sources">
              {storyGroup.articles.length} sources analyzed
            </span>
          </div>
        </div>
      </div>

      {/* Bias Distribution Overview */}
      <div className="bias-overview">
        <h3>Coverage Distribution</h3>
        <div className="bias-summary">
          <div className="bias-summary-item">
            <span className="bias-dot" style={{ backgroundColor: getBiasColor('left') }}></span>
            <span>Left: {storyGroup.biasDistribution.left}</span>
          </div>
          <div className="bias-summary-item">
            <span className="bias-dot" style={{ backgroundColor: getBiasColor('center') }}></span>
            <span>Center: {storyGroup.biasDistribution.center}</span>
          </div>
          <div className="bias-summary-item">
            <span className="bias-dot" style={{ backgroundColor: getBiasColor('right') }}></span>
            <span>Right: {storyGroup.biasDistribution.right}</span>
          </div>
        </div>
      </div>

      {/* Missing Bias Alerts */}
      {(missingBiases.left || missingBiases.center || missingBiases.right) && (
        <div className="missing-biases-alert">
          <h4>⚠️ Incomplete Perspective Coverage</h4>
          <p>
            This story is missing coverage from{' '}
            {[
              missingBiases.left && 'Left-leaning',
              missingBiases.center && 'Centrist', 
              missingBiases.right && 'Right-leaning'
            ].filter(Boolean).join(', ')}{' '}
            sources. This may indicate limited media attention from certain political perspectives.
          </p>
        </div>
      )}

      {/* Coverage Columns */}
      <div className="coverage-grid">
        {renderBiasColumn(
          'left',
          'Left Leaning',
          articlesByBias.left,
          'No left-leaning publications have covered this story yet, or their coverage was not detected in our analysis.'
        )}
        
        {renderBiasColumn(
          'center',
          'Center',
          articlesByBias.center,
          'No centrist publications have covered this story yet, or their coverage was not detected in our analysis.'
        )}
        
        {renderBiasColumn(
          'right',
          'Right Leaning', 
          articlesByBias.right,
          'No right-leaning publications have covered this story yet, or their coverage was not detected in our analysis.'
        )}
      </div>

      {/* Analysis Notes */}
      <div className="analysis-notes">
        <h4>📊 How We Determine Bias</h4>
        <div className="analysis-explanation">
          <p>
            Our AI analyzes each article's tone, word choice, framing, and perspective to determine political leaning. 
            We consider both the publication's typical bias and the specific article's content, with higher weight given to the individual article's analysis.
          </p>
          <ul>
            <li><strong>Article Analysis:</strong> Primary factor (70% weight) - Based on language, tone, and framing</li>
            <li><strong>Source Reputation:</strong> Secondary factor (30% weight) - Based on publication's known bias</li>
            <li><strong>Confidence Score:</strong> How certain our AI is about the classification</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
