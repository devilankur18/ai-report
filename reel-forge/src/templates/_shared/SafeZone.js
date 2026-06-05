import { jsx as _jsx } from "react/jsx-runtime";
export const SafeZone = ({ show }) => {
    if (!show)
        return null;
    return (_jsx("div", { style: {
            position: 'absolute',
            left: (1080 - 900) / 2,
            top: (1920 - 1400) / 2,
            width: 900,
            height: 1400,
            border: '3px dashed rgba(255, 107, 53, 0.5)',
            pointerEvents: 'none',
            zIndex: 9999,
            boxSizing: 'border-box',
        }, children: _jsx("div", { style: {
                position: 'absolute',
                top: 15,
                left: 15,
                color: 'rgba(255, 107, 53, 0.8)',
                fontFamily: 'monospace',
                fontSize: 24,
                fontWeight: 'bold',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                padding: '4px 8px',
                borderRadius: 4,
            }, children: "9:16 Safe Zone (900x1400)" }) }));
};
