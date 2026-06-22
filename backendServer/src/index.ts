import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health Check Route
app.get('/health', (req, res) => {
  res.json({ status: 'up', message: 'DevArena Arena Server Engine Live' });
});

// Create HTTP Server for Socket.io integration
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*', // We'll restrict this to our client URL later
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log(`⚡ User connected: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`🔥 Server is roaring on http://localhost:${PORT}`);
});