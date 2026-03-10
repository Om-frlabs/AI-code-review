import './CodeInput.css';
import { useState, lazy, Suspense, useCallback } from 'react';
import { useApp } from '../context/AppContext';

const MonacoEditor = lazy(() => import('@monaco-editor/react'));

const LANGUAGES = [
  'javascript', 'typescript', 'python', 'java', 'go', 'rust',
  'c', 'cpp', 'csharp', 'ruby', 'php', 'swift', 'kotlin',
  'html', 'css', 'sql', 'bash', 'yaml', 'json', 'markdown',
  'dockerfile', 'plaintext',
];

export default function CodeInput() {
  const { submitReview, isReviewing, fetchPR, prData, setPrData, error } = useApp();
  const [mode, setMode] = useState('paste'); // 'paste' | 'github'
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [title, setTitle] = useState('');

  // GitHub fields
  const [ghOwner, setGhOwner] = useState('');
  const [ghRepo, setGhRepo] = useState('');
  const [ghPR, setGhPR] = useState('');
  const [fetchingPR, setFetchingPR] = useState(false);

  const handlePasteSubmit = useCallback(() => {
    if (!code.trim()) return;
    submitReview({
      code,
      language,
      source: 'paste',
      title: title || `${language} review`,
    });
  }, [code, language, title, submitReview]);

  const handleFetchPR = useCallback(async () => {
    if (!ghOwner || !ghRepo || !ghPR) return;
    setFetchingPR(true);
    const data = await fetchPR(ghOwner, ghRepo, ghPR);
    setFetchingPR(false);
  }, [ghOwner, ghRepo, ghPR, fetchPR]);

  const handleGithubSubmit = useCallback(() => {
    if (!prData) return;
    submitReview({
      diff: prData.rawDiff,
      source: 'github',
      title: prData.pr?.title || `PR #${ghPR}`,
    });
  }, [prData, ghPR, submitReview]);

  const handlePRUrlParse = useCallback((url) => {
    // Parse GitHub PR URL: https://github.com/owner/repo/pull/123
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
    if (match) {
      setGhOwner(match[1]);
      setGhRepo(match[2]);
      setGhPR(match[3]);
    }
  }, []);

  return (
    <div className="code-input glass-panel animate-fade-in">
      <div className="code-input-header">
        <div className="mode-tabs">
          <button
            className={`mode-tab ${mode === 'paste' ? 'active' : ''}`}
            onClick={() => setMode('paste')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            </svg>
            Paste Code
          </button>
          <button
            className={`mode-tab ${mode === 'github' ? 'active' : ''}`}
            onClick={() => setMode('github')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            GitHub PR
          </button>
        </div>
      </div>

      {mode === 'paste' ? (
        <div className="paste-mode">
          <div className="paste-controls">
            <div className="paste-field">
              <label className="input-label" htmlFor="review-title">Title (optional)</label>
              <input
                id="review-title"
                className="input-field"
                placeholder="e.g., Auth middleware refactor"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="paste-field" style={{ maxWidth: 180 }}>
              <label className="input-label" htmlFor="language-select">Language</label>
              <select
                id="language-select"
                className="select-field"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="editor-wrapper">
            <Suspense fallback={
              <div className="editor-loading">
                <div className="spinner spinner-lg" />
                <span>Loading editor...</span>
              </div>
            }>
              <MonacoEditor
                height="320px"
                language={language}
                value={code}
                onChange={(val) => setCode(val || '')}
                theme="vs-dark"
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  padding: { top: 16 },
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  lineNumbers: 'on',
                  renderLineHighlight: 'gutter',
                  automaticLayout: true,
                  placeholder: 'Paste your code here...',
                }}
              />
            </Suspense>
          </div>

          <div className="paste-actions">
            <span className="char-count">{code.length.toLocaleString()} characters</span>
            <button
              className="btn btn-primary"
              onClick={handlePasteSubmit}
              disabled={!code.trim() || isReviewing}
            >
              {isReviewing ? (
                <>
                  <div className="spinner" />
                  Analyzing...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                    <line x1="11" y1="8" x2="11" y2="14" />
                    <line x1="8" y1="11" x2="14" y2="11" />
                  </svg>
                  Review Code
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="github-mode">
          <div className="github-url-hint">
            <span>Tip: Paste a GitHub PR URL and fields auto-fill</span>
          </div>

          <div className="github-fields">
            <div className="github-field">
              <label className="input-label" htmlFor="gh-url">PR URL or Owner</label>
              <input
                id="gh-url"
                className="input-field"
                placeholder="https://github.com/owner/repo/pull/123 or owner"
                value={ghOwner}
                onChange={(e) => {
                  const v = e.target.value;
                  handlePRUrlParse(v);
                  setGhOwner(v.includes('github.com') ? ghOwner : v);
                }}
              />
            </div>
            <div className="github-field-row">
              <div className="github-field" style={{ flex: 1 }}>
                <label className="input-label" htmlFor="gh-repo">Repository</label>
                <input
                  id="gh-repo"
                  className="input-field"
                  placeholder="repo-name"
                  value={ghRepo}
                  onChange={(e) => setGhRepo(e.target.value)}
                />
              </div>
              <div className="github-field" style={{ maxWidth: 120 }}>
                <label className="input-label" htmlFor="gh-pr-number">PR #</label>
                <input
                  id="gh-pr-number"
                  className="input-field"
                  type="number"
                  placeholder="123"
                  value={ghPR}
                  onChange={(e) => setGhPR(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="github-actions">
            <button
              className="btn btn-secondary"
              onClick={handleFetchPR}
              disabled={!ghOwner || !ghRepo || !ghPR || fetchingPR}
            >
              {fetchingPR ? (
                <><div className="spinner" /> Fetching...</>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Fetch PR Diff
                </>
              )}
            </button>
            {prData && (
              <button
                className="btn btn-primary"
                onClick={handleGithubSubmit}
                disabled={isReviewing}
              >
                {isReviewing ? (
                  <><div className="spinner" /> Analyzing...</>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" />
                      <path d="M21 21l-4.35-4.35" />
                    </svg>
                    Review PR
                  </>
                )}
              </button>
            )}
          </div>

          {prData && (
            <div className="pr-preview animate-fade-in">
              <div className="pr-preview-header">
                <h4>{prData.pr.title}</h4>
                <span className="badge badge-info">{prData.pr.state}</span>
              </div>
              <div className="pr-preview-meta">
                <span>by <strong>{prData.pr.author}</strong></span>
                <span>{prData.pr.base} ← {prData.pr.head}</span>
              </div>
              <div className="pr-preview-stats">
                <span className="stat-add">+{prData.pr.additions}</span>
                <span className="stat-del">-{prData.pr.deletions}</span>
                <span>{prData.pr.changedFiles} files</span>
              </div>
              <div className="pr-files-list">
                {prData.files.slice(0, 10).map((f) => (
                  <div key={f.filename} className="pr-file-item">
                    <span className={`pr-file-status ${f.status}`}>{f.status[0].toUpperCase()}</span>
                    <span className="pr-file-name">{f.filename}</span>
                    <span className="pr-file-changes">
                      <span className="stat-add">+{f.additions}</span>
                      <span className="stat-del">-{f.deletions}</span>
                    </span>
                  </div>
                ))}
                {prData.files.length > 10 && (
                  <div className="pr-files-more">... and {prData.files.length - 10} more files</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
