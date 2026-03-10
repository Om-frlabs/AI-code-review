import './TopBar.css';
import { useApp } from '../context/AppContext';

export default function TopBar({ onOpenSettings }) {
  const { settings, sidebarOpen, setSidebarOpen } = useApp();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          className="btn-ghost topbar-menu-btn"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="Toggle sidebar"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="topbar-brand">
          <div className="topbar-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect width="24" height="24" rx="6" fill="url(#logo-grad)" />
              <path d="M7 8l3 8h4l3-8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M9 14h6" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <defs>
                <linearGradient id="logo-grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#6366f1" />
                  <stop offset="1" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <h1 className="topbar-title">CodeReview AI</h1>
            <span className="topbar-subtitle">Intelligent Code Analysis</span>
          </div>
        </div>
      </div>

      <div className="topbar-right">
        <div className="topbar-provider">
          <span className={`provider-dot ${settings.provider}`} />
          <span className="provider-name">{settings.provider}</span>
        </div>
        <button className="btn-ghost topbar-settings-btn" onClick={onOpenSettings} aria-label="Settings">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        </button>
      </div>
    </header>
  );
}
