import mongoose from 'mongoose';
import { appConfig } from './app_config.js';

const connectDB = async () => {
  try {
    await mongoose.connect(appConfig.MONGO_URI);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

export default connectDB;