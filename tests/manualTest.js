// This script tests the authentication components independently

import { 
  generateToken, 
  generateRefreshToken, 
  verifyRefreshToken, 
  generateResetToken 
} from '../utils/jwtUtils.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import fs from 'fs';

// Create a test results file
const logFile = './test-results.txt';
fs.writeFileSync(logFile, ''); // Clear existing file

// Log to file function
const logToFile = (message) => {
  fs.appendFileSync(logFile, message + '\n');
  console.log(message);
};

// Test JWT functionality
logToFile('\n\n=================================');
logToFile('TESTING AUTHENTICATION COMPONENTS');
logToFile('=================================\n');

// Track test results
let testsRun = 0;
let testsPassed = 0;

function recordTestResult(name, result, details = '') {
  testsRun++;
  if (result) testsPassed++;
  
  const status = result ? '✅ PASS' : '❌ FAIL';
  logToFile(`TEST [${testsRun}] ${name}: ${status}`);
  if (details) logToFile(`    Details: ${details}`);
}

logToFile('--- Testing JWT functionality ---');

// Create a mock user ID
const userId = '60d0fe4f5311236168a109ca';
logToFile('Using mock user ID: ' + userId);

// Generate tokens
logToFile('\nGenerating tokens...');
const accessToken = generateToken(userId);
const refreshToken = generateRefreshToken(userId);

recordTestResult(
  'Access Token Generation', 
  accessToken && typeof accessToken === 'string',
  `Token: ${accessToken?.substring(0, 20)}...`
);

recordTestResult(
  'Refresh Token Generation', 
  refreshToken && typeof refreshToken === 'string',
  `Token: ${refreshToken?.substring(0, 20)}...`
);

// Verify refresh token
logToFile('\nVerifying refresh token...');
const verification = verifyRefreshToken(refreshToken);
recordTestResult(
  'Refresh Token Verification',
  verification.valid && verification.id === userId,
  `Result: ${JSON.stringify(verification)}`
);

// Test invalid token
const invalidVerification = verifyRefreshToken('invalid.token.here');
recordTestResult(
  'Invalid Token Rejection',
  !invalidVerification.valid,
  `Result: ${JSON.stringify(invalidVerification)}`
);

// Test password reset token
logToFile('\n--- Testing password reset token ---');
logToFile('Generating reset token...');
const resetToken = generateResetToken();
recordTestResult(
  'Reset Token Generation',
  resetToken && typeof resetToken === 'string' && resetToken.length > 30,
  `Token: ${resetToken?.substring(0, 20)}...`
);

// Hash for storage
logToFile('\nHashing token for storage...');
const hashedToken = crypto
  .createHash('sha256')
  .update(resetToken)
  .digest('hex');
recordTestResult(
  'Token Hashing',
  hashedToken && typeof hashedToken === 'string',
  `Hashed: ${hashedToken?.substring(0, 20)}...`
);

// Test mock verification
logToFile('\nVerifying reset token...');
const verificationHash = crypto
  .createHash('sha256')
  .update(resetToken)
  .digest('hex');
recordTestResult(
  'Token Verification Hash',
  hashedToken === verificationHash,
  `Original: ${hashedToken?.substring(0, 10)}..., Verification: ${verificationHash?.substring(0, 10)}...`
);

// Test bcrypt functionality manually
logToFile('\n--- Testing bcrypt password hashing ---');
async function testBcrypt() {
  const password = 'password123';
  logToFile('Original Password: ' + password);
  
  // Hash the password
  logToFile('\nHashing password...');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  logToFile('Salt: ' + salt);
  logToFile('Hashed Password: ' + hashedPassword);
  
  recordTestResult(
    'Password Hashing',
    hashedPassword && typeof hashedPassword === 'string',
    `Result: ${hashedPassword?.substring(0, 20)}...`
  );
  
  // Verify correct password
  logToFile('\nVerifying correct password...');
  const isMatch = await bcrypt.compare(password, hashedPassword);
  recordTestResult(
    'Correct Password Verification',
    isMatch === true,
    `Match: ${isMatch}`
  );
  
  // Verify incorrect password
  logToFile('\nVerifying incorrect password...');
  const isWrongMatch = await bcrypt.compare('wrongpassword', hashedPassword);
  recordTestResult(
    'Incorrect Password Rejection',
    isWrongMatch === false,
    `Match: ${isWrongMatch}`
  );
  
  // Final report
  logToFile('\n=================================');
  logToFile(`TEST SUMMARY: ${testsPassed}/${testsRun} tests passed`);
  logToFile('=================================\n');
  
  return testsPassed === testsRun;
}

// Run bcrypt tests
logToFile('\nRunning bcrypt tests...');
testBcrypt().then(success => {
  logToFile(`\nTest suite ${success ? 'PASSED' : 'FAILED'}`);
  process.exit(success ? 0 : 1);
}); 