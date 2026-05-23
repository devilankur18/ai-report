import React, { useState, useEffect } from 'react';
import { ReportSchema } from './types/reportSchema';
import './report.css';

const DEFAULT_RUNS = [
  { value: 'v7/dr_vishal_maurya_report.json', label: 'Dr. Vishal Maurya — Naini (V7.0 Live)' },
  { value: 'v6/dr_vishal_maurya_report.json', label: 'Dr. Vishal Maurya — Naini (V6.0)' },
  { value: 'live_audit_run.json', label: 'Live Audit Run' }
];

const CHANNEL_META: Record<string, { icon: string; color: string; bg: string; border: string }> = {
  google_seo: {
    icon: 'fab fa-google',
    color: '#3b82f6', // Google Blue
    bg: 'rgba(59, 130, 246, 0.1)',
    border: 'rgba(59, 130, 246, 0.2)'
  },
  bing_seo: {
    icon: 'fab fa-microsoft',
    color: '#06b6d4', // Bing Cyan
    bg: 'rgba(6, 182, 212, 0.1)',
    border: 'rgba(6, 182, 212, 0.2)'
  },
  aggregators: {
    icon: 'fas fa-hospital-user',
    color: '#ec4899', // Pink
    bg: 'rgba(236, 72, 153, 0.1)',
    border: 'rgba(236, 72, 153, 0.2)'
  },
  conversational_ai: {
    icon: 'fas fa-robot',
    color: '#a855f7', // Purple
    bg: 'rgba(168, 85, 247, 0.1)',
    border: 'rgba(168, 85, 247, 0.2)'
  },
  eeat_credentials: {
    icon: 'fas fa-award',
    color: '#f59e0b', // Amber/Gold
    bg: 'rgba(245, 158, 11, 0.1)',
    border: 'rgba(245, 158, 11, 0.2)'
  },
  website_schema: {
    icon: 'fas fa-globe',
    color: '#10b981', // Emerald
    bg: 'rgba(16, 185, 129, 0.1)',
    border: 'rgba(16, 185, 129, 0.2)'
  }
};

const TABS = [
  { id: 'executive', label: 'Executive Standing', icon: 'fas fa-chart-pie' },
  { id: 'search_seo', label: 'SEO & Search Pack', icon: 'fas fa-magnifying-glass-chart' },
  { id: 'directories_ai', label: 'AI & Directories', icon: 'fas fa-robot' },
  { id: 'checklists', label: 'Technical & E-E-A-T', icon: 'fas fa-clipboard-check' },
  { id: 'treatment_roadmap', label: 'Action Roadmap', icon: 'fas fa-prescription-bottle-medical' }
];

export const ReportViewer: React.FC = () => {
  const [reportData, setReportData] = useState<ReportSchema | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<string>('v7/dr_vishal_maurya_report.json');
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<string>('executive');
  const [lightboxImage, setLightboxImage] = useState<{ path: string; caption: string } | null>(null);

  // Helper to get correct asset path based on current loaded report version
  const getAssetPath = (pathStr: string) => {
    if (!pathStr) return '';
    // If it already has reports/vX, return it
    if (pathStr.startsWith('/reports/') || pathStr.startsWith('reports/')) {
      return pathStr.startsWith('/') ? pathStr : `/${pathStr}`;
    }
    // Determine directory version based on reportData metadata or selectedRun value
    const isV7 = reportData?.report_metadata?.version === '7.0' || selectedRun.startsWith('v7/');
    const versionDir = isV7 ? 'v7' : 'v6';
    return `/reports/${versionDir}/${pathStr}`;
  };

  // Helper to render colocated visual evidence inline with its channel block
  const renderInlineEvidence = (channelId: string) => {
    if (!reportData) return null;
    const channel = reportData.channels.find(c => c.id === channelId);
    if (!channel || !channel.evidence_screenshot) return null;

    if (channelId === 'conversational_ai') {
      // In V7, platform-level screenshots exist, so don't duplicate the channel-level screenshot
      const hasPlatformEvidence = channel.platforms?.some(p => p.evidence_screenshot);
      if (hasPlatformEvidence) return null;
    }
    
    // Find matching proof description from visual_proof_index
    const proof = reportData.visual_proof_index?.find(
      p => p.path === channel.evidence_screenshot || channel.evidence_screenshot?.endsWith(p.path)
    );
    
    const label = proof?.label || `${channel.name} Audit Proof`;
    const description = proof?.description || `${channel.name} verification details.`;
    const path = getAssetPath(channel.evidence_screenshot);
    
    return (
      <div className="inline-evidence-container" onClick={() => setLightboxImage({ path, caption: description })}>
        <div className="inline-evidence-header">
          <div className="inline-evidence-title">
            <i className="fas fa-camera"></i>
            <span>{label}</span>
          </div>
          <span className="inline-evidence-hint">
            <i className="fas fa-magnifying-glass-plus"></i> View Full Resolution
          </span>
        </div>
        <div className="inline-evidence-preview">
          <img 
            src={path} 
            alt={label} 
          />
          <div className="inline-evidence-overlay">
            <i className="fas fa-expand"></i>
          </div>
        </div>
        <div className="inline-evidence-footer">
          <p>{description}</p>
        </div>
      </div>
    );
  };

  // Scroll Spy to highlight active section in navigation
  useEffect(() => {
    if (loading || !reportData) return;

    // Small delay to ensure DOM has fully rendered
    const timer = setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveSection(entry.target.id);
            }
          });
        },
        { 
          threshold: 0.1, 
          rootMargin: '-80px 0px -60% 0px' 
        }
      );

      TABS.forEach((tab) => {
        const el = document.getElementById(tab.id);
        if (el) observer.observe(el);
      });

      return () => {
        TABS.forEach((tab) => {
          const el = document.getElementById(tab.id);
          if (el) observer.unobserve(el);
        });
      };
    }, 100);

    return () => clearTimeout(timer);
  }, [loading, reportData]);

  // Helper for status classes
  const getTierClass = (tier: string) => {
    switch (tier?.toUpperCase()) {
      case 'EXCELLENT': return 'excellent';
      case 'GOOD': return 'good';
      case 'MODERATE': return 'moderate';
      case 'WEAK':
      default: return 'weak';
    }
  };

  // Fetch report data when selected run changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fileParam = params.get('file');
    
    let targetFile = selectedRun;
    if (fileParam) {
      targetFile = fileParam;
      // Sync dropdown with URL file query
      const matched = DEFAULT_RUNS.find(r => r.value === fileParam || r.value.includes(fileParam));
      if (matched) {
        setSelectedRun(matched.value);
      }
    }

    setLoading(true);
    setError(null);

    // Fetch the JSON file with fallbacks for version paths
    const tryFetch = async () => {
      try {
        let response;
        if (targetFile.includes('/')) {
          response = await fetch(`/reports/${targetFile}`);
        } else {
          // Try v7 first, then v6
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
    
    // Update URL query parameter
    const url = new URL(window.location.href);
    url.searchParams.set('file', nextRun);
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

  // Download Markdown exporter
  const handleDownloadMarkdown = () => {
    if (!reportData) return;
    const meta = reportData.report_metadata;
    const reg = meta.state_council_registration;
    
    let md = `# DigiClinic AI Rank & SEO Audit Report — V6.0\n\n`;
    md += `## 📋 1. Header Metadata Section\n`;
    md += `*   **Prepared for:** ${meta.prepared_for}\n`;
    md += `*   **Practice Specialty:** ${meta.practice_specialty}\n`;
    md += `*   **Location:** ${meta.location?.area ? meta.location.area + ', ' : ''}${meta.location?.city || ''}\n`;
    md += `*   **Clinic Name:** ${meta.clinic_name}\n`;
    md += `*   **Discovered Clinic Address:** ${meta.discovered_clinic_address}\n`;
    md += `*   **Primary Discovered Phone:** ${meta.primary_discovered_phone}\n`;
    md += `*   **State Council Registration:** Council Name: ${reg?.council_name || 'N/A'}, Registration Number: ${reg?.registration_number || 'N/A'}, Date: ${reg?.registration_date || 'N/A'}\n`;
    md += `*   **Last Verified Activity Date:** ${meta.last_verified_activity_date}\n\n`;
    md += `---\n\n`;
    
    md += `## 🔴 2. Consolidated Rank & Summary Card\n`;
    md += `> ### 🔴 DIAGNOSTIC STANDING & RANK CARD\n`;
    md += `> *   **Overall Score:** ${reportData.overall_score} / 100\n`;
    md += `> *   **Discoverability Tier:** ${reportData.discoverability_tier}\n`;
    md += `> *   **Diagnostic Summary:** ${reportData.diagnostic_summary}\n\n`;
    
    if (reportData.competitor_callout) {
      md += `> [!WARNING]\n`;
      md += `> **Competitor Threat Callout:** ${reportData.competitor_callout.primary_competitor} dominates local visibility with an estimated ${reportData.competitor_callout.estimated_market_capture} market capture. Reason: ${reportData.competitor_callout.reason}\n\n`;
    }
    md += `---\n\n`;
    
    md += `## 📊 3. Cross-Channel Search Query Matrix\n\n`;
    const searchChannels = reportData.channels.filter(c => c.queries && c.queries.length > 0);
    
    if (searchChannels.length > 0) {
      md += `| Search Query | `;
      searchChannels.forEach(ch => {
        md += `${ch.name} (Rank) | `;
      });
      md += `Top Competitors |\n`;
      
      md += `| :--- | `;
      searchChannels.forEach(() => {
        md += `:--- | `;
      });
      md += `:--- |\n`;
      
      const firstCh = searchChannels[0];
      firstCh.queries?.forEach((q, idx) => {
        md += `| **${q.query}** | `;
        searchChannels.forEach(ch => {
          const rankVal = ch.queries?.[idx]?.rank;
          const isUnranked = rankVal === 'Unranked' || rankVal === null || rankVal === undefined;
          md += `${isUnranked ? 'Unranked' : '#' + rankVal} | `;
        });
        
        const comps = q.top_competitors?.map(c => `#${c.rank} ${c.name}`).join(', ') || 'None';
        md += `${comps} |\n`;
      });
    }
    md += `\n---\n\n`;
    
    md += `## 🤖 4. Conversational AI Standings\n\n`;
    const aiChannel = reportData.channels.find(c => c.id === 'conversational_ai');
    if (aiChannel && aiChannel.platforms) {
      md += `| AI Platform | Recommendation Standing | Verbatim Citation |\n`;
      md += `| :--- | :--- | :--- |\n`;
      aiChannel.platforms.forEach(plat => {
        md += `| **${plat.name}** | **${plat.standing}** | "${plat.citation}" |\n`;
      });
    }
    md += `\n---\n\n`;
    
    md += `## 🔬 5. Technical Verification & Credentials\n\n`;
    
    md += `### 🏥 A. Clinic Directories & Aggregators\n`;
    const aggChannel = reportData.channels.find(c => c.id === 'aggregators');
    aggChannel?.metrics?.forEach((metric, i) => {
      md += `${i + 1}.  **${metric.label}:** ${metric.value}\n`;
    });
    md += `\n`;
    
    md += `### 👨‍⚕️ B. E-E-A-T & State Dental Council Registration\n`;
    const eeatChannel = reportData.channels.find(c => c.id === 'eeat_credentials');
    eeatChannel?.checks?.forEach((check, i) => {
      md += `${i + 1}.  **${check.label}:** **${check.status}** (${check.value})\n`;
    });
    md += `\n`;
    
    md += `### 🌐 C. Website & Structured Schema Compliance\n`;
    const schemaChannel = reportData.channels.find(c => c.id === 'website_schema');
    schemaChannel?.checks?.forEach((check, i) => {
      md += `${i + 1}.  **${check.label}:** **${check.status}** (${check.value})\n`;
    });
    md += `\n---\n\n`;
    
    md += `## 🛠️ 6. Growth Treatment Roadmap\n\n`;
    reportData.treatment_plan.forEach((item, i) => {
      md += `${i + 1}.  **${item.pillar}:**\n`;
      md += `    ${item.description}\n`;
    });
    
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${meta.prepared_for.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_ai_report_v6.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#040712', color: '#fff', gap: '1.5rem' }}>
        <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '3.5rem', color: 'var(--accent-color)' }}></i>
        <h2 style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '0.02em', fontWeight: 600 }}>Analyzing DigiClinic Audit Data...</h2>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#040712', color: '#fff', padding: '2rem', textAlign: 'center' }}>
        <i className="fas fa-triangle-exclamation" style={{ fontSize: '4.5rem', color: 'var(--danger)', marginBottom: '1.5rem' }}></i>
        <h2 style={{ maxWidth: '800px', fontFamily: 'Outfit, sans-serif' }}>{error || "No report loaded."}</h2>
        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <select className="selector-dropdown" value={selectedRun} onChange={handleRunChange}>
            {DEFAULT_RUNS.map(run => (
              <option key={run.value} value={run.value}>{run.label}</option>
            ))}
          </select>
          <label className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
            <i className="fas fa-upload"></i> Upload Custom JSON
            <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileUpload} />
          </label>
        </div>
      </div>
    );
  }

  const meta = reportData.report_metadata;
  const reg = meta.state_council_registration;
  const searchChannels = reportData.channels.filter(c => c.queries && c.queries.length > 0);
  const aiChannel = reportData.channels.find(c => c.id === 'conversational_ai');
  const eeatChannel = reportData.channels.find(c => c.id === 'eeat_credentials');
  const schemaChannel = reportData.channels.find(c => c.id === 'website_schema');
  const aggChannel = reportData.channels.find(c => c.id === 'aggregators');

  // Simulated mobile preview shell styles
  const containerStyle = isMobile ? {
    maxWidth: '430px',
    margin: '2rem auto',
    border: '12px solid #1e293b',
    borderRadius: '40px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
    padding: '1.5rem 0.75rem',
    background: '#040712',
    maxHeight: '88vh',
    overflowY: 'auto' as const,
    position: 'relative' as const,
  } : {};

  return (
    <div style={{ background: '#040712', minHeight: '100vh', width: '100%' }} className="report-viewer-body">
      {/* Sticky top controls bar */}
      <div className="controls-bar-wrapper">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <i className="fas fa-laptop-medical" style={{ color: 'var(--accent-color)', fontSize: '1.6rem' }}></i>
          <span style={{ fontWeight: 800, fontSize: '1.3rem', color: '#fff', letterSpacing: '-0.02em' }}>DigiClinic V6 Audit</span>
        </div>
        
        <div className="controls-bar">
          <select className="selector-dropdown" value={selectedRun} onChange={handleRunChange}>
            {DEFAULT_RUNS.map(run => (
              <option key={run.value} value={run.value}>{run.label}</option>
            ))}
          </select>

          <label className="btn" style={{ cursor: 'pointer' }}>
            <i className="fas fa-upload"></i> Upload JSON
            <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileUpload} />
          </label>

          <button className={`btn ${isMobile ? 'btn-primary' : ''}`} onClick={() => setIsMobile(!isMobile)}>
            <i className="fas fa-mobile-screen-button"></i> {isMobile ? 'Desktop View' : 'Mobile View'}
          </button>

          <button className="btn" onClick={() => window.print()}>
            <i className="fas fa-file-pdf"></i> PDF
          </button>

          <button className="btn" onClick={handleDownloadMarkdown}>
            <i className="fas fa-file-code"></i> Export MD
          </button>
        </div>
      </div>

      {/* Simulated Device Frame or normal container */}
      <div style={containerStyle}>
        {isMobile && (
          <div style={{
            width: '140px',
            height: '25px',
            background: '#1e293b',
            borderRadius: '0 0 20px 20px',
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <div style={{ width: '40px', height: '4px', background: '#0f172a', borderRadius: '2px' }}></div>
          </div>
        )}
        
        <div className="report-container">
          
          {/* Header Section */}
          <div className="report-header">
            <div className="header-title-section">
              <h1>{meta.report_name || 'AI Health Check Report'}</h1>
              <p className="header-subtitle">
                Digital Presence Scan & SEO Audit &bull; Version {meta.version || '6.0'}
              </p>
            </div>
            <div className="header-meta-dates">
              <span><strong>Audit Run:</strong> {meta.audit_date}</span>
              <span><strong>Verified:</strong> {meta.last_verified_activity_date}</span>
            </div>
          </div>

          {/* Doctor Info Panel */}
          <div className="glass-card doctor-info-card">
            <div className="doctor-info-grid">
              <div className="info-box">
                <span className="info-lbl">Doctor Standing</span>
                <strong className="info-val">{meta.prepared_for}</strong>
                <span className="specialty-badge">
                  <i className="fas fa-user-md"></i> {meta.practice_specialty}
                </span>
              </div>
              <div className="info-box">
                <span className="info-lbl">Clinic & Location</span>
                <strong className="info-val">{meta.clinic_name}</strong>
                <span className="location-text">
                  <i className="fas fa-map-marker-alt"></i> {meta.location?.area ? `${meta.location.area}, ` : ''}{meta.location?.city || ''}
                </span>
              </div>
              <div className="info-box">
                <span className="info-lbl">Contact Signal</span>
                <strong className="info-val phone-val">{meta.primary_discovered_phone}</strong>
                <span className="address-text" title={meta.discovered_clinic_address}>
                  <strong>Address:</strong> {meta.discovered_clinic_address}
                </span>
              </div>
              <div className="info-box">
                <span className="info-lbl">Registry Verification</span>
                <strong className="info-val">Reg #{reg?.registration_number || 'N/A'}</strong>
                <span className="council-text">
                  {reg?.council_name || 'N/A'} ({reg?.registration_date || 'N/A'})
                </span>
              </div>
            </div>
          </div>

          {/* Dashboard Quick Navigation Panel */}
          <div className="tabs-container">
            {TABS.map(tab => (
              <button 
                key={tab.id}
                className={`tab-btn ${activeSection === tab.id ? 'active' : ''}`}
                onClick={() => {
                  const el = document.getElementById(tab.id);
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
              >
                <i className={tab.icon}></i>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Continuous Long-Form Report Content Area */}
          <div className="report-sections-content">
            
            {/* EXECUTIVE SECTION */}
            <section id="executive" className="report-section fade-in">
                <div className="glass-card">
                  <div className="consolidated-grid">
                    <div className="score-circle-wrapper">
                      <svg viewBox="0 0 36 36" className="circular-chart">
                        <path className="circle-bg"
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path className={`circle circle-${getTierClass(reportData.discoverability_tier)}`}
                          strokeDasharray={`${reportData.overall_score}, 100`}
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <text x="18" y="20.35" className="percentage">{reportData.overall_score}%</text>
                        <text x="18" y="25.5" className="label-tier">{reportData.discoverability_tier}</text>
                      </svg>
                    </div>

                    <div className="diagnostic-text">
                      <h2>
                        <span>Diagnostic Standing:</span>
                        <span className={`tier-badge tier-${reportData.discoverability_tier}`}>
                          {reportData.discoverability_tier}
                        </span>
                      </h2>
                      <p className="summary-para">
                        {reportData.diagnostic_summary}
                      </p>
                    </div>
                  </div>

                  {/* Historical Progress Sparkline */}
                  {reportData.historical_runs && reportData.historical_runs.length > 0 && (
                    <div className="history-timeline">
                      <div className="history-timeline-header">
                        <i className="fas fa-chart-line"></i>
                        <span>Historical Progress Timeline</span>
                      </div>
                      <div className="history-nodes-container">
                        {reportData.historical_runs.map((run, i) => (
                          <div key={i} className="history-node">
                            <div className="history-score">{run.overall_score}%</div>
                            <div className="history-dot" style={{ opacity: run.overall_score > 50 ? 1 : 0.65 }}></div>
                            <div className="history-date">{run.date}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Dynamic Competitor Callout Card */}
                {reportData.competitor_callout && (
                  <div className="glass-card competitor-callout-card">
                    <div className="competitor-card-glow"></div>
                    <div className="competitor-header">
                      <div className="competitor-warning-tag">
                        <i className="fas fa-triangle-exclamation"></i> CRITICAL COMPETITOR THREAT
                      </div>
                      <h3>{reportData.competitor_callout.primary_competitor}</h3>
                      <div className="market-capture-badge">
                        Est. Local Market Share: <span>{reportData.competitor_callout.estimated_market_capture}</span>
                      </div>
                    </div>
                    <div className="competitor-body">
                      <p>{reportData.competitor_callout.reason}</p>
                    </div>
                  </div>
                )}

                {/* Per-Channel Scores Overview */}
                <h2 className="section-title">
                  <i className="fas fa-cubes"></i>
                  <span>Per-Channel Audit Performance</span>
                </h2>
                <div className="channel-grid">
                  {reportData.channels.map((channel) => {
                    const meta = CHANNEL_META[channel.id];
                    return (
                      <div className="channel-card" key={channel.id} style={{ borderLeft: `4px solid ${meta?.color || 'transparent'}` }}>
                        <div className="channel-card-header">
                          <div className="channel-title-icon">
                            <i className={`${meta?.icon || 'fas fa-shield'}`} style={{ color: meta?.color }}></i>
                            <span className="channel-name">{channel.name}</span>
                          </div>
                          <span className="channel-score" style={{ color: meta?.color }}>{channel.channel_percentage_score}%</span>
                        </div>
                        <div className="progress-bar-container">
                          <div 
                            className="progress-bar-fill"
                            style={{ 
                              width: `${channel.channel_percentage_score}%`,
                              backgroundColor: meta?.color || 'var(--accent-color)'
                            }}
                          ></div>
                        </div>
                        <div className="channel-card-footer">
                          <span className="channel-weight-tag">Weight: {channel.weight}%</span>
                          {channel.evidence_screenshot && (
                            <button 
                              className="btn-card-evidence"
                              onClick={() => setLightboxImage({ path: getAssetPath(channel.evidence_screenshot), caption: `${channel.name} Audit Evidence Screenshot` })}
                            >
                              <i className="fas fa-camera"></i> Audit Proof
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

                  {/* SEO & SEARCH PACK SECTION */}
                  <section id="search_seo" className="report-section fade-in">
                {searchChannels.length > 0 ? (
                  <>
                    <h2 className="section-title">
                      <i className="fas fa-magnifying-glass-chart"></i>
                      <span>Cross-Channel Search Rank Matrix</span>
                    </h2>
                    <div className="glass-card">
                      <div className="matrix-scroll-wrapper">
                        <table className="matrix-table">
                          <thead>
                            <tr>
                              <th>Search Query</th>
                              {searchChannels.map(ch => (
                                <th key={ch.id}>{ch.name}</th>
                              ))}
                              <th>Top Competitors</th>
                            </tr>
                          </thead>
                          <tbody>
                            {searchChannels[0].queries?.map((_, qIdx) => {
                              const currentQuery = searchChannels[0].queries?.[qIdx];
                              const qText = currentQuery?.query || '';
                              const topCompetitors = currentQuery?.top_competitors || [];
                              return (
                                <tr key={qIdx}>
                                  <td className="matrix-query-cell">{qText}</td>
                                  {searchChannels.map(ch => {
                                    const qData = ch.queries?.[qIdx];
                                    const isUnranked = qData?.rank === 'Unranked' || qData?.rank === null || qData?.rank === undefined;
                                    const color = CHANNEL_META[ch.id]?.color;
                                    return (
                                      <td key={ch.id}>
                                        <span 
                                          className={`rank-pill ${isUnranked ? 'rank-unranked' : 'rank-top'}`}
                                          style={!isUnranked ? { borderColor: color, color: color, background: `${color}15` } : {}}
                                        >
                                          {isUnranked ? 'Unranked' : `#${qData.rank}`}
                                        </span>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                                          {qData?.points || 0} pts
                                        </div>
                                      </td>
                                    );
                                  })}
                                  <td>
                                    <ul className="competitors-list">
                                      {topCompetitors.map((comp, compIdx) => (
                                        <li key={compIdx}>
                                          <strong>#{comp.rank}</strong> {comp.name}
                                        </li>
                                      ))}
                                      {topCompetitors.length === 0 && (
                                        <li style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>No competitors indexed</li>
                                      )}
                                    </ul>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <div className="scroll-indicator-text">
                        <i className="fas fa-left-right"></i> Horizontal scroll table on smaller screens
                      </div>
                    </div>

                    {/* Detailed Subcategories Metrics for Google and Bing */}
                    <h2 className="section-title">
                      <i className="fas fa-list-check"></i>
                      <span>Detailed Search Subcategories metrics</span>
                    </h2>
                    <div className="seo-channels-detailed">
                      {['google_seo', 'bing_seo'].map(id => {
                        const channel = reportData.channels.find(c => c.id === id);
                        if (!channel || !channel.sub_categories) return null;
                        const meta = CHANNEL_META[id];
                        return (
                          <div className="glass-card seo-detailed-card" key={id} style={{ borderLeft: `4px solid ${meta?.color}` }}>
                            <h3 className="seo-channel-title">
                              <i className={meta?.icon} style={{ color: meta?.color }}></i>
                              <span>{channel.name} Detailed Audits</span>
                            </h3>
                            <div className="subcategories-grid">
                              {Object.entries(channel.sub_categories).map(([subId, sub]) => (
                                <div className="subcategory-item-card" key={subId}>
                                  <div className="subcategory-header">
                                    <span className="subcategory-label">{sub.label}</span>
                                    <span className="subcategory-score" style={{ color: meta?.color }}>{sub.score} / {sub.max_points}</span>
                                  </div>
                                  <div className="subcategory-bar">
                                    <div 
                                      className="subcategory-bar-fill" 
                                      style={{ 
                                        width: `${(sub.score / sub.max_points) * 100}%`,
                                        backgroundColor: meta?.color || 'var(--accent-color)'
                                      }}
                                    ></div>
                                  </div>
                                  <p className="subcategory-details">{sub.details}</p>
                                </div>
                              ))}
                            </div>
                            {renderInlineEvidence(id)}
                          </div>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="no-data-card glass-card">
                    <p>No organic search engine matrix loaded in this report.</p>
                  </div>
                    )}
                  </section>

                  {/* AI & DIRECTORIES SECTION */}
                  <section id="directories_ai" className="report-section fade-in">
                
                {/* Sentiment Comparative Metrics Engine */}
                <div className="glass-card sentiment-engine-card">
                  <div className="card-header-iconified">
                    <i className="fas fa-comments-dollar"></i>
                    <h3>Patient Reviews & Sentiment Analytics Engine</h3>
                  </div>
                  <p className="section-intro-desc">
                    Side-by-side analysis of patient feedback volume, average scores, and organic rating velocity across all verified public directories.
                  </p>
                  <div className="sentiment-tiles-grid">
                    {reportData.channels
                      .filter(c => c.sentiment_data)
                      .map(channel => {
                        const sd = channel.sentiment_data!;
                        const meta = CHANNEL_META[channel.id];
                        return (
                          <div className="sentiment-tile" key={channel.id} style={{ borderTop: `3px solid ${meta?.color}` }}>
                            <div className="sentiment-tile-header">
                              <i className={meta?.icon} style={{ color: meta?.color }}></i>
                              <h4>{channel.name}</h4>
                            </div>
                            <div className="sentiment-metrics">
                              <div className="metric-box">
                                <span className="metric-val">{sd.total_reviews}</span>
                                <span className="metric-lbl">Total Reviews</span>
                              </div>
                              <div className="metric-box">
                                <span className="metric-val">{sd.average_rating} ★</span>
                                <span className="metric-lbl">Avg Rating</span>
                              </div>
                              <div className="metric-box">
                                <span className="metric-val">{sd.review_velocity_per_month} / mo</span>
                                <span className="metric-lbl">Review Velocity</span>
                              </div>
                              <div className="metric-box">
                                <span className="metric-val">{sd.narrative_success_stories}</span>
                                <span className="metric-lbl">Success Stories</span>
                              </div>
                            </div>
                            {sd.points_breakdown && (
                              <div className="sentiment-breakdown">
                                <span className="breakdown-title">Points Allocation:</span>
                                <div className="breakdown-pills">
                                  <span>Volume & Rating: <strong>{sd.points_breakdown.review_volume_and_rating}</strong> pts</span>
                                  <span>Velocity: <strong>{sd.points_breakdown.review_velocity}</strong> pts</span>
                                  <span>Success Stories: <strong>{sd.points_breakdown.success_stories}</strong> pts</span>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Conversational AI Platform Cards */}
                <h2 className="section-title">
                  <i className="fas fa-brain"></i>
                  <span>Conversational AI Discovery Status</span>
                </h2>
                
                {aiChannel && aiChannel.sub_categories && (
                  <div className="glass-card seo-detailed-card" style={{ borderLeft: `4px solid ${CHANNEL_META.conversational_ai?.color}` }}>
                    <h3 className="seo-channel-title">
                      <i className="fas fa-gears" style={{ color: CHANNEL_META.conversational_ai?.color }}></i>
                      <span>AI Model Standing Subcategories</span>
                    </h3>
                    <div className="subcategories-grid">
                      {Object.entries(aiChannel.sub_categories).map(([subId, sub]) => (
                        <div className="subcategory-item-card" key={subId}>
                          <div className="subcategory-header">
                            <span className="subcategory-label">{sub.label}</span>
                            <span className="subcategory-score" style={{ color: CHANNEL_META.conversational_ai?.color }}>{sub.score} / {sub.max_points}</span>
                          </div>
                          <div className="subcategory-bar">
                            <div 
                              className="subcategory-bar-fill" 
                              style={{ 
                                width: `${(sub.score / sub.max_points) * 100}%`,
                                backgroundColor: CHANNEL_META.conversational_ai?.color || 'var(--accent-color)'
                              }}
                            ></div>
                          </div>
                          <p className="subcategory-details">{sub.details}</p>
                        </div>
                      ))}
                    </div>
                    {renderInlineEvidence('conversational_ai')}
                  </div>
                )}

                {aiChannel && aiChannel.platforms && (
                  <div className="ai-standing-grid-v7">
                    {aiChannel.platforms.map((plat, idx) => {
                      const isRecommended = plat.standing?.toLowerCase().includes('recommended') && !plat.standing?.toLowerCase().includes('not');
                      const isMentioned = plat.standing?.toLowerCase().includes('mentioned');
                      
                      // Platform branding meta
                      let platMeta = {
                        icon: 'fas fa-robot',
                        color: '#a855f7',
                        bg: 'rgba(168, 85, 247, 0.1)',
                        textColor: '#fff'
                      };
                      
                      if (plat.name === 'ChatGPT') {
                        platMeta = {
                          icon: 'fas fa-robot',
                          color: '#10a37f', // ChatGPT Green
                          bg: 'rgba(16, 163, 127, 0.1)',
                          textColor: '#10a37f'
                        };
                      } else if (plat.name === 'Gemini') {
                        platMeta = {
                          icon: 'fas fa-wand-magic-sparkles',
                          color: '#4285f4', // Google/Gemini Blue
                          bg: 'rgba(66, 133, 244, 0.1)',
                          textColor: '#4285f4'
                        };
                      } else if (plat.name === 'Meta AI') {
                        platMeta = {
                          icon: 'fab fa-meta',
                          color: '#0081fb', // Meta Blue
                          bg: 'rgba(0, 129, 251, 0.1)',
                          textColor: '#0081fb'
                        };
                      } else if (plat.name === 'Grok AI') {
                        platMeta = {
                          icon: 'fas fa-terminal',
                          color: '#e2e8f0', // Grok light gray/white
                          bg: 'rgba(255, 255, 255, 0.08)',
                          textColor: '#e2e8f0'
                        };
                      }

                      return (
                        <div className="glass-card ai-platform-card-v7" key={idx} style={{ borderTop: `4px solid ${platMeta.color}` }}>
                          <div className="ai-platform-header">
                            <div className="ai-platform-title-area">
                              <span className="ai-platform-icon-wrap" style={{ backgroundColor: platMeta.bg, color: platMeta.color }}>
                                <i className={platMeta.icon}></i>
                              </span>
                              <span className="ai-platform-name">{plat.name}</span>
                            </div>
                            <span className={`ai-standing-status ${
                              isRecommended ? 'ai-standing-yes' : isMentioned ? 'ai-standing-warn' : 'ai-standing-no'
                            }`}>
                              {plat.standing}
                            </span>
                          </div>

                          <div className="ai-platform-content-grid">
                            <div className="ai-platform-left-col">
                              <div className="ai-section-title-sm">Live Response & Sentiment Analysis</div>
                              <p className="ai-citation-v7">
                                "{plat.citation}"
                              </p>
                              
                              <div className="ai-platform-subsignals-v7">
                                <span className={`signal-badge ${plat.credentials_cited ? 'cited' : 'not-cited'}`}>
                                  <i className="fas fa-certificate"></i> Credentials: {plat.credentials_cited ? 'Cited' : 'Missing'}
                                </span>
                                <span className={`signal-badge ${plat.sentiment_positive ? 'positive' : 'negative'}`}>
                                  <i className="fas fa-heart"></i> Sentiment: {plat.sentiment_positive ? 'Positive' : 'Neutral/Negative'}
                                </span>
                              </div>
                            </div>

                            <div className="ai-platform-right-col">
                              {plat.evidence_screenshot && (
                                <div className="ai-evidence-thumbnail-container">
                                  <div className="ai-section-title-sm">Visual Verification Proof</div>
                                  <div 
                                    className="ai-evidence-thumbnail" 
                                    onClick={() => setLightboxImage({ path: getAssetPath(plat.evidence_screenshot!), caption: `${plat.name} Standing Evidence Screenshot` })}
                                  >
                                    <img 
                                      src={getAssetPath(plat.evidence_screenshot)} 
                                      alt={`${plat.name} proof`}
                                    />
                                    <div className="ai-evidence-hover-overlay">
                                      <i className="fas fa-expand"></i>
                                      <span>Click to Expand Proof</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {plat.top_recommendations && plat.top_recommendations.length > 0 && (
                            <div className="ai-recommendations-section">
                              <div className="ai-section-title-sm" style={{ marginTop: '1.25rem', marginBottom: '0.75rem' }}>
                                <i className="fas fa-list-ol" style={{ color: platMeta.color, marginRight: '0.5rem' }}></i>
                                Local Top 3 Recommended Competitors
                              </div>
                              <div className="ai-recommendations-table-wrapper">
                                <table className="ai-recommendations-table">
                                  <thead>
                                    <tr>
                                      <th style={{ width: '80px' }}>Rank</th>
                                      <th style={{ width: '220px' }}>Provider Name</th>
                                      <th>AI Citation Rationale</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {plat.top_recommendations.map((rec, rIdx) => {
                                      const isSelf = rec.name.toLowerCase().includes('vishal maurya') || rec.name.toLowerCase().includes('pravisha');
                                      return (
                                        <tr key={rIdx} className={isSelf ? 'highlight-self-row' : ''}>
                                          <td className="rank-cell">
                                            <span className={`rank-badge rank-${rec.rank}`}>#{rec.rank}</span>
                                          </td>
                                          <td className="name-cell">
                                            <strong>{rec.name}</strong>
                                            {isSelf && <span className="self-tag">This Clinic</span>}
                                          </td>
                                          <td className="reason-cell">{rec.reason_cited}</td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                  </section>

                  {/* TECHNICAL & E-E-A-T CHECKLISTS SECTION */}
                  <section id="checklists" className="report-section fade-in">
                    <h2 className="section-title">
                      <i className="fas fa-clipboard-check"></i>
                      <span>Technical Verification & Compliance Checklists</span>
                    </h2>
                
                {/* Side by side checklists */}
                <div className="checks-grid">
                  
                  {/* EEAT Credentials Check list */}
                  {eeatChannel && eeatChannel.checks && (
                    <div className="glass-card">
                      <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <i className="fas fa-shield-halved" style={{ color: CHANNEL_META.eeat_credentials?.color }}></i>
                        <span>Medical E-E-A-T Credentials</span>
                      </h3>
                      <div className="checklist-items-container">
                        {eeatChannel.checks.map((check, idx) => (
                          <div className="check-item" key={idx}>
                            <div className="check-item-info">
                              <span className="check-label">{check.label}</span>
                              <span className="check-value">{check.value}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
                              <span className={`status-badge status-${check.status}`}>
                                {check.status}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{check.points} pts</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {renderInlineEvidence('eeat_credentials')}
                    </div>
                  )}

                  {/* Website & Schema checklists */}
                  {schemaChannel && schemaChannel.checks && (
                    <div className="glass-card">
                      <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <i className="fas fa-code" style={{ color: CHANNEL_META.website_schema?.color }}></i>
                        <span>Website & Schema Compliance</span>
                      </h3>
                      <div className="checklist-items-container">
                        {schemaChannel.checks.map((check, idx) => (
                          <div className="check-item" key={idx}>
                            <div className="check-item-info">
                              <span className="check-label">{check.label}</span>
                              <span className="check-value">{check.value}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
                              <span className={`status-badge status-${check.status}`}>
                                {check.status}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{check.points} pts</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      {renderInlineEvidence('website_schema')}
                    </div>
                  )}

                  {/* Google Profile Completeness checklist */}
                  {reportData.channels.find(c => c.id === 'google_seo')?.completeness_checks && (
                    <div className="glass-card">
                      <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <i className="fab fa-google" style={{ color: CHANNEL_META.google_seo?.color }}></i>
                        <span>Google GBP Completeness Checklist</span>
                      </h3>
                      <div className="checklist-items-container">
                        {reportData.channels.find(c => c.id === 'google_seo')?.completeness_checks?.map((check, idx) => (
                          <div className="check-item" key={idx}>
                            <div className="check-item-info">
                              <span className="check-label">{check.label}</span>
                              <span className="check-value">{check.value}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
                              <span className={`status-badge status-${check.status}`}>
                                {check.status}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{check.points} pts</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Bing Places Completeness checklist */}
                  {reportData.channels.find(c => c.id === 'bing_seo')?.completeness_checks && (
                    <div className="glass-card">
                      <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <i className="fab fa-microsoft" style={{ color: CHANNEL_META.bing_seo?.color }}></i>
                        <span>Bing Places Completeness Checklist</span>
                      </h3>
                      <div className="checklist-items-container">
                        {reportData.channels.find(c => c.id === 'bing_seo')?.completeness_checks?.map((check, idx) => (
                          <div className="check-item" key={idx}>
                            <div className="check-item-info">
                              <span className="check-label">{check.label}</span>
                              <span className="check-value">{check.value}</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
                              <span className={`status-badge status-${check.status}`}>
                                {check.status}
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{check.points} pts</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Aggregator Directory metrics checks */}
                  {aggChannel && aggChannel.metrics && (
                    <div className="glass-card" style={{ gridColumn: isMobile ? 'span 1' : 'span 2' }}>
                      <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                        <i className="fas fa-notes-medical" style={{ color: CHANNEL_META.aggregators?.color }}></i>
                        <span>Directory & Aggregator Signals Checklist</span>
                      </h3>
                      <div className="checklist-items-container checks-list-grid">
                        {aggChannel.metrics.map((metric, idx) => {
                          const val = metric.value?.toLowerCase() || '';
                          let status = 'VERIFIED';
                          if (val.includes('missing') || val.includes('not found') || val.includes('not integrated')) {
                            status = 'MISSING';
                          } else if (val.includes('conflict') || val.includes('mismatch')) {
                            status = 'CONFLICTING';
                          }
                          return (
                            <div className="check-item" key={idx}>
                              <div className="check-item-info">
                                <span className="check-label">{metric.label}</span>
                                <span className="check-value">{metric.value}</span>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.3rem' }}>
                                <span className={`status-badge status-${status}`}>
                                  {status.replace('VERIFIED', 'Active').replace('MISSING', 'Missing').replace('CONFLICTING', 'Mismatched')}
                                </span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{metric.points} pts</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {renderInlineEvidence('aggregators')}
                    </div>
                  )}
                </div>
                  </section>

                  {/* ACTION ROADMAP SECTION */}
                  <section id="treatment_roadmap" className="report-section fade-in">
                {reportData.treatment_plan && reportData.treatment_plan.length > 0 ? (
                  <>
                    <h2 className="section-title">
                      <i className="fas fa-prescription-bottle-medical"></i>
                      <span>6-Pillar Digital Treatment Plan</span>
                    </h2>
                    <p className="section-intro-desc">
                      Prioritized clinical roadmap designed to address the discoverability vulnerabilities found during the scan.
                    </p>
                    <div className="treatment-grid">
                      {reportData.treatment_plan.map((item, idx) => (
                        <div className="treatment-card" key={idx}>
                          <div className="treatment-number-badge">Pillar 0{idx + 1}</div>
                          <h4 className="treatment-pillar">
                            <i className="fas fa-circle-nodes" style={{ color: 'var(--accent-color)', marginRight: '0.5rem' }}></i>
                            {item.pillar}
                          </h4>
                          <p className="treatment-desc">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="no-data-card glass-card">
                    <p>No actionable treatment roadmap loaded in this report.</p>
                  </div>
                    )}
                  </section>



          </div>

          {/* Lightbox Overlay */}
          {lightboxImage && (
            <div className="lightbox" onClick={() => setLightboxImage(null)}>
              <button className="lightbox-close" onClick={() => setLightboxImage(null)}>&times;</button>
              <img 
                className="lightbox-content" 
                src={lightboxImage.path} 
                alt={lightboxImage.caption} 
                onClick={(e) => e.stopPropagation()} 
              />
              <div className="lightbox-caption">{lightboxImage.caption}</div>
            </div>
          )}

          {/* Footer compliance */}
          <div className="report-footer-compliance">
            <span>&copy; {new Date().getFullYear()} DigiClinic Solutions. All Rights Reserved.</span>
            <span><strong>Technical Compliance:</strong> Flat SEO URLs Verified | Structured JSON-LD Bindings</span>
          </div>

        </div>
      </div>
    </div>
  );
};
