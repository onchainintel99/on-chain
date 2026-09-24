require("dotenv").config();
const connectDB = require("../src/config/db");
const User = require("../src/models/User");
const { hashPassword } = require("../src/utils/auth");
async function main() {
  const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error("Set ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD in .env before running create-admin.");
  await connectDB();
  const email = ADMIN_EMAIL.trim().toLowerCase();
  const exists = await User.findOne({ email });
  if (exists) throw new Error(`Email '${email}' already exists.`);
  await User.create({ name: ADMIN_NAME.trim(), email, password: await hashPassword(ADMIN_PASSWORD), role: "admin" });
  console.log(`Admin '${email}' created.`);
  process.exit(0);
}
main().catch((err) => { console.error(err.message); process.exit(1); });
