/**
 * مشغل صدى - خدمة الربط مع واجهة إتقان (Itqan CMS API)
 */

export const ItqanAPI = {
  localSamples: [
    {
      surah_number: 1,
      surah_name: 'الفاتحة',
      surah_name_en: 'Al-Faatiha',
      reciter_name: 'الشيخ بدر التركي',
      riwayah: 'حفص عن عاصم',
      audio_url: './samples/fatihah_raw.mp3',
      is_local: true,
      description: 'تسجيل استوديو خام بدون أي مؤثرات صوتية من المركز السعودي للتلاوات',
      ayahs_count: 7
    },
    {
      surah_number: 112,
      surah_name: 'الإخلاص',
      surah_name_en: 'Al-Ikhlaas',
      reciter_name: 'الشيخ بدر التركي',
      riwayah: 'حفص عن عاصم',
      audio_url: './samples/ikhlas_raw.mp3',
      is_local: true,
      description: 'تسجيل استوديو خام بدون أي مؤثرات صوتية من المركز السعودي للتلاوات',
      ayahs_count: 4
    },
    {
      surah_number: 113,
      surah_name: 'الفلق',
      surah_name_en: 'Al-Falaq',
      reciter_name: 'الشيخ بدر التركي',
      riwayah: 'حفص عن عاصم',
      audio_url: './samples/falaq_raw.mp3',
      is_local: true,
      description: 'تسجيل استوديو خام بدون أي مؤثرات صوتية من المركز السعودي للتلاوات',
      ayahs_count: 5
    },
    {
      surah_number: 114,
      surah_name: 'الناس',
      surah_name_en: 'An-Naas',
      reciter_name: 'الشيخ بدر التركي',
      riwayah: 'حفص عن عاصم',
      audio_url: './samples/nas_raw.mp3',
      is_local: true,
      description: 'تسجيل استوديو خام بدون أي مؤثرات صوتية من المركز السعودي للتلاوات',
      ayahs_count: 6
    }
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
    // 1. Try direct API first (Itqan API supports CORS)
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
      console.warn('Direct Itqan API fetch attempt:', e.message);
    }

    // 2. Try Node / PHP Proxy
    try {
      const proxyUrl = window.location.port === '3000'
        ? '/proxy/api?url=' + encodeURIComponent('https://api.cms.itqan.dev/recitations/')
        : './proxy.php?url=' + encodeURIComponent('https://api.cms.itqan.dev/recitations/');
      const res = await fetch(proxyUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          return data.results;
        }
      }
    } catch (e) {
      console.warn('Proxy Itqan API fetch attempt:', e.message);
    }

    // 3. Fallback to curated recitations
    return this.fallbackRecitations;
  },

  async getRecitationTracks(recitationId) {
    const targetApi = `https://api.cms.itqan.dev/recitations/${recitationId}/?page_size=114`;

    // 1. Try direct API first
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
      console.warn('Direct tracks fetch attempt:', e.message);
    }

    // 2. Try Proxy
    try {
      const proxyUrl = window.location.port === '3000'
        ? '/proxy/api?url=' + encodeURIComponent(targetApi)
        : './proxy.php?url=' + encodeURIComponent(targetApi);
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
      console.warn('Proxy tracks fetch attempt:', e.message);
    }

    // 3. Fallback to local samples
    return this.localSamples;
  },

  getProxiedAudioUrl(rawUrl) {
    if (!rawUrl) return '';
    if (rawUrl.startsWith('/') || rawUrl.startsWith('blob:') || rawUrl.startsWith('./')) {
      return rawUrl;
    }
    // If running on GitHub Pages or file protocol, no backend proxy is available
    if (window.location.hostname.includes('github.io') || window.location.protocol === 'file:') {
      return rawUrl;
    }
    // If running on Node dev server (port 3000)
    if (window.location.port === '3000') {
      return '/proxy/audio?url=' + encodeURIComponent(rawUrl);
    }
    // If running on Apache / Laragon PHP server
    if (window.location.protocol.startsWith('http') && window.location.hostname !== 'localhost') {
      // Check if proxy.php is available or return direct
      return './proxy.php?url=' + encodeURIComponent(rawUrl);
    }
    return './proxy.php?url=' + encodeURIComponent(rawUrl);
  }
};
