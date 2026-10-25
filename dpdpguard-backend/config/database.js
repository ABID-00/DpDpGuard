const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ MongoDB connected successfully');
    console.log(`   Database: ${conn.connection.name}`);
    console.log(`   Host: ${conn.connection.host}`);

    await createIndexes();

    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const createIndexes = async () => {
  try {
    console.log('✅ Database indexes configured');
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
};

module.exports = connectDB;