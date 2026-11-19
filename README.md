# AqlliMahalla — Raqamli Mahalla Platformasi

**AqlliMahalla** — Qashqadaryo viloyati, G‘uzor tumani **Batosh MFY** aholisi, mahalla raisi, mas'ul xodimlar va administratorlar uchun mo‘ljallangan to‘liq funksional raqamli boshqaruv va muloqot platformasi.

## Asosiy imkoniyatlar

- **Ommaviy portal**: Bosh sahifa, Yangiliklar (kategoriyalar, qidiruv va batafsil sahifa), E'lonlar, Tadbirlar (ro‘yxatdan o‘tish va avtomatik o‘tgan tadbirlar ajratilishi), Murojaatlar markazi (fayl yuklash, noyob kuzatuv raqami, holat tarixi), So‘rovnomalar, Foto galereya, Mahalla haqida va Sayt bo‘ylab qidiruv.
- **Ikki xil yozuv**: O‘zbekcha (Lotin) va Ўзбекча (Кирилл) interfeys hamda kontent konvertatsiyasi.
- **Fuqaroning shaxsiy kabineti**: Profilni tahrirlash, rasm yuklash, murojaatlar holatini kuzatish, tadbirlar va real bildirishnomalar.
- **Admin panel**: Boshqaruv paneli (KPI kartalar va Recharts grafiklari), Yangiliklar va E'lonlar (Rich Text Editor + fayl yuklash), Murojaatlarni ko‘rib chiqish va mas'ul biriktirish, Tadbirlar va ishtirokchilar nazorati, Aholini boshqarish, So‘rovnomalar, Galereya, CSV hisobotlar va audit jurnali, Mahalla sozlamalari.
- **Xavfsizlik**: JWT autentifikatsiya, `bcryptjs` parol xeshlash, rollarga asoslangan ruxsat nazorati (`super_admin`, `mahalla_raisi`, `masul_xodim`, `fuqaro`), XSS sanitizatsiya, fayl format/hajm cheklovi (5MB), rate limiting va audit loglar.

## Ma'lumotlar bazasi (20 ta jadval)

SQLite (`better-sqlite3`) bazasida `users`, `roles`, `user_roles`, `news`, `news_categories`, `announcements`, `announcement_categories`, `events`, `event_registrations`, `appeals`, `appeal_categories`, `appeal_responses`, `appeal_status_history`, `notifications`, `polls`, `poll_options`, `poll_votes`, `gallery`, `mahalla_settings`, `audit_logs` jadvallari to‘liq yaratilgan.

## VS Code da ishga tushirish bo‘yicha ko‘rsatmalar

1. Loyihani VS Code da oching va terminalni ishga tushiring.
2. `.env.example` faylidan `.env` fayli yarating (kerak bo‘lsa `JWT_SECRET` va `DATABASE_PATH` ni sozlang).
3. Kutubxonalarni o‘rnating:
   ```bash
   npm install
   ```
4. Dasturni ishga tushiring:
   ```bash
   npm run dev
   ```
5. Brauzerda `http://localhost:3000` manzilini oching.

## Kirish tartibi

- **Admin panel**: Faqat tizimga biriktirilgan yagona administrator (`admin_sirojbek`) va uning yordamchilari ushbu login-parol orqali kirishi mumkin.
- **Fuqaro (sinov hisobi)**: `azizbek@mail.uz` | Parol: `Fuqaro2026!` (yoki ro‘yxatdan o‘tish orqali yangi fuqaro hisobi ochish mumkin).
