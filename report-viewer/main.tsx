import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { ReportViewer } from './ReportViewer';
import { ReportViewerV2 } from './ReportViewerV2';

const Router: React.FC = () => {
  const [route, setRoute] = useState<'v1' | 'v2'>('v2');

  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      const search = window.location.search;

      if (path.startsWith('/v1') || hash === '#v1' || search.includes('v=1')) {
        setRoute('v1');
      } else if (path.startsWith('/v2') || hash === '#v2' || search.includes('v=2')) {
        setRoute('v2');
      } else {
        // Default fallback to V2 (premium version)
        setRoute('v2');
      }
    };

    // Initial routing logic check
    handleLocationChange();

    // Listen to native browser popstate navigation
    window.addEventListener('popstate', handleLocationChange);
    // Listen to hashchange fallsbacks
    window.addEventListener('hashchange', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigateTo = (version: 'v1' | 'v2') => {
    const currentParams = window.location.search;
    const newPath = version === 'v1' ? '/v1' : '/v2';
    
    // Smoothly push history state while preserving ?file= parameter
    window.history.pushState(null, '', `${newPath}${currentParams}`);
    setRoute(version);
  };

  return (
    <>
      {route === 'v1' ? <ReportViewer /> : <ReportViewerV2 />}
      
      {/* Premium Floating Version Switcher */}
      <div 
        className="version-switcher"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '9999px',
          padding: '6px',
          display: 'flex',
          gap: '6px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 0 20px rgba(34, 211, 238, 0.25)',
          fontFamily: "'Outfit', 'Inter', sans-serif",
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <button
          onClick={() => navigateTo('v1')}
          style={{
            background: route === 'v1' 
              ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.85) 0%, rgba(37, 99, 235, 0.85) 100%)' 
              : 'transparent',
            border: 'none',
            color: route === 'v1' ? '#ffffff' : '#94a3b8',
            padding: '8px 16px',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            boxShadow: route === 'v1' ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
          }}
        >
          <i className="fas fa-table-list" style={{ fontSize: '0.9rem' }}></i>
          <span>V1 (Tabs)</span>
        </button>
        
        <button
          onClick={() => navigateTo('v2')}
          style={{
            background: route === 'v2' 
              ? 'linear-gradient(135deg, rgba(34, 211, 238, 0.85) 0%, rgba(13, 148, 136, 0.85) 100%)' 
              : 'transparent',
            border: 'none',
            color: route === 'v2' ? '#ffffff' : '#94a3b8',
            padding: '8px 16px',
            borderRadius: '9999px',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'all 0.2s ease',
            boxShadow: route === 'v2' ? '0 4px 12px rgba(34, 211, 238, 0.3)' : 'none',
          }}
        >
          <i className="fas fa-scroll" style={{ fontSize: '0.9rem' }}></i>
          <span>V2 (Narrative)</span>
        </button>
      </div>
    </>
  );
};

ReactDOM.createRoot(document.getElementById('report-root')!).render(
  <React.StrictMode>
    <Router />
  </React.StrictMode>
);
