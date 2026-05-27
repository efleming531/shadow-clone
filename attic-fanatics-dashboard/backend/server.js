require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const REQUIRED_ENV = ['JWT_SECRET', 'DATABASE_URL'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length) {
  console.error(`FATAL: Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const authRoutes = require('./src/routes/auth');
const funnelRoutes = require('./src/routes/funnel');
const salesRoutes = require('./src/routes/sales');
const callCenterRoutes = require('./src/routes/callCenter');
const usersRoutes = require('./src/routes/users');
const overviewRoutes = require('./src/routes/overview');
const apiConnectionsRoutes = require('./src/routes/apiConnections');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/overview', overviewRoutes);
app.use('/api/funnel', funnelRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/call-center', callCenterRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/api-connections', apiConnectionsRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

const distPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
}

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
