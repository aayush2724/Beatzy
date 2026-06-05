import React from 'react';
import { motion } from 'framer-motion';

/**
 * UploadProgressBar
 *
 * Props:
 *  - progress: number (0-100) – current upload progress percentage.
 *  - status: string – current step ('uploading' | 'analyzing' | 'done').
 *  - fileName?: string – optional name of the file being uploaded.
 *
 * This component renders a glass‑panel styled bar that mirrors the visual language of the
 * existing Beatzy UI (glass panels and monochrome accents). It also shows
 * the file name and a textual percentage when a file is provided.
 */
export default function UploadProgressBar({ progress, status, fileName }) {
  // Determine label based on status
  const label =
    status === 'uploading'
      ? 'Transmitting Data'
      : status === 'analyzing'
      ? 'Synthesizing Signal'
      : status === 'done'
      ? 'Upload Complete'
      : '';

  return (
    <div className="mt-8 glass-panel rounded-lg p-5 border border-glass-border w-full">
      {/* Optional filename display */}
      {fileName && (
        <div className="flex justify-between text-xs mb-1.5 font-mono">
          <span className="text-on-surface-variant truncate max-w-sm uppercase tracking-wider">
            Sending: {fileName}
          </span>
          <span className="text-[#F5EFE7] font-bold">{Math.floor(progress)}%</span>
        </div>
      )}
      {/* Bar background */}
      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.2)] rounded-full"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>
      {/* Optional textual label */}
      {label && (
        <div className="mt-2 text-center text-xs text-on-surface-variant uppercase tracking-wider">
          {label}
        </div>
      )}
    </div>
  );
}
