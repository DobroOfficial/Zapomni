import { useState, useEffect } from 'react';
import NoteCard from './NoteCard';
import PhotoCard from './PhotoCard';
import VoiceCard from './VoiceCard';
import VideoCard from './VideoCard';
import { Capture, CaptureType, MapData } from '../types';
import { getAllCaptures, getAllMaps } from '../services/db';
import { useLanguage } from '../contexts/LanguageContext';

interface HomeViewProps {
  onCaptureClick: (capture: Capture) => void;
  onCaptureEdit: (capture: Capture) => void;
  refreshTrigger: number;
}

export default function HomeView({ onCaptureClick, onCaptureEdit, refreshTrigger }: HomeViewProps) {
  const { t } = useLanguage();
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [maps, setMaps] = useState<MapData[]>([]);
  const [filter, setFilter] = useState<CaptureType | 'all'>('all');

  const handleFilter = (newFilter: CaptureType | 'all') => {
    if (newFilter === 'all') {
      setFilter('all');
    } else {
      setFilter(filter === newFilter ? 'all' : newFilter);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const [captureData, mapData] = await Promise.all([
        getAllCaptures(),
        getAllMaps()
      ]);
      setCaptures(captureData.sort((a, b) => b.timestamp - a.timestamp));
      setMaps(mapData);
    };
    fetchData();
  }, [refreshTrigger]);

  const getMapName = (mapId: string) => {
    if (mapId === 'unassigned') return t('Unassigned');
    return maps.find(m => m.id === mapId)?.name || 'Deleted Map';
  };

  const filteredCaptures = filter === 'all' 
    ? captures 
    : captures.filter(c => c.type === filter);
    
  const stats = {
    note: captures.filter(c => c.type === 'note').length,
    photo: captures.filter(c => c.type === 'photo').length,
    voice: captures.filter(c => c.type === 'voice').length,
    video: captures.filter(c => c.type === 'video').length,
  };

  if (captures.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-6">
        <h2 className="text-lg font-bold text-white mb-2">{t('No reminders yet')}</h2>
        <p className="text-muted-text text-sm">{t('Tap the + button below to add your first note or reminder.')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-20">
      {/* Stats row */}
      <div className="flex gap-2">
        <button 
          onClick={() => handleFilter('note')}
          className={`flex-1 ${filter === 'note' ? 'bg-note-pill text-note-yellow ring-1 ring-note-yellow/30' : (stats.note > 0 ? 'bg-note-pill/40 text-note-yellow' : 'bg-[#141414] text-muted-text')} text-center py-2 rounded-[99px] text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95`}
        >
          {stats.note} Notes
        </button>
        <button 
          onClick={() => handleFilter('photo')}
          className={`flex-1 ${filter === 'photo' ? 'bg-photo-pill text-photo-amber ring-1 ring-photo-amber/30' : (stats.photo > 0 ? 'bg-photo-pill/40 text-photo-amber' : 'bg-[#141414] text-muted-text')} text-center py-2 rounded-[99px] text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95`}
        >
          {stats.photo} Photos
        </button>
        <button 
          onClick={() => handleFilter('voice')}
          className={`flex-1 ${filter === 'voice' ? 'bg-voice-pill text-voice-orange ring-1 ring-voice-orange/30' : (stats.voice > 0 ? 'bg-voice-pill/40 text-voice-orange' : 'bg-[#141414] text-muted-text')} text-center py-2 rounded-[99px] text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95`}
        >
          {stats.voice} Voices
        </button>
        <button 
          onClick={() => handleFilter('video')}
          className={`flex-1 ${filter === 'video' ? 'bg-accent/20 text-accent ring-1 ring-accent/30' : (stats.video > 0 ? 'bg-accent/10 text-accent' : 'bg-[#141414] text-muted-text')} text-center py-2 rounded-[99px] text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95`}
        >
          {stats.video} Videos
        </button>
      </div>
      
      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 custom-scrollbar">
        <button 
          onClick={() => handleFilter('all')}
          className={`flex-shrink-0 px-5 py-1.5 rounded-[99px] text-[10px] font-bold uppercase transition-colors ${filter === 'all' ? 'bg-accent text-black' : 'bg-[#141414] text-muted-text'}`}
        >
          {t('All')}
        </button>
        <button 
          onClick={() => handleFilter('note')}
          className={`flex-shrink-0 px-5 py-1.5 rounded-[99px] text-[10px] font-bold uppercase transition-colors ${filter === 'note' ? 'bg-note-pill text-note-yellow' : 'bg-[#141414] text-muted-text'}`}
        >
          {t('Notes')}
        </button>
        <button 
          onClick={() => handleFilter('photo')}
          className={`flex-shrink-0 px-5 py-1.5 rounded-[99px] text-[10px] font-bold uppercase transition-colors ${filter === 'photo' ? 'bg-photo-pill text-photo-amber' : 'bg-[#141414] text-muted-text'}`}
        >
          {t('Photos')}
        </button>
        <button 
          onClick={() => handleFilter('voice')}
          className={`flex-shrink-0 px-5 py-1.5 rounded-[99px] text-[10px] font-bold uppercase transition-colors ${filter === 'voice' ? 'bg-voice-pill text-voice-orange' : 'bg-[#141414] text-muted-text'}`}
        >
          {t('Voices')}
        </button>
        <button 
          onClick={() => handleFilter('video')}
          className={`flex-shrink-0 px-5 py-1.5 rounded-[99px] text-[10px] font-bold uppercase transition-colors ${filter === 'video' ? 'bg-accent/20 text-accent' : 'bg-[#141414] text-muted-text'}`}
        >
          {t('Videos')}
        </button>
      </div>

      <div className="flex flex-col gap-4">
        {filteredCaptures.map((capture) => {
          const dateStr = new Date(capture.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          
          if (capture.type === 'note') {
            return (
              <NoteCard 
                key={capture.id}
                title={capture.title}
                preview={capture.content}
                timestamp={dateStr}
                mapName={getMapName(capture.mapId)}
                onClick={() => {
                  onCaptureClick(capture);
                }}
                onEdit={() => onCaptureEdit(capture)}
              />
            );
          }
          if (capture.type === 'photo') {
            return (
              <PhotoCard 
                key={capture.id}
                imageSrc={capture.content || 'https://via.placeholder.com/400x200?text=Image+Unavailable'}
                title={capture.title}
                caption={capture.description || t('Photo')}
                timestamp={dateStr}
                mapName={getMapName(capture.mapId)}
                hasVoice={!!capture.audioContent}
                onClick={() => {
                  onCaptureClick(capture);
                }}
                onEdit={() => onCaptureEdit(capture)}
              />
            );
          }
          if (capture.type === 'video') {
            return (
              <VideoCard 
                key={capture.id}
                videoSrc={capture.content}
                title={capture.title}
                caption={capture.description || t('Video')}
                timestamp={dateStr}
                mapName={getMapName(capture.mapId)}
                onClick={() => {
                  onCaptureClick(capture);
                }}
                onEdit={() => onCaptureEdit(capture)}
              />
            );
          }
          if (capture.type === 'voice') {
            return (
              <VoiceCard 
                key={capture.id}
                title={capture.title}
                duration={t('Voice Memo')}
                timestamp={dateStr}
                mapName={getMapName(capture.mapId)}
                audioContent={capture.audioContent}
                onClick={() => {
                  onCaptureClick(capture);
                }}
                onEdit={() => onCaptureEdit(capture)}
              />
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

