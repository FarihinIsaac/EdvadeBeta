require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db");
const DEFAULT_PROFILE_PIC = "https://placehold.co/120x120/9CA3AF/FFFFFF?text=Avatar";
function profilePicUrl(url) {
  return url ? String(url) : DEFAULT_PROFILE_PIC;
}

const app = express();

const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);
app.use(express.json());

/* =========================
   AUTH MIDDLEWARE
========================= */
function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

function lecturerOnly(req, res, next) {
  if (req.user?.role !== "lecturer") {
    return res.status(403).json({ message: "Lecturer only" });
  }
  next();
}

/* =========================
   HEALTH
========================= */
app.get("/api/health", async (req, res) => {
  try {
    await db.query("SELECT 1");
    res.json({ ok: true, database: "connected" });
  } catch (err) {
    res.status(503).json({ ok: false, database: "disconnected", message: err.message });
  }
});

/* =========================
   AUTH: REGISTER / LOGIN
========================= */
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, mobile, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Missing fields" });
    }

    const [exists] = await db.query("SELECT id FROM users WHERE email=?", [email]);
    if (exists.length) return res.status(409).json({ message: "Email already registered" });

    const hash = await bcrypt.hash(password, 10);

    await db.query(
      "INSERT INTO users(role,name,mobile,email,password_hash,points,level) VALUES('student',?,?,?,?,0,1)",
      [name, mobile || null, email, hash]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("POST /api/auth/register error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const [rows] = await db.query(
      "SELECT id, role, name, email, password_hash, points, level FROM users WHERE email=?",
      [email]
    );
    if (!rows.length) return res.status(401).json({ message: "Invalid credentials" });

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        role: user.role,
        name: user.name,
        email: user.email,
        points: user.points,
        level: user.level
      }
    });
  } catch (err) {
    console.error("POST /api/auth/login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* =========================
   ANNOUNCEMENTS
   Requires table: announcements(id, title, message, author_id, published_at)
========================= */
app.get("/api/announcements", auth, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT a.id, a.title, a.message, a.published_at,
             u.name AS authorName, u.profile_pic AS authorPic
      FROM announcements a
      JOIN users u ON a.author_id = u.id
      ORDER BY a.published_at DESC
      LIMIT 1
    `);
    if (!rows.length) return res.json(null);

    const ann = rows[0];
    res.json({
      id: ann.id,
      title: ann.title,
      message: ann.message,
      author: ann.authorName,
      authorPic: profilePicUrl(ann.authorPic),
      publishedAt: ann.published_at
    });
  } catch (err) {
    console.error("GET /api/announcements error:", err);
    res.status(500).json({ message: "Failed to load announcement" });
  }
});

app.post("/api/announcements", auth, lecturerOnly, async (req, res) => {
  try {
    const { title, message } = req.body;
    if (!title || !message) return res.status(400).json({ message: "Title and message required" });

    await db.query(
      "INSERT INTO announcements(title, message, author_id) VALUES(?,?,?)",
      [title, message, req.user.id]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("POST /api/announcements error:", err);
    res.status(500).json({ message: "Failed to publish announcement" });
  }
});

/* =========================
   PROFILE (FIXES /api/profile)
   Requires columns:
   users.program, users.bio, users.profile_pic (optional)
========================= */
app.get("/api/profile", auth, async (req, res) => {
  try {
    const [[me]] = await db.query(
      "SELECT id, name, email, mobile, program, bio, profile_pic FROM users WHERE id=?",
      [req.user.id]
    );
    if (!me) return res.status(404).json({ message: "User not found" });

    res.json({
      studentId: me.id,
      fullName: me.name,
      email: me.email,
      phone: me.mobile || "",
      program: me.program || "",
      bio: me.bio || "",
      profilePic: profilePicUrl(me.profile_pic)
    });
  } catch (err) {
    console.error("GET /api/profile error:", err);
    res.status(500).json({ message: "Failed to load profile" });
  }
});

app.put("/api/profile", auth, async (req, res) => {
  try {
    const { fullName, phone, program, bio, profilePic } = req.body;

    // studentId should never be editable — use req.user.id
    await db.query(
      "UPDATE users SET name=?, mobile=?, program=?, bio=?, profile_pic=? WHERE id=?",
      [
        fullName || "",
        phone || null,
        program || null,
        bio || null,
        profilePic || null,
        req.user.id
      ]
    );

    const [[me]] = await db.query(
      "SELECT id, name, email, mobile, program, bio, profile_pic FROM users WHERE id=?",
      [req.user.id]
    );

    res.json({
      studentId: me.id,
      fullName: me.name,
      email: me.email,
      phone: me.mobile || "",
      program: me.program || "",
      bio: me.bio || "",
      profilePic: profilePicUrl(me.profile_pic)
    });
  } catch (err) {
    console.error("PUT /api/profile error:", err);
    res.status(500).json({ message: "Failed to save profile" });
  }
});

/* =========================
   MODULES (Student view locked/unlocked)
========================= */
app.get("/api/modules", auth, async (req, res) => {
  try {
    const [[me]] = await db.query("SELECT points FROM users WHERE id=?", [req.user.id]);
    const [mods] = await db.query(
      "SELECT id,title,description,order_no,unlock_points FROM modules ORDER BY order_no ASC"
    );

    res.json(
      mods.map(m => ({
        ...m,
        unlocked: (me?.points ?? 0) >= (m.unlock_points ?? 0)
      }))
    );
  } catch (err) {
    console.error("GET /api/modules error:", err);
    res.status(500).json({ message: "Failed to load modules" });
  }
});

/* =========================
   LECTURER: MODULE CRUD
========================= */
app.get("/api/lecturer/modules", auth, lecturerOnly, async (req, res) => {
  const [mods] = await db.query(
    "SELECT id,title,description,order_no,unlock_points FROM modules ORDER BY order_no ASC"
  );
  res.json(mods);
});

app.post("/api/lecturer/modules", auth, lecturerOnly, async (req, res) => {
  const { title, description, order_no, unlock_points } = req.body;
  if (!title) return res.status(400).json({ message: "title required" });

  let orderNo = Number(order_no);
  if (!orderNo) {
    const [[row]] = await db.query("SELECT COALESCE(MAX(order_no),0) AS maxOrder FROM modules");
    orderNo = Number(row.maxOrder) + 1;
  }

  const unlockPoints = Number(unlock_points ?? 0);

  const [r] = await db.query(
    "INSERT INTO modules(title, description, order_no, unlock_points) VALUES(?,?,?,?)",
    [title, description || "", orderNo, unlockPoints]
  );

  res.json({ ok: true, id: r.insertId });
});

app.patch("/api/lecturer/modules/:id", auth, lecturerOnly, async (req, res) => {
  const id = Number(req.params.id);
  const { title, description, order_no, unlock_points } = req.body;

  await db.query(
    "UPDATE modules SET title=?, description=?, order_no=?, unlock_points=? WHERE id=?",
    [title, description || "", Number(order_no ?? 1), Number(unlock_points ?? 0), id]
  );

  res.json({ ok: true });
});

app.delete("/api/lecturer/modules/:id", auth, lecturerOnly, async (req, res) => {
  const id = Number(req.params.id);
  await db.query("DELETE FROM questions WHERE module_id=?", [id]);
  await db.query("DELETE FROM modules WHERE id=?", [id]);
  res.json({ ok: true });
});

/* =========================
   QUIZ: STUDENT LOAD + SUBMIT
========================= */
app.get("/api/quiz/:moduleId", auth, async (req, res) => {
  try {
    const moduleId = Number(req.params.moduleId);
    const [qs] = await db.query(
      "SELECT id, prompt, a, b, c, d FROM questions WHERE module_id=? ORDER BY id ASC",
      [moduleId]
    );

    const [[attemptRow]] = await db.query(
      "SELECT COUNT(*) AS attemptCount FROM quiz_attempts WHERE user_id=? AND module_id=?",
      [req.user.id, moduleId]
    );
    const attemptsMade = attemptRow.attemptCount || 0;
    const maxAttempts = 3;
    const attemptsLeft = Math.max(0, maxAttempts - attemptsMade);

    res.json({
      questions: qs,
      attemptsMade,
      attemptsLeft,
      maxAttempts
    });
  } catch (err) {
    console.error("fetch quiz error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/quiz/:moduleId/fail", auth, async (req, res) => {
  try {
    const moduleId = Number(req.params.moduleId);
    const reason = req.body.reason || "tab_switch";

    const [[attemptRow]] = await db.query(
      "SELECT COUNT(*) AS attemptCount FROM quiz_attempts WHERE user_id=? AND module_id=?",
      [req.user.id, moduleId]
    );
    const attemptsMade = Number(attemptRow.attemptCount || 0);
    const maxAttempts = 3;
    if (attemptsMade >= maxAttempts) {
      return res.status(400).json({ message: "No attempts left for this quiz." });
    }

    const [[countRow]] = await db.query(
      "SELECT COUNT(*) AS total FROM questions WHERE module_id=?",
      [moduleId]
    );
    const total = Number(countRow.total || 0);

    await db.query(
      "INSERT INTO quiz_attempts(user_id,module_id,score,total) VALUES(?,?,?,?)",
      [req.user.id, moduleId, 0, total]
    );

    const newAttemptsMade = attemptsMade + 1;
    const attemptsLeft = Math.max(0, maxAttempts - newAttemptsMade);

    return res.json({
      failed: true,
      reason,
      score: 0,
      total,
      earnedPoints: 0,
      attemptsMade: newAttemptsMade,
      attemptsLeft,
      maxAttempts
    });
  } catch (err) {
    console.error("quiz fail error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/quiz/:moduleId/submit", auth, async (req, res) => {
  try {
    const moduleId = Number(req.params.moduleId);
    const answers = req.body.answers || {}; // {questionId: "A"}

    // Restrict attempts to 3 max
    const [[attemptRow]] = await db.query(
      "SELECT COUNT(*) AS attemptCount FROM quiz_attempts WHERE user_id=? AND module_id=?",
      [req.user.id, moduleId]
    );
    const attemptsMade = attemptRow.attemptCount || 0;
    if (attemptsMade >= 3) {
      return res.status(400).json({ message: "You have exceeded the maximum of 3 attempts for this quiz." });
    }

    const [rows] = await db.query(
      "SELECT id, correct FROM questions WHERE module_id=?",
      [moduleId]
    );

    const total = rows.length;
    let score = 0;

    for (const q of rows) {
      const given = (answers[q.id] || "").toUpperCase();
      if (given && given === String(q.correct || "").toUpperCase()) score++;
    }

    await db.query(
      "INSERT INTO quiz_attempts(user_id,module_id,score,total) VALUES(?,?,?,?)",
      [req.user.id, moduleId, score, total]
    );

    // ✅ define earned points
    const earned = score * 10;

    // ✅ add points
    await db.query(
      "UPDATE users SET points = points + ? WHERE id=?",
      [earned, req.user.id]
    );

    // ✅ get new points + current level
    const [[meAfterPoints]] = await db.query(
      "SELECT points, level FROM users WHERE id=?",
      [req.user.id]
    );

    // ✅ level rule: every 100 pts -> +1 level (starts at 1)
    const newLevel = Math.floor((meAfterPoints.points || 0) / 100) + 1;

    // ✅ update level if changed
    if ((meAfterPoints.level || 1) !== newLevel) {
      await db.query(
        "UPDATE users SET level=? WHERE id=?",
        [newLevel, req.user.id]
      );
    }

    // ✅ re-fetch final values for response
    const [[me]] = await db.query(
      "SELECT points, level FROM users WHERE id=?",
      [req.user.id]
    );

    // ✅ optional: assign badges (ignore if no table)
    try {
      const [badgeRows] = await db.query("SELECT id, points_required FROM badges");
      for (const b of badgeRows) {
        if ((me.points ?? 0) >= (b.points_required ?? 0)) {
          await db.query(
            "INSERT IGNORE INTO user_badges(user_id,badge_id) VALUES(?,?)",
            [req.user.id, b.id]
          );
        }
      }
    } catch (e) {
      // ignore missing badges tables
    }

    return res.json({
      score,
      total,
      earnedPoints: earned,
      totalPoints: me.points,
      level: me.level
    });

  } catch (err) {
    console.error("submit quiz error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});


/* =========================
   LECTURER: QUESTIONS CRUD
========================= */
app.get("/api/lecturer/modules/:moduleId/questions", auth, lecturerOnly, async (req, res) => {
  const moduleId = Number(req.params.moduleId);
  const [qs] = await db.query(
    "SELECT id, module_id, prompt, a, b, c, d, correct FROM questions WHERE module_id=? ORDER BY id ASC",
    [moduleId]
  );
  res.json(qs);
});

app.post("/api/lecturer/modules/:moduleId/questions", auth, lecturerOnly, async (req, res) => {
  const moduleId = Number(req.params.moduleId);
  const { prompt, a, b, c, d, correct } = req.body;

  if (!prompt || !a || !b || !c || !d || !correct) {
    return res.status(400).json({ message: "Missing fields" });
  }

  const corr = String(correct).toUpperCase();
  if (!["A", "B", "C", "D"].includes(corr)) {
    return res.status(400).json({ message: "correct must be A/B/C/D" });
  }

  const [r] = await db.query(
    "INSERT INTO questions(module_id, prompt, a, b, c, d, correct) VALUES (?,?,?,?,?,?,?)",
    [moduleId, prompt, a, b, c, d, corr]
  );

  res.json({ ok: true, id: r.insertId });
});

app.patch("/api/lecturer/questions/:id", auth, lecturerOnly, async (req, res) => {
  const id = Number(req.params.id);
  const { prompt, a, b, c, d, correct } = req.body;

  const corr = String(correct).toUpperCase();
  if (!["A", "B", "C", "D"].includes(corr)) {
    return res.status(400).json({ message: "correct must be A/B/C/D" });
  }

  await db.query(
    "UPDATE questions SET prompt=?, a=?, b=?, c=?, d=?, correct=? WHERE id=?",
    [prompt, a, b, c, d, corr, id]
  );

  res.json({ ok: true });
});

app.delete("/api/lecturer/questions/:id", auth, lecturerOnly, async (req, res) => {
  const id = Number(req.params.id);
  await db.query("DELETE FROM questions WHERE id=?", [id]);
  res.json({ ok: true });
});

/* =========================
   STUDENT DASHBOARD SUMMARY
========================= */
app.get("/api/me/summary", auth, async (req, res) => {
  try {
    const [[me]] = await db.query(
      "SELECT id, name, points, level FROM users WHERE id=?",
      [req.user.id]
    );
    if (!me) return res.status(404).json({ message: "User not found" });

    const [rows] = await db.query(
      `
      SELECT m.id AS moduleId, m.title,
             MAX(qa.score) AS bestScore,
             MAX(qa.total) AS total
      FROM modules m
      LEFT JOIN quiz_attempts qa
        ON qa.module_id = m.id AND qa.user_id = ?
      GROUP BY m.id
      ORDER BY m.order_no ASC
      `,
      [req.user.id]
    );

    const modulesProgress = rows.map(r => {
      const total = Number(r.total || 0);
      const best = Number(r.bestScore || 0);
      const pct = total > 0 ? Math.round((best / total) * 100) : 0;
      return { moduleId: r.moduleId, title: r.title, percent: pct };
    });

    // basic badges (your existing logic)
    const [[attemptRow]] = await db.query(
      "SELECT COUNT(*) AS c FROM quiz_attempts WHERE user_id=?",
      [req.user.id]
    );
    const attempts = Number(attemptRow.c || 0);

    const [[bestRow]] = await db.query(
      "SELECT MAX(score/NULLIF(total,0)) AS bestRatio FROM quiz_attempts WHERE user_id=? AND total>0",
      [req.user.id]
    );
    const bestRatio = Number(bestRow.bestRatio || 0);

    const badges = [];
    if (attempts >= 1) badges.push("Java Starter");
    if (bestRatio >= 0.8) badges.push("Quiz Master");

    res.json({ me, modulesProgress, badges });
  } catch (err) {
    console.error("GET /api/me/summary error:", err);
    res.status(500).json({ message: "Failed to load summary" });
  }
});

/* =========================
   LEADERBOARD
========================= */
app.get("/api/leaderboard", auth, async (req, res) => {
  try {
    const [[me]] = await db.query(
      "SELECT id, name, email, points, level, profile_pic FROM users WHERE id=?",
      [req.user.id]
    );
    if (!me) return res.status(404).json({ message: "User not found" });

    const [[rankRow]] = await db.query(
      "SELECT COUNT(*) AS ahead FROM users WHERE role='student' AND points > ?",
      [me.points]
    );
    const rank = Number(rankRow.ahead || 0) + 1;

    const [topStudents] = await db.query(
      `SELECT u.id, u.name, u.email, u.mobile, u.points, u.level, u.profile_pic,
              COUNT(qa.id) AS attempts,
              COALESCE(MAX(qa.score/NULLIF(qa.total,0)), 0) AS bestRatio
       FROM users u
       LEFT JOIN quiz_attempts qa ON qa.user_id = u.id
       WHERE u.role='student'
       GROUP BY u.id
       ORDER BY u.points DESC, u.level DESC
       LIMIT 20`
    );

    const [[attemptRow]] = await db.query(
      "SELECT COUNT(*) AS c FROM quiz_attempts WHERE user_id=?",
      [req.user.id]
    );
    const attempts = Number(attemptRow.c || 0);

    const [[bestRow]] = await db.query(
      "SELECT MAX(score/NULLIF(total,0)) AS bestRatio FROM quiz_attempts WHERE user_id=? AND total>0",
      [req.user.id]
    );
    const bestRatio = Number(bestRow.bestRatio || 0);

    const badges = [];
    if (attempts >= 1) badges.push("Java Starter");
    if (bestRatio >= 0.8) badges.push("Quiz Master");

    const topStudentsWithBadges = topStudents.map((student) => {
      const studentBadges = [];
      if (Number(student.attempts || 0) >= 1) studentBadges.push("Java Starter");
      if (Number(student.bestRatio || 0) >= 0.8) studentBadges.push("Quiz Master");
      return {
        id: student.id,
        name: student.name,
        email: student.email,
        mobile: student.mobile,
        points: student.points,
        level: student.level,
        profilePic: profilePicUrl(student.profile_pic),
        badges: studentBadges
      };
    });

    res.json({
      me: { ...me, rank, profilePic: profilePicUrl(me.profile_pic) },
      topStudents: topStudentsWithBadges,
      badges
    });
  } catch (err) {
    console.error("GET /api/leaderboard error:", err);
    res.status(500).json({ message: "Failed to load leaderboard" });
  }
});

/* =========================
   PUBLIC STUDENT PROFILE
========================= */
app.get("/api/users/:id", auth, async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ message: "Invalid user ID" });

    const [[user]] = await db.query(
      `SELECT id, name, email, mobile, points, level, profile_pic FROM users WHERE id=? AND role='student'`,
      [id]
    );
    if (!user) return res.status(404).json({ message: "Student not found" });

    const [[attemptRow]] = await db.query(
      "SELECT COUNT(*) AS c FROM quiz_attempts WHERE user_id=?",
      [id]
    );
    const [[bestRow]] = await db.query(
      "SELECT MAX(score/NULLIF(total,0)) AS bestRatio FROM quiz_attempts WHERE user_id=? AND total>0",
      [id]
    );

    const badges = [];
    if (Number(attemptRow.c || 0) >= 1) badges.push("Java Starter");
    if (Number(bestRow.bestRatio || 0) >= 0.8) badges.push("Quiz Master");

    const [[rankRow]] = await db.query(
      "SELECT COUNT(*) AS ahead FROM users WHERE role='student' AND points > ?",
      [user.points]
    );
    const rank = Number(rankRow.ahead || 0) + 1;

    res.json({
      ...user,
      profilePic: profilePicUrl(user.profile_pic),
      rank,
      badges,
      attempts: Number(attemptRow.c || 0),
      bestRatio: Number(bestRow.bestRatio || 0)
    });
  } catch (err) {
    console.error("GET /api/users/:id error:", err);
    res.status(500).json({ message: "Failed to load student profile" });
  }
});

/* =========================
   FORUM: POSTS + REPLIES + MODERATION
========================= */
app.get("/api/forum/posts", auth, async (req, res) => {
  const moduleId = Number(req.query.moduleId || 0);
  if (!moduleId) return res.status(400).json({ message: "moduleId required" });

  const isLecturer = req.user.role === "lecturer";

  const sql = `
    SELECT p.id, p.title, p.body, p.created_at, p.is_hidden,
           u.name AS authorName
    FROM forum_posts p
    JOIN users u ON u.id = p.user_id
    WHERE p.module_id = ?
      ${isLecturer ? "" : "AND p.is_hidden = 0"}
    ORDER BY p.created_at DESC
  `;
  const [rows] = await db.query(sql, [moduleId]);
  res.json(rows);
});

app.post("/api/forum/posts", auth, async (req, res) => {
  const { moduleId, title, body } = req.body;
  if (!moduleId || !title || !body) return res.status(400).json({ message: "Missing fields" });

  await db.query(
    "INSERT INTO forum_posts(module_id, user_id, title, body) VALUES (?,?,?,?)",
    [moduleId, req.user.id, title, body]
  );
  res.json({ ok: true });
});

app.get("/api/forum/posts/:id", auth, async (req, res) => {
  const postId = Number(req.params.id);
  const isLecturer = req.user.role === "lecturer";

  const [[post]] = await db.query(
    `
    SELECT p.id, p.module_id, p.title, p.body, p.created_at, p.is_hidden,
           u.name AS authorName
    FROM forum_posts p
    JOIN users u ON u.id = p.user_id
    WHERE p.id = ?
    ${isLecturer ? "" : "AND p.is_hidden = 0"}
    `,
    [postId]
  );

  if (!post) return res.status(404).json({ message: "Post not found" });

  const [replies] = await db.query(
    `
    SELECT r.id, r.body, r.created_at, r.is_hidden,
           u.name AS authorName
    FROM forum_replies r
    JOIN users u ON u.id = r.user_id
    WHERE r.post_id = ?
      ${isLecturer ? "" : "AND r.is_hidden = 0"}
    ORDER BY r.created_at ASC
    `,
    [postId]
  );

  res.json({ post, replies });
});

app.post("/api/forum/posts/:id/replies", auth, async (req, res) => {
  const postId = Number(req.params.id);
  const { body } = req.body;
  if (!body) return res.status(400).json({ message: "Reply body required" });

  await db.query(
    "INSERT INTO forum_replies(post_id, user_id, body) VALUES (?,?,?)",
    [postId, req.user.id, body]
  );

  res.json({ ok: true });
});

app.patch("/api/forum/posts/:id/hide", auth, lecturerOnly, async (req, res) => {
  const postId = Number(req.params.id);
  const { hide } = req.body;
  await db.query("UPDATE forum_posts SET is_hidden=? WHERE id=?", [hide ? 1 : 0, postId]);
  res.json({ ok: true });
});

app.patch("/api/forum/replies/:id/hide", auth, lecturerOnly, async (req, res) => {
  const replyId = Number(req.params.id);
  const { hide } = req.body;
  await db.query("UPDATE forum_replies SET is_hidden=? WHERE id=?", [hide ? 1 : 0, replyId]);
  res.json({ ok: true });
});

/* =========================
   COMMENTS (forum_comments)
========================= */
app.get("/api/forum/posts/:id/comments", auth, async (req, res) => {
  const postId = Number(req.params.id);
  const [rows] = await db.query(
    `
    SELECT c.id, c.body, c.created_at,
           u.name AS authorName, u.id AS authorId
    FROM forum_comments c
    JOIN users u ON u.id = c.user_id
    WHERE c.post_id = ?
    ORDER BY c.created_at ASC
    `,
    [postId]
  );
  res.json(rows);
});

app.post("/api/forum/posts/:id/comments", auth, async (req, res) => {
  const postId = Number(req.params.id);
  const { body } = req.body;
  if (!body || !body.trim()) return res.status(400).json({ message: "Comment required" });

  await db.query(
    "INSERT INTO forum_comments(post_id, user_id, body) VALUES (?,?,?)",
    [postId, req.user.id, body.trim()]
  );

  res.json({ ok: true });
});

/* =========================
   REACTIONS (forum_reactions)
   Assumes table supports:
   - post_id nullable
   - comment_id nullable
   - unique key (user_id, post_id) and (user_id, comment_id) OR a combined unique key.
========================= */
app.get("/api/forum/posts/:id/reactions", auth, async (req, res) => {
  const postId = Number(req.params.id);

  const [rows] = await db.query(
    `
    SELECT reaction, COUNT(*) AS count
    FROM forum_reactions
    WHERE post_id = ?
    GROUP BY reaction
    `,
    [postId]
  );

  const map = { like: 0, love: 0, funny: 0 };
  for (const r of rows) map[r.reaction] = Number(r.count);
  res.json(map);
});

app.post("/api/forum/posts/:id/reactions", auth, async (req, res) => {
  const postId = Number(req.params.id);
  const { reaction } = req.body;

  const allowed = ["like", "love", "funny"];
  if (!allowed.includes(reaction)) return res.status(400).json({ message: "Invalid reaction" });

  await db.query(
    `
    INSERT INTO forum_reactions (user_id, post_id, reaction)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE reaction = VALUES(reaction)
    `,
    [req.user.id, postId, reaction]
  );

  res.json({ ok: true });
});

app.get("/api/forum/comments/:id/reactions", auth, async (req, res) => {
  const commentId = Number(req.params.id);

  const [rows] = await db.query(
    `
    SELECT reaction, COUNT(*) AS count
    FROM forum_reactions
    WHERE comment_id = ?
    GROUP BY reaction
    `,
    [commentId]
  );

  const map = { like: 0, love: 0, funny: 0 };
  for (const r of rows) map[r.reaction] = Number(r.count);
  res.json(map);
});

app.post("/api/forum/comments/:id/reactions", auth, async (req, res) => {
  const commentId = Number(req.params.id);
  const { reaction } = req.body;

  const allowed = ["like", "love", "funny"];
  if (!allowed.includes(reaction)) return res.status(400).json({ message: "Invalid reaction" });

  await db.query(
    `
    INSERT INTO forum_reactions (user_id, comment_id, reaction)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE reaction = VALUES(reaction)
    `,
    [req.user.id, commentId, reaction]
  );

  res.json({ ok: true });
});

/* =========================
   LECTURER REPORTS
========================= */
app.get("/api/lecturer/reports/summary", auth, lecturerOnly, async (req, res) => {
  const [[stuRow]] = await db.query("SELECT COUNT(*) AS totalStudents FROM users WHERE role='student'");
  const [[attRow]] = await db.query("SELECT COUNT(*) AS totalAttempts FROM quiz_attempts");

  const [[avgRow]] = await db.query(`
    SELECT COALESCE(ROUND(AVG(score / NULLIF(total,0)) * 100, 0), 0) AS avgScorePct
    FROM quiz_attempts
  `);

  const [[ptsRow]] = await db.query(`
    SELECT COALESCE(ROUND(AVG(points),0), 0) AS avgPoints
    FROM users
    WHERE role='student'
  `);

  const [topStudents] = await db.query(`
    SELECT name, email, points, level
    FROM users
    WHERE role='student'
    ORDER BY points DESC
    LIMIT 5
  `);

  const [moduleStats] = await db.query(`
    SELECT
      m.id AS moduleId,
      m.title AS moduleTitle,
      COUNT(qa.id) AS attempts,
      COALESCE(ROUND(AVG(qa.score / NULLIF(qa.total,0)) * 100, 0), 0) AS avgScorePct
    FROM modules m
    LEFT JOIN quiz_attempts qa ON qa.module_id = m.id
    GROUP BY m.id, m.title
    ORDER BY m.order_no ASC
  `);

  res.json({
    totalStudents: stuRow.totalStudents,
    totalAttempts: attRow.totalAttempts,
    avgScorePct: avgRow.avgScorePct,
    avgPoints: ptsRow.avgPoints,
    topStudents,
    moduleStats
  });
});

app.get("/api/lecturer/reports/module/:moduleId", auth, lecturerOnly, async (req, res) => {
  const moduleId = Number(req.params.moduleId);

  const [[mod]] = await db.query("SELECT id, title, description FROM modules WHERE id=?", [moduleId]);
  if (!mod) return res.status(404).json({ message: "Module not found" });

  const [[sum]] = await db.query(`
    SELECT
      COUNT(*) AS attempts,
      COALESCE(ROUND(AVG(score / NULLIF(total,0)) * 100, 0), 0) AS avgScorePct,
      COALESCE(MAX(score),0) AS bestScore,
      COALESCE(MAX(total),0) AS totalQ
    FROM quiz_attempts
    WHERE module_id=?
  `, [moduleId]);

  const [latestAttempts] = await db.query(`
    SELECT
      qa.id,
      u.name,
      u.email,
      qa.score,
      qa.total,
      qa.created_at
    FROM quiz_attempts qa
    JOIN users u ON u.id = qa.user_id
    WHERE qa.module_id=?
    ORDER BY qa.created_at DESC
    LIMIT 20
  `, [moduleId]);

  const [studentAverages] = await db.query(`
    SELECT
      u.name,
      u.email,
      COUNT(*) AS attempts,
      COALESCE(ROUND(AVG(qa.score / NULLIF(qa.total,0)) * 100, 0), 0) AS avgScorePct
    FROM quiz_attempts qa
    JOIN users u ON u.id = qa.user_id
    WHERE qa.module_id=?
    GROUP BY u.id, u.name, u.email
    ORDER BY avgScorePct DESC
  `, [moduleId]);

  res.json({
    module: mod,
    summary: sum,
    latestAttempts,
    studentAverages
  });
});

// ===========================
// SETTINGS (DB)
// ===========================
app.get("/api/settings", auth, async (req, res) => {
  const [[row]] = await db.query(
    "SELECT theme, notify_email AS notifyEmail, notify_push AS notifyPush, language, timezone FROM users WHERE id=?",
    [req.user.id]
  );

  // defaults if columns are null
  res.json({
    theme: row?.theme || "light",
    notifyEmail: !!row?.notifyEmail,
    notifyPush: !!row?.notifyPush,
    language: row?.language || "en",
    timezone: row?.timezone || "UTC"
  });
});

app.put("/api/settings", auth, async (req, res) => {
  const { theme, notifyEmail, notifyPush, language, timezone } = req.body;

  await db.query(
    `UPDATE users
     SET theme=?, notify_email=?, notify_push=?, language=?, timezone=?
     WHERE id=?`,
    [
      theme === "dark" ? "dark" : "light",
      notifyEmail ? 1 : 0,
      notifyPush ? 1 : 0,
      language || "en",
      timezone || "UTC",
      req.user.id
    ]
  );

  res.json({ ok: true });
});

// ===========================
// CHANGE PASSWORD
// ===========================
app.post("/api/auth/change-password", auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ message: "Missing fields" });
  if (String(newPassword).length < 6) return res.status(400).json({ message: "Password too short" });

  const [[me]] = await db.query("SELECT password_hash FROM users WHERE id=?", [req.user.id]);
  if (!me) return res.status(404).json({ message: "User not found" });

  const ok = await bcrypt.compare(currentPassword, me.password_hash);
  if (!ok) return res.status(401).json({ message: "Current password is wrong" });

  const hash = await bcrypt.hash(newPassword, 10);
  await db.query("UPDATE users SET password_hash=? WHERE id=?", [hash, req.user.id]);

  res.json({ ok: true });
});

// ===========================
// DELETE ACCOUNT
// ===========================
app.delete("/api/account", auth, async (req, res) => {
  // Optional: delete related data first (attempts/posts/replies/etc)
  await db.query("DELETE FROM quiz_attempts WHERE user_id=?", [req.user.id]);
  await db.query("DELETE FROM forum_replies WHERE user_id=?", [req.user.id]);
  await db.query("DELETE FROM forum_posts WHERE user_id=?", [req.user.id]);
  await db.query("DELETE FROM user_badges WHERE user_id=?", [req.user.id]);

  await db.query("DELETE FROM users WHERE id=?", [req.user.id]);

  res.json({ ok: true });
});

app.get("/api/modules/:id", auth, async (req, res) => {
  const id = req.params.id;
  const [rows] = await db.query("SELECT id, title, description, order_no, unlock_points FROM modules WHERE id = ?", [id]);
  if (!rows.length) return res.status(404).json({ message: "Module not found" });
  res.json(rows[0]);
});

/* =========================
   SERVE FRONTEND (optional single-server deploy)
   Set SERVE_FRONTEND=true and place edvadefrontend next to edvade-backend
========================= */
if (process.env.SERVE_FRONTEND === "true") {
  const frontendPath = path.join(__dirname, "..", "edvadefrontend");
  app.use(express.static(frontendPath));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
  });
}

/* =========================
   START SERVER (MUST BE LAST)
========================= */
async function startServer() {
  try {
    await db.query("SELECT 1");
    console.log("MySQL connected");
  } catch (err) {
    console.error("MySQL connection failed:", err.message);
    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
    if (process.env.SERVE_FRONTEND === "true") {
      console.log("Serving frontend from ../edvadefrontend");
    }
  });
}

startServer();
