const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const session = require('express-session');
const MongoStore = require('connect-mongo');
require('dotenv').config();

// Connect to database
connectDB();

const app = express();

// Session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-secret-key-here',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions'
  }),
  cookie: {
    secure: false, // Set to true in production with HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
};

// Middleware
app.use(session(sessionConfig));
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