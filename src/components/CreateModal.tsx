import { useState, useRef, useEffect } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, PenTool, Camera, Mic, Check, Image as ImageIcon, RefreshCcw, Map as MapIcon, Play, Video, Calendar, Trash2 } from 'lucide-react';
import { Capture, CaptureType, MapData } from '../types';
import { getAllMaps } from '../services/db';
import VideoPlayer from './VideoPlayer';
import { useLanguage } from '../contexts/LanguageContext';
import { MAP_ICONS, getIconComponent } from '../utils/mapIcons';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (type: CaptureType, title: string, content: string, description?: string, audioContent?: string, mapId?: string, reminderDate?: number) => void;
  editCapture?: Capture | null;
  initialMapId?: string | null;
  onDelete?: (id: string) => void;
}

export default function CreateModal({ isOpen, onClose, onSave, editCapture, initialMapId, onDelete }: CreateModalProps) {
  const { t } = useLanguage();
  const [type, setType] = useState<CaptureType>('note');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [audioContent, setAudioContent] = useState('');
  const [mapId, setMapId] = useState('unassigned');
  const [reminderDate, setReminderDate] = useState<string>('');
  const [maps, setMaps] = useState<MapData[]>([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadMaps();
      if (editCapture) {
        setType(editCapture.type);
        setTitle(editCapture.title);
        setContent(editCapture.content);
        setDescription(editCapture.description || '');
        setAudioContent(editCapture.audioContent || '');
        setMapId(editCapture.mapId || 'unassigned');
        setReminderDate(editCapture.reminderDate ? new Date(editCapture.reminderDate).toISOString().split('T')[0] : '');
      } else {
        // Reset to defaults for new capture
        setType('note');
        setTitle('');
        setContent('');
        setDescription('');
        setAudioContent('');
        setMapId(initialMapId || 'unassigned');
        setReminderDate('');
      }
    } else {
      stopCamera();
    }
  }, [isOpen, editCapture]);

  const loadMaps = async () => {
    const allMaps = await getAllMaps();
    setMaps(allMaps);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setContent(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: facingMode } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied", err);
      setIsCameraActive(false);
    }
  };

  const toggleCamera = () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    if (isCameraActive) {
      stopCamera();
      // Use set timeout to ensure the previous stream is fully stopped before starting new one
      setTimeout(() => {
        setIsCameraActive(true);
        navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: newMode } 
        }).then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }).catch(err => {
          console.error("Camera access denied", err);
          setIsCameraActive(false);
        });
      }, 300);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0);
      setContent(canvas.toDataURL('image/jpeg'));
      setType('photo');
      stopCamera();
    }
  };

  const startVideoRecording = async () => {
    try {
      const stream = videoRef.current?.srcObject as MediaStream;
      if (!stream) return;

      // Try to add audio if not present
      let finalStream = stream;
      if (stream.getAudioTracks().length === 0) {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const audioTrack = audioStream.getAudioTracks()[0];
          finalStream = new MediaStream([...stream.getVideoTracks(), audioTrack]);
        } catch (err) {
          console.warn("Could not get audio for video recording", err);
        }
      }

      const mimeType = MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')
        ? 'video/mp4;codecs=avc1'
        : MediaRecorder.isTypeSupported('video/mp4')
          ? 'video/mp4'
          : MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
            ? 'video/webm;codecs=vp9,opus'
            : MediaRecorder.isTypeSupported('video/webm')
              ? 'video/webm'
              : '';

      const recorder = mimeType
        ? new MediaRecorder(finalStream, { mimeType })
        : new MediaRecorder(finalStream);

      videoRecorderRef.current = recorder;
      videoChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          videoChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const videoBlob = new Blob(videoChunksRef.current, { type: mimeType || 'video/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setContent(reader.result as string);
          setType('video');
          stopCamera();
        };
        reader.readAsDataURL(videoBlob);
      };

      recorder.start();
      setIsRecordingVideo(true);
    } catch (err) {
      console.error("Video recording failed", err);
    }
  };

  const stopVideoRecording = () => {
    if (videoRecorderRef.current && isRecordingVideo) {
      videoRecorderRef.current.stop();
      setIsRecordingVideo(false);
    }
  };

  const [savePending, setSavePending] = useState(false);
  
  useEffect(() => {
    if (savePending && !isRecording && !isRecordingVideo) {
      if (type === 'voice' && audioContent) {
        handleSave();
        setSavePending(false);
      } else if ((type === 'photo' || type === 'video') && content) {
        handleSave();
        setSavePending(false);
      } else if (type === 'note') {
        handleSave();
        setSavePending(false);
      }
    }
  }, [savePending, audioContent, content, isRecording, isRecordingVideo, type]);

  const handleSave = () => {
    let finalTitle = title;
    if (!finalTitle) {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = now.toLocaleDateString([], { month: 'short', day: 'numeric' });
      
      if (type === 'voice') finalTitle = `${t('Voice Memo')} ${dateStr} ${timeStr}`;
      else if (type === 'photo') finalTitle = `${t('Photo')} ${dateStr} ${timeStr}`;
      else if (type === 'video') finalTitle = `${t('Video')} ${dateStr} ${timeStr}`;
      else finalTitle = `${t('Note')} ${dateStr} ${timeStr}`;
    }

    if (isRecording) {
      setSavePending(true);
      stopVoiceRecording();
      return; 
    }

    if (isRecordingVideo) {
      setSavePending(true);
      stopVideoRecording();
      return;
    }

    // Don't save empty voice memos
    if (type === 'voice' && !audioContent) {
      return;
    }

    const finalReminderDate = reminderDate ? new Date(reminderDate).getTime() : undefined;
    onSave(type, finalTitle, content, description, audioContent, mapId, finalReminderDate);
    setTitle('');
    setContent('');
    setDescription('');
    setAudioContent('');
    setMapId('unassigned');
    setReminderDate('');
    onClose();
  };

  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playAudio = () => {
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

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : MediaRecorder.isTypeSupported('audio/mp4') 
          ? 'audio/mp4' 
          : MediaRecorder.isTypeSupported('audio/mpeg') 
          ? 'audio/mpeg' 
          : '';

      const recorder = mimeType 
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType || 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          setAudioContent(reader.result as string);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Audio recording failed", err);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        {isCameraActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black flex flex-col items-center justify-center p-0"
          >
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted
              className="w-full h-full object-cover"
            />
            
            {/* HUD Overlays */}
            <div className="absolute inset-0 pointer-events-none border border-accent/20 m-6 rounded-3xl" />
            
            <div className="absolute top-10 left-0 right-0 flex justify-between px-10">
              <div className="flex flex-col">
                <span className="text-accent text-[10px] font-bold tracking-[0.2em] uppercase">{t('Camera Active')}</span>
                <span className="text-white/40 text-[8px] font-mono mt-1">MODE: {facingMode.toUpperCase()}</span>
              </div>
              <div className="flex gap-4">
                <button 
                  onClick={toggleCamera}
                  className="pointer-events-auto bg-black/40 border border-white/10 text-white p-3 rounded-full backdrop-blur-md active:scale-95 transition-transform"
                >
                  <RefreshCcw size={24} />
                </button>
                <button 
                  onClick={stopCamera}
                  className="pointer-events-auto bg-black/40 border border-white/10 text-white p-3 rounded-full backdrop-blur-md active:scale-95 transition-transform"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="absolute bottom-16 flex flex-col items-center gap-6 w-full">
              <div className="flex items-center justify-center gap-8 pointer-events-auto">
                {!isRecordingVideo ? (
                  <>
                    <button 
                      onClick={startVideoRecording}
                      className="w-16 h-16 rounded-full border-4 border-white/20 p-1 active:scale-90 transition-all bg-white/10 hover:bg-white/20"
                    >
                      <div className="w-full h-full rounded-full flex items-center justify-center transition-all bg-red-500">
                        <Video size={24} className="text-white" />
                      </div>
                    </button>

                    <button 
                      onClick={capturePhoto}
                      className="w-20 h-20 rounded-full border-4 border-white/20 p-1 active:scale-90 transition-transform shadow-[0_0_50px_rgba(255,208,0,0.4)]"
                    >
                      <div className="w-full h-full rounded-full bg-accent flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full border-2 border-black/20" />
                      </div>
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={stopVideoRecording}
                    className="w-20 h-20 rounded-full border-4 border-white/20 p-1 active:scale-90 transition-all bg-red-500 animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.5)]"
                  >
                    <div className="w-full h-full rounded-full bg-white flex items-center justify-center">
                      <div className="w-6 h-6 bg-red-500 rounded-sm" />
                    </div>
                  </button>
                )}
              </div>
              <span className="text-accent text-[10px] font-bold tracking-widest uppercase bg-black/40 px-4 py-1 rounded-full backdrop-blur-md">
                {isRecordingVideo ? t('Recording Video...') : t('Photo / Video Capture')}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isCameraActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-black/80 flex items-end sm:items-center justify-center p-4"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="w-full max-w-md bg-nav-bg border border-[#222] rounded-t-[24px] sm:rounded-[24px] overflow-hidden flex flex-col max-h-[90vh]"
            >
          <div className="p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-accent uppercase font-sans">
                  {editCapture ? t('Edit Reminder') : t('New Reminder')}
                </h2>
                {editCapture && onDelete && (
                  <button onClick={() => { onDelete(editCapture.id); }} className="p-1.5 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors active:scale-95" title={t('Delete')}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
              <button onClick={onClose} className="p-1 text-muted-text hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Type Selector - Hidden during Edit */}
            {!editCapture && (
              <div className="flex gap-2">
                {[
                  { id: 'note', icon: PenTool, label: t('NOTE'), color: 'text-note-yellow', bg: 'bg-note-pill' },
                  { id: 'camera', icon: Camera, label: t('CAMERA'), color: 'text-photo-amber', bg: 'bg-photo-pill' },
                  { id: 'voice', icon: Mic, label: t('VOICE'), color: 'text-voice-orange', bg: 'bg-voice-pill' }
                ].map((t_item) => {
                  const isActive = t_item.id === 'camera' ? (type === 'photo' || type === 'video') : type === t_item.id;
                  return (
                    <button
                      key={t_item.id}
                      onClick={() => {
                        if (t_item.id === 'camera') {
                          setType('photo');
                        } else {
                          setType(t_item.id as CaptureType);
                        }
                        setContent('');
                      }}
                      className={`flex-1 flex flex-col items-center gap-2 p-3 rounded-[18px] border transition-all ${
                        isActive ? `border-accent ${t_item.bg}` : 'border-[#222] bg-[#141414]'
                      }`}
                    >
                      <t_item.icon size={20} className={t_item.color} />
                      <span className={`text-[9px] font-bold tracking-widest ${isActive ? 'text-white' : 'text-muted-text'}`}>
                        {t_item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <input
                type="text"
                placeholder={t('Entry Title')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#141414] border border-[#222] rounded-[14px] p-4 text-white focus:outline-none focus:border-accent text-sm font-semibold"
              />
              
              {type === 'note' && (
                <div className="flex flex-col gap-3">
                  <textarea
                    placeholder={t('Write something...')}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full bg-[#141414] border border-[#222] rounded-[14px] p-4 text-white min-h-[140px] focus:outline-none focus:border-accent resize-none text-sm leading-relaxed"
                  />
                  
                  {!editCapture && (
                    <>
                      <div className="text-[8px] font-bold text-note-yellow uppercase tracking-widest opacity-60 mt-1">{t('Audio attachment')}</div>
                      <div className="flex items-center gap-3 bg-[#141414] border border-[#222] rounded-[18px] p-3">
                        <button
                          onClick={() => isRecording ? stopVoiceRecording() : startVoiceRecording()}
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                            isRecording ? 'bg-red-500 animate-pulse' : (audioContent ? 'bg-green-500/20 text-green-500' : 'bg-voice-pill text-voice-orange')
                          }`}
                        >
                          {isRecording ? <div className="w-3 h-3 bg-white rounded-sm" /> : (audioContent ? <Check size={20} /> : <Mic size={20} />)}
                        </button>
                        <div className="flex-1">
                          <div className="text-[9px] font-bold uppercase text-muted-text">{t('Voice Note')}</div>
                          <div className="text-[11px] text-white/60">
                            {isRecording ? t('Recording...') : (audioContent ? t('Audio attached') : t('Record voice memo'))}
                          </div>
                        </div>
                        {audioContent && !isRecording && (
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={playAudio}
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                                isPlaying ? 'bg-accent shadow-[0_0_15px_rgba(255,163,26,0.5)]' : 'bg-accent hover:bg-accent/80'
                              } text-black`}
                            >
                              {isPlaying ? (
                                <div className="flex gap-0.5 items-end h-3">
                                  {[0, 1, 2].map((i) => (
                                    <motion.div
                                      key={i}
                                      animate={{ height: [4, 12, 4] }}
                                      transition={{ repeat: Infinity, duration: 0.5 + i * 0.1 }}
                                      className="w-1 bg-black rounded-full"
                                    />
                                  ))}
                                </div>
                              ) : (
                                <Play size={14} fill="currentColor" />
                              )}
                            </button>
                            <button onClick={() => setAudioContent('')} className="text-muted-text hover:text-white p-1">
                              <X size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {(type === 'photo' || type === 'video') && (
                <div className="flex flex-col gap-4">
                  <div className="relative w-full aspect-video bg-black rounded-[20px] overflow-hidden border border-[#222] flex items-center justify-center">
                    {content ? (
                      <>
                        {type === 'video' ? (
                          <VideoPlayer src={content} />
                        ) : (
                          <img src={content} className="w-full h-full object-contain" />
                        )}
                        <button 
                          onClick={() => setContent('')}
                          className="absolute bottom-4 right-4 bg-accent text-black px-4 py-2 rounded-full font-bold text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2 active:scale-95 transition-all"
                        >
                          <RefreshCcw size={14} />
                          {t('Retake')}
                        </button>
                      </>
                    ) : (
                      <div className="text-center p-6 bg-[#0a0a0a] w-full h-full flex flex-col items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-photo-pill flex items-center justify-center mb-4 text-photo-amber animate-pulse">
                           <Camera size={32} />
                        </div>
                        <p className="text-[10px] text-muted-text font-bold uppercase tracking-[0.2em]">{t('Retake?')}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={startCamera}
                      className="flex items-center justify-center gap-2 bg-[#1C1200] border border-photo-border text-photo-amber py-3 rounded-[14px] text-[10px] font-bold uppercase cursor-pointer active:scale-95 transition-transform"
                    >
                      <Camera size={14} />
                      {t('Camera')}
                    </button>
                    <label className="flex items-center justify-center gap-2 bg-[#1C1200] border border-photo-border text-photo-amber py-3 rounded-[14px] text-[10px] font-bold uppercase cursor-pointer active:scale-95 transition-transform">
                      <ImageIcon size={14} />
                      {t('Library')}
                      <input 
                        type="file" 
                        accept="image/*,video/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.type.startsWith('video/')) {
                              setType('video');
                            } else {
                              setType('photo');
                            }
                            handleFileChange(e);
                          }
                        }}
                      />
                    </label>
                  </div>

                  {/* Supplemental Data: Description and Voice Note */}
                  <div className="flex flex-col gap-3 mt-2">
                    <div className="text-[8px] font-bold text-photo-amber uppercase tracking-widest opacity-60">{t('Additional Information')}</div>
                    
                    <textarea
                      placeholder={t('Add a description...')}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full bg-[#141414] border border-[#222] rounded-[14px] p-4 text-white min-h-[80px] focus:outline-none focus:border-accent resize-none text-[12px] leading-relaxed"
                    />

                    <div className="flex items-center gap-3 bg-[#141414] border border-[#222] rounded-[18px] p-3">
                      <button
                        onClick={() => isRecording ? stopVoiceRecording() : startVoiceRecording()}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                          isRecording ? 'bg-red-500 animate-pulse' : (audioContent ? 'bg-green-500/20 text-green-500' : 'bg-voice-pill text-voice-orange')
                        }`}
                      >
                        {isRecording ? <div className="w-3 h-3 bg-white rounded-sm" /> : (audioContent ? <Check size={20} /> : <Mic size={20} />)}
                      </button>
                      <div className="flex-1">
                        <div className="text-[9px] font-bold uppercase text-muted-text">{t('Voice Note')}</div>
                        <div className="text-[11px] text-white/60">
                          {isRecording ? t('Recording...') : (audioContent ? t('Audio attached') : t('Record voice memo'))}
                        </div>
                      </div>
                      {audioContent && !isRecording && (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={playAudio}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                              isPlaying ? 'bg-accent shadow-[0_0_15px_rgba(255,163,26,0.5)]' : 'bg-accent hover:bg-accent/80'
                            } text-black`}
                          >
                            {isPlaying ? (
                              <div className="flex gap-0.5 items-end h-3">
                                {[0, 1, 2].map((i) => (
                                  <motion.div
                                    key={i}
                                    animate={{ height: [4, 12, 4] }}
                                    transition={{ repeat: Infinity, duration: 0.5 + i * 0.1 }}
                                    className="w-1 bg-black rounded-full"
                                  />
                                ))}
                              </div>
                            ) : (
                              <Play size={14} fill="currentColor" />
                            )}
                          </button>
                          <button onClick={() => setAudioContent('')} className="text-muted-text hover:text-white p-1">
                            <X size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {type === 'voice' && (
                <div className="flex flex-col gap-4">
                  <button 
                    onClick={() => isRecording ? stopVoiceRecording() : startVoiceRecording()}
                    className={`w-full border-2 rounded-[24px] p-10 flex flex-col items-center gap-6 transition-all active:scale-[0.98] ${
                      isRecording 
                        ? 'bg-red-500/10 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]' 
                        : (audioContent ? 'bg-green-500/10 border-green-500' : 'bg-[#1C0E00] border-voice-border')
                    }`}
                  >
                    <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                      isRecording ? 'bg-red-500 animate-pulse scale-110' : (audioContent ? 'bg-green-500 text-white' : 'bg-voice-pill text-voice-orange')
                    }`}>
                      {isRecording ? <div className="w-6 h-6 bg-white rounded-sm" /> : (audioContent ? <Check size={40} strokeWidth={3} /> : <Mic size={40} />)}
                    </div>
                    <div className="text-center">
                      <p className={`text-xs font-bold uppercase tracking-[0.2em] mb-1 ${isRecording ? 'text-red-400' : (audioContent ? 'text-green-400' : 'text-voice-orange')}`}>
                        {isRecording ? t('Recording...') : (audioContent ? t('Recorded') : t('Record Voice'))}
                      </p>
                      <p className="text-[11px] text-muted-text font-mono">
                        {isRecording ? t('Listening...') : (audioContent ? t('Voice memo saved') : t('Tap to start recording'))}
                      </p>
                    </div>
                  </button>

                  {audioContent && !isRecording && (
                    <div className="flex items-center justify-between bg-black/20 border border-white/5 p-4 rounded-[18px]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                          <Check size={16} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{t('Recording Ready')}</span>
                          <button 
                            onClick={playAudio}
                            className="flex items-center gap-1 text-accent text-[9px] font-bold uppercase mt-1 hover:underline"
                          >
                            {isPlaying ? (
                                <div className="flex gap-0.5 items-end h-2 mr-1">
                                    {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        animate={{ height: [2, 8, 2] }}
                                        transition={{ repeat: Infinity, duration: 0.5 + i * 0.1 }}
                                        className="w-0.5 bg-accent rounded-full"
                                    />
                                    ))}
                                </div>
                            ) : (
                                <Play size={10} fill="currentColor" />
                            )}
                            {isPlaying ? t('Streaming audio...') : t('Listen to playback')}
                          </button>
                        </div>
                      </div>
                      <button 
                        onClick={() => setAudioContent('')}
                        className="text-red-500/50 hover:text-red-500 text-[10px] font-bold uppercase"
                      >
                        {t('Discard')}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Map Selection */}
              <div className="flex flex-col gap-3 mt-1">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest">{t('Add to Category')}</span>
                  {maps.length === 0 && <span className="text-[8px] text-accent/50 italic capitalize">{t('No categories')}</span>}
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                  <button
                    onClick={() => setMapId('unassigned')}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-[14px] border border-dashed transition-all ${
                      mapId === 'unassigned' ? 'bg-accent/10 border-accent text-accent' : 'bg-transparent border-[#333] text-muted-text'
                    }`}
                  >
                    <MapIcon size={14} />
                    <span className="text-[11px] font-bold">{t('Unassigned')}</span>
                  </button>
                  {maps.map((map) => {
                    const IconComp = getIconComponent(map.iconId);
                    return (
                      <button
                        key={map.id}
                        onClick={() => setMapId(map.id)}
                        className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-[14px] border transition-all ${
                          mapId === map.id ? 'bg-accent/10 border-accent text-accent font-bold' : 'bg-[#141414] border-[#222] text-white/60'
                        }`}
                      >
                        <IconComp size={14} style={{ color: map.color }} />
                        <span className="text-[11px]">{map.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reminder Date Selector */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest">{t('Set Reminder')}</span>
                  {reminderDate && (
                    <button 
                      onClick={() => setReminderDate('')}
                      className="text-[8px] text-red-500 font-bold uppercase tracking-wider hover:underline"
                    >
                      {t('Clear Reminder')}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-accent pointer-events-none">
                    <Calendar size={16} />
                  </div>
                  <input
                    type="date"
                    value={reminderDate}
                    onChange={(e) => {
                      if (e.target.value && e.target.value.split('-')[0].length > 4) return;
                      setReminderDate(e.target.value);
                    }}
                    max="9999-12-31"
                    className="w-full bg-[#141414] border border-[#222] rounded-[14px] p-4 pl-12 text-white focus:outline-none focus:border-accent text-sm font-semibold appearance-none color-scheme-dark"
                  />
                  {!reminderDate && (
                    <div className="absolute left-12 top-1/2 -translate-y-1/2 text-muted-text/40 text-[11px] font-bold uppercase tracking-widest pointer-events-none">
                      {t('Select Date (Optional)')}
                    </div>
                  )}
                </div>
                {reminderDate && (
                  <div className="text-[8px] font-bold text-accent/60 uppercase tracking-widest px-1">
                    {t('Notifications: 1 day before & on date')}
                  </div>
                )}
              </div>

            </div>

            <button
               onClick={handleSave}
               disabled={(type === 'voice' && !audioContent && !isRecording) || (type === 'video' && !content && !isRecordingVideo)}
               className={`w-full font-extrabold py-4 rounded-[16px] flex items-center justify-center gap-2 transition-all shadow-[0_4px_15px_rgba(255,208,0,0.2)] ${
                 ((type === 'voice' && !audioContent && !isRecording) || (type === 'video' && !content && !isRecordingVideo))
                   ? 'bg-muted-text/20 text-muted-text cursor-not-allowed scale-[0.98]' 
                   : ((isRecording || isRecordingVideo) ? 'bg-accent/80 text-black animate-pulse' : 'bg-accent text-black active:scale-95')
               }`}
            >
              <Check size={20} strokeWidth={3} />
              {(isRecording || isRecordingVideo) ? t('RECORDING IN PROGRESS...') : (editCapture ? t('UPDATE REMINDER') : t('SAVE REMINDER'))}
            </button>
          </div>
        </motion.div>
      </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
