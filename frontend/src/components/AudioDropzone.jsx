import { useDropzone } from 'react-dropzone';
import { Upload, Music, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

const ACCEPTED = {
  'audio/mpeg': ['.mp3'],
  'audio/wav': ['.wav'],
  'audio/ogg': ['.ogg'],
  'audio/flac': ['.flac'],
  'audio/mp4': ['.m4a'],
};

export default function AudioDropzone({ onFile, disabled }) {
  const { getRootProps, getInputProps, isDragActive, isDragReject, fileRejections } = useDropzone({
    accept: ACCEPTED,
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024,
    disabled,
    onDropAccepted: ([file]) => onFile(file),
  });

  const rejected = fileRejections[0]?.errors[0]?.message;

  return (
    <div
      {...getRootProps()}
      className={clsx(
        'relative overflow-hidden group cursor-pointer rounded-[2rem] border p-16 md:p-24 transition-all duration-500 ease-out shadow-2xl text-center',
        // Glassmorphism effects
        'backdrop-blur-xl bg-white/[0.02]', 
        isDragActive && !isDragReject 
          ? 'scale-[1.02] border-white/40 bg-white/[0.06] shadow-[0_0_50px_rgba(255,255,255,0.08)]' 
          : 'border-[#1A1410]/10 hover:bg-white/[0.04] hover:border-white/25 hover:scale-[1.01]',
        isDragReject && 'border-red-500/50 bg-red-500/10',
        disabled && 'opacity-50 pointer-events-none'
      )}
    >
      <input {...getInputProps()} />
      
      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Large Animated Icon */}
        <div className={clsx(
          'w-24 h-24 rounded-full border flex items-center justify-center transition-all duration-500',
          isDragActive && !isDragReject ? 'bg-white/10 border-white scale-110 shadow-[0_0_30px_rgba(255,255,255,0.15)]' : 'bg-white/5 border-[#1A1410]/10 group-hover:scale-110 group-hover:bg-white/10',
          isDragReject && 'bg-red-500/20 border-red-500/50'
        )}>
          {isDragReject ? (
            <AlertCircle size={40} className="text-red-400" />
          ) : isDragActive ? (
            <Music size={40} className="text-[#F5EFE7] animate-pulse" />
          ) : (
            <Upload size={40} className="text-gray-400 group-hover:text-[#F5EFE7] transition-colors" />
          )}
        </div>

        <div>
          <h3 className="font-headline text-3xl md:text-4xl font-semibold text-[#F5EFE7] mb-4 tracking-tight">
            {isDragReject ? 'Unsupported Format' : isDragActive ? 'Drop audio to extract' : 'Load Audio Signature'}
          </h3>
          <p className="text-gray-400 text-lg font-light">
            Drag & drop your file, or <span className="text-[#F5EFE7] underline decoration-white/30 underline-offset-4 hover:decoration-white transition-all">browse files</span>
          </p>
          {rejected && <p className="text-red-400 text-sm mt-4 font-mono">{rejected}</p>}
        </div>

        {/* Format Pills */}
        <div className="flex justify-center gap-3 mt-4">
          {['MP3', 'WAV', 'FLAC', 'OGG', 'M4A'].map(ext => (
            <span key={ext} className="text-[11px] font-mono text-gray-500 border border-[#1A1410]/10 rounded-md px-3 py-1 bg-[#2A1A15]/40">
              {ext}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

