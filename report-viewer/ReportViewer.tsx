import React, { useState, useEffect } from 'react';
import { ReportSchema, Channel } from './types/reportSchema';
import './report.css';

const DEFAULT_RUNS = [
  { value: 'dr_vishal_maurya_report-run-1.json', label: 'Dr. Vishal Maurya - Run 1' },
  { value: 'dr_vishal_maurya_report-run-2.json', label: 'Dr. Vishal Maurya - Run 2' },
  { value: 'dr_nidhi_patel_report-run-1.json', label: 'Dr. Nidhi Patel - Run 1' },
  { value: 'dr_nidhi_patel_report-run-2.json', label: 'Dr. Nidhi Patel - Run 2' },
  { value: 'live_audit_run.json', label: 'Live Audit Run' }
];

export const ReportViewer: React.FC = () => {
  const [reportData, setReportData] = useState<ReportSchema | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRun, setSelectedRun] = useState<string>('dr_vishal_maurya_report-run-1.json');
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [lightboxImage, setLightboxImage] = useState<{ path: string; caption: string } | null>(null);

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

  const getBarColorClass = (score: number) => {
    if (score <= 30) return 'weak';
    if (score <= 60) return 'moderate';
    if (score <= 80) return 'good';
    return 'excellent';
  };

  // Extract query params or load default
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fileParam = params.get('file');
    
    let targetFile = selectedRun;
    if (fileParam) {
      targetFile = fileParam;
      // Check if it matches one of our defaults to sync dropdown
      const matched = DEFAULT_RUNS.find(r => r.value === fileParam || r.value.includes(fileParam));
      if (matched) {
        setSelectedRun(matched.value);
      }
    }

    setLoading(true);
    setError(null);

    // Fetch the JSON file
    fetch(`/reports/v6/${targetFile}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to load report: ${res.statusText}`);
        }
        return res.json();
      })
      .then((data: ReportSchema) => {
        setReportData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(`Failed to fetch report JSON. Make sure reports/v6/${targetFile} exists. Error: ${err.message}`);
        setLoading(false);
      });
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
    
    let md = `# DigiClinic AI Rank & SEO Audit Report\n\n`;
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
    md += `---\n\n`;
    
    md += `## 📊 3. Cross-Channel Search Query Matrix (V5 Schema)\n\n`;
    
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
    md += `\n`;
    md += `> [!WARNING]\n`;
    md += `> **Primary Local Competitor Threat:** Top local competitors steal a significant portion of patient traffic due to superior search ranking, verified listings, and active review volumes.\n\n`;
    md += `---\n\n`;
    
    md += `## 🤖 4. Dedicated AI App Conversational Standing (Non-Search GEO)\n\n`;
    const aiChannel = reportData.channels.find(c => c.id === 'conversational_ai');
    if (aiChannel && aiChannel.platforms) {
      md += `| AI Platform | Recommendation Standing | Verbatim Citation / Ranking Context |\n`;
      md += `| :--- | :--- | :--- |\n`;
      aiChannel.platforms.forEach(plat => {
        md += `| **${plat.name}** | **${plat.standing}** | "${plat.citation}" |\n`;
      });
    }
    md += `\n---\n\n`;
    
    md += `## 🔬 5. Enrichment Audit & Gap Details (The Verification Schema)\n\n`;
    
    md += `### 🏥 A. Clinic Details\n`;
    const aggChannel = reportData.channels.find(c => c.id === 'aggregators');
    aggChannel?.metrics?.forEach((metric, i) => {
      md += `${i + 1}.  **${metric.label}:** ${metric.value}\n`;
    });
    md += `\n`;
    
    md += `### 👨‍⚕️ B. Doctor Details (The Expert Schema)\n`;
    const eeatChannel = reportData.channels.find(c => c.id === 'eeat_credentials');
    eeatChannel?.checks?.forEach((check, i) => {
      md += `${i + 1}.  **${check.label}:** **${check.status}** (${check.value})\n`;
    });
    md += `\n`;
    
    md += `### 🌐 C. Website & Schema Details\n`;
    const schemaChannel = reportData.channels.find(c => c.id === 'website_schema');
    schemaChannel?.checks?.forEach((check, i) => {
      md += `${i + 1}.  **${check.label}:** **${check.status}** (${check.value})\n`;
    });
    md += `\n---\n\n`;
    
    md += `## 🛠️ 6. Actionable 6-Pillar Treatment Plan\n\n`;
    reportData.treatment_plan.forEach((item, i) => {
      md += `${i + 1}.  **${item.pillar}:**\n`;
      md += `    ${item.description}\n`;
    });
    
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${meta.prepared_for.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_ai_report_v5.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#040712', color: '#fff', gap: '1rem' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '3rem', color: 'var(--accent-color)' }}></i>
        <h2>Scanning DigiClinic reports...</h2>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#040712', color: '#fff', padding: '2rem', textAlign: 'center' }}>
        <i className="fas fa-circle-exclamation" style={{ fontSize: '4rem', color: 'var(--danger)', marginBottom: '1.5rem' }}></i>
        <h2 style={{ maxWidth: '800px' }}>{error || "No report loaded."}</h2>
        <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
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

  // Find unique screenshots
  const screenshots = reportData.channels
    .filter(c => c.evidence_screenshot)
    .map(c => ({
      id: c.id,
      caption: `${c.name} Evidence Proof`,
      path: c.evidence_screenshot
    }));
  const uniqueScreenshots = screenshots.filter((v, i, a) => a.findIndex(t => t.path === v.path) === i);

  // Simulated mobile preview shell
  const containerStyle = isMobile ? {
    maxWidth: '430px',
    margin: '2rem auto',
    border: '14px solid #1e293b',
    borderRadius: '40px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    padding: '2rem 1rem',
    background: '#040712',
    maxHeight: '85vh',
    overflowY: 'auto' as const,
  } : {};

  return (
    <div style={{ background: '#040712', minHeight: '100vh', width: '100%' }}>
      {/* Sticky top controls bar */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 500,
        background: 'rgba(4, 7, 18, 0.95)',
        borderBottom: '1px solid var(--border-color)',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        backdropFilter: 'blur(10px)'
      }} className="controls-bar-wrapper">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <i className="fas fa-stethoscope" style={{ color: 'var(--accent-color)', fontSize: '1.5rem' }}></i>
          <span style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#fff' }}>DigiClinic V6 Viewer</span>
        </div>
        
        <div className="controls-bar">
          <select className="selector-dropdown" value={selectedRun} onChange={handleRunChange}>
            {DEFAULT_RUNS.map(run => (
              <option key={run.value} value={run.value}>{run.label}</option>
            ))}
          </select>

          <label className="btn" style={{ cursor: 'pointer' }}>
            <i className="fas fa-upload"></i> Upload Custom JSON
            <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleFileUpload} />
          </label>

          <button className={`btn ${isMobile ? 'btn-primary' : ''}`} onClick={() => setIsMobile(!isMobile)}>
            <i className="fas fa-mobile-screen-button"></i> {isMobile ? 'Desktop View' : 'Mobile View'}
          </button>

          <button className="btn" onClick={() => window.print()}>
            <i className="fas fa-file-pdf"></i> Download PDF
          </button>

          <button className="btn" onClick={handleDownloadMarkdown}>
            <i className="fas fa-file-code"></i> Download MD (V5)
          </button>
        </div>
      </div>

      {/* Simulated Device Frame or normal container */}
      <div style={containerStyle}>
        <div className="report-container">
          
          {/* Header Card */}
          <div className="report-header">
            <div className="header-title-section">
              <h1>{meta.report_name || 'AI Health Check Report'}</h1>
              <p className="header-subtitle">
                Digital Presence Scan & SEO Audit &bull; Version {meta.version || '6.0'}
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <span><strong>Audit Run:</strong> {meta.audit_date}</span>
              <span><strong>Verified:</strong> {meta.last_verified_activity_date}</span>
            </div>
          </div>

          {/* Doctor Info Panel */}
          <div className="glass-card">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
              <div>
                <span style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Doctor Standing</span>
                <strong style={{ fontSize: '1.3rem', color: '#fff', display: 'block', marginTop: '0.2rem' }}>{meta.prepared_for}</strong>
                <span style={{ display: 'inline-block', fontSize: '0.9rem', color: 'var(--accent-color)', marginTop: '0.2rem', background: 'rgba(34, 211, 238, 0.1)', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                  <i className="fas fa-user-md"></i> {meta.practice_specialty}
                </span>
              </div>
              <div>
                <span style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Clinic & Location</span>
                <strong style={{ fontSize: '1.2rem', color: '#fff', display: 'block', marginTop: '0.2rem' }}>{meta.clinic_name}</strong>
                <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  <i className="fas fa-map-marker-alt"></i> {meta.location?.area ? `${meta.location.area}, ` : ''}{meta.location?.city || ''}
                </span>
              </div>
              <div>
                <span style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact Signal</span>
                <strong style={{ fontSize: '1.1rem', color: '#fff', display: 'block', marginTop: '0.2rem' }}>{meta.primary_discovered_phone}</strong>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem', wordBreak: 'break-all' }}>
                  <strong>Address:</strong> {meta.discovered_clinic_address}
                </span>
              </div>
              <div>
                <span style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Registry Verification</span>
                <strong style={{ fontSize: '1.1rem', color: '#fff', display: 'block', marginTop: '0.2rem' }}>Reg #{reg?.registration_number || 'N/A'}</strong>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                  {reg?.council_name || 'N/A'} ({reg?.registration_date || 'N/A'})
                </span>
              </div>
            </div>
          </div>

          {/* Consolidated Rank & Summary Card */}
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
                  <text x="18" y="25" className="label-tier">{reportData.discoverability_tier}</text>
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

            {/* Historical Score Progress Timeline */}
            {reportData.historical_runs && reportData.historical_runs.length > 0 && (
              <div className="history-timeline">
                <div style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="fas fa-chart-line"></i>
                  <span>Historical Progress Timeline</span>
                </div>
                <div style={{ display: 'flex', flex: 1, gap: '1rem', justifyContent: 'space-around', alignItems: 'center', flexWrap: 'wrap' }}>
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

          {/* Per-Channel Score Cards Grid */}
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="fas fa-cubes" style={{ color: 'var(--accent-color)' }}></i>
            <span>Per-Channel Discoverability Breakdown</span>
          </h2>
          <div className="channel-grid">
            {reportData.channels.map((channel) => (
              <div className="channel-card" key={channel.id}>
                <div className="channel-card-header">
                  <span className="channel-name">{channel.name}</span>
                  <span className="channel-score">{channel.channel_percentage_score}%</span>
                </div>
                <div className="progress-bar-container">
                  <div 
                    className={`progress-bar-fill bar-${getBarColorClass(channel.channel_percentage_score)}`}
                    style={{ width: `${channel.channel_percentage_score}%` }}
                  ></div>
                </div>
                <span className="channel-weight-tag">Weight: {channel.weight}%</span>
              </div>
            ))}
          </div>

          {/* Cross-Channel Search Query Matrix */}
          {searchChannels.length > 0 && (
            <>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fas fa-magnifying-glass-chart" style={{ color: 'var(--accent-color)' }}></i>
                <span>Cross-Channel Search Rank Matrix</span>
              </h2>
              <div className="glass-card">
                <div className="matrix-wrapper">
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
                        const qText = searchChannels[0].queries?.[qIdx].query;
                        return (
                          <tr key={qIdx}>
                            <td className="matrix-query-cell">{qText}</td>
                            {searchChannels.map(ch => {
                              const qData = ch.queries?.[qIdx];
                              const isUnranked = qData?.rank === 'Unranked' || qData?.rank === null || qData?.rank === undefined;
                              return (
                                <td key={ch.id}>
                                  <span className={`rank-pill ${isUnranked ? 'rank-unranked' : 'rank-top'}`}>
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
                                {searchChannels[0].queries?.[qIdx]?.top_competitors?.map((comp, compIdx) => (
                                  <li key={compIdx}>
                                    <strong>#{comp.rank}</strong> {comp.name}
                                  </li>
                                ))}
                                {(!searchChannels[0].queries?.[qIdx]?.top_competitors || searchChannels[0].queries?.[qIdx]?.top_competitors.length === 0) && (
                                  <li>No competitors indexed.</li>
                                )}
                              </ul>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Primary local competitor alert callout */}
                <div style={{
                  marginTop: '1.5rem',
                  padding: '1.2rem',
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  lineHeight: '1.5',
                  color: 'var(--text-primary)',
                  display: 'flex',
                  gap: '0.75rem',
                  alignItems: 'flex-start'
                }}>
                  <i className="fas fa-circle-exclamation" style={{ color: 'var(--danger)', fontSize: '1.2rem', marginTop: '0.15rem' }}></i>
                  <div>
                    <strong>Primary Competitor Standing:</strong> Top competitors like Maruti Dental Clinic, Dr Priyam, and Rastogi Dental Hospital dominate high-intent organic localized queries. They command massive local traffic shares by establishing search presence and active review signals, making Pravisha Healthcare invisible to new patient discovery.
                  </div>
                </div>
              </div>
            </>
          )}

          {/* AI Platform Recommendation Standings */}
          {aiChannel && aiChannel.platforms && (
            <>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fas fa-robot" style={{ color: 'var(--accent-color)' }}></i>
                <span>Conversational AI Standing & Recommendations</span>
              </h2>
              <div className="glass-card">
                <div className="ai-standing-grid">
                  {aiChannel.platforms.map((plat, idx) => {
                    const isRecommended = plat.standing?.toLowerCase().includes('recommended') && !plat.standing?.toLowerCase().includes('not');
                    return (
                      <div className="ai-platform-card" key={idx}>
                        <div className="ai-platform-header">
                          <span className="ai-platform-name">{plat.name}</span>
                          <span className={`ai-standing-status ${isRecommended ? 'ai-standing-yes' : 'ai-standing-no'}`}>
                            {plat.standing}
                          </span>
                        </div>
                        <p className="ai-citation">
                          "{plat.citation}"
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* Enrichment Audit & Checklists */}
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="fas fa-clipboard-check" style={{ color: 'var(--accent-color)' }}></i>
            <span>Data Enrichment & Medical E-E-A-T Checklists</span>
          </h2>
          <div className="checks-grid">
            {/* EEAT Checklist */}
            {eeatChannel && eeatChannel.checks && (
              <div className="glass-card">
                <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="fas fa-shield-halved" style={{ color: 'var(--accent-color)', fontSize: '1.2rem' }}></i>
                  <span>Medical E-E-A-T & Credentials</span>
                </h3>
                <div>
                  {eeatChannel.checks.map((check, idx) => (
                    <div className="check-item" key={idx}>
                      <div className="check-item-info">
                        <span className="check-label">{check.label}</span>
                        <span className="check-value">{check.value}</span>
                      </div>
                      <span className={`status-badge status-${check.status}`}>
                        {check.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Website Schema Compliance */}
            {schemaChannel && schemaChannel.checks && (
              <div className="glass-card">
                <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="fas fa-code" style={{ color: 'var(--accent-color)', fontSize: '1.2rem' }}></i>
                  <span>Website & Schema Compliance</span>
                </h3>
                <div>
                  {schemaChannel.checks.map((check, idx) => (
                    <div className="check-item" key={idx}>
                      <div className="check-item-info">
                        <span className="check-label">{check.label}</span>
                        <span className="check-value">{check.value}</span>
                      </div>
                      <span className={`status-badge status-${check.status}`}>
                        {check.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Medical Aggregators */}
            {aggChannel && aggChannel.metrics && (
              <div className="glass-card">
                <h3 style={{ marginTop: 0, marginBottom: '1rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <i className="fas fa-notes-medical" style={{ color: 'var(--accent-color)', fontSize: '1.2rem' }}></i>
                  <span>Directory & Aggregator Signals</span>
                </h3>
                <div>
                  {aggChannel.metrics.map((metric, idx) => {
                    const val = metric.value?.toLowerCase() || '';
                    let status = 'VERIFIED';
                    if (val.includes('missing') || val.includes('not integrated')) {
                      status = 'MISSING';
                    } else if (val.includes('outdated') || val.includes('conflicting')) {
                      status = 'CONFLICTING';
                    }
                    return (
                      <div className="check-item" key={idx}>
                        <div className="check-item-info">
                          <span className="check-label">{metric.label}</span>
                          <span className="check-value">{metric.value}</span>
                        </div>
                        <span className={`status-badge status-${status}`}>
                          {status.replace('VERIFIED', 'Active').replace('MISSING', 'Missing').replace('CONFLICTING', 'Mismatched')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Visual Proof Screenshot Gallery */}
          {uniqueScreenshots.length > 0 && (
            <>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fas fa-images" style={{ color: 'var(--accent-color)' }}></i>
                <span>Audit Screenshot & Visual Evidence Proofs</span>
              </h2>
              <div className="glass-card">
                <div className="gallery-grid">
                  {uniqueScreenshots.map((shot, idx) => (
                    <div className="gallery-card" key={idx} onClick={() => setLightboxImage({ path: shot.path, caption: shot.caption })}>
                      <img src={`/${shot.path}`} alt={shot.caption} onError={(e) => {
                        // Fallback relative path lookup
                        e.currentTarget.src = `../${shot.path}`;
                      }} />
                      <div className="gallery-caption">{shot.caption}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Lightbox Overlay */}
          {lightboxImage && (
            <div className="lightbox" onClick={() => setLightboxImage(null)}>
              <button className="lightbox-close" onClick={() => setLightboxImage(null)}>&times;</button>
              <img 
                className="lightbox-content" 
                src={`/${lightboxImage.path}`} 
                alt={lightboxImage.caption} 
                onError={(e) => {
                  e.currentTarget.src = `../${lightboxImage.path}`;
                }} 
                onClick={(e) => e.stopPropagation()} 
              />
              <div className="lightbox-caption">{lightboxImage.caption}</div>
            </div>
          )}

          {/* Actionable Treatment Plan */}
          {reportData.treatment_plan && reportData.treatment_plan.length > 0 && (
            <>
              <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="fas fa-prescription-bottle-medical" style={{ color: 'var(--accent-color)' }}></i>
                <span>Actionable 6-Pillar Treatment Plan & Growth Roadmap</span>
              </h2>
              <div className="treatment-grid">
                {reportData.treatment_plan.map((item, idx) => (
                  <div className="treatment-card" key={idx}>
                    <h4 className="treatment-pillar">
                      <i className="fas fa-chevron-right" style={{ color: 'var(--accent-color)', marginRight: '0.5rem' }}></i>
                      {item.pillar}
                    </h4>
                    <p className="treatment-desc">{item.description}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Footer compliance */}
          <div style={{
            marginTop: '4rem',
            textAlign: 'center',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            borderTop: '1px solid var(--border-color)',
            paddingTop: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem'
          }} className="report-footer-compliance">
            <span>&copy; {new Date().getFullYear()} DigiClinic Digital Solutions. All Rights Reserved.</span>
            <span><strong>Technical Compliance:</strong> Flat SEO URLs Verified | Supabase Modularity Active</span>
          </div>

        </div>
      </div>
    </div>
  );
};
