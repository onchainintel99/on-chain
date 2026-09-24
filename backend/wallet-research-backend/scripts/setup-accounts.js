require("dotenv").config();
const connectDB = require("../src/config/db");
const User = require("../src/models/User");
const { hashPassword } = require("../src/utils/auth");

const accounts = [
  { name: "System Admin", email: "onchain.admin@gmail.com", password: "Admin@12345", role: "admin" },
  { name: "Manager Stage 1", email: "manager.stage1@gmail.com", password: "Manager1@12345", role: "manager1" },
  { name: "Manager Stage 2", email: "manager.stage2@gmail.com", password: "Manager2@12345", role: "manager2" }
];

async function main() {
  await connectDB();
  for (const account of accounts) {
    const email = account.email.toLowerCase();
    const exists = await User.findOne({ email });
    if (exists) { console.log(`Already exists: ${email}`); continue; }
    await User.create({ name: account.name, email, password: await hashPassword(account.password), role: account.role });
    console.log(`Created: ${email}`);
  }
  process.exit(0);
}
main().catch(err => { console.error(err); process.exit(1); });
