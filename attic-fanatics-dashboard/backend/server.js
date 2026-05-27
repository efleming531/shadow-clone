require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./src/routes/auth');
const funnelRoutes = require('./src/routes/funnel');
const salesRoutes = require('./src/routes/sales');
const callCenterRoutes = require('./src/routes/callCenter');
const usersRoutes = require('./src/routes/users');
const overviewRoutes = require('./src/routes/overview');
const apiConnectionsRoutes = require('./src/routes/apiConnections');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
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

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
