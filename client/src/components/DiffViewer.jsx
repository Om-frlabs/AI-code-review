import './DiffViewer.css';
import { lazy, Suspense } from 'react';

const MonacoDiffEditor = lazy(() =>
  import('@monaco-editor/react').then((mod) => ({ default: mod.DiffEditor }))
);

export default function DiffViewer({ original, modified, language }) {
  if (!original && !modified) return null;

  return (
    <div className="diff-viewer glass-panel animate-fade-in">
      <div className="diff-header">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v18" />
          <rect x="3" y="3" width="7" height="18" rx="1" />
          <rect x="14" y="3" width="7" height="18" rx="1" />
        </svg>
        <span>Diff Viewer</span>
      </div>
      <div className="diff-editor-wrapper">
        <Suspense fallback={
          <div className="diff-loading">
            <div className="spinner spinner-lg" />
            <span>Loading diff viewer...</span>
          </div>
        }>
          <MonacoDiffEditor
            height="400px"
            language={language || 'plaintext'}
            original={original || ''}
            modified={modified || ''}
            theme="vs-dark"
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 13,
              fontFamily: "'JetBrains Mono', monospace",
              scrollBeyondLastLine: false,
              renderSideBySide: true,
              automaticLayout: true,
              padding: { top: 12 },
            }}
          />
        </Suspense>
      </div>
    </div>
  );
}
