import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Music2, Zap, Brain, Shield, ArrowRight, Check } from 'lucide-react';
import Navbar from '../components/Navbar';

const features = [
  { icon: Music2, title: 'Song Identification', desc: 'Powered by ACRCloud fingerprinting — identify any song in seconds from a snippet.' },
  { icon: Brain, title: 'AI Audio Analysis', desc: 'Deep analysis with librosa and YAMNet: BPM, mood, energy, key, spectral features.' },
  { icon: Zap, title: 'SaaS API', desc: 'Full REST API with rate-limited plans. Integrate into your apps with API keys.' },
  { icon: Shield, title: 'Enterprise Grade', desc: 'JWT auth, tenant isolation, Redis caching, BullMQ queue, S3 storage — production-ready.' },
];

const stats = [
  { value: '< 5s', label: 'Avg analysis time' },
  { value: '99.9%', label: 'API uptime' },
  { value: '50M+', label: 'Songs in database' },
  { value: '13', label: 'Audio features extracted' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-dark-900">
      <Navbar />

      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-radial from-brand-600/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="badge bg-brand-600/20 text-brand-400 border border-brand-600/30 mb-6 inline-flex">
              AI-Powered Music Intelligence
            </span>
            <h1 className="text-6xl md:text-7xl font-extrabold mb-6 tracking-tight">
              Identify. Analyze.
              <br />
              <span className="text-brand-400">Understand</span> Music.
            </h1>
            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Upload any audio. Beatzy identifies the song and performs deep AI analysis —
              BPM, mood, energy, audio events — in seconds.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Link to="/register" className="btn-primary flex items-center gap-2 text-lg px-8 py-4">
                Start for free <ArrowRight size={20} />
              </Link>
              <Link to="/pricing" className="btn-secondary flex items-center gap-2 text-lg px-8 py-4">
                View plans
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-12 border-y border-dark-700">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-4xl font-extrabold text-brand-400 mb-2">{value}</p>
              <p className="text-gray-400 text-sm">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-4">Everything you need</h2>
          <p className="text-gray-400 text-center mb-16 max-w-xl mx-auto">
            A complete music intelligence platform built for developers and audio professionals.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card hover:border-brand-600/40 transition-colors group">
                <div className="w-12 h-12 bg-brand-600/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-600/30 transition-colors">
                  <Icon size={24} className="text-brand-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{title}</h3>
                <p className="text-gray-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 px-6 bg-dark-800">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-gray-400 mb-10">Free tier includes 100 analyses per month. No credit card required.</p>
          <Link to="/register" className="btn-primary text-lg px-10 py-4 inline-flex items-center gap-2">
            Create free account <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      <footer className="py-8 border-t border-dark-700 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Music2 size={16} className="text-brand-400" />
            <span>Beatzy © 2025</span>
          </div>
          <div className="flex gap-6">
            <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            <a href="https://github.com/aayush2724/Beatzy" className="hover:text-white transition-colors">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
