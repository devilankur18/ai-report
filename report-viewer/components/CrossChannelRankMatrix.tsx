import React from 'react';
import { ReportSchema } from '../types/reportSchema';

interface Props {
  data: ReportSchema;
}

export const CrossChannelRankMatrix: React.FC<Props> = ({ data }) => {
  const searchChannels = data.channels.filter(c => c.queries && c.queries.length > 0);
  if (searchChannels.length === 0) return null;

  return (
    <div className="rv2-page rv2-fade-in" id="rv2-matrix">
      <h2 className="rv2-section-title">
        <i className="fas fa-magnifying-glass-chart"></i>
        <span>Cross-Channel Search Rank Matrix</span>
      </h2>
      <p className="rv2-section-intro">
        Search ranking positions across Google and Bing for 6 standard generic queries. Unranked means the doctor
        does not appear in the first 30+ results — the clinic is essentially invisible to patients searching for these terms.
      </p>

      <div className="rv2-card">
        <div className="rv2-matrix-wrap">
          <table className="rv2-matrix">
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
                    <td style={{ fontWeight: 600 }}>{qText}</td>
                    {searchChannels.map(ch => {
                      const qData = ch.queries?.[qIdx];
                      const isUnranked = qData?.rank === 'Unranked' || qData?.rank === null || qData?.rank === undefined;
                      return (
                        <td key={ch.id}>
                          <span className={`rv2-rank-pill ${isUnranked ? 'rv2-rank-unranked' : 'rv2-rank-ranked'}`}>
                            {isUnranked ? 'Unranked' : `#${qData!.rank}`}
                          </span>
                          <div style={{ fontSize: '0.7rem', color: 'var(--v2-text-secondary)', marginTop: '0.1rem' }}>
                            {qData?.points || 0} pts
                          </div>
                        </td>
                      );
                    })}
                    <td>
                      <ul className="rv2-comp-list">
                        {topCompetitors.map((comp, cIdx) => (
                          <li key={cIdx}><strong>#{comp.rank}</strong> {comp.name}</li>
                        ))}
                        {topCompetitors.length === 0 && (
                          <li style={{ fontStyle: 'italic' }}>No competitors indexed</li>
                        )}
                      </ul>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
