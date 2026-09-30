// backend/seedAdmin.js
// One-off script to create the admin account. Run manually: node seedAdmin.js
// Login uses email + password like everyone else; the model requires an
// email, so the admin's login email is admin@smartclass.local.
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const ADMIN_EMAIL = 'admin@smartclass.local';
const ADMIN_PASSWORD = 'admin-admin';
const ADMIN_NAME = 'admin';

async function seedAdmin() {
  await mongoose.connect(process.env.MONGODB_URI);

  const existing = await User.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    console.log('Admin account already exists:', ADMIN_EMAIL);
    process.exit(0);
  }

  const admin = new User({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD, // hashed automatically by the pre-save hook
    role: 'admin',
    status: 'active',
    name: ADMIN_NAME
  });

  await admin.save();
  console.log('✅ Admin account created');
  console.log('   Email:', ADMIN_EMAIL);
  console.log('   Password:', ADMIN_PASSWORD);
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error('❌ Failed to seed admin:', err.message);
  process.exit(1);
});
