require('dotenv').config();
const mongoose = require('mongoose');

console.log('Testing connection to:', process.env.MONGO_URI.replace(/:([^:@]+)@/, ':****@'));

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ Database Authentication Successful!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Database Authentication Failed:', err.message);
    process.exit(1);
  });
