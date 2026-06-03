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
        'relative overflow-hidden group cursor-pointer rounded-3xl border backdrop-blur-2xl p-16 md:p-24 transition-all duration-500 ease-out shadow-2xl',
        isDragActive && !isDragReject ? 'scale-105 border-white/40 bg-white/10 shadow-white/10' : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 hover:scale-[1.02]',
        isDragReject && 'border-red-500/50 bg-red-500/10',
        disabled && 'opacity-50 pointer-events-none'
      )}
    >
      {/* Subtle internal hover glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-transparent to-white/0 group-hover:from-white/5 group-hover:to-transparent transition-all duration-700" />
      
      <input {...getInputProps()} />
      
      <div className="relative z-10 flex flex-col items-center text-center gap-6">
        {/* Massive Icon Container */}
        <div className={clsx(
          'w-28 h-28 rounded-full border flex items-center justify-center transition-transform duration-500',
          isDragActive && !isDragReject ? 'bg-white/20 border-white/50 scale-110' : 'bg-white/5 border-white/10 group-hover:scale-110',
          isDragReject && 'bg-red-500/20 border-red-500/50'
        )}>
          {isDragReject ? (
            <AlertCircle size={48} className="text-red-400" />
          ) : isDragActive ? (
            <Music size={48} className="text-white animate-pulse" />
          ) : (
            <Upload size={48} className="text-gray-300 group-hover:text-white transition-colors" />
          )}
        </div>

        <div>
          <h3 className="font-headline text-3xl md:text-4xl font-semibold text-white mb-3 tracking-tight">
            {isDragReject ? 'Unsupported Audio Format' : isDragActive ? 'Drop track to analyze' : 'Drag & Drop your track'}
          </h3>
          <p className="text-gray-400 text-lg font-light">
            or <span className="text-white underline decoration-white/30 underline-offset-4 hover:decoration-white transition-all">browse files</span>
          </p>
          {rejected && <p className="text-red-400 text-sm mt-4 font-mono">{rejected}</p>}
        </div>

        {/* Format Badges */}
        <div className="flex flex-wrap justify-center gap-3 mt-4">
          {['WAV', 'MP3', 'FLAC', 'OGG'].map(ext => (
            <span key={ext} className="text-[10px] uppercase tracking-widest text-gray-400 border border-white/10 rounded-full px-4 py-1.5 bg-black/20">
              {ext}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

