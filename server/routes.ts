import express from 'express';
import multer from 'multer';
import os from 'os';
import path from 'path';
import fs from 'fs';
import rateLimit from 'express-rate-limit';
import { db, logAudit, sanitizePlainText, sanitizeRichHtml } from './db.ts';
import {
  type AuthRequest,
  type RoleName,
  hashPassword,
  isAdmin,
  isStaff,
  optionalAuth,
  requireAuth,
  requireRoles,
  signToken,
  verifyPassword,
  getUserWithRoles,
} from './auth.ts';

const isServerless = Boolean(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME);
const uploadsDir = isServerless
  ? path.join(os.tmpdir(), 'aqllimahalla_uploads')
  : path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 32);
    cb(null, `${Date.now()}_${safeBase}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      return cb(new Error('Faqat JPG, PNG, WEBP, GIF yoki PDF fayllarga ruxsat etiladi'));
    }
    cb(null, true);
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  keyGenerator: (req) =>
    String(
      req.headers['x-nf-client-connection-ip'] ||
        req.headers['x-forwarded-for'] ||
        req.ip ||
        'client'
    )
      .split(',')[0]
      .trim(),
  validate: false,
  message: { error: 'Juda ko‘p urinish. Birozdan so‘ng qayta urinib ko‘ring.' },
});

export function createApiRouter() {
  const router = express.Router();

  // ---------------- AUTH ----------------
  router.post('/auth/register', authLimiter, (req, res) => {
    const username = sanitizePlainText(req.body.username || '').trim();
    const password = String(req.body.password || '');

    if (!username || !/^[a-zA-Z0-9._-]{3,32}$/.test(username)) {
      return res.status(400).json({
        error: 'Login kamida 3 ta lotin harfi yoki raqamdan iborat bo‘lishi kerak (bo‘sh joysiz)',
      });
    }
    if (password.length < 6) {
      return res.status(400).json({
        error: 'Parol kamida 6 ta belgidan iborat bo‘lishi kerak',
      });
    }

    const existing = db
      .prepare('SELECT id FROM users WHERE lower(username) = lower(?)')
      .get(username);
    if (existing) {
      return res.status(409).json({
        error: 'Ushbu login allaqachon band. Boshqa login tanlang',
      });
    }

    const tx = db.transaction(() => {
      const info = db
        .prepare(
          `INSERT INTO users (username, first_name, last_name, phone, email, password_hash, address, house_number, extra_info, profile_completed, is_active)
           VALUES (?, '', '', NULL, NULL, ?, '', '', '', 0, 1)`
        )
        .run(username, hashPassword(password));

      const userId = Number(info.lastInsertRowid);
      const roleRow = db.prepare(`SELECT id FROM roles WHERE name = 'fuqaro'`).get() as {
        id: number;
      };
      db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)').run(
        userId,
        roleRow.id
      );

      db.prepare(
        `INSERT INTO notifications (user_id, title, message, type, link)
         VALUES (?, ?, ?, 'info', '/cabinet')`
      ).run(
        userId,
        'AqlliMahalla platformasiga xush kelibsiz!',
        'Hisobingiz yaratildi. Endi murojaat yuborish va tadbirlarga yozilishingiz mumkin.'
      );
      return userId;
    });

    const userId = tx();
    const user = getUserWithRoles(userId);
    const token = signToken(userId);
    res.status(201).json({ token, user });
  });

  router.post('/auth/login', authLimiter, (req, res) => {
    const identifier = sanitizePlainText(req.body.identifier ?? req.body.username ?? '').trim();
    const password = String(req.body.password || '');

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Login va parolni kiriting' });
    }

    const cleanPhone = identifier.replace(/\s+/g, '');
    const row = db
      .prepare(
        "SELECT * FROM users WHERE lower(username) = lower(?) OR (email IS NOT NULL AND lower(email) = lower(?)) OR (phone IS NOT NULL AND replace(phone, ' ', '') = ?)"
      )
      .get(identifier, identifier, cleanPhone) as
      | { id: number; password_hash: string; is_active: number }
      | undefined;

    if (!row || !verifyPassword(password, row.password_hash)) {
      return res.status(401).json({ error: 'Login yoki parol noto‘g‘ri' });
    }
    if (!row.is_active) {
      return res.status(403).json({ error: 'Hisobingiz vaqtincha bloklangan. Mahalla ma’muriyatiga murojaat qiling.' });
    }

    const user = getUserWithRoles(row.id);
    const token = signToken(row.id);
    res.json({ token, user });
  });

  router.post('/auth/forgot-password', authLimiter, (req, res) => {
    const identifier = sanitizePlainText(req.body.identifier || '');
    if (!identifier) {
      return res.status(400).json({ error: 'Login yoki telefon raqamingizni kiriting' });
    }
    res.json({
      message:
        "Parolni tiklash so'rovi mahalla ma'muriyatiga yuborildi. Tasdiqlash ma'lumoti bo'yicha mas'ullar bog'lanadi.",
    });
  });

  router.get('/auth/me', requireAuth, (req: AuthRequest, res) => {
    res.json({ user: req.user });
  });

  router.put('/auth/profile', requireAuth, (req: AuthRequest, res) => {
    // Allow avatar-only upload updates cleanly
    if (req.body.avatar_url !== undefined && req.body.first_name === undefined && req.body.address === undefined) {
      const avatar_url = sanitizePlainText(req.body.avatar_url || '');
      db.prepare(`UPDATE users SET avatar_url = ?, updated_at = datetime('now') WHERE id = ?`).run(
        avatar_url,
        req.user!.id
      );
      const updated = getUserWithRoles(req.user!.id);
      return res.json({ user: updated });
    }

    const first_name = sanitizePlainText(req.body.first_name ?? req.user!.first_name);
    const last_name = sanitizePlainText(req.body.last_name ?? req.user!.last_name);
    const rawPhone = sanitizePlainText(req.body.phone ?? req.user!.phone ?? '').replace(/\s+/g, '');
    const rawEmail = sanitizePlainText(req.body.email ?? req.user!.email ?? '').toLowerCase();
    const address = sanitizePlainText(req.body.address ?? req.user!.address);
    const house_number = sanitizePlainText(req.body.house_number ?? req.user!.house_number ?? '');
    const extra_info = sanitizePlainText(req.body.extra_info ?? req.user!.extra_info ?? '');
    const avatar_url = sanitizePlainText(req.body.avatar_url ?? req.user!.avatar_url);

    if (!first_name || !last_name || !address || !house_number) {
      return res.status(400).json({ error: "Ism, familiya, manzil va uy raqamini kiriting" });
    }

    const phoneVal = rawPhone || null;
    const emailVal = rawEmail || null;

    if (phoneVal) {
      const conflictPhone = db
        .prepare('SELECT id FROM users WHERE phone = ? AND id != ?')
        .get(phoneVal, req.user!.id);
      if (conflictPhone) {
        return res.status(409).json({ error: 'Ushbu telefon raqami boshqa foydalanuvchiga tegishli' });
      }
    }
    if (emailVal) {
      const conflictEmail = db
        .prepare('SELECT id FROM users WHERE lower(email) = lower(?) AND id != ?')
        .get(emailVal, req.user!.id);
      if (conflictEmail) {
        return res.status(409).json({ error: 'Ushbu elektron pochta boshqa foydalanuvchiga tegishli' });
      }
    }

    db.prepare(
      `UPDATE users
       SET first_name = ?, last_name = ?, phone = ?, email = ?, address = ?, house_number = ?, extra_info = ?, avatar_url = ?, profile_completed = 1, updated_at = datetime('now')
       WHERE id = ?`
    ).run(first_name, last_name, phoneVal, emailVal, address, house_number, extra_info, avatar_url, req.user!.id);

    const updated = getUserWithRoles(req.user!.id);
    res.json({ user: updated });
  });

  router.put('/auth/password', requireAuth, (req: AuthRequest, res) => {
    const current_password = String(req.body.current_password || '');
    const new_password = String(req.body.new_password || '');
    if (new_password.length < 6) {
      return res.status(400).json({ error: 'Yangi parol kamida 6 ta belgidan iborat bo‘lishi kerak' });
    }
    const row = db
      .prepare('SELECT password_hash FROM users WHERE id = ?')
      .get(req.user!.id) as { password_hash: string };

    if (!verifyPassword(current_password, row.password_hash)) {
      return res.status(400).json({ error: 'Joriy parol noto‘g‘ri' });
    }

    db.prepare(`UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?`).run(
      hashPassword(new_password),
      req.user!.id
    );
    res.json({ message: 'Parol muvaffaqiyatli yangilandi' });
  });

  // ---------------- UPLOAD ----------------
  router.post('/upload', requireAuth, (req: AuthRequest, res) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        return res.status(400).json({ error: err.message || 'Fayl yuklashda xatolik' });
      }
      if (!req.file) {
        return res.status(400).json({ error: 'Fayl tanlanmadi' });
      }
      if (isServerless && req.file.mimetype.startsWith('image/')) {
        try {
          const buf = fs.readFileSync(req.file.path);
          const dataUrl = `data:${req.file.mimetype};base64,${buf.toString('base64')}`;
          fs.unlinkSync(req.file.path);
          return res.json({ url: dataUrl });
        } catch {
          // fallback to file url
        }
      }
      res.json({ url: `/uploads/${req.file.filename}` });
    });
  });

  // ---------------- HOME & SETTINGS & SEARCH ----------------
  router.get('/home', optionalAuth, (req: AuthRequest, res) => {
    const settings = db.prepare('SELECT * FROM mahalla_settings WHERE id = 1').get() as Record<string, unknown>;
    const announcementsCount = (db.prepare('SELECT COUNT(*) as c FROM announcements').get() as { c: number }).c;
    const appealsCount = (db.prepare('SELECT COUNT(*) as c FROM appeals').get() as { c: number }).c;
    const usersCount = (db.prepare('SELECT COUNT(*) as c FROM users WHERE is_active = 1').get() as { c: number }).c;
    const today = new Date().toISOString().slice(0, 10);
    const upcomingEventsCount = (
      db.prepare('SELECT COUNT(*) as c FROM events WHERE event_date >= ?').get(today) as { c: number }
    ).c;

    const latestNews = db
      .prepare(
        `SELECT n.*, nc.name as category_name, nc.slug as category_slug,
                u.first_name || ' ' || u.last_name as author_name
         FROM news n
         JOIN news_categories nc ON nc.id = n.category_id
         LEFT JOIN users u ON u.id = n.author_id
         WHERE n.status = 'published'
         ORDER BY n.published_at DESC LIMIT 3`
      )
      .all();

    const upcomingEvents = db
      .prepare(
        `SELECT e.*,
                (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id) as participants_count
         FROM events e
         WHERE e.event_date >= ?
         ORDER BY e.event_date ASC LIMIT 4`
      )
      .all(today);

    const importantAnnouncements = db
      .prepare(
        `SELECT a.*, ac.name as category_name, ac.slug as category_slug
         FROM announcements a
         JOIN announcement_categories ac ON ac.id = a.category_id
         ORDER BY a.is_important DESC, a.published_at DESC LIMIT 3`
      )
      .all();

    const activePoll = db
      .prepare('SELECT * FROM polls WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1')
      .get() as { id: number; question: string; description: string } | undefined;

    let pollWithOptions = null;
    if (activePoll) {
      const options = db
        .prepare(
          `SELECT po.id, po.option_text,
                  (SELECT COUNT(*) FROM poll_votes pv WHERE pv.option_id = po.id) as votes
           FROM poll_options po WHERE po.poll_id = ?`
        )
        .all(activePoll.id);
      let userVote = null;
      if (req.user) {
        const v = db
          .prepare('SELECT option_id FROM poll_votes WHERE poll_id = ? AND user_id = ?')
          .get(activePoll.id, req.user.id) as { option_id: number } | undefined;
        userVote = v?.option_id ?? null;
      }
      pollWithOptions = { ...activePoll, options, user_voted_option_id: userVote };
    }

    res.json({
      settings,
      stats: {
        population_count: Number(settings?.population_count || 1248),
        registered_citizens: usersCount,
        new_announcements: announcementsCount,
        appeals_count: appealsCount,
        upcoming_events_count: upcomingEventsCount,
      },
      latestNews,
      upcomingEvents,
      importantAnnouncements,
      activePoll: pollWithOptions,
    });
  });

  router.get('/settings', (_req, res) => {
    const settings = db.prepare('SELECT * FROM mahalla_settings WHERE id = 1').get();
    res.json({ settings });
  });

  router.put('/settings', requireAuth, requireRoles(['super_admin', 'mahalla_raisi']), (req: AuthRequest, res) => {
    const body = req.body;
    db.prepare(
      `UPDATE mahalla_settings SET
        mahalla_name = ?,
        tagline = ?,
        hero_description = ?,
        population_count = ?,
        history = ?,
        chairman_name = ?,
        chairman_bio = ?,
        chairman_phone = ?,
        address = ?,
        phone = ?,
        email = ?,
        activities = ?,
        staff_json = ?,
        social_links_json = ?,
        banner_text = ?,
        banner_link = ?,
        map_lat = ?,
        map_lng = ?,
        updated_at = datetime('now')
       WHERE id = 1`
    ).run(
      sanitizePlainText(body.mahalla_name),
      sanitizePlainText(body.tagline),
      sanitizePlainText(body.hero_description),
      Number(body.population_count) || 1248,
      sanitizePlainText(body.history),
      sanitizePlainText(body.chairman_name),
      sanitizePlainText(body.chairman_bio),
      sanitizePlainText(body.chairman_phone),
      sanitizePlainText(body.address),
      sanitizePlainText(body.phone),
      sanitizePlainText(body.email),
      sanitizePlainText(body.activities),
      typeof body.staff_json === 'string' ? body.staff_json : JSON.stringify(body.staff_json || []),
      typeof body.social_links_json === 'string' ? body.social_links_json : JSON.stringify(body.social_links_json || {}),
      sanitizePlainText(body.banner_text || ''),
      sanitizePlainText(body.banner_link || '/announcements'),
      Number(body.map_lat) || 41.3514,
      Number(body.map_lng) || 69.2869
    );

    logAudit(req.user!.id, 'UPDATE_SETTINGS', 'mahalla_settings', 1, 'Mahalla sozlamalari yangilandi', req.ip);
    const settings = db.prepare('SELECT * FROM mahalla_settings WHERE id = 1').get();
    res.json({ settings });
  });

  router.get('/search', (req, res) => {
    const q = sanitizePlainText(String(req.query.q || '')).trim();
    if (!q) {
      return res.json({ news: [], announcements: [], events: [], mahalla: null });
    }
    const like = `%${q}%`;
    const news = db
      .prepare(
        `SELECT n.id, n.title, n.summary, n.image_url, n.published_at, nc.name as category_name
         FROM news n JOIN news_categories nc ON nc.id = n.category_id
         WHERE n.status = 'published' AND (n.title LIKE ? OR n.summary LIKE ? OR n.content LIKE ?)
         ORDER BY n.published_at DESC LIMIT 12`
      )
      .all(like, like, like);

    const announcements = db
      .prepare(
        `SELECT a.id, a.title, a.content, a.image_url, a.published_at, a.is_important, ac.name as category_name
         FROM announcements a JOIN announcement_categories ac ON ac.id = a.category_id
         WHERE a.title LIKE ? OR a.content LIKE ?
         ORDER BY a.published_at DESC LIMIT 12`
      )
      .all(like, like);

    const events = db
      .prepare(
        `SELECT id, title, description, event_date, event_time, location, category
         FROM events
         WHERE title LIKE ? OR description LIKE ? OR location LIKE ?
         ORDER BY event_date DESC LIMIT 12`
      )
      .all(like, like, like);

    const mahalla = db
      .prepare(
        `SELECT mahalla_name, address, phone, chairman_name, history
         FROM mahalla_settings
         WHERE id = 1 AND (mahalla_name LIKE ? OR history LIKE ? OR chairman_name LIKE ? OR address LIKE ?)`
      )
      .get(like, like, like, like) || null;

    res.json({ news, announcements, events, mahalla });
  });

  // ---------------- NEWS ----------------
  router.get('/news/categories', (_req, res) => {
    const categories = db.prepare('SELECT * FROM news_categories ORDER BY id ASC').all();
    res.json({ categories });
  });

  router.get('/news', optionalAuth, (req: AuthRequest, res) => {
    const category = sanitizePlainText(String(req.query.category || ''));
    const q = sanitizePlainText(String(req.query.q || '')).trim();
    const includeDrafts = req.query.include_drafts === '1' && isStaff(req.user);

    let sql = `
      SELECT n.*, nc.name as category_name, nc.slug as category_slug,
             u.first_name || ' ' || u.last_name as author_name
      FROM news n
      JOIN news_categories nc ON nc.id = n.category_id
      LEFT JOIN users u ON u.id = n.author_id
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (!includeDrafts) {
      sql += ` AND n.status = 'published'`;
    }
    if (category && category !== 'all') {
      sql += ` AND (nc.slug = ? OR nc.id = ?)`;
      params.push(category, category);
    }
    if (q) {
      sql += ` AND (n.title LIKE ? OR n.summary LIKE ? OR n.content LIKE ?)`;
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    sql += ` ORDER BY n.published_at DESC`;

    const items = db.prepare(sql).all(...params);
    res.json({ items });
  });

  router.get('/news/:id', optionalAuth, (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    const item = db
      .prepare(
        `SELECT n.*, nc.name as category_name, nc.slug as category_slug,
                u.first_name || ' ' || u.last_name as author_name
         FROM news n
         JOIN news_categories nc ON nc.id = n.category_id
         LEFT JOIN users u ON u.id = n.author_id
         WHERE n.id = ?`
      )
      .get(id) as { id: number; status: string } | undefined;

    if (!item || (item.status === 'draft' && !isStaff(req.user))) {
      return res.status(404).json({ error: 'Yangilik topilmadi' });
    }

    db.prepare('UPDATE news SET views = views + 1 WHERE id = ?').run(id);
    const related = db
      .prepare(
        `SELECT n.id, n.title, n.image_url, n.published_at, n.summary, nc.name as category_name
         FROM news n JOIN news_categories nc ON nc.id = n.category_id
         WHERE n.status = 'published' AND n.id != ?
         ORDER BY n.published_at DESC LIMIT 3`
      )
      .all(id);

    res.json({ item, related });
  });

  router.post('/news', requireAuth, requireRoles(['super_admin', 'mahalla_raisi', 'masul_xodim']), (req: AuthRequest, res) => {
    const title = sanitizePlainText(req.body.title || '');
    const category_id = Number(req.body.category_id);
    const image_url = sanitizePlainText(req.body.image_url || '');
    const extra_images = JSON.stringify(Array.isArray(req.body.extra_images) ? req.body.extra_images : []);
    const summary = sanitizePlainText(req.body.summary || '');
    const content = sanitizeRichHtml(req.body.content || '');
    const status = req.body.status === 'draft' ? 'draft' : 'published';
    const published_at = sanitizePlainText(req.body.published_at || '') || new Date().toISOString().slice(0, 19).replace('T', ' ');

    if (!title || !category_id || !summary || !content) {
      return res.status(400).json({ error: 'Sarlavha, kategoriya, qisqa tavsif va matn majburiy' });
    }

    const info = db
      .prepare(
        `INSERT INTO news (title, category_id, image_url, extra_images, summary, content, author_id, status, published_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(title, category_id, image_url, extra_images, summary, content, req.user!.id, status, published_at);

    const newId = Number(info.lastInsertRowid);
    logAudit(req.user!.id, 'CREATE_NEWS', 'news', newId, title, req.ip);

    const item = db.prepare('SELECT * FROM news WHERE id = ?').get(newId);
    res.status(201).json({ item });
  });

  router.put('/news/:id', requireAuth, requireRoles(['super_admin', 'mahalla_raisi', 'masul_xodim']), (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    const existing = db.prepare('SELECT id FROM news WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Yangilik topilmadi' });

    const title = sanitizePlainText(req.body.title || '');
    const category_id = Number(req.body.category_id);
    const image_url = sanitizePlainText(req.body.image_url || '');
    const extra_images = JSON.stringify(Array.isArray(req.body.extra_images) ? req.body.extra_images : []);
    const summary = sanitizePlainText(req.body.summary || '');
    const content = sanitizeRichHtml(req.body.content || '');
    const status = req.body.status === 'draft' ? 'draft' : 'published';
    const published_at = sanitizePlainText(req.body.published_at || '') || new Date().toISOString().slice(0, 19).replace('T', ' ');

    db.prepare(
      `UPDATE news SET title = ?, category_id = ?, image_url = ?, extra_images = ?, summary = ?, content = ?, status = ?, published_at = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(title, category_id, image_url, extra_images, summary, content, status, published_at, id);

    logAudit(req.user!.id, 'UPDATE_NEWS', 'news', id, title, req.ip);
    const item = db.prepare('SELECT * FROM news WHERE id = ?').get(id);
    res.json({ item });
  });

  router.delete('/news/:id', requireAuth, requireRoles(['super_admin', 'mahalla_raisi']), (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    db.prepare('DELETE FROM news WHERE id = ?').run(id);
    logAudit(req.user!.id, 'DELETE_NEWS', 'news', id, `Yangilik #${id} o'chirildi`, req.ip);
    res.json({ success: true });
  });

  // ---------------- ANNOUNCEMENTS ----------------
  router.get('/announcements/categories', (_req, res) => {
    const categories = db.prepare('SELECT * FROM announcement_categories ORDER BY id ASC').all();
    res.json({ categories });
  });

  router.get('/announcements', (req, res) => {
    const category = sanitizePlainText(String(req.query.category || ''));
    const q = sanitizePlainText(String(req.query.q || '')).trim();
    let sql = `
      SELECT a.*, ac.name as category_name, ac.slug as category_slug,
             u.first_name || ' ' || u.last_name as author_name
      FROM announcements a
      JOIN announcement_categories ac ON ac.id = a.category_id
      LEFT JOIN users u ON u.id = a.author_id
      WHERE 1=1
    `;
    const params: unknown[] = [];
    if (category && category !== 'all') {
      sql += ` AND (ac.slug = ? OR ac.id = ?)`;
      params.push(category, category);
    }
    if (q) {
      sql += ` AND (a.title LIKE ? OR a.content LIKE ?)`;
      params.push(`%${q}%`, `%${q}%`);
    }
    sql += ` ORDER BY a.is_important DESC, a.published_at DESC`;
    const items = db.prepare(sql).all(...params);
    res.json({ items });
  });

  router.post('/announcements', requireAuth, requireRoles(['super_admin', 'mahalla_raisi', 'masul_xodim']), (req: AuthRequest, res) => {
    const title = sanitizePlainText(req.body.title || '');
    const category_id = Number(req.body.category_id);
    const image_url = sanitizePlainText(req.body.image_url || '');
    const content = sanitizeRichHtml(req.body.content || '');
    const is_important = req.body.is_important ? 1 : 0;
    const is_banner = req.body.is_banner ? 1 : 0;

    if (!title || !category_id || !content) {
      return res.status(400).json({ error: 'Sarlavha, kategoriya va e’lon matni majburiy' });
    }

    const info = db
      .prepare(
        `INSERT INTO announcements (title, category_id, image_url, content, is_important, is_banner, author_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(title, category_id, image_url, content, is_important, is_banner, req.user!.id);

    const newId = Number(info.lastInsertRowid);

    if (is_banner) {
      db.prepare(`UPDATE mahalla_settings SET banner_text = ?, updated_at = datetime('now') WHERE id = 1`).run(
        `Diqqat! ${title}`
      );
    }

    if (is_important) {
      const citizens = db
        .prepare(
          `SELECT DISTINCT u.id FROM users u
           JOIN user_roles ur ON ur.user_id = u.id
           JOIN roles r ON r.id = ur.role_id
           WHERE r.name = 'fuqaro' AND u.is_active = 1`
        )
        .all() as { id: number }[];
      const insertNotif = db.prepare(
        `INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, 'announcement', '/announcements')`
      );
      for (const c of citizens) {
        insertNotif.run(c.id, "Yangi muhim e'lon", title);
      }
    }

    logAudit(req.user!.id, 'CREATE_ANNOUNCEMENT', 'announcements', newId, title, req.ip);
    const item = db.prepare('SELECT * FROM announcements WHERE id = ?').get(newId);
    res.status(201).json({ item });
  });

  router.put('/announcements/:id', requireAuth, requireRoles(['super_admin', 'mahalla_raisi', 'masul_xodim']), (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    const title = sanitizePlainText(req.body.title || '');
    const category_id = Number(req.body.category_id);
    const image_url = sanitizePlainText(req.body.image_url || '');
    const content = sanitizeRichHtml(req.body.content || '');
    const is_important = req.body.is_important ? 1 : 0;
    const is_banner = req.body.is_banner ? 1 : 0;

    db.prepare(
      `UPDATE announcements SET title = ?, category_id = ?, image_url = ?, content = ?, is_important = ?, is_banner = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(title, category_id, image_url, content, is_important, is_banner, id);

    if (is_banner) {
      db.prepare(`UPDATE mahalla_settings SET banner_text = ? WHERE id = 1`).run(`Diqqat! ${title}`);
    }

    logAudit(req.user!.id, 'UPDATE_ANNOUNCEMENT', 'announcements', id, title, req.ip);
    const item = db.prepare('SELECT * FROM announcements WHERE id = ?').get(id);
    res.json({ item });
  });

  router.delete('/announcements/:id', requireAuth, requireRoles(['super_admin', 'mahalla_raisi']), (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    db.prepare('DELETE FROM announcements WHERE id = ?').run(id);
    logAudit(req.user!.id, 'DELETE_ANNOUNCEMENT', 'announcements', id, `E'lon #${id} o'chirildi`, req.ip);
    res.json({ success: true });
  });

  // ---------------- EVENTS ----------------
  router.get('/events', optionalAuth, (req: AuthRequest, res) => {
    const today = new Date().toISOString().slice(0, 10);
    const all = db
      .prepare(
        `SELECT e.*,
                (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id) as participants_count
         FROM events e
         ORDER BY e.event_date ASC`
      )
      .all() as Array<Record<string, unknown> & { id: number; event_date: string }>;

    let registeredIds = new Set<number>();
    if (req.user) {
      const regs = db
        .prepare('SELECT event_id FROM event_registrations WHERE user_id = ?')
        .all(req.user.id) as { event_id: number }[];
      registeredIds = new Set(regs.map((r) => r.event_id));
    }

    const enriched = all.map((e) => ({
      ...e,
      is_registered: registeredIds.has(e.id),
      is_past: String(e.event_date) < today,
    }));

    const upcoming = enriched.filter((e) => !e.is_past);
    const past = enriched.filter((e) => e.is_past).reverse();
    res.json({ upcoming, past, all: enriched });
  });

  router.get('/events/my', requireAuth, (req: AuthRequest, res) => {
    const items = db
      .prepare(
        `SELECT e.*, er.registered_at,
                (SELECT COUNT(*) FROM event_registrations er2 WHERE er2.event_id = e.id) as participants_count
         FROM event_registrations er
         JOIN events e ON e.id = er.event_id
         WHERE er.user_id = ?
         ORDER BY e.event_date ASC`
      )
      .all(req.user!.id);
    res.json({ items });
  });

  router.post('/events/:id/register', requireAuth, (req: AuthRequest, res) => {
    const eventId = Number(req.params.id);
    const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId) as
      | { id: number; title: string; capacity: number; event_date: string }
      | undefined;
    if (!event) return res.status(404).json({ error: 'Tadbir topilmadi' });

    const today = new Date().toISOString().slice(0, 10);
    if (event.event_date < today) {
      return res.status(400).json({ error: "O'tib ketgan tadbirga ro'yxatdan o'tib bo'lmaydi" });
    }

    const count = (
      db.prepare('SELECT COUNT(*) as c FROM event_registrations WHERE event_id = ?').get(eventId) as { c: number }
    ).c;
    if (count >= event.capacity) {
      return res.status(400).json({ error: 'Tadbir uchun joylar to‘lgan' });
    }

    const exists = db
      .prepare('SELECT id FROM event_registrations WHERE event_id = ? AND user_id = ?')
      .get(eventId, req.user!.id);
    if (exists) {
      return res.status(409).json({ error: "Siz ushbu tadbirga allaqachon ro'yxatdan o'tgansiz" });
    }

    db.prepare('INSERT INTO event_registrations (event_id, user_id) VALUES (?, ?)').run(eventId, req.user!.id);
    res.json({ success: true, participants_count: count + 1 });
  });

  router.delete('/events/:id/register', requireAuth, (req: AuthRequest, res) => {
    const eventId = Number(req.params.id);
    db.prepare('DELETE FROM event_registrations WHERE event_id = ? AND user_id = ?').run(eventId, req.user!.id);
    const count = (
      db.prepare('SELECT COUNT(*) as c FROM event_registrations WHERE event_id = ?').get(eventId) as { c: number }
    ).c;
    res.json({ success: true, participants_count: count });
  });

  router.get('/events/:id/participants', requireAuth, requireRoles(['super_admin', 'mahalla_raisi', 'masul_xodim']), (req, res) => {
    const eventId = Number(req.params.id);
    const participants = db
      .prepare(
        `SELECT u.id, u.first_name, u.last_name, u.phone, u.email, er.registered_at
         FROM event_registrations er
         JOIN users u ON u.id = er.user_id
         WHERE er.event_id = ?
         ORDER BY er.registered_at DESC`
      )
      .all(eventId);
    res.json({ participants });
  });

  router.post('/events', requireAuth, requireRoles(['super_admin', 'mahalla_raisi', 'masul_xodim']), (req: AuthRequest, res) => {
    const title = sanitizePlainText(req.body.title || '');
    const category = sanitizePlainText(req.body.category || 'Tadbir');
    const description = sanitizePlainText(req.body.description || '');
    const event_date = sanitizePlainText(req.body.event_date || '');
    const event_time = sanitizePlainText(req.body.event_time || '');
    const location = sanitizePlainText(req.body.location || '');
    const capacity = Number(req.body.capacity) || 100;
    const image_url = sanitizePlainText(req.body.image_url || '');

    if (!title || !event_date || !event_time || !location) {
      return res.status(400).json({ error: 'Tadbir nomi, sanasi, vaqti va manzili majburiy' });
    }

    const info = db
      .prepare(
        `INSERT INTO events (title, category, description, event_date, event_time, location, capacity, image_url, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(title, category, description, event_date, event_time, location, capacity, image_url, req.user!.id);

    const newId = Number(info.lastInsertRowid);
    const citizens = db
      .prepare(
        `SELECT DISTINCT u.id FROM users u
         JOIN user_roles ur ON ur.user_id = u.id
         JOIN roles r ON r.id = ur.role_id
         WHERE r.name = 'fuqaro' AND u.is_active = 1`
      )
      .all() as { id: number }[];
    const insertNotif = db.prepare(
      `INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, 'event', '/events')`
    );
    for (const c of citizens) {
      insertNotif.run(c.id, `Yangi tadbir: ${title}`, `${event_date} kuni soat ${event_time} da ${location}da bo'lib o'tadi.`);
    }

    logAudit(req.user!.id, 'CREATE_EVENT', 'events', newId, title, req.ip);
    const item = db.prepare('SELECT * FROM events WHERE id = ?').get(newId);
    res.status(201).json({ item });
  });

  router.put('/events/:id', requireAuth, requireRoles(['super_admin', 'mahalla_raisi', 'masul_xodim']), (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    db.prepare(
      `UPDATE events SET title = ?, category = ?, description = ?, event_date = ?, event_time = ?, location = ?, capacity = ?, image_url = ?, updated_at = datetime('now')
       WHERE id = ?`
    ).run(
      sanitizePlainText(req.body.title || ''),
      sanitizePlainText(req.body.category || 'Tadbir'),
      sanitizePlainText(req.body.description || ''),
      sanitizePlainText(req.body.event_date || ''),
      sanitizePlainText(req.body.event_time || ''),
      sanitizePlainText(req.body.location || ''),
      Number(req.body.capacity) || 100,
      sanitizePlainText(req.body.image_url || ''),
      id
    );
    logAudit(req.user!.id, 'UPDATE_EVENT', 'events', id, req.body.title, req.ip);
    const item = db.prepare('SELECT * FROM events WHERE id = ?').get(id);
    res.json({ item });
  });

  router.delete('/events/:id', requireAuth, requireRoles(['super_admin', 'mahalla_raisi']), (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    db.prepare('DELETE FROM events WHERE id = ?').run(id);
    logAudit(req.user!.id, 'DELETE_EVENT', 'events', id, `Tadbir #${id} o'chirildi`, req.ip);
    res.json({ success: true });
  });

  // ---------------- APPEALS ----------------
  router.get('/appeals/categories', (_req, res) => {
    const categories = db.prepare('SELECT * FROM appeal_categories ORDER BY id ASC').all();
    res.json({ categories });
  });

  router.get('/appeals/track/:trackingNumber', optionalAuth, (req: AuthRequest, res) => {
    const code = sanitizePlainText(req.params.trackingNumber || '').toUpperCase();
    const appeal = db
      .prepare(
        `SELECT a.id, a.tracking_number, a.subject, a.status, a.created_at, a.updated_at,
                ac.name as category_name,
                s.first_name || ' ' || s.last_name as assigned_name
         FROM appeals a
         JOIN appeal_categories ac ON ac.id = a.category_id
         LEFT JOIN users s ON s.id = a.assigned_to
         WHERE upper(a.tracking_number) = ?`
      )
      .get(code) as { id: number } | undefined;

    if (!appeal) return res.status(404).json({ error: 'Ushbu raqamli murojaat topilmadi' });

    const history = db
      .prepare(
        `SELECT h.old_status, h.new_status, h.note, h.changed_at
         FROM appeal_status_history h
         WHERE h.appeal_id = ?
         ORDER BY h.changed_at ASC`
      )
      .all(appeal.id);

    res.json({ appeal, history });
  });

  router.get('/appeals', requireAuth, (req: AuthRequest, res) => {
    const status = sanitizePlainText(String(req.query.status || ''));
    const categoryId = Number(req.query.category_id || 0);
    const q = sanitizePlainText(String(req.query.q || '')).trim();
    const staff = isStaff(req.user);

    let sql = `
      SELECT a.*, ac.name as category_name,
             u.first_name || ' ' || u.last_name as citizen_name,
             u.phone as citizen_phone,
             s.first_name || ' ' || s.last_name as assigned_name
      FROM appeals a
      JOIN appeal_categories ac ON ac.id = a.category_id
      JOIN users u ON u.id = a.user_id
      LEFT JOIN users s ON s.id = a.assigned_to
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (!staff) {
      sql += ` AND a.user_id = ?`;
      params.push(req.user!.id);
    }
    if (status && status !== 'all') {
      sql += ` AND a.status = ?`;
      params.push(status);
    }
    if (categoryId) {
      sql += ` AND a.category_id = ?`;
      params.push(categoryId);
    }
    if (q) {
      sql += ` AND (a.tracking_number LIKE ? OR a.subject LIKE ? OR a.message LIKE ?)`;
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    sql += ` ORDER BY a.created_at DESC`;
    const items = db.prepare(sql).all(...params);
    res.json({ items });
  });

  router.get('/appeals/:id', requireAuth, (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    const appeal = db
      .prepare(
        `SELECT a.*, ac.name as category_name,
                u.first_name || ' ' || u.last_name as citizen_name,
                u.phone as citizen_phone,
                u.email as citizen_email,
                s.first_name || ' ' || s.last_name as assigned_name
         FROM appeals a
         JOIN appeal_categories ac ON ac.id = a.category_id
         JOIN users u ON u.id = a.user_id
         LEFT JOIN users s ON s.id = a.assigned_to
         WHERE a.id = ?`
      )
      .get(id) as { id: number; user_id: number } | undefined;

    if (!appeal) return res.status(404).json({ error: 'Murojaat topilmadi' });
    if (!isStaff(req.user) && appeal.user_id !== req.user!.id) {
      return res.status(403).json({ error: 'Siz faqat o‘z murojaatlaringizni ko‘ra olasiz' });
    }

    const responses = db
      .prepare(
        `SELECT ar.*, u.first_name || ' ' || u.last_name as responder_name
         FROM appeal_responses ar
         LEFT JOIN users u ON u.id = ar.responder_id
         WHERE ar.appeal_id = ?
         ORDER BY ar.created_at ASC`
      )
      .all(id);

    const history = db
      .prepare(
        `SELECT h.*, u.first_name || ' ' || u.last_name as changed_by_name
         FROM appeal_status_history h
         LEFT JOIN users u ON u.id = h.changed_by
         WHERE h.appeal_id = ?
         ORDER BY h.changed_at ASC`
      )
      .all(id);

    res.json({ appeal, responses, history });
  });

  router.post('/appeals', requireAuth, (req: AuthRequest, res) => {
    const subject = sanitizePlainText(req.body.subject || '');
    const category_id = Number(req.body.category_id);
    const message = sanitizePlainText(req.body.message || '');
    const attachment_url = sanitizePlainText(req.body.attachment_url || '');

    if (!subject || !category_id || !message) {
      return res.status(400).json({ error: 'Mavzu, kategoriya va murojaat matni majburiy' });
    }

    const year = new Date().getFullYear();
    const maxIdRow = db.prepare('SELECT COALESCE(MAX(id), 0) as m FROM appeals').get() as { m: number };
    const nextNum = String(maxIdRow.m + 1).padStart(4, '0');
    const tracking_number = `MRJ-${year}-${nextNum}`;

    const tx = db.transaction(() => {
      const info = db
        .prepare(
          `INSERT INTO appeals (tracking_number, user_id, category_id, subject, message, attachment_url, status)
           VALUES (?, ?, ?, ?, ?, ?, 'yangi')`
        )
        .run(tracking_number, req.user!.id, category_id, subject, message, attachment_url);
      const appealId = Number(info.lastInsertRowid);

      db.prepare(
        `INSERT INTO appeal_status_history (appeal_id, old_status, new_status, changed_by, note)
         VALUES (?, NULL, 'yangi', ?, 'Murojaat yuborildi')`
      ).run(appealId, req.user!.id);

      const staffUsers = db
        .prepare(
          `SELECT DISTINCT u.id FROM users u
           JOIN user_roles ur ON ur.user_id = u.id
           JOIN roles r ON r.id = ur.role_id
           WHERE r.name IN ('super_admin', 'mahalla_raisi', 'masul_xodim') AND u.is_active = 1`
        )
        .all() as { id: number }[];
      const notifStmt = db.prepare(
        `INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, 'appeal', ?)`
      );
      for (const s of staffUsers) {
        notifStmt.run(
          s.id,
          `Yangi murojaat: ${tracking_number}`,
          `${req.user!.first_name} ${req.user!.last_name}: ${subject}`,
          `/admin/appeals`
        );
      }
      return appealId;
    });

    const appealId = tx();
    const appeal = db.prepare('SELECT * FROM appeals WHERE id = ?').get(appealId);
    res.status(201).json({ appeal });
  });

  router.put('/appeals/:id/status', requireAuth, requireRoles(['super_admin', 'mahalla_raisi', 'masul_xodim']), (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM appeals WHERE id = ?').get(id) as
      | { id: number; user_id: number; status: string; tracking_number: string; subject: string; assigned_to: number | null }
      | undefined;

    if (!existing) return res.status(404).json({ error: 'Murojaat topilmadi' });

    const allowedStatuses = ['yangi', 'korib_chiqilmoqda', 'jarayonda', 'javob_berildi', 'yopildi'];
    const newStatus = allowedStatuses.includes(req.body.status) ? req.body.status : existing.status;
    const assignedTo = req.body.assigned_to !== undefined ? (req.body.assigned_to ? Number(req.body.assigned_to) : null) : existing.assigned_to;
    const responseText = sanitizePlainText(req.body.response_text || '');
    const note = sanitizePlainText(req.body.note || '') || (responseText ? 'Rasmiy javob berildi' : 'Holat yangilandi');

    const tx = db.transaction(() => {
      db.prepare(
        `UPDATE appeals SET status = ?, assigned_to = ?, updated_at = datetime('now') WHERE id = ?`
      ).run(newStatus, assignedTo, id);

      if (newStatus !== existing.status || note) {
        db.prepare(
          `INSERT INTO appeal_status_history (appeal_id, old_status, new_status, changed_by, note)
           VALUES (?, ?, ?, ?, ?)`
        ).run(id, existing.status, newStatus, req.user!.id, note);
      }

      if (responseText) {
        db.prepare(
          `INSERT INTO appeal_responses (appeal_id, responder_id, response_text) VALUES (?, ?, ?)`
        ).run(id, req.user!.id, responseText);
      }

      const notifTitle = responseText
        ? 'Murojaatingizga javob berildi'
        : 'Murojaat holati yangilandi';
      const notifMsg = responseText
        ? `${existing.tracking_number} (${existing.subject}) murojaatingizga javob yozildi.`
        : `${existing.tracking_number} murojaatingiz holati "${newStatus}" ga o'zgartirildi.`;

      db.prepare(
        `INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, 'appeal', ?)`
      ).run(existing.user_id, notifTitle, notifMsg, `/appeals/${id}`);
    });

    tx();
    logAudit(req.user!.id, 'UPDATE_APPEAL', 'appeals', id, `${existing.tracking_number}: ${existing.status} -> ${newStatus}`, req.ip);
    res.json({ success: true });
  });

  // ---------------- NOTIFICATIONS ----------------
  router.get('/notifications', requireAuth, (req: AuthRequest, res) => {
    const items = db
      .prepare(
        `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`
      )
      .all(req.user!.id);
    const unread = (
      db
        .prepare('SELECT COUNT(*) as c FROM notifications WHERE user_id = ? AND is_read = 0')
        .get(req.user!.id) as { c: number }
    ).c;
    res.json({ items, unread });
  });

  router.put('/notifications/:id/read', requireAuth, (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(id, req.user!.id);
    res.json({ success: true });
  });

  router.put('/notifications/read-all', requireAuth, (req: AuthRequest, res) => {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user!.id);
    res.json({ success: true });
  });

  // ---------------- POLLS ----------------
  router.get('/polls', optionalAuth, (req: AuthRequest, res) => {
    const polls = db.prepare('SELECT * FROM polls ORDER BY is_active DESC, created_at DESC').all() as Array<{
      id: number;
      question: string;
      description: string;
      is_active: number;
      created_at: string;
    }>;

    const result = polls.map((p) => {
      const options = db
        .prepare(
          `SELECT po.id, po.option_text,
                  (SELECT COUNT(*) FROM poll_votes pv WHERE pv.option_id = po.id) as votes
           FROM poll_options po WHERE po.poll_id = ?`
        )
        .all(p.id) as Array<{ id: number; option_text: string; votes: number }>;

      const totalVotes = options.reduce((sum, o) => sum + o.votes, 0);
      let userVote = null;
      if (req.user) {
        const v = db
          .prepare('SELECT option_id FROM poll_votes WHERE poll_id = ? AND user_id = ?')
          .get(p.id, req.user.id) as { option_id: number } | undefined;
        userVote = v?.option_id ?? null;
      }

      return { ...p, options, total_votes: totalVotes, user_voted_option_id: userVote };
    });

    res.json({ items: result });
  });

  router.post('/polls/:id/vote', requireAuth, (req: AuthRequest, res) => {
    const pollId = Number(req.params.id);
    const optionId = Number(req.body.option_id);

    const poll = db.prepare('SELECT * FROM polls WHERE id = ?').get(pollId) as { is_active: number } | undefined;
    if (!poll || !poll.is_active) {
      return res.status(400).json({ error: "So'rovnoma faol emas" });
    }
    const opt = db.prepare('SELECT id FROM poll_options WHERE id = ? AND poll_id = ?').get(optionId, pollId);
    if (!opt) {
      return res.status(400).json({ error: "Noto'g'ri variant tanlandi" });
    }
    const existing = db
      .prepare('SELECT id FROM poll_votes WHERE poll_id = ? AND user_id = ?')
      .get(pollId, req.user!.id);
    if (existing) {
      return res.status(409).json({ error: "Siz ushbu so'rovnomada allaqachon ovoz bergansiz" });
    }

    db.prepare('INSERT INTO poll_votes (poll_id, option_id, user_id) VALUES (?, ?, ?)').run(
      pollId,
      optionId,
      req.user!.id
    );
    res.json({ success: true });
  });

  router.post('/polls', requireAuth, requireRoles(['super_admin', 'mahalla_raisi', 'masul_xodim']), (req: AuthRequest, res) => {
    const question = sanitizePlainText(req.body.question || '');
    const description = sanitizePlainText(req.body.description || '');
    const options: string[] = Array.isArray(req.body.options)
      ? req.body.options.map((o: string) => sanitizePlainText(o)).filter(Boolean)
      : [];

    if (!question || options.length < 2) {
      return res.status(400).json({ error: "Savol va kamida 2 ta javob varianti bo'lishi kerak" });
    }

    const tx = db.transaction(() => {
      const info = db
        .prepare('INSERT INTO polls (question, description, is_active, created_by) VALUES (?, ?, 1, ?)')
        .run(question, description, req.user!.id);
      const pollId = Number(info.lastInsertRowid);
      const insOpt = db.prepare('INSERT INTO poll_options (poll_id, option_text) VALUES (?, ?)');
      for (const o of options) {
        insOpt.run(pollId, o);
      }
      return pollId;
    });

    const pollId = tx();
    logAudit(req.user!.id, 'CREATE_POLL', 'polls', pollId, question, req.ip);
    res.status(201).json({ id: pollId });
  });

  router.put('/polls/:id/toggle', requireAuth, requireRoles(['super_admin', 'mahalla_raisi']), (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    const poll = db.prepare('SELECT is_active FROM polls WHERE id = ?').get(id) as { is_active: number } | undefined;
    if (!poll) return res.status(404).json({ error: "So'rovnoma topilmadi" });
    const next = poll.is_active ? 0 : 1;
    db.prepare('UPDATE polls SET is_active = ? WHERE id = ?').run(next, id);
    logAudit(req.user!.id, 'TOGGLE_POLL', 'polls', id, `Active: ${next}`, req.ip);
    res.json({ is_active: next });
  });

  router.delete('/polls/:id', requireAuth, requireRoles(['super_admin', 'mahalla_raisi']), (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    db.prepare('DELETE FROM polls WHERE id = ?').run(id);
    logAudit(req.user!.id, 'DELETE_POLL', 'polls', id, `So'rovnoma #${id} o'chirildi`, req.ip);
    res.json({ success: true });
  });

  // ---------------- GALLERY ----------------
  router.get('/gallery', (req, res) => {
    const category = sanitizePlainText(String(req.query.category || ''));
    let sql = 'SELECT * FROM gallery WHERE 1=1';
    const params: unknown[] = [];
    if (category && category !== 'all') {
      sql += ' AND category = ?';
      params.push(category);
    }
    sql += ' ORDER BY created_at DESC';
    const items = db.prepare(sql).all(...params);
    res.json({ items });
  });

  router.post('/gallery', requireAuth, requireRoles(['super_admin', 'mahalla_raisi', 'masul_xodim']), (req: AuthRequest, res) => {
    const title = sanitizePlainText(req.body.title || '');
    const category = sanitizePlainText(req.body.category || 'Hudud');
    const image_url = sanitizePlainText(req.body.image_url || '');
    const description = sanitizePlainText(req.body.description || '');
    if (!title || !image_url) {
      return res.status(400).json({ error: 'Sarlavha va rasm majburiy' });
    }
    const info = db
      .prepare('INSERT INTO gallery (title, category, image_url, description, uploaded_by) VALUES (?, ?, ?, ?, ?)')
      .run(title, category, image_url, description, req.user!.id);
    logAudit(req.user!.id, 'CREATE_GALLERY', 'gallery', Number(info.lastInsertRowid), title, req.ip);
    res.status(201).json({ id: info.lastInsertRowid });
  });

  router.put('/gallery/:id', requireAuth, requireRoles(['super_admin', 'mahalla_raisi', 'masul_xodim']), (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    db.prepare('UPDATE gallery SET title = ?, category = ?, image_url = ?, description = ? WHERE id = ?').run(
      sanitizePlainText(req.body.title || ''),
      sanitizePlainText(req.body.category || 'Hudud'),
      sanitizePlainText(req.body.image_url || ''),
      sanitizePlainText(req.body.description || ''),
      id
    );
    logAudit(req.user!.id, 'UPDATE_GALLERY', 'gallery', id, req.body.title, req.ip);
    res.json({ success: true });
  });

  router.delete('/gallery/:id', requireAuth, requireRoles(['super_admin', 'mahalla_raisi']), (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    db.prepare('DELETE FROM gallery WHERE id = ?').run(id);
    logAudit(req.user!.id, 'DELETE_GALLERY', 'gallery', id, `Rasm #${id} o'chirildi`, req.ip);
    res.json({ success: true });
  });

  // ---------------- ADMIN DASHBOARD, USERS & REPORTS ----------------
  router.get('/admin/dashboard', requireAuth, requireRoles(['super_admin', 'mahalla_raisi', 'masul_xodim']), (_req, res) => {
    const settings = db.prepare('SELECT population_count FROM mahalla_settings WHERE id = 1').get() as {
      population_count: number;
    };
    const appealsCount = (db.prepare('SELECT COUNT(*) as c FROM appeals').get() as { c: number }).c;
    const eventsCount = (db.prepare('SELECT COUNT(*) as c FROM events').get() as { c: number }).c;
    const announcementsCount = (db.prepare('SELECT COUNT(*) as c FROM announcements').get() as { c: number }).c;
    const newsCount = (db.prepare('SELECT COUNT(*) as c FROM news').get() as { c: number }).c;
    const registeredCitizens = (db.prepare('SELECT COUNT(*) as c FROM users WHERE is_active = 1').get() as { c: number }).c;

    const statusCounts = db
      .prepare('SELECT status, COUNT(*) as count FROM appeals GROUP BY status')
      .all() as Array<{ status: string; count: number }>;

    const monthlyAppealsRaw = db
      .prepare(
        `SELECT strftime('%Y-%m', created_at) as ym, COUNT(*) as count
         FROM appeals
         GROUP BY ym
         ORDER BY ym ASC`
      )
      .all() as Array<{ ym: string; count: number }>;

    // Build clean 6-month series blending real counts
    const months = ['Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy'];
    const ymKeys = ['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11'];
    const mapYm = new Map(monthlyAppealsRaw.map((m) => [m.ym, m.count]));
    const monthlySeries = months.map((label, idx) => ({
      month: label,
      murojaatlar: mapYm.get(ymKeys[idx]) || 0,
    }));

    const eventsSeries = db
      .prepare(
        `SELECT e.title as name,
                (SELECT COUNT(*) FROM event_registrations er WHERE er.event_id = e.id) as ishtirokchilar,
                e.capacity as sigim
         FROM events e
         ORDER BY e.event_date DESC LIMIT 5`
      )
      .all();

    const latestAppeals = db
      .prepare(
        `SELECT a.id, a.tracking_number, a.subject, a.status, a.created_at,
                u.first_name || ' ' || u.last_name as citizen_name,
                ac.name as category_name
         FROM appeals a
         JOIN users u ON u.id = a.user_id
         JOIN appeal_categories ac ON ac.id = a.category_id
         ORDER BY a.created_at DESC LIMIT 6`
      )
      .all();

    const staffUsers = db
      .prepare(
        `SELECT DISTINCT u.id, u.first_name, u.last_name, r.display_name as role_label
         FROM users u
         JOIN user_roles ur ON ur.user_id = u.id
         JOIN roles r ON r.id = ur.role_id
         WHERE r.name IN ('super_admin', 'mahalla_raisi', 'masul_xodim') AND u.is_active = 1`
      )
      .all();

    res.json({
      kpis: {
        population_count: settings?.population_count || 1248,
        registered_citizens: registeredCitizens,
        appeals_count: appealsCount,
        events_count: eventsCount,
        announcements_count: announcementsCount,
        news_count: newsCount,
      },
      statusCounts,
      monthlySeries,
      eventsSeries,
      latestAppeals,
      staffUsers,
    });
  });

  router.get('/admin/users', requireAuth, requireRoles(['super_admin', 'mahalla_raisi', 'masul_xodim']), (req: AuthRequest, res) => {
    const q = sanitizePlainText(String(req.query.q || '')).trim();
    const roleFilter = sanitizePlainText(String(req.query.role || ''));
    const statusFilter = sanitizePlainText(String(req.query.status || ''));

    const users = db
      .prepare(
        `SELECT u.id, COALESCE(u.username, '') as username, u.first_name, u.last_name,
                COALESCE(u.phone, '') as phone, COALESCE(u.email, '') as email,
                u.address, COALESCE(u.house_number, '') as house_number,
                COALESCE(u.extra_info, '') as extra_info,
                COALESCE(u.profile_completed, 0) as profile_completed,
                u.is_active, u.created_at,
                GROUP_CONCAT(r.name) as roles_csv,
                GROUP_CONCAT(r.display_name) as roles_display
         FROM users u
         LEFT JOIN user_roles ur ON ur.user_id = u.id
         LEFT JOIN roles r ON r.id = ur.role_id
         GROUP BY u.id
         ORDER BY u.created_at DESC`
      )
      .all() as Array<Record<string, unknown> & { roles_csv: string; is_active: number }>;

    const showSensitive = isAdmin(req.user);

    const filtered = users
      .filter((u) => {
        if (q) {
          const hay = `${u.username} ${u.first_name} ${u.last_name} ${u.phone} ${u.email} ${u.address} ${u.house_number}`.toLowerCase();
          if (!hay.includes(q.toLowerCase())) return false;
        }
        if (roleFilter && roleFilter !== 'all') {
          if (!String(u.roles_csv || '').split(',').includes(roleFilter)) return false;
        }
        if (statusFilter === 'active' && !u.is_active) return false;
        if (statusFilter === 'blocked' && u.is_active) return false;
        return true;
      })
      .map((u) => ({
        ...u,
        phone: showSensitive ? u.phone : u.phone ? String(u.phone).slice(0, 7) + '****' : '',
        email: showSensitive ? u.email : u.email ? '***@' + (String(u.email).split('@')[1] || '') : '',
        roles: String(u.roles_csv || '').split(',').filter(Boolean),
      }));

    res.json({ users: filtered });
  });

  router.put('/admin/users/:id', requireAuth, requireRoles(['super_admin', 'mahalla_raisi']), (req: AuthRequest, res) => {
    const id = Number(req.params.id);
    const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as
      | { id: number; username?: string; first_name: string; last_name: string; phone: string | null; email: string | null; address: string; house_number?: string; is_active: number }
      | undefined;
    if (!existing) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });

    const isPrimaryAdmin = existing.username === 'admin_sirojbek';
    if (req.body.role && ['super_admin', 'mahalla_raisi', 'masul_xodim', 'fuqaro'].includes(req.body.role)) {
      const roleName = req.body.role as RoleName;
      if (!isPrimaryAdmin && roleName !== 'fuqaro') {
        return res.status(403).json({
          error: 'Admin panelga faqat yagona admin (admin_sirojbek) kirishi mumkin',
        });
      }
      if (isPrimaryAdmin && roleName === 'fuqaro') {
        return res.status(400).json({ error: 'Asosiy admin rolini pasaytirib bo‘lmaydi' });
      }
    }

    const is_active = isPrimaryAdmin
      ? 1
      : req.body.is_active !== undefined
      ? req.body.is_active
        ? 1
        : 0
      : existing.is_active;
    const first_name = sanitizePlainText(req.body.first_name ?? existing.first_name);
    const last_name = sanitizePlainText(req.body.last_name ?? existing.last_name);
    const rawPhone = sanitizePlainText(req.body.phone ?? existing.phone ?? '').replace(/\s+/g, '');
    const rawEmail = sanitizePlainText(req.body.email ?? existing.email ?? '').toLowerCase();
    const address = sanitizePlainText(req.body.address ?? existing.address);
    const house_number = sanitizePlainText(req.body.house_number ?? existing.house_number ?? '');

    db.prepare(
      `UPDATE users SET first_name = ?, last_name = ?, phone = ?, email = ?, address = ?, house_number = ?, is_active = ?, updated_at = datetime('now') WHERE id = ?`
    ).run(first_name, last_name, rawPhone || null, rawEmail || null, address, house_number, is_active, id);

    logAudit(req.user!.id, 'UPDATE_USER', 'users', id, `Active=${is_active}, Role=${req.body.role || 'unchanged'}`, req.ip);
    res.json({ success: true });
  });

  router.get('/admin/audit-logs', requireAuth, requireRoles(['super_admin', 'mahalla_raisi']), (_req, res) => {
    const logs = db
      .prepare(
        `SELECT al.*, u.first_name || ' ' || u.last_name as actor_name
         FROM audit_logs al
         LEFT JOIN users u ON u.id = al.user_id
         ORDER BY al.created_at DESC LIMIT 100`
      )
      .all();
    res.json({ logs });
  });

  router.get('/admin/reports/csv', requireAuth, requireRoles(['super_admin', 'mahalla_raisi', 'masul_xodim']), (_req, res) => {
    const rows = db
      .prepare(
        `SELECT a.tracking_number, a.subject, ac.name as category, a.status,
                u.first_name || ' ' || u.last_name as citizen, a.created_at
         FROM appeals a
         JOIN appeal_categories ac ON ac.id = a.category_id
         JOIN users u ON u.id = a.user_id
         ORDER BY a.created_at DESC`
      )
      .all() as Array<Record<string, string>>;

    const header = 'Raqam,Mavzu,Kategoriya,Holat,Fuqaro,Sana\n';
    const body = rows
      .map((r) =>
        [r.tracking_number, r.subject, r.category, r.status, r.citizen, r.created_at]
          .map((v) => `"${String(v || '').replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="aqllimahalla_murojaatlar.csv"');
    res.send('\uFEFF' + header + body);
  });

  return router;
}
