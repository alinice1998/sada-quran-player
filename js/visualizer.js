/**
 * مشغل صدى - العارض البصري المباشر للترددات وموجات الصوت (Real-time Canvas Visualizer)
 */

export class AudioVisualizer {
  constructor(canvas, analyserNode) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.analyser = analyserNode;
    this.animationId = null;

    this.bufferLength = this.analyser.frequencyBinCount;
    this.freqData = new Uint8Array(this.bufferLength);
    this.timeData = new Uint8Array(this.bufferLength);

    this.peakLevels = new Float32Array(64).fill(0);

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.width = rect.width;
    this.height = rect.height;
  }

  start() {
    if (this.animationId) return;
    const render = () => {
      this.draw();
      this.animationId = requestAnimationFrame(render);
    };
    render();
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  draw() {
    if (!this.analyser) return;

    this.analyser.getByteFrequencyData(this.freqData);
    this.analyser.getByteTimeDomainData(this.timeData);

    const w = this.width;
    const h = this.height;

    this.ctx.clearRect(0, 0, w, h);

    let hasSignal = false;
    for (let i = 0; i < 30; i++) {
      if (this.freqData[i] > 2) {
        hasSignal = true;
        break;
      }
    }

    if (!hasSignal) {
      this.drawIdleState(w, h);
      return;
    }

    this.drawFrequencyBars(w, h);
    this.drawWaveform(w, h);
  }

  drawIdleState(w, h) {
    this.ctx.beginPath();
    this.ctx.strokeStyle = 'rgba(218, 165, 32, 0.25)';
    this.ctx.lineWidth = 2;
    this.ctx.moveTo(0, h / 2);
    this.ctx.lineTo(w, h / 2);
    this.ctx.stroke();

    this.ctx.font = '12px Tajawal, sans-serif';
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('جاهز لتشغيل التلاوة ومعالجة المؤثرات آنياً', w / 2, h / 2 - 12);
  }

  drawFrequencyBars(w, h) {
    const numBars = 48;
    const barSpacing = 3;
    const barWidth = (w - (numBars - 1) * barSpacing) / numBars;

    const gradient = this.ctx.createLinearGradient(0, h, 0, 0);
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.75)');   // Emerald
    gradient.addColorStop(0.6, 'rgba(217, 119, 6, 0.85)');  // Warm Gold
    gradient.addColorStop(1, 'rgba(245, 158, 11, 1)');      // Bright Amber

    const step = Math.floor((this.bufferLength * 0.7) / numBars);

    for (let i = 0; i < numBars; i++) {
      let sum = 0;
      for (let j = 0; j < step; j++) {
        sum += this.freqData[i * step + j];
      }
      const avg = sum / step;
      const barHeight = (avg / 255) * (h * 0.85);

      if (barHeight > this.peakLevels[i]) {
        this.peakLevels[i] = barHeight;
      } else {
        this.peakLevels[i] = Math.max(0, this.peakLevels[i] - 1.2);
      }

      const x = i * (barWidth + barSpacing);
      const y = h - barHeight;

      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      if (barHeight > 4) {
        this.ctx.roundRect(x, y, barWidth, barHeight, [3, 3, 0, 0]);
      } else {
        this.ctx.rect(x, h - 3, barWidth, 3);
      }
      this.ctx.fill();

      if (this.peakLevels[i] > 4) {
        this.ctx.fillStyle = '#FCD34D';
        const peakY = h - this.peakLevels[i] - 3;
        this.ctx.fillRect(x, Math.max(0, peakY), barWidth, 2);
      }
    }
  }

  drawWaveform(w, h) {
    this.ctx.beginPath();
    this.ctx.lineWidth = 1.5;
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';

    const sliceWidth = w / this.bufferLength;
    let x = 0;

    for (let i = 0; i < this.bufferLength; i++) {
      const v = this.timeData[i] / 128.0;
      const y = (v * h) / 2;

      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    this.ctx.stroke();
  }
}
