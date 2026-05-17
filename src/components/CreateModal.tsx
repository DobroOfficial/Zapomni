import { useState, useRef, useEffect } from 'react';
import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, PenTool, Camera, Mic, Check, Image as ImageIcon, RefreshCcw, Map as MapIcon, Play, Video, Calendar, Trash2, Plus, Sliders, ArrowRight, ChevronUp, ChevronDown } from 'lucide-react';
import { Capture, CaptureType, MapData } from '../types';
import { getAllMaps } from '../services/db';
import VideoPlayer from './VideoPlayer';
import { useLanguage } from '../contexts/LanguageContext';
import { MAP_ICONS, getIconComponent } from '../utils/mapIcons';
import { useBackHandler } from '../hooks/useBackHandler';

interface CreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (type: CaptureType, title: string, content: string, description?: string, audioContent?: string, mapId?: string, reminderDate?: number, additionalContents?: string[]) => void;
  editCapture?: Capture | null;
  initialMapId?: string | null;
  initialDate?: string | null;
  onDelete?: (id: string) => void;
}

const compressImage = async (dataUrl: string, quality: number = 0.6, maxWidth: number = 1920): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
};

export default function CreateModal({ isOpen, onClose, onSave, editCapture, initialMapId, initialDate, onDelete }: CreateModalProps) {
  const { t } = useLanguage();
  const [type, setType] = useState<CaptureType>('note');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [audioContent, setAudioContent] = useState('');
  const [additionalContents, setAdditionalContents] = useState<string[]>([]);
  const [mapId, setMapId] = useState('unassigned');
  const [reminderDate, setReminderDate] = useState<string>('');
  const [maps, setMaps] = useState<MapData[]>([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<'main' | 'additional'>('main');
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  
  const [cameraCaptures, setCameraCaptures] = useState<string[]>([]);
  const [cameraFlash, setCameraFlash] = useState<boolean>(false);
  const [showCameraGallery, setShowCameraGallery] = useState(false);
  const [selectedFullscreenCaptureIndex, setSelectedFullscreenCaptureIndex] = useState<number | null>(null);
  const [selectedMediaFullscreenIndex, setSelectedMediaFullscreenIndex] = useState<number | null>(null);
  const [step, setStep] = useState<'type-selection' | 'compose'>('type-selection');
  const [showNoteMenu, setShowNoteMenu] = useState<'add' | 'sort' | null>(null);
  const [showAttachments, setShowAttachments] = useState(false);

  useBackHandler(isCameraActive && !showCameraGallery, () => {
    setCameraCaptures([]);
    setIsCameraActive(false);
  }, 'create-modal-camera');

  useBackHandler(showCameraGallery && selectedFullscreenCaptureIndex === null, () => setShowCameraGallery(false), 'camera-gallery');
  useBackHandler(selectedFullscreenCaptureIndex !== null, () => setSelectedFullscreenCaptureIndex(null), 'camera-gallery-fullscreen');
  useBackHandler(selectedMediaFullscreenIndex !== null, () => setSelectedMediaFullscreenIndex(null), 'create-modal-fullscreen');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const videoChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadMaps();
      if (editCapture) {
        setStep('compose');
        setType(editCapture.type);
        setTitle(editCapture.title);
        setContent(editCapture.content);
        setDescription(editCapture.description || '');
        setAudioContent(editCapture.audioContent || '');
        setAdditionalContents(editCapture.additionalContents || []);
        setMapId(editCapture.mapId || 'unassigned');
        setReminderDate(editCapture.reminderDate ? new Date(editCapture.reminderDate).toISOString().split('T')[0] : '');
        setShowAttachments(false);
      } else {
        // Reset to defaults for new capture
        setStep('type-selection');
        setType('note');
        setTitle('');
        setContent('');
        setDescription('');
        setAudioContent('');
        setAdditionalContents([]);
        setMapId(initialMapId || 'unassigned');
        setReminderDate(initialDate || '');
        setShowAttachments(false);
      }
    } else {
      stopCamera();
    }
  }, [isOpen, editCapture, initialMapId, initialDate]);

  const loadMaps = async () => {
    const allMaps = await getAllMaps();
    setMaps(allMaps);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const isImage = file.type.startsWith('image/');
      const reader = new FileReader();
      reader.onloadend = async () => {
        let result = reader.result as string;
        if (isImage && !file.type.includes('gif')) {
          result = await compressImage(result, 0.6, 1920);
        }
        setContent(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddMoreFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (!files.length) return;

    const newContents: string[] = [];
    for (const file of files) {
      const isImage = file.type.startsWith('image/') && !file.type.includes('gif');
      if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
        try {
          const heic2any = (await import('heic2any')).default;
          const convertedBlob = await heic2any({ blob: file, toType: "image/jpeg" });
          const actualBlob = (Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob) as Blob;
          
          const reader = new FileReader();
          await new Promise(resolve => {
            reader.onloadend = async () => {
              let result = reader.result as string;
              result = await compressImage(result, 0.6, 1920);
              newContents.push(result);
              resolve(null);
            };
            reader.readAsDataURL(actualBlob);
          });
        } catch (err) {
          console.error('Error converting HEIC file:', err);
        }
      } else {
        const reader = new FileReader();
        await new Promise(resolve => {
          reader.onloadend = async () => {
            let result = reader.result as string;
            if (isImage) {
              result = await compressImage(result, 0.6, 1920);
            }
            newContents.push(result);
            resolve(null);
          };
          reader.readAsDataURL(file as Blob);
        });
      }
    }
    
    if (newContents.length > 0) {
      if (!content) {
        setContent(newContents[0]);
        setType(newContents[0].startsWith('data:video/') ? 'video' : 'photo');
        setAdditionalContents(prev => [...prev, ...newContents.slice(1)]);
      } else {
        setAdditionalContents(prev => [...prev, ...newContents]);
      }
    }
  };

  const startCamera = async (target: 'main' | 'additional' = 'main') => {
    try {
      setCameraTarget(target);
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: facingMode },
        audio: true
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
          video: { facingMode: newMode },
          audio: true
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
    setCameraCaptures([]);
    setShowCameraGallery(false);
  };

  const handleConfirmCamera = () => {
    if (cameraCaptures.length > 0) {
      if (!content && cameraCaptures.length > 0) {
        setContent(cameraCaptures[0]);
        setAdditionalContents(prev => [...prev, ...cameraCaptures.slice(1)]);
        setType(cameraCaptures[0].startsWith('data:video/') ? 'video' : 'photo');
      } else {
        setAdditionalContents(prev => [...prev, ...cameraCaptures]);
      }
    }
    setIsCameraActive(false);
    setCameraCaptures([]);
    setShowCameraGallery(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const handleDeleteMedia = (index: number) => {
    if (index === 0) {
      if (additionalContents.length > 0) {
        setContent(additionalContents[0]);
        setType(additionalContents[0].startsWith('data:video/') ? 'video' : 'photo');
        setAdditionalContents(prev => prev.slice(1));
      } else {
        setContent('');
      }
    } else {
      setAdditionalContents(prev => prev.filter((_, i) => i !== index - 1));
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const videoWidth = videoRef.current.videoWidth;
      const videoHeight = videoRef.current.videoHeight;
      const maxWidth = 1920;
      let width = videoWidth;
      let height = videoHeight;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(videoRef.current, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
      
      setCameraCaptures(prev => [...prev, dataUrl]);
      setCameraFlash(true);
      setTimeout(() => setCameraFlash(false), 200);
    }
  };

  const startVideoRecording = async () => {
    try {
      const stream = videoRef.current?.srcObject as MediaStream;
      if (!stream) return;

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
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

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
          const dataUrl = reader.result as string;
          setCameraCaptures(prev => [...prev, dataUrl]);
          setCameraFlash(true);
          setTimeout(() => setCameraFlash(false), 200);
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
    onSave(type, finalTitle, content, description, audioContent, mapId, finalReminderDate, additionalContents);
    setTitle('');
    setContent('');
    setDescription('');
    setAudioContent('');
    setAdditionalContents([]);
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
          const result = reader.result as string;
          setAudioContent(prev => {
            if (!prev) return result;
            setAdditionalContents(addPrev => [...addPrev, result]);
            return prev;
          });
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
            
            <AnimatePresence>
              {cameraFlash && (
                <motion.div
                  initial={{ opacity: 0.8 }}
                  animate={{ opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-0 bg-white pointer-events-none z-10"
                />
              )}
            </AnimatePresence>
            
            <div className="absolute top-10 left-0 right-0 flex justify-between px-6 z-20 pointer-events-none items-start">
              <div className="flex gap-4">
                <button 
                  onClick={stopCamera}
                  className="pointer-events-auto bg-black/40 border border-white/10 text-white w-12 h-12 flex items-center justify-center rounded-full backdrop-blur-md active:scale-95 transition-transform shadow-lg"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex flex-col items-center bg-black/40 px-4 py-2 rounded-full backdrop-blur-md border border-white/5 shadow-lg">
                <span className="text-accent text-[10px] font-bold tracking-[0.2em] uppercase">{t('Camera Active')}</span>
                <span className="text-white/40 text-[8px] font-mono mt-0.5">{(isRecordingVideo ? 'RECORDING' : 'READY')} ({facingMode.toUpperCase()})</span>
              </div>
              <div className="flex gap-4">
                {cameraCaptures.length > 0 && !isRecordingVideo ? (
                  <button 
                    onClick={handleConfirmCamera}
                    className="pointer-events-auto bg-accent text-black font-bold text-[10px] uppercase tracking-widest px-4 h-12 rounded-full backdrop-blur-md active:scale-95 transition-transform shadow-[0_0_20px_rgba(255,208,0,0.3)] flex items-center gap-2"
                  >
                    <span>{t('Finish')} ({cameraCaptures.length})</span>
                    <Check size={16} strokeWidth={3} />
                  </button>
                ) : (
                  <div className="w-12 h-12" />
                )}
              </div>
            </div>

            <div className="absolute bottom-16 flex flex-col items-center gap-6 w-full px-6 z-20">
              <div className="flex items-center justify-between w-full pointer-events-auto mb-2">
                <div className="w-20 flex justify-start">
                  {cameraCaptures.length > 0 && !isRecordingVideo && (
                    <button 
                      onClick={() => setShowCameraGallery(true)}
                      className="relative w-14 h-14 bg-black rounded-2xl shadow-xl cursor-pointer active:scale-95 transition-transform"
                    >
                      <div className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden border-2 border-white">
                        {cameraCaptures[cameraCaptures.length - 1].startsWith('data:video/') ? (
                          <video src={`${cameraCaptures[cameraCaptures.length - 1]}#t=0.001`} className="w-full h-full object-cover" />
                        ) : (
                          <img src={cameraCaptures[cameraCaptures.length - 1]} className="w-full h-full object-cover" />
                        )}
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <ImageIcon size={20} className="text-white" />
                        </div>
                      </div>
                      <div className="absolute -top-2 -right-2 bg-accent shadow-[0_0_10px_rgba(255,208,0,0.5)] text-black text-[11px] w-6 h-6 flex items-center justify-center rounded-full font-bold z-10 border border-black">
                        {cameraCaptures.length}
                      </div>
                    </button>
                  )}
                </div>

                <div className="flex items-center justify-center gap-6">
                  {!isRecordingVideo ? (
                    <>
                      <button 
                        onClick={startVideoRecording}
                        className="w-12 h-12 rounded-full border-2 border-white/20 p-1 active:scale-90 transition-all bg-black/40 backdrop-blur-md shadow-lg"
                      >
                        <div className="w-full h-full rounded-full flex items-center justify-center transition-all bg-red-500/80 hover:bg-red-500">
                          <Video size={16} className="text-white" />
                        </div>
                      </button>

                      <button 
                        onClick={capturePhoto}
                        className="w-20 h-20 rounded-full border-4 border-white/20 p-1 active:scale-90 transition-transform shadow-[0_0_50px_rgba(255,208,0,0.4)] bg-black/20 backdrop-blur-sm"
                      >
                        <div className="w-full h-full rounded-full bg-accent flex items-center justify-center hover:bg-accent/90 transition-colors">
                            <div className="w-8 h-8 rounded-full border-2 border-black/20" />
                        </div>
                      </button>

                      <button 
                        onClick={toggleCamera}
                        className="w-12 h-12 rounded-full border-2 border-white/20 p-1 active:scale-90 transition-all bg-black/40 hover:bg-white/10 backdrop-blur-md shadow-lg text-white flex items-center justify-center"
                      >
                        <RefreshCcw size={16} />
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

                <div className="w-20 flex justify-end">
                  {/* Empty right area to balance the left area */}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedMediaFullscreenIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black flex flex-col"
          >
            <div className="absolute top-10 left-6 right-6 flex justify-between items-center z-10">
              <button 
                onClick={() => setSelectedMediaFullscreenIndex(null)}
                className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center text-white backdrop-blur-md active:scale-95 transition-transform"
              >
                <X size={24} />
              </button>
              <button 
                onClick={() => {
                  handleDeleteMedia(selectedMediaFullscreenIndex);
                  setSelectedMediaFullscreenIndex(null);
                }}
                className="w-12 h-12 bg-red-500/80 rounded-full flex items-center justify-center text-white backdrop-blur-md active:scale-95 transition-transform"
              >
                <Trash2 size={20} />
              </button>
            </div>
            
            <div className="flex-1 w-full h-full flex items-center justify-center bg-black">
              {(() => {
                const mediaUrl = selectedMediaFullscreenIndex === 0 ? content : additionalContents[selectedMediaFullscreenIndex - 1];
                if (!mediaUrl) return null;
                
                return mediaUrl.startsWith('data:video/') ? (
                  <video 
                    src={mediaUrl} 
                    className="w-full h-full object-contain" 
                    controls 
                    autoPlay 
                    playsInline 
                  />
                ) : (
                  <img 
                    src={mediaUrl} 
                    className="w-full h-full object-contain" 
                  />
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <AnimatePresence>
        {isCameraActive && showCameraGallery && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed inset-0 z-[210] bg-black backdrop-blur-xl flex flex-col p-6"
          >
            {selectedFullscreenCaptureIndex !== null && cameraCaptures[selectedFullscreenCaptureIndex] ? (
              <div className="absolute inset-0 z-50 flex flex-col bg-black">
                <div className="absolute top-10 left-6 right-6 flex justify-between items-center z-10">
                  <button 
                    onClick={() => setSelectedFullscreenCaptureIndex(null)}
                    className="w-12 h-12 bg-black/60 rounded-full flex items-center justify-center text-white backdrop-blur-md active:scale-95"
                  >
                    <X size={24} />
                  </button>
                  <button 
                    onClick={() => {
                      setCameraCaptures(prev => prev.filter((_, i) => i !== selectedFullscreenCaptureIndex));
                      setSelectedFullscreenCaptureIndex(null);
                    }}
                    className="w-12 h-12 bg-red-500/80 rounded-full flex items-center justify-center text-white backdrop-blur-md active:scale-95"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
                <div className="flex-1 w-full h-full flex items-center justify-center bg-black">
                  {cameraCaptures[selectedFullscreenCaptureIndex].startsWith('data:video/') ? (
                    <video 
                      src={cameraCaptures[selectedFullscreenCaptureIndex]} 
                      className="w-full h-full object-contain" 
                      controls 
                      autoPlay 
                      playsInline 
                    />
                  ) : (
                    <img 
                      src={cameraCaptures[selectedFullscreenCaptureIndex]} 
                      className="w-full h-full object-contain" 
                    />
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6 pt-10">
                  <h3 className="text-white font-bold uppercase tracking-widest">{t('Review Captures')}</h3>
                  <button 
                    onClick={() => setShowCameraGallery(false)}
                    className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white"
                  >
                    <X size={20} />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-2 gap-4">
                    {cameraCaptures.map((capture, index) => (
                      <div 
                        key={index} 
                        onClick={() => setSelectedFullscreenCaptureIndex(index)}
                        className="relative aspect-square bg-[#141414] rounded-2xl overflow-hidden border border-[#222] cursor-pointer active:scale-95 transition-transform"
                      >
                        {capture.startsWith('data:video/') ? (
                          <video src={`${capture}#t=0.001`} className="w-full h-full object-cover" />
                        ) : (
                          <img src={capture} className="w-full h-full object-cover" />
                        )}
                        {capture.startsWith('data:video/') && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <Video className="text-white" size={24} />
                          </div>
                        )}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setCameraCaptures(prev => prev.filter((_, i) => i !== index));
                          }}
                          className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-2 backdrop-blur-md active:scale-95"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                  {cameraCaptures.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-muted-text">
                      <p>{t('No captures yet')}</p>
                    </div>
                  )}
                </div>

                <div className="pt-6 pb-6">
                  <button 
                    onClick={handleConfirmCamera}
                    disabled={cameraCaptures.length === 0}
                    className="w-full bg-accent text-black font-extrabold py-4 rounded-[16px] text-xs uppercase tracking-widest active:scale-95 transition-transform disabled:opacity-50"
                  >
                    {t('Confirm')} ({cameraCaptures.length})
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isCameraActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 z-[110] bg-black/80 flex items-center justify-center ${type === 'note' && step === 'compose' ? 'p-0 sm:p-4' : 'p-4'}`}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className={`w-full bg-nav-bg border-[#222] overflow-hidden flex flex-col ${
                type === 'note' && step === 'compose'
                  ? 'max-w-3xl h-[100dvh] sm:h-[90vh] rounded-none sm:rounded-[24px] sm:border' 
                  : 'max-w-md border rounded-[24px] max-h-[90vh] shadow-2xl'
              }`}
            >
          <div className="p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar flex-1">
            <div className="flex justify-between items-center shrink-0">
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
              <div className="flex items-center gap-2">
                <button onClick={onClose} className="p-2 bg-[#141414] rounded-full text-muted-text hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            {step === 'type-selection' ? (
              <div className="flex flex-col gap-3 mt-4">
                {[
                  { id: 'note', icon: PenTool, label: t('Text Note'), description: t('Write down your thoughts'), color: 'text-note-yellow', bg: 'bg-note-pill' },
                  { id: 'camera', icon: Camera, label: t('Photo or Video'), description: t('Capture visual memories'), color: 'text-photo-amber', bg: 'bg-photo-pill' },
                  { id: 'voice', icon: Mic, label: t('Voice Memo'), description: t('Record an audio note'), color: 'text-voice-orange', bg: 'bg-voice-pill' }
                ].map((t_item) => (
                  <button
                    key={t_item.id}
                    onClick={() => {
                      if (t_item.id === 'camera') {
                        setType('photo');
                      } else {
                        setType(t_item.id as CaptureType);
                      }
                      setContent('');
                      setStep('compose');
                    }}
                    className="w-full flex items-center gap-4 p-5 rounded-[20px] bg-[#141414] border border-[#222] hover:border-accent active:scale-[0.98] transition-all group"
                  >
                    <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center ${t_item.bg} ${t_item.color} group-hover:scale-110 transition-transform`}>
                      <t_item.icon size={24} />
                    </div>
                    <div className="flex flex-col items-start text-left flex-1">
                      <span className="text-white font-bold text-sm tracking-wide">{t_item.label}</span>
                      <span className="text-muted-text text-xs mt-0.5">{t_item.description}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <>

            <div className={`flex flex-col gap-3 ${type === 'note' ? 'flex-1' : ''}`}>
              <input
                type="text"
                placeholder={type === 'note' ? t('Title') : t('Entry Title')}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full text-white focus:outline-none ${
                    type === 'note' 
                    ? 'bg-transparent border-none p-0 text-3xl font-extrabold tracking-tight placeholder-muted-text/30' 
                    : 'bg-[#141414] border border-[#222] rounded-[14px] p-4 text-sm font-semibold focus:border-accent'
                }`}
              />
              
              {type === 'note' && (
                <div className="flex flex-col gap-3 flex-1 relative h-full">
                  <textarea
                    placeholder={t('Start typing...')}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full bg-transparent border-none p-0 text-white min-h-[140px] flex-1 focus:outline-none resize-none text-lg leading-relaxed font-medium placeholder-muted-text/30"
                  />
                  
                  <div className="flex flex-col gap-3 mt-auto relative z-10 pb-2">
                      {/* Attachments Display */}
                      {(audioContent || additionalContents.length > 0) && (
                        <div className="flex flex-col gap-2">
                           <button 
                             onClick={(e) => { e.preventDefault(); setShowAttachments(!showAttachments); }}
                             className="flex items-center justify-between h-10 px-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-[16px] text-[11px] font-bold text-white/70 active:scale-[0.98] transition-transform"
                           >
                             <div className="flex items-center gap-3">
                               {additionalContents.filter(c => c.startsWith('data:image/')).length > 0 && <span className="flex items-center gap-1.5"><ImageIcon size={14} className="text-photo-amber" /> {additionalContents.filter(c => c.startsWith('data:image/')).length}</span>}
                               {additionalContents.filter(c => c.startsWith('data:image/')).length > 0 && (additionalContents.filter(c => c.startsWith('data:video/')).length > 0 || audioContent || additionalContents.filter(c => c.startsWith('data:audio/')).length > 0) && <span className="text-white/20">·</span>}
                               
                               {additionalContents.filter(c => c.startsWith('data:video/')).length > 0 && <span className="flex items-center gap-1.5"><Video size={14} className="text-accent" /> {additionalContents.filter(c => c.startsWith('data:video/')).length}</span>}
                               {additionalContents.filter(c => c.startsWith('data:video/')).length > 0 && (audioContent || additionalContents.filter(c => c.startsWith('data:audio/')).length > 0) && <span className="text-white/20">·</span>}
                               
                               {(audioContent || additionalContents.filter(c => c.startsWith('data:audio/')).length > 0) && <span className="flex items-center gap-1.5"><Mic size={14} className="text-voice-orange" /> {(audioContent ? 1 : 0) + additionalContents.filter(c => c.startsWith('data:audio/')).length}</span>}
                             </div>
                             {showAttachments ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                           </button>
                           
                           <AnimatePresence>
                             {showAttachments && (
                               <motion.div 
                                 initial={{ height: 0, opacity: 0 }}
                                 animate={{ height: "auto", opacity: 1 }}
                                 exit={{ height: 0, opacity: 0 }}
                                 className="overflow-hidden"
                               >
                                 <div className="flex gap-3 overflow-x-auto custom-scrollbar custom-scrollbar-h pb-2 pt-1 w-full">
                                   {audioContent && (
                                     <div className="flex items-center gap-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-[16px] p-3 shrink-0 shadow-sm w-[220px]">
                                        <button 
                                          onClick={(e) => { e.preventDefault(); playAudio(); }}
                                          className={`w-10 h-10 rounded-[12px] flex items-center justify-center transition-all ${
                                            isPlaying ? 'bg-accent/20 text-accent' : 'bg-[#2a2a2a] text-white hover:bg-[#333]'
                                          }`}
                                        >
                                          {isPlaying ? <span className="bg-accent w-3 h-3 rounded-sm animate-pulse" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
                                        </button>
                                        <div className="flex-1 flex flex-col min-w-[80px]">
                                          <span className="text-[12px] font-bold text-white mb-0.5">{t('Voice Memo')}</span>
                                        </div>
                                        <button onClick={(e) => { e.preventDefault(); setAudioContent(''); }} className="w-8 h-8 flex items-center justify-center text-red-500/60 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all">
                                          <Trash2 size={14} />
                                        </button>
                                     </div>
                                   )}
                                   
                                   {additionalContents.map((file, i) => file.startsWith('data:image/') || file.startsWith('data:video/') ? (
                                     <div key={i} className="relative shrink-0 w-[80px] h-[80px] bg-black rounded-[16px] overflow-hidden border border-[#2a2a2a] shadow-sm">
                                       {file.startsWith('data:video/') ? (
                                         <video src={file} className="w-full h-full object-cover" />
                                       ) : (
                                         <img src={file} className="w-full h-full object-cover" />
                                       )}
                                       <button 
                                         onClick={(e) => { e.preventDefault(); setAdditionalContents(prev => prev.filter((_, index) => index !== i)); }}
                                         className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1.5 border border-white/20 active:scale-95 hover:bg-black/80 transition-colors z-20"
                                       >
                                         <X size={12} />
                                       </button>
                                     </div>
                                   ) : file.startsWith('data:audio/') ? (
                                     <div key={i} className="flex items-center gap-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-[16px] p-3 shrink-0 shadow-sm w-[220px]">
                                        <button 
                                          onClick={(e) => { 
                                              e.preventDefault(); 
                                              const a = new Audio(file);
                                              a.play();
                                          }}
                                          className="w-10 h-10 rounded-[12px] flex items-center justify-center transition-all bg-[#2a2a2a] text-white hover:bg-[#333]"
                                        >
                                          <Play size={18} fill="currentColor" className="ml-0.5" />
                                        </button>
                                        <div className="flex-1 flex flex-col min-w-[80px]">
                                          <span className="text-[12px] font-bold text-white mb-0.5">{t('Voice Memo')}</span>
                                        </div>
                                        <button onClick={(e) => { e.preventDefault(); setAdditionalContents(prev => prev.filter((_, index) => index !== i)); }} className="w-8 h-8 flex items-center justify-center text-red-500/60 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all">
                                          <Trash2 size={14} />
                                        </button>
                                     </div>
                                   ) : null)}
                                 </div>
                               </motion.div>
                             )}
                           </AnimatePresence>
                        </div>
                      )}
                      
                      <div className="absolute right-0 -top-16 flex gap-2 z-10">
                        {/* Sort Menu */}
                        <div className="relative">
                          <button 
                            onClick={() => setShowNoteMenu(showNoteMenu === 'sort' ? null : 'sort')} 
                            className={`w-12 h-12 rounded-[16px] flex items-center justify-center transition-all shadow-xl ${
                              showNoteMenu === 'sort' ? 'bg-white text-black' : 'bg-[#141414] border border-[#222] text-muted-text hover:text-white hover:border-white/20'
                            }`}
                          >
                            <Sliders size={20} />
                          </button>
                          
                          <AnimatePresence>
                            {showNoteMenu === 'sort' && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute bottom-[calc(100%+12px)] right-0 bg-nav-bg border border-[#222] rounded-[24px] p-5 w-screen max-w-[320px] shadow-2xl flex flex-col gap-6"
                              >
                                 <div className="flex flex-col gap-3">
                                   <div className="text-[10px] font-bold text-accent uppercase tracking-widest">{t('Category')}</div>
                                   <div className="flex flex-wrap gap-2">
                                     <button
                                       onClick={() => setMapId('unassigned')}
                                       className={`px-3 py-2 rounded-[10px] border border-dashed text-[10px] font-bold transition-all ${mapId === 'unassigned' ? 'bg-accent/10 border-accent text-accent' : 'border-[#333] text-muted-text block'}`}
                                     >
                                       {t('Unassigned')}
                                     </button>
                                     {maps.map(m => {
                                        const IconComp = getIconComponent(m.iconId);
                                        return (
                                          <button key={m.id} onClick={() => setMapId(m.id)} className={`px-3 py-2 rounded-[10px] border flex items-center gap-1.5 text-[10px] font-bold transition-all ${mapId === m.id ? 'bg-accent/10 border-accent text-accent' : 'bg-[#141414] border-[#222] text-white/60'}`}>
                                             <IconComp size={10} style={{ color: m.color }} /> {m.name}
                                          </button>
                                        );
                                     })}
                                   </div>
                                 </div>
  
                                 <div className="flex flex-col gap-3">
                                   <div className="flex items-center justify-between">
                                     <div className="text-[10px] font-bold text-accent uppercase tracking-widest">{t('Reminder')}</div>
                                     {reminderDate && <button onClick={() => setReminderDate('')} className="text-[8px] text-red-500 font-bold uppercase hover:underline">{t('Clear')}</button>}
                                   </div>
                                   <div className="relative">
                                     <div className="absolute left-3 top-1/2 -translate-y-1/2 text-accent pointer-events-none"><Calendar size={14} /></div>
                                     <input type="date" value={reminderDate} onChange={(e) => { if (e.target.value && e.target.value.split('-')[0].length > 4) return; setReminderDate(e.target.value); }} max="9999-12-31" className="w-full bg-[#141414] border border-[#222] rounded-[10px] p-3 pl-10 text-white focus:outline-none focus:border-accent text-xs font-semibold appearance-none color-scheme-dark" />
                                   </div>
                                 </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
  
                        {/* Add Menu */}
                        <div className="relative">
                          <button 
                            onClick={() => setShowNoteMenu(showNoteMenu === 'add' ? null : 'add')} 
                            className={`w-12 h-12 rounded-[16px] flex items-center justify-center transition-all shadow-xl ${
                              showNoteMenu === 'add' || isRecording ? 'bg-white text-black scale-110' : 'bg-accent text-black hover:bg-accent/90'
                            }`}
                          >
                            {isRecording ? <div className="w-2 h-2 bg-red-500 rounded-sm animate-pulse" /> : <Plus size={24} strokeWidth={3} className={showNoteMenu === 'add' ? 'rotate-45 transition-transform duration-200' : 'transition-transform duration-200'} />}
                          </button>
                          
                          <AnimatePresence>
                            {showNoteMenu === 'add' && (
                              <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 bg-nav-bg border border-[#222] rounded-[24px] p-2 flex flex-col gap-1 shadow-2xl w-[160px]"
                              >
                                 <button onClick={() => { setShowNoteMenu(null); isRecording ? stopVoiceRecording() : startVoiceRecording(); }} className="flex items-center gap-3 p-3 rounded-[16px] hover:bg-[#141414] text-left text-xs font-bold uppercase tracking-widest text-voice-orange transition-colors">
                                    <Mic size={16} /> {isRecording ? t('Stop Recording') : t('Voice Memo')}
                                 </button>
                                 <button onClick={() => { setShowNoteMenu(null); startCamera('additional'); }} className="flex items-center gap-3 p-3 rounded-[16px] hover:bg-[#141414] text-left text-xs font-bold uppercase tracking-widest text-photo-amber transition-colors">
                                    <Camera size={16} /> {t('Camera')}
                                 </button>
                                 <label className="flex items-center gap-3 p-3 rounded-[16px] hover:bg-[#141414] text-left text-xs font-bold uppercase tracking-widest text-white cursor-pointer transition-colors">
                                    <ImageIcon size={16} /> {t('Library')}
                                    <input type="file" multiple accept="image/*,.heic,.heif" className="hidden" onChange={(e) => { setShowNoteMenu(null); handleAddMoreFiles(e); }} />
                                 </label>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>
                </div>
              )}

              {(type === 'photo' || type === 'video') && (() => {
                const allMedia = [content, ...additionalContents].filter(Boolean);

                return (
                  <>
                    <div className="flex flex-col gap-4">
                      {allMedia.length > 0 ? (
                      <div className="flex flex-col gap-4">
                        <div 
                          className="relative w-full aspect-video bg-black rounded-[20px] overflow-hidden border border-[#222] flex items-center justify-center pt-2 pb-2 pl-2 pr-2 cursor-pointer active:scale-[0.98] transition-transform"
                          onClick={() => setSelectedMediaFullscreenIndex(0)}
                        >
                           {allMedia[0].startsWith('data:video/') ? (
                             <VideoPlayer src={allMedia[0]} />
                           ) : (
                             <img src={allMedia[0]} className="w-full h-full object-contain" />
                           )}
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               handleDeleteMedia(0);
                             }}
                             className="absolute top-4 right-4 bg-black/60 text-white rounded-full p-2 border border-white/20 active:scale-95 z-20"
                           >
                             <Trash2 size={16} />
                           </button>
                        </div>
                        
                        <div className="custom-scrollbar custom-scrollbar-h">
                           <div className="flex gap-2 shrink-0">
                             <button
                               onClick={() => startCamera('main')}
                               className="w-20 h-20 bg-[#1C1200] border border-photo-border text-photo-amber rounded-[14px] flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform shrink-0"
                             >
                               <Camera size={14} />
                               <span className="text-[10px] font-bold uppercase">{t('Camera')}</span>
                             </button>
                             <label className="w-20 h-20 bg-[#1C1200] border border-photo-border text-photo-amber rounded-[14px] flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 transition-transform shrink-0">
                               <ImageIcon size={14} />
                               <span className="text-[10px] font-bold uppercase">{t('Library')}</span>
                               <input 
                                 type="file" 
                                 multiple
                                 accept="image/*,video/*,.heic,.heif" 
                                 className="hidden" 
                                 onChange={handleAddMoreFiles}
                               />
                             </label>
                           </div>
                           
                           {allMedia.slice(1).map((media, i) => (
                             <div 
                               key={i} 
                               onClick={() => setSelectedMediaFullscreenIndex(i + 1)}
                               className="relative shrink-0 w-20 h-20 bg-black rounded-[14px] overflow-hidden border border-[#222] cursor-pointer active:scale-95 transition-transform"
                             >
                               {media.startsWith('data:video/') ? (
                                 <video src={`${media}#t=0.001`} className="w-full h-full object-cover" />
                               ) : (
                                 <img src={media} className="w-full h-full object-cover" />
                               )}
                               {media.startsWith('data:video/') && (
                                 <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                   <Video className="text-white" size={20} />
                                 </div>
                               )}
                               <button 
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   handleDeleteMedia(i + 1);
                                 }}
                                 className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 border border-white/20 active:scale-95 z-20"
                               >
                                 <X size={12} />
                               </button>
                             </div>
                           ))}
                        </div>
                      </div>
                    ) : (
                      <div className="relative w-full aspect-video bg-[#0a0a0a] rounded-[20px] overflow-hidden border border-[#222] flex flex-col items-center justify-center gap-6">
                        <div className="w-16 h-16 rounded-full bg-photo-pill flex items-center justify-center text-photo-amber animate-pulse">
                           <Camera size={32} />
                        </div>
                        <div className="flex gap-4">
                          <button 
                            onClick={() => startCamera('main')}
                            className="flex items-center justify-center gap-2 bg-[#1C1200] border border-photo-border text-photo-amber py-3 px-6 rounded-[14px] text-[10px] font-bold uppercase cursor-pointer active:scale-95 transition-transform"
                          >
                            <Camera size={14} />
                            {t('Camera')}
                          </button>
                          <label className="flex items-center justify-center gap-2 bg-[#1C1200] border border-photo-border text-photo-amber py-3 px-6 rounded-[14px] text-[10px] font-bold uppercase cursor-pointer active:scale-95 transition-transform">
                            <ImageIcon size={14} />
                            {t('Library')}
                            <input 
                              type="file" 
                              multiple
                              accept="image/*,video/*,.heic,.heif" 
                              className="hidden" 
                              onChange={handleAddMoreFiles}
                            />
                          </label>
                        </div>
                      </div>
                    )}
                  
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
                </>
              );
              })()}

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

                  {additionalContents.filter(c => c.startsWith('data:audio/')).map((audio, index) => (
                    <div key={index} className="flex items-center justify-between bg-black/20 border border-white/5 p-4 rounded-[18px]">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                          <Check size={16} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">{t('Additional Recording')} {index + 1}</span>
                          <button 
                            onClick={() => {
                              const a = new Audio(audio);
                              a.play();
                            }}
                            className="flex items-center gap-1 text-accent text-[9px] font-bold uppercase mt-1 hover:underline"
                          >
                            <Play size={10} fill="currentColor" />
                            {t('Play audio')}
                          </button>
                        </div>
                      </div>
                      <button 
                        onClick={() => setAdditionalContents(prev => prev.filter(c => c !== audio))}
                        className="text-red-500/50 hover:text-red-500 text-[10px] font-bold uppercase"
                      >
                        {t('Discard')}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Map Selection */}
              {type !== 'note' && (
                <div className="flex flex-col gap-3 mt-1">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[10px] font-bold text-muted-text uppercase tracking-widest">{t('Add to Category')}</span>
                    {maps.length === 0 && <span className="text-[8px] text-accent/50 italic capitalize">{t('No categories')}</span>}
                  </div>
                  <div className="custom-scrollbar custom-scrollbar-h mt-1">
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
              )}

              {/* Reminder Date Selector */}
              {type !== 'note' && (
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
              )}

            </div>

            <button
               onClick={handleSave}
               disabled={(type === 'voice' && !audioContent && !isRecording) || (type === 'video' && !content && !isRecordingVideo)}
               className={`w-full font-extrabold py-4 rounded-[16px] flex items-center justify-between px-6 transition-all shadow-[0_4px_15px_rgba(255,208,0,0.2)] ${
                 ((type === 'voice' && !audioContent && !isRecording) || (type === 'video' && !content && !isRecordingVideo))
                   ? 'bg-muted-text/20 text-muted-text cursor-not-allowed scale-[0.98]' 
                   : ((isRecording || isRecordingVideo) ? 'bg-accent/80 text-black animate-pulse' : 'bg-accent text-black active:scale-95 hover:bg-[#ffe14d]')
               }`}
            >
              <span>{(isRecording || isRecordingVideo) ? t('RECORDING IN PROGRESS...') : (editCapture ? t('UPDATE REMINDER') : t('SAVE REMINDER'))}</span>
              <ArrowRight size={20} strokeWidth={3} />
            </button>
              </>
            )}
          </div>
        </motion.div>
      </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
