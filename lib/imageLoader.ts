export interface LoadedMedia {
  imageData: ImageData;
  width: number;
  height: number;
  animated: boolean;
  /** For GIF/video: call this to get the current frame's ImageData */
  getFrame?: () => ImageData;
  /** For video: the video element (needs play/pause control) */
  videoElement?: HTMLVideoElement;
  /** For GIF: the img element (browser animates it) */
  imgElement?: HTMLImageElement;
  /** Blob URL to revoke on cleanup */
  objectUrl?: string;
}

export function loadMedia(
  file: File,
  maxWidth = 800,
  maxHeight = 600
): Promise<LoadedMedia> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const isVideo = file.type.startsWith("video/");
    const isGif = file.type === "image/gif";

    if (isVideo) {
      const video = document.createElement("video");
      video.src = url;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.onloadeddata = () => {
        const { width, height } = fitDimensions(video.videoWidth, video.videoHeight, maxWidth, maxHeight);
        const scratch = document.createElement("canvas");
        scratch.width = width;
        scratch.height = height;
        const scratchCtx = scratch.getContext("2d")!;

        scratchCtx.drawImage(video, 0, 0, width, height);
        const imageData = scratchCtx.getImageData(0, 0, width, height);

        const getFrame = (): ImageData => {
          scratchCtx.drawImage(video, 0, 0, width, height);
          return scratchCtx.getImageData(0, 0, width, height);
        };

        video.play();
        resolve({ imageData, width, height, animated: true, getFrame, videoElement: video, objectUrl: url });
      };
      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load video"));
      };
      video.load();
    } else if (isGif) {
      const img = new Image();
      img.onload = () => {
        const { width, height } = fitDimensions(img.naturalWidth, img.naturalHeight, maxWidth, maxHeight);
        const scratch = document.createElement("canvas");
        scratch.width = width;
        scratch.height = height;
        const scratchCtx = scratch.getContext("2d")!;

        scratchCtx.drawImage(img, 0, 0, width, height);
        const imageData = scratchCtx.getImageData(0, 0, width, height);

        const getFrame = (): ImageData => {
          scratchCtx.drawImage(img, 0, 0, width, height);
          return scratchCtx.getImageData(0, 0, width, height);
        };

        resolve({ imageData, width, height, animated: true, getFrame, imgElement: img, objectUrl: url });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load GIF"));
      };
      img.src = url;
    } else {
      const img = new Image();
      img.onload = () => {
        const { width, height } = fitDimensions(img.naturalWidth, img.naturalHeight, maxWidth, maxHeight);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        URL.revokeObjectURL(url);
        resolve({ imageData, width, height, animated: false });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("Failed to load image"));
      };
      img.src = url;
    }
  });
}

export function fitDimensions(
  srcW: number,
  srcH: number,
  maxW: number,
  maxH: number
): { width: number; height: number } {
  let width = srcW;
  let height = srcH;
  if (width > maxW) {
    height = Math.round(height * (maxW / width));
    width = maxW;
  }
  if (height > maxH) {
    width = Math.round(width * (maxH / height));
    height = maxH;
  }
  return { width, height };
}

export function cleanupMedia(media: LoadedMedia): void {
  if (media.objectUrl) {
    URL.revokeObjectURL(media.objectUrl);
  }
  if (media.videoElement) {
    media.videoElement.pause();
    media.videoElement.src = "";
  }
}
