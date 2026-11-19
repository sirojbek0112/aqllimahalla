export type Lang = 'lat' | 'cyr';

// Accurate Uzbek Latin -> Cyrillic converter for dynamic & static content
export function toCyrillic(text: string): string {
  if (!text) return '';
  let res = text;
  const multi: Array<[RegExp, string]> = [
    [/O['‘`’ʼ]/g, 'Ў'],
    [/o['‘`’ʼ]/g, 'ў'],
    [/G['‘`’ʼ]/g, 'Ғ'],
    [/g['‘`’ʼ]/g, 'ғ'],
    [/Sh/g, 'Ш'],
    [/SH/g, 'Ш'],
    [/sh/g, 'ш'],
    [/Ch/g, 'Ч'],
    [/CH/g, 'Ч'],
    [/ch/g, 'ч'],
    [/Ng/g, 'Нг'],
    [/ng/g, 'нг'],
    [/Yo/g, 'Ё'],
    [/yo/g, 'ё'],
    [/Yu/g, 'Ю'],
    [/yu/g, 'ю'],
    [/Ya/g, 'Я'],
    [/ya/g, 'я'],
    [/Ye/g, 'Е'],
    [/ye/g, 'е'],
    [/Ts/g, 'Ц'],
    [/ts/g, 'ц'],
  ];
  for (const [re, rep] of multi) {
    res = res.replace(re, rep);
  }
  const single: Record<string, string> = {
    A: 'А', a: 'а', B: 'Б', b: 'б', D: 'Д', d: 'д', E: 'Э', e: 'е',
    F: 'Ф', f: 'ф', G: 'Г', g: 'г', H: 'Ҳ', h: 'ҳ', I: 'И', i: 'и',
    J: 'Ж', j: 'ж', K: 'К', k: 'к', L: 'Л', l: 'л', M: 'М', m: 'м',
    N: 'Н', n: 'н', O: 'О', o: 'о', P: 'П', p: 'п', Q: 'Қ', q: 'қ',
    R: 'Р', r: 'р', S: 'С', s: 'с', T: 'Т', t: 'т', U: 'У', u: 'у',
    V: 'В', v: 'в', X: 'Х', x: 'х', Y: 'Й', y: 'й', Z: 'З', z: 'з',
    "'": 'ъ', 'ʼ': 'ъ', '’': 'ъ',
  };
  return res.replace(/[A-Za-z'ʼ’]/g, (ch) => single[ch] ?? ch);
}

const latDict = {
  brand: 'AqlliMahalla',
  navHome: 'Bosh sahifa',
  navNews: 'Yangiliklar',
  navAnnouncements: "E'lonlar",
  navEvents: 'Tadbirlar',
  navAppeals: 'Murojaatlar',
  navAbout: 'Mahalla haqida',
  navPolls: "So'rovnomalar",
  navGallery: 'Galereya',
  login: 'Kirish',
  register: "Ro'yxatdan o'tish",
  cabinet: 'Mening kabinetim',
  adminPanel: 'Admin panel',
  logout: 'Chiqish',
  searchPlaceholder: "Sayt bo'ylab qidirish...",
  viewNews: "Yangiliklarni ko'rish",
  sendAppeal: 'Murojaat yuborish',
  todaysInfo: "Bugungi ma'lumotlar",
  populationCount: 'Aholi soni',
  newAnnouncements: "Yangi e'lon",
  appealsCount: 'Murojaat',
  quickNewsDesc: "Mahalladagi so'nggi xabarlar",
  quickAnnDesc: "Muhim ma'lumotlar",
  quickAppDesc: 'Fikringizni bildiring',
  quickEvtDesc: 'Ishtirok eting',
  details: 'Batafsil',
  latestNews: "So'nggi yangiliklar",
  upcomingEvents: 'Yaqinlashayotgan tadbirlar',
  pastEvents: "O'tgan tadbirlar",
  importantAnnouncements: "Muhim e'lonlar",
  quickLinks: 'Tezkor havolalar',
  contact: 'Aloqa',
  socialMedia: 'Biz ijtimoiy tarmoqlarda',
  copyright: '© 2026 AqlliMahalla. Barcha huquqlar himoyalangan.',
  privacy: 'Maxfiylik siyosati',
  terms: 'Foydalanish shartlari',
  all: 'Barchasi',
  participate: 'Ishtirok etish',
  registered: "Ro'yxatdan o'tdingiz",
  cancelRegistration: 'Bekor qilish',
  newAppealBtn: '+ Yangi murojaat',
  myAppeals: 'Mening murojaatlarim',
  myEvents: 'Mening tadbirlarim',
  notifications: 'Bildirishnomalar',
  profile: 'Profil',
  changePassword: "Parolni o'zgartirish",
  editProfile: 'Profilni tahrirlash',
  save: 'Saqlash',
  cancel: 'Bekor qilish',
  loading: 'Yuklanmoqda...',
  noData: "Ma'lumot topilmadi",
  statusYangi: 'Yangi',
  statusKorib: "Ko'rib chiqilmoqda",
  statusJarayonda: 'Jarayonda',
  statusJavob: 'Javob berildi',
  statusYopildi: 'Yopildi',
};

export type TranslationKey = keyof typeof latDict;

export function translateKey(key: TranslationKey, lang: Lang): string {
  const val = latDict[key];
  return lang === 'cyr' ? toCyrillic(val) : val;
}
