const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
require('dotenv').config();

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'eBay Price Adjuster API' });
});

// Import routes
const authRoutes = require('./routes/authRoutes');
const ebayRoutes = require('./routes/ebayRoutes');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/ebay', ebayRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});