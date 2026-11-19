import Database from 'better-sqlite3';
import fs from 'fs';
import os from 'os';
import path from 'path';

const isServerless = Boolean(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME);
const dbPath =
  process.env.DATABASE_PATH ||
  (isServerless
    ? path.join(os.tmpdir(), 'aqllimahalla.db')
    : path.join(process.cwd(), 'data', 'aqllimahalla.db'));
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initSchema() {
  db.exec(`
    -- 1. users
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      first_name TEXT NOT NULL DEFAULT '',
      last_name TEXT NOT NULL DEFAULT '',
      phone TEXT UNIQUE,
      email TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      avatar_url TEXT DEFAULT '',
      address TEXT DEFAULT '',
      house_number TEXT DEFAULT '',
      extra_info TEXT DEFAULT '',
      profile_completed INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 2. roles
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      display_name TEXT NOT NULL,
      description TEXT DEFAULT ''
    );

    -- 3. user_roles
    CREATE TABLE IF NOT EXISTS user_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      role_id INTEGER NOT NULL,
      assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, role_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
    );

    -- 4. news_categories
    CREATE TABLE IF NOT EXISTS news_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL
    );

    -- 5. news
    CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      image_url TEXT DEFAULT '',
      extra_images TEXT DEFAULT '[]',
      summary TEXT NOT NULL,
      content TEXT NOT NULL,
      author_id INTEGER,
      status TEXT NOT NULL DEFAULT 'published' CHECK(status IN ('published', 'draft')),
      published_at TEXT NOT NULL DEFAULT (datetime('now')),
      views INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES news_categories(id),
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- 6. announcement_categories
    CREATE TABLE IF NOT EXISTS announcement_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL
    );

    -- 7. announcements
    CREATE TABLE IF NOT EXISTS announcements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category_id INTEGER NOT NULL,
      image_url TEXT DEFAULT '',
      content TEXT NOT NULL,
      is_important INTEGER NOT NULL DEFAULT 0,
      is_banner INTEGER NOT NULL DEFAULT 0,
      author_id INTEGER,
      published_at TEXT NOT NULL DEFAULT (datetime('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES announcement_categories(id),
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- 8. events
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Hashar',
      description TEXT NOT NULL,
      event_date TEXT NOT NULL,
      event_time TEXT NOT NULL,
      location TEXT NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 100,
      image_url TEXT DEFAULT '',
      created_by INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );

    -- 9. event_registrations
    CREATE TABLE IF NOT EXISTS event_registrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      registered_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(event_id, user_id),
      FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 10. appeal_categories
    CREATE TABLE IF NOT EXISTS appeal_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL
    );

    -- 11. appeals
    CREATE TABLE IF NOT EXISTS appeals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tracking_number TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      subject TEXT NOT NULL,
      message TEXT NOT NULL,
      attachment_url TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'yangi' CHECK(status IN ('yangi', 'korib_chiqilmoqda', 'jarayonda', 'javob_berildi', 'yopildi')),
      assigned_to INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES appeal_categories(id),
      FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
    );

    -- 12. appeal_responses
    CREATE TABLE IF NOT EXISTS appeal_responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appeal_id INTEGER NOT NULL,
      responder_id INTEGER,
      response_text TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (appeal_id) REFERENCES appeals(id) ON DELETE CASCADE,
      FOREIGN KEY (responder_id) REFERENCES users(id) ON DELETE SET NULL
    );

    -- 13. appeal_status_history
    CREATE TABLE IF NOT EXISTS appeal_status_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appeal_id INTEGER NOT NULL,
      old_status TEXT,
      new_status TEXT NOT NULL,
      changed_by INTEGER,
      note TEXT DEFAULT '',
      changed_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (appeal_id) REFERENCES appeals(id) ON DELETE CASCADE,
      FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
    );

    -- 14. notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      link TEXT DEFAULT '',
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 15. polls
    CREATE TABLE IF NOT EXISTS polls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      description TEXT DEFAULT '',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_by INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      closes_at TEXT,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    );

    -- 16. poll_options
    CREATE TABLE IF NOT EXISTS poll_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      poll_id INTEGER NOT NULL,
      option_text TEXT NOT NULL,
      FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE
    );

    -- 17. poll_votes
    CREATE TABLE IF NOT EXISTS poll_votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      poll_id INTEGER NOT NULL,
      option_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      voted_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(poll_id, user_id),
      FOREIGN KEY (poll_id) REFERENCES polls(id) ON DELETE CASCADE,
      FOREIGN KEY (option_id) REFERENCES poll_options(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 18. gallery
    CREATE TABLE IF NOT EXISTS gallery (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      image_url TEXT NOT NULL,
      description TEXT DEFAULT '',
      uploaded_by INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
    );

    -- 19. mahalla_settings
    CREATE TABLE IF NOT EXISTS mahalla_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      mahalla_name TEXT NOT NULL,
      tagline TEXT NOT NULL,
      hero_description TEXT NOT NULL,
      population_count INTEGER NOT NULL DEFAULT 1248,
      history TEXT NOT NULL,
      chairman_name TEXT NOT NULL,
      chairman_bio TEXT NOT NULL,
      chairman_phone TEXT NOT NULL,
      address TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      activities TEXT NOT NULL,
      staff_json TEXT NOT NULL DEFAULT '[]',
      social_links_json TEXT NOT NULL DEFAULT '{}',
      banner_text TEXT NOT NULL DEFAULT '',
      banner_link TEXT DEFAULT '/announcements',
      map_lat REAL DEFAULT 38.6203,
      map_lng REAL DEFAULT 66.2481,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- 20. audit_logs
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id INTEGER,
      details TEXT DEFAULT '',
      ip_address TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  const cols = db.prepare(`PRAGMA table_info(users)`).all() as Array<{ name: string; notnull: number }>;
  const hasProfileCompleted = cols.some((c) => c.name === 'profile_completed');
  const phoneCol = cols.find((c) => c.name === 'phone');
  const emailCol = cols.find((c) => c.name === 'email');
  const needsRebuild = !hasProfileCompleted || phoneCol?.notnull === 1 || emailCol?.notnull === 1;

  if (needsRebuild) {
    const hasUsername = cols.some((c) => c.name === 'username');
    const hasHouse = cols.some((c) => c.name === 'house_number');
    const hasExtra = cols.some((c) => c.name === 'extra_info');
    db.pragma('foreign_keys = OFF');
    try {
      db.exec(`
        DROP TABLE IF EXISTS users_new;
        CREATE TABLE users_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE,
          first_name TEXT NOT NULL DEFAULT '',
          last_name TEXT NOT NULL DEFAULT '',
          phone TEXT UNIQUE,
          email TEXT UNIQUE,
          password_hash TEXT NOT NULL,
          avatar_url TEXT DEFAULT '',
          address TEXT DEFAULT '',
          house_number TEXT DEFAULT '',
          extra_info TEXT DEFAULT '',
          profile_completed INTEGER NOT NULL DEFAULT 0,
          is_active INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
        INSERT INTO users_new (
          id, username, first_name, last_name, phone, email, password_hash,
          avatar_url, address, house_number, extra_info, profile_completed,
          is_active, created_at, updated_at
        )
        SELECT
          id,
          ${hasUsername ? 'username' : 'NULL'},
          COALESCE(first_name, ''),
          COALESCE(last_name, ''),
          NULLIF(phone, ''),
          NULLIF(email, ''),
          password_hash,
          COALESCE(avatar_url, ''),
          COALESCE(address, ''),
          ${hasHouse ? "COALESCE(house_number, '')" : "''"},
          ${hasExtra ? "COALESCE(extra_info, '')" : "''"},
          ${hasProfileCompleted ? 'profile_completed' : "CASE WHEN COALESCE(first_name, '') != '' THEN 1 ELSE 0 END"},
          is_active,
          created_at,
          updated_at
        FROM users;
        DROP TABLE users;
        ALTER TABLE users_new RENAME TO users;
      `);
    } finally {
      db.pragma('foreign_keys = ON');
    }
  }
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username) WHERE username IS NOT NULL;`);
}

export function sanitizePlainText(input: string): string {
  if (!input) return '';
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .trim();
}

export function sanitizeRichHtml(input: string): string {
  if (!input) return '';
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?>[\s\S]*?<\/iframe>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
}

export function logAudit(
  userId: number | null,
  action: string,
  entityType: string,
  entityId: number | null,
  details = '',
  ip = ''
) {
  db.prepare(
    `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(userId, action, entityType, entityId, details, ip);
}
