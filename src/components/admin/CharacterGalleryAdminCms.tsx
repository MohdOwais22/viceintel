import React, { useState, useEffect } from 'react';
import {
  Users,
  Image as ImageIcon,
  Edit3,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  Sparkles,
  Save,
  X,
  Link,
  Upload,
  RotateCcw,
  FileImage
} from 'lucide-react';
import { Character, CharacterRole } from '../../types';
import {
  getStoredCharacters,
  saveOrUpdateCharacter,
  deleteCharacter,
  resetCharactersToDefault,
  CHARACTERS_UPDATED_EVENT
} from '../../lib/characterStore';
import { logStaffActivity } from '../../lib/staffAuditLogger';

/**
 * Helper to process and compress local image files uploaded from user's PC into base64 Data URLs.
 */
const processLocalImageFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Selected file is not an image'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) {
        reject(new Error('Failed to read image file'));
        return;
      }
      
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH || height > MAX_HEIGHT) {
          if (width > height) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          } else {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
          resolve(compressedDataUrl);
        } else {
          resolve(result);
        }
      };
      img.onerror = () => resolve(result);
      img.src = result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

export const CharacterGalleryAdminCms: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [notice, setNotice] = useState<string | null>(null);

  // Edit/Create Modal State
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [isNewCharacter, setIsNewCharacter] = useState<boolean>(false);
  const [quickImageModalChar, setQuickImageModalChar] = useState<Character | null>(null);
  const [quickImageUrlInput, setQuickImageUrlInput] = useState<string>('');

  // Form Fields State
  const [formData, setFormData] = useState<Partial<Character>>({});
  const [traitsInput, setTraitsInput] = useState<string>('');

  const loadCharacters = async () => {
    setIsLoading(true);
    try {
      const data = await getStoredCharacters();
      setCharacters(data);
    } catch (err) {
      console.error('Error loading characters in admin CMS:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCharacters();

    const handleUpdate = () => {
      loadCharacters();
    };
    if (typeof window !== 'undefined') {
      window.addEventListener(CHARACTERS_UPDATED_EVENT, handleUpdate);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(CHARACTERS_UPDATED_EVENT, handleUpdate);
      }
    };
  }, []);

  const showNotification = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 4000);
  };

  const openCreateModal = () => {
    const newId = `c_${Date.now()}`;
    setFormData({
      id: newId,
      slug: `character-${Date.now()}`,
      name: '',
      role: 'Supporting',
      faction: 'Vice City Independent',
      description: '',
      imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1000&q=80',
      status: 'Active',
      firstAppeared: 'GTA VI Reveal Trailer',
      keyTraits: ['Outlaw', 'Strategist'],
      location: 'Vice City Metro',
      relationship: 'Unknown',
      heistRole: 'Operative',
      socialHandle: '@ViceCityCitizen',
      voiceActor: '',
      specialAbility: '',
      realTrailerVisual: '',
      trailerFrameDesc: ''
    });
    setTraitsInput('Outlaw, Strategist');
    setIsNewCharacter(true);
    setEditingCharacter({ id: newId } as Character);
  };

  const openEditModal = (char: Character) => {
    setFormData({ ...char });
    setTraitsInput(char.keyTraits ? char.keyTraits.join(', ') : '');
    setIsNewCharacter(false);
    setEditingCharacter(char);
  };

  const openQuickImageModal = (char: Character) => {
    setQuickImageModalChar(char);
    setQuickImageUrlInput(char.imageUrl || '');
  };

  const handleSaveQuickImage = async () => {
    if (!quickImageModalChar) return;
    try {
      const updated: Character = {
        ...quickImageModalChar,
        imageUrl: quickImageUrlInput.trim() || quickImageModalChar.imageUrl
      };
      await saveOrUpdateCharacter(updated);
      showNotification(`Updated image for "${updated.name}" successfully!`);
      setQuickImageModalChar(null);

      logStaffActivity({
        actionType: 'CMS_CONTENT_UPDATE',
        actionCategory: 'Content CMS',
        targetId: updated.id,
        targetName: updated.name,
        targetType: 'character_image',
        severity: 'MEDIUM',
        details: `Staff updated image for character ${updated.name}`
      }).catch(() => {});
    } catch (err) {
      console.error('Failed to update character image:', err);
      showNotification('Error updating character image.');
    }
  };

  const handleSaveCharacterForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.imageUrl) {
      showNotification('Please provide a character name and image.');
      return;
    }

    try {
      const traitsArray = traitsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const finalChar: Character = {
        id: formData.id || `c_${Date.now()}`,
        slug: formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        name: formData.name,
        role: (formData.role as CharacterRole) || 'Supporting',
        faction: formData.faction || 'Vice City Independent',
        description: formData.description || '',
        imageUrl: formData.imageUrl,
        status: (formData.status as any) || 'Active',
        firstAppeared: formData.firstAppeared || 'Trailer 1 (December 2023)',
        keyTraits: traitsArray.length > 0 ? traitsArray : ['Versatile'],
        voiceActor: formData.voiceActor || '',
        specialAbility: formData.specialAbility || '',
        location: formData.location || '',
        relationship: formData.relationship || '',
        heistRole: formData.heistRole || '',
        socialHandle: formData.socialHandle || '',
        leonidaQuote: formData.leonidaQuote || '',
        leonidaMoment: formData.leonidaMoment || '',
        realTrailerVisual: formData.realTrailerVisual || '',
        trailerFrameDesc: formData.trailerFrameDesc || ''
      };

      await saveOrUpdateCharacter(finalChar);
      showNotification(`Character "${finalChar.name}" saved successfully!`);
      setEditingCharacter(null);

      logStaffActivity({
        actionType: isNewCharacter ? 'CMS_CONTENT_CREATE' : 'CMS_CONTENT_UPDATE',
        actionCategory: 'Content CMS',
        targetId: finalChar.id,
        targetName: finalChar.name,
        targetType: 'character',
        severity: 'MEDIUM',
        details: isNewCharacter
          ? `Staff created new character profile: ${finalChar.name}`
          : `Staff updated character profile details for ${finalChar.name}`
      }).catch(() => {});
    } catch (err) {
      console.error('Error saving character:', err);
      showNotification('Failed to save character profile.');
    }
  };

  // Confirmation modal states
  const [deleteTarget, setDeleteTarget] = useState<Character | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  const confirmDeleteCharacter = async () => {
    if (!deleteTarget) return;
    const char = deleteTarget;
    setDeleteTarget(null);
    try {
      const updated = await deleteCharacter(char.id);
      setCharacters(updated);
      showNotification(`Character "${char.name}" deleted.`);

      logStaffActivity({
        actionType: 'CMS_CONTENT_DELETE',
        actionCategory: 'Content CMS',
        targetId: char.id,
        targetName: char.name,
        targetType: 'character',
        severity: 'HIGH',
        details: `Staff deleted character ${char.name} from gallery`
      }).catch(() => {});
    } catch (err) {
      console.error('Error deleting character:', err);
      showNotification('Error deleting character.');
    }
  };

  const confirmResetToDefault = async () => {
    setShowResetConfirm(false);
    try {
      const updated = await resetCharactersToDefault();
      setCharacters(updated);
      showNotification('Reset character gallery to Rockstar default dataset!');

      logStaffActivity({
        actionType: 'SYSTEM_CONFIG_CHANGE',
        actionCategory: 'Content CMS',
        targetId: 'all_characters',
        targetName: 'Character Gallery',
        targetType: 'dataset_reset',
        severity: 'HIGH',
        details: 'Staff reset character gallery to default static Rockstar data'
      }).catch(() => {});
    } catch (err) {
      console.error('Failed to reset characters:', err);
      showNotification('Error resetting character gallery.');
    }
  };

  const filtered = characters.filter((c) => {
    const matchesQuery =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.faction.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.socialHandle && c.socialHandle.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = roleFilter === 'All' || c.role === roleFilter;
    return matchesQuery && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* CMS Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-pink-950/80 via-purple-950/90 to-zinc-950 border border-pink-500/30 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-pink-500 text-white shadow-lg shadow-pink-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> Executive CMS Control
            </span>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold text-pink-300 bg-pink-950/90 border border-pink-700/50">
              {characters.length} Active Profiles
            </span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-pink-400" />
            <span>GTA VI Character Gallery &amp; Local PC Image CMS</span>
          </h2>
          <p className="text-xs text-zinc-300 leading-relaxed max-w-2xl">
            Upload character photos directly from your local PC or paste image URLs. All updates sync live across the community gallery.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <button
            onClick={openCreateModal}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white text-xs font-black shadow-xl shadow-pink-600/30 flex items-center justify-center gap-2 border border-pink-400/40 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Character</span>
          </button>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-3 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-bold border border-zinc-700 flex items-center justify-center gap-1.5 transition"
            title="Reset gallery to default dataset"
          >
            <RotateCcw className="w-3.5 h-3.5 text-pink-400" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Toast Notice */}
      {notice && (
        <div className="p-4 rounded-2xl bg-pink-950/90 border border-pink-500/50 text-pink-200 text-xs font-bold flex items-center gap-2 shadow-xl animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-pink-400 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search characters, factions, handles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['All', 'Protagonist', 'Supporting', 'Antagonist', 'Faction Boss', 'Law Enforcement'].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                roleFilter === role
                  ? 'bg-pink-600 text-white shadow-lg shadow-pink-600/30'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Character Cards Gallery Grid */}
      {isLoading ? (
        <div className="p-12 text-center text-zinc-400 text-xs font-bold flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-pink-500" />
          <span>Loading character gallery...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-zinc-900/50 rounded-3xl border border-zinc-800 text-zinc-400 space-y-2">
          <Users className="w-10 h-10 mx-auto text-zinc-600" />
          <p className="text-sm font-bold text-white">No characters found</p>
          <p className="text-xs">Try clearing search filters or add a new character profile.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((char) => (
            <div
              key={char.id}
              className="group bg-zinc-900/90 border border-zinc-800 rounded-3xl overflow-hidden hover:border-pink-500/50 transition-all duration-300 shadow-xl flex flex-col justify-between"
            >
              <div>
                {/* Character Banner Image Preview */}
                <div className="relative h-52 w-full bg-zinc-950 overflow-hidden">
                  <img
                    src={char.imageUrl}
                    alt={char.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1000&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-black/40" />

                  {/* Role Badge */}
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-pink-600/90 text-white backdrop-blur-md shadow-md">
                    {char.role}
                  </span>

                  {/* Status Tag */}
                  <span className="absolute top-3 right-3 px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-950/80 text-zinc-300 border border-zinc-700/80 backdrop-blur-md">
                    {char.status}
                  </span>

                  {/* Quick Change Image Floating Button */}
                  <button
                    onClick={() => openQuickImageModal(char)}
                    className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl bg-pink-600/90 hover:bg-pink-500 text-white text-[11px] font-black shadow-lg shadow-pink-600/40 backdrop-blur-md flex items-center gap-1.5 transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload / Change Photo</span>
                  </button>
                </div>

                {/* Character Meta Header */}
                <div className="p-5 space-y-3">
                  <div className="space-y-0.5">
                    <h3 className="text-lg font-black text-white group-hover:text-pink-400 transition">
                      {char.name}
                    </h3>
                    <p className="text-xs text-pink-400 font-medium">{char.faction}</p>
                    {char.socialHandle && (
                      <p className="text-[10px] text-zinc-500 font-mono">{char.socialHandle}</p>
                    )}
                  </div>

                  <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed bg-zinc-950/60 p-3 rounded-2xl border border-zinc-800/80">
                    {char.description}
                  </p>

                  {/* Trait tags */}
                  {char.keyTraits && char.keyTraits.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {char.keyTraits.slice(0, 3).map((trait, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-zinc-950 text-zinc-400 border border-zinc-800"
                        >
                          #{trait}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-zinc-950/80 border-t border-zinc-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => openQuickImageModal(char)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Upload className="w-3.5 h-3.5 text-pink-400" />
                  <span>Upload Image</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(char)}
                    className="px-3 py-1.5 rounded-xl bg-pink-950/80 hover:bg-pink-900 border border-pink-700/60 text-pink-300 hover:text-white text-xs font-bold flex items-center gap-1 transition"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                  <button
                    onClick={() => setDeleteTarget(char)}
                    className="p-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-400 hover:text-white transition"
                    title="Delete Character"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QUICK LOCAL PC IMAGE UPLOAD MODAL */}
      {quickImageModalChar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setQuickImageModalChar(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase text-pink-400 bg-pink-950 border border-pink-800/50">
                Local PC Photo Upload
              </span>
              <h3 className="text-xl font-black text-white">Upload Photo for {quickImageModalChar.name}</h3>
              <p className="text-xs text-zinc-400">
                Upload an image directly from your computer files or paste a direct image URL.
              </p>
            </div>

            {/* Live Image Preview */}
            <div className="relative h-48 w-full bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800">
              <img
                src={quickImageUrlInput || quickImageModalChar.imageUrl}
                alt="Preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1000&q=80';
                }}
              />
              <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-black/80 text-white backdrop-blur-md">
                Live Image Preview
              </span>
            </div>

            {/* PC File Upload Button Zone */}
            <div className="space-y-3">
              <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-pink-500/50 hover:border-pink-400 rounded-2xl cursor-pointer bg-zinc-950/80 hover:bg-zinc-900 transition text-center p-4 group">
                <Upload className="w-6 h-6 text-pink-400 group-hover:scale-110 transition-transform mb-1.5" />
                <span className="text-xs font-black text-white">Click to Upload Image File from Your PC</span>
                <span className="text-[10px] text-zinc-400 mt-0.5">Supports PNG, JPG, WEBP (Auto-optimized for web)</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        const dataUrl = await processLocalImageFile(file);
                        setQuickImageUrlInput(dataUrl);
                        showNotification(`Successfully loaded image "${file.name}" from your PC!`);
                      } catch (err) {
                        console.error('File upload error:', err);
                        showNotification('Could not read image file from PC.');
                      }
                    }
                  }}
                />
              </label>

              <div>
                <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                  Or Paste Image URL (Optional)
                </label>
                <div className="relative">
                  <Link className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={quickImageUrlInput}
                    onChange={(e) => setQuickImageUrlInput(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setQuickImageModalChar(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveQuickImage}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white text-xs font-black shadow-lg shadow-pink-600/30 flex items-center gap-1.5 transition"
              >
                <Save className="w-4 h-4" />
                <span>Save Image</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL CHARACTER EDIT/CREATE MODAL */}
      {editingCharacter && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md p-4 sm:p-6 flex items-center justify-center min-h-screen">
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-3xl max-w-3xl w-full shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
            <div className="p-6 bg-gradient-to-r from-pink-950 to-zinc-950 border-b border-zinc-800 flex items-center justify-between shrink-0">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-pink-400">
                  {isNewCharacter ? 'Create New Character' : 'Edit Character Dossier'}
                </span>
                <h3 className="text-xl font-black text-white">
                  {formData.name || 'Untitled Character'}
                </h3>
              </div>
              <button
                onClick={() => setEditingCharacter(null)}
                className="p-2 rounded-full bg-zinc-800 text-zinc-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCharacterForm} className="p-6 space-y-5 overflow-y-auto flex-1">
              {/* Image Preview & PC Upload Zone */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-1 space-y-2">
                  <label className="text-xs font-bold text-zinc-300 block">Character Photo Preview</label>
                  <div className="relative h-44 w-full bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800">
                    <img
                      src={formData.imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1000&q=80';
                      }}
                    />
                  </div>
                </div>

                <div className="sm:col-span-2 space-y-3">
                  <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-pink-500/50 hover:border-pink-400 rounded-2xl cursor-pointer bg-zinc-950/80 hover:bg-zinc-900 transition text-center p-4 group">
                    <Upload className="w-6 h-6 text-pink-400 group-hover:scale-110 transition-transform mb-1.5" />
                    <span className="text-xs font-black text-white">Upload Character Photo from PC</span>
                    <span className="text-[10px] text-zinc-400 mt-0.5">Click to browse your computer files</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const dataUrl = await processLocalImageFile(file);
                            setFormData(prev => ({ ...prev, imageUrl: dataUrl }));
                            showNotification(`Loaded "${file.name}" from your PC!`);
                          } catch (err) {
                            console.error('File upload error:', err);
                            showNotification('Error reading image file from PC.');
                          }
                        }
                      }}
                    />
                  </label>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-400 block mb-1">
                      Or Image URL / Base64 string
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.imageUrl || ''}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="https://... or data:image/..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500"
                    />
                  </div>
                </div>
              </div>

              {/* Main Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Character Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Lucia Caminos"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Role *</label>
                  <select
                    value={formData.role || 'Supporting'}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                  >
                    <option value="Protagonist">Protagonist</option>
                    <option value="Supporting">Supporting</option>
                    <option value="Antagonist">Antagonist</option>
                    <option value="Faction Boss">Faction Boss</option>
                    <option value="Law Enforcement">Law Enforcement</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Faction / Organization</label>
                  <input
                    type="text"
                    value={formData.faction || ''}
                    onChange={(e) => setFormData({ ...formData, faction: e.target.value })}
                    placeholder="e.g. Vice City Outlaws"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Status</label>
                  <select
                    value={formData.status || 'Active'}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Alive">Alive</option>
                    <option value="In Custody">In Custody</option>
                    <option value="Unknown">Unknown</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Voice Actor / Performer</label>
                  <input
                    type="text"
                    value={formData.voiceActor || ''}
                    onChange={(e) => setFormData({ ...formData, voiceActor: e.target.value })}
                    placeholder="e.g. Manni L. Perez"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Social Handle</label>
                  <input
                    type="text"
                    value={formData.socialHandle || ''}
                    onChange={(e) => setFormData({ ...formData, socialHandle: e.target.value })}
                    placeholder="e.g. @LuciaCaminosVC"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">Biography &amp; Dossier Summary</label>
                <textarea
                  rows={3}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed character biography..."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* Key Traits */}
              <div>
                <label className="text-xs font-bold text-zinc-300 block mb-1">
                  Key Traits (Comma Separated)
                </label>
                <input
                  type="text"
                  value={traitsInput}
                  onChange={(e) => setTraitsInput(e.target.value)}
                  placeholder="Getaway Driver, Cunning Strategist, Lockpicker"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                />
              </div>

              {/* Rockstar Official Trailer Frame Match */}
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-800 space-y-3">
                <span className="text-xs font-black uppercase text-amber-400 block">
                  Rockstar Official Trailer Breakdown
                </span>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Real Trailer Visual Notes</label>
                  <input
                    type="text"
                    value={formData.realTrailerVisual || ''}
                    onChange={(e) => setFormData({ ...formData, realTrailerVisual: e.target.value })}
                    placeholder="Rockstar Official Trailer 1 [0:04]: Lucia in Leonida State Penitentiary..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-300 block mb-1">Shot Composition &amp; Attire</label>
                  <input
                    type="text"
                    value={formData.trailerFrameDesc || ''}
                    onChange={(e) => setFormData({ ...formData, trailerFrameDesc: e.target.value })}
                    placeholder="Orange prison uniform in counseling office..."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingCharacter(null)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-purple-600 text-white text-xs font-black shadow-lg shadow-pink-600/30 flex items-center gap-1.5 transition"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Character Profile</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-zinc-900 border border-rose-900/60 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="w-12 h-12 rounded-2xl bg-rose-950 border border-rose-800 flex items-center justify-center text-rose-400">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-white">Delete Character Profile?</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Are you sure you want to remove <strong className="text-rose-300">"{deleteTarget.name}"</strong> from the gallery database? This action will remove the document from Cloud Firestore.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteCharacter}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-lg shadow-rose-600/30 flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM RESET TO DEFAULT MODAL */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-zinc-900 border border-amber-900/60 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <div className="w-12 h-12 rounded-2xl bg-amber-950 border border-amber-800 flex items-center justify-center text-amber-400">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-lg font-black text-white">Reset Gallery to Defaults?</h3>
              <p className="text-xs text-zinc-400 mt-1">
                This will reset the entire character gallery back to the default Rockstar Games character dataset and purge custom entries from Cloud Firestore.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmResetToDefault}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black shadow-lg shadow-amber-600/30 flex items-center gap-1.5 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Confirm Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
