"use client";

import React, { useRef, useState, useCallback } from "react";
import { track } from "@/lib/analytics";

interface VideoDownloadProps {
  targetRef: React.RefObject<HTMLElement | null>;
  fileName: string;
  compact?: boolean;
}

export default function VideoDownload({ targetRef, fileName, compact }: VideoDownloadProps) {
  const [recording, setRecording] = useState(false);
  const [progress, setProgress] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    const target = targetRef.current;
    if (!target || recording) return;

    try {
      setRecording(true);
      setProgress(0);
      chunksRef.current = [];

      // Use canvas-based recording approach
      const canvas = document.createElement("canvas");
      const rect = target.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      const ctx = canvas.getContext("2d")!;

      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
          ? "video/webm;codecs=vp9"
          : "video/webm",
      });
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileName}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setRecording(false);
        setProgress(0);
        track("video_downloaded", { fileName });
      };

      recorder.start(100);

      // Capture frames using html2canvas-style approach
      const { default: htmlToImage } = await import("html-to-image");
      const duration = 12000; // 12 seconds of recording
      const fps = 15;
      const totalFrames = (duration / 1000) * fps;
      let frame = 0;

      const captureFrame = async () => {
        if (frame >= totalFrames || !recorderRef.current || recorderRef.current.state !== "recording") {
          recorder.stop();
          return;
        }

        try {
          const dataUrl = await htmlToImage.toPng(target, {
            pixelRatio: 2,
            skipFonts: true,
          });

          const img = new Image();
          img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            frame++;
            setProgress(Math.round((frame / totalFrames) * 100));
            setTimeout(captureFrame, 1000 / fps);
          };
          img.src = dataUrl;
        } catch {
          frame++;
          setTimeout(captureFrame, 1000 / fps);
        }
      };

      captureFrame();
    } catch {
      setRecording(false);
      setProgress(0);
    }
  }, [targetRef, fileName, recording]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state === "recording") {
      recorderRef.current.stop();
    }
  }, []);

  if (compact) {
    return (
      <button
        onClick={recording ? stopRecording : startRecording}
        disabled={false}
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg hover:bg-white/10 text-[14px] text-white/80 disabled:opacity-50"
        title={recording ? "Stop recording" : "Record demo video"}
      >
        {recording ? (
          <>
            <span className="w-3 h-3 rounded-sm bg-red-500 animate-pulse" />
            {progress}%
          </>
        ) : (
          <>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
            Video
          </>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={recording ? stopRecording : startRecording}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13.5px] font-medium transition"
      style={{
        background: recording ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)",
        border: recording ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(255,255,255,0.1)",
        color: recording ? "#fca5a5" : "rgba(255,255,255,0.8)",
      }}
    >
      {recording ? (
        <>
          <span className="w-3 h-3 rounded-sm bg-red-500 animate-pulse" />
          Recording... {progress}% — tap to stop
        </>
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          </svg>
          Download Video Demo
        </>
      )}
    </button>
  );
}
