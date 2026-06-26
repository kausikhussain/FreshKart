import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.routes';
import { connectDB } from './config/db';
import { initSocket } from './socket';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// CORS setup
app.use(
  cors({
    origin: '*', // Allows cross-origin calls from local client development
    credentials: true
  })
);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Register API Routes
app.use('/api', apiRoutes);

// Database Connection
connectDB();

// Initialize Socket.io
const io = initSocket(server);
app.set('socketio', io); // Register Socket.io globally in Express app

// Port setup
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(`FreshKart Backend Server running on port ${PORT}`);
  console.log(`WebSockets listening for events`);
  console.log(`===================================================`);
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});
