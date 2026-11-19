export type RoleName = 'super_admin' | 'mahalla_raisi' | 'masul_xodim' | 'fuqaro';

export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  avatar_url: string;
  address: string;
  house_number: string;
  extra_info: string;
  profile_completed: number;
  is_active: number;
  roles: RoleName[];
  created_at?: string;
}

export interface NewsCategory {
  id: number;
  slug: string;
  name: string;
}

export interface NewsItem {
  id: number;
  title: string;
  category_id: number;
  category_name: string;
  category_slug: string;
  image_url: string;
  extra_images: string;
  summary: string;
  content: string;
  author_id: number | null;
  author_name: string | null;
  status: 'published' | 'draft';
  published_at: string;
  views: number;
}

export interface AnnouncementCategory {
  id: number;
  slug: string;
  name: string;
}

export interface AnnouncementItem {
  id: number;
  title: string;
  category_id: number;
  category_name: string;
  category_slug: string;
  image_url: string;
  content: string;
  is_important: number;
  is_banner: number;
  author_name: string | null;
  published_at: string;
}

export interface EventItem {
  id: number;
  title: string;
  category: string;
  description: string;
  event_date: string;
  event_time: string;
  location: string;
  capacity: number;
  image_url: string;
  participants_count: number;
  is_registered?: boolean;
  is_past?: boolean;
}

export interface AppealCategory {
  id: number;
  slug: string;
  name: string;
}

export type AppealStatus = 'yangi' | 'korib_chiqilmoqda' | 'jarayonda' | 'javob_berildi' | 'yopildi';

export interface AppealItem {
  id: number;
  tracking_number: string;
  user_id: number;
  category_id: number;
  category_name: string;
  subject: string;
  message: string;
  attachment_url: string;
  status: AppealStatus;
  assigned_to: number | null;
  assigned_name: string | null;
  citizen_name?: string;
  citizen_phone?: string;
  citizen_email?: string;
  created_at: string;
  updated_at: string;
}

export interface AppealResponse {
  id: number;
  appeal_id: number;
  responder_id: number | null;
  responder_name: string | null;
  response_text: string;
  created_at: string;
}

export interface AppealHistoryItem {
  id: number;
  appeal_id: number;
  old_status: string | null;
  new_status: string;
  changed_by_name: string | null;
  note: string;
  changed_at: string;
}

export interface NotificationItem {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: string;
  link: string;
  is_read: number;
  created_at: string;
}

export interface PollOption {
  id: number;
  option_text: string;
  votes: number;
}

export interface PollItem {
  id: number;
  question: string;
  description: string;
  is_active: number;
  created_at: string;
  options: PollOption[];
  total_votes: number;
  user_voted_option_id: number | null;
}

export interface GalleryItem {
  id: number;
  title: string;
  category: string;
  image_url: string;
  description: string;
  created_at: string;
}

export interface StaffMember {
  name: string;
  role: string;
  phone: string;
  schedule: string;
}

export interface MahallaSettings {
  id: number;
  mahalla_name: string;
  tagline: string;
  hero_description: string;
  population_count: number;
  history: string;
  chairman_name: string;
  chairman_bio: string;
  chairman_phone: string;
  address: string;
  phone: string;
  email: string;
  activities: string;
  staff_json: string;
  social_links_json: string;
  banner_text: string;
  banner_link: string;
  map_lat: number;
  map_lng: number;
}
