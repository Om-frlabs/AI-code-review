import './SettingsModal.css';
import { useState } from 'react';
import { useApp } from '../context/AppContext';

const PROVIDERS = [
  { id: 'openai', name: 'OpenAI', model: 'GPT-4o', color: '#10a37f' },
  { id: 'anthropic', name: 'Anthropic', model: 'Claude', color: '#d4a574' },
  { id: 'gemini', name: 'Google', model: 'Gemini 2.0 Flash', color: '#4285f4' },
  { id: 'grok', name: 'xAI', model: 'Grok 3', color: '#1da1f2' },
];

export default function SettingsModal({ onClose }) {
  const { settings, setSettings } = useApp();
  const [localSettings, setLocalSettings] = useState({ ...settings });
  const [showKeys, setShowKeys] = useState({});

  const handleSave = () => {
    setSettings(localSettings);
    onClose();
  };

  const toggleKey = (provider) => {
    setShowKeys((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Settings</h2>
          <button className="btn-ghost btn-icon" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Provider Selection */}
        <div className="settings-section">
          <h3 className="settings-section-title">LLM Provider</h3>
          <div className="provider-grid">
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                className={`provider-card ${localSettings.provider === p.id ? 'active' : ''}`}
                onClick={() => setLocalSettings((s) => ({ ...s, provider: p.id }))}
              >
                <span className="provider-dot" style={{ background: p.color, width: 10, height: 10 }} />
                <div className="provider-info">
                  <span className="provider-card-name">{p.name}</span>
                  <span className="provider-card-model">{p.model}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* API Keys */}
        <div className="settings-section">
          <h3 className="settings-section-title">API Keys</h3>
          <p className="settings-hint">Keys are stored locally in your browser and sent directly to the provider APIs. Never shared with our servers.</p>
          {PROVIDERS.map((p) => (
            <div key={p.id} className="key-field">
              <label className="input-label">
                <span className="provider-dot" style={{ background: p.color }} /> {p.name} API Key
              </label>
              <div className="key-input-wrapper">
                <input
                  type={showKeys[p.id] ? 'text' : 'password'}
                  className="input-field"
                  placeholder={`Enter ${p.name} API key`}
                  value={localSettings.apiKeys[p.id] || ''}
                  onChange={(e) =>
                    setLocalSettings((s) => ({
                      ...s,
                      apiKeys: { ...s.apiKeys, [p.id]: e.target.value },
                    }))
                  }
                />
                <button className="key-toggle" onClick={() => toggleKey(p.id)} type="button" aria-label="Toggle visibility">
                  {showKeys[p.id] ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* GitHub Token */}
        <div className="settings-section">
          <h3 className="settings-section-title">GitHub</h3>
          <div className="key-field">
            <label className="input-label">Personal Access Token (optional)</label>
            <div className="key-input-wrapper">
              <input
                type={showKeys.github ? 'text' : 'password'}
                className="input-field"
                placeholder="ghp_xxxxxxxxxxxx"
                value={localSettings.githubToken || ''}
                onChange={(e) =>
                  setLocalSettings((s) => ({ ...s, githubToken: e.target.value }))
                }
              />
              <button className="key-toggle" onClick={() => toggleKey('github')} type="button" aria-label="Toggle visibility">
                {showKeys.github ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            <span className="settings-hint" style={{ marginTop: 6 }}>Required for private repos. Public repos work without a token.</span>
          </div>
        </div>

        {/* Actions */}
        <div className="settings-actions">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save Settings</button>
        </div>
      </div>
    </div>
  );
}
