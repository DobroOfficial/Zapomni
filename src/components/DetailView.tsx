import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ArrowLeft, Trash2, MapPin, Play, Volume2, Maximize2 } from 'lucide-react';
import { Capture, MapData } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

import VideoPlayer from './VideoPlayer';

interface DetailViewProps {
  capture: Capture | null;
  maps: MapData[];
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (capture: Capture) => void;
}

export default function DetailView({ capture, maps, onClose, onDelete, onUpdate }: DetailViewProps) {
  const { t } = useLanguage();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeletingAudio, setIsDeletingAudio] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
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
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] bg-page-bg flex flex-col"
    >
        <header className="h-16 flex items-center justify-between px-6 border-b border-[#222]">
          <button onClick={onClose} className="p-2 -ml-2 text-muted-text">
            <ArrowLeft size={24} />
          </button>
          <span className="text-[10px] font-bold tracking-widest text-muted-text uppercase">
            Entry Details
          </span>
          <button 
            onClick={() => setIsDeleting(true)} 
            className="p-2 -mr-2 text-red-500/50 hover:text-red-500"
          >
            <Trash2 size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className={`
              px-3 py-1 rounded-[99px] text-[10px] font-bold
              ${capture.type === 'note' ? 'bg-note-pill text-note-yellow' : ''}
              ${capture.type === 'photo' ? 'bg-photo-pill text-photo-amber' : ''}
              ${capture.type === 'video' ? 'bg-accent/20 text-accent' : ''}
              ${capture.type === 'voice' ? 'bg-voice-pill text-voice-orange' : ''}
            `}>
              {capture.type.toUpperCase()}
            </div>
            <span className="text-muted-text text-[10px]">{dateStr}</span>
          </div>

          <h1 className="text-2xl font-bold mb-4">{capture.title}</h1>

          {capture.type === 'photo' && (
            <div 
              className="mb-6 rounded-[24px] overflow-hidden border border-[#222] relative group cursor-pointer active:scale-[0.99] transition-transform"
              onClick={() => setIsFullScreen(true)}
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
            <div className="mb-6">
              <VideoPlayer src={capture.content} title={capture.title} />
            </div>
          )}

          <div className="text-preview-text leading-relaxed whitespace-pre-wrap mb-8">
            {capture.type === 'note' ? capture.content : (capture.description || 'No description provided.')}
          </div>

          {capture.audioContent && (
            <div className="mb-8 p-4 bg-voice-pill/20 border border-voice-border rounded-[20px] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={playAudio}
                  className={`w-12 h-12 flex items-center justify-center rounded-full transition-all active:scale-95 ${
                    isPlaying ? 'bg-voice-orange shadow-[0_0_20px_rgba(255,163,26,0.6)]' : 'bg-voice-orange'
                  } text-black`}
                >
                  {isPlaying ? (
                    <div className="flex gap-0.5 items-end h-4">
                      {[0, 1, 2, 3].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ height: [6, 18, 6] }}
                          transition={{ repeat: Infinity, duration: 0.5 + i * 0.1 }}
                          className="w-1 bg-black rounded-full"
                        />
                      ))}
                    </div>
                  ) : (
                    <Play size={24} fill="currentColor" />
                  )}
                </button>
                <div>
                  <div className="text-[10px] font-bold text-voice-orange uppercase tracking-widest">
                    {isPlaying ? 'Playing Audio' : 'Voice Note'}
                  </div>
                  <div className="text-xs text-muted-text">
                    {isPlaying ? 'Listening to playback...' : 'Click to play audio'}
                  </div>
                </div>
              </div>
              
              {(capture.type === 'note' || capture.type === 'photo') && (
                <button 
                  onClick={() => setIsDeletingAudio(true)}
                  className="p-3 text-red-500/40 hover:text-red-500 hover:bg-black/20 rounded-xl transition-all"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          )}

          <div className="bg-card-surface p-4 rounded-[20px] flex items-center justify-between">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-[#222] flex items-center justify-center text-accent">
                 <MapPin size={20} />
               </div>
               <div>
                  <div className="text-[10px] text-muted-text font-bold uppercase">Category</div>
                  <div className="text-sm font-bold">{mapName}</div>
               </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Full Screen Image Preview */}
      <AnimatePresence>
        {isFullScreen && capture?.type === 'photo' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setIsFullScreen(false)}
          >
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={capture.content}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              alt={capture.title}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsFullScreen(false);
              }}
              className="absolute top-6 right-6 w-12 h-12 bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-full text-white/50 hover:text-white transition-all flex items-center justify-center border border-white/10"
            >
              <X size={28} />
            </button>
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

        {isDeletingAudio && (
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
                  onClick={() => setIsDeletingAudio(false)}
                  className="flex-1 py-4 rounded-[16px] border border-[#222] font-bold text-[10px] uppercase tracking-widest text-[#666] active:scale-95 transition-transform"
                >
                  {t('Cancel')}
                </button>
                <button 
                  onClick={() => {
                    if (capture) {
                      const updatedCapture = { ...capture };
                      delete updatedCapture.audioContent;
                      onUpdate(updatedCapture);
                    }
                    setIsDeletingAudio(false);
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
