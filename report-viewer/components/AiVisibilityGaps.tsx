import React from 'react';
import { ReportSchema } from '../types/reportSchema';

const PLAT_META: Record<string, { icon: string; color: string; bg: string }> = {
  ChatGPT: { icon: 'fas fa-robot', color: '#10a37f', bg: 'rgba(16, 163, 127, 0.1)' },
  Gemini: { icon: 'fas fa-wand-magic-sparkles', color: '#4285f4', bg: 'rgba(66, 133, 244, 0.1)' },
  'Meta AI': { icon: 'fab fa-meta', color: '#0081fb', bg: 'rgba(0, 129, 251, 0.1)' },
  'Grok AI': { icon: 'fas fa-terminal', color: '#e2e8f0', bg: 'rgba(255, 255, 255, 0.08)' },
};

interface Props {
  data: ReportSchema;
  getAssetPath: (path: string) => string;
  onImageClick: (path: string, caption: string) => void;
}

export const AiVisibilityGaps: React.FC<Props> = ({ data, getAssetPath, onImageClick }) => {
  const aiChannel = data.channels.find(c => c.id === 'conversational_ai');
  if (!aiChannel || !aiChannel.platforms) return null;

  const meta = data.report_metadata;

  return (
    <div className="rv2-page rv2-fade-in" id="rv2-ai">
      <h2 className="rv2-section-title">
        <i className="fas fa-robot"></i>
        <span>AI Apps Visibility (Score: {aiChannel.channel_percentage_score}%)</span>
      </h2>
      <p className="rv2-section-intro">
        How do modern AI assistants respond when patients ask for a top {meta.practice_specialty?.toLowerCase()} in {meta.location?.area}, {meta.location?.city}? Here's what they say — with undeniable proof.
      </p>

      {/* Sub-categories */}
      {aiChannel.sub_categories && (
        <div className="rv2-card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className="fas fa-gears" style={{ color: '#a855f7' }}></i>
            AI Model Standing Subcategories
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {Object.entries(aiChannel.sub_categories).map(([subId, sub]) => (
              <div key={subId} style={{ background: 'rgba(10, 15, 30, 0.35)', border: '1px solid var(--v2-border)', borderRadius: '10px', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{sub.label}</span>
                  <span style={{ fontWeight: 800, color: '#a855f7', fontSize: '0.95rem' }}>{sub.score}/{sub.max_points}</span>
                </div>
                <div className="rv2-bar-track">
                  <div className="rv2-bar-fill" style={{ width: `${(sub.score / sub.max_points) * 100}%`, backgroundColor: '#a855f7' }}></div>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--v2-text-secondary)', margin: '0.4rem 0 0 0', lineHeight: 1.4 }}>{sub.details}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Platform Cards */}
      {aiChannel.platforms.map((plat, idx) => {
        const pm = PLAT_META[plat.name] || { icon: 'fas fa-robot', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.1)' };
        const isRecommended = plat.standing?.toLowerCase().includes('recommended') && !plat.standing?.toLowerCase().includes('not');
        const isMentioned = plat.standing?.toLowerCase().includes('mentioned');

        return (
          <div className="rv2-ai-card" key={idx} style={{ borderTop: `4px solid ${pm.color}` }}>
            <div className="rv2-ai-header">
              <div className="rv2-ai-title">
                <span className="rv2-ai-icon" style={{ backgroundColor: pm.bg, color: pm.color }}>
                  <i className={pm.icon}></i>
                </span>
                <span>{plat.name}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className={`rv2-ai-standing ${isRecommended ? 'rv2-ai-standing-yes' : isMentioned ? 'rv2-ai-standing-warn' : 'rv2-ai-standing-no'}`}>
                  {plat.standing}
                </span>
                <span style={{ background: pm.bg, color: pm.color, padding: '0.25rem 0.5rem', borderRadius: '12px', fontWeight: 700, fontSize: '0.8rem', border: `1px solid ${pm.color}40` }}>
                  {plat.points ?? 0} pts
                </span>
              </div>
            </div>

            {/* Citation */}
            <div className="rv2-ai-citation">"{plat.citation}"</div>

            {/* Signals */}
            <div className="rv2-ai-signals">
              <span className={`rv2-signal ${plat.credentials_cited ? 'rv2-signal-ok' : 'rv2-signal-fail'}`}>
                <i className="fas fa-certificate"></i> Credentials: {plat.credentials_cited ? 'Cited' : 'Missing'}
              </span>
              <span className={`rv2-signal ${plat.sentiment_positive ? 'rv2-signal-ok' : 'rv2-signal-fail'}`}>
                <i className="fas fa-heart"></i> Sentiment: {plat.sentiment_positive ? 'Positive' : 'Neutral/Negative'}
              </span>
            </div>

            {/* Top 3 Recommendations Table */}
            {plat.top_recommendations && plat.top_recommendations.length > 0 && (
              <div className="rv2-ai-recs">
                <h5><i className="fas fa-list-ol" style={{ color: pm.color, marginRight: '0.4rem' }}></i>Instead Recommends (Top 3)</h5>
                <table className="rv2-ai-recs-table">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>Rank</th>
                      <th style={{ width: '200px' }}>Provider</th>
                      <th>AI Citation Rationale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plat.top_recommendations.map((rec, rIdx) => {
                      const ignoreWords = new Set(['dr', 'dr.', 'dentist', 'dental', 'clinic', 'hospital', 'center', 'centre', 'and', 'for', 'the', 'care', 'implant', 'laser']);
                      const doctorTokens = (meta.prepared_for || '').toLowerCase().split(/[\s,.-]+/).filter(t => t.length > 2 && !ignoreWords.has(t));
                      const clinicTokens = (meta.clinic_name || '').toLowerCase().split(/[\s,.-]+/).filter(t => t.length > 2 && !ignoreWords.has(t));
                      const recLower = rec.name.toLowerCase();
                      const isSelf = [...doctorTokens, ...clinicTokens].length > 0 && [...doctorTokens, ...clinicTokens].some(tok => recLower.includes(tok));
                      return (
                        <tr key={rIdx} style={isSelf ? { background: 'rgba(34, 211, 238, 0.08)' } : {}}>
                          <td><span className="rv2-rank-badge">#{rec.rank}</span></td>
                          <td>
                            <strong>{rec.name}</strong>
                            {isSelf && <span style={{ marginLeft: '0.4rem', fontSize: '0.7rem', background: 'var(--v2-success-bg)', color: 'var(--v2-success)', padding: '0.1rem 0.3rem', borderRadius: '3px', fontWeight: 700 }}>YOU</span>}
                          </td>
                          <td style={{ color: 'var(--v2-text-secondary)', fontSize: '0.8rem' }}>{rec.reason_cited}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Inline Evidence Screenshot */}
            {plat.evidence_screenshot && (
              <div className="rv2-evidence" style={{ marginTop: '1rem' }} onClick={() => onImageClick(getAssetPath(plat.evidence_screenshot!), `${plat.name} Standing Evidence`)}>
                <div className="rv2-evidence-label">
                  <i className="fas fa-camera"></i>
                  <span>{plat.name} Verification Screenshot</span>
                </div>
                <img src={getAssetPath(plat.evidence_screenshot)} alt={`${plat.name} proof`} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
