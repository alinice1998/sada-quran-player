/**
 * مشغل صدى (Sada) - محرك المعالجة الصوتية الرقمية المباشرة (Web Audio API)
 * معايرة استوديو احترافية ناعمة ودافئة مع أمان كامل ضد التردد التلقائي (Anti-Feedback & DC Removal)
 */

export class SadaAudioEngine {
  constructor() {
    this.ctx = null;
    this.audioElement = null;
    this.sourceNode = null;

    // Nodes
    this.inputGain = null;
    this.dryGain = null;
    this.reverbSend = null;
    this.convolver = null;
    this.reverbReturn = null;
    this.delaySend = null;
    this.delayNode = null;
    this.delayFeedback = null;
    this.delayReturn = null;

    // EQ Nodes
    this.bassFilter = null;
    this.midFilter = null;
    this.trebleFilter = null;

    // Dynamics & Analysis
    this.compressor = null;
    this.analyser = null;
    this.masterGain = null;

    // State
    this.isInitialized = false;
    this.isBypassed = false;

    // Default parameters for calm, sacred Quran recitation
    this.params = {
      reverbWet: 0.16,      // 16% gentle atmospheric reverberation
      reverbPreset: 'haram',
      reverbDecay: 3.0,
      reverbPreDelay: 0.035,
      delayTime: 0.24,
      delayFeedback: 0.0,   // Strictly 0% for pure acoustic mosques
      delayWet: 0.0,        // Strictly 0% default
      bassGain: 0.5,        // dB
      midGain: 0.0,         // dB
      trebleGain: 0.5,      // dB
      masterVolume: 1.0,
      enableCompressor: true
    };
  }

  init(audioElement) {
    if (this.isInitialized) return;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AudioContextClass();
    this.audioElement = audioElement;

    // Source & Input Gain
    this.sourceNode = this.ctx.createMediaElementSource(this.audioElement);
    this.inputGain = this.ctx.createGain();
    this.inputGain.gain.value = 1.0;

    // Dry Path - starts 100% active
    this.dryGain = this.ctx.createGain();
    this.dryGain.gain.value = 1.0;

    // Reverb Path - CRITICAL: Initialize gains to 0.0 to prevent audio spikes
    this.reverbSend = this.ctx.createGain();
    this.reverbSend.gain.value = 0.0;

    this.convolver = this.ctx.createConvolver();
    this.convolver.normalize = true; // Prevents convolver gain runaway

    this.reverbReturn = this.ctx.createGain();
    this.reverbReturn.gain.value = 0.0;

    // Delay Path - CRITICAL: Initialize all delay gains strictly to 0.0 to prevent Larsen feedback
    this.delaySend = this.ctx.createGain();
    this.delaySend.gain.value = 0.0;

    this.delayNode = this.ctx.createDelay(2.0);
    this.delayNode.delayTime.value = 0.24;

    this.delayFeedback = this.ctx.createGain();
    this.delayFeedback.gain.value = 0.0; // Strictly 0!

    this.delayReturn = this.ctx.createGain();
    this.delayReturn.gain.value = 0.0;

    // Gentle Studio EQ
    this.bassFilter = this.ctx.createBiquadFilter();
    this.bassFilter.type = 'lowshelf';
    this.bassFilter.frequency.value = 180;
    this.bassFilter.gain.value = this.params.bassGain;

    this.midFilter = this.ctx.createBiquadFilter();
    this.midFilter.type = 'peaking';
    this.midFilter.frequency.value = 1500;
    this.midFilter.Q.value = 0.8;
    this.midFilter.gain.value = this.params.midGain;

    this.trebleFilter = this.ctx.createBiquadFilter();
    this.trebleFilter.type = 'highshelf';
    this.trebleFilter.frequency.value = 4800;
    this.trebleFilter.gain.value = this.params.trebleGain;

    // Master Limiter / Dynamics
    this.compressor = this.ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -12;
    this.compressor.knee.value = 10;
    this.compressor.ratio.value = 2.0;
    this.compressor.attack.value = 0.01;
    this.compressor.release.value = 0.20;

    // Visualizer Analyser
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.analyser.smoothingTimeConstant = 0.85;

    // Master Output
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.params.masterVolume;

    // Connect Audio Graph safely:
    this.sourceNode.connect(this.inputGain);

    // 1. Dry path (unaltered vocal)
    this.inputGain.connect(this.dryGain);

    // 2. Reverb send/return
    this.inputGain.connect(this.reverbSend);
    this.reverbSend.connect(this.convolver);
    this.convolver.connect(this.reverbReturn);

    // 3. Delay send/return with feedback loop
    this.inputGain.connect(this.delaySend);
    this.delaySend.connect(this.delayNode);
    this.delayNode.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);
    this.delayNode.connect(this.delayReturn);

    // Sum Dry + Reverb + Delay into Master Chain
    this.dryGain.connect(this.bassFilter);
    this.reverbReturn.connect(this.bassFilter);
    this.delayReturn.connect(this.bassFilter);

    this.bassFilter.connect(this.midFilter);
    this.midFilter.connect(this.trebleFilter);

    this.trebleFilter.connect(this.compressor);
    this.compressor.connect(this.analyser);
    this.analyser.connect(this.masterGain);
    this.masterGain.connect(this.ctx.destination);

    // Generate clean, DC-free impulse response
    this.applyPreset(this.params.reverbPreset);
    this.applyAllParams();

    this.isInitialized = true;
  }

  async resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  /**
   * Generates a warm, velvety acoustic impulse response with zero DC bias and zero feedback
   */
  generateImpulseResponse(duration = 2.8, decay = 2.4, preDelaySec = 0.035, highCutFreq = 2600) {
    const sampleRate = this.ctx.sampleRate;
    const length = Math.floor(sampleRate * duration);
    const preDelaySamples = Math.floor(sampleRate * preDelaySec);
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    // Subtle early reflections (discrete marble reflections)
    const earlyReflections = [
      { time: 0.012, gainL: 0.25, gainR: 0.18 },
      { time: 0.024, gainL: 0.18, gainR: 0.25 },
      { time: 0.038, gainL: 0.20, gainR: 0.15 },
      { time: 0.055, gainL: 0.12, gainR: 0.18 }
    ];

    earlyReflections.forEach(ref => {
      const idx = Math.floor(sampleRate * (preDelaySec + ref.time));
      if (idx < length) {
        left[idx] = ref.gainL;
        right[idx] = ref.gainR;
      }
    });

    let filterL = 0;
    let filterR = 0;
    let sumL = 0;
    let sumR = 0;

    for (let i = preDelaySamples; i < length; i++) {
      const progress = (i - preDelaySamples) / (length - preDelaySamples);
      const envelope = Math.pow(1 - progress, decay);

      // Frequency damping: progressive treble roll-off
      const currentCutoff = highCutFreq * Math.pow(1 - progress * 0.7, 2);
      const alpha = Math.exp(-2 * Math.PI * Math.max(currentCutoff, 300) / sampleRate);

      // Velvet noise
      const randL = (Math.random() * 2 - 1) * envelope;
      const randR = (Math.random() * 2 - 1) * envelope;

      filterL = (1 - alpha) * randL + alpha * filterL;
      filterR = (1 - alpha) * randR + alpha * filterR;

      // Windowing at the very end to avoid hard cutoff click
      const fadeOut = progress > 0.85 ? (1 - progress) / 0.15 : 1.0;

      left[i] += filterL * 0.35 * fadeOut;
      right[i] += filterR * 0.35 * fadeOut;

      sumL += left[i];
      sumR += right[i];
    }

    // Remove any DC offset (eliminates low frequency drone/buzzing)
    const meanL = sumL / (length - preDelaySamples);
    const meanR = sumR / (length - preDelaySamples);

    let maxSample = 0;
    for (let i = preDelaySamples; i < length; i++) {
      left[i] -= meanL;
      right[i] -= meanR;
      const absL = Math.abs(left[i]);
      const absR = Math.abs(right[i]);
      if (absL > maxSample) maxSample = absL;
      if (absR > maxSample) maxSample = absR;
    }

    // Normalize peak to 0.75 for pristine headroom
    if (maxSample > 0) {
      const normFactor = 0.75 / maxSample;
      for (let i = preDelaySamples; i < length; i++) {
        left[i] *= normFactor;
        right[i] *= normFactor;
      }
    }

    return impulse;
  }

  applyPreset(presetName) {
    this.params.reverbPreset = presetName;

    switch (presetName) {
      case 'haram': // الحرم المكي الشريف (صدى رخامي ناعم ومهيب)
        this.convolver.buffer = this.generateImpulseResponse(3.0, 2.2, 0.035, 2600);
        this.params.reverbWet = 0.16;       // 16%
        this.params.reverbDecay = 3.0;
        this.params.delayTime = 0.24;
        this.params.delayFeedback = 0.0;   // 0% - no echo
        this.params.delayWet = 0.0;
        this.params.bassGain = 0.5;
        this.params.midGain = 0.0;
        this.params.trebleGain = 0.5;
        break;

      case 'dome': // مسجد جامع ذو قبة (تردد متزن وندي ودافئ)
        this.convolver.buffer = this.generateImpulseResponse(2.0, 2.5, 0.025, 2800);
        this.params.reverbWet = 0.12;       // 12%
        this.params.reverbDecay = 2.0;
        this.params.delayTime = 0.20;
        this.params.delayFeedback = 0.0;
        this.params.delayWet = 0.0;
        this.params.bassGain = 0.3;
        this.params.midGain = 0.0;
        this.params.trebleGain = 0.3;
        break;

      case 'musalla': // مصلى هادئ / محراب (حضور طبيعي خفيف)
        this.convolver.buffer = this.generateImpulseResponse(1.1, 3.0, 0.015, 3400);
        this.params.reverbWet = 0.07;       // 7%
        this.params.reverbDecay = 1.1;
        this.params.delayTime = 0.12;
        this.params.delayFeedback = 0.0;
        this.params.delayWet = 0.0;
        this.params.bassGain = 0.0;
        this.params.midGain = 0.0;
        this.params.trebleGain = 0.0;
        break;

      case 'classic_echo': // صدى إذاعي خفيف
        this.convolver.buffer = this.generateImpulseResponse(1.6, 2.6, 0.02, 3000);
        this.params.reverbWet = 0.08;       // 8%
        this.params.reverbDecay = 1.6;
        this.params.delayTime = 0.24;       // 240ms
        this.params.delayFeedback = 0.12;   // 12% very gentle
        this.params.delayWet = 0.10;        // 10%
        this.params.bassGain = 0.3;
        this.params.midGain = 0.4;
        this.params.trebleGain = 0.8;
        break;

      case 'studio': // استوديو نقي 100%
      default:
        this.params.reverbWet = 0.0;
        this.params.delayWet = 0.0;
        this.params.delayFeedback = 0.0;
        this.params.bassGain = 0.0;
        this.params.midGain = 0.0;
        this.params.trebleGain = 0.0;
        break;
    }

    if (!this.isBypassed) {
      this.applyAllParams();
    }
  }

  applyAllParams() {
    if (!this.isInitialized) return;
    const now = this.ctx.currentTime;

    if (this.isBypassed) {
      // Pure Dry Mode
      this.dryGain.gain.setValueAtTime(1.0, now);
      this.reverbSend.gain.setValueAtTime(0.0, now);
      this.reverbReturn.gain.setValueAtTime(0.0, now);
      this.delaySend.gain.setValueAtTime(0.0, now);
      this.delayReturn.gain.setValueAtTime(0.0, now);
      this.delayFeedback.gain.setValueAtTime(0.0, now);
      this.bassFilter.gain.setValueAtTime(0.0, now);
      this.midFilter.gain.setValueAtTime(0.0, now);
      this.trebleFilter.gain.setValueAtTime(0.0, now);
    } else {
      // Parallel Studio Mixing:
      // Dry voice is 100% upfront
      this.dryGain.gain.setValueAtTime(1.0, now);

      // Reverb Send & Return
      this.reverbSend.gain.setValueAtTime(this.params.reverbWet > 0 ? 1.0 : 0.0, now);
      this.reverbReturn.gain.setValueAtTime(this.params.reverbWet, now);

      // Delay Send & Return
      if (this.params.delayWet > 0) {
        this.delaySend.gain.setValueAtTime(1.0, now);
        this.delayNode.delayTime.setValueAtTime(this.params.delayTime, now);
        this.delayFeedback.gain.setValueAtTime(Math.min(this.params.delayFeedback, 0.4), now); // Hard limiter to prevent runaway
        this.delayReturn.gain.setValueAtTime(this.params.delayWet, now);
      } else {
        this.delaySend.gain.setValueAtTime(0.0, now);
        this.delayFeedback.gain.setValueAtTime(0.0, now);
        this.delayReturn.gain.setValueAtTime(0.0, now);
      }

      // EQ
      this.bassFilter.gain.setValueAtTime(this.params.bassGain, now);
      this.midFilter.gain.setValueAtTime(this.params.midGain, now);
      this.trebleFilter.gain.setValueAtTime(this.params.trebleGain, now);
    }

    this.masterGain.gain.setValueAtTime(this.params.masterVolume, now);
  }

  toggleBypass() {
    this.isBypassed = !this.isBypassed;
    this.applyAllParams();
    return this.isBypassed;
  }

  setBypass(bypassed) {
    this.isBypassed = !!bypassed;
    this.applyAllParams();
    return this.isBypassed;
  }

  setReverbWet(val) {
    this.params.reverbWet = parseFloat(val);
    if (!this.isBypassed) this.applyAllParams();
  }

  setReverbDecay(val) {
    this.params.reverbDecay = parseFloat(val);
    if (this.params.reverbPreset !== 'studio') {
      this.convolver.buffer = this.generateImpulseResponse(this.params.reverbDecay, 2.4, this.params.reverbPreDelay);
    }
  }

  setDelayTime(val) {
    this.params.delayTime = parseFloat(val);
    if (!this.isBypassed) this.applyAllParams();
  }

  setDelayFeedback(val) {
    this.params.delayFeedback = parseFloat(val);
    if (!this.isBypassed) this.applyAllParams();
  }

  setDelayWet(val) {
    this.params.delayWet = parseFloat(val);
    if (!this.isBypassed) this.applyAllParams();
  }

  setBass(val) {
    this.params.bassGain = parseFloat(val);
    if (!this.isBypassed) this.applyAllParams();
  }

  setMid(val) {
    this.params.midGain = parseFloat(val);
    if (!this.isBypassed) this.applyAllParams();
  }

  setTreble(val) {
    this.params.trebleGain = parseFloat(val);
    if (!this.isBypassed) this.applyAllParams();
  }

  setMasterVolume(val) {
    this.params.masterVolume = parseFloat(val);
    if (this.masterGain) {
      this.masterGain.gain.setValueAtTime(this.params.masterVolume, this.ctx.currentTime);
    }
  }

  async exportWav(audioBlobOrUrl, progressCallback) {
    if (progressCallback) progressCallback(10, 'جاري تحميل المقطع للإنتاج...');

    const response = await fetch(audioBlobOrUrl);
    const arrayBuffer = await response.arrayBuffer();

    if (progressCallback) progressCallback(30, 'فك ترميز الصوت الخام...');
    const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer);

    if (progressCallback) progressCallback(50, 'تطبيق المؤثرات الصوتية بدقة الاستوديو...');
    const offlineCtx = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length + (audioBuffer.sampleRate * 2.5),
      audioBuffer.sampleRate
    );

    const offlineSource = offlineCtx.createBufferSource();
    offlineSource.buffer = audioBuffer;

    const dryG = offlineCtx.createGain();
    const revSend = offlineCtx.createGain();
    const conv = offlineCtx.createConvolver();
    conv.normalize = true;
    const revReturn = offlineCtx.createGain();

    const delSend = offlineCtx.createGain();
    const del = offlineCtx.createDelay(2.0);
    const delFb = offlineCtx.createGain();
    const delReturn = offlineCtx.createGain();

    const bass = offlineCtx.createBiquadFilter();
    bass.type = 'lowshelf';
    bass.frequency.value = 180;
    bass.gain.value = this.params.bassGain;

    const mid = offlineCtx.createBiquadFilter();
    mid.type = 'peaking';
    mid.frequency.value = 1500;
    mid.gain.value = this.params.midGain;

    const treble = offlineCtx.createBiquadFilter();
    treble.type = 'highshelf';
    treble.frequency.value = 4800;
    treble.gain.value = this.params.trebleGain;

    conv.buffer = this.convolver.buffer;

    dryG.gain.value = 1.0;
    revSend.gain.value = 1.0;
    revReturn.gain.value = this.params.reverbWet;

    delSend.gain.value = this.params.delayWet > 0 ? 1.0 : 0.0;
    del.delayTime.value = this.params.delayTime;
    delFb.gain.value = this.params.delayFeedback;
    delReturn.gain.value = this.params.delayWet;

    offlineSource.connect(dryG);
    offlineSource.connect(revSend);
    revSend.connect(conv);
    conv.connect(revReturn);

    offlineSource.connect(delSend);
    delSend.connect(del);
    del.connect(delFb);
    delFb.connect(del);
    del.connect(delReturn);

    dryG.connect(bass);
    revReturn.connect(bass);
    delReturn.connect(bass);

    bass.connect(mid);
    mid.connect(treble);
    treble.connect(offlineCtx.destination);

    offlineSource.start(0);

    if (progressCallback) progressCallback(75, 'معالجة الترددات والصدى...');
    const renderedBuffer = await offlineCtx.startRendering();

    if (progressCallback) progressCallback(95, 'توليد ملف WAV...');
    const wavBlob = bufferToWaveBlob(renderedBuffer);

    if (progressCallback) progressCallback(100, 'اكتملت المعالجة!');
    return wavBlob;
  }
}

function bufferToWaveBlob(abuffer) {
  const numOfChan = abuffer.numberOfChannels;
  const length = abuffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels = [];
  let sample = 0;
  let offset = 0;
  let pos = 0;

  function setUint16(data) {
    out.setUint16(pos, data, true);
    pos += 2;
  }
  function setUint32(data) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8);
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt "
  setUint32(16);
  setUint16(1);
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16);

  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4);

  for (let i = 0; i < numOfChan; i++) {
    channels.push(abuffer.getChannelData(i));
  }

  while (offset < abuffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out.buffer], { type: 'audio/wav' });
}
