import React from 'react';
import { Camera, Mic } from 'lucide-react';
import { useLongPress } from '../hooks/useLongPress';
import { useLanguage } from '../contexts/LanguageContext';

export interface PhotoCardProps {
  key?: any;
  imageSrc: string;
  title: string;
  caption: string;
  timestamp: string;
  mapName: string;
  hasVoice?: boolean;
  onClick?: () => void;
  onEdit?: () => void;
}

export default function PhotoCard({ imageSrc, title, caption, timestamp, mapName, hasVoice, onClick, onEdit }: PhotoCardProps) {
  const { t } = useLanguage();
  const longPressProps = useLongPress({
    onLongPress: () => onEdit?.(),
    onClick: onClick
  });

  return (
    <div 
      {...longPressProps}
      className="bg-photo-card border-none rounded-[18px] overflow-hidden flex flex-col cursor-pointer active:scale-[0.98] transition-transform"
    >
      <img src={imageSrc} alt={title} className="w-full h-[108px] object-cover" />
      <div className="p-4 flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <div className="bg-photo-pill flex items-center gap-1.5 px-2 py-0.5 rounded-[99px] text-photo-amber text-[10px] font-semibold">
            <Camera size={12} />
            {t('PHOTO')}
          </div>
          <div className="flex items-center gap-2">
            {hasVoice && (
              <div className="w-5 h-5 rounded-full bg-voice-orange/20 text-voice-orange flex items-center justify-center">
                <Mic size={10} />
              </div>
            )}
            <span className="text-muted-text text-[10px]">{timestamp}</span>
          </div>
        </div>
        <div>
          <h3 className="font-sans font-bold text-sm text-text-main">{title}</h3>
          <p className="text-preview-text text-[11px]">{caption}</p>
        </div>
        <div className="bg-photo-pill inline-block w-fit px-2.5 py-1 rounded-[99px] text-photo-amber text-[10px] font-semibold">
          {mapName}
        </div>
      </div>
    </div>
  );
}
