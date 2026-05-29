import React from 'react';
import { ReportSchema } from '../types/reportSchema';


const getTierClass = (tier: string) => {
  switch (tier?.toUpperCase()) {
    case 'EXCELLENT': return 'excellent';
    case 'GOOD': return 'good';
    case 'MODERATE': return 'moderate';
    default: return 'weak';
  }
};

interface Props {
  data: ReportSchema;
}

export const ExecutiveCover: React.FC<Props> = ({ data }) => {
  const meta = data.report_metadata;
  const reg = meta.state_council_registration;

  return (
    <div className="rv2-page rv2-fade-in" id="rv2-executive">
      {/* Report Title */}
      <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--v2-border)', paddingBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.8rem', margin: 0, background: 'linear-gradient(135deg, #fff 0%, #22d3ee 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          {meta.report_name || 'AI Health Check Report'}
        </h1>
        <p style={{ color: 'var(--v2-text-secondary)', fontSize: '0.95rem', margin: '0.25rem 0 0 0' }}>
          Digital Presence Scan &amp; SEO Audit &bull; Version {meta.version || '7.0'} &bull; {meta.audit_date}
        </p>
      </div>

      {/* Doctor Info */}
      <div className="rv2-card">
        <div className="rv2-doc-grid">
          <div className="rv2-doc-box">
            <label>Prepared For</label>
            <strong>{meta.prepared_for}</strong>
            <span style={{ color: 'var(--v2-accent)', background: 'rgba(34, 211, 238, 0.1)', padding: '0.15rem 0.5rem', borderRadius: '4px', display: 'inline-block', marginTop: '0.25rem', fontSize: '0.8rem' }}>
              <i className="fas fa-user-md" style={{ marginRight: '0.3rem' }}></i>{meta.practice_specialty}
            </span>
          </div>
          <div className="rv2-doc-box">
            <label>Clinic &amp; Location</label>
            <strong>{meta.clinic_name}</strong>
            <span><i className="fas fa-map-marker-alt" style={{ marginRight: '0.3rem' }}></i>{meta.location?.area ? `${meta.location.area}, ` : ''}{meta.location?.city || ''}</span>
          </div>
          <div className="rv2-doc-box">
            <label>Contact</label>
            <strong style={{ color: '#10b981' }}>{meta.primary_discovered_phone}</strong>
            <span title={meta.discovered_clinic_address}>{meta.discovered_clinic_address}</span>
          </div>
          <div className="rv2-doc-box">
            <label>Registry Verification</label>
            <strong>Reg #{reg?.registration_number || 'N/A'}</strong>
            <span>{reg?.council_name || 'N/A'} ({reg?.registration_date || 'N/A'})</span>
          </div>
        </div>
      </div>

      {/* Diagnostic Standing */}
      <div className="rv2-card">
        <div className="rv2-exec-grid">
          <div className="rv2-score-ring">
            <svg viewBox="0 0 36 36">
              <path className="rv2-ring-bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <path className={`rv2-ring-fill rv2-ring-${getTierClass(data.discoverability_tier)}`}
                strokeDasharray={`${data.overall_score}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
              <text x="18" y="20.35" className="rv2-ring-pct">{data.overall_score}%</text>
              <text x="18" y="25.5" className="rv2-ring-label">{data.discoverability_tier}</text>
            </svg>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Diagnostic Standing:</h2>
              <span className={`rv2-tier rv2-tier-${data.discoverability_tier}`}>{data.discoverability_tier}</span>
              {data.brand_protection_score !== undefined && (
                <span className="rv2-brand-shield">
                  <i className="fas fa-shield-halved" style={{ color: '#3b82f6' }}></i>
                  Brand Protection: <strong>{data.brand_protection_score}%</strong>
                </span>
              )}
            </div>
            <p className="rv2-exec-summary">{data.diagnostic_summary}</p>
          </div>
        </div>

        {/* Historical Timeline */}
        {data.historical_runs && data.historical_runs.length > 0 && (
          <div className="rv2-history">
            <div className="rv2-history-header">
              <i className="fas fa-chart-line"></i>
              <span>Progress Timeline</span>
            </div>
            <div className="rv2-history-nodes">
              {data.historical_runs.map((run, i) => (
                <div key={i} className="rv2-history-node">
                  <div className="rv2-history-score">{run.overall_score}%</div>
                  <div className="rv2-history-dot"></div>
                  <div className="rv2-history-date">{run.date}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Competitor Callout */}
      {data.competitor_callout && (
        <div className="rv2-competitor-card">
          <div className="rv2-competitor-glow"></div>
          <div className="rv2-competitor-tag">
            <i className="fas fa-triangle-exclamation"></i> CRITICAL COMPETITOR THREAT
          </div>
          <h3 className="rv2-competitor-name">{data.competitor_callout.primary_competitor}</h3>
          <div className="rv2-competitor-capture">
            Est. Local Market Share: <strong>{data.competitor_callout.estimated_market_capture}</strong>
          </div>
          <p className="rv2-competitor-reason">{data.competitor_callout.reason}</p>
        </div>
      )}
    </div>
  );
};
