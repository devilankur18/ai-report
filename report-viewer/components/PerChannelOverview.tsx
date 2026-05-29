import React from 'react';
import { ReportSchema } from '../types/reportSchema';

const CHANNEL_META: Record<string, { icon: string; color: string }> = {
  google_seo: { icon: 'fab fa-google', color: '#3b82f6' },
  bing_seo: { icon: 'fab fa-microsoft', color: '#06b6d4' },
  aggregators: { icon: 'fas fa-hospital-user', color: '#ec4899' },
  conversational_ai: { icon: 'fas fa-robot', color: '#a855f7' },
  eeat_credentials: { icon: 'fas fa-award', color: '#f59e0b' },
  website_schema: { icon: 'fas fa-globe', color: '#10b981' },
};

const AI_PLATFORM_META: Record<string, { icon: string; color: string }> = {
  'ChatGPT': { icon: 'fas fa-robot', color: '#10a37f' },       // OpenAI Green
  'Gemini': { icon: 'fas fa-sparkles', color: '#8ab4f8' },      // Gemini Blue/Indigo
  'Meta AI': { icon: 'fas fa-infinity', color: '#0081fb' },     // Meta Blue
  'Grok': { icon: 'fas fa-brain', color: '#f3f4f6' },           // Grok White/Gray
};

interface Props {
  data: ReportSchema;
}

export const PerChannelOverview: React.FC<Props> = ({ data }) => {
  // Extract AI platforms from conversational_ai channel to render as individual first-class metrics
  const aiChannel = data.channels.find(c => c.id === 'conversational_ai');
  const aiPlatforms = aiChannel?.platforms || [];

  const itemsToRender: Array<{
    id: string;
    name: string;
    score: number;
    weight: number;
    icon: string;
    color: string;
    isAi: boolean;
  }> = [];

  // 1. Add individual AI apps first so they are seen first
  aiPlatforms.forEach(p => {
    const meta = AI_PLATFORM_META[p.name] || { icon: 'fas fa-robot', color: 'var(--v2-accent)' };
    itemsToRender.push({
      id: `ai_${p.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}`,
      name: `${p.name} AI Standing`,
      score: p.points ?? 0,
      weight: 10, // 40% parent weight split equally across 4 platforms
      icon: meta.icon,
      color: meta.color,
      isAi: true
    });
  });

  // If no platforms are found, keep the fallback conversational AI channel at the top
  if (aiPlatforms.length === 0 && aiChannel) {
    const meta = CHANNEL_META[aiChannel.id];
    itemsToRender.push({
      id: aiChannel.id,
      name: aiChannel.name,
      score: aiChannel.channel_percentage_score,
      weight: aiChannel.weight,
      icon: meta?.icon || 'fas fa-robot',
      color: meta?.color || '#a855f7',
      isAi: true
    });
  }

  // 2. Add all non-AI channels
  data.channels.forEach(ch => {
    if (ch.id === 'conversational_ai') return; // Skip parent conversational AI channel since it is expanded

    const meta = CHANNEL_META[ch.id];
    itemsToRender.push({
      id: ch.id,
      name: ch.name,
      score: ch.channel_percentage_score,
      weight: ch.weight,
      icon: meta?.icon || 'fas fa-shield',
      color: meta?.color || '#a855f7',
      isAi: false
    });
  });

  const categories = [
    {
      title: "AI Apps",
      icon: "fas fa-robot",
      color: "#22d3ee", // Cyan
      description: "Direct standing, citation quality, and brand recommendation across top LLM conversational search engines.",
      items: itemsToRender.filter(item => item.isAi)
    },
    {
      title: "Search Engine Optimization (SEO)",
      icon: "fas fa-magnifying-glass-chart",
      color: "#3b82f6", // Blue
      description: "Organic search visibility, rankings, and competitor capture across standard search engine crawlers.",
      items: itemsToRender.filter(item => !item.isAi && (item.id === 'google_seo' || item.id === 'bing_seo'))
    },
    {
      title: "Local Directory & E-E-A-T Foundation",
      icon: "fas fa-hospital",
      color: "#ec4899", // Pink
      description: "Trust signals, State Medical Council registry, medical directories, and local schema compliance.",
      items: itemsToRender.filter(item => !item.isAi && item.id !== 'google_seo' && item.id !== 'bing_seo')
    }
  ];

  return (
    <div className="rv2-page rv2-fade-in" id="rv2-channels">
      <h2 className="rv2-section-title">
        <i className="fas fa-cubes"></i>
        <span>Per-Channel Audit Performance</span>
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.25rem', marginTop: '1.5rem' }}>
        {categories.map((cat, catIdx) => {
          if (cat.items.length === 0) return null;
          return (
            <div 
              key={catIdx} 
              className="rv2-category-card" 
              style={{ 
                background: 'rgba(255, 255, 255, 0.02)', 
                border: '1px solid rgba(255, 255, 255, 0.05)', 
                borderRadius: '16px', 
                padding: '1.5rem',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
              }}
            >
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', margin: '0 0 0.5rem 0', fontFamily: 'Outfit, sans-serif', fontSize: '1.25rem', color: cat.color, fontWeight: 700 }}>
                <i className={cat.icon}></i>
                <span>{cat.title}</span>
              </h3>
              <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.9rem', color: '#94a3b8', lineHeight: '1.5' }}>
                {cat.description}
              </p>
              
              <div className="rv2-channel-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {cat.items.map((item) => (
                  <div 
                    className="rv2-channel-item" 
                    key={item.id} 
                    style={{ 
                      borderLeft: `4px solid ${item.color}`,
                      boxShadow: item.isAi ? `inset 0 0 12px ${item.color}15` : 'none',
                      margin: 0
                    }}
                  >
                    <div className="rv2-channel-header">
                      <div className="rv2-channel-name">
                        <i className={item.icon} style={{ color: item.color }}></i>
                        <span>{item.name}</span>
                        {item.isAi && <span style={{ fontSize: '0.7rem', background: `${item.color}20`, color: item.color, padding: '2px 6px', borderRadius: '4px', marginLeft: '6px', fontWeight: 600 }}>AI APP</span>}
                      </div>
                      <span className="rv2-channel-score" style={{ color: item.color }}>{item.score}%</span>
                    </div>
                    <div className="rv2-bar-track">
                      <div className="rv2-bar-fill" style={{ width: `${item.score}%`, backgroundColor: item.color }}></div>
                    </div>
                    <div className="rv2-channel-weight">Weight: {item.weight}%</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
