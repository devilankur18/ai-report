import React from 'react';
import ReactDOM from 'react-dom/client';
import { ReportViewer } from './ReportViewer';

ReactDOM.createRoot(document.getElementById('report-root')!).render(
  <React.StrictMode>
    <ReportViewer />
  </React.StrictMode>
);
