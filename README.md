# ASCII LABS

A web app that converts images, GIFs, and videos into ASCII art and retro visual effects. Built with Next.js, TypeScript, and the HTML Canvas API.

## Features

- **9 Visual Effects** — ASCII Art, Floyd-Steinberg Dither, Atkinson Dither, Ordered Dither, Matrix Rain, Edge Detection, Halftone, Pixel Art, Scanlines
- **Real-time Preview** — See changes instantly as you adjust settings
- **ASCII Art Engine** — 11 character sets (Standard, Blocks, Binary, Detailed, Minimal, Alphabetic, Numeric, Math, Symbols, Braille, Matrix) with adjustable scale, spacing, and output width
- **Image Adjustments** — Brightness, contrast, saturation, hue rotation, sharpness, gamma
- **Animated Input** — Supports GIF and MP4 with frame-by-frame effect processing
- **Export** — Download as PNG, JPEG, or plain text (ASCII mode)
- **Mint as NFT** — Mint your creations as Solana NFTs directly from the app (Phantom & Solflare wallets supported, IPFS via Pinata)

## Supported Formats

| Input | Formats |
|-------|---------|
| Image | JPG, PNG, WebP, BMP |
| Animated | GIF |
| Video | MP4 |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/0toBillions/asciilabs.git
cd asciilabs
npm install
```

### Environment Variables

Create a `.env.local` file in the root directory:

```
PINATA_JWT=your_pinata_jwt_here
NEXT_PUBLIC_PINATA_GATEWAY=your_gateway_here
```

These are only required for the NFT minting feature. The app works without them for all other functionality.

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **HTML Canvas API** — All image processing runs client-side
- **Solana Web3.js + Metaplex** — NFT minting
- **Pinata** — IPFS storage for NFT assets

## License

MIT
