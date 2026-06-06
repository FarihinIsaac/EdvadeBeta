require("dotenv").config({ path: require("path").join(__dirname, "..", ".env") });
const bcrypt = require("bcryptjs");
const db = require("../db");

async function main() {
  const email = process.env.LECTURER_EMAIL || "lecturer@edvade.com";
  const password = process.env.LECTURER_PASSWORD || "lecturer123";
  const name = process.env.LECTURER_NAME || "Lecturer Admin";

  const [existing] = await db.query("SELECT id FROM users WHERE email=?", [email]);
  if (existing.length) {
    console.log(`Lecturer already exists: ${email}`);
    process.exit(0);
  }

  const hash = await bcrypt.hash(password, 10);
  await db.query(
    "INSERT INTO users(role, name, mobile, email, password_hash, points, level) VALUES('lecturer', ?, '', ?, ?, 0, 1)",
    [name, email, hash]
  );

  console.log(`Lecturer created: ${email} / ${password}`);
  console.log("Change the password after first login.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
