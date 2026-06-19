"use client";

import { useState, useEffect } from "react";

const REQUIRED_KEYS = [
  "dataset_overview",
  "summary_per_area",
  "full_cleaned_dataset",
  "model_info",
];

function clientValidate(dataset) {
  for (const key of REQUIRED_KEYS) {
    if (!(key in dataset)) return `Missing required key: "${key}"`;
  }
  if (!Array.isArray(dataset.full_cleaned_dataset) || dataset.full_cleaned_dataset.length === 0) {
    return '"full_cleaned_dataset" must be a non-empty array.';
  }
  return null;
}

export default function DataTab({ onDatasetChange }) {
  const [file, setFile] = useState(null);
  const [passcode, setPasscode] = useState("");
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState("");

  const [manifest, setManifest] = useState([]);
  const [manifestLoading, setManifestLoading] = useState(true);
  const [manifestError, setManifestError] = useState(null);
  const [selectedBlobName, setSelectedBlobName] = useState(null);
  const [switchingDataset, setSwitchingDataset] = useState(false);

  useEffect(() => {
    fetch("/api/manifest")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load dataset list.");
        return res.json();
      })
      .then((data) => {
        const datasets = data.datasets || [];
        setManifest(datasets);
        setManifestLoading(false);
        // Auto-select the first entry so the dropdown reflects the active dataset
        if (datasets.length > 0) {
          setSelectedBlobName(datasets[0].blobName);
        }
      })
      .catch((err) => {
        setManifestError(err.message);
        setManifestLoading(false);
      });
  }, []);

  async function handleSelectDataset(blobName) {
    if (!blobName || blobName === selectedBlobName) return;
    const confirmed = window.confirm(
      "Switch the active dataset? This will update the Overview, charts, and assistant."
    );
    if (!confirmed) return;
    setSwitchingDataset(true);
    try {
      const res = await fetch(`/api/dataset?blobName=${encodeURIComponent(blobName)}`);
      if (!res.ok) throw new Error("Failed to load selected dataset.");
      const dataset = await res.json();
      setSelectedBlobName(blobName);
      onDatasetChange(dataset);
    } catch (err) {
      setManifestError(err.message);
    } finally {
      setSwitchingDataset(false);
    }
  }

  async function handleUpload() {
    if (!file || !passcode) {
      setStatus("error");
      setMessage("Please select a file and enter the passcode.");
      return;
    }

    try {
      setStatus("loading");
      setMessage("");

      const text = await file.text();
      let dataset;

      try {
        dataset = JSON.parse(text);
      } catch {
        setStatus("error");
        setMessage("The selected file is not valid JSON.");
        return;
      }

      // Client-side structure pre-check
      const clientError = clientValidate(dataset);
      if (clientError) {
        setStatus("error");
        setMessage(`Invalid dataset structure: ${clientError}`);
        return;
      }

      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode, dataset }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error || "Upload failed.");
      } else {
        setStatus("success");
        setMessage(data.message || "Dataset added successfully.");
        setFile(null);
        setPasscode("");

        // Refresh manifest to show new entry in the selector
        fetch("/api/manifest")
          .then((res) => res.json())
          .then((data) => setManifest(data.datasets || []))
          .catch(() => {});
      }
    } catch (err) {
      setStatus("error");
      setMessage("Unexpected error. Please try again.");
    }
  }

  return (
    <div className="max-w-lg mx-auto mt-10 space-y-8">

      {/* Dataset Selector */}
      <div>
        <h2 className="text-xl font-semibold text-ink mb-1">Active Dataset</h2>
        <p className="text-sm text-muted mb-4">
          Select which dataset powers the Overview, charts, and assistant.
        </p>
        <div className="rounded-xl bg-white p-6 shadow-sm">
          {manifestLoading && (
            <p className="text-sm text-muted">Loading dataset list...</p>
          )}
          {manifestError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2.5">{manifestError}</p>
          )}
          {!manifestLoading && !manifestError && manifest.length === 0 && (
            <p className="text-sm text-muted">No datasets uploaded yet. Upload one below.</p>
          )}
          {!manifestLoading && manifest.length > 0 && (
            <div className="flex flex-col gap-3">
              <label className="block text-sm font-medium text-ink">Select dataset</label>
              <select
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition bg-white"
                value={selectedBlobName || ""}
                onChange={(e) => handleSelectDataset(e.target.value)}
                disabled={switchingDataset}
              >
                <option value="" disabled>-- Choose a dataset --</option>
                {manifest.map((entry) => (
                  <option key={entry.id} value={entry.blobName}>
                    {entry.label}
                  </option>
                ))}
              </select>
              {switchingDataset && (
                <p className="text-sm text-muted">Switching dataset...</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Upload Section */}
      <div>
        <h2 className="text-xl font-semibold text-ink mb-1">Upload Dataset</h2>
        <p className="text-sm text-muted mb-4">
          Upload a new <code className="font-mono text-accent">dataset_context.json</code>. It will be added to the selector above — it won't auto-activate.
        </p>
        <div className="rounded-xl bg-white p-6 shadow-sm flex flex-col gap-5">
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">JSON File</label>
          <label className="flex items-center gap-3 cursor-pointer w-full border border-gray-200 rounded-lg px-4 py-2.5 hover:border-accent transition-colors">
            <span className="bg-accent text-white text-xs font-medium rounded px-3 py-1 shrink-0">
              Choose File
            </span>
            <span className="text-sm text-muted truncate">
              {file ? file.name : "No file chosen"}
            </span>
            <input
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setStatus(null);
                setMessage("");
              }}
            />
          </label>
        </div>

        {/* Passcode */}
        <div>
          <label className="block text-sm font-medium text-ink mb-1.5">Passcode</label>
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="Enter upload passcode"
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition"
          />
        </div>

        {/* Upload button */}
        <button
          onClick={handleUpload}
          disabled={status === "loading"}
          className="w-full bg-accent hover:opacity-90 disabled:opacity-50 text-white text-sm font-semibold rounded-lg px-4 py-2.5 transition-opacity"
        >
          {status === "loading" ? "Uploading..." : "Upload Dataset"}
        </button>

        {/* Status message */}
        {status === "success" && (
          <p className="text-sm text-green-600 bg-green-50 rounded-lg px-4 py-2.5">{message}</p>
        )}
        {status === "error" && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2.5">{message}</p>
        )}
        </div>
      </div>
    </div>
  );
}
