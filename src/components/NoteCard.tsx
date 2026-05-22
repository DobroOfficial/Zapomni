import React from 'react';
import { PenTool, Calendar } from 'lucide-react';
import { useLongPress } from '../hooks/useLongPress';
import { useLanguage } from '../contexts/LanguageContext';

export interface NoteCardProps {
  key?: any;
  title: string;
  preview: string;
  timestamp: string;
  mapName: string;
  onClick?: () => void;
  onEdit?: () => void;
  reminderDate?: number;
}

export default function NoteCard({ title, preview, timestamp, mapName, onClick, onEdit, reminderDate }: NoteCardProps) {
  const { t } = useLanguage();
  const longPressProps = useLongPress({
    onLongPress: () => onEdit?.(),
    onClick: onClick
  });

  return (
    <div 
      {...longPressProps}
      className="bg-note-card border border-note-border rounded-[18px] p-4 flex flex-col gap-3 cursor-pointer active:scale-[0.98] transition-transform"
    >
      <div className="flex justify-between items-center">
        <div className="bg-note-pill flex items-center gap-1.5 px-2 py-0.5 rounded-[99px] text-note-yellow text-[10px] font-semibold">
          <PenTool size={12} />
          {t('NOTE')}
        </div>
        <span className="text-muted-text text-[10px]">{timestamp}</span>
      </div>
      <div>
        <h3 className="font-sans font-bold text-sm text-text-main mb-1 tracking-tight">{title}</h3>
        <p className="text-preview-text text-[12px] line-clamp-2 leading-tight">{preview.replace(/<[^>]*>/g, '')}</p>
      </div>
      <div className="flex justify-between items-center">
        <div className="bg-note-pill inline-block w-fit px-2.5 py-1 rounded-[99px] text-note-yellow text-[10px] font-semibold">
          {mapName}
        </div>
        {reminderDate && (
          <div className="flex items-center gap-1.5 bg-accent/10 px-2 py-0.5 rounded-full text-accent text-[10px] font-semibold">
            <Calendar size={11} className="text-[#FFD000]" />
            <span>{new Date(reminderDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
          </div>
        )}
      </div>
    </div>
  );
}
