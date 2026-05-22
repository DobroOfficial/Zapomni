import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowLeft, Trash2, MapPin, Play, Volume2, Maximize2, ChevronLeft, ChevronRight, PenTool } from 'lucide-react';
import { Capture, MapData } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useBackHandler } from '../hooks/useBackHandler';

import VideoPlayer from './VideoPlayer';

interface DetailViewProps {
  capture: Capture | null;
  maps: MapData[];
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (capture: Capture) => void;
  onEdit?: (capture: Capture) => void;
}

export default function DetailView({ capture, maps, onClose, onDelete, onUpdate, onEdit }: DetailViewProps) {
  const { t } = useLanguage();
  const [fullScreenImageIndex, setFullScreenImageIndex] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [audioToDelete, setAudioToDelete] = useState<number | 'main' | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  useBackHandler(fullScreenImageIndex !== null, () => setFullScreenImageIndex(null), 'detail-fullscreen');
  useBackHandler(isDeleting, () => setIsDeleting(false), 'detail-deleting');
  useBackHandler(audioToDelete !== null, () => setAudioToDelete(null), 'detail-deleting-audio');

  const allImages = useMemo(() => {
    if (!capture) return [];
    const images: string[] = [];
    if (capture.type === 'photo' && capture.content) {
      images.push(capture.content);
    }
    if (capture.additionalContents) {
      images.push(...capture.additionalContents.filter(c => c.startsWith('data:image/')));
    }
    return images;
  }, [capture]);

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const handleNoteClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (capture?.type !== 'note') return;
    const target = e.target as HTMLElement;
    if (target.classList.contains('checklist-box')) {
      if (target.innerText === '☐') {
        target.innerText = '☑';
      } else {
        target.innerText = '☐';
      }
      onUpdate({ ...capture, content: e.currentTarget.innerHTML });
    }
  };

  if (!capture) return null;

  const playAudio = () => {
    if (capture.audioContent) {
      const audio = new Audio(capture.audioContent);
      setIsPlaying(true);
      audio.play();
      audio.onended = () => setIsPlaying(false);
    }
  };

  const dateStr = new Date(capture.timestamp).toLocaleString();
  
  const mapName = capture.mapId === 'unassigned' 
    ? 'Unassigned' 
    : maps.find(m => m.id === capture.mapId)?.name || 'Deleted Map';

  return (
    <>
      <style>{`
        .editor-content h1 { font-size: 2rem; font-weight: 800; margin-top: 0.5em; margin-bottom: 0.25em; line-height: 1.2; }
        .editor-content h2 { font-size: 1.5rem; font-weight: 700; margin-top: 0.5em; margin-bottom: 0.25em; line-height: 1.3; }
        .editor-content ul { list-style-type: disc; padding-left: 1.5em; margin-top: 0.5em; margin-bottom: 0.5em; }
        .editor-content li { margin-bottom: 0.25em; }
        .checklist-box { font-family: monospace; font-size: 1.2em; display: inline-block; width: 1.2em; text-align: center; cursor: pointer; user-select: none; }
        .checklist-box:hover { color: #FFD000; }
      `}</style>
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] bg-page-bg flex flex-col"
    >
      <header className="h-16 flex items-center justify-between px-6 shrink-0">
        <button onClick={onClose} className="p-2 -ml-2 text-muted-text hover:text-white transition-colors">
          <ArrowLeft size={24} />
        </button>
        {capture.type !== 'note' && (
          <span className="text-[10px] font-bold tracking-widest text-muted-text uppercase">
            {t('Entry Details')}
          </span>
        )}
        <div className="flex items-center gap-2 -mr-2">
          {onEdit && (
            <button 
              onClick={() => {
                onClose();
                onEdit(capture);
              }} 
              className="p-2 text-muted-text hover:text-white transition-colors"
            >
              <PenTool size={20} />
            </button>
          )}
          <button 
            onClick={() => setIsDeleting(true)} 
            className="p-2 text-red-500/50 hover:text-red-500 transition-colors"
          >
            <Trash2 size={20} />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-24 flex flex-col overflow-x-hidden w-full max-w-full">
        {capture.type !== 'note' && (
          <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
            <div className={`
              px-3 py-1 rounded-[99px] text-[10px] font-bold
              ${capture.type === 'photo' ? 'bg-photo-pill text-photo-amber' : ''}
              ${capture.type === 'video' ? 'bg-accent/20 text-accent' : ''}
              ${capture.type === 'voice' ? 'bg-voice-pill text-voice-orange' : ''}
            `}>
              {capture.type.toUpperCase()}
            </div>
            <span className="text-muted-text text-[10px]">{dateStr}</span>
          </div>
        )}

        {capture.type === 'note' && (
          <div className="mb-6 mb-4 text-muted-text text-[12px] font-medium">
             {dateStr}
          </div>
        )}

        <h1 className={`${capture.type === 'note' ? 'text-[22px] font-bold tracking-tight mb-6 pb-4 border-b border-white/5 break-words overflow-wrap-normal' : 'text-2xl font-bold mb-4 break-words'}`}>
          {capture.title}
        </h1>

        {capture.type === 'photo' && (
            <div 
              className="mb-8 rounded-[24px] overflow-hidden border border-[#222] relative group cursor-pointer active:scale-[0.99] transition-transform w-full"
              onClick={() => setFullScreenImageIndex(allImages.indexOf(capture.content))}
            >
              <img src={capture.content} alt={capture.title} className="w-full h-auto" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="bg-black/40 backdrop-blur-md p-3 rounded-full text-white">
                  <Maximize2 size={24} />
                </div>
              </div>
            </div>
          )}

          {capture.type === 'video' && (
            <div className="mb-8 w-full border-b border-white/5 pb-8">
              <VideoPlayer src={capture.content} title={capture.title} />
            </div>
          )}

          <div 
            className={`${capture.type === 'note' ? 'text-[16px] leading-[1.6] text-white/90 flex-1 editor-content' : 'text-preview-text leading-[1.6] mb-8'} whitespace-pre-wrap break-words min-w-0 max-w-full`}
            style={{ wordWrap: 'break-word', overflowWrap: 'break-word' }}
          >
            {capture.type === 'note' ? (
              <div 
                dangerouslySetInnerHTML={{ __html: capture.content }} 
                onClick={handleNoteClick} 
                className="cursor-default"
              />
            ) : (capture.description || 'No description provided.')}
          </div>

          <div className={`${capture.type === 'note' ? 'mt-auto pt-6 border-t border-white/5' : 'pt-4 border-t border-white/5'}`}>
            {capture.audioContent && (
            <div className="mb-8 mt-4 p-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-[24px] flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <button 
                  onClick={playAudio}
                  className={`w-12 h-12 flex items-center justify-center rounded-full transition-all active:scale-95 ${
                    isPlaying ? 'bg-voice-orange shadow-[0_0_20px_rgba(255,163,26,0.4)]' : 'bg-[#2a2a2a] hover:bg-[#333]'
                  } ${isPlaying ? 'text-black' : 'text-white'}`}
                >
                  {isPlaying ? (
                    <div className="flex gap-1 items-center justify-center h-4 w-6">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ height: [4, 16, 4] }}
                          transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                          className="w-1 bg-black rounded-full"
                        />
                      ))}
                    </div>
                  ) : (
                    <Play size={20} fill="currentColor" className="ml-1" />
                  )}
                </button>
                <div>
                  <div className={`text-[12px] font-bold ${isPlaying ? 'text-voice-orange' : 'text-white'} mb-0.5`}>
                    {isPlaying ? 'Playing Voice Note...' : 'Voice Note'}
                  </div>
                  <div className="text-[11px] text-white/50">
                    Audio Attachment
                  </div>
                </div>
              </div>
              
              {(capture.type === 'note' || capture.type === 'photo') && (
                <button 
                  onClick={() => setAudioToDelete('main')}
                  className="w-10 h-10 flex items-center justify-center text-red-500/60 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all bg-[#0a0a0a]"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          )}

          {capture.additionalContents && capture.additionalContents.length > 0 && (
            <div className="mb-6 mt-4">
              <h3 className="text-[11px] font-bold text-white/40 tracking-widest uppercase mb-4 pl-1">Additional Media</h3>
              <div className="flex flex-col gap-4">
                {/* Images */}
                {capture.additionalContents.some(c => c.startsWith('data:image/')) && (
                  <div className="grid grid-cols-2 gap-3">
                    {capture.additionalContents.filter(c => c.startsWith('data:image/')).map((img, i) => (
                      <div 
                        key={i} 
                        className="rounded-[16px] overflow-hidden border border-[#2a2a2a] bg-[#1a1a1a] relative group cursor-pointer active:scale-[0.99] transition-transform w-[150px] sm:w-[160px] max-w-full"
                        onClick={() => setFullScreenImageIndex(allImages.indexOf(img))}
                      >
                        <img src={img} className="w-full h-[150px] object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="bg-black/50 backdrop-blur-md p-2 rounded-full text-white shadow-lg">
                            <Maximize2 size={18} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Videos */}
                {capture.additionalContents.some(c => c.startsWith('data:video/')) && (
                  <div className="flex flex-col gap-3">
                    {capture.additionalContents.filter(c => c.startsWith('data:video/')).map((vid, i) => (
                      <div key={i} className="rounded-[16px] overflow-hidden border border-[#2a2a2a]"><VideoPlayer src={vid} /></div>
                    ))}
                  </div>
                )}
                {/* Voices */}
                {capture.additionalContents.some(c => c.startsWith('data:audio/')) && (
                  <div className="flex flex-col gap-3">
                    {capture.additionalContents.map((audio, i) => audio.startsWith('data:audio/') ? (
                      <div key={i} className="p-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-[20px] flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <button 
                             onClick={() => {
                               const a = new Audio(audio);
                               a.play();
                             }}
                             className="w-10 h-10 flex items-center justify-center rounded-full bg-[#2a2a2a] hover:bg-[#333] text-white transition-all active:scale-95"
                           >
                             <Play size={18} fill="currentColor" className="ml-1" />
                           </button>
                           <div>
                             <div className="text-[12px] font-bold text-white mb-0.5">
                               Voice Memo
                             </div>
                           </div>
                         </div>
                         <button 
                           onClick={() => setAudioToDelete(i)}
                           className="w-10 h-10 flex items-center justify-center text-red-500/60 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all bg-[#0a0a0a]"
                         >
                           <Trash2 size={16} />
                         </button>
                      </div>
                    ) : null)}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-[#1a1a1a] border border-[#2a2a2a] p-4 rounded-[20px] flex items-center justify-between mt-4 shadow-sm">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-full bg-[#2a2a2a] flex items-center justify-center text-accent/80">
                 <MapPin size={22} />
               </div>
               <div>
                  <div className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-0.5">Category</div>
                  <div className="text-[14px] font-bold text-white">{mapName}</div>
               </div>
            </div>
          </div>
          </div>
        </div>
      </motion.div>

      {/* Full Screen Image Preview */}
      <AnimatePresence>
        {fullScreenImageIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setFullScreenImageIndex(null)}
          >
            {fullScreenImageIndex > 0 && (
              <button 
                onClick={(e) => { e.stopPropagation(); setFullScreenImageIndex(fullScreenImageIndex - 1); }}
                className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/80 rounded-full text-white flex items-center justify-center transition-colors z-10"
              >
                <ChevronLeft size={32} />
              </button>
            )}

            <motion.img
              key={fullScreenImageIndex}
              initial={{ scale: 0.9, opacity: 0, x: 20 }}
              animate={{ scale: 1, opacity: 1, x: 0 }}
              exit={{ scale: 0.9, opacity: 0, x: -20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              src={allImages[fullScreenImageIndex]}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl touch-none cursor-grab active:cursor-grabbing"
              alt={capture?.title || "Fullscreen Image"}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={1}
              onDragEnd={(_e, { offset, velocity }) => {
                const swipe = swipePower(offset.x, velocity.x);

                if (swipe < -swipeConfidenceThreshold) {
                  if (fullScreenImageIndex < allImages.length - 1) {
                    setFullScreenImageIndex(fullScreenImageIndex + 1);
                  }
                } else if (swipe > swipeConfidenceThreshold) {
                  if (fullScreenImageIndex > 0) {
                    setFullScreenImageIndex(fullScreenImageIndex - 1);
                  }
                }
              }}
              onClick={(e) => e.stopPropagation()}
            />

            {fullScreenImageIndex < allImages.length - 1 && (
              <button 
                onClick={(e) => { e.stopPropagation(); setFullScreenImageIndex(fullScreenImageIndex + 1); }}
                className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/50 hover:bg-black/80 rounded-full text-white flex items-center justify-center transition-colors z-10"
              >
                <ChevronRight size={32} />
              </button>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                setFullScreenImageIndex(null);
              }}
              className="absolute top-6 right-6 w-12 h-12 bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-full text-white/50 hover:text-white transition-all flex items-center justify-center border border-white/10 z-10"
            >
              <X size={28} />
            </button>
            
            {allImages.length > 1 && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-3 bg-black/50 rounded-full backdrop-blur-md">
                {allImages.map((_, i) => (
                  <div 
                    key={i} 
                    className={`transition-all rounded-full ${i === fullScreenImageIndex ? 'w-3 h-3 bg-white' : 'w-2 h-2 bg-white/30 cursor-pointer hover:bg-white/50'}`} 
                    onClick={(e) => {
                      e.stopPropagation();
                      setFullScreenImageIndex(i);
                    }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modals */}
      <AnimatePresence>
        {isDeleting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-nav-bg border border-[#222] rounded-[32px] p-8 w-full max-w-sm text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">{t('Delete Reminder?')}</h3>
              <p className="text-muted-text text-sm mb-8">{t('This reminder will be permanently deleted. This action is irreversible.')}</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setIsDeleting(false)}
                  className="flex-1 py-4 rounded-[16px] border border-[#222] font-bold text-[10px] uppercase tracking-widest text-[#666] active:scale-95 transition-transform"
                >
                  {t('Cancel')}
                </button>
                <button 
                  onClick={() => {
                    onDelete(capture.id);
                    onClose();
                    setIsDeleting(false);
                  }}
                  className="flex-1 py-4 rounded-[16px] bg-red-500 text-white font-bold text-[10px] uppercase tracking-widest active:scale-95 transition-transform shadow-[0_4px_15px_rgba(239,68,68,0.2)]"
                >
                  {t('Delete')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {audioToDelete !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-nav-bg border border-[#222] rounded-[32px] p-8 w-full max-w-sm text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold mb-2 text-white">{t('Remove Voice Memo?')}</h3>
              <p className="text-muted-text text-sm mb-8">{t('This voice memo will be permanently removed from this entry. This action cannot be undone.')}</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => setAudioToDelete(null)}
                  className="flex-1 py-4 rounded-[16px] border border-[#222] font-bold text-[10px] uppercase tracking-widest text-[#666] active:scale-95 transition-transform"
                >
                  {t('Cancel')}
                </button>
                <button 
                  onClick={() => {
                    if (capture && audioToDelete !== null) {
                      const updatedCapture = { ...capture };
                      if (audioToDelete === 'main') {
                        delete updatedCapture.audioContent;
                      } else if (typeof audioToDelete === 'number' && updatedCapture.additionalContents) {
                        updatedCapture.additionalContents = updatedCapture.additionalContents.filter((_, index) => index !== audioToDelete);
                      }
                      onUpdate(updatedCapture);
                    }
                    setAudioToDelete(null);
                  }}
                  className="flex-1 py-4 rounded-[16px] bg-red-500 text-white font-bold text-[10px] uppercase tracking-widest active:scale-95 transition-transform shadow-[0_4px_15px_rgba(239,68,68,0.2)]"
                >
                  {t('Remove')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
