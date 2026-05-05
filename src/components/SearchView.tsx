import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { Capture, MapData } from '../types';
import { getAllCaptures, getAllMaps } from '../services/db';
import NoteCard from './NoteCard';
import PhotoCard from './PhotoCard';
import VoiceCard from './VoiceCard';
import VideoCard from './VideoCard';

interface SearchViewProps {
  onCaptureClick: (capture: Capture) => void;
  onCaptureEdit: (capture: Capture) => void;
}

export default function SearchView({ onCaptureClick, onCaptureEdit }: SearchViewProps) {
  const [query, setQuery] = useState('');
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [maps, setMaps] = useState<MapData[]>([]);

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
  }, []);

  const getMapName = (mapId: string) => {
    if (mapId === 'unassigned') return 'Unassigned';
    return maps.find(m => m.id === mapId)?.name || 'Deleted Map';
  };

  const filtered = captures.filter(c => {
    const searchStr = `${c.title} ${c.content} ${c.description || ''}`.toLowerCase();
    return searchStr.includes(query.toLowerCase());
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-text pointer-events-none">
          <Search size={18} />
        </div>
        <input 
          type="search" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, description or content..." 
          className="w-full bg-[#141414] border border-[#222] rounded-[20px] py-4 pl-12 pr-4 text-white placeholder-muted-text focus:outline-none focus:border-accent transition-colors"
        />
      </div>

      <div className="flex flex-col gap-4">
        {query && (
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest">
              Search Results ({filtered.length})
            </span>
          </div>
        )}

        <div className="space-y-4">
          {filtered.map((capture) => {
            const dateStr = new Date(capture.timestamp).toLocaleDateString();
            
            if (capture.type === 'note') {
              return (
                <NoteCard 
                  key={capture.id}
                  title={capture.title}
                  preview={capture.content}
                  timestamp={dateStr}
                  mapName={getMapName(capture.mapId)}
                  onClick={() => onCaptureClick(capture)}
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
                  caption={capture.description || "Photo"}
                  timestamp={dateStr}
                  mapName={getMapName(capture.mapId)}
                  hasVoice={!!capture.audioContent}
                  onClick={() => onCaptureClick(capture)}
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
                  caption={capture.description || "Video"}
                  timestamp={dateStr}
                  mapName={getMapName(capture.mapId)}
                  onClick={() => onCaptureClick(capture)}
                  onEdit={() => onCaptureEdit(capture)}
                />
              );
            }
            
            if (capture.type === 'voice') {
              return (
                <VoiceCard 
                  key={capture.id}
                  title={capture.title}
                  duration="Voice Memo"
                  timestamp={dateStr}
                  mapName={getMapName(capture.mapId)}
                  audioContent={capture.audioContent}
                  onClick={() => onCaptureClick(capture)}
                  onEdit={() => onCaptureEdit(capture)}
                />
              );
            }

            return null;
          })}

          {query && filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-text text-sm italic">No entries found matching "{query}"</p>
            </div>
          )}

          {!query && captures.length > 0 && (
            <div className="text-center py-6">
              <p className="text-muted-text text-[10px] uppercase font-bold tracking-widest opacity-40">Start typing to search</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
