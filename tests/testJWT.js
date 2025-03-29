import jwt from 'jsonwebtoken';
import { 
  generateToken, 
  generateRefreshToken, 
  verifyRefreshToken, 
  generateResetToken 
} from '../utils/jwtUtils.js';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

// Helper to log test results
const logResult = (testName, success, data = null) => {
  console.log(`\n----- ${testName} -----`);
  console.log(`Status: ${success ? '✅ SUCCESS' : '❌ FAILED'}`);
  if (data) {
    console.log('Data:', data);
  }
};

// Test JWT token generation and verification
const testJWTGeneration = () => {
  const userId = '60d0fe4f5311236168a109ca'; // Mock user ID
  
  try {
    // Generate access token
    const accessToken = generateToken(userId);
    const accessTokenValid = accessToken && typeof accessToken === 'string';
    logResult('Generate Access Token', accessTokenValid, { accessToken });
    
    // Verify access token
    const decodedAccessToken = jwt.verify(
      accessToken, 
      process.env.JWT_SECRET || 'fallback_jwt_secret_for_dev'
    );
    const accessTokenVerified = decodedAccessToken && decodedAccessToken.id === userId;
    logResult('Verify Access Token', accessTokenVerified, { decoded: decodedAccessToken });
    
    // Generate refresh token
    const refreshToken = generateRefreshToken(userId);
    const refreshTokenValid = refreshToken && typeof refreshToken === 'string';
    logResult('Generate Refresh Token', refreshTokenValid, { refreshToken });
    
    // Verify refresh token using utility
    const verificationResult = verifyRefreshToken(refreshToken);
    const refreshTokenVerified = verificationResult.valid && verificationResult.id === userId;
    logResult('Verify Refresh Token', refreshTokenVerified, verificationResult);
    
    // Test invalid token
    const invalidResult = verifyRefreshToken('invalid.token.string');
    const invalidCheckSuccessful = !invalidResult.valid;
    logResult('Reject Invalid Token', invalidCheckSuccessful, invalidResult);
    
    return accessTokenValid && accessTokenVerified && refreshTokenValid && refreshTokenVerified && invalidCheckSuccessful;
  } catch (error) {
    console.error('JWT test error:', error);
    return false;
  }
};

// Test password reset token functionality
const testResetToken = () => {
  try {
    // Generate reset token
    const resetToken = generateResetToken();
    const resetTokenValid = resetToken && typeof resetToken === 'string' && resetToken.length > 30;
    logResult('Generate Reset Token', resetTokenValid, { resetToken });
    
    // Hash reset token (simulating storage)
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    const hashedTokenValid = hashedToken && typeof hashedToken === 'string';
    logResult('Hash Reset Token', hashedTokenValid, { hashedToken });
    
    // Verify we can re-hash for verification
    const verificationHash = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    const hashVerified = verificationHash === hashedToken;
    logResult('Verify Reset Token Hash', hashVerified, { 
      original: hashedToken,
      verification: verificationHash,
      match: hashVerified
    });
    
    return resetTokenValid && hashedTokenValid && hashVerified;
  } catch (error) {
    console.error('Reset token test error:', error);
    return false;
  }
};

// Run all tests
const runTests = () => {
  console.log('🧪 Starting JWT Utility Tests 🧪');
  
  try {
    // Test JWT functionality
    const jwtSuccess = testJWTGeneration();
    console.log(`\nJWT Tests: ${jwtSuccess ? '✅ All tests passed' : '❌ Some tests failed'}`);
    
    // Test reset token functionality
    const resetSuccess = testResetToken();
    console.log(`\nReset Token Tests: ${resetSuccess ? '✅ All tests passed' : '❌ Some tests failed'}`);
    
    console.log('\n🏁 JWT Utility Tests Completed 🏁');
    
    return jwtSuccess && resetSuccess;
  } catch (error) {
    console.error('Test runner error:', error);
    return false;
  }
};

// Run tests
try {
  const success = runTests();
  process.exit(success ? 0 : 1);
} catch (error) {
  console.error('Unexpected error in test runner:', error);
  process.exit(1);
} 