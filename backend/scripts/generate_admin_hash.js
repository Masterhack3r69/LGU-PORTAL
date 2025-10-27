// Generate bcrypt hash for admin password
const bcrypt = require('bcryptjs');

const password = 'admin123';
const saltRounds = 10;

bcrypt.hash(password, saltRounds, (err, hash) => {
  if (err) {
    console.error('Error generating hash:', err);
    return;
  }
  console.log('Password:', password);
  console.log('Bcrypt Hash:', hash);
  console.log('\nUse this hash in your seed_data.sql file');
});
