import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function LegalQuery() {
  const [query, setQuery] = useState('');
  const [advice, setAdvice] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fadeIn, setFadeIn] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const clipboardAnnouncementRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Get initial query and advice from navigation state
  const initialQuery = location.state?.query || '';
  const initialAdvice = location.state?.advice || '';

  // Set initial state if navigated from Hero
  useEffect(() => {
    if (initialQuery && initialAdvice) {
      setQuery(initialQuery);
      setAdvice(initialAdvice);
    }
    
    // Animation on load
    setTimeout(() => {
      setFadeIn(true);
    }, 100);
  }, [initialQuery, initialAdvice]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      setError('Please enter a legal question to continue');
      return;
    }
    
    setError('');
    setAdvice('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:5000/legal-help', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      const data = await response.json();
      if (response.ok) {
        setAdvice(data.advice);
        // Scroll to advice after it loads
        setTimeout(() => {
          document.getElementById('advice-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } else {
        setError(data.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      console.error('Error:', err);
      setError('Failed to connect to the server. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleNewQuery = () => {
    navigate('/');
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(advice);
      setCopySuccess(true);
      setCopyError(false);
      
      // Use a screen reader announcement
      if (clipboardAnnouncementRef.current) {
        clipboardAnnouncementRef.current.textContent = 'Advice copied to clipboard successfully';
      }
      
      // Reset success state after animation completes
      setTimeout(() => {
        setCopySuccess(false);
        
        if (clipboardAnnouncementRef.current) {
          clipboardAnnouncementRef.current.textContent = '';
        }
      }, 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
      setCopyError(true);
      setCopySuccess(false);
      
      if (clipboardAnnouncementRef.current) {
        clipboardAnnouncementRef.current.textContent = 'Failed to copy to clipboard';
      }
      
      setTimeout(() => {
        setCopyError(false);
        if (clipboardAnnouncementRef.current) {
          clipboardAnnouncementRef.current.textContent = '';
        }
      }, 2000);
    }
  };

  const formatContent = (text) => {
    if (!text) return [];
    
    return text.split('\n').map((paragraph, index) => {
      // Check if it's a heading (starts with # or ##)
      if (paragraph.startsWith('# ')) {
        return <h2 key={index} id={`section-${index}`}>{paragraph.substring(2)}</h2>;
      } else if (paragraph.startsWith('## ')) {
        return <h3 key={index} id={`section-${index}`}>{paragraph.substring(3)}</h3>;
      } else if (paragraph.startsWith('### ')) {
        return <h4 key={index} id={`section-${index}`}>{paragraph.substring(4)}</h4>;
      }
      
      // Process bold text (**text**)
      const formattedText = paragraph.split(/(\*\*.*?\*\*)/g).map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.substring(2, part.length - 2)}</strong>;
        }
        return part;
      });
      
      return paragraph ? <p key={index}>{formattedText}</p> : <br key={index} />;
    });
  };

  return (
    <div className={`query-container ${fadeIn ? 'fade-in' : ''}`}>
      <div className="query-header">
        <h1>Legal Analysis</h1>
        <button className="new-query-button ripple-button" onClick={handleNewQuery} aria-label="Start a new question">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          New Question
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="query-form">
        <label htmlFor="legal-query" className="visually-hidden">Enter your legal question</label>
        <div className="input-wrapper">
          <div className="input-icon" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <input
            type="text"
            id="legal-query"
            className="query-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your legal question..."
            disabled={loading}
            aria-describedby={error ? "query-error" : undefined}
          />
          <button
            type="submit"
            className="query-button ripple-button"
            disabled={loading}
            aria-label={loading ? "Processing your request" : "Get legal advice"}
          >
            {loading ? (
              <>
                <svg className="spinner" viewBox="0 0 50 50" aria-hidden="true">
                  <circle className="path" cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                </svg>
                <span>Processing</span>
              </>
            ) : 'Get Legal Advice'}
          </button>
        </div>
        
        {error && (
          <div className="error" id="query-error" role="alert">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            {error}
          </div>
        )}
      </form>
      
      {loading && (
        <div className="loading-container" aria-live="polite">
          <div className="loading-spinner" aria-hidden="true"></div>
          <p>Our AI is analyzing your legal question...</p>
        </div>
      )}
      
      {advice && (
        <div id="advice-section" className="advice" aria-live="polite">
          <div className="advice-header">
            <h2>Legal Analysis</h2>
            <div className="advice-badge" aria-label="AI-Generated Content">AI-Generated</div>
          </div>
          <div className="advice-content">
            {formatContent(advice)}
          </div>
          <div className="advice-footer">
            <p className="disclaimer">Note: This advice is generated by AI and should not replace professional legal counsel.</p>
            <div className="advice-actions">
              <button 
                className={`action-button copy-button ${copySuccess ? 'success' : ''} ${copyError ? 'error' : ''}`}
                onClick={handleCopyToClipboard}
                aria-label="Copy advice to clipboard"
              >
                {copySuccess ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 6L9 17l-5-5"></path>
                    </svg>
                    <span className="button-text">Copied!</span>
                  </>
                ) : copyError ? (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="8" x2="12" y2="12"></line>
                      <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <span className="button-text">Failed to copy</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    <span className="button-text">Copy to Clipboard</span>
                  </>
                )}
              </button>
              <span id="clipboard-announcement" className="visually-hidden" aria-live="assertive" ref={clipboardAnnouncementRef}></span>
              <button 
                className="action-button print-button"
                onClick={() => window.print()}
                aria-label="Print advice"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="6 9 6 2 18 2 18 9"></polyline>
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                  <rect x="6" y="14" width="12" height="8"></rect>
                </svg>
                <span>Print</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LegalQuery;