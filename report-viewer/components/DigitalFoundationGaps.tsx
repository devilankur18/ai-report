import React from 'react';
import { ReportSchema } from '../types/reportSchema';

const CHANNEL_META: Record<string, { icon: string; color: string }> = {
  google_seo: { icon: 'fab fa-google', color: '#3b82f6' },
  bing_seo: { icon: 'fab fa-microsoft', color: '#06b6d4' },
  aggregators: { icon: 'fas fa-hospital-user', color: '#ec4899' },
  website_schema: { icon: 'fas fa-globe', color: '#10b981' },
};

interface Props {
  data: ReportSchema;
  getAssetPath: (path: string) => string;
  onImageClick: (path: string, caption: string) => void;
}

export const DigitalFoundationGaps: React.FC<Props> = ({ data, getAssetPath, onImageClick }) => {
  const googleChannel = data.channels.find(c => c.id === 'google_seo');
  const bingChannel = data.channels.find(c => c.id === 'bing_seo');
  const aggChannel = data.channels.find(c => c.id === 'aggregators');
  const schemaChannel = data.channels.find(c => c.id === 'website_schema');

  const renderChecks = (checks: Array<{ label: string; status: string; value: string; points: number }>) => (
    <>
      {checks.map((check, idx) => (
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
  );

  const renderSubcats = (channel: typeof googleChannel) => {
    if (!channel?.sub_categories) return null;
    const meta = CHANNEL_META[channel.id];
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
        {Object.entries(channel.sub_categories).map(([subId, sub]) => (
          <div key={subId} style={{ background: 'rgba(10, 15, 30, 0.35)', border: '1px solid var(--v2-border)', borderRadius: '10px', padding: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>{sub.label}</span>
              <span style={{ fontWeight: 800, color: meta?.color, fontSize: '0.85rem' }}>{sub.score}/{sub.max_points}</span>
            </div>
            <div className="rv2-bar-track" style={{ height: '5px' }}>
              <div className="rv2-bar-fill" style={{ width: `${(sub.score / sub.max_points) * 100}%`, backgroundColor: meta?.color }}></div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderEvidence = (channel: typeof googleChannel, label: string) => {
    if (!channel) return null;
    const screenshots: { path: string; label: string }[] = [];
    if (channel.evidence_screenshot) screenshots.push({ path: channel.evidence_screenshot, label: `${label} Generic Search Proof` });
    if (channel.evidence_screenshot_brand) screenshots.push({ path: channel.evidence_screenshot_brand, label: `${label} Brand Profile Proof` });

    return screenshots.map((s, i) => (
      <div className="rv2-evidence" key={i} style={{ marginTop: '1rem' }} onClick={() => onImageClick(getAssetPath(s.path), s.label)}>
        <div className="rv2-evidence-label">
          <i className="fas fa-camera"></i>
          <span>{s.label}</span>
        </div>
        <img src={getAssetPath(s.path)} alt={s.label} />
      </div>
    ));
  };

  return (
    <div className="rv2-page rv2-fade-in" id="rv2-digital-gaps">
      <h2 className="rv2-section-title">
        <i className="fas fa-chart-line"></i>
        <span>Digital Foundation Gaps (Completeness &amp; Schema)</span>
      </h2>
      <p className="rv2-section-intro">
        AI models scrape Google, Bing, Directories, and Websites to form their recommendations. Here is
        exactly what the AI sees when it scans your practice across the web — and where it finds nothing.
      </p>

      {/* Google GBP */}
      {googleChannel && (
        <div className="rv2-card" style={{ borderLeft: `4px solid ${CHANNEL_META.google_seo.color}` }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className={CHANNEL_META.google_seo.icon} style={{ color: CHANNEL_META.google_seo.color }}></i>
            Google GBP Completeness (Score: {googleChannel.sub_categories?.completeness?.score ?? 0}/100)
          </h3>
          {renderSubcats(googleChannel)}
          {googleChannel.completeness_checks && renderChecks(googleChannel.completeness_checks)}
          {renderEvidence(googleChannel, 'Google Maps')}
        </div>
      )}

      {/* Bing */}
      {bingChannel && (
        <div className="rv2-card" style={{ borderLeft: `4px solid ${CHANNEL_META.bing_seo.color}` }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className={CHANNEL_META.bing_seo.icon} style={{ color: CHANNEL_META.bing_seo.color }}></i>
            Bing Places Completeness (Score: {bingChannel.sub_categories?.completeness?.score ?? 0}/100)
          </h3>
          {renderSubcats(bingChannel)}
          {bingChannel.completeness_checks && renderChecks(bingChannel.completeness_checks)}
          {renderEvidence(bingChannel, 'Bing Search')}
        </div>
      )}

      {/* Aggregators */}
      {aggChannel && aggChannel.metrics && (
        <div className="rv2-card" style={{ borderLeft: `4px solid ${CHANNEL_META.aggregators.color}` }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className={CHANNEL_META.aggregators.icon} style={{ color: CHANNEL_META.aggregators.color }}></i>
            Aggregators Completeness (Score: {aggChannel.sub_categories?.completeness?.score ?? 0}/100)
          </h3>
          {renderSubcats(aggChannel)}
          {aggChannel.metrics.map((metric, idx) => {
            const val = metric.value?.toLowerCase() || '';
            let status = 'VERIFIED';
            if (val.includes('missing') || val.includes('not found') || val.includes('not integrated') || val.includes('unranked')) {
              status = 'MISSING';
            } else if (val.includes('conflict') || val.includes('mismatch')) {
              status = 'CONFLICTING';
            }
            return (
              <div className="rv2-check-item" key={idx}>
                <div className="rv2-check-info">
                  <span className="rv2-check-label">{metric.label}</span>
                  <span className="rv2-check-value">{metric.value}</span>
                </div>
                <div className="rv2-check-right">
                  <span className={`rv2-status rv2-status-${status}`}>{status === 'VERIFIED' ? 'Active' : status === 'MISSING' ? 'Missing' : 'Mismatched'}</span>
                  <span className="rv2-check-pts">{metric.points} pts</span>
                </div>
              </div>
            );
          })}
          {renderEvidence(aggChannel, 'Medical Aggregator')}
        </div>
      )}

      {/* Website & Schema */}
      {schemaChannel && schemaChannel.checks && (
        <div className="rv2-card" style={{ borderLeft: `4px solid ${CHANNEL_META.website_schema.color}` }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <i className={CHANNEL_META.website_schema.icon} style={{ color: CHANNEL_META.website_schema.color }}></i>
            Website &amp; Schema Compliance (Score: {schemaChannel.channel_percentage_score}%)
          </h3>
          {renderSubcats(schemaChannel)}
          {renderChecks(schemaChannel.checks)}
          {renderEvidence(schemaChannel, 'Website')}
        </div>
      )}
    </div>
  );
};
