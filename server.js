const express = require('express');
const path = require('path');
const helmet = require('helmet');
const session = require('express-session');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic rate limiter for auth endpoints
const authLimiter = rateLimit({ windowMs: 60 * 1000, max: 10 });

// Session (MemoryStore for dev; not for production)
app.use(session({
  secret: process.env.SESSION_SECRET || 'change_this_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, secure: process.env.NODE_ENV === 'production' }
}));

// SQLite DB
const dbFile = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(dbFile);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    matricule TEXT,
    password TEXT,
    is_admin INTEGER DEFAULT 0,
    created_at TEXT
  )`);

  // Seed admin user if not exists
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminMatricule = process.env.ADMIN_MATRICULE || '000';
  const adminPassword = process.env.ADMIN_PASSWORD || 'adminpass';

  db.get('SELECT id FROM users WHERE email = ?', [adminEmail], async (err, row) => {
    if (err) return console.error('DB error:', err);
    if (!row) {
      const hash = await bcrypt.hash(adminPassword, 10);
      db.run('INSERT INTO users (email, matricule, password, is_admin, created_at) VALUES (?,?,?,?,datetime("now"))', [adminEmail, adminMatricule, hash, 1], (e) => {
        if (e) console.error('Failed to seed admin:', e);
        else console.log('Admin user seeded:', adminEmail);
      });
    }
  });
});

// Serve static files (site pages)
app.use(express.static(path.join(__dirname)));

// Helper - auth check
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.isAdmin) return next();
  return res.status(403).json({ error: 'Forbidden' });
}

// API: register
app.post('/api/register', authLimiter, async (req, res) => {
  const { email, matricule, password } = req.body || {};
  if (!email || !matricule || !password) return res.status(400).json({ error: 'Champs manquants' });
  if (!/^\d{3}$/.test(matricule)) return res.status(400).json({ error: 'Matricule doit être 3 chiffres' });
  if (typeof password !== 'string' || password.length < 8) return res.status(400).json({ error: 'Mot de passe trop court (≥8 caractères)' });

  db.get('SELECT id FROM users WHERE email = ? OR matricule = ?', [email, matricule], async (err, row) => {
    if (err) return res.status(500).json({ error: 'Erreur base de données' });
    if (row) return res.status(409).json({ error: 'Email ou matricule déjà utilisé' });

    try {
      const hash = await bcrypt.hash(password, 10);
      db.run('INSERT INTO users (email, matricule, password, created_at) VALUES (?,?,?,datetime("now"))', [email, matricule, hash], function (e) {
        if (e) return res.status(500).json({ error: 'Impossible d\'insérer l\'utilisateur' });
        return res.json({ success: true, id: this.lastID });
      });
    } catch (e) {
      return res.status(500).json({ error: 'Erreur serveur' });
    }
  });
});

// API: login
app.post('/api/login', authLimiter, (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Champs manquants' });

  db.get('SELECT id, password, is_admin FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Erreur base de données' });
    if (!user) return res.status(401).json({ error: 'Identifiants invalides' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'Identifiants invalides' });

    req.session.userId = user.id;
    req.session.isAdmin = !!user.is_admin;
    return res.json({ success: true, isAdmin: !!user.is_admin });
  });
});

app.post('/api/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

app.get('/api/me', (req, res) => {
  if (!req.session.userId) return res.json({ authenticated: false });
  db.get('SELECT id, email, matricule, is_admin, created_at FROM users WHERE id = ?', [req.session.userId], (err, user) => {
    if (err || !user) return res.json({ authenticated: false });
    return res.json({ authenticated: true, user });
  });
});

// Admin routes
app.get('/api/admin/users', requireAuth, requireAdmin, (req, res) => {
  db.all('SELECT id, email, matricule, is_admin, created_at FROM users ORDER BY id DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Erreur BD' });
    return res.json({ users: rows });
  });
});

app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
