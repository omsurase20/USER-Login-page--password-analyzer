const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const db = require("./database");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

function validUsername(username) {
  const pattern = /^[a-z0-9._]+$/;

  if (!username || username.length < 3) return false;
  if (!pattern.test(username)) return false;
  if (username.startsWith(".") || username.startsWith("_")) return false;
  if (username.endsWith(".") || username.endsWith("_")) return false;
  if (username.includes(" ")) return false;

  return true;
}

function validPassword(password, username) {
  if (!password || password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[^A-Za-z0-9]/.test(password)) return false;
  if (username && password.toLowerCase().includes(username.toLowerCase())) return false;

  return true;
}

app.get("/", (req, res) => {
  res.json({ message: "Thirnex backend is running." });
});

app.post("/signup", async (req, res) => {
  const { username, email, password, answer1, answer2, answer3 } = req.body;

  if (!username || !email || !password || !answer1 || !answer2 || !answer3) {
    return res.status(400).json({ message: "All fields are required." });
  }

  if (!validUsername(username)) {
    return res.status(400).json({ message: "Invalid username format." });
  }

  if (!validPassword(password, username)) {
    return res.status(400).json({ message: "Password is not strong enough." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedAnswer1 = await bcrypt.hash(answer1.toLowerCase().trim(), 10);
    const hashedAnswer2 = await bcrypt.hash(answer2.toLowerCase().trim(), 10);
    const hashedAnswer3 = await bcrypt.hash(answer3.toLowerCase().trim(), 10);

    db.run(
      `INSERT INTO users 
      (username, email, password, answer1, answer2, answer3)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [username, email, hashedPassword, hashedAnswer1, hashedAnswer2, hashedAnswer3],
      function (err) {
        if (err) {
          return res.status(400).json({ message: "Username or email already exists." });
        }

        res.status(201).json({ message: "Account created successfully." });
      }
    );
  } catch {
    res.status(500).json({ message: "Server error during signup." });
  }
});

app.post("/login", async (req, res) => {
  const { user, password } = req.body;

  if (!user || !password) {
    return res.status(400).json({ message: "Username/email and password required." });
  }

  db.get(
    `SELECT * FROM users WHERE username = ? OR email = ?`,
    [user, user],
    async (err, foundUser) => {
      if (err) {
        return res.status(500).json({ message: "Database error." });
      }

      if (!foundUser) {
        return res.status(404).json({ message: "User not found." });
      }

      const isMatch = await bcrypt.compare(password, foundUser.password);

      if (!isMatch) {
        return res.status(401).json({ message: "Incorrect password." });
      }

      res.json({
        message: "Login successful.",
        username: foundUser.username
      });
    }
  );
});

app.post("/find-user", (req, res) => {
  const { username } = req.body;

  db.get(
    `SELECT username FROM users WHERE username = ?`,
    [username],
    (err, foundUser) => {
      if (err) {
        return res.status(500).json({ message: "Database error." });
      }

      if (!foundUser) {
        return res.status(404).json({ message: "Username not found." });
      }

      res.json({ message: "User found. Answer security questions." });
    }
  );
});

app.post("/reset-password", async (req, res) => {
  const { username, answer1, answer2, answer3, newPassword } = req.body;

  if (!username || !answer1 || !answer2 || !answer3 || !newPassword) {
    return res.status(400).json({ message: "All fields are required." });
  }

  db.get(
    `SELECT * FROM users WHERE username = ?`,
    [username],
    async (err, foundUser) => {
      if (err) {
        return res.status(500).json({ message: "Database error." });
      }

      if (!foundUser) {
        return res.status(404).json({ message: "User not found." });
      }

      const ans1Match = await bcrypt.compare(answer1.toLowerCase().trim(), foundUser.answer1);
      const ans2Match = await bcrypt.compare(answer2.toLowerCase().trim(), foundUser.answer2);
      const ans3Match = await bcrypt.compare(answer3.toLowerCase().trim(), foundUser.answer3);

      if (!ans1Match || !ans2Match || !ans3Match) {
        return res.status(401).json({ message: "Security answers are incorrect." });
      }

      if (!validPassword(newPassword, username)) {
        return res.status(400).json({ message: "New password is not strong enough." });
      }

      const sameAsCurrent = await bcrypt.compare(newPassword, foundUser.password);

      if (sameAsCurrent) {
        return res.status(400).json({
          message: "You cannot use your old password."
        });
      }

      const newHashedPassword = await bcrypt.hash(newPassword, 10);

      db.run(
        `UPDATE users 
         SET old_password = password, password = ? 
         WHERE username = ?`,
        [newHashedPassword, username],
        function (err) {
          if (err) {
            return res.status(500).json({ message: "Password reset failed." });
          }

          res.json({ message: "Password changed successfully. Login with new password." });
        }
      );
    }
  );
});

app.listen(PORT, () => {
  console.log(`Thirnex backend running on http://localhost:${PORT}`);
});