const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const studentRoutes = require('./routes/studentRoute');

const app = express();
const PORT = 5003;

// Middleware
app.use(bodyParser.json());

// Routes
app.use('/api/students', studentRoutes);

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/studentDB')
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));

// Start the server
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
