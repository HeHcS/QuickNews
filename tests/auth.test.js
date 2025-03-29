import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../server.js';
import User from '../models/userModel.js';

let mongoServer;

// Mock user data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123'
};

// Tokens
let accessToken;
let refreshToken;
let resetToken;

// Setup and teardown
beforeAll(async () => {
  // Setup MongoDB memory server
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clear the database before each test
  await User.deleteMany({});
});

describe('Authentication Endpoints', () => {
  // Register tests
  describe('POST /api/auth/register', () => {
    it('should register a new user and return tokens', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      
      accessToken = res.body.accessToken;
      refreshToken = res.body.refreshToken;
    });
    
    it('should not register a user with an existing email', async () => {
      // Create a user first
      await User.create(testUser);
      
      // Try to create another user with the same email
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('success', false);
    });
    
    it('should validate input fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'invalid', password: '123' });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('errors');
    });
  });
  
  // Login tests
  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user before each test
      await User.create(testUser);
    });
    
    it('should login an existing user and return tokens', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      
      accessToken = res.body.accessToken;
      refreshToken = res.body.refreshToken;
    });
    
    it('should not login with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        });
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('success', false);
    });
  });
  
  // Refresh token tests
  describe('POST /api/auth/refresh-token', () => {
    beforeEach(async () => {
      // Create a test user and login to get tokens
      await User.create(testUser);
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });
      
      accessToken = res.body.accessToken;
      refreshToken = res.body.refreshToken;
    });
    
    it('should generate a new access token with valid refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('accessToken');
    });
    
    it('should not refresh token without providing a refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh-token')
        .send({});
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('success', false);
    });
  });
  
  // Get current user tests
  describe('GET /api/auth/me', () => {
    beforeEach(async () => {
      // Create a test user and login to get tokens
      await User.create(testUser);
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });
      
      accessToken = res.body.accessToken;
    });
    
    it('should return the current user when authenticated', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('email', testUser.email);
    });
    
    it('should not allow access without token', async () => {
      const res = await request(app).get('/api/auth/me');
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('success', false);
    });
  });
  
  // Forgot password tests
  describe('POST /api/auth/forgot-password', () => {
    beforeEach(async () => {
      // Create a test user
      await User.create(testUser);
    });
    
    it('should generate a reset token for existing user', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testUser.email });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('resetToken');
      
      resetToken = res.body.resetToken;
    });
    
    it('should not reveal if email exists or not', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      // Should not contain reset token for non-existent user
      expect(res.body).not.toHaveProperty('resetToken');
    });
  });
  
  // Note: Reset password tests are more complex due to the token generation
  // and would typically test the token verification logic
}); 