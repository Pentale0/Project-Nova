import React, { useState } from 'react';
import { StatInfo, MemoryPhoto } from '../../types';
import { Camera, Heart, Plus, Trash2, Calendar, Upload } from 'lucide-react';
import { playHoverSound, playSelectSound } from '../../utils/audio';

interface MemoriesTabProps {
  stat: StatInfo;
  photos: MemoryPhoto[];
  onAddPhoto: (caption: string, imageUrl: string) => void;
  onDeletePhoto: (id: string) => void;
  onLikePhoto: (id: string) => void;
}

const PRESET_PHOTOS = [
  {
    name: 'Coastal Azure Waters',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'High-Altitude Summit',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Metropolis Architecture',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
  },
  {
    name: 'Quiet Library Sanctuary',
    url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=600&q=80',
  },
];

export const MemoriesTab: React.FC<MemoriesTabProps> = ({
  stat,
  photos,
  onAddPhoto,
  onDeletePhoto,
  onLikePhoto,
}) => {
  const [caption, setCaption] = useState('');
  const [selectedPresetUrl, setSelectedPresetUrl] = useState(PRESET_PHOTOS[0].url);
  const [customUrl, setCustomUrl] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caption.trim()) return;
    playSelectSound();
    const finalUrl = customUrl.trim() || selectedPresetUrl;
    onAddPhoto(caption.trim(), finalUrl);
    setCaption('');
    setCustomUrl('');
    setShowUploadForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Banner - Bright Blue & White */}
      <div className="p-5 bg-[#002D80] border-3 border-white shadow-[6px_6px_0px_#001F5C] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 flex items-center justify-center bg-white text-[#002D80] text-xl font-black font-p3r border-2 border-[#001F5C] shadow-[3px_3px_0px_#001F5C]">
            {stat.rankName}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-white tracking-widest uppercase font-mono">
                MEMORIES FACULTY // LIFE PHOTOGRAPHY ARCHIVE
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase font-p3r">
              RANK {stat.rank} — {stat.title}
            </h2>
            <div className="text-xs text-white/80 font-mono">
              Progress: <strong className="text-white">{stat.xp}</strong> / {stat.nextThreshold} XP ({stat.percent}%) · <span className="text-white font-bold">{stat.counterLabel}</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            playSelectSound();
            setShowUploadForm(!showUploadForm);
          }}
          onMouseEnter={playHoverSound}
          className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#FF0055] text-[#002D80] hover:text-white font-p3r font-black text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer border-2 border-[#001F5C] shadow-[3px_3px_0px_#001F5C]"
        >
          <Camera className="w-4 h-4 stroke-[2.5]" />
          <span>{showUploadForm ? 'CLOSE UPLOAD' : 'UPLOAD PHOTO (+3 XP)'}</span>
        </button>
      </div>

      {/* Upload Form */}
      {showUploadForm && (
        <div className="p-5 bg-[#002D80] border-3 border-white shadow-[5px_5px_0px_#001F5C]">
          <div className="flex justify-between items-center mb-3 border-b-2 border-white/20 pb-2">
            <h3 className="text-xs font-black tracking-widest text-white uppercase font-p3r">
              UPLOAD NEW MEMORY PHOTO (+3 MEMORIES XP)
            </h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase font-bold text-white/80 mb-1">
                Choose Sample Life Scene or Enter Custom URL:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                {PRESET_PHOTOS.map((preset) => (
                  <div
                    key={preset.name}
                    onClick={() => {
                      setSelectedPresetUrl(preset.url);
                      setCustomUrl('');
                    }}
                    className={`relative cursor-pointer border-2 overflow-hidden p-1 transition-all ${
                      selectedPresetUrl === preset.url && !customUrl
                        ? 'border-white bg-[#001F5C] shadow-[3px_3px_0px_#001F5C]'
                        : 'border-white/30 opacity-70 hover:opacity-100 bg-[#001F5C]'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-16 object-cover"
                    />
                    <div className="text-[10px] text-center font-bold text-white mt-1 truncate">
                      {preset.name}
                    </div>
                  </div>
                ))}
              </div>

              <input
                type="text"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="Or paste external photo URL..."
                className="w-full px-3 py-1.5 bg-[#001F5C] border-2 border-white/60 text-xs text-white focus:border-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-white/80 mb-1">
                Memory Inscription / Caption:
              </label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="e.g. Morning sprint on coastal trail after finishing exam..."
                className="w-full px-3 py-2 bg-[#001F5C] border-2 border-white/60 text-xs text-white focus:border-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="px-5 py-2 bg-white hover:bg-[#FF0055] text-[#002D80] hover:text-white font-p3r font-black text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer border-2 border-[#001F5C] shadow-[3px_3px_0px_#001F5C]"
            >
              SAVE TO MEMORY ARCHIVE (+3 XP)
            </button>
          </form>
        </div>
      )}

      {/* Photo Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="group relative bg-[#002D80] hover:bg-[#0038A8] border-3 border-white shadow-[5px_5px_0px_#001F5C] transition-all duration-150 overflow-hidden"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-[#001F5C]">
              <img
                src={photo.imageUrl}
                alt={photo.caption}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            <div className="p-3.5 space-y-2">
              <p className="text-xs font-semibold text-white leading-relaxed line-clamp-2">
                "{photo.caption}"
              </p>

              <div className="flex justify-between items-center text-[10px] text-white/80 border-t-2 border-white/20 pt-2 font-mono">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-white" />
                  {photo.createdAt}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      playSelectSound();
                      onLikePhoto(photo.id);
                    }}
                    className="flex items-center gap-1 text-white hover:text-[#FF0055] transition-colors cursor-pointer"
                  >
                    <Heart className="w-3.5 h-3.5 fill-current" />
                    <span>{photo.likes}</span>
                  </button>

                  <button
                    onClick={() => {
                      playSelectSound();
                      onDeletePhoto(photo.id);
                    }}
                    className="text-white/70 hover:text-[#FF0055] transition-colors p-0.5 cursor-pointer"
                    title="Remove photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
