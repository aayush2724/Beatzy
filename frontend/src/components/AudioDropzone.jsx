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
        'glass-card relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200',
        isDragActive && !isDragReject && 'border-sonic-lime bg-sonic-lime/5',
        isDragReject && 'border-red-500 bg-red-500/5',
        !isDragActive && !isDragReject && 'border-glass-border hover:border-sonic-lime/50 hover:bg-white/5',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center gap-4">
        <div className={clsx(
          'w-16 h-16 rounded-2xl flex items-center justify-center backdrop-blur-sm',
          isDragReject ? 'bg-red-500/20' : 'bg-sonic-lime/10 border border-sonic-lime/30'
        )}>
          {isDragReject
            ? <AlertCircle size={32} className="text-red-400" />
            : isDragActive
            ? <Music size={32} className="text-sonic-lime animate-bounce" />
            : <Upload size={32} className="text-sonic-lime" />}
        </div>
        <div>
          <p className="text-lg font-semibold mb-1 text-on-surface">
            {isDragActive ? 'Drop it here!' : 'Drop your audio file'}
          </p>
          <p className="text-on-surface-variant text-sm">or click to browse</p>
          <p className="text-outline text-xs mt-2">MP3, WAV, FLAC, OGG, M4A · Max 50MB</p>
        </div>
        {rejected && (
          <p className="text-red-400 text-sm">{rejected}</p>
        )}
      </div>
    </div>
  );
}
