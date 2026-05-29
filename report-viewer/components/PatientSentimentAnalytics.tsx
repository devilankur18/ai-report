import React from 'react';
import { ReportSchema } from '../types/reportSchema';

const CHANNEL_META: Record<string, { icon: string; color: string }> = {
  google_seo: { icon: 'fab fa-google', color: '#3b82f6' },
  bing_seo: { icon: 'fab fa-microsoft', color: '#06b6d4' },
  aggregators: { icon: 'fas fa-hospital-user', color: '#ec4899' },
};

interface Props {
  data: ReportSchema;
}

export const PatientSentimentAnalytics: React.FC<Props> = ({ data }) => {
  const sentimentChannels = data.channels.filter(c => c.sentiment_data);
  if (sentimentChannels.length === 0) return null;

  return (
    <div className="rv2-page rv2-fade-in" id="rv2-sentiment">
      <h2 className="rv2-section-title">
        <i className="fas fa-comments-dollar"></i>
        <span>Patient Reviews &amp; Sentiment Analytics Engine</span>
      </h2>
      <p className="rv2-section-intro">
        Side-by-side analysis of patient feedback volume, average scores, and organic rating velocity across all
        verified public directories. Review volume, velocity, and narrative success stories directly impact AI recommendations.
      </p>

      <div className="rv2-sentiment-grid">
        {sentimentChannels.map(channel => {
          const sd = channel.sentiment_data!;
          const meta = CHANNEL_META[channel.id];
          const sentimentScore = channel.sub_categories?.sentiment?.score;

          return (
            <div className="rv2-sentiment-tile" key={channel.id} style={{ borderTop: `3px solid ${meta?.color || 'var(--v2-accent)'}` }}>
              <div className="rv2-sentiment-tile-header">
                <i className={meta?.icon || 'fas fa-chart-bar'} style={{ color: meta?.color, fontSize: '1.1rem' }}></i>
                <h4>{channel.name}</h4>
                {sentimentScore !== undefined && (
                  <span style={{ marginLeft: 'auto', fontSize: '0.85rem', fontWeight: 700, color: meta?.color }}>
                    {sentimentScore}/100
                  </span>
                )}
              </div>
              <div className="rv2-metrics-grid">
                <div className="rv2-metric-box">
                  <span className="rv2-metric-val">{sd.total_reviews}</span>
                  <span className="rv2-metric-lbl">Total Reviews</span>
                </div>
                <div className="rv2-metric-box">
                  <span className="rv2-metric-val">{sd.average_rating} ★</span>
                  <span className="rv2-metric-lbl">Avg Rating</span>
                </div>
                <div className="rv2-metric-box">
                  <span className="rv2-metric-val">{sd.review_velocity_per_month} / mo</span>
                  <span className="rv2-metric-lbl">Review Velocity</span>
                </div>
                <div className="rv2-metric-box">
                  <span className="rv2-metric-val">{sd.narrative_success_stories}</span>
                  <span className="rv2-metric-lbl">Success Stories</span>
                </div>
              </div>
              {sd.points_breakdown && (
                <div className="rv2-breakdown">
                  <div className="rv2-breakdown-title">Points Allocation:</div>
                  <div className="rv2-breakdown-pills">
                    <span>Volume &amp; Rating: <strong>{sd.points_breakdown.review_volume_and_rating}</strong> pts</span>
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
  );
};
