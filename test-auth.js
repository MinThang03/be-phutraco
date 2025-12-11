const bcrypt = require('bcrypt');

// Test password hash from migration
const hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5jtRkdwJo.YJu';
const password = 'admin@123456';

bcrypt.compare(password, hash, (err, result) => {
  console.log('Password test result:', result);
  console.log('If true, password is correct');
  console.log('If false, need to regenerate hash');
});

// Generate new hash
bcrypt.hash(password, 12, (err, newHash) => {
  console.log('\nNew hash for password "admin@123456":');
  console.log(newHash);
});
