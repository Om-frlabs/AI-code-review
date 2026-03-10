import { createContext, useContext, useState, useCallback, useEffect } from 'react';

const AppContext = createContext(null);

const API_BASE = 'http://localhost:3001/api';

const DEFAULT_SETTINGS = {
  provider: 'openai',
  apiKeys: { openai: '', anthropic: '', gemini: '', grok: '' },
  githubToken: '',
};

function loadSettings() {
  try {
    const saved = localStorage.getItem('codeReviewSettings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function AppProvider({ children }) {
  const [settings, setSettingsState] = useState(loadSettings);
  const [reviews, setReviews] = useState([]);
  const [currentReview, setCurrentReview] = useState(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [prData, setPrData] = useState(null);

  // Persist settings
  const setSettings = useCallback((updates) => {
    setSettingsState((prev) => {
      const next = typeof updates === 'function' ? updates(prev) : { ...prev, ...updates };
      localStorage.setItem('codeReviewSettings', JSON.stringify(next));
      return next;
    });
  }, []);

  // Fetch review history
  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/review/history`);
      if (!res.ok) throw new Error('Failed to fetch history');
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch (err) {
      console.error('History fetch error:', err);
    }
  }, []);

  // Load a single review
  const loadReview = useCallback(async (id) => {
    try {
      setError(null);
      const res = await fetch(`${API_BASE}/review/${id}`);
      if (!res.ok) throw new Error('Review not found');
      const data = await res.json();
      setCurrentReview(data.review);
      setStreamingText('');
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Delete a review
  const deleteReviewById = useCallback(async (id) => {
    try {
      await fetch(`${API_BASE}/review/${id}`, { method: 'DELETE' });
      setReviews((prev) => prev.filter((r) => r.id !== id));
      if (currentReview?.id === id) {
        setCurrentReview(null);
      }
    } catch (err) {
      setError('Failed to delete review');
    }
  }, [currentReview]);

  // Submit code for review (SSE streaming)
  const submitReview = useCallback(async ({ code, diff, language, source, title }) => {
    setIsReviewing(true);
    setStreamingText('');
    setError(null);
    setCurrentReview(null);

    const apiKey = settings.apiKeys[settings.provider];
    if (!apiKey) {
      setError(`No API key configured for ${settings.provider}. Open Settings to add one.`);
      setIsReviewing(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          diff,
          language,
          source,
          title,
          provider: settings.provider,
          apiKey,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Review request failed');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let reviewId = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);

            if (parsed.type === 'start') {
              reviewId = parsed.reviewId;
            } else if (parsed.type === 'token') {
              setStreamingText((prev) => prev + parsed.content);
            } else if (parsed.type === 'complete') {
              setCurrentReview({
                id: parsed.reviewId,
                review_json: parsed.review,
                source,
                language,
                provider: settings.provider,
                title,
              });
              setStreamingText('');
              fetchHistory();
            } else if (parsed.type === 'error') {
              throw new Error(parsed.message);
            }
          } catch (e) {
            if (e.message !== 'Unexpected end of JSON input') {
              throw e;
            }
          }
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsReviewing(false);
    }
  }, [settings, fetchHistory]);

  // Fetch GitHub PR
  const fetchPR = useCallback(async (owner, repo, pullNumber) => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/github/pr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ owner, repo, pullNumber, token: settings.githubToken }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to fetch PR');
      }

      const data = await res.json();
      setPrData(data);
      return data;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, [settings.githubToken]);

  // Initial history load
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const clearError = useCallback(() => setError(null), []);

  const value = {
    // State
    settings,
    reviews,
    currentReview,
    isReviewing,
    streamingText,
    error,
    sidebarOpen,
    prData,
    // Actions
    setSettings,
    submitReview,
    loadReview,
    deleteReviewById,
    fetchPR,
    setSidebarOpen,
    setPrData,
    setCurrentReview,
    clearError,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
