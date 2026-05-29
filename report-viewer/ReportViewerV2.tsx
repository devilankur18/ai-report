import React, { useState, useEffect } from 'react';
import { ReportSchema } from './types/reportSchema';
import { ExecutiveCover } from './components/ExecutiveCover';
import { PerChannelOverview } from './components/PerChannelOverview';
import { EeatAdvantage } from './components/EeatAdvantage';
import { AiVisibilityGaps } from './components/AiVisibilityGaps';
import { CrossChannelRankMatrix } from './components/CrossChannelRankMatrix';
import { PatientSentimentAnalytics } from './components/PatientSentimentAnalytics';
import { DigitalFoundationGaps } from './components/DigitalFoundationGaps';
import { ActionRoadmap } from './components/ActionRoadmap';
import './reportV2.css';

const DEFAULT_RUNS = [
  { value: 'v7/dr-saket-saxena-26-05-29-15-15/report.json', label: 'Dr. Saket Saxena — Jhansi (V7.0 Live)' },
  { value: 'v7/dr_vishal_maurya/report.json', label: 'Dr. Vishal Maurya — Naini (V7.0 Live)' },
  { value: 'v7/dr_vishal_maurya_report.json', label: 'Dr. Vishal Maurya — Naini (V7.0 Legacy)' },
  { value: 'v6/dr_vishal_maurya_report.json', label: 'Dr. Vishal Maurya — Naini (V6.0)' },
  { value: 'live_audit_run.json', label: 'Live Audit Run' }
];

export const ReportViewerV2: React.FC = () => {
  const [runsList, setRunsList] = useState<{ value: string; label: string }[]>([]);
  const [reportData, setReportData] = useState<ReportSchema | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<string>('');
  const [lightboxImage, setLightboxImage] = useState<{ path: string; caption: string } | null>(null);

  // Helper to get correct asset path based on current loaded report version
  const getAssetPath = (pathStr: string) => {
    if (!pathStr) return '';
    if (pathStr.startsWith('/reports/') || pathStr.startsWith('reports/')) {
      return pathStr.startsWith('/') ? pathStr : `/${pathStr}`;
    }
    const baseFolder = selectedRun.includes('/') ? selectedRun.substring(0, selectedRun.lastIndexOf('/')) : selectedRun;
    return `/reports/${baseFolder}/${pathStr}`.replace('//reports/', '/reports/');
  };

  const handleImageClick = (path: string, caption: string) => {
    setLightboxImage({ path, caption });
  };

  // Fetch active runs on mount
  useEffect(() => {
    const fetchRuns = async () => {
      try {
        const response = await fetch('/api/runs');
        if (response.ok) {
          const data = await response.json();
          setRunsList(data);
        } else {
          setRunsList(DEFAULT_RUNS);
        }
      } catch (err) {
        console.error("Failed fetching runs list", err);
        setRunsList(DEFAULT_RUNS);
      }
    };
    fetchRuns();
  }, []);

  // Fetch report data when selected run changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fileParam = params.get('file');

    let targetFile = selectedRun;
    if (fileParam && !selectedRun) {
      targetFile = fileParam;
      setSelectedRun(fileParam);
    }

    if (!targetFile) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const tryFetch = async () => {
      try {
        let response;
        if (targetFile.includes('/')) {
          response = await fetch(`/reports/${targetFile}`);
        } else {
          response = await fetch(`/reports/v7/${targetFile}`);
          if (!response.ok) {
            response = await fetch(`/reports/v6/${targetFile}`);
          }
        }
        if (!response.ok) {
          throw new Error(`Failed to load report: ${response.statusText}`);
        }
        const data = await response.json();
        setReportData(data);
        setLoading(false);
      } catch (err: any) {
        console.error(err);
        setError(`Failed to fetch report JSON. Error: ${err.message}`);
        setLoading(false);
      }
    };

    tryFetch();
  }, [selectedRun]);

  // Handle run change
  const handleRunChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextRun = e.target.value;
    setSelectedRun(nextRun);
    const url = new URL(window.location.href);
    if (nextRun) {
      url.searchParams.set('file', nextRun);
    } else {
      url.searchParams.delete('file');
    }
    window.history.pushState({}, '', url.toString());
  };

  // Handle local file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string) as ReportSchema;
        if (!parsed.report_metadata || typeof parsed.overall_score === 'undefined') {
          throw new Error("Invalid schema. Missing report_metadata or overall_score.");
        }
        setReportData(parsed);
        setLoading(false);
      } catch (err: any) {
        setError(`Failed to parse custom JSON: ${err.message}`);
        setLoading(false);
      }
    };
    reader.onerror = () => {
      setError("Failed to read local file.");
      setLoading(false);
    };
    reader.readAsText(file);
  };

  // Print PDF with custom filename
  const handlePrintPDF = () => {
    if (!reportData) return;
    const originalTitle = document.title;
    const docNameClean = reportData.report_metadata.prepared_for
      ? reportData.report_metadata.prepared_for.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      : 'doctor';
    const now = new Date();
    const pad = (num: number) => num.toString().padStart(2, '0');
    const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(now.getHours())}-${pad(now.getMinutes())}`;
    const customTitle = `${docNameClean}-${timestamp}-ai-health-report-v2`;
    document.title = customTitle;
    window.print();
    setTimeout(() => { document.title = originalTitle; }, 500);
  };

  // Loading state
  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#040712', color: '#fff', gap: '1.5rem' }}>
        <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '3rem', color: 'var(--v2-accent)' }}></i>
        <h2 style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 600 }}>Analyzing DigiClinic Audit Data...</h2>
      </div>
    );
  }

  // Welcome state
  if (!selectedRun && !loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#040712', color: '#fff', padding: '2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '15%', left: '20%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)', filter: 'blur(50px)', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', bottom: '15%', right: '20%', width: '450px', height: '450px', background: 'radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }}></div>

        <div style={{ maxWidth: '640px', padding: '3rem 2.5rem', borderRadius: '24px', background: 'rgba(10, 15, 30, 0.7)', border: '1px solid rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(20px)', boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #6366f1, #06b6d4)', width: '70px', height: '70px', borderRadius: '18px', display: 'flex', justifyContent: 'center', alignItems: 'center', boxShadow: '0 10px 25px rgba(99, 102, 241, 0.4)' }}>
            <i className="fas fa-laptop-medical" style={{ fontSize: '2rem', color: '#fff' }}></i>
          </div>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '2rem', fontWeight: 800, background: 'linear-gradient(135deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0 }}>DigiClinic AI Audit V2</h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem', lineHeight: '1.6', maxWidth: '480px' }}>Select an audit run or upload a local JSON to begin.</p>

          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <select className="rv2-select" style={{ width: '100%', padding: '1rem' }} value={selectedRun} onChange={handleRunChange}>
              <option value="">-- Choose an active audit run --</option>
              {runsList.map(run => (
                <option key={run.value} value={run.value}>{run.label}</option>
              ))}
            </select>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }}></div>
              <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase' }}>or</span>
              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }}></div>
            </div>

            <label className="rv2-btn rv2-btn-primary" style={{ justifyContent: 'center', padding: '1rem', cursor: 'pointer' }}>
              <i className="fas fa-upload"></i> Upload local audit JSON
              <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileUpload} />
            </label>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !reportData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#040712', color: '#fff', padding: '2rem', textAlign: 'center' }}>
        <i className="fas fa-triangle-exclamation" style={{ fontSize: '4rem', color: 'var(--v2-danger)', marginBottom: '1.5rem' }}></i>
        <h2 style={{ fontFamily: 'Outfit, sans-serif', maxWidth: '800px' }}>{error || "No report loaded."}</h2>
        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <select className="rv2-select" value={selectedRun} onChange={handleRunChange}>
            <option value="">-- Choose an active audit run --</option>
            {runsList.map(run => (
              <option key={run.value} value={run.value}>{run.label}</option>
            ))}
          </select>
          <label className="rv2-btn rv2-btn-primary" style={{ cursor: 'pointer' }}>
            <i className="fas fa-upload"></i> Upload JSON
            <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileUpload} />
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="rv2-body">
      {/* Sticky Controls Bar */}
      <div className="rv2-controls">
        <div className="rv2-controls-brand">
          <i className="fas fa-laptop-medical"></i>
          <span>DigiClinic V2 Audit</span>
        </div>
        <div className="rv2-controls-actions">
          <select className="rv2-select" value={selectedRun} onChange={handleRunChange}>
            <option value="">-- Choose run --</option>
            {runsList.map(run => (
              <option key={run.value} value={run.value}>{run.label}</option>
            ))}
          </select>
          <label className="rv2-btn" style={{ cursor: 'pointer' }}>
            <i className="fas fa-upload"></i> Upload JSON
            <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileUpload} />
          </label>
          <button className="rv2-btn" onClick={handlePrintPDF}>
            <i className="fas fa-file-pdf"></i> PDF
          </button>
          <button 
            className="rv2-btn" 
            style={{ 
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.15) 100%)', 
              borderColor: 'rgba(59, 130, 246, 0.4)', 
              color: '#3b82f6',
              fontWeight: 700,
              boxShadow: '0 0 12px rgba(59, 130, 246, 0.1)'
            }}
            onClick={() => {
              const currentParams = window.location.search;
              window.history.pushState(null, '', `/v1${currentParams}`);
              window.dispatchEvent(new Event('popstate'));
            }}
          >
            <i className="fas fa-table-list"></i> Switch to V1 (Tabs)
          </button>
        </div>
      </div>

      {/* Continuous Report Content */}
      <div className="rv2-container">
        <ExecutiveCover data={reportData} />
        <PerChannelOverview data={reportData} />
        <AiVisibilityGaps data={reportData} getAssetPath={getAssetPath} onImageClick={handleImageClick} />
        <EeatAdvantage data={reportData} getAssetPath={getAssetPath} onImageClick={handleImageClick} />
        <CrossChannelRankMatrix data={reportData} />
        <PatientSentimentAnalytics data={reportData} />
        <DigitalFoundationGaps data={reportData} getAssetPath={getAssetPath} onImageClick={handleImageClick} />
        <ActionRoadmap data={reportData} />

        {/* Footer */}
        <div className="rv2-footer">
          <span>&copy; {new Date().getFullYear()} DigiClinic Solutions. All Rights Reserved.</span>
        </div>
      </div>

      {/* Lightbox Overlay */}
      {lightboxImage && (
        <div className="rv2-lightbox" onClick={() => setLightboxImage(null)}>
          <button className="rv2-lightbox-close" onClick={() => setLightboxImage(null)}>&times;</button>
          <img src={lightboxImage.path} alt={lightboxImage.caption} onClick={(e) => e.stopPropagation()} />
          <div className="rv2-lightbox-caption">{lightboxImage.caption}</div>
        </div>
      )}
    </div>
  );
};
