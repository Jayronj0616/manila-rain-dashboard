import { NextResponse } from "next/server";
import { BlobServiceClient } from "@azure/storage-blob";

const CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME;
const MANIFEST_BLOB_NAME = "manifest.json";

async function downloadBlob(containerClient, blobName) {
  const blobClient = containerClient.getBlobClient(blobName);
  const downloadResponse = await blobClient.download();
  const chunks = [];
  for await (const chunk of downloadResponse.readableStreamBody) {
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf-8"));
}

export async function GET(request) {
  try {
    if (!CONNECTION_STRING || !CONTAINER_NAME) {
      return NextResponse.json(
        { error: "Azure Storage environment variables are not configured." },
        { status: 500 }
      );
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

    const { searchParams } = new URL(request.url);
    const blobName = searchParams.get("blobName");

    if (blobName) {
      // Fetch the specific dataset blob requested
      const dataset = await downloadBlob(containerClient, blobName);
      return NextResponse.json(dataset);
    }

    // No blobName param — fall back to first entry in manifest
    const manifestExists = await containerClient.getBlobClient(MANIFEST_BLOB_NAME).exists();
    if (!manifestExists) {
      // No manifest yet — fall back to legacy blob
      const legacyExists = await containerClient.getBlobClient("dataset_context.json").exists();
      if (!legacyExists) {
        return NextResponse.json(
          { error: "No datasets available. Upload a dataset first." },
          { status: 404 }
        );
      }
      const dataset = await downloadBlob(containerClient, "dataset_context.json");
      return NextResponse.json(dataset);
    }

    const manifest = await downloadBlob(containerClient, MANIFEST_BLOB_NAME);
    if (!manifest.datasets || manifest.datasets.length === 0) {
      // Manifest exists but is empty — fall back to legacy blob
      const legacyExists = await containerClient.getBlobClient("dataset_context.json").exists();
      if (!legacyExists) {
        return NextResponse.json(
          { error: "No datasets available. Upload a dataset first." },
          { status: 404 }
        );
      }
      const dataset = await downloadBlob(containerClient, "dataset_context.json");
      return NextResponse.json(dataset);
    }

    const firstEntry = manifest.datasets[0];
    const dataset = await downloadBlob(containerClient, firstEntry.blobName);
    return NextResponse.json(dataset);
  } catch (error) {
    console.error("Dataset fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dataset from Azure Blob Storage." },
      { status: 500 }
    );
  }
}
