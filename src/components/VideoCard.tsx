import React from 'react';
import { Video, Play } from 'lucide-react';
import { useLongPress } from '../hooks/useLongPress';
import { useLanguage } from '../contexts/LanguageContext';

export interface VideoCardProps {
  key?: any;
  videoSrc: string;
  title: string;
  caption: string;
  timestamp: string;
  mapName: string;
  onClick?: () => void;
  onEdit?: () => void;
}

export default function VideoCard({ videoSrc, title, caption, timestamp, mapName, onClick, onEdit }: VideoCardProps) {
  const { t } = useLanguage();
  const longPressProps = useLongPress({
    onLongPress: () => onEdit?.(),
    onClick: onClick
  });

  return (
    <div 
      {...longPressProps}
      className="bg-[#1C1C1C] border border-[#222] rounded-[18px] overflow-hidden flex flex-col cursor-pointer active:scale-[0.98] transition-transform"
    >
      <div className="relative w-full h-[108px] bg-black flex items-center justify-center">
        <video 
          src={videoSrc} 
          playsInline 
          muted 
          preload="metadata"
          className="w-full h-full object-cover opacity-60" 
        />
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-accent/20 backdrop-blur-md flex items-center justify-center text-accent border border-accent/30">
                <Play size={20} fill="currentColor" />
            </div>
        </div>
      </div>
      <div className="p-4 flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <div className="bg-accent/10 flex items-center gap-1.5 px-2 py-0.5 rounded-[99px] text-accent text-[10px] font-semibold">
            <Video size={12} />
            {t('VIDEO')}
          </div>
          <span className="text-muted-text text-[10px]">{timestamp}</span>
        </div>
        <div>
          <h3 className="font-sans font-bold text-sm text-white truncate">{title}</h3>
          <p className="text-preview-text text-[11px] truncate">{caption}</p>
        </div>
        <div className="bg-[#222] inline-block w-fit px-2.5 py-1 rounded-[99px] text-white/50 text-[10px] font-semibold">
          {mapName}
        </div>
      </div>
    </div>
  );
}
