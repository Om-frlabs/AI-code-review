import './Sidebar.css';
import { useApp } from '../context/AppContext';
import { useState } from 'react';

function getScoreClass(score) {
  if (!score || score === 0) return '';
  if (score >= 7) return 'score-high';
  if (score >= 4) return 'score-mid';
  return 'score-low';
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Sidebar() {
  const { reviews, currentReview, loadReview, deleteReviewById, sidebarOpen, setCurrentReview, setPrData } = useApp();
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const filtered = reviews.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.language?.toLowerCase().includes(search.toLowerCase())
  );

  const handleNew = () => {
    setCurrentReview(null);
    setPrData(null);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    setDeletingId(id);
    await deleteReviewById(id);
    setDeletingId(null);
  };

  return (
    <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <h2 className="sidebar-title">History</h2>
        <button className="btn btn-primary btn-sm" onClick={handleNew}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New
        </button>
      </div>

      <div className="sidebar-search">
        <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="Search reviews..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="sidebar-list">
        {filtered.length === 0 ? (
          <div className="sidebar-empty">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span>{search ? 'No matches' : 'No reviews yet'}</span>
          </div>
        ) : (
          filtered.map((review, i) => (
            <div
              key={review.id}
              className={`sidebar-item ${currentReview?.id === review.id ? 'active' : ''}`}
              onClick={() => loadReview(review.id)}
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <div className="sidebar-item-top">
                <span className="sidebar-item-title">{review.title}</span>
                {review.score > 0 && (
                  <span className={`score-mini ${getScoreClass(review.score)}`}>
                    {review.score}
                  </span>
                )}
              </div>
              <div className="sidebar-item-meta">
                <span className={`provider-dot ${review.provider}`} />
                <span className="sidebar-item-provider">{review.provider}</span>
                <span className="sidebar-item-lang">{review.language}</span>
                <span className="sidebar-item-date">{formatDate(review.created_at)}</span>
              </div>
              <button
                className="sidebar-item-delete"
                onClick={(e) => handleDelete(e, review.id)}
                disabled={deletingId === review.id}
                aria-label="Delete review"
              >
                {deletingId === review.id ? (
                  <div className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} />
                ) : (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                )}
              </button>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
