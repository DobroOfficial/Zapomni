import React, { useState, useRef } from 'react';
import { Mic, Play } from 'lucide-react';
import { motion } from 'motion/react';
import { useLongPress } from '../hooks/useLongPress';
import { useLanguage } from '../contexts/LanguageContext';

export interface VoiceCardProps {
  key?: any;
  title: string;
  duration: string;
  timestamp: string;
  mapName: string;
  audioContent?: string;
  onClick?: () => void;
  onEdit?: () => void;
}

export default function VoiceCard({ title, duration, timestamp, mapName, audioContent, onClick, onEdit }: VoiceCardProps) {
  const { t } = useLanguage();
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const longPressProps = useLongPress({
    onLongPress: () => onEdit?.(),
    onClick: onClick
  });

  const playAudio = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (audioContent) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const audio = new Audio(audioContent);
      audioRef.current = audio;
      setIsPlaying(true);
      audio.play();
      audio.onended = () => setIsPlaying(false);
    }
  };
  return (
    <div 
      {...longPressProps}
      className="bg-voice-card border border-voice-border rounded-[18px] p-4 flex flex-col gap-3 cursor-pointer active:scale-[0.98] transition-transform"
    >
      <div className="flex justify-between items-center">
        <div className="bg-voice-pill flex items-center gap-1.5 px-2 py-0.5 rounded-[99px] text-voice-orange text-[10px] font-semibold">
          <Mic size={12} />
          {t('VOICE')}
        </div>
        <span className="text-muted-text text-[10px]">{timestamp}</span>
      </div>
      
      <div className="px-1">
        <h3 className="text-text-main font-bold text-sm mb-1 truncate">{title}</h3>
      </div>
      
      {/* Waveform placeholder */}
      <div className="flex items-end gap-[2px] h-8 justify-center">
        {[...Array(20)].map((_, i) => (
          <motion.div 
            key={i} 
            className={`w-1 rounded-full ${isPlaying ? 'bg-voice-orange' : 'bg-voice-orange opacity-60'}`}
            animate={isPlaying ? {
              height: [`${Math.random() * 40 + 20}%`, `${Math.random() * 60 + 40}%`, `${Math.random() * 40 + 20}%`]
            } : {
              height: `${Math.random() * 80 + 20}%`
            }}
            transition={isPlaying ? {
              repeat: Infinity,
              duration: 0.5 + Math.random() * 0.5,
              ease: "easeInOut"
            } : {}}
          />
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            <button 
                onClick={playAudio}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isPlaying ? 'bg-voice-orange shadow-[0_0_15px_rgba(255,163,26,0.6)]' : 'bg-voice-orange'
                }`}
            >
                {isPlaying ? (
                    <div className="flex gap-0.5 items-end h-3">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                animate={{ height: [4, 10, 4] }}
                                transition={{ repeat: Infinity, duration: 0.5 + i * 0.1 }}
                                className="w-0.5 bg-black rounded-full"
                            />
                        ))}
                    </div>
                ) : (
                    <Play size={16} fill="black" stroke="black" />
                )}
            </button>
            <span className="text-text-main text-xs font-medium">{isPlaying ? t('Playing...') : duration}</span>
        </div>
        <div className="bg-voice-pill inline-block px-2.5 py-1 rounded-[99px] text-voice-orange text-[10px] font-semibold">
          {mapName}
        </div>
      </div>
    </div>
  );
}
