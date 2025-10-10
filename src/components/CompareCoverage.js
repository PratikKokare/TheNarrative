import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export default function CompareCoverage({ story }) {
  const containerRef = useRef();

  useEffect(() => {
    // Animate coverage cards in
    gsap.fromTo(".coverage-column", {
      opacity: 0,
      y: 30,
      scale: 0.95
    }, {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.5,
      stagger: 0.15,
      ease: "power2.out"
    });
  }, []);

  // Mock coverage data based on story sources
  const coverageData = story.sources ? story.sources.map((source, index) => ({
    bias: source.bias,
    source: source.name,
    headline: generateHeadlineVariant(story.title || story.summary, source.bias),
    excerpt: generateExcerpt(story.summary, source.bias),
    url: source.url
  })) : [];

  return (
    <div className="compare-coverage" ref={containerRef}>
      <div className="coverage-grid">
        {coverageData.map((coverage, index) => (
          <div key={index} className="coverage-column">
            <div className="coverage-header">
              {/* FIXED: Dot is now properly positioned with flexbox */}
              <div className={`bias-indicator ${coverage.bias}`}></div>
              <div className="coverage-info">
                <div className={`coverage-bias ${coverage.bias}`}>
                  {coverage.bias.charAt(0).toUpperCase() + coverage.bias.slice(1)} Perspective
                </div>
                <div className="coverage-source">{coverage.source}</div>
              </div>
            </div>
            
            <div className="coverage-content">
              <h4 className="coverage-headline">{coverage.headline}</h4>
              <p className="coverage-excerpt">{coverage.excerpt}</p>
              
              <a 
                href={coverage.url} 
                className="read-article-btn"
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  // Add click animation
                  gsap.to(e.target, {
                    scale: 0.95,
                    duration: 0.1,
                    yoyo: true,
                    repeat: 1,
                    ease: "power2.inOut"
                  });
                }}
              >
                Read Full Article
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper functions to generate variant headlines and excerpts
function generateHeadlineVariant(originalTitle, bias) {
  if (!originalTitle) return "News Update";
  
  // Simple variants based on bias
  const words = originalTitle.split(' ');
  const baseTitle = words.slice(0, Math.min(8, words.length)).join(' ');
  
  switch (bias) {
    case 'left':
      return baseTitle + " - Analysis";
    case 'right':
      return baseTitle + " - Report";
    case 'center':
    default:
      return baseTitle;
  }
}

function generateExcerpt(summary, bias) {
  if (!summary) return "Click to read the full coverage of this story.";
  
  const words = summary.split(' ');
  const excerpt = words.slice(0, 25).join(' ');
  
  const perspectives = {
    left: " This development raises important questions about...",
    right: " Sources indicate significant implications for...", 
    center: " Multiple factors contribute to this situation..."
  };
  
  return excerpt + (perspectives[bias] || perspectives.center);
}
