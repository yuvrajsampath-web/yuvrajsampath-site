"use client";

import { useRef, useState } from "react";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase/client";
import { createWriting, deleteWriting, setNarration } from "@/lib/portal-data";
import { audioContentType } from "@/lib/audio";
import type { Narration, Writing } from "@/lib/types";

const MIME_EXTENSIONS: Record<string, string> = {
  "audio/webm": "webm",
  "audio/ogg": "ogg",
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
};

function extensionFor(mimeType: string) {
  const base = mimeType.split(";")[0].trim();
  return MIME_EXTENSIONS[base] ?? "webm";
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function NarrationItem({
  writing,
  narration,
  onChange,
}: {
  writing: Writing;
  narration?: Narration;
  onChange: () => void;
}) {
  const [recording, setRecording] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const recordedBlob = useRef<Blob | null>(null);

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunks.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: recorder.mimeType });
        recordedBlob.current = blob;
        setPreviewUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
      mediaRecorder.current = recorder;
      setRecording(true);
    } catch {
      setError("Couldn't access the microphone. Check browser permissions.");
    }
  }

  function stopRecording() {
    mediaRecorder.current?.stop();
    setRecording(false);
  }

  function discardPreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    recordedBlob.current = null;
  }

  async function saveRecording() {
    const blob = recordedBlob.current;
    if (!blob) return;
    setSaving(true);
    setError(null);
    try {
      const fileName = `narration-${writing.id}-${Date.now()}.${extensionFor(blob.type)}`;
      const path = `audio/${fileName}`;
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, blob, {
        contentType: audioContentType(fileName, blob.type),
      });
      const audioUrl = await getDownloadURL(storageRef);
      await setNarration(writing.id, {
        text: writing.body,
        sourcePublishedAt: writing.publishedAt,
        status: "recorded",
        audioUrl,
        createdAt: narration?.createdAt ?? new Date().toISOString(),
      });
      discardPreview();
      onChange();
    } catch {
      setError("Couldn't save the recording. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function approve() {
    if (!narration?.audioUrl) return;
    setSaving(true);
    setError(null);
    try {
      const publishedWritingId = await createWriting({
        category: "naganavai",
        body: writing.body,
        language: writing.language,
        audioUrl: narration.audioUrl,
        publishedAt: today(),
      });
      await setNarration(writing.id, { status: "approved", publishedWritingId });
      onChange();
    } catch {
      setError("Couldn't publish. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this குறிஞ்சிட்டு entry? This can't be undone.")) return;
    await deleteWriting(writing.id);
    onChange();
  }

  return (
    <li className="py-4 space-y-3">
      <div>
        <p className="text-xs uppercase tracking-wide text-muted">{writing.publishedAt}</p>
        <p className="font-tamil-body whitespace-pre-line">{writing.body}</p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex flex-wrap items-center gap-3 text-sm">
        {recording ? (
          <button
            onClick={stopRecording}
            className="text-red-500 hover:opacity-75 transition-opacity"
          >
            ● Stop recording
          </button>
        ) : previewUrl ? (
          <>
            <audio controls src={previewUrl} className="max-w-xs" />
            <button
              onClick={saveRecording}
              disabled={saving}
              className="text-amber hover:opacity-75 transition-opacity disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save recording"}
            </button>
            <button
              onClick={discardPreview}
              disabled={saving}
              className="text-muted hover:text-current transition-colors"
            >
              Discard
            </button>
          </>
        ) : narration?.status === "approved" ? (
          <a
            href={`/naganavai/${narration.publishedWritingId}`}
            target="_blank"
            rel="noreferrer"
            className="text-amber hover:opacity-75 transition-opacity"
          >
            ✓ Published as நாகணவாய் →
          </a>
        ) : narration?.status === "recorded" ? (
          <>
            <audio controls src={narration.audioUrl} className="max-w-xs" />
            <button
              onClick={approve}
              disabled={saving}
              className="text-amber hover:opacity-75 transition-opacity disabled:opacity-60"
            >
              Approve & publish
            </button>
            <button
              onClick={startRecording}
              disabled={saving}
              className="text-muted hover:text-current transition-colors"
            >
              Re-record
            </button>
          </>
        ) : (
          <button onClick={startRecording} className="text-amber hover:opacity-75 transition-opacity">
            Record voice note
          </button>
        )}

        <button
          onClick={handleDelete}
          className="ml-auto text-muted hover:text-red-500 transition-colors"
        >
          Delete
        </button>
      </div>
    </li>
  );
}
