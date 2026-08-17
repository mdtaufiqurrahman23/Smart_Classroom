// backend/server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Routes
const authRoutes = require('./routes/auth');
// ADD YOUR ROUTE IMPORT ABOVE THIS LINE

const app = express();

// Middleware setup
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Debug middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Register API routes
app.use('/api/auth', authRoutes);
// ADD YOUR ROUTE REGISTRATION ABOVE THIS LINE

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'Backend Live! 🚀' });
});

// MongoDB connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-class-app';
mongoose.connect(mongoURI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// Server listening
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
