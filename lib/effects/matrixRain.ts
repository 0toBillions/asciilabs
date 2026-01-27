export interface MatrixRainSettings {
  speed: number;       // 1-10
  density: number;     // 0.01-0.1
  trailLength: number; // 5-30
  fontSize: number;
}

export const defaultMatrixRainSettings: MatrixRainSettings = {
  speed: 5,
  density: 0.05,
  fontSize: 14,
  trailLength: 15,
};

const MATRIX_CHARS = "abcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ";

interface Drop {
  x: number;
  y: number;
  speed: number;
  chars: string[];
}

export class MatrixRainRenderer {
  private drops: Drop[] = [];
  private cols = 0;
  private rows = 0;
  private animationId = 0;
  private lastTime = 0;

  start(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    settings: MatrixRainSettings,
    sourceImageData?: ImageData
  ): void {
    this.stop();
    const { fontSize, density } = settings;
    this.cols = Math.floor(width / (fontSize * 0.6));
    this.rows = Math.floor(height / fontSize);
    this.drops = [];

    for (let x = 0; x < this.cols; x++) {
      if (Math.random() < density * 3) {
        this.drops.push(this.createDrop(x, settings));
      }
    }

    const tick = (time: number) => {
      const dt = time - this.lastTime;
      if (dt > 50 / (settings.speed * 0.5)) {
        this.lastTime = time;
        this.render(ctx, width, height, settings, sourceImageData);
      }
      this.animationId = requestAnimationFrame(tick);
    };
    this.animationId = requestAnimationFrame(tick);
  }

  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = 0;
    }
  }

  private createDrop(x: number, settings: MatrixRainSettings): Drop {
    const chars: string[] = [];
    const len = Math.floor(Math.random() * settings.trailLength) + 5;
    for (let i = 0; i < len; i++) {
      chars.push(MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]);
    }
    return {
      x,
      y: -Math.floor(Math.random() * this.rows),
      speed: 0.5 + Math.random() * 1.5,
      chars,
    };
  }

  private render(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    settings: MatrixRainSettings,
    sourceImageData?: ImageData
  ): void {
    const { fontSize, density } = settings;
    const cellW = fontSize * 0.6;

    // Fade effect
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
    ctx.fillRect(0, 0, width, height);
    ctx.font = `${fontSize}px monospace`;
    ctx.textBaseline = "top";

    // Spawn new drops
    for (let x = 0; x < this.cols; x++) {
      if (Math.random() < density * 0.3) {
        this.drops.push(this.createDrop(x, settings));
      }
    }

    for (let i = this.drops.length - 1; i >= 0; i--) {
      const drop = this.drops[i];
      const headY = Math.floor(drop.y);

      for (let j = 0; j < drop.chars.length; j++) {
        const cy = headY - j;
        if (cy < 0 || cy >= this.rows) continue;

        const px = Math.floor(drop.x * cellW);
        const py = cy * fontSize;

        let green = 255;
        if (sourceImageData) {
          const sx = Math.min(Math.floor((drop.x / this.cols) * sourceImageData.width), sourceImageData.width - 1);
          const sy = Math.min(Math.floor((cy / this.rows) * sourceImageData.height), sourceImageData.height - 1);
          const idx = (sy * sourceImageData.width + sx) * 4;
          const lum = (sourceImageData.data[idx] * 0.299 + sourceImageData.data[idx + 1] * 0.587 + sourceImageData.data[idx + 2] * 0.114) / 255;
          green = Math.floor(80 + lum * 175);
        }

        if (j === 0) {
          ctx.fillStyle = "#ffffff";
        } else {
          const fade = 1 - j / drop.chars.length;
          ctx.fillStyle = `rgba(0, ${Math.floor(green * fade)}, 0, ${fade})`;
        }

        // Randomly change chars
        if (Math.random() < 0.05) {
          drop.chars[j] = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
        }
        ctx.fillText(drop.chars[j], px, py);
      }

      drop.y += drop.speed;
      if (headY - drop.chars.length > this.rows) {
        this.drops.splice(i, 1);
      }
    }
  }
}
