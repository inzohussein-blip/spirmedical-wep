// ═══════════════════════════════════════════════════════════
// Supabase Integration — Auth, Database, Realtime
// ═══════════════════════════════════════════════════════════

// Configuration (replace with your actual Supabase credentials)
const SUPABASE_URL = 'https://ioulxemokusfeykjcaxg.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE';

class SupabaseAPI {
  constructor() {
    this.url = SUPABASE_URL;
    this.key = SUPABASE_ANON_KEY;
    this.session = null;
    this.isConfigured = SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY_HERE';
  }

  // ─── HTTP helpers ───
  async _request(method, path, body = null, useAuth = true) {
    if (!this.isConfigured) {
      console.warn('Supabase not configured. Using mock data.');
      return this._mockResponse(path);
    }

    const headers = {
      'Content-Type': 'application/json',
      'apikey': this.key,
      'Prefer': 'return=representation'
    };

    if (useAuth && this.session?.access_token) {
      headers['Authorization'] = `Bearer ${this.session.access_token}`;
    } else {
      headers['Authorization'] = `Bearer ${this.key}`;
    }

    try {
      const res = await fetch(`${this.url}/rest/v1${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : null
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(err.message || `HTTP ${res.status}`);
      }

      const text = await res.text();
      return text ? JSON.parse(text) : null;
    } catch (err) {
      console.error(`API Error [${method} ${path}]:`, err);
      throw err;
    }
  }

  // Mock response when Supabase not configured (for demo mode)
  _mockResponse(path) {
    if (path.includes('/hospitals')) return MockData.hospitals;
    if (path.includes('/orders')) return MockData.orders;
    if (path.includes('/notifications')) return MockData.notifications;
    if (path.includes('/lab_tests')) return MockData.labTests;
    return [];
  }

  // ─── Auth ───
  async signUpWithPhone(phone) {
    if (!this.isConfigured) {
      // Mock signup for demo
      this.session = { access_token: 'demo_token', user: { phone, id: 'demo_user' } };
      window.store.set('user', this.session.user);
      window.store.set('session', this.session);
      return { success: true, mock: true };
    }

    const res = await fetch(`${this.url}/auth/v1/otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': this.key },
      body: JSON.stringify({ phone, channel: 'sms' })
    });
    return res.ok;
  }

  async verifyOTP(phone, token) {
    if (!this.isConfigured) {
      this.session = { access_token: 'demo_token', user: { phone, id: 'demo_user' } };
      window.store.set('user', this.session.user);
      window.store.set('session', this.session);
      return { success: true, mock: true };
    }

    const res = await fetch(`${this.url}/auth/v1/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': this.key },
      body: JSON.stringify({ phone, token, type: 'sms' })
    });

    if (res.ok) {
      this.session = await res.json();
      window.store.set('user', this.session.user);
      window.store.set('session', this.session);
      return { success: true };
    }
    return { success: false, error: await res.text() };
  }

  async signOut() {
    if (this.isConfigured && this.session) {
      await fetch(`${this.url}/auth/v1/logout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${this.session.access_token}`, 'apikey': this.key }
      });
    }
    this.session = null;
    window.store.set('user', null);
    window.store.set('session', null);
  }

  // ─── Database queries ───
  async getHospitals(filters = {}) {
    let path = '/hospitals?select=*&is_active=eq.true&order=rating.desc';
    if (filters.city) path += `&city=eq.${encodeURIComponent(filters.city)}`;
    if (filters.type) path += `&hospital_type=eq.${filters.type}`;
    return await this._request('GET', path, null, false);
  }

  async getOrders() {
    const userId = window.store.get('user')?.id;
    if (!userId) return [];
    return await this._request('GET', `/orders?user_id=eq.${userId}&order=created_at.desc`);
  }

  async createOrder(order) {
    return await this._request('POST', '/orders', order);
  }

  async getNotifications() {
    const userId = window.store.get('user')?.id;
    if (!userId) return [];
    return await this._request('GET', `/notifications?user_id=eq.${userId}&order=created_at.desc&limit=50`);
  }

  async markNotificationsRead() {
    const userId = window.store.get('user')?.id;
    if (!userId) return;
    return await this._request('PATCH', `/notifications?user_id=eq.${userId}&is_read=eq.false`, {
      is_read: true,
      read_at: new Date().toISOString()
    });
  }

  async getLabResults() {
    const userId = window.store.get('user')?.id;
    if (!userId) return [];
    return await this._request('GET', `/lab_results?user_id=eq.${userId}&order=test_date.desc`);
  }

  async getPrescriptions() {
    const userId = window.store.get('user')?.id;
    if (!userId) return [];
    return await this._request('GET', `/prescriptions?user_id=eq.${userId}&order=created_at.desc`);
  }

  async getFamilyMembers() {
    const userId = window.store.get('user')?.id;
    if (!userId) return [];
    return await this._request('GET', `/family_members?user_id=eq.${userId}`);
  }

  async getBadges() {
    return await this._request('GET', '/badges?order=sort_order.asc', null, false);
  }

  async getUserBadges() {
    const userId = window.store.get('user')?.id;
    if (!userId) return [];
    return await this._request('GET', `/user_badges?user_id=eq.${userId}&select=*,badges(*)`);
  }
}

// ─── Mock data for demo mode (when Supabase not configured) ───
const MockData = {
  hospitals: [
    { id: '1', name_ar: 'مستشفى الصدر التعليمي', name_en: 'Al-Sadr Teaching Hospital', hospital_type: 'teaching', specialties: ['باطنية', 'جراحة', 'عظام', 'أعصاب', 'قلب'], address: 'شارع المدينة المنورة', city: 'النجف', district: 'المدينة القديمة', latitude: 32.0000, longitude: 44.3300, phone_main: '+9647801000001', phone_emergency: '+9647801000002', bed_count: 500, has_emergency: true, has_icu: true, has_lab: true, has_pharmacy: true, has_radiology: true, has_surgery: true, has_maternity: true, has_pediatrics: true, has_ambulance: true, is_24_hours: true, rating: 4.2, review_count: 230, is_verified: true, is_active: true },
    { id: '2', name_ar: 'مستشفى الحكيم العام', name_en: 'Al-Hakeem General Hospital', hospital_type: 'private', specialties: ['باطنية', 'جراحة', 'قلب', 'أطفال'], address: 'شارع الصدر', city: 'النجف', district: 'حي السعد', latitude: 32.0085, longitude: 44.3464, phone_main: '+9647801000005', phone_emergency: '+9647801000006', bed_count: 150, has_emergency: true, has_icu: true, has_lab: true, has_pharmacy: true, has_radiology: true, has_surgery: true, is_24_hours: false, rating: 4.6, review_count: 156, is_verified: true, is_active: true },
    { id: '3', name_ar: 'مدينة الطب', name_en: 'Medical City', hospital_type: 'teaching', specialties: ['باطنية', 'جراحة', 'قلب', 'أعصاب', 'أورام', 'كلى'], address: 'باب المعظم', city: 'بغداد', district: 'الرصافة', latitude: 33.3525, longitude: 44.3780, phone_main: '+9647803000001', phone_emergency: '+9647803000002', bed_count: 2000, has_emergency: true, has_icu: true, has_lab: true, has_pharmacy: true, has_radiology: true, has_surgery: true, has_maternity: true, has_pediatrics: true, has_ambulance: true, is_24_hours: true, rating: 4.4, review_count: 850, is_verified: true, is_active: true },
    { id: '4', name_ar: 'مركز طوارئ النجف', hospital_type: 'emergency_center', specialties: ['طوارئ', 'إسعاف'], address: 'شارع الإمام علي', city: 'النجف', latitude: 32.0070, longitude: 44.3420, phone_main: '+9647801100001', phone_emergency: '+9647801100002', bed_count: 50, has_emergency: true, has_icu: true, has_ambulance: true, is_24_hours: true, rating: 4.3, review_count: 89, is_active: true },
    { id: '5', name_ar: 'مستشفى الزهراء التعليمي للولادة', hospital_type: 'teaching', specialties: ['نسائية', 'توليد', 'أطفال حديثي الولادة'], address: 'حي الأمير', city: 'النجف', latitude: 32.0120, longitude: 44.3460, phone_main: '+9647801000003', bed_count: 200, has_emergency: true, has_lab: true, has_maternity: true, has_pediatrics: true, is_24_hours: true, rating: 4.5, review_count: 178, is_verified: true, is_active: true },
    { id: '6', name_ar: 'مستشفى الحسين التعليمي', hospital_type: 'teaching', specialties: ['باطنية', 'جراحة', 'عظام', 'أعصاب', 'قلب'], address: 'شارع العباس', city: 'كربلاء', latitude: 32.6160, longitude: 44.0250, phone_main: '+9647802000001', phone_emergency: '+9647802000002', bed_count: 400, has_emergency: true, has_icu: true, has_lab: true, has_pharmacy: true, has_radiology: true, has_surgery: true, has_maternity: true, has_pediatrics: true, is_24_hours: true, rating: 4.3, review_count: 312, is_verified: true, is_active: true }
  ],
  notifications: [
    { id: '1', notification_type: 'order_update', title: 'تم تأكيد طلبك', body: 'طلب فحص دم SPR-001245 تم قبوله', is_read: false, created_at: new Date(Date.now() - 5 * 60000).toISOString() },
    { id: '2', notification_type: 'chat', title: 'رسالة من د. أحمد', body: 'وصلت للحي. أين البيت؟', is_read: false, created_at: new Date(Date.now() - 12 * 60000).toISOString() },
    { id: '3', notification_type: 'promotion', title: 'عرض حصري!', body: 'خصم 30% على فحوصات العائلة - FAMILY30', is_read: true, created_at: new Date(Date.now() - 60 * 60000).toISOString() },
    { id: '4', notification_type: 'result_ready', title: 'نتائجك جاهزة', body: 'نتائج فحص CBC جاهزة', is_read: true, created_at: new Date(Date.now() - 24 * 60 * 60000).toISOString() },
    { id: '5', notification_type: 'badge_earned', title: 'حصلت على شارة!', body: 'شارة "مهتم بصحتك" + 250 نقطة', is_read: true, created_at: new Date(Date.now() - 48 * 60 * 60000).toISOString() }
  ],
  orders: [
    { id: 'SPR-001245', service_type: 'blood_test', service_title: 'سحب دم - فحص شامل', status: 'in_progress', total_iqd: 34400, scheduled_at: new Date().toISOString(), provider_name: 'د. أحمد علي' },
    { id: 'SPR-001234', service_type: 'consultation', service_title: 'استشارة د. سارة حسن', status: 'completed', total_iqd: 35000, completed_at: new Date(Date.now() - 7 * 24 * 60 * 60000).toISOString() },
    { id: 'SPR-001220', service_type: 'pharmacy', service_title: 'طلب أدوية - 3 أصناف', status: 'completed', total_iqd: 28500, completed_at: new Date(Date.now() - 10 * 24 * 60 * 60000).toISOString() }
  ],
  labTests: [
    { id: '1', name_ar: 'فحص دم شامل CBC', description_ar: 'عد كريات الدم الحمراء والبيضاء', price_iqd: 15000, category: 'blood', icon: '🩸', icon_bg: '#FFE8E8' },
    { id: '2', name_ar: 'سكر صائم FBS', description_ar: 'يحتاج صيام 8 ساعات', price_iqd: 10000, category: 'blood', icon: '🍬', icon_bg: '#FFF4D6' },
    { id: '3', name_ar: 'سكر تراكمي HbA1c', description_ar: 'معدل السكر آخر 3 أشهر', price_iqd: 25000, category: 'blood', icon: '📊', icon_bg: '#FFF4D6' },
    { id: '4', name_ar: 'وظائف الكلى', description_ar: 'يوريا + كرياتنين', price_iqd: 20000, category: 'blood', icon: '💧', icon_bg: '#E3EDFF' },
    { id: '5', name_ar: 'وظائف الكبد', description_ar: 'SGOT + SGPT + ALP', price_iqd: 22000, category: 'blood', icon: '🫁', icon_bg: '#FFF0DC' },
    { id: '6', name_ar: 'فحص دهون شامل', description_ar: 'كوليسترول + ترايغليسرايد', price_iqd: 18000, category: 'blood', icon: '🧬', icon_bg: '#EEEDFE' },
    { id: '7', name_ar: 'فيتامين D', description_ar: '25-Hydroxy Vitamin D', price_iqd: 30000, category: 'vitamin', icon: '☀️', icon_bg: '#FFF4D6' },
    { id: '8', name_ar: 'وظائف الغدة الدرقية', description_ar: 'TSH + T3 + T4', price_iqd: 35000, category: 'hormone', icon: '🔬', icon_bg: '#FBEAF0' }
  ]
};

// Create global API instance
window.api = new SupabaseAPI();
