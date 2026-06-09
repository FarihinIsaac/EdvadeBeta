-- Edvade MySQL schema
-- Run: mysql -u root -p < schema.sql
-- Or import via phpMyAdmin / Railway / PlanetScale console

CREATE DATABASE IF NOT EXISTS edvade CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE edvade;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  role ENUM('student', 'lecturer') NOT NULL DEFAULT 'student',
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  mobile VARCHAR(30) DEFAULT '',
  password_hash VARCHAR(255) NOT NULL,
  points INT NOT NULL DEFAULT 0,
  level INT NOT NULL DEFAULT 1,
  program VARCHAR(120) DEFAULT '',
  bio TEXT,
  profile_pic VARCHAR(500) DEFAULT NULL,
  theme VARCHAR(20) DEFAULT 'light',
  difficulty_preference VARCHAR(30) DEFAULT 'beginner',
  topic_preference TEXT,
  notify_email TINYINT(1) DEFAULT 1,
  notify_push TINYINT(1) DEFAULT 1,
  language VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(64) DEFAULT 'UTC',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS announcements (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  author_id INT NOT NULL,
  published_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS modules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  order_no INT NOT NULL DEFAULT 1,
  unlock_points INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  module_id INT NOT NULL,
  prompt TEXT NOT NULL,
  a VARCHAR(500) NOT NULL,
  b VARCHAR(500) NOT NULL,
  c VARCHAR(500) NOT NULL,
  d VARCHAR(500) NOT NULL,
  correct CHAR(1) NOT NULL,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  module_id INT NOT NULL,
  score INT NOT NULL DEFAULT 0,
  total INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tab_switch_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  module_id INT NOT NULL,
  attempt_id INT,
  switch_count INT NOT NULL DEFAULT 0,
  failed TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
  FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS badges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  points_required INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS user_badges (
  user_id INT NOT NULL,
  badge_id INT NOT NULL,
  PRIMARY KEY (user_id, badge_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS forum_posts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  module_id INT NOT NULL,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  body TEXT NOT NULL,
  is_hidden TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS forum_replies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  body TEXT NOT NULL,
  is_hidden TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS forum_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  post_id INT NOT NULL,
  user_id INT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS forum_reactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  post_id INT DEFAULT NULL,
  comment_id INT DEFAULT NULL,
  reaction ENUM('like', 'love', 'funny') NOT NULL,
  UNIQUE KEY uq_user_post (user_id, post_id),
  UNIQUE KEY uq_user_comment (user_id, comment_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (post_id) REFERENCES forum_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (comment_id) REFERENCES forum_comments(id) ON DELETE CASCADE
);

-- Sample modules (optional)
INSERT INTO modules (title, description, order_no, unlock_points) VALUES
  ('Variables & Data Types', 'Java basics — variables and types', 1, 0),
  ('If / Else', 'Control flow and decisions', 2, 50),
  ('Loops', 'for and while loops', 3, 100),
  ('OOP Basics', 'Classes and objects', 4, 150)
ON DUPLICATE KEY UPDATE title = VALUES(title);

-- Create lecturer with: node scripts/seed-lecturer.js
