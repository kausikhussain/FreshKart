import mongoose from 'mongoose';
import { seedDatabase } from './seed';

export const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/freshkart';
  
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(mongoURI);
    console.log('MongoDB database connected successfully!');

    // Trigger seed after connection
    await seedDatabase();
  } catch (error) {
    console.error('Error connecting to MongoDB database:', error);
    console.warn('Backend is running in mock mode for orders. Database transactions will be skipped.');
  }
};
