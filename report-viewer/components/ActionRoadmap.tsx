import React from 'react';
import { ReportSchema } from '../types/reportSchema';

interface Props {
  data: ReportSchema;
}

export const ActionRoadmap: React.FC<Props> = ({ data }) => {
  if (!data.treatment_plan || data.treatment_plan.length === 0) return null;

  return (
    <div className="rv2-page rv2-fade-in" id="rv2-roadmap">
      <h2 className="rv2-section-title">
        <i className="fas fa-prescription-bottle-medical"></i>
        <span>Growth Treatment Roadmap</span>
      </h2>
      <p className="rv2-section-intro">
        Prioritized clinical roadmap designed to bridge the gap between your real-world expertise and
        your digital/AI discoverability. Each pillar addresses specific vulnerabilities found during the scan.
      </p>

      <div className="rv2-treatment-grid">
        {data.treatment_plan.map((item, idx) => (
          <div className="rv2-treatment-card" key={idx}>
            <div className="rv2-treatment-num">Pillar 0{idx + 1}</div>
            <h4 className="rv2-treatment-pillar">
              <i className="fas fa-circle-nodes" style={{ color: 'var(--v2-accent)', marginRight: '0.4rem' }}></i>
              {item.pillar}
            </h4>
            <p className="rv2-treatment-desc">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};
