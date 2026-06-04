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
const leadsRoutes = require('./src/routes/leads');
const estimatesRoutes = require('./src/routes/estimates');
const jobsRoutes = require('./src/routes/jobs');
const customersRoutes = require('./src/routes/customers');
const membershipRoutes = require('./src/routes/membership');
const reputationRoutes = require('./src/routes/reputation');
const commissionRoutes = require('./src/routes/commission');
const velocityRoutes = require('./src/routes/velocity');
const forecastingRoutes = require('./src/routes/forecasting');
const territoryRoutes = require('./src/routes/territory');
const alertsRoutes = require('./src/routes/alerts');
const sopsRoutes = require('./src/routes/sops');
const unitEconomicsRoutes = require('./src/routes/unitEconomics');
const materialsRoutes = require('./src/routes/materials');
const pipelineRoutes = require('./src/routes/pipeline');

const { startAlertChecker } = require('./src/jobs/alertChecker');

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
app.use('/api/leads', leadsRoutes);
app.use('/api/estimates', estimatesRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/reputation', reputationRoutes);
app.use('/api/commission', commissionRoutes);
app.use('/api/velocity', velocityRoutes);
app.use('/api/forecasting', forecastingRoutes);
app.use('/api/territory', territoryRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/sops', sopsRoutes);
app.use('/api/unit-economics', unitEconomicsRoutes);
app.use('/api/materials', materialsRoutes);
app.use('/api/pipeline-stages', pipelineRoutes);

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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startAlertChecker();
});
