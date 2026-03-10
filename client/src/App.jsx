import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import CodeInput from './components/CodeInput';
import ReviewResults from './components/ReviewResults';
import DiffViewer from './components/DiffViewer';
import SettingsModal from './components/SettingsModal';
import './App.css';

function AppInner() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { currentReview, prData } = useApp();

  // Show diff viewer if we have PR data with a diff
  const showDiff = currentReview?.source === 'github' && currentReview?.diff;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-area">
        <TopBar onOpenSettings={() => setSettingsOpen(true)} />
        <main className="main-content">
          <CodeInput />
          {showDiff && (
            <DiffViewer
              original=""
              modified={currentReview.diff}
              language={currentReview.language}
            />
          )}
          <ReviewResults />
        </main>
      </div>
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}

export default App;
