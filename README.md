# ASCII LABS

A web app that converts images, GIFs, and videos into ASCII art and retro visual effects. Built with Next.js, TypeScript, and the HTML Canvas API.

## Features

- **9 Visual Effects** — ASCII Art, Floyd-Steinberg Dither, Atkinson Dither, Ordered Dither, Matrix Rain, Edge Detection, Halftone, Pixel Art, Scanlines
- **Real-time Preview** — See changes instantly as you adjust settings
- **ASCII Art Engine** — 11 character sets (Standard, Blocks, Binary, Detailed, Minimal, Alphabetic, Numeric, Math, Symbols, Braille, Matrix) with adjustable scale, spacing, and output width
- **Image Adjustments** — Brightness, contrast, saturation, hue rotation, sharpness, gamma
- **Animated Input** — Supports GIF and MP4 with frame-by-frame effect processing
- **Export** — Download as PNG, JPEG, or plain text (ASCII mode)
- **Mint as cNFT** — Mint your creations as Solana Compressed NFTs (cNFTs) directly from the app. cNFTs cost a fraction of traditional NFTs — mint 1 or 10,000+ in a single wallet approval. Supports any Solana wallet via Wallet Standard (Phantom, Solflare, etc.), with IPFS storage via Pinata

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

Add your Solana RPC endpoint for reliable minting:

```
NEXT_PUBLIC_SOLANA_RPC=your_solana_rpc_url_here
```

These are only required for the cNFT minting feature. The app works without them for all other functionality.

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## cNFT Minting

ASCII LABS uses **Compressed NFTs (cNFTs)** powered by Solana's Bubblegum program and Merkle trees. Compared to standard NFTs:

- **Much cheaper** — A traditional Solana NFT costs ~0.01 SOL per mint. With cNFTs, you pay a one-time tree creation fee (~0.003–0.15 SOL depending on capacity) and each mint after that costs only ~0.000005 SOL.
- **Batch minting** — Mint any quantity (1 to 10,000+) with a **single wallet approval**. Multiple mints are packed into transactions, signed all at once, and sent in parallel.
- **Any Solana wallet** — Connects via the Wallet Standard protocol, so any compatible wallet (Phantom, Solflare, Backpack, etc.) works automatically.

### How it works

1. Connect your wallet
2. Apply an effect to your image
3. Click **Mint as cNFT**, set a name and quantity
4. Approve once — the app creates a Merkle tree, uploads your image and metadata to IPFS, and batch-mints all cNFTs
5. View your cNFTs on Solscan or any Solana NFT marketplace that supports compressed NFTs

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **HTML Canvas API** — All image processing runs client-side
- **Solana Web3.js + Metaplex Bubblegum** — Compressed NFT minting via Merkle trees
- **Pinata** — IPFS storage for NFT assets

## License

MIT
