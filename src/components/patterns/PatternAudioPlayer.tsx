import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, X, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { usePremium } from '../../context/PremiumContext';
import type { PatternAudioOverview } from '../../types/patterns';
import { sanitizeMediaUrl } from '../../lib/media/urlSafety';

interface PatternAudioPlayerProps {
  audioOverviews: PatternAudioOverview[];
  patternName: string;
  color: string;
}

export const PatternAudioPlayer: React.FC<PatternAudioPlayerProps> = ({
  audioOverviews,
  patternName,
  color,
}) => {
  const premium = usePremium();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPaywall, setShowPaywall] = useState(false);
  const [audioError, setAudioError] = useState(false);

  const currentAudio = audioOverviews[currentIndex];
  const safeSrc = sanitizeMediaUrl(currentAudio?.src || '');
  const hasValidAudio = audioOverviews.length > 0 && audioOverviews.some(a => sanitizeMediaUrl(a.src));

  useEffect(() => {
    if (!hasValidAudio) {
      setAudioError(true);
      return;
    }
    setAudioError(false);
    const audio = new Audio(safeSrc);
    audioRef.current = audio;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      setDuration(audio.duration || 0);
      if (audio.duration) setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentTime(0);
    });
    audio.addEventListener('error', () => {
      setAudioError(true);
      setIsPlaying(false);
    });

    const checkPreviewLimit = () => {
      if (!premium.isPremium && currentTime >= 30) {
        audio.pause();
        setIsPlaying(false);
        setShowPaywall(true);
      }
    };
    audio.addEventListener('timeupdate', checkPreviewLimit);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('timeupdate', checkPreviewLimit);
      audio.removeEventListener('error', () => {});
      audio.src = '';
    };
  }, [currentIndex, safeSrc, premium.isPremium, hasValidAudio]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio && hasValidAudio) {
      audio.src = safeSrc;
      audio.load();
      setCurrentTime(0);
      setIsPlaying(false);
      setAudioError(false);
    }
  }, [currentIndex, safeSrc, hasValidAudio]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !hasValidAudio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.currentTime = currentTime;
      audio.play().catch(e => console.error('Audio play failed:', e));
    }
    setIsPlaying(!isPlaying);
    setIsExpanded(true);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleClose = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      setIsPlaying(false);
    }
    setIsExpanded(false);
  };

  const nextTrack = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      setIsPlaying(false);
    }
    setCurrentIndex(i => (i + 1) % audioOverviews.length);
  };

  const prevTrack = () => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      setIsPlaying(false);
    }
    setCurrentIndex(i => (i - 1 + audioOverviews.length) % audioOverviews.length);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  useEffect(() => {
    if (showPaywall) {
      premium.setShowPaywall(true);
      setShowPaywall(false);
    }
  }, [showPaywall, premium.setShowPaywall]);

  if (!hasValidAudio) {
    return (
      <div className="w-full max-w-full">
        <p className="text-xs font-mono text-slate-400 uppercase tracking-widest mb-2">
          Audio Overview
        </p>
        <div className="flex flex-col items-center justify-center gap-2 p-4 text-center">
          <AlertCircle className="w-5 h-5 text-slate-500" />
          <p className="text-xs text-slate-400 font-sans">
            No audio overview is currently available for this pattern.
          </p>
        </div>
      </div>
    );
  }

  if (!isExpanded) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="fixed bottom-20 right-6 z-50"
      >
        <button
          onClick={togglePlay}
          className="w-12 h-12 rounded-full flex items-center justify-center border border-white/10 bg-black/80 backdrop-blur-sm shadow-lg hover:bg-white/10 transition-all cursor-pointer"
          style={{ color }}
          aria-label={`Play audio overview for ${patternName}`}
        >
          <Play className="w-5 h-5" />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className="fixed bottom-0 left-0 right-0 z-50 p-4"
    >
      <div
        className="rounded-xl border border-white/10 bg-black/80 backdrop-blur-sm shadow-2xl"
        style={{ borderColor: color + '20' }}
      >
        {audioError ? (
          <div className="p-3 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-slate-500 shrink-0" />
            <p className="text-xs text-slate-400 font-sans flex-1">
              This audio could not be loaded. The content may be unavailable.
            </p>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full flex items-center justify-center border border-white/5 hover:bg-white/5 transition-colors shrink-0"
              aria-label="Close audio player"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        ) : (
          <>
            <div className="p-3 flex items-center gap-3">
              {audioOverviews.length > 1 && (
                <button
                  onClick={prevTrack}
                  className="w-8 h-8 rounded-full flex items-center justify-center border border-white/5 hover:bg-white/5 transition-colors shrink-0"
                  aria-label="Previous track"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-400" />
                </button>
              )}

              <button
                onClick={togglePlay}
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: color + '20', color }}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>

              {audioOverviews.length > 1 && (
                <button
                  onClick={nextTrack}
                  className="w-8 h-8 rounded-full flex items-center justify-center border border-white/5 hover:bg-white/5 transition-colors shrink-0"
                  aria-label="Next track"
                >
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              )}

              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-mono text-slate-400 uppercase tracking-widest truncate">
                  {currentAudio.title || patternName} — Audio Overview
                </div>
              </div>

              <div className="text-[10px] font-mono text-slate-500 shrink-0">
                {formatTime(currentTime)} / {audioOverviews[currentIndex].duration || formatTime(duration)}
              </div>

              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full flex items-center justify-center border border-white/5 hover:bg-white/5 transition-colors shrink-0"
                aria-label="Close audio player"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            <div
              className="h-1 bg-white/5 cursor-pointer mx-3 mb-2 rounded-full"
              onClick={handleSeek}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%',
                  background: color,
                }}
              />
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
};
