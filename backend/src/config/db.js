const mongoose = require('mongoose');

// Cache the connection promise across serverless invocations
let cachedConnection = null;

const connectDB = async () => {
  // If already connected, reuse the existing connection
  if (cachedConnection && mongoose.connection.readyState === 1) {
    return cachedConnection;
  }

  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('MONGO_URI environment variable is missing.');
      }
      console.warn('MONGO_URI is not set. Falling back to local default.');
    }
    const connectionString = mongoUri || 'mongodb://localhost:27017/syncscore';
    console.log('Connecting to MongoDB...');
    const conn = await mongoose.connect(connectionString, {
      serverSelectionTimeoutMS: 15000,
      socketTimeoutMS: 45000,
      bufferCommands: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    cachedConnection = conn;
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    if (process.env.NODE_ENV === 'production') {
      console.error('Fallback database options are disabled in production.');
      throw error;
    }
    console.log('Attempting fallback to In-Memory MongoDB Server...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const mongoUri = mongoServer.getUri();
      console.log(`Starting in-memory database at ${mongoUri}`);
      const conn = await mongoose.connect(mongoUri);
      console.log(`In-Memory MongoDB Connected: ${conn.connection.host}`);
      // Store reference to keep server alive
      process.mongoServer = mongoServer;
      cachedConnection = conn;
      return conn;
    } catch (fallbackError) {
      console.error(`Failed to start/connect to In-Memory MongoDB: ${fallbackError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
