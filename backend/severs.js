// backend/severs.js
// Alias entry point for Node.js production server (Port 4000)
process.env.PORT = process.env.PORT || '4000';
import './dist/index.js';
