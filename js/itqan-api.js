/**
 * مشغل صدى - خدمة الربط مع واجهة إتقان ومكتبة التلاوات المضمنة
 */

export const ItqanAPI = {
  // المكتبة المحلية المضمنة (23 سورة خام من استوديو المركز السعودي للتلاوات القرآنية)
  localSamples: [
    { surah_number: 1, surah_name: 'الفاتحة', surah_name_en: 'Al-Faatiha', reciter_name: 'الشيخ بدر التركي', riwayah: 'حفص عن عاصم', audio_url: './samples/fatihah_raw.mp3', is_local: true, description: 'تسجيل استوديو خام بدون مؤثرات', ayahs_count: 7 },
    { surah_number: 93, surah_name: 'الضحى', surah_name_en: 'Ad-Duhaa', reciter_name: 'الشيخ بدر التركي', riwayah: 'حفص عن عاصم', audio_url: './samples/093_duha_raw.mp3', is_local: true, description: 'تسجيل استوديو خام بدون مؤثرات', ayahs_count: 11 },
    { surah_number: 94, surah_name: 'الشرح', surah_name_en: 'Ash-Sharh', reciter_name: 'الشيخ بدر التركي', riwayah: 'حفص عن عاصم', audio_url: './samples/094_sharh_raw.mp3', is_local: true, description: 'تسجيل استوديو خام بدون مؤثرات', ayahs_count: 8 },
    { surah_number: 95, surah_name: 'التين', surah_name_en: 'At-Tin', reciter_name: 'الشيخ بدر التركي', riwayah: 'حفص عن عاصم', audio_url: './samples/095_tin_raw.mp3', is_local: true, description: 'تسجيل استوديو خام بدون مؤثرات', ayahs_count: 8 },
    { surah_number: 96, surah_name: 'العلق', surah_name_en: 'Al-Alaq', reciter_name: 'الشيخ بدر التركي', riwayah: 'حفص عن عاصم', audio_url: './samples/096_alaq_raw.mp3', is_local: true, description: 'تسجيل استوديو خام بدون مؤثرات', ayahs_count: 19 },
    { surah_number: 97, surah_name: 'القدر', surah_name_en: 'Al-Qadr', reciter_name: 'الشيخ بدر التركي', riwayah: 'حفص عن عاصم', audio_url: './samples/097_qadr_raw.mp3', is_local: true, description: 'تسجيل استوديو خام بدون مؤثرات', ayahs_count: 5 },
    { surah_number: 98, surah_name: 'البينة', surah_name_en: 'Al-Bayyinah', reciter_name: 'الشيخ بدر التركي', riwayah: 'حفص عن عاصم', audio_url: './samples/098_bayyinah_raw.mp3', is_local: true, description: 'تسجيل استوديو خام بدون مؤثرات', ayahs_count: 8 },
    { surah_number: 99, surah_name: 'الزلزلة', surah_name_en: 'Az-Zalzalah', reciter_name: 'الشيخ بدر التركي', riwayah: 'حفص عن عاصم', audio_url: './samples/099_zalzalah_raw.mp3', is_local: true, description: 'تسجيل استوديو خام بدون مؤثرات', ayahs_count: 8 },
    { surah_number: 100, surah_name: 'العاديات', surah_name_en: 'Al-Aadiyat', reciter_name: 'الشيخ بدر التركي', riwayah: 'حفص عن عاصم', audio_url: './samples/100_adiyat_raw.mp3', is_local: true, description: 'تسجيل استوديو خام بدون مؤثرات', ayahs_count: 11 },
    { surah_number: 101, surah_name: 'القارعة', surah_name_en: 'Al-Qaariah', reciter_name: 'الشيخ بدر التركي', riwayah: 'حفص عن عاصم', audio_url: './samples/101_qariah_raw.mp3', is_local: true, description: 'تسجيل استوديو خام بدون مؤثرات', ayahs_count: 11 },
    { surah_number: 102, surah_name: 'التكاثر', surah_name_en: 'At-Takaathur', reciter_name: 'الشيخ بدر التركي', riwayah: 'حفص عن عاصم', audio_url: './samples/102_takathur_raw.mp3', is_local: true, description: 'تسجيل استوديو خام بدون مؤثرات', ayahs_count: 8 },
    { surah_number: 103, surah_name: 'العصر', surah_name_en: 'Al-Asr', reciter_name: 'الشيخ بدر التركي', riwayah: 'حفص عن عاصم', audio_url: './samples/103_asr_raw.mp3', is_local: true, description: 'تسجيل استوديو خام بدون مؤثرات', ayahs_count: 3 },
    { surah_number: 104, surah_name: 'الهمزة', surah_name_en: 'Al-Humazah', reciter_name: 'الشيخ بدر التركي', riwayah: 'حفص عن عاصم', audio_url: './samples/104_humazah_raw.mp3', is_local: true, description: 'تسجيل استوديو خام بدون مؤثرات', ayahs_count: 9 },
    { surah_number: 105, surah_name: 'الفيل', surah_name_en: 'Al-Feel', reciter_name: 'الشيخ بدر التركي', riwayah: 'حفص عن عاصم', audio_url: './samples/105_fil_raw.mp3', is_local: true, description: 'تسجيل استوديو خام بدون مؤثرات', ayahs_count: 5 },
    { surah_number: 106, surah_name: 'قريش', surah_name_en: 'Quraysh', reciter_name: 'الشيخ بدر التركي', riwayah: 'حفص عن عاصم', audio_url: './samples/106_quraysh_raw.mp3', is_local: true, description: 'تسجيل استوديو خام بدون مؤثرات', ayahs_count: 4 },
    { surah_number: 107, surah_name: 'الماعون', surah_name_en: 'Al-Maaun', reciter_name: 'الشيخ بدر التركي', riwayah: 'حفص عن عاصم', audio_url: './samples/107_maun_raw.mp3', is_local: true, description: 'تسجيل استوديو خام بدون مؤثرات', ayahs_count: 7 },
    { surah_number: 108, surah_name: 'الكوثر', surah_name_en: 'Al-Kawthar', reciter_name: 'الشيخ بدر التركي', riwayah: 'حفص عن عاصم', audio_url: './samples/108_kawthar_raw.mp3', is_local: true, description: 'تسجيل استوديو خام بدون مؤثرات', ayahs_count: 3 },
    { surah_number: 109, surah_name: 'الكافرون', surah_name_en: 'Al-Kaafiroon', reciter_name: 'الشيخ بدر التركي', riwayah: 'حفص عن عاصم', audio_url: './samples/109_kafirun_raw.mp3', is_local: true, description: 'تسجيل استوديو خام بدون مؤثرات', ayahs_count: 6 },
    { surah_number: 110, surah_name: 'النصر', surah_name_en: 'An-Nasr', reciter_name: 'الشيخ بدر التركي', riwayah: 'حفص عن عاصم', audio_url: './samples/110_nasr_raw.mp3', is_local: true, description: 'تسجيل استوديو خام بدون مؤثرات', ayahs_count: 3 },
    { surah_number: 111, surah_name: 'المسد', surah_name_en: 'Al-Masad', reciter_name: 'الشيخ بدر التركي', riwayah: 'حفص عن عاصم', audio_url: './samples/111_masad_raw.mp3', is_local: true, description: 'تسجيل استوديو خام بدون مؤثرات', ayahs_count: 5 },
    { surah_number: 112, surah_name: 'الإخلاص', surah_name_en: 'Al-Ikhlaas', reciter_name: 'الشيخ بدر التركي', riwayah: 'حفص عن عاصم', audio_url: './samples/ikhlas_raw.mp3', is_local: true, description: 'تسجيل استوديو خام بدون مؤثرات', ayahs_count: 4 },
    { surah_number: 113, surah_name: 'الفلق', surah_name_en: 'Al-Falaq', reciter_name: 'الشيخ بدر التركي', riwayah: 'حفص عن عاصم', audio_url: './samples/falaq_raw.mp3', is_local: true, description: 'تسجيل استوديو خام بدون مؤثرات', ayahs_count: 5 },
    { surah_number: 114, surah_name: 'الناس', surah_name_en: 'An-Naas', reciter_name: 'الشيخ بدر التركي', riwayah: 'حفص عن عاصم', audio_url: './samples/nas_raw.mp3', is_local: true, description: 'تسجيل استوديو خام بدون مؤثرات', ayahs_count: 6 }
  ],

  fallbackRecitations: [
    {
      id: 11,
      name: 'مصحف القارئ بدر التركي',
      reciter: { id: 2, name: 'بدر التركي' },
      riwayah: { name: 'حفص عن عاصم' },
      publisher: { name: 'المركز السعودي للتلاوات القرآنية' },
      surahs_count: 114
    },
    {
      id: 12,
      name: 'مصحف القارئ ماجد الزامل',
      reciter: { id: 1, name: 'ماجد الزامل' },
      riwayah: { name: 'حفص عن عاصم' },
      publisher: { name: 'المركز السعودي للتلاوات القرآنية' },
      surahs_count: 114
    },
    {
      id: 13,
      name: 'مصحف القارئ حسن الدغريري',
      reciter: { id: 3, name: 'حسن الدغريري' },
      riwayah: { name: 'حفص عن عاصم' },
      publisher: { name: 'المركز السعودي للتلاوات القرآنية' },
      surahs_count: 114
    }
  ],

  async getRecitations() {
    // 1. Try direct API first (Itqan CMS API)
    try {
      const res = await fetch('https://api.cms.itqan.dev/recitations/', {
        headers: { 'Accept-Language': 'ar' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          return data.results;
        }
      }
    } catch (e) {
      console.warn('Direct Itqan API fetch:', e.message);
    }

    // 2. Try Node / PHP Proxy if running with backend
    if (window.location.port === '3000') {
      try {
        const res = await fetch('/proxy/api?url=' + encodeURIComponent('https://api.cms.itqan.dev/recitations/'));
        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results.length > 0) return data.results;
        }
      } catch (e) {
        console.warn('Node proxy API fetch:', e.message);
      }
    }

    return this.fallbackRecitations;
  },

  async getRecitationTracks(recitationId) {
    if (recitationId === 'local_badr' || recitationId === 'local') {
      return this.localSamples;
    }

    const targetApi = `https://api.cms.itqan.dev/recitations/${recitationId}/?page_size=114`;

    // 1. If running on Node dev server, proxy tracks to ensure CORS audio
    if (window.location.port === '3000') {
      try {
        const proxyUrl = '/proxy/api?url=' + encodeURIComponent(targetApi);
        const res = await fetch(proxyUrl);
        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            return data.results.map(t => ({
              ...t,
              proxied_audio_url: this.getProxiedAudioUrl(t.audio_url)
            }));
          }
        }
      } catch (e) {
        console.warn('Proxy tracks fetch error:', e.message);
      }
    }

    // 2. Direct API
    try {
      const res = await fetch(targetApi, {
        headers: { 'Accept-Language': 'ar' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          return data.results.map(t => ({
            ...t,
            proxied_audio_url: this.getProxiedAudioUrl(t.audio_url)
          }));
        }
      }
    } catch (e) {
      console.warn('Direct tracks fetch error:', e.message);
    }

    // Fallback to local samples
    return this.localSamples;
  },

  getProxiedAudioUrl(rawUrl) {
    if (!rawUrl) return '';
    if (rawUrl.startsWith('/') || rawUrl.startsWith('blob:') || rawUrl.startsWith('./')) {
      return rawUrl;
    }
    // If running on Node dev server (port 3000)
    if (window.location.port === '3000') {
      return '/proxy/audio?url=' + encodeURIComponent(rawUrl);
    }
    // If running on GitHub Pages or static host without backend
    return rawUrl;
  }
};
