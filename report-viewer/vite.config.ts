import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'serve-reports',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
            console.log(`[Vite Request] ${req.url}`);
            if (req.url && (
              req.url.startsWith('/reports/') || req.url.includes('/reports/') ||
              req.url.startsWith('/assets/') || req.url.includes('/assets/')
            )) {
              const urlPath = req.url.split('?')[0];
              const reportsIndex = urlPath.indexOf('/reports/');
              const assetsIndex = urlPath.indexOf('/assets/');
              const segmentIndex = reportsIndex !== -1 ? reportsIndex : assetsIndex;
              const cleanRelativePath = urlPath.substring(segmentIndex);
              const projectRoot = process.cwd();
              
              // Resolve paths
              let filePath = path.resolve(projectRoot, '..' + cleanRelativePath);
              if (assetsIndex !== -1 && (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile())) {
                // Try reports/v7/assets first
                const fallbackV7 = path.resolve(projectRoot, '../reports/v7' + cleanRelativePath);
                if (fs.existsSync(fallbackV7) && fs.statSync(fallbackV7).isFile()) {
                  filePath = fallbackV7;
                } else {
                  // Try reports/v6/assets second
                  const fallbackV6 = path.resolve(projectRoot, '../reports/v6' + cleanRelativePath);
                  if (fs.existsSync(fallbackV6) && fs.statSync(fallbackV6).isFile()) {
                    filePath = fallbackV6;
                  } else {
                    // Fallback to reports/v5/assets if not found in v6
                    const fallbackV5 = path.resolve(projectRoot, '../reports/v5' + cleanRelativePath);
                    if (fs.existsSync(fallbackV5) && fs.statSync(fallbackV5).isFile()) {
                      filePath = fallbackV5;
                    }
                  }
                }
              }
              
              console.log(`[Vite Report Serve] Request: ${req.url} | Resolved: ${filePath} | Exists: ${fs.existsSync(filePath)}`);
              
              if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
                const ext = path.extname(filePath).toLowerCase();
                let contentType = 'application/octet-stream';
                if (ext === '.json') contentType = 'application/json';
                else if (ext === '.png') contentType = 'image/png';
                else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
                else if (ext === '.gif') contentType = 'image/gif';
                else if (ext === '.svg') contentType = 'image/svg+xml';
                
                res.setHeader('Content-Type', contentType);
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.end(fs.readFileSync(filePath));
                return;
              }
            }
          next();
        });
      }
    }
  ],
  server: {
    port: 5175,
    host: true
  }
});
