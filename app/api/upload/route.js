import { NextResponse } from "next/server";
import { BlobServiceClient } from "@azure/storage-blob";

const CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = process.env.AZURE_STORAGE_CONTAINER_NAME;
const UPLOAD_PASSCODE = process.env.UPLOAD_PASSCODE;
const MANIFEST_BLOB_NAME = "manifest.json";

const REQUIRED_TOP_LEVEL_KEYS = [
  "dataset_overview",
  "summary_per_area",
  "full_cleaned_dataset",
  "model_info",
];

const REQUIRED_RECORD_KEYS = ["Area", "Month", "Temperature", "Rain Frequency"];

function validateDataset(dataset) {
  // Check top-level keys
  for (const key of REQUIRED_TOP_LEVEL_KEYS) {
    if (!(key in dataset)) {
      return `Missing required key: "${key}"`;
    }
  }

  // Check full_cleaned_dataset is a non-empty array
  if (!Array.isArray(dataset.full_cleaned_dataset) || dataset.full_cleaned_dataset.length === 0) {
    return '"full_cleaned_dataset" must be a non-empty array.';
  }

  // Check each record has required fields
  for (let i = 0; i < dataset.full_cleaned_dataset.length; i++) {
    const record = dataset.full_cleaned_dataset[i];
    for (const key of REQUIRED_RECORD_KEYS) {
      if (!(key in record)) {
        return `Record at index ${i} is missing field: "${key}"`;
      }
    }
  }

  // Check dataset_overview has required fields
  const overview = dataset.dataset_overview;
  if (!Array.isArray(overview.areas) || overview.areas.length === 0) {
    return '"dataset_overview.areas" must be a non-empty array.';
  }
  if (typeof overview.total_rows !== "number") {
    return '"dataset_overview.total_rows" must be a number.';
  }

  // Check model_info exists and has r2_score
  if (typeof dataset.model_info.r2_score !== "number") {
    return '"model_info.r2_score" must be a number.';
  }

  return null; // null = valid
}

export async function POST(request) {
  try {
    const { passcode, dataset } = await request.json();

    if (!passcode || passcode !== UPLOAD_PASSCODE) {
      return NextResponse.json({ error: "Invalid passcode." }, { status: 401 });
    }

    if (!dataset || typeof dataset !== "object" || Array.isArray(dataset)) {
      return NextResponse.json({ error: "Invalid dataset payload." }, { status: 400 });
    }

    const validationError = validateDataset(dataset);
    if (validationError) {
      return NextResponse.json(
        { error: `Dataset structure is invalid: ${validationError}` },
        { status: 400 }
      );
    }

    if (!CONNECTION_STRING || !CONTAINER_NAME) {
      return NextResponse.json(
        { error: "Azure Storage environment variables are not configured." },
        { status: 500 }
      );
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

    // Generate unique blob name and readable label from timestamp
    const now = new Date();
    const ts = now.toISOString().replace(/[:.]/g, "-"); // safe for blob names
    const blobName = `dataset_${ts}.json`;
    const label = `Dataset – ${now.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    })}`;

    // Step 1 — upload dataset content blob
    const datasetBlobClient = containerClient.getBlockBlobClient(blobName);
    const content = JSON.stringify(dataset, null, 2);
    const buffer = Buffer.from(content, "utf-8");

    await datasetBlobClient.uploadData(buffer, {
      blobHTTPHeaders: { blobContentType: "application/json" },
    });

    // Step 2 — read existing manifest (or start fresh), append new entry, write back
    const manifestBlobClient = containerClient.getBlockBlobClient(MANIFEST_BLOB_NAME);
    let manifest = { datasets: [] };

    const manifestExists = await manifestBlobClient.exists();
    if (manifestExists) {
      try {
        const downloadResponse = await manifestBlobClient.download();
        const chunks = [];
        for await (const chunk of downloadResponse.readableStreamBody) {
          chunks.push(chunk);
        }
        manifest = JSON.parse(Buffer.concat(chunks).toString("utf-8"));
      } catch {
        // Manifest is corrupted — reset it rather than failing the whole upload
        manifest = { datasets: [] };
      }
    }

    manifest.datasets.push({
      id: crypto.randomUUID(),
      blobName,
      label,
      uploadedAt: now.toISOString(),
    });

    const manifestContent = JSON.stringify(manifest, null, 2);
    const manifestBuffer = Buffer.from(manifestContent, "utf-8");

    try {
      await manifestBlobClient.uploadData(manifestBuffer, {
        blobHTTPHeaders: { blobContentType: "application/json" },
        overwrite: true,
      });
    } catch (manifestError) {
      console.error("Manifest update failed:", manifestError);
      // Dataset blob uploaded successfully but manifest failed —
      // the dataset exists in storage but won't appear in the selector until re-uploaded.
      return NextResponse.json(
        {
          error:
            "Dataset was saved but the dataset list could not be updated. " +
            "Re-upload the same file to make it appear in the selector.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Dataset added as "${label}". Select it from the dropdown to make it active.`,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload dataset to Azure Blob Storage." },
      { status: 500 }
    );
  }
}
