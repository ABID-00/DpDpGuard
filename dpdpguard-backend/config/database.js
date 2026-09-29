const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ MongoDB connected successfully');
    console.log(`   Database: ${conn.connection.db.getName()}`);
    console.log(`   Host: ${conn.connection.host}`);

    // Create indexes
    await createIndexes();

    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

const createIndexes = async () => {
  try {
    // Indexes will be created by models automatically
    console.log('✅ Database indexes configured');
  } catch (error) {
    console.error('Error creating indexes:', error);
  }
};

module.exports = connectDB;
