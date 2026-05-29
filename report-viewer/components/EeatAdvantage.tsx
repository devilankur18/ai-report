import React from 'react';
import { ReportSchema } from '../types/reportSchema';

interface Props {
  data: ReportSchema;
  getAssetPath: (path: string) => string;
  onImageClick: (path: string, caption: string) => void;
}

export const EeatAdvantage: React.FC<Props> = ({ data, getAssetPath, onImageClick }) => {
  const eeatChannel = data.channels.find(c => c.id === 'eeat_credentials');
  if (!eeatChannel) return null;

  const verifiedChecks = eeatChannel.checks?.filter(c => c.status === 'VERIFIED') || [];
  const missingChecks = eeatChannel.checks?.filter(c => c.status !== 'VERIFIED') || [];

  return (
    <div className="rv2-page rv2-fade-in" id="rv2-eeat">
      <h2 className="rv2-section-title">
        <i className="fas fa-award"></i>
        <span>The E-E-A-T Advantage (Real-World Authority)</span>
      </h2>
      <p className="rv2-section-intro">
        Your real-world clinical expertise is the foundation of digital trust. Search engines and AI models
        prioritize E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) when deciding which
        doctors to recommend.
      </p>

      <div className="rv2-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <i className="fas fa-shield-halved" style={{ color: '#f59e0b', fontSize: '1.2rem' }}></i>
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>E-E-A-T Score: <span style={{ color: '#f59e0b' }}>{eeatChannel.channel_percentage_score}%</span></h3>
        </div>

        {/* Verified Items */}
        {verifiedChecks.length > 0 && (
          <>
            <div style={{ fontSize: '0.8rem', color: 'var(--v2-success)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
              ✅ Verified Credentials
            </div>
            {verifiedChecks.map((check, idx) => (
              <div className="rv2-check-item" key={idx}>
                <div className="rv2-check-info">
                  <span className="rv2-check-label">{check.label}</span>
                  <span className="rv2-check-value">{check.value}</span>
                </div>
                <div className="rv2-check-right">
                  <span className="rv2-status rv2-status-VERIFIED">{check.status}</span>
                  <span className="rv2-check-pts">{check.points} pts</span>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Missing Items */}
        {missingChecks.length > 0 && (
          <>
            <div style={{ fontSize: '0.8rem', color: 'var(--v2-danger)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '1.25rem', marginBottom: '0.5rem' }}>
              ❌ Missing Credentials
            </div>
            {missingChecks.map((check, idx) => (
              <div className="rv2-check-item" key={idx}>
                <div className="rv2-check-info">
                  <span className="rv2-check-label">{check.label}</span>
                  <span className="rv2-check-value">{check.value}</span>
                </div>
                <div className="rv2-check-right">
                  <span className={`rv2-status rv2-status-${check.status}`}>{check.status}</span>
                  <span className="rv2-check-pts">{check.points} pts</span>
                </div>
              </div>
            ))}
          </>
        )}

      </div>

      <p style={{ fontSize: '0.95rem', color: 'var(--v2-text-secondary)', lineHeight: 1.6, fontStyle: 'italic', padding: '0 0.5rem', marginBottom: '1.5rem' }}>
        Your real-world authority and credentials are the ultimate winning formula to close these AI visibility gaps. Search engines and AI models require robust E-E-A-T validation to trust and recommend your clinic. Let's look at how we can leverage these credentials to build trust…
      </p>

      {/* Inline Evidence Screenshot - forced to a new page in print/PDF view */}
      {eeatChannel.evidence_screenshot && (
        <div 
          className="rv2-card rv2-print-break" 
          onClick={() => onImageClick(getAssetPath(eeatChannel.evidence_screenshot), 'E-E-A-T Registry Verification Proof')}
          style={{ cursor: 'pointer', marginTop: '1.5rem' }}
        >
          <div className="rv2-evidence" style={{ border: 'none', padding: 0, margin: 0 }}>
            <div className="rv2-evidence-label" style={{ marginBottom: '1rem' }}>
              <i className="fas fa-camera"></i>
              <span>E-E-A-T Registry Verification Screenshot</span>
            </div>
            <img src={getAssetPath(eeatChannel.evidence_screenshot)} alt="E-E-A-T proof" style={{ display: 'block', width: '100%', borderRadius: '8px' }} />
          </div>
        </div>
      )}
    </div>
  );
};
