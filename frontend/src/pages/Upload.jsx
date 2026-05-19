import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import AudioDropzone from '../components/AudioDropzone';
import WaveformVisualizer from '../components/WaveformVisualizer';
import { uploadAudio, pollForResults } from '../api/audio';

const STEPS = ['upload', 'uploading', 'analyzing', 'done'];

export default function Upload() {
  const [step, setStep] = useState('upload');
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [jobId, setJobId] = useState(null);
  const navigate = useNavigate();

  const handleFile = useCallback(async (f) => {
    setFile(f);
    setStep('uploading');
    try {
      const { data } = await uploadAudio(f, setProgress);
      const id = data.data.jobId;
      setJobId(id);
      setStep('analyzing');
      toast.success('Uploaded! Analyzing your audio...');
      await pollForResults(id);
      setStep('done');
      setTimeout(() => navigate(`/results/${id}`), 1200);
    } catch (err) {
      toast.error(err.message || 'Upload failed');
      setStep('upload');
      setFile(null);
      setProgress(0);
    }
  }, [navigate]);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Analyze Audio</h1>
      <p className="text-gray-400 mb-8">Upload an audio file to identify the song and get deep AI insights.</p>

      <AnimatePresence mode="wait">
        {step === 'upload' && (
          <motion.div key="upload" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <AudioDropzone onFile={handleFile} />
          </motion.div>
        )}

        {step === 'uploading' && (
          <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
            {file && <WaveformVisualizer file={file} />}
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Uploading {file?.name}</span>
                <span className="font-mono text-brand-400">{progress}%</span>
              </div>
              <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-brand-600 rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {step === 'analyzing' && (
          <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card text-center py-12">
            <Loader2 size={48} className="text-brand-400 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Analyzing your audio</h2>
            <p className="text-gray-400 text-sm">Running ACRCloud identification, librosa analysis, and YAMNet classification...</p>
            <div className="mt-6 space-y-2 text-left max-w-xs mx-auto">
              {['Song identification (ACRCloud)', 'Tempo & spectral features (librosa)', 'Audio event classification (YAMNet)'].map((task) => (
                <div key={task} className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 size={14} className="text-brand-400 animate-spin shrink-0" />
                  {task}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {step === 'done' && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="card text-center py-12">
            <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Analysis complete!</h2>
            <p className="text-gray-400">Redirecting to results...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
