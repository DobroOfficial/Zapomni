import fs from 'fs';

const file = 'src/components/CreateModal.tsx';
let content = fs.readFileSync(file, 'utf8');

const startStr = `              {(type === 'photo' || type === 'video') && (`;
const endIndexStr = `                  {/* Supplemental Data: Description and Voice Note */}`;

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endIndexStr);

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find boundaries! " + startIndex + " " + endIndex);
  process.exit(1);
}

const before = content.slice(0, startIndex);
const rest = content.slice(endIndex);

const NEW_CONTENT = `              {(type === 'photo' || type === 'video') && (() => {
                const allMedia = [content, ...additionalContents].filter(Boolean);
                const handleDeleteMedia = (index) => {
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

                return (
                  <div className="flex flex-col gap-4">
                    {allMedia.length > 0 ? (
                      <div className="flex flex-col gap-4">
                        <div className="relative w-full aspect-video bg-black rounded-[20px] overflow-hidden border border-[#222] flex items-center justify-center pt-2 pb-2 pl-2 pr-2">
                           {allMedia[0].startsWith('data:video/') ? (
                             <VideoPlayer src={allMedia[0]} />
                           ) : (
                             <img src={allMedia[0]} className="w-full h-full object-contain" />
                           )}
                           <button 
                             onClick={() => handleDeleteMedia(0)}
                             className="absolute top-4 right-4 bg-black/60 text-white rounded-full p-2 border border-white/20 active:scale-95 z-20"
                           >
                             <Trash2 size={16} />
                           </button>
                        </div>
                        
                        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
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
                             <div key={i} className="relative shrink-0 w-20 h-20 bg-black rounded-[14px] overflow-hidden border border-[#222]">
                               {media.startsWith('data:video/') ? (
                                 <video src={\`\${media}#t=0.001\`} className="w-full h-full object-cover" />
                               ) : (
                                 <img src={media} className="w-full h-full object-cover" />
                               )}
                               <button 
                                 onClick={() => handleDeleteMedia(i + 1)}
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
                  </div>
                );
              })()}`;

const theEndIndex = content.lastIndexOf('              )}', endIndex);
if(theEndIndex !== -1 && theEndIndex > startIndex) {
    content = before + NEW_CONTENT + '\\n\\n' + content.slice(endIndex);
    fs.writeFileSync(file, content);
    console.log("Replaced successfully!");
} else {
    console.log("Couldn't find ending brace");
}
