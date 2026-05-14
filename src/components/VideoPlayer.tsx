import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, X, RefreshCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VideoPlayerProps {
  src: string;
  title?: string;
  previewMode?: boolean;
}

export default function VideoPlayer({ src, title, previewMode = false }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleProgress = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setProgress((current / total) * 100);
      setCurrentTime(current);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const seekTime = (Number(e.target.value) / 100) * videoRef.current.duration;
      videoRef.current.currentTime = seekTime;
      setProgress(Number(e.target.value));
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleUserInteraction = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  const videoContainerClasses = isFullScreen 
    ? "fixed inset-0 z-[500] bg-black flex items-center justify-center" 
    : "relative w-full rounded-[24px] overflow-hidden border border-[#222] bg-black group transition-all";

  return (
    <div 
      className={videoContainerClasses}
      onMouseMove={handleUserInteraction}
      onClick={() => setIsFullScreen(!isFullScreen)}
    >
      <video
        ref={videoRef}
        src={`${src}#t=0.001`}
        playsInline
        onTimeUpdate={handleProgress}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        className={`${isFullScreen ? 'max-w-full max-h-full' : 'w-full h-auto'} cursor-pointer`}
      />

      <AnimatePresence>
        {showControls && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 flex flex-col justify-between p-4 pointer-events-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar */}
            <div className="flex justify-between items-start pointer-events-auto">
              <div className="flex flex-col">
                {title && <span className="text-white font-bold text-sm drop-shadow-md">{title}</span>}
                <span className="text-accent text-[8px] font-mono tracking-widest uppercase">Signal Decrypted</span>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFullScreen(!isFullScreen);
                }}
                className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white/70 hover:text-white transition-colors"
              >
                {isFullScreen ? <X size={20} /> : <Maximize2 size={20} />}
              </button>
            </div>

            {/* Center Play Button (Large Overlay) */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.button
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileHover={{ scale: 1.1 }}
                  onClick={togglePlay}
                  className="pointer-events-auto w-20 h-20 bg-accent/20 backdrop-blur-xl border border-accent/30 rounded-full flex items-center justify-center text-accent shadow-[0_0_30px_rgba(255,208,0,0.3)]"
                >
                  <Play size={40} fill="currentColor" />
                </motion.button>
              </div>
            )}

            {/* Bottom Controls */}
            <div className="space-y-4 pointer-events-auto">
              {/* Progress Bar */}
              <div className="relative group/progress h-2 flex items-center">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={handleSeek}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute inset-0 w-full h-full opacity-0 z-20 cursor-pointer"
                />
                <div className="w-full h-1 bg-white/10 rounded-full relative overflow-hidden">
                  <div 
                    className="absolute top-0 left-0 h-full bg-accent shadow-[0_0_15px_rgba(255,208,0,0.6)]" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-4">
                  <button onClick={togglePlay} className="text-white hover:text-accent transition-colors">
                    {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                  </button>
                  <button onClick={toggleMute} className="text-white hover:text-accent transition-colors">
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                  </button>
                  <span className="text-[10px] font-mono text-white/70">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
                {!isFullScreen && (
                   <div className="text-[8px] font-bold text-accent/50 uppercase tracking-[0.2em]">Live Stream.v_01</div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid Pattern Overlay (Cyber Vibes) */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]" />
    </div>
  );
}
