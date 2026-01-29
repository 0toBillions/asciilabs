"use client";

import { useState, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import {
  createUmi,
} from "@metaplex-foundation/umi-bundle-defaults";
import {
  createTree,
  mintV1,
  mplBubblegum,
} from "@metaplex-foundation/mpl-bubblegum";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { generateSigner, none, publicKey as toPublicKey, transactionBuilder } from "@metaplex-foundation/umi";

interface MintNFTProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  effectName: string;
}

type MintStep =
  | "idle"
  | "creating-tree"
  | "uploading-image"
  | "uploading-metadata"
  | "minting"
  | "done"
  | "error";

interface TreeConfig {
  maxDepth: number;
  maxBufferSize: number;
  capacity: number;
}

function selectTreeConfig(quantity: number): TreeConfig {
  // Only valid maxDepth/maxBufferSize pairs supported by the on-chain program
  if (quantity <= 8) return { maxDepth: 3, maxBufferSize: 8, capacity: 8 };
  if (quantity <= 16384) return { maxDepth: 14, maxBufferSize: 64, capacity: 16384 };
  return { maxDepth: 20, maxBufferSize: 64, capacity: 1048576 };
}

const TREE_COST_ESTIMATES: Record<number, string> = {
  3: "~0.003 SOL",
  14: "~0.15 SOL",
  20: "~1.5 SOL",
};

export default function MintNFT({ canvasRef, effectName }: MintNFTProps) {
  const { connected, publicKey } = useWallet();
  const { connection } = useConnection();
  const { setVisible } = useWalletModal();
  const walletAdapter = useWallet();

  const [step, setStep] = useState<MintStep>("idle");
  const [error, setError] = useState("");
  const [treeAddress, setTreeAddress] = useState("");
  const [nftName, setNftName] = useState("ASCII LABS Art");
  const [quantity, setQuantity] = useState(1);
  const [mintProgress, setMintProgress] = useState(0);
  const [showModal, setShowModal] = useState(false);

  const treeConfig = selectTreeConfig(quantity);

  const handleMint = useCallback(async () => {
    if (!connected || !publicKey || !canvasRef.current) return;

    setError("");
    setMintProgress(0);

    try {
      // 1. Create Merkle tree
      setStep("creating-tree");

      const umi = createUmi(connection.rpcEndpoint).use(mplBubblegum());
      umi.use(walletAdapterIdentity(walletAdapter));

      const merkleTree = generateSigner(umi);
      const config = selectTreeConfig(quantity);

      const treeBuilder = await createTree(umi, {
        merkleTree,
        maxDepth: config.maxDepth,
        maxBufferSize: config.maxBufferSize,
      });
      await treeBuilder.sendAndConfirm(umi);

      const treeAddr = merkleTree.publicKey.toString();
      setTreeAddress(treeAddr);

      // 2. Export canvas to blob and upload image
      setStep("uploading-image");

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvasRef.current!.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error("Failed to export canvas"));
        }, "image/png");
      });

      const imageFile = new File([blob], "asciilabs-nft.png", { type: "image/png" });

      const imageForm = new FormData();
      imageForm.append("type", "image");
      imageForm.append("file", imageFile);

      const imgRes = await fetch("/api/upload", { method: "POST", body: imageForm });
      if (!imgRes.ok) {
        const data = await imgRes.json();
        throw new Error(data.error || "Image upload failed");
      }
      const { url: imageUrl } = await imgRes.json();

      // 3. Upload metadata to Pinata (shared across all cNFTs)
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

      // 4. Batch mint cNFTs — pack multiple mints per tx, sign all at once (single wallet approval)
      setStep("minting");

      const MINTS_PER_TX = 5;
      const builders = [];

      for (let batchStart = 0; batchStart < quantity; batchStart += MINTS_PER_TX) {
        const batchEnd = Math.min(batchStart + MINTS_PER_TX, quantity);
        let builder = transactionBuilder();

        for (let i = batchStart; i < batchEnd; i++) {
          builder = builder.add(
            mintV1(umi, {
              leafOwner: umi.identity.publicKey,
              merkleTree: merkleTree.publicKey,
              metadata: {
                name: quantity === 1 ? nftName : `${nftName} #${i + 1}`,
                uri: metadataUrl,
                sellerFeeBasisPoints: 0,
                collection: none(),
                creators: [
                  { address: umi.identity.publicKey, verified: false, share: 100 },
                ],
              },
            })
          );
        }

        builders.push({ builder, count: batchEnd });
      }

      // Build all unsigned transactions with a fresh blockhash
      const blockhash = await umi.rpc.getLatestBlockhash();
      const unsignedTxs = await Promise.all(
        builders.map((b) =>
          b.builder.setBlockhash(blockhash).build(umi)
        )
      );

      // Sign all at once — single wallet approval popup
      const signedTxs = await umi.identity.signAllTransactions(unsignedTxs);

      // Send all signed transactions quickly (don't wait for confirmation between sends)
      const signatures = [];
      for (let i = 0; i < signedTxs.length; i++) {
        const sig = await umi.rpc.sendTransaction(signedTxs[i], {
          skipPreflight: true,
        });
        signatures.push(sig);
        setMintProgress(builders[i].count);
      }

      // Confirm the last transaction to ensure all landed
      await umi.rpc.confirmTransaction(signatures[signatures.length - 1], {
        strategy: { type: "blockhash", ...blockhash },
      });

      setStep("done");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Minting failed";
      setError(message);
      setStep("error");
    }
  }, [connected, publicKey, canvasRef, nftName, effectName, quantity, connection, walletAdapter]);

  const stepLabels: Record<MintStep, string> = {
    idle: "",
    "creating-tree": "Creating Merkle tree on Solana...",
    "uploading-image": "Uploading image to IPFS...",
    "uploading-metadata": "Uploading metadata to IPFS...",
    minting: `Minting ${mintProgress}/${quantity} cNFTs...`,
    done: `${quantity} cNFT${quantity > 1 ? "s" : ""} minted!`,
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
        {connected ? "Mint as cNFT" : "Connect Wallet to Mint"}
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
              <h3 className="text-sm font-bold text-zinc-100">Mint Compressed NFTs</h3>
              <button
                onClick={() => { setShowModal(false); setStep("idle"); setError(""); setMintProgress(0); }}
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
                <div>
                  <label className="text-xs text-zinc-500 block mb-1">Quantity (1–10,000)</label>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={quantity}
                    onChange={(e) => {
                      const v = Math.max(1, Math.min(10000, parseInt(e.target.value) || 1));
                      setQuantity(v);
                    }}
                    className="w-full rounded bg-zinc-800 border border-zinc-700/50 text-zinc-200 px-2 py-1.5 text-xs"
                  />
                </div>
                <div className="text-xs text-zinc-500 space-y-1 bg-zinc-800/50 rounded p-2">
                  <p className="text-zinc-400 font-medium">Cost Estimate</p>
                  <p>Tree creation: {TREE_COST_ESTIMATES[treeConfig.maxDepth]} (one-time)</p>
                  <p>Tree capacity: {treeConfig.capacity.toLocaleString()} NFTs (depth {treeConfig.maxDepth})</p>
                  <p>Per-mint tx fee: ~0.000005 SOL each</p>
                  <p className="text-zinc-400 pt-1 border-t border-zinc-700/50">
                    Total mint fees: ~{(quantity * 0.000005).toFixed(6)} SOL
                  </p>
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
                  Confirm & Mint {quantity > 1 ? `${quantity.toLocaleString()} cNFTs` : "cNFT"}
                </button>
              </>
            )}

            {(step === "creating-tree" || step === "uploading-image" || step === "uploading-metadata" || step === "minting") && (
              <div className="text-center py-4">
                <div className="inline-block w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-xs text-zinc-300">{stepLabels[step]}</p>
                {step === "minting" && quantity > 1 && (
                  <div className="mt-2 w-full bg-zinc-800 rounded-full h-1.5">
                    <div
                      className="bg-purple-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${(mintProgress / quantity) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            )}

            {step === "done" && (
              <div className="text-center py-2 space-y-3">
                <div className="text-green-400 text-lg">&#10003;</div>
                <p className="text-xs text-zinc-300">
                  {quantity} compressed NFT{quantity > 1 ? "s" : ""} minted successfully!
                </p>
                <p className="text-[10px] text-zinc-500 break-all">Tree: {treeAddress}</p>
                <a
                  href={`https://solscan.io/account/${treeAddress}`}
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
