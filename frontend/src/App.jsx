import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import OverviewPage from './pages/OverviewPage';
import DatasetExplorerPage from './pages/DatasetExplorerPage';
import MarkovAnalysisPage from './pages/MarkovAnalysisPage';
import ActivityPredictionPage from './pages/ActivityPredictionPage';
import ModelEvaluationPage from './pages/ModelEvaluationPage';
import AboutMarkovPage from './pages/AboutMarkovPage';
import api from './services/api';
import { AlertCircle, WifiOff } from 'lucide-react';

export default function App() {
  const [activePage, setActivePage] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);
  const [healthChecking, setHealthChecking] = useState(true);

  // Poll backend health status
  const checkBackendHealth = async () => {
    try {
      const res = await api.checkHealth();
      setBackendOnline(res?.status === 'online');
    } catch (err) {
      setBackendOnline(false);
    } finally {
      setHealthChecking(false);
    }
  };

  useEffect(() => {
    checkBackendHealth();
    // Periodically verify connection every 15s
    const interval = setInterval(checkBackendHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const renderActivePage = () => {
    switch (activePage) {
      case 'overview':
        return <OverviewPage onNavigateTo={setActivePage} />;
      case 'dataset':
        return <DatasetExplorerPage />;
      case 'markov':
        return <MarkovAnalysisPage />;
      case 'predict':
        return <ActivityPredictionPage />;
      case 'evaluation':
        return <ModelEvaluationPage />;
      case 'about':
        return <AboutMarkovPage />;
      default:
        return <OverviewPage onNavigateTo={setActivePage} />;
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col antialiased selection:bg-cyan-500 selection:text-navy-950">
      {/* Top Navigation Bar */}
      <Navbar
        backendOnline={backendOnline}
        activePage={activePage}
        onRefresh={checkBackendHealth}
        toggleSidebar={() => setMobileMenuOpen(!mobileMenuOpen)}
        sidebarCollapsed={sidebarCollapsed}
      />

      {/* Backend Offline Warning Banner */}
      {!backendOnline && !healthChecking && (
        <div className="bg-rose-500/10 border-b border-rose-500/30 px-4 py-2.5 text-xs text-rose-300 flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4 text-rose-400 shrink-0" />
          <span>
            <strong>Backend Disconnected:</strong> Cannot connect to Flask server at <code className="font-mono text-white">http://127.0.0.1:5000</code>.
            Please ensure backend is started with <code className="font-mono text-cyan-300">python app.py</code> in the <code className="font-mono text-cyan-300">backend/</code> directory.
          </span>
          <button
            onClick={checkBackendHealth}
            className="ml-2 px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-semibold text-[11px]"
          >
            Retry Now
          </button>
        </div>
      )}

      {/* Body with Sidebar and Main Content Area */}
      <div className="flex flex-1 relative overflow-hidden">
        <Sidebar
          activePage={activePage}
          setActivePage={setActivePage}
          collapsed={sidebarCollapsed}
          setCollapsed={setSidebarCollapsed}
          mobileOpen={mobileMenuOpen}
          setMobileOpen={setMobileMenuOpen}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gradient-to-b from-navy-950 via-navy-900 to-navy-950">
          <div className="max-w-7xl mx-auto">
            {renderActivePage()}
          </div>
        </main>
      </div>
    </div>
  );
}
