import './ReviewResults.css';
import { useState, lazy, Suspense } from 'react';
import { useApp } from '../context/AppContext';

const MonacoEditor = lazy(() => import('@monaco-editor/react'));

function getScoreClass(score) {
  if (!score || score === 0) return '';
  if (score >= 7) return 'score-high';
  if (score >= 4) return 'score-mid';
  return 'score-low';
}

function SeverityBadge({ severity }) {
  const map = {
    critical: 'badge-critical',
    warning: 'badge-warning',
    info: 'badge-info',
    high: 'badge-critical',
    medium: 'badge-warning',
    low: 'badge-info',
  };
  return <span className={`badge ${map[severity] || 'badge-info'}`}>{severity}</span>;
}

function CategoryBadge({ category }) {
  const colors = {
    security: 'badge-critical',
    performance: 'badge-warning',
    errorHandling: 'badge-warning',
    readability: 'badge-info',
    architecture: 'badge-info',
    bestPractice: 'badge-success',
    testing: 'badge-info',
    typing: 'badge-info',
    accessibility: 'badge-warning',
  };
  return <span className={`badge ${colors[category] || 'badge-info'}`}>{category}</span>;
}

function MetricBar({ label, value, icon }) {
  const cls = value >= 7 ? 'metric-high' : value >= 4 ? 'metric-mid' : 'metric-low';
  return (
    <div className="metric-item">
      <div className="metric-header">
        <span className="metric-icon">{icon}</span>
        <span className="metric-label">{label}</span>
        <span className={`metric-value ${cls}`}>{value}/10</span>
      </div>
      <div className="metric-bar-track">
        <div className={`metric-bar-fill ${cls}`} style={{ width: `${value * 10}%` }} />
      </div>
    </div>
  );
}

function CodeCompare({ title, before, after, language }) {
  const [show, setShow] = useState(false);
  if (!before && !after) return null;

  return (
    <div className="code-compare">
      <button className="code-compare-toggle" onClick={() => setShow(!show)}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: show ? 'rotate(90deg)' : '', transition: 'transform 0.2s' }}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
        {title || 'View Code Fix'}
      </button>
      {show && (
        <div className="code-compare-panels animate-fade-in">
          {before && (
            <div className="code-panel code-panel-before">
              <span className="code-panel-label">❌ Current</span>
              <pre><code>{before}</code></pre>
            </div>
          )}
          {after && (
            <div className="code-panel code-panel-after">
              <span className="code-panel-label">✅ Fixed</span>
              <pre><code>{after}</code></pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ReviewResults() {
  const { currentReview, isReviewing, streamingText, error, clearError } = useApp();
  const [activeTab, setActiveTab] = useState('summary');

  // Error state
  if (error) {
    return (
      <div className="review-results glass-panel animate-fade-in">
        <div className="error-banner">
          <svg className="error-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <strong>Review Failed</strong>
            <p style={{ marginTop: 4, opacity: 0.9 }}>{error}</p>
          </div>
          <button className="error-dismiss" onClick={clearError}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // Streaming state
  if (isReviewing) {
    return (
      <div className="review-results glass-panel animate-fade-in">
        <div className="review-streaming">
          <div className="streaming-header">
            <div className="spinner spinner-lg" />
            <div>
              <h3>Deep Security Audit in Progress...</h3>
              <p>Scanning for vulnerabilities (OWASP/CWE), analyzing code quality, generating optimized rewrite</p>
            </div>
          </div>
          {streamingText && (
            <pre className="streaming-output">
              <code className="streaming-cursor">{streamingText}</code>
            </pre>
          )}
        </div>
      </div>
    );
  }

  // Empty state
  if (!currentReview?.review_json) {
    return (
      <div className="review-results glass-panel">
        <div className="empty-state">
          <div className="empty-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.3">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h3>Ready for Deep Analysis</h3>
          <p>Paste code or import a GitHub PR to get comprehensive security audit, vulnerability detection, and AI-optimized code rewrite</p>
        </div>
      </div>
    );
  }

  const review = currentReview.review_json;
  const criticalCount = (review.securityIssues?.filter(i => i.severity === 'critical').length || 0) +
    (review.issues?.filter(i => i.severity === 'critical').length || 0);

  const tabs = [
    { id: 'summary', label: 'Overview' },
    { id: 'issues', label: 'Issues', count: review.issues?.length || 0 },
    { id: 'security', label: '🛡 Security', count: review.securityIssues?.length || 0, alert: criticalCount > 0 },
    { id: 'suggestions', label: 'Improve', count: review.suggestions?.length || 0 },
    { id: 'rewrite', label: '✨ Best Version', hasContent: !!review.rewrittenCode },
  ];

  return (
    <div className="review-results glass-panel animate-fade-in">
      <div className="results-header">
        <div className="tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? 'active' : ''} ${tab.alert ? 'tab-alert' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
              {tab.count !== undefined && <span className="count">{tab.count}</span>}
              {tab.hasContent && <span className="count" style={{ background: 'var(--accent-primary)', color: 'white', fontSize: '0.6rem' }}>NEW</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="results-content">
        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'summary' && (
          <div className="tab-content animate-fade-in">
            <div className="summary-card">
              <div className="summary-score-section">
                <div
                  className={`score-gauge ${getScoreClass(review.score)}`}
                  style={{ '--score-pct': (review.score || 0) * 10 }}
                >
                  {review.score || '—'}
                </div>
                <div className="score-label">
                  <span className="score-value">{review.score}/10</span>
                  <span className="score-text">
                    {review.score >= 9 ? 'Excellent' : review.score >= 7 ? 'Good' : review.score >= 5 ? 'Needs Work' : review.score >= 3 ? 'Poor' : 'Critical'}
                  </span>
                </div>
              </div>
              <p className="summary-text">{review.summary}</p>
            </div>

            {/* Metrics Dashboard */}
            {review.metrics && (
              <div className="metrics-grid">
                <MetricBar label="Complexity" value={review.metrics.complexity} icon="🧩" />
                <MetricBar label="Maintainability" value={review.metrics.maintainability} icon="🔧" />
                <MetricBar label="Testability" value={review.metrics.testability} icon="🧪" />
                <MetricBar label="Security Posture" value={review.metrics.securityPosture} icon="🛡" />
              </div>
            )}

            <div className="summary-stats">
              <div className="stat-card stat-critical">
                <div className="stat-number">{review.issues?.filter(i => i.severity === 'critical').length || 0}</div>
                <div className="stat-label">Critical Issues</div>
              </div>
              <div className="stat-card stat-warning">
                <div className="stat-number">{review.issues?.filter(i => i.severity === 'warning').length || 0}</div>
                <div className="stat-label">Warnings</div>
              </div>
              <div className="stat-card stat-security">
                <div className="stat-number">{review.securityIssues?.length || 0}</div>
                <div className="stat-label">Vulnerabilities</div>
              </div>
              <div className="stat-card stat-suggestions">
                <div className="stat-number">{review.suggestions?.length || 0}</div>
                <div className="stat-label">Improvements</div>
              </div>
            </div>
          </div>
        )}

        {/* ── ISSUES TAB ── */}
        {activeTab === 'issues' && (
          <div className="tab-content animate-fade-in">
            {review.issues?.length === 0 ? (
              <div className="empty-tab">
                <span className="badge badge-success">✓ No Issues Found</span>
                <p>The code looks clean!</p>
              </div>
            ) : (
              <div className="issues-list">
                {review.issues?.map((issue, i) => (
                  <div key={i} className="issue-card animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                    <div className="issue-header">
                      <SeverityBadge severity={issue.severity} />
                      <span className="issue-title">{issue.title}</span>
                      {issue.line && <span className="issue-line">Line {issue.line}</span>}
                    </div>
                    <p className="issue-description">{issue.description}</p>
                    {issue.suggestion && (
                      <div className="issue-suggestion">
                        <strong>💡 Fix:</strong> {issue.suggestion}
                      </div>
                    )}
                    <CodeCompare before={issue.codeSnippet} after={issue.fixedCode} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SECURITY TAB ── */}
        {activeTab === 'security' && (
          <div className="tab-content animate-fade-in">
            {review.securityIssues?.length === 0 ? (
              <div className="empty-tab">
                <span className="badge badge-success">🛡 No Vulnerabilities Detected</span>
                <p>No security issues found in the scanned code</p>
              </div>
            ) : (
              <div className="issues-list">
                {review.securityIssues?.map((issue, i) => (
                  <div key={i} className="issue-card security-card animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                    <div className="issue-header">
                      <SeverityBadge severity={issue.severity} />
                      <span className="issue-title">{issue.title}</span>
                      <div className="security-badges">
                        {issue.cwe && <span className="issue-cwe">{issue.cwe}</span>}
                        {issue.owasp && <span className="issue-owasp">{issue.owasp}</span>}
                        {issue.cvss && <span className={`issue-cvss ${issue.cvss >= 7 ? 'cvss-high' : issue.cvss >= 4 ? 'cvss-mid' : 'cvss-low'}`}>CVSS {issue.cvss}</span>}
                      </div>
                    </div>
                    <p className="issue-description">{issue.description}</p>

                    {issue.exploitScenario && (
                      <div className="exploit-scenario">
                        <strong>🎯 Attack Scenario:</strong>
                        <p>{issue.exploitScenario}</p>
                      </div>
                    )}

                    {issue.suggestion && (
                      <div className="issue-suggestion">
                        <strong>🔒 Remediation:</strong> {issue.suggestion}
                      </div>
                    )}

                    <CodeCompare title="View Secure Fix" before={issue.codeSnippet || null} after={issue.fixedCode} />

                    {issue.references?.length > 0 && (
                      <div className="issue-refs">
                        {issue.references.map((ref, j) => (
                          <a key={j} href={ref} target="_blank" rel="noopener noreferrer" className="ref-link">📄 Reference</a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SUGGESTIONS TAB ── */}
        {activeTab === 'suggestions' && (
          <div className="tab-content animate-fade-in">
            {review.suggestions?.length === 0 ? (
              <div className="empty-tab">
                <span className="badge badge-success">✓ No Suggestions</span>
                <p>The code follows best practices</p>
              </div>
            ) : (
              <div className="issues-list">
                {review.suggestions?.map((sug, i) => (
                  <div key={i} className="issue-card suggestion-card animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                    <div className="issue-header">
                      <CategoryBadge category={sug.category} />
                      <span className="issue-title">{sug.title}</span>
                      <SeverityBadge severity={sug.priority} />
                    </div>
                    <p className="issue-description">{sug.description}</p>
                    <CodeCompare title="View Improvement" before={sug.currentCode} after={sug.improvedCode} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── BEST VERSION (REWRITE) TAB ── */}
        {activeTab === 'rewrite' && (
          <div className="tab-content animate-fade-in">
            {!review.rewrittenCode ? (
              <div className="empty-tab">
                <span className="badge badge-info">No Rewrite Available</span>
                <p>The AI didn't generate a rewritten version for this review</p>
              </div>
            ) : (
              <>
                {/* Changelog */}
                {review.rewriteChangelog?.length > 0 && (
                  <div className="rewrite-changelog">
                    <h4>What was improved:</h4>
                    <div className="changelog-items">
                      {review.rewriteChangelog.map((item, i) => (
                        <div key={i} className="changelog-item animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                          <CategoryBadge category={item.area} />
                          <span>{item.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Rewritten Code Editor */}
                <div className="rewrite-editor">
                  <div className="rewrite-editor-header">
                    <span>✨ Production-Ready Version</span>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => {
                        navigator.clipboard.writeText(review.rewrittenCode);
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                      Copy Code
                    </button>
                  </div>
                  <Suspense fallback={
                    <div className="editor-loading">
                      <div className="spinner" />
                      <span>Loading editor...</span>
                    </div>
                  }>
                    <MonacoEditor
                      height="500px"
                      language={currentReview?.language || 'javascript'}
                      value={review.rewrittenCode}
                      theme="vs-dark"
                      options={{
                        readOnly: true,
                        minimap: { enabled: true },
                        fontSize: 13,
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        padding: { top: 16 },
                        scrollBeyondLastLine: false,
                        wordWrap: 'on',
                        lineNumbers: 'on',
                        renderLineHighlight: 'gutter',
                        automaticLayout: true,
                      }}
                    />
                  </Suspense>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
