import React from 'react';

interface Props {
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const BrandIcon: React.FC<Props> = ({ name, size = 16, className, style }) => {
  const normalizedName = name.toLowerCase();

  // Circular Lobe-style Avatar Wrapper
  const renderLobeIcon = (
    brandName: string,
    bg: string,
    svgPath: string,
    viewBox: string = "0 0 24 24"
  ) => {
    return (
      <div
        className={`lobe-icon lobe-icon-${brandName} ${className || ''}`}
        style={{
          width: size,
          height: size,
          borderRadius: '25%', // LobeHub squircle style (25% to 30% border-radius)
          background: bg,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255,255,255,0.15)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          flexShrink: 0,
          ...style
        }}
      >
        <svg
          viewBox={viewBox}
          style={{
            width: '60%', // Perfect inner logo sizing
            height: '60%',
            fill: '#ffffff',
            display: 'block'
          }}
        >
          <path d={svgPath} />
        </svg>
      </div>
    );
  };

  if (normalizedName.includes('chatgpt') || normalizedName.includes('openai')) {
    // LobeHub OpenAI / ChatGPT style (Green background + white spiral)
    const chatgptPath = "M21.3,10.4c0-0.6,0.1-1.2-0.1-1.8c-0.2-0.6-0.6-1.1-1.1-1.5c-0.2-0.2-0.5-0.3-0.8-0.4c0-0.4-0.1-0.8-0.3-1.1c-0.3-0.6-0.7-1-1.3-1.3c-0.6-0.3-1.2-0.4-1.8-0.3c-0.3,0-0.6,0.2-0.8,0.3c-0.2-0.4-0.4-0.7-0.7-0.9c-0.5-0.3-1.1-0.5-1.7-0.4c-0.6,0.1-1.1,0.3-1.5,0.7c-0.2,0.2-0.4,0.4-0.5,0.7C10.9,4,10.7,3.9,10.4,3.8c-0.6-0.1-1.2-0.1-1.8,0.1c-0.6,0.2-1.1,0.6-1.5,1.1c-0.2,0.2-0.3,0.5-0.4,0.8c-0.4,0-0.8,0.1-1.1,0.3C5,6.4,4.6,6.8,4.3,7.4c-0.3,0.6-0.4,1.2-0.3,1.8c0,0.3,0.2,0.6,0.3,0.8c-0.4,0.2-0.7,0.4-0.9,0.7C3,11.2,2.8,11.8,2.9,12.4c0.1,0.6,0.3,1.1,0.7,1.5c0.2,0.2,0.4,0.4,0.7,0.5c0,0.4,0.1,0.8,0.3,1.1C5,16,5.4,16.4,6,16.7c0.6,0.3,1.2,0.4,1.8,0.3c0.3,0,0.6-0.2,0.8-0.3c0.2,0.4,0.4,0.7,0.7,0.9c0.5,0.3,1.1,0.5,1.7,0.4c0.6-0.1,1.1-0.3,1.5-0.7c0.2-0.2,0.4-0.4,0.5-0.7c0.3,0.1,0.5,0.2,0.8,0.3c0.6,0.1,1.2,0.1,1.8-0.1c0.6-0.2,1.1-0.6,1.5-1.1c0.2-0.2,0.3-0.5,0.4-0.8c0.4,0,0.8-0.1,1.1-0.3c0.6-0.3,1-0.7,1.3-1.3c0.3-0.6,0.4-1.2,0.3-1.8C21.5,11,21.3,10.7,21.3,10.4z M12.8,18.7c-0.7,0-1.3-0.3-1.7-0.7c-0.1-0.1-0.2-0.3-0.3-0.4c0.1,0,0.2,0,0.3,0c1.4,0,2.6-0.7,3.3-1.7l1.7,1C15.3,18,14.1,18.7,12.8,18.7z M16.3,15.2l-1.7-1c0.3-0.5,0.4-1.1,0.4-1.7c0-0.4-0.1-0.8-0.2-1.2c0,0.1,0,0.2,0,0.3c0,1.4-0.7,2.6-1.7,3.3l1,1.7C15,16.1,15.7,15.7,16.3,15.2z M15.2,9.3c0-0.4-0.1-0.8-0.2-1.2c-0.3-0.5-0.8-0.9-1.3-1.1c-0.1-0.1-0.3-0.1-0.5-0.2c0.1,0.1,0.2,0.1,0.3,0.2c1.1,0.8,1.8,2.1,1.8,3.5l1.7-1C16.5,10.3,15.9,9.8,15.2,9.3z M11.2,6c0.7,0,1.3,0.3,1.7,0.7c0.1,0.1,0.2,0.3,0.3,0.4c-0.1,0-0.2,0-0.3,0c-1.4,0-2.6,0.7-3.3,1.7l-1.7-1C8.7,7,9.9,6,11.2,6z M7.7,9.5l1.7,1c-0.3,0.5-0.4,1.1-0.4,1.7c0,0.4,0.1,0.8,0.2,1.2c0-0.1,0-0.2,0-0.3c0-1.4,0.7-2.6,1.7-3.3l-1-1.7C9,8.6,8.3,9,7.7,9.5z M8.8,15.4c0,0.4,0.1,0.8,0.2,1.2c0.3,0.5,0.8,0.9,1.3,1.1c0.1,0.1,0.3,0.1,0.5,0.2c-0.1-0.1-0.2-0.1-0.3-0.2c-1.1-0.8-1.8-2.1-1.8-3.5l-1.7,1C7.5,14.4,8.1,14.9,8.8,15.4z";
    return renderLobeIcon('chatgpt', 'linear-gradient(135deg, #10a37f 0%, #067a5e 100%)', chatgptPath);
  }

  if (normalizedName.includes('gemini') || normalizedName.includes('google-gemini')) {
    // LobeHub Google Gemini style (Gorgeous blue/indigo/purple radial gradient + white sparkle star)
    const geminiPath = "M12 0c.142 6.643 5.357 11.858 12 12-6.643.142-11.858 5.357-12 12-.142-6.643-5.357-11.858-12-12 6.643-.142 11.858-5.357 12-12z";
    return renderLobeIcon('gemini', 'linear-gradient(135deg, #7b2cbf 0%, #3a86c8 50%, #00b4d8 100%)', geminiPath);
  }

  if (normalizedName.includes('meta')) {
    // LobeHub Meta AI style (Deep blue linear gradient + white infinity logo)
    const metaPath = "M16.924 6c-1.745 0-3.327.973-4.524 2.47C11.203 6.973 9.621 6 7.876 6 4.636 6 2 8.647 2 11.9c0 3.253 2.636 5.9 5.876 5.9 1.745 0 3.327-.973 4.524-2.47 1.197 1.497 2.779 2.47 4.524 2.47 3.24 0 5.876-2.647 5.876-5.9C22.8 8.647 20.164 6 16.924 6zm0 10c-2.176 0-3.957-1.847-3.957-4.1 0-2.253 1.781-4.1 3.957-4.1 2.176 0 3.957 1.847 3.957 4.1 0 2.253-1.781 4.1-3.957 4.1zm-9.048 0C5.7 16 3.919 14.153 3.919 11.9c0-2.253 1.781-4.1 3.957-4.1 2.176 0 3.957 1.847 3.957 4.1 0 2.253-1.781 4.1-3.957 4.1z";
    return renderLobeIcon('meta', 'linear-gradient(135deg, #0080fb 0%, #0052d4 100%)', metaPath);
  }

  if (normalizedName.includes('grok')) {
    // LobeHub Grok AI style (Sleek carbon black linear gradient + white Grok character)
    const grokPath = "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z";
    return renderLobeIcon('grok', 'linear-gradient(135deg, #1f1f1f 0%, #0a0a0a 100%)', grokPath);
  }

  return null;
};
