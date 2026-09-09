import { SadaAudioEngine } from './audio-engine.js';
import { ItqanAPI } from './itqan-api.js';
import { AudioVisualizer } from './visualizer.js';

// State
let audioEngine = null;
let visualizer = null;
let recitations = [];
let currentTracks = [];
let currentTrackIndex = 0;
let isSeeking = false;

// DOM Elements
const audio = document.getElementById('mainAudio');
const canvas = document.getElementById('visualizerCanvas');
const playPauseBtn = document.getElementById('playPauseBtn');
const playIcon = document.getElementById('playIcon');
const pauseIcon = document.getElementById('pauseIcon');
const prevTrackBtn = document.getElementById('prevTrackBtn');
const nextTrackBtn = document.getElementById('nextTrackBtn');
const progressWrap = document.getElementById('progressWrap');
const progressFill = document.getElementById('progressFill');
const currentTimeText = document.getElementById('currentTimeText');
const durationText = document.getElementById('durationText');
const masterVolumeSlider = document.getElementById('masterVolumeSlider');

const currentSurahTitle = document.getElementById('currentSurahTitle');
const currentReciterName = document.getElementById('currentReciterName');
const currentTrackBadge = document.getElementById('currentTrackBadge');

const abToggleBtn = document.getElementById('abToggleBtn');
const abToggleText = document.getElementById('abToggleText');
const abStatusIndicator = document.getElementById('abStatusIndicator');

const recitationSelect = document.getElementById('recitationSelect');
const surahSearchInput = document.getElementById('surahSearchInput');
const surahListContainer = document.getElementById('surahListContainer');

const dropzone = document.getElementById('dropzone');
const localFileInput = document.getElementById('localFileInput');
const exportWavBtn = document.getElementById('exportWavBtn');

// Mixer Sliders & Value Labels
const reverbWetSlider = document.getElementById('reverbWetSlider');
const reverbWetVal = document.getElementById('reverbWetVal');
const reverbDecaySlider = document.getElementById('reverbDecaySlider');
const reverbDecayVal = document.getElementById('reverbDecayVal');

const delayTimeSlider = document.getElementById('delayTimeSlider');
const delayTimeVal = document.getElementById('delayTimeVal');
const delayFeedbackSlider = document.getElementById('delayFeedbackSlider');
const delayFeedbackVal = document.getElementById('delayFeedbackVal');
const delayWetSlider = document.getElementById('delayWetSlider');
const delayWetVal = document.getElementById('delayWetVal');

const bassSlider = document.getElementById('bassSlider');
const bassVal = document.getElementById('bassVal');
const midSlider = document.getElementById('midSlider');
const midVal = document.getElementById('midVal');
const trebleSlider = document.getElementById('trebleSlider');
const trebleVal = document.getElementById('trebleVal');

const presetCards = document.querySelectorAll('[data-preset]');

// Toast notice
function showToast(msg, duration = 3000) {
  const toast = document.getElementById('toastNotice');
  const toastMsg = document.getElementById('toastNoticeMsg');
  toastMsg.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

// Format seconds into MM:SS
function formatTime(sec) {
  if (isNaN(sec) || !isFinite(sec)) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
}

// Initialize Audio Engine on first interaction
async function ensureEngine() {
  if (!audioEngine) {
    audioEngine = new SadaAudioEngine();
    audioEngine.init(audio);
    visualizer = new AudioVisualizer(canvas, audioEngine.analyser);
    visualizer.start();
  }
  await audioEngine.resume();
}

// Load and setup track
function loadTrack(index, autoPlay = true) {
  if (!currentTracks || currentTracks.length === 0) return;
  if (index < 0) index = 0;
  if (index >= currentTracks.length) index = currentTracks.length - 1;

  currentTrackIndex = index;
  const track = currentTracks[index];

  // Set audio source
  const src = track.proxied_audio_url || track.audio_url;
  audio.src = src;

  // Update UI Titles
  currentSurahTitle.textContent = `سورة ${track.surah_name || track.title || 'التلاوة'}`;
  currentReciterName.textContent = track.reciter_name || track.reciter || (recitationSelect.options[recitationSelect.selectedIndex]?.text || 'القارئ');
  currentTrackBadge.textContent = track.is_local ? 'ملف محلي من جهازك' : 'تسجيل استوديو خام (Dry)';

  // Highlight active item in surah list
  document.querySelectorAll('#surahListContainer .surah-item').forEach((el, idx) => {
    el.classList.toggle('active', idx === currentTrackIndex);
  });

  if (autoPlay) {
    ensureEngine().then(() => {
      audio.play().catch(err => console.log('Autoplay wait gesture:', err));
    });
  }
}

// Update Mixer UI Sliders to match current audioEngine parameters
function syncMixerUI() {
  if (!audioEngine) return;
  const p = audioEngine.params;

  reverbWetSlider.value = p.reverbWet;
  reverbWetVal.textContent = `${Math.round(p.reverbWet * 100)}%`;

  reverbDecaySlider.value = p.reverbDecay;
  reverbDecayVal.textContent = `${p.reverbDecay}s`;

  delayTimeSlider.value = p.delayTime;
  delayTimeVal.textContent = `${Math.round(p.delayTime * 1000)}ms`;

  delayFeedbackSlider.value = p.delayFeedback;
  delayFeedbackVal.textContent = `${Math.round(p.delayFeedback * 100)}%`;

  delayWetSlider.value = p.delayWet;
  delayWetVal.textContent = `${Math.round(p.delayWet * 100)}%`;

  bassSlider.value = p.bassGain;
  bassVal.textContent = `${p.bassGain >= 0 ? '+' : ''}${p.bassGain} dB`;

  midSlider.value = p.midGain;
  midVal.textContent = `${p.midGain >= 0 ? '+' : ''}${p.midGain} dB`;

  trebleSlider.value = p.trebleGain;
  trebleVal.textContent = `${p.trebleGain >= 0 ? '+' : ''}${p.trebleGain} dB`;
}

// Render Surah Playlist
function renderSurahList(tracks) {
  surahListContainer.innerHTML = '';

  if (!tracks || tracks.length === 0) {
    surahListContainer.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--text-muted);">لا توجد سور مطابقة</div>';
    return;
  }

  tracks.forEach((track, idx) => {
    const item = document.createElement('div');
    item.className = `surah-item ${idx === currentTrackIndex ? 'active' : ''}`;
    item.dataset.index = idx;

    const surahNum = track.surah_number || (idx + 1);
    const surahName = track.surah_name || track.title || `سورة ${surahNum}`;

    item.innerHTML = `
      <div class="surah-meta">
        <span class="surah-num">${surahNum}</span>
        <div>
          <div class="surah-name">${surahName}</div>
          <div class="surah-badge">${track.ayahs_count ? track.ayahs_count + ' آية' : 'تسجيل أصلي'}</div>
        </div>
      </div>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="color: var(--gold-light); opacity: 0.7;">
        <polygon points="5 3 19 12 5 21 5 3"></polygon>
      </svg>
    `;

    item.addEventListener('click', () => {
      loadTrack(idx, true);
    });

    surahListContainer.appendChild(item);
  });
}

// Filter surahs in list
function filterSurahs(query) {
  query = (query || '').trim().toLowerCase();
  if (!query) {
    renderSurahList(currentTracks);
    return;
  }

  const filtered = currentTracks.filter(t => {
    const name = (t.surah_name || '').toLowerCase();
    const nameEn = (t.surah_name_en || '').toLowerCase();
    const num = String(t.surah_number || '');
    return name.includes(query) || nameEn.includes(query) || num.includes(query);
  });

  renderSurahList(filtered);
}

// Initialize Application
async function initApp() {
  setupEventListeners();

  // 1. Immediately initialize with local 23 short surahs (100% serverless, zero CORS issues)
  currentTracks = ItqanAPI.localSamples;
  renderSurahList(currentTracks);
  loadTrack(0, false);

  // 2. Fetch recitations catalog in background and populate select menu
  try {
    recitations = await ItqanAPI.getRecitations();
    if (recitations && recitations.length > 0) {
      recitationSelect.innerHTML = '';

      const localOpt = document.createElement('option');
      localOpt.value = 'local_badr';
      localOpt.textContent = '✨ باقة الاستوديو المرفقة (قصار السور 23 سورة) - الشيخ بدر التركي';
      localOpt.selected = true;
      recitationSelect.appendChild(localOpt);

      const group = document.createElement('optgroup');
      group.label = 'المصاحف السحابية الكاملة (منصة إتقان)';
      recitations.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.id;
        const reciter = r.reciter?.name || r.name;
        const riwayah = r.riwayah?.name ? ` (${r.riwayah.name})` : '';
        opt.textContent = `${r.name || reciter}${riwayah}`;
        group.appendChild(opt);
      });
      recitationSelect.appendChild(group);
    }
  } catch (err) {
    console.error('Failed to load recitations list:', err);
  }
}

async function loadRecitation(recitationId) {
  if (recitationId === 'local_badr' || recitationId === 'local') {
    currentTracks = ItqanAPI.localSamples;
    renderSurahList(currentTracks);
    loadTrack(0, true);
    return;
  }

  surahListContainer.innerHTML = '<div style="padding: 1rem; text-align: center; color: var(--text-muted);">جاري تحميل سور المصحف من منصة إتقان...</div>';
  const tracks = await ItqanAPI.getRecitationTracks(recitationId);
  if (tracks && tracks.length > 0) {
    currentTracks = tracks;
    renderSurahList(currentTracks);
    loadTrack(0, true);
  } else {
    showToast('تعذر جلب سور المصحف السحابي، تم العودة للباقة المحلية');
    currentTracks = ItqanAPI.localSamples;
    renderSurahList(currentTracks);
    loadTrack(0, false);
  }
}

function setupEventListeners() {
  recitationSelect.addEventListener('change', (e) => {
    if (e.target.value) {
      loadRecitation(e.target.value);
    }
  });

  surahSearchInput.addEventListener('input', (e) => {
    filterSurahs(e.target.value);
  });

  playPauseBtn.addEventListener('click', async () => {
    await ensureEngine();
    if (!audio.src || audio.src === window.location.href) {
      loadTrack(0, false);
    }
    if (audio.paused) {
      try {
        await audio.play();
      } catch (err) {
        console.warn('Playback error:', err);
      }
    } else {
      audio.pause();
    }
  });

  audio.addEventListener('play', () => {
    playIcon.style.display = 'none';
    pauseIcon.style.display = 'block';
  });

  audio.addEventListener('pause', () => {
    playIcon.style.display = 'block';
    pauseIcon.style.display = 'none';
  });

  audio.addEventListener('error', () => {
    console.warn('Audio loading error for source:', audio.src);
    showToast('تعذر تشغيل هذا المقطع عبر الشبكة، جرب باقة الاستوديو المرفقة أو ملفاً من جهازك');
  });

  prevTrackBtn.addEventListener('click', () => {
    if (currentTrackIndex > 0) {
      loadTrack(currentTrackIndex - 1, true);
    }
  });

  nextTrackBtn.addEventListener('click', () => {
    if (currentTrackIndex < currentTracks.length - 1) {
      loadTrack(currentTrackIndex + 1, true);
    }
  });

  audio.addEventListener('ended', () => {
    if (currentTrackIndex < currentTracks.length - 1) {
      loadTrack(currentTrackIndex + 1, true);
    }
  });

  audio.addEventListener('timeupdate', () => {
    if (!isSeeking && audio.duration) {
      const pct = (audio.currentTime / audio.duration) * 100;
      progressFill.style.width = `${pct}%`;
      currentTimeText.textContent = formatTime(audio.currentTime);
    }
  });

  audio.addEventListener('loadedmetadata', () => {
    durationText.textContent = formatTime(audio.duration);
  });

  progressWrap.addEventListener('click', (e) => {
    if (!audio.duration) return;
    const rect = progressWrap.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = clickX / rect.width;
    audio.currentTime = pct * audio.duration;
  });

  masterVolumeSlider.addEventListener('input', (e) => {
    if (audioEngine) {
      audioEngine.setMasterVolume(e.target.value);
    } else {
      audio.volume = e.target.value;
    }
  });

  abToggleBtn.addEventListener('click', async () => {
    await ensureEngine();
    const isBypassed = audioEngine.toggleBypass();

    if (isBypassed) {
      abToggleBtn.classList.add('dry-active');
      abToggleText.textContent = 'الصوت الخام: مُفعّل (بدون أي بهارات)';
      showToast('⚡ تم إيقاف المؤثرات: تستمع الآن إلى الصوت الخام الأصلي (Pure Dry)');
    } else {
      abToggleBtn.classList.remove('dry-active');
      abToggleText.textContent = 'المؤثرات: مُفعّلة (Wet)';
      showToast('✨ تم تفعيل المؤثرات: تستمع الآن بالتأثيرات المختارة (Processed)');
    }
  });

  presetCards.forEach(card => {
    card.addEventListener('click', async () => {
      await ensureEngine();
      const preset = card.dataset.preset;

      presetCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');

      if (audioEngine.isBypassed) {
        audioEngine.setBypass(false);
        abToggleBtn.classList.remove('dry-active');
        abToggleText.textContent = 'المؤثرات: مُفعّلة (Wet)';
      }

      audioEngine.applyPreset(preset);
      syncMixerUI();

      showToast(`تم تطبيق البيئة الصوتية: ${card.querySelector('h3').textContent}`);
    });
  });

  reverbWetSlider.addEventListener('input', async (e) => {
    await ensureEngine();
    audioEngine.setReverbWet(e.target.value);
    reverbWetVal.textContent = `${Math.round(e.target.value * 100)}%`;
  });

  reverbDecaySlider.addEventListener('input', async (e) => {
    await ensureEngine();
    audioEngine.setReverbDecay(e.target.value);
    reverbDecayVal.textContent = `${e.target.value}s`;
  });

  delayTimeSlider.addEventListener('input', async (e) => {
    await ensureEngine();
    audioEngine.setDelayTime(e.target.value);
    delayTimeVal.textContent = `${Math.round(e.target.value * 1000)}ms`;
  });

  delayFeedbackSlider.addEventListener('input', async (e) => {
    await ensureEngine();
    audioEngine.setDelayFeedback(e.target.value);
    delayFeedbackVal.textContent = `${Math.round(e.target.value * 100)}%`;
  });

  delayWetSlider.addEventListener('input', async (e) => {
    await ensureEngine();
    audioEngine.setDelayWet(e.target.value);
    delayWetVal.textContent = `${Math.round(e.target.value * 100)}%`;
  });

  bassSlider.addEventListener('input', async (e) => {
    await ensureEngine();
    audioEngine.setBass(e.target.value);
    const v = parseFloat(e.target.value);
    bassVal.textContent = `${v >= 0 ? '+' : ''}${v} dB`;
  });

  midSlider.addEventListener('input', async (e) => {
    await ensureEngine();
    audioEngine.setMid(e.target.value);
    const v = parseFloat(e.target.value);
    midVal.textContent = `${v >= 0 ? '+' : ''}${v} dB`;
  });

  trebleSlider.addEventListener('input', async (e) => {
    await ensureEngine();
    audioEngine.setTreble(e.target.value);
    const v = parseFloat(e.target.value);
    trebleVal.textContent = `${v >= 0 ? '+' : ''}${v} dB`;
  });

  dropzone.addEventListener('click', () => localFileInput.click());

  dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
  });

  dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
  });

  dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleLocalFile(e.dataTransfer.files[0]);
    }
  });

  localFileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleLocalFile(e.target.files[0]);
    }
  });

  exportWavBtn.addEventListener('click', async () => {
    await ensureEngine();
    const track = currentTracks[currentTrackIndex];
    if (!track) {
      showToast('الرجاء اختيار تلاوة لتصديرها');
      return;
    }

    exportWavBtn.disabled = true;
    const origText = exportWavBtn.innerHTML;

    try {
      const srcUrl = track.proxied_audio_url || track.audio_url;
      const wavBlob = await audioEngine.exportWav(srcUrl, (pct, status) => {
        exportWavBtn.innerHTML = `<span style="font-size: 0.8rem;">${status} (${pct}%)</span>`;
      });

      const downloadUrl = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const surahSafeName = (track.surah_name || 'recitation').replace(/\s+/g, '_');
      a.download = `sada_${surahSafeName}_with_fx.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(downloadUrl);

      showToast('تم تصدير وحفظ ملف WAV بنجاح!');
    } catch (err) {
      console.error('Export error:', err);
      showToast('حدث خطأ أثناء تصدير المقطع الصوتي');
    } finally {
      exportWavBtn.disabled = false;
      exportWavBtn.innerHTML = origText;
    }
  });
}

function handleLocalFile(file) {
  if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|m4a|ogg|flac|aac)$/i)) {
    showToast('الرجاء اختيار ملف صوتي صالح (.mp3, .wav, .m4a)');
    return;
  }

  const fileUrl = URL.createObjectURL(file);
  const cleanTitle = file.name.replace(/\.[^/.]+$/, '');

  const customTrack = {
    surah_number: 1,
    surah_name: cleanTitle,
    title: cleanTitle,
    reciter_name: 'تسجيل محلي',
    audio_url: fileUrl,
    is_local: true,
    ayahs_count: '-'
  };

  currentTracks.unshift(customTrack);
  renderSurahList(currentTracks);
  loadTrack(0, true);
  showToast(`تم تحميل الملف: ${file.name}`);
}

window.addEventListener('DOMContentLoaded', initApp);
