"use client";

import { useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import {
  createUmi,
} from "@metaplex-foundation/umi-bundle-defaults";
import {
  createNft,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { generateSigner, percentAmount } from "@metaplex-foundation/umi";

interface MintNFTProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  effectName: string;
}

type MintStep = "idle" | "uploading-image" | "uploading-metadata" | "minting" | "done" | "error";

export default function MintNFT({ canvasRef, effectName }: MintNFTProps) {
  const { connected, publicKey, wallet } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const walletAdapter = useWallet();

  const [step, setStep] = useState<MintStep>("idle");
  const [error, setError] = useState("");
  const [mintAddress, setMintAddress] = useState("");
  const [nftName, setNftName] = useState("ASCII LABS Art");
  const [showModal, setShowModal] = useState(false);

  const handleMint = useCallback(async () => {
    if (!connected || !publicKey || !canvasRef.current) return;

    setStep("uploading-image");
    setError("");

    try {
      // 1. Export canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvasRef.current!.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error("Failed to export canvas"));
        }, "image/png");
      });

      const imageFile = new File([blob], "asciilabs-nft.png", { type: "image/png" });

      // 2. Upload image to Pinata via API route
      const imageForm = new FormData();
      imageForm.append("type", "image");
      imageForm.append("file", imageFile);

      const imgRes = await fetch("/api/upload", { method: "POST", body: imageForm });
      if (!imgRes.ok) {
        const data = await imgRes.json();
        throw new Error(data.error || "Image upload failed");
      }
      const { url: imageUrl } = await imgRes.json();

      // 3. Upload metadata to Pinata
      setStep("uploading-metadata");

      const metadata = {
        name: nftName,
        symbol: "ALAB",
        description: `Created with ASCII LABS using ${effectName} effect`,
        image: imageUrl,
        attributes: [
          { trait_type: "Effect", value: effectName },
          { trait_type: "Tool", value: "ASCII LABS" },
        ],
        properties: {
          files: [{ uri: imageUrl, type: "image/png" }],
          category: "image",
        },
      };

      const metaForm = new FormData();
      metaForm.append("type", "metadata");
      metaForm.append("metadata", JSON.stringify(metadata));

      const metaRes = await fetch("/api/upload", { method: "POST", body: metaForm });
      if (!metaRes.ok) {
        const data = await metaRes.json();
        throw new Error(data.error || "Metadata upload failed");
      }
      const { url: metadataUrl } = await metaRes.json();

      // 4. Mint NFT on Solana using Metaplex
      setStep("minting");

      const umi = createUmi(connection.rpcEndpoint).use(mplTokenMetadata());
      umi.use(walletAdapterIdentity(walletAdapter));

      const mint = generateSigner(umi);

      await createNft(umi, {
        mint,
        name: nftName,
        symbol: "ALAB",
        uri: metadataUrl,
        sellerFeeBasisPoints: percentAmount(0),
        isMutable: true,
      }).sendAndConfirm(umi);

      setMintAddress(mint.publicKey.toString());
      setStep("done");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Minting failed";
      setError(message);
      setStep("error");
    }
  }, [connected, publicKey, canvasRef, nftName, effectName, connection, walletAdapter]);

  const stepLabels: Record<MintStep, string> = {
    idle: "",
    "uploading-image": "Uploading image to IPFS...",
    "uploading-metadata": "Uploading metadata to IPFS...",
    minting: "Minting NFT on Solana...",
    done: "NFT minted!",
    error: "Error",
  };

  return (
    <>
      <button
        onClick={() => {
          if (!connected) {
            setVisible(true);
          } else {
            setShowModal(true);
          }
        }}
        className="w-full px-3 py-2 rounded text-xs font-medium transition-colors bg-purple-600 hover:bg-purple-500 text-white"
      >
        {connected ? "Mint as NFT" : "Connect Wallet to Mint"}
      </button>

      {connected && publicKey && (
        <div className="text-[10px] text-zinc-600 truncate">
          {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
        </div>
      )}

      {/* Mint Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-zinc-900 border border-zinc-700/50 rounded-lg p-5 w-80 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-zinc-100">Mint NFT</h3>
              <button
                onClick={() => { setShowModal(false); setStep("idle"); setError(""); }}
                className="text-zinc-500 hover:text-zinc-300 text-lg"
              >
                ×
              </button>
            </div>

            {step === "idle" && (
              <>
                <div>
                  <label className="text-xs text-zinc-500 block mb-1">NFT Name</label>
                  <input
                    type="text"
                    value={nftName}
                    onChange={(e) => setNftName(e.target.value)}
                    className="w-full rounded bg-zinc-800 border border-zinc-700/50 text-zinc-200 px-2 py-1.5 text-xs"
                    placeholder="My ASCII LABS Art"
                  />
                </div>
                <div className="text-xs text-zinc-500 space-y-1">
                  <p>Effect: {effectName}</p>
                  <p>Network: Solana Mainnet</p>
                  <p>Wallet: {publicKey?.toBase58().slice(0, 8)}...</p>
                </div>
                <button
                  onClick={handleMint}
                  className="w-full px-3 py-2 rounded text-xs font-medium bg-purple-600 hover:bg-purple-500 text-white"
                >
                  Confirm & Mint
                </button>
              </>
            )}

            {(step === "uploading-image" || step === "uploading-metadata" || step === "minting") && (
              <div className="text-center py-4">
                <div className="inline-block w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-xs text-zinc-300">{stepLabels[step]}</p>
              </div>
            )}

            {step === "done" && (
              <div className="text-center py-2 space-y-3">
                <div className="text-green-400 text-lg">&#10003;</div>
                <p className="text-xs text-zinc-300">NFT minted successfully!</p>
                <p className="text-[10px] text-zinc-500 break-all">Mint: {mintAddress}</p>
                <a
                  href={`https://solscan.io/token/${mintAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-xs text-purple-400 hover:text-purple-300 underline"
                >
                  View on Solscan
                </a>
              </div>
            )}

            {step === "error" && (
              <div className="py-2 space-y-3">
                <p className="text-xs text-red-400">{error}</p>
                <button
                  onClick={() => setStep("idle")}
                  className="w-full px-3 py-2 rounded text-xs font-medium bg-zinc-700 hover:bg-zinc-600 text-white"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
