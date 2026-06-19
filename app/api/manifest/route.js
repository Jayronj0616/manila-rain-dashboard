import { NextResponse } from "next/server";
import { BlobServiceClient } from "@azure/storage-blob";

const CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME;
const MANIFEST_BLOB_NAME = "manifest.json";

export async function GET() {
  try {
    if (!CONNECTION_STRING || !CONTAINER_NAME) {
      return NextResponse.json(
        { error: "Azure Storage environment variables are not configured." },
        { status: 500 }
      );
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);
    const blobClient = containerClient.getBlobClient(MANIFEST_BLOB_NAME);

    const exists = await blobClient.exists();
    if (!exists) {
      // No manifest yet — return empty list, not an error
      return NextResponse.json({ datasets: [] });
    }

    const downloadResponse = await blobClient.download();
    const chunks = [];
    for await (const chunk of downloadResponse.readableStreamBody) {
      chunks.push(chunk);
    }
    const manifest = JSON.parse(Buffer.concat(chunks).toString("utf-8"));

    return NextResponse.json(manifest);
  } catch (error) {
    console.error("Manifest fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dataset list from Azure Blob Storage." },
      { status: 500 }
    );
  }
}
