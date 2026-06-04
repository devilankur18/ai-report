import React from 'react';
import { fontFamilies } from './fonts';

interface ExpertBadgeProps {
  name: string;
  specialty: string;
  accentColor: string;
  style?: React.CSSProperties;
}

export const ExpertBadge: React.FC<ExpertBadgeProps> = ({
  name,
  specialty,
  accentColor,
  style,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(20px) saturate(140%)',
        WebkitBackdropFilter: 'blur(20px) saturate(140%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '20px',
        padding: '20px 28px',
        boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.4)',
        ...style,
      }}
    >
      <div
        style={{
          fontFamily: fontFamilies.sans,
          fontSize: '26px',
          fontWeight: 700,
          color: '#FFFFFF',
          letterSpacing: '-0.5px',
          marginBottom: '4px',
        }}
      >
        {name}
      </div>
      <div
        style={{
          fontFamily: fontFamilies.sans,
          fontSize: '15px',
          fontWeight: 600,
          color: accentColor,
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
        }}
      >
        {specialty}
      </div>
    </div>
  );
};
