const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    const email = 'admin@kcp.edu';
    const newPassword = 'admin123'; // change as needed
    const hashed = await bcrypt.hash(newPassword, 10);
    const user = await User.findOneAndUpdate(
      { email },
      { password: hashed },
      { new: true, upsert: true } // upsert creates if not exists
    );
    console.log('Admin password reset for', email);
    mongoose.disconnect();
  })
  .catch(err => console.error(err));