import { db } from './db.ts';
import { hashPassword } from './auth.ts';

export function seedDatabase() {
  const roleCount = (db.prepare('SELECT COUNT(*) as c FROM roles').get() as { c: number }).c;
  if (roleCount > 0) {
    expandMahallaContent();
    syncBatoshMahallaSettings();
    enforceSingleAdminAccount();
    return;
  }

  const insertRole = db.prepare(
    'INSERT INTO roles (name, display_name, description) VALUES (?, ?, ?)'
  );
  const rSuper = insertRole.run('super_admin', 'Super Admin', 'Tizimning asosiy administratori').lastInsertRowid;
  const rRais = insertRole.run('mahalla_raisi', 'Mahalla raisi', 'Mahalla boshqaruvi va murojaatlarni nazorat qilish').lastInsertRowid;
  const rXodim = insertRole.run('masul_xodim', "Mas'ul xodim", 'Biriktirilgan murojaatlarni ko‘rib chiqish').lastInsertRowid;
  const rFuqaro = insertRole.run('fuqaro', 'Fuqaro', 'Mahalla fuqarosi').lastInsertRowid;

  const insertUser = db.prepare(
    `INSERT INTO users (username, first_name, last_name, phone, email, password_hash, address, house_number, profile_completed, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 1)`
  );
  const assignRole = db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)');

  const uRais = insertUser.run(
    'rais',
    'Dilshod',
    'Karimov',
    '+998901234567',
    'rais@aqllimahalla.uz',
    hashPassword('Rais2026!'),
    "Batosh ko'chasi",
    '1-uy'
  ).lastInsertRowid;
  assignRole.run(uRais, rRais);

  const uAdmin = insertUser.run(
    'admin_sirojbek',
    'Sirojbek',
    'Umirzoqov',
    '+998900000001',
    'admin@aqllimahalla.uz',
    hashPassword('sirojbek.admin'),
    "Batosh ko'chasi",
    '2-uy'
  ).lastInsertRowid;
  assignRole.run(uAdmin, rSuper);

  const uXodim = insertUser.run(
    'xodim',
    'Madina',
    'Toshmatova',
    '+998901112233',
    'xodim@aqllimahalla.uz',
    hashPassword('Xodim2026!'),
    "Batosh ko'chasi",
    '8-uy'
  ).lastInsertRowid;
  assignRole.run(uXodim, rXodim);

  const uAzizbek = insertUser.run(
    'azizbek',
    'Azizbek',
    'Aliyev',
    '+998901234568',
    'azizbek@mail.uz',
    hashPassword('Fuqaro2026!'),
    "Chinor ko'chasi",
    '14-uy, 22-xonadon'
  ).lastInsertRowid;
  assignRole.run(uAzizbek, rFuqaro);

  const uDilnoza = insertUser.run(
    'dilnoza',
    'Dilnoza',
    'Rahimova',
    '+998903334455',
    'dilnoza@mail.uz',
    hashPassword('Fuqaro2026!'),
    "Navbahor ko'chasi",
    '7-uy'
  ).lastInsertRowid;
  assignRole.run(uDilnoza, rFuqaro);

  const uJasur = insertUser.run(
    'jasur',
    'Jasur',
    'Qodirov',
    '+998904445566',
    'jasur@mail.uz',
    hashPassword('Fuqaro2026!'),
    "Gulzor ko'chasi",
    '19-uy'
  ).lastInsertRowid;
  assignRole.run(uJasur, rFuqaro);

  // News categories
  const insertNewsCat = db.prepare('INSERT INTO news_categories (slug, name) VALUES (?, ?)');
  const ncIjtimoiy = insertNewsCat.run('ijtimoiy', 'Ijtimoiy').lastInsertRowid;
  const ncObodon = insertNewsCat.run('obodonlashtirish', 'Obodonlashtirish').lastInsertRowid;
  const ncTadbirlar = insertNewsCat.run('tadbirlar', 'Tadbirlar').lastInsertRowid;
  const ncBoshqa = insertNewsCat.run('boshqa', 'Boshqa').lastInsertRowid;

  const insertNews = db.prepare(
    `INSERT INTO news (title, category_id, image_url, extra_images, summary, content, author_id, status, published_at, views)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'published', ?, ?)`
  );

  insertNews.run(
    'Mahallamizda ko‘kalamzorlashtirish ishlari boshlandi',
    ncObodon,
    '/src/assets/images/news_tree_planting_1794910575885.jpg',
    JSON.stringify(['/src/assets/images/gallery_hashar_cleanup_1794910577943.jpg']),
    'Yashil hududlarni kengaytirish va piyodalar yo‘laklari bo‘ylab 250 tup manzarali ko‘chatlar ekish ishlari uyushqoqlik bilan boshlandi.',
    `<p>Mahallamiz hududini yanada ko‘rkam va ekologik toza maskanga aylantirish maqsadida keng ko‘lamli ko‘kalamzorlashtirish dasturi amalga oshirilmoqda.</p>
     <p>Mahalla faollari, nuroniylar va yoshlar ishtirokida markaziy xiyobon hamda ko‘p qavatli uylar atrofiga 250 tup chinor, kashtan va archa ko‘chatlari o‘tqazildi. Shuningdek, sug‘orish tizimi ham to‘liq yangilandi.</p>
     <h3>Keyingi bosqich rejalari</h3>
     <ul><li>Bolalar maydonchalari atrofida soyabon daraxtlar ekish</li><li>Har bir ko‘cha boshiga gulzorlar tashkil etish</li><li>Tomchilatib sug‘orish quvurlarini o‘rnatish</li></ul>`,
    uRais,
    '2026-11-12 10:30:00',
    284
  );

  insertNews.run(
    'Aholi bilan uchrashuv o‘tkazildi',
    ncIjtimoiy,
    '/src/assets/images/news_community_meeting_1794910577555.jpg',
    JSON.stringify(['/src/assets/images/hero_mahalla_park_1794910575937.jpg']),
    'Mahalla markaziy majlislar zalida fuqarolarning taklif va muammolarini tinglashga bag‘ishlangan ochiq muloqot tashkil etildi.',
    `<p>Kecha mahalla fuqarolar yig‘ini binosida mahalla raisi Dilshod Karimov boshchiligida aholi bilan navbatdagi ochiq muloqot bo‘lib o‘tdi.</p>
     <p>Uchrashuv davomida kuz-qish mavsumiga tayyorgarlik, ichki yo‘llarni ta'mirlash, yoshlar bandligini ta'minlash va kommunal xizmatlar sifatini oshirish masalalari atroflicha muhokama qilindi.</p>
     <p>Fuqarolar tomonidan bildirilgan 18 ta murojaat joyida nazoratga olinib, mas'ul xodimlarga aniq topshiriqlar berildi.</p>`,
    uRais,
    '2026-11-10 15:00:00',
    196
  );

  insertNews.run(
    'Yangi sport maydonchasi foydalanishga topshirildi',
    ncTadbirlar,
    '/src/assets/images/news_sports_playground_1794910576970.jpg',
    JSON.stringify([]),
    'Bolalar va yoshlar bo‘sh vaqtini mazmunli o‘tkazish uchun zamonaviy rezina qoplamali sport va o‘yin maydonchasi ochildi.',
    `<p>Mahallamizning 3-mavzesida uzoq kutilgan zamonaviy sport va bolalar o‘yin maydonchasi tantanali ravishda foydalanishga topshirildi.</p>
     <p>Maydonchada mini-futbol, basketbol, stritbol zonalari hamda bolalar uchun xavfsiz arg‘imchoq va o‘yin majmualari o‘rnatilgan. Kechki paytda foydalanish uchun LED yoritgichlar ham ishga tushirildi.</p>`,
    uXodim,
    '2026-11-08 09:00:00',
    342
  );

  insertNews.run(
    'Keksalar holidan xabar olish aksiyasi yakunlandi',
    ncBoshqa,
    '/src/assets/images/gallery_hashar_cleanup_1794910577943.jpg',
    JSON.stringify([]),
    'Mahalla yoshlar yetakchisi va volontyorlar tomonidan yolg‘iz yashovchi nuroniylarga oziq-ovqat va tibbiy yordam ko‘rsatildi.',
    `<p>Mehr-oqibat va saxovat oyligi doirasida mahallamizdagi 24 nafar nuroniy va ehtiyojmand oila holidan xabar olindi. Ularga zarur oziq-ovqat jamlanmalari hamda shifokor ko‘rigi tashkil etildi.</p>`,
    uXodim,
    '2026-11-03 14:20:00',
    158
  );

  // Announcement categories
  const insertAnnCat = db.prepare('INSERT INTO announcement_categories (slug, name) VALUES (?, ?)');
  const acMuhim = insertAnnCat.run('muhim', "Muhim e'lonlar").lastInsertRowid;
  const acKommunal = insertAnnCat.run('kommunal', 'Kommunal xizmatlar').lastInsertRowid;
  const acIjtimoiy = insertAnnCat.run('ijtimoiy', 'Ijtimoiy yordam').lastInsertRowid;
  const acIsh = insertAnnCat.run('ish', "Ish o'rinlari").lastInsertRowid;
  const acTalim = insertAnnCat.run('talim', "Ta'lim").lastInsertRowid;
  insertAnnCat.run('boshqa', 'Boshqa');

  const insertAnn = db.prepare(
    `INSERT INTO announcements (title, category_id, image_url, content, is_important, is_banner, author_id, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  insertAnn.run(
    '22-noyabr kuni mahallamizda ommaviy hashar o‘tkaziladi',
    acMuhim,
    '/src/assets/images/gallery_hashar_cleanup_1794910577943.jpg',
    `<p>Hurmatli mahalladoshlar! Yakshanba kuni soat 08:30 dan boshlab barcha ko‘cha va ko‘p qavatli uylar atrofida umumxalq obodonlashtirish hashari o‘tkaziladi.</p>
     <p>Barcha fuqarolarni mahallamiz ozodaligi va ko‘kalamzorlashtirish ishlarida faol qatnashishga chorlaymiz. Zarur anjomlar mahalla idorasidan tarqatiladi.</p>`,
    1,
    1,
    uRais,
    '2026-11-16 09:00:00'
  );

  insertAnn.run(
    'Ichimlik suvi quvurlarida profilaktika ishlari',
    acKommunal,
    '',
    `<p>19-noyabr kuni soat 09:00 dan 17:00 gacha Chinor va Navbahor ko‘chalarida suv bosimini oshirish maqsadida rejali ta'mirlash ishlari olib boriladi. Iltimos, oldindan suv zaxirasini tayyorlab qo‘ying.</p>`,
    1,
    0,
    uXodim,
    '2026-11-15 11:30:00'
  );

  insertAnn.run(
    'Yoshlar uchun bepul dasturlash va ingliz tili kurslari',
    acTalim,
    '/src/assets/images/news_community_meeting_1794910577555.jpg',
    `<p>Mahalla yoshlar markazida 14 yoshdan 25 yoshgacha bo‘lgan yoshlar uchun bepul Frontend dasturlash va ingliz tili to‘garaklariga qabul boshlandi. Darslar haftasiga 3 marta o‘tkaziladi.</p>`,
    0,
    0,
    uXodim,
    '2026-11-13 16:15:00'
  );

  insertAnn.run(
    'Mahalla tikuvchilik sexiga bo‘sh ish o‘rinlari',
    acIsh,
    '',
    `<p>Mahalla hududida yangi ochilgan tikuvchilik korxonasiga 15 nafar malakali tikuvchi va shogirdlar ishga taklif etiladi. Oylik maosh kelishilgan holda, tushlik korxona hisobidan.</p>`,
    0,
    0,
    uRais,
    '2026-11-11 10:00:00'
  );

  insertAnn.run(
    'Kam ta’minlangan oilalar uchun qishki yordam dasturi',
    acIjtimoiy,
    '',
    `<p>Ijtimoiy himoya reyestriga kiritilgan oilalarga bir martalik moddiy yordam va isitish jihozlari bo‘yicha arizalar mahalla idorasida har kuni soat 09:00 dan 18:00 gacha qabul qilinmoqda.</p>`,
    1,
    0,
    uRais,
    '2026-11-09 14:00:00'
  );

  // Events (4 upcoming relative to 2026-11-17, 2 past)
  const insertEvent = db.prepare(
    `INSERT INTO events (title, category, description, event_date, event_time, location, capacity, image_url, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const ev1 = insertEvent.run(
    'Hashar tadbiri',
    'Hashar',
    'Mahalla hududini tozalash, daraxtlarni oqlash va gulzorlarni tartibga keltirish bo‘yicha ommaviy hashar.',
    '2026-11-22',
    '09:00',
    'Mahalla hududi',
    150,
    '/src/assets/images/gallery_hashar_cleanup_1794910577943.jpg',
    uRais
  ).lastInsertRowid;

  const ev2 = insertEvent.run(
    'Sport musobaqasi',
    'Sport',
    'Mahalla yoshlari va havaskor jamoalar o‘rtasida mini-futbol va shaxmat bo‘yicha mahalla kubogi.',
    '2026-11-28',
    '10:00',
    'Sport maydoni',
    80,
    '/src/assets/images/news_sports_playground_1794910576970.jpg',
    uXodim
  ).lastInsertRowid;

  insertEvent.run(
    'Bayram tadbiri',
    'Bayram',
    'Konstitutsiya kuni munosabati bilan mahalla markazida madaniy-ma’rifiy konsert va osh dasturxoni.',
    '2026-12-07',
    '18:00',
    'Mahalla markazi',
    200,
    '/src/assets/images/hero_mahalla_park_1794910575937.jpg',
    uRais
  );

  insertEvent.run(
    'Yoshlar uchrashuvi',
    'Uchrashuv',
    'Tadbirkorlik va IT sohasida faoliyat yuritayotgan mahalla yoshlari bilan tajriba almashish uchrashuvi.',
    '2026-12-12',
    '15:00',
    'Yoshlar markazi',
    60,
    '/src/assets/images/news_community_meeting_1794910577555.jpg',
    uXodim
  );

  // Past events
  insertEvent.run(
    'Aholi bilan uchrashuv',
    'Uchrashuv',
    'Kuz-qish mavsumiga tayyorgarlik bo‘yicha hisobot yig‘ilishi.',
    '2026-11-05',
    '16:00',
    'Mahalla majlislar zali',
    120,
    '/src/assets/images/news_community_meeting_1794910577555.jpg',
    uRais
  );

  insertEvent.run(
    'Ekologik tadbir',
    'Ekologiya',
    'Yashil makon loyihasi doirasida kuzgi ko‘chat ekish aksiyasi.',
    '2026-10-25',
    '09:30',
    'Markaziy xiyobon',
    100,
    '/src/assets/images/news_tree_planting_1794910575885.jpg',
    uRais
  );

  // Seed registrations
  db.prepare('INSERT INTO event_registrations (event_id, user_id) VALUES (?, ?)').run(ev1, uAzizbek);
  db.prepare('INSERT INTO event_registrations (event_id, user_id) VALUES (?, ?)').run(ev1, uDilnoza);
  db.prepare('INSERT INTO event_registrations (event_id, user_id) VALUES (?, ?)').run(ev2, uJasur);

  // Appeal categories
  const insertAppCat = db.prepare('INSERT INTO appeal_categories (slug, name) VALUES (?, ?)');
  const apYol = insertAppCat.run('yol-tamiri', "Yo'l ta'miri").lastInsertRowid;
  const apSuv = insertAppCat.run('suv-taminoti', "Suv ta'minoti").lastInsertRowid;
  const apElektr = insertAppCat.run('elektr', 'Elektr energiyasi').lastInsertRowid;
  insertAppCat.run('gaz', "Gaz ta'minoti");
  const apObodon = insertAppCat.run('obodonlashtirish', 'Obodonlashtirish').lastInsertRowid;
  insertAppCat.run('ijtimoiy', 'Ijtimoiy yordam');
  insertAppCat.run('boshqa', 'Boshqa');

  const insertAppeal = db.prepare(
    `INSERT INTO appeals (tracking_number, user_id, category_id, subject, message, status, assigned_to, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insertHist = db.prepare(
    `INSERT INTO appeal_status_history (appeal_id, old_status, new_status, changed_by, note, changed_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const insertResp = db.prepare(
    `INSERT INTO appeal_responses (appeal_id, responder_id, response_text, created_at)
     VALUES (?, ?, ?, ?)`
  );

  const a1 = insertAppeal.run(
    'MRJ-2026-0001',
    uAzizbek,
    apYol,
    "Yo'l ta'miri kerak",
    "Chinor ko'chasi 14-uy oldidagi piyodalar yo'lagi va asfalt qoplamasi yomg'irdan keyin cho'kib qolgan. Ta'mirlab berishingizni so'rayman.",
    'jarayonda',
    uXodim,
    '2026-11-12 14:30:00',
    '2026-11-14 11:00:00'
  ).lastInsertRowid;
  insertHist.run(a1, null, 'yangi', uAzizbek, 'Murojaat yuborildi', '2026-11-12 14:30:00');
  insertHist.run(a1, 'yangi', 'korib_chiqilmoqda', uRais, "Mas'ul xodimga yo'naltirildi", '2026-11-13 09:15:00');
  insertHist.run(a1, 'korib_chiqilmoqda', 'jarayonda', uXodim, "Ta'mirlash brigadasi jalb qilindi", '2026-11-14 11:00:00');

  const a2 = insertAppeal.run(
    'MRJ-2026-0002',
    uAzizbek,
    apSuv,
    "Suv ta'minoti",
    "Kechki soat 19:00 dan keyin 4-qavatlarda ichimlik suvi bosimi pasayib ketmoqda.",
    'korib_chiqilmoqda',
    uXodim,
    '2026-11-10 13:20:00',
    '2026-11-11 10:00:00'
  ).lastInsertRowid;
  insertHist.run(a2, null, 'yangi', uAzizbek, 'Murojaat yuborildi', '2026-11-10 13:20:00');
  insertHist.run(a2, 'yangi', 'korib_chiqilmoqda', uRais, 'Suvsoz mutaxassisiga yuborildi', '2026-11-11 10:00:00');

  const a3 = insertAppeal.run(
    'MRJ-2026-0003',
    uAzizbek,
    apElektr,
    "Ko'cha yoritgichi",
    "Chinor ko'chasi burchagidagi 2 ta tungi yoritish chirog'i ishlamay qoldi.",
    'javob_berildi',
    uXodim,
    '2026-11-05 09:40:00',
    '2026-11-08 16:30:00'
  ).lastInsertRowid;
  insertHist.run(a3, null, 'yangi', uAzizbek, 'Murojaat yuborildi', '2026-11-05 09:40:00');
  insertHist.run(a3, 'yangi', 'javob_berildi', uXodim, 'Chiroqlar almashtirildi', '2026-11-08 16:30:00');
  insertResp.run(
    a3,
    uXodim,
    "Hurmatli Azizbek, murojaatingiz asosida ko'cha yoritgichlari yangi LED lampalarga almashtirildi va to'liq ishga tushirildi.",
    '2026-11-08 16:30:00'
  );

  const a4 = insertAppeal.run(
    'MRJ-2026-0004',
    uDilnoza,
    apObodon,
    "Bolalar maydonchasi o'rindig'i",
    "2-dom hovlisidagi o'rindiqlarni bo'yash va bitta singan taxtasini almashtirish zarur.",
    'yangi',
    null,
    '2026-11-15 11:10:00',
    '2026-11-15 11:10:00'
  ).lastInsertRowid;
  insertHist.run(a4, null, 'yangi', uDilnoza, 'Murojaat yuborildi', '2026-11-15 11:10:00');

  const a5 = insertAppeal.run(
    'MRJ-2026-0005',
    uJasur,
    apYol,
    "Bog'cha oldidagi piyodalar o'tish joyi",
    "12-sonli bog'cha oldidagi piyodalar yo'lagi chizig'ini yangilash kerak.",
    'javob_berildi',
    uRais,
    '2026-10-20 10:00:00',
    '2026-10-25 15:00:00'
  ).lastInsertRowid;
  insertHist.run(a5, null, 'yangi', uJasur, 'Murojaat yuborildi', '2026-10-20 10:00:00');
  insertHist.run(a5, 'yangi', 'javob_berildi', uRais, 'Chiziqlar yangilandi', '2026-10-25 15:00:00');
  insertResp.run(a5, uRais, "Yo'l harakati xavfsizligi bo'limi bilan hamkorlikda zebra chizig'i yangilandi.", '2026-10-25 15:00:00');

  // Notifications
  const insertNotif = db.prepare(
    `INSERT INTO notifications (user_id, title, message, type, link, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  insertNotif.run(
    uAzizbek,
    'Murojaatingizga javob berildi',
    "MRJ-2026-0003 raqamli 'Ko'cha yoritgichi' murojaatingiz bo'yicha rasmiy javob yozildi.",
    'appeal',
    `/appeals/${a3}`,
    0,
    '2026-11-08 16:31:00'
  );
  insertNotif.run(
    uAzizbek,
    'Murojaat holati yangilandi',
    "MRJ-2026-0001 raqamli murojaatingiz 'Jarayonda' holatiga o'tkazildi.",
    'appeal',
    `/appeals/${a1}`,
    0,
    '2026-11-14 11:01:00'
  );
  insertNotif.run(
    uAzizbek,
    "Yangi muhim e'lon",
    "22-noyabr kuni mahallamizda ommaviy hashar o'tkaziladi.",
    'announcement',
    '/announcements',
    0,
    '2026-11-16 09:05:00'
  );
  insertNotif.run(
    uAzizbek,
    'Yangi tadbir: Sport musobaqasi',
    '28-noyabr kuni mahalla sport maydonida mini-futbol musobaqasi bo‘lib o‘tadi.',
    'event',
    '/events',
    1,
    '2026-11-12 10:00:00'
  );

  // Polls
  const p1 = db.prepare(
    `INSERT INTO polls (question, description, is_active, created_by) VALUES (?, ?, 1, ?)`
  ).run(
    'Mahallamizda qaysi muammoni birinchi hal qilish kerak?',
    'Kelgusi chorak byudjetini taqsimlashda aholining ustuvor fikri hisobga olinadi.',
    uRais
  ).lastInsertRowid;

  const insertOpt = db.prepare('INSERT INTO poll_options (poll_id, option_text) VALUES (?, ?)');
  const opt1 = insertOpt.run(p1, "Ichki yo'llarni asfaltlash").lastInsertRowid;
  const opt2 = insertOpt.run(p1, 'Ichimlik suvi bosimini oshirish').lastInsertRowid;
  const opt3 = insertOpt.run(p1, "Ko'chalarni tungi yoritish").lastInsertRowid;
  insertOpt.run(p1, 'Yashil hudud va bog‘larni kengaytirish');

  db.prepare('INSERT INTO poll_votes (poll_id, option_id, user_id) VALUES (?, ?, ?)').run(p1, opt1, uDilnoza);
  db.prepare('INSERT INTO poll_votes (poll_id, option_id, user_id) VALUES (?, ?, ?)').run(p1, opt2, uJasur);
  db.prepare('INSERT INTO poll_votes (poll_id, option_id, user_id) VALUES (?, ?, ?)').run(p1, opt3, uXodim);

  // Gallery
  const insertGal = db.prepare(
    `INSERT INTO gallery (title, category, image_url, description, uploaded_by) VALUES (?, ?, ?, ?, ?)`
  );
  insertGal.run(
    'Kuzgi hashar va gulzorlar parvarishi',
    'Hashar',
    '/src/assets/images/gallery_hashar_cleanup_1794910577943.jpg',
    'Mahalla ahli bilan birgalikdagi obodonlashtirish hashari',
    uRais
  );
  insertGal.run(
    "Ko'chat ekish aksiyasi",
    'Tadbirlar',
    '/src/assets/images/news_tree_planting_1794910575885.jpg',
    'Yashil makon loyihasi doirasida daraxt ekish',
    uRais
  );
  insertGal.run(
    'Aholi bilan ochiq muloqot',
    'Uchrashuvlar',
    '/src/assets/images/news_community_meeting_1794910577555.jpg',
    'Mahalla majlislar zalidagi uchrashuv',
    uXodim
  );
  insertGal.run(
    'Yangi sport maydonchasi',
    'Sport',
    '/src/assets/images/news_sports_playground_1794910576970.jpg',
    'Yoshlar va bolalar uchun zamonaviy sport hududi',
    uXodim
  );
  insertGal.run(
    'Batosh mahallasi markaziy xiyoboni',
    'Hudud',
    '/src/assets/images/hero_mahalla_park_1794910575937.jpg',
    'Batosh MFY ning zamonaviy turar-joy va sayr hududi',
    uRais
  );

  // Single Mahalla Settings
  db.prepare(
    `INSERT INTO mahalla_settings (
      id, mahalla_name, tagline, hero_description, population_count, history,
      chairman_name, chairman_bio, chairman_phone, address, phone, email,
      activities, staff_json, social_links_json, banner_text, banner_link, map_lat, map_lng
    ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    'Batosh MFY',
    'Mahallamiz — endi bir qadam yaqinroq!',
    'Qashqadaryo viloyati, G‘uzor tumani Batosh MFY yangiliklaridan xabardor bo‘ling, murojaat qiling va mahalla hayotida faol ishtirok eting.',
    1248,
    "Batosh mahalla fuqarolar yig'ini Qashqadaryo viloyati G'uzor tumanidagi obod, ahil va jadal rivojlanayotgan mahallalardan biri hisoblanadi. Mahallada zamonaviy turar-joylar, ta'lim maskanlari, sport maydonchalari hamda aholiga qulay xizmat ko'rsatish shoxobchalari faoliyat yuritmoqda.",
    'Dilshod Karimov',
    "Batosh mahalla fuqarolar yig'ini raisi sifatida aholi murojaatlarini tezkor hal etish, hududni obodonlashtirish hamda yoshlar va oilalarni qo'llab-quvvatlash tashabbuslarini boshqarib kelmoqda.",
    '+998 90 123 45 67',
    'Qashqadaryo viloyati, G‘uzor tumani, Batosh MFY, Markaziy ko‘cha, 1-uy',
    '+998 90 123 45 67',
    'info@batoshmfy.uz',
    "Batosh MFY hududida har hafta obodonlashtirish hashari, yoshlar uchun sport va ta'lim to'garaklari, nuroniylar bilan uchrashuvlar hamda fuqarolar qabuli muntazam o'tkazib kelinadi.",
    JSON.stringify([
      { name: 'Dilshod Karimov', role: 'Batosh MFY raisi', phone: '+998 90 123 45 67', schedule: 'Dushanba–Juma, 09:00–18:00' },
      { name: 'Madina Toshmatova', role: "Xotin-qizlar va ijtimoiy masalalar bo'yicha mas'ul", phone: '+998 90 111 22 33', schedule: 'Dushanba–Juma, 09:00–17:00' },
      { name: 'Rustam Vohidov', role: 'Yoshlar yetakchisi', phone: '+998 90 555 66 77', schedule: 'Seshanba–Shanba, 10:00–18:00' },
      { name: 'Akmal Rahmonov', role: 'Profilaktika inspektori', phone: '+998 90 777 88 99', schedule: 'Har kuni, 24/7 navbatchilik' },
    ]),
    JSON.stringify({
      telegram: 'https://t.me/batosh_mfy',
      youtube: 'https://youtube.com',
      facebook: 'https://facebook.com',
      instagram: 'https://instagram.com',
    }),
    'Diqqat! 22-noyabr kuni Batosh MFY hududida ommaviy hashar o‘tkaziladi.',
    '/announcements',
    38.6203,
    66.2481
  );

  expandMahallaContent();
}

export function expandMahallaContent() {
  const adminUser = db.prepare(`SELECT id FROM users ORDER BY id ASC LIMIT 1`).get() as { id: number } | undefined;
  const azizbek = db.prepare(`SELECT id FROM users WHERE email = 'azizbek@mail.uz'`).get() as { id: number } | undefined;
  const dilnoza = db.prepare(`SELECT id FROM users WHERE email = 'dilnoza@mail.uz'`).get() as { id: number } | undefined;
  const jasur = db.prepare(`SELECT id FROM users WHERE email = 'jasur@mail.uz'`).get() as { id: number } | undefined;
  if (!adminUser || !azizbek) return;

  const getCatId = (table: string, slug: string): number => {
    const row = db.prepare(`SELECT id FROM ${table} WHERE slug = ?`).get(slug) as { id: number } | undefined;
    if (row) return row.id;
    const first = db.prepare(`SELECT id FROM ${table} ORDER BY id ASC LIMIT 1`).get() as { id: number };
    return first.id;
  };

  // 1. Expanded News
  const extraNews = [
    {
      title: 'Yangi LED ko‘cha chiroqlari o‘rnatildi',
      slug: 'obodonlashtirish',
      img: '/src/assets/images/hero_mahalla_park_1794910575937.jpg',
      summary: "Chinor va Gulzor ko'chalari bo'ylab 38 ta energiya tejovchi quyosh panelli LED chiroqlar ishga tushirildi.",
      content: "<p>Mahallamizda tungi xavfsizlikni oshirish va elektr energiyasini tejash maqsadida ichki ko'chalarga zamonaviy LED yoritgichlar o'rnatildi.</p><p>Yangi tizim qorong'u tushishi bilan avtomatik tarzda yonadi va tong otganda o'chadi.</p>",
      date: '2026-11-15 11:00:00',
      views: 215,
    },
    {
      title: 'Mahalla kutubxonasi 400 ta yangi kitob bilan boyitildi',
      slug: 'ijtimoiy',
      img: '/src/assets/images/news_community_meeting_1794910577555.jpg',
      summary: "Badiiy adabiyot, bolalar ertaklari va zamonaviy kasb-hunar qo'llanmalari kutubxona fondiga topshirildi.",
      content: "<p>Yoshlarning kitobxonlik madaniyatini rivojlantirish loyihasi doirasida mahalla kutubxonasi 400 dan ziyod o'zbek va jahon adabiyoti namunalari bilan to'ldirildi.</p>",
      date: '2026-11-14 09:30:00',
      views: 174,
    },
    {
      title: 'Kuzgi mini-futbol musobaqasi g‘oliblari taqdirlandi',
      slug: 'tadbirlar',
      img: '/src/assets/images/news_sports_playground_1794910576970.jpg',
      summary: "Mahalla kubogi uchun 8 ta jamoa o'rtasida kechgan bahslarda 2-mavze yoshlari birinchi o'rinni qo'lga kiritdi.",
      content: "<p>Yangi sport maydonchasida o'tkazilgan mahalla birinchiligi ko'tarinki ruhda yakunlandi. G'olib jamoalarga kubok, medallar va sport anjomlari topshirildi.</p>",
      date: '2026-11-11 17:00:00',
      views: 263,
    },
    {
      title: 'Bepul tibbiy ko‘rik kuni muvaffaqiyatli o‘tkazildi',
      slug: 'ijtimoiy',
      img: '/src/assets/images/news_community_meeting_1794910577555.jpg',
      summary: "Oilaviy poliklinika shifokorlari tomonidan 140 nafardan ortiq fuqaro profilaktik ko'rikdan o'tkazildi.",
      content: "<p>Mahalla binosida tashkil etilgan sayyor tibbiy ko'rik davomida kardiolog, terapevt va pediatr mutaxassislari aholiga bepul maslahatlar berdi.</p>",
      date: '2026-11-06 13:15:00',
      views: 189,
    },
    {
      title: 'Ichki yo‘laklarda piyodalar xavfsizligi belgilari yangilandi',
      slug: 'obodonlashtirish',
      img: '/src/assets/images/news_tree_planting_1794910575885.jpg',
      summary: "Maktab va bog'cha atrofidagi o'tish joylariga yangi yo'l chiziqlari chizildi.",
      content: "<p>Bolalar xavfsizligini ta'minlash maqsadida mahalla hududidagi barcha ta'lim muassasalari oldida tezlikni cheklovchi belgilar va zebra chiziqlari yangilandi.</p>",
      date: '2026-11-01 10:00:00',
      views: 142,
    },
    {
      title: 'Mahalla hunarmandlari va tadbirkorlari yarmarkasi o‘tdi',
      slug: 'boshqa',
      img: '/src/assets/images/gallery_hashar_cleanup_1794910577943.jpg',
      summary: "Oila tadbirkorlari tomonidan tayyorlangan milliy mahsulotlar va pishiriqlar ko'rgazma-savdosi tashkil etildi.",
      content: "<p>Yarmarkada 20 dan ortiq mahalliy tadbirkor va o'zini o'zi band qilgan fuqarolar o'z mahsulotlarini namoyish etdi.</p>",
      date: '2026-10-28 12:00:00',
      views: 131,
    },
  ];

  const checkNews = db.prepare('SELECT id FROM news WHERE title = ?');
  const insNews = db.prepare(
    `INSERT INTO news (title, category_id, image_url, extra_images, summary, content, author_id, status, published_at, views)
     VALUES (?, ?, ?, '[]', ?, ?, ?, 'published', ?, ?)`
  );
  for (const n of extraNews) {
    if (!checkNews.get(n.title)) {
      insNews.run(n.title, getCatId('news_categories', n.slug), n.img, n.summary, n.content, adminUser.id, n.date, n.views);
    }
  }

  // 2. Expanded Announcements
  const extraAnns = [
    {
      title: 'Gaz tarmoqlarida qishki mavsum oldidan texnik ko‘rik',
      slug: 'kommunal',
      img: '',
      content: "<p>20-noyabr kuni soat 10:00 dan 16:00 gacha gaz taqsimlash punktlarida bosimni me'yorlashtirish ishlari olib boriladi. Iltimos, gaz jihozlarini nazoratda saqlang.</p>",
      important: 1,
      date: '2026-11-16 14:00:00',
    },
    {
      title: 'Qishki isitish mavsumida xavfsizlik qoidalariga rioya qiling',
      slug: 'muhim',
      img: '',
      content: "<p>Hurmatli fuqarolar! Isitish pechlari va dudburonlarni o'z vaqtida tozalating. Nostandart gaz va elektr isitgichlardan foydalanmang.</p>",
      important: 1,
      date: '2026-11-14 16:00:00',
    },
    {
      title: 'Ayollar tadbirkorligi uchun imtiyozli kredit maslahat kuni',
      slug: 'ish',
      img: '/src/assets/images/news_community_meeting_1794910577555.jpg',
      content: "<p>Har payshanba soat 14:00 da mahalla binosida bank mutaxassislari ishtirokida oilaviy tadbirkorlik va imtiyozli kredit olish tartibi bo'yicha bepul maslahat beriladi.</p>",
      important: 0,
      date: '2026-11-12 10:00:00',
    },
    {
      title: 'Maktab o‘quvchilari uchun shaxmat va matematika to‘garagi',
      slug: 'talim',
      img: '/src/assets/images/news_sports_playground_1794910576970.jpg',
      content: "<p>7 yoshdan 16 yoshgacha bo'lgan o'quvchilar uchun bepul shaxmat va mantiqiy matematika darslariga ro'yxatga olish davom etmoqda.</p>",
      important: 0,
      date: '2026-11-10 09:00:00',
    },
    {
      title: 'Mahalla oilaviy poliklinikasida bepul chuqurlashtirilgan ko‘rik',
      slug: 'ijtimoiy',
      img: '',
      content: "<p>Keksalar va surunkali kasalligi mavjud fuqarolar uchun 24-noyabr kuni bepul laboratoriya va UTT tekshiruvlari tashkil etiladi.</p>",
      important: 1,
      date: '2026-11-08 11:00:00',
    },
  ];

  const checkAnn = db.prepare('SELECT id FROM announcements WHERE title = ?');
  const insAnn = db.prepare(
    `INSERT INTO announcements (title, category_id, image_url, content, is_important, is_banner, author_id, published_at)
     VALUES (?, ?, ?, ?, ?, 0, ?, ?)`
  );
  for (const a of extraAnns) {
    if (!checkAnn.get(a.title)) {
      insAnn.run(a.title, getCatId('announcement_categories', a.slug), a.img, a.content, a.important, adminUser.id, a.date);
    }
  }

  // 3. Expanded Events
  const extraEvents = [
    {
      title: "Tibbiy ko'rik kuni",
      category: 'Ijtimoiy',
      desc: "Barcha mahalla aholisi uchun bepul profilaktik tibbiy ko'rik va shifokor maslahati.",
      date: '2026-11-25',
      time: '09:00',
      loc: 'Mahalla poliklinikasi',
      cap: 120,
      img: '/src/assets/images/news_community_meeting_1794910577555.jpg',
    },
    {
      title: "Kitobxonlik va ma'rifat kechasi",
      category: 'Ta’lim',
      desc: 'Yoshlar va ota-onalar ishtirokida yangi kitoblar taqdimoti va viktorina.',
      date: '2026-12-02',
      time: '17:00',
      loc: 'Mahalla kutubxonasi',
      cap: 50,
      img: '/src/assets/images/news_community_meeting_1794910577555.jpg',
    },
    {
      title: 'Tadbirkorlar bilan ochiq muloqot',
      category: 'Uchrashuv',
      desc: "Mahalla hududida yangi ish o'rinlari yaratish va xizmat ko'rsatish shoxobchalarini qo'llab-quvvatlash.",
      date: '2026-12-16',
      time: '14:00',
      loc: 'Mahalla majlislar zali',
      cap: 70,
      img: '/src/assets/images/hero_mahalla_park_1794910575937.jpg',
    },
    {
      title: 'Yangi yil bayram archasi',
      category: 'Bayram',
      desc: "Bolalar va oilalar uchun bayram tomoshasi, sovg'alar va konsert dasturi.",
      date: '2026-12-28',
      time: '16:00',
      loc: 'Markaziy sayilgoh',
      cap: 250,
      img: '/src/assets/images/hero_mahalla_park_1794910575937.jpg',
    },
    {
      title: 'Mustaqillik bayrami sayli',
      category: 'Bayram',
      desc: 'Mahalla aholisi uchun bayram dasturxoni va madaniy tadbir.',
      date: '2026-09-01',
      time: '18:00',
      loc: 'Mahalla markazi',
      cap: 200,
      img: '/src/assets/images/hero_mahalla_park_1794910575937.jpg',
    },
    {
      title: 'Maktab bozori yarmarkasi',
      category: 'Ijtimoiy',
      desc: "O'quv qurollari va maktab formalarining arzonlashtirilgan savdo yarmarkasi.",
      date: '2026-08-22',
      time: '09:00',
      loc: 'Markaziy maydon',
      cap: 180,
      img: '/src/assets/images/gallery_hashar_cleanup_1794910577943.jpg',
    },
  ];

  const checkEv = db.prepare('SELECT id FROM events WHERE title = ?');
  const insEv = db.prepare(
    `INSERT INTO events (title, category, description, event_date, event_time, location, capacity, image_url, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const e of extraEvents) {
    if (!checkEv.get(e.title)) {
      insEv.run(e.title, e.category, e.desc, e.date, e.time, e.loc, e.cap, e.img, adminUser.id);
    }
  }

  // 4. Expanded Appeals
  const citizens = [azizbek.id, dilnoza?.id || azizbek.id, jasur?.id || azizbek.id];
  const extraAppeals = [
    {
      code: 'MRJ-2026-0006',
      userId: citizens[0],
      slug: 'gaz',
      subject: 'Gaz bosimi pastligi',
      msg: "Chinor ko'chasi 14-uyda kechki payt gaz bosimi sezilarli darajada pasayib ketmoqda. Tekshirib berishingizni so'rayman.",
      status: 'jarayonda',
      resp: '',
      created: '2026-11-14 10:15:00',
    },
    {
      code: 'MRJ-2026-0007',
      userId: citizens[1],
      slug: 'obodonlashtirish',
      subject: "Chiqindi qutilarini ko'paytirish",
      msg: "Sayr yo'lagi bo'ylab qo'shimcha chiqindi qutilari o'rnatilsa hudud yanada ozoda bo'lar edi.",
      status: 'yangi',
      resp: '',
      created: '2026-11-16 09:40:00',
    },
    {
      code: 'MRJ-2026-0008',
      userId: citizens[2],
      slug: 'ijtimoiy',
      subject: "Moddiy yordam bo'yicha murojaat",
      msg: "Qishki mavsumda isitish xarajatlari uchun ijtimoiy ko'mak dasturiga hujjat topshirish tartibi bo'yicha yordam so'rayman.",
      status: 'korib_chiqilmoqda',
      resp: '',
      created: '2026-11-13 15:20:00',
    },
    {
      code: 'MRJ-2026-0009',
      userId: citizens[0],
      slug: 'boshqa',
      subject: "Podyezd eshigi domofonini ta'mirlash",
      msg: "2-podyezd kirish eshigidagi domofon magniti ishlamay qolgan.",
      status: 'javob_berildi',
      resp: "Domofon ustasi jalb qilinib, eshik qulfi va magnit tizimi to'liq ta'mirlandi.",
      created: '2026-11-04 11:05:00',
    },
    {
      code: 'MRJ-2026-0010',
      userId: citizens[1],
      slug: 'elektr',
      subject: 'Elektr shitini tartibga keltirish',
      msg: "5-uy hovlisidagi elektr taqsimlash qutisining eshigi ochiq qolgan, xavfsizlik uchun yopib qo'yish kerak.",
      status: 'yopildi',
      resp: "Hududiy elektr tarmoqlari xodimi tomonidan quti qulflandi va xavfsiz holatga keltirildi.",
      created: '2026-10-29 14:10:00',
    },
    {
      code: 'MRJ-2026-0011',
      userId: citizens[2],
      slug: 'obodonlashtirish',
      subject: '3-uy oldidagi ariqni tozalash',
      msg: "Xazonrezgi sababli ariqda suv to'planib qolmoqda, tozalash ishlarida yordam berishingizni so'raymiz.",
      status: 'javob_berildi',
      resp: "Obodonlashtirish brigadasi tomonidan ariqlar tozalandi.",
      created: '2026-11-02 08:50:00',
    },
    {
      code: 'MRJ-2026-0012',
      userId: citizens[0],
      slug: 'yol-tamiri',
      subject: "Asfalt qoplamasi yoriqlarini ta'mirlash",
      msg: "Navbahor ko'chasiga kirish qismida chuqurchalar paydo bo'lgan, avtotransport harakatiga xalaqit bermoqda.",
      status: 'yangi',
      resp: '',
      created: '2026-11-16 17:30:00',
    },
  ];

  const checkApp = db.prepare('SELECT id FROM appeals WHERE tracking_number = ?');
  const insApp = db.prepare(
    `INSERT INTO appeals (tracking_number, user_id, category_id, subject, message, status, assigned_to, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const insHist = db.prepare(
    `INSERT INTO appeal_status_history (appeal_id, old_status, new_status, changed_by, note, changed_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  const insResp = db.prepare(
    `INSERT INTO appeal_responses (appeal_id, responder_id, response_text, created_at)
     VALUES (?, ?, ?, ?)`
  );

  for (const ap of extraAppeals) {
    if (!checkApp.get(ap.code)) {
      const info = insApp.run(
        ap.code,
        ap.userId,
        getCatId('appeal_categories', ap.slug),
        ap.subject,
        ap.msg,
        ap.status,
        ap.status === 'yangi' ? null : adminUser.id,
        ap.created,
        ap.created
      );
      const id = Number(info.lastInsertRowid);
      insHist.run(id, null, 'yangi', ap.userId, 'Murojaat yuborildi', ap.created);
      if (ap.status !== 'yangi') {
        insHist.run(id, 'yangi', ap.status, adminUser.id, ap.resp || 'Nazoratga olindi', ap.created);
      }
      if (ap.resp) {
        insResp.run(id, adminUser.id, ap.resp, ap.created);
      }
    }
  }

  enforceSingleAdminAccount();
}

export function enforceSingleAdminAccount() {
  const superRole = db.prepare(`SELECT id FROM roles WHERE name = 'super_admin'`).get() as { id: number } | undefined;
  const raisRole = db.prepare(`SELECT id FROM roles WHERE name = 'mahalla_raisi'`).get() as { id: number } | undefined;
  const xodimRole = db.prepare(`SELECT id FROM roles WHERE name = 'masul_xodim'`).get() as { id: number } | undefined;
  const fuqaroRole = db.prepare(`SELECT id FROM roles WHERE name = 'fuqaro'`).get() as { id: number } | undefined;
  if (!superRole || !fuqaroRole) return;

  const tx = db.transaction(() => {
    // 1. Find or convert user #2 (or existing admin_sirojbek) to the sole admin account
    let target = db
      .prepare(`SELECT id FROM users WHERE lower(username) = 'admin_sirojbek' OR email = 'admin@aqllimahalla.uz' ORDER BY id ASC LIMIT 1`)
      .get() as { id: number } | undefined;

    if (!target) {
      const info = db
        .prepare(
          `INSERT INTO users (username, first_name, last_name, phone, email, password_hash, address, house_number, profile_completed, is_active)
           VALUES ('admin_sirojbek', 'Sirojbek', 'Admin', '+998900000001', 'admin@aqllimahalla.uz', ?, 'Mahalla markazi', '2-uy', 1, 1)`
        )
        .run(hashPassword('sirojbek.admin'));
      target = { id: Number(info.lastInsertRowid) };
    } else {
      db.prepare(
        `UPDATE users SET username = 'admin_sirojbek', password_hash = ?, profile_completed = 1, is_active = 1, updated_at = datetime('now') WHERE id = ?`
      ).run(hashPassword('sirojbek.admin'), target.id);
    }

    // Backfill usernames on legacy seeded citizen accounts if missing
    const legacyLogins: Array<[string, string]> = [
      ['rais@aqllimahalla.uz', 'rais'],
      ['xodim@aqllimahalla.uz', 'xodim'],
      ['azizbek@mail.uz', 'azizbek'],
      ['dilnoza@mail.uz', 'dilnoza'],
      ['jasur@mail.uz', 'jasur'],
    ];
    for (const [emailVal, uname] of legacyLogins) {
      const taken = db.prepare(`SELECT id FROM users WHERE lower(username) = lower(?)`).get(uname);
      if (!taken) {
        db.prepare(`UPDATE users SET username = ?, profile_completed = 1 WHERE lower(email) = lower(?) AND (username IS NULL OR username = '')`).run(uname, emailVal);
      }
    }

    // 2. Revoke all admin/staff roles from every other user
    const staffRoleIds = [superRole.id, raisRole?.id, xodimRole?.id].filter(Boolean) as number[];
    for (const rid of staffRoleIds) {
      db.prepare(`DELETE FROM user_roles WHERE role_id = ? AND user_id != ?`).run(rid, target.id);
    }

    // 3. Ensure every other user without a role gets fuqaro role
    const otherUsers = db.prepare(`SELECT id FROM users WHERE id != ?`).all(target.id) as Array<{ id: number }>;
    for (const u of otherUsers) {
      const hasAny = db.prepare(`SELECT id FROM user_roles WHERE user_id = ?`).get(u.id);
      if (!hasAny) {
        db.prepare(`INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)`).run(u.id, fuqaroRole.id);
      }
    }

    // 4. Ensure admin_sirojbek has super_admin (and mahalla_raisi) role
    db.prepare(`DELETE FROM user_roles WHERE user_id = ?`).run(target.id);
    db.prepare(`INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)`).run(target.id, superRole.id);
    if (raisRole) {
      db.prepare(`INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)`).run(target.id, raisRole.id);
    }
  });

  tx();
}

export function syncBatoshMahallaSettings() {
  const row = db
    .prepare(`SELECT mahalla_name, address FROM mahalla_settings WHERE id = 1`)
    .get() as { mahalla_name: string; address: string } | undefined;

  if (row && (row.mahalla_name.includes("Bog'ishamol") || row.mahalla_name.includes('Bog‘ishamol') || row.address.includes('Yunusobod') || row.address.includes('Toshkent'))) {
    db.prepare(
      `UPDATE mahalla_settings SET
        mahalla_name = 'Batosh MFY',
        hero_description = 'Qashqadaryo viloyati, G‘uzor tumani Batosh MFY yangiliklaridan xabardor bo‘ling, murojaat qiling va mahalla hayotida faol ishtirok eting.',
        history = ?,
        chairman_bio = ?,
        address = 'Qashqadaryo viloyati, G‘uzor tumani, Batosh MFY, Markaziy ko‘cha, 1-uy',
        email = 'info@batoshmfy.uz',
        activities = ?,
        banner_text = 'Diqqat! 22-noyabr kuni Batosh MFY hududida ommaviy hashar o‘tkaziladi.',
        map_lat = 38.6203,
        map_lng = 66.2481,
        updated_at = datetime('now')
      WHERE id = 1`
    ).run(
      "Batosh mahalla fuqarolar yig'ini Qashqadaryo viloyati G'uzor tumanidagi obod, ahil va jadal rivojlanayotgan mahallalardan biri hisoblanadi. Mahallada zamonaviy turar-joylar, ta'lim maskanlari, sport maydonchalari hamda aholiga qulay xizmat ko'rsatish shoxobchalari faoliyat yuritmoqda.",
      "Batosh mahalla fuqarolar yig'ini raisi sifatida aholi murojaatlarini tezkor hal etish, hududni obodonlashtirish hamda yoshlar va oilalarni qo'llab-quvvatlash tashabbuslarini boshqarib kelmoqda.",
      "Batosh MFY hududida har hafta obodonlashtirish hashari, yoshlar uchun sport va ta'lim to'garaklari, nuroniylar bilan uchrashuvlar hamda fuqarolar qabuli muntazam o'tkazib kelinadi."
    );
  }

  db.prepare(
    `UPDATE gallery SET title = 'Batosh mahallasi markaziy xiyoboni', description = 'Batosh MFY ning zamonaviy turar-joy va sayr hududi'
     WHERE title LIKE '%Bog%ishamol%'`
  ).run();

  db.prepare(
    `UPDATE users SET address = 'Batosh ko''chasi' WHERE address LIKE '%Bog%ishamol%'`
  ).run();
}


