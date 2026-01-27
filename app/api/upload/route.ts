import { NextRequest, NextResponse } from "next/server";

const PINATA_JWT = process.env.PINATA_JWT;
const PINATA_GATEWAY = process.env.NEXT_PUBLIC_PINATA_GATEWAY || "gateway.pinata.cloud";

export async function POST(request: NextRequest) {
  if (!PINATA_JWT) {
    return NextResponse.json({ error: "Pinata JWT not configured" }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const type = formData.get("type") as string;

    if (type === "image") {
      // Upload image file to IPFS
      const file = formData.get("file") as File;
      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
      }

      const pinataForm = new FormData();
      pinataForm.append("file", file);
      pinataForm.append("pinataMetadata", JSON.stringify({ name: file.name }));

      const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
        method: "POST",
        headers: { Authorization: `Bearer ${PINATA_JWT}` },
        body: pinataForm,
      });

      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json({ error: `Pinata upload failed: ${errText}` }, { status: 500 });
      }

      const data = await res.json();
      return NextResponse.json({
        ipfsHash: data.IpfsHash,
        url: `https://${PINATA_GATEWAY}/ipfs/${data.IpfsHash}`,
      });
    }

    if (type === "metadata") {
      // Upload JSON metadata to IPFS
      const metadata = formData.get("metadata") as string;
      if (!metadata) {
        return NextResponse.json({ error: "No metadata provided" }, { status: 400 });
      }

      const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PINATA_JWT}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pinataContent: JSON.parse(metadata),
          pinataMetadata: { name: "nft-metadata.json" },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json({ error: `Pinata metadata upload failed: ${errText}` }, { status: 500 });
      }

      const data = await res.json();
      return NextResponse.json({
        ipfsHash: data.IpfsHash,
        url: `https://${PINATA_GATEWAY}/ipfs/${data.IpfsHash}`,
      });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
