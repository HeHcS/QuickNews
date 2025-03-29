import mongoose from 'mongoose';
import User from '../models/userModel.js';
import { generateToken, generateRefreshToken } from '../utils/jwtUtils.js';
import dotenv from 'dotenv';

dotenv.config();

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/auth-test');
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    return false;
  }
};

// Test user model
const testUserModel = async () => {
  console.log('🧪 Testing User Model 🧪');
  
  // Create a test user
  const testUser = {
    name: 'Model Test User',
    email: 'modeltest@example.com',
    password: 'password123'
  };
  
  try {
    // Attempt to create the user
    const user = await User.create(testUser);
    console.log('\n✅ User created successfully');
    console.log('User ID:', user._id);
    console.log('Name:', user.name);
    console.log('Email:', user.email);
    console.log('Role:', user.role);
    
    // Test password hashing
    console.log('\nTesting password hashing...');
    const passwordMatches = await user.matchPassword('password123');
    console.log(`Password match: ${passwordMatches ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    const wrongPasswordMatches = await user.matchPassword('wrongpassword');
    console.log(`Wrong password rejection: ${!wrongPasswordMatches ? '✅ SUCCESS' : '❌ FAILED'}`);
    
    // Test JWT token generation
    console.log('\nTesting JWT token generation...');
    const accessToken = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    
    console.log(`Access Token: ${accessToken ? '✅ Generated' : '❌ Failed'}`);
    console.log(`Refresh Token: ${refreshToken ? '✅ Generated' : '❌ Failed'}`);
    
    // Clean up - delete the test user
    await User.deleteOne({ _id: user._id });
    console.log('\n✅ Test user deleted successfully');
    
    return true;
  } catch (error) {
    console.error('\n❌ User model test failed:', error);
    return false;
  }
};

// Run tests
const runTests = async () => {
  // Connect to MongoDB
  const connected = await connectDB();
  
  if (connected) {
    await testUserModel();
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('\nMongoDB disconnected');
  }
  
  console.log('\n🏁 User Model Tests Completed 🏁');
};

// Run the tests
runTests().catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
}); 