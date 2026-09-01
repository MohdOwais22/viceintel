'use client';
import React, { useState, useEffect } from 'react';
import { CHARACTERS_DATA } from '../data/characters';
import { Character, CharacterRole } from '../types';
import { getStoredCharacters, CHARACTERS_UPDATED_EVENT } from '../lib/characterStore';
import { Users, Shield, Zap, Filter, Eye, ChevronLeft, ChevronRight, MapPin, Heart, X, Share2, Award, Film } from 'lucide-react';
import { AdSlot } from './ads';

interface CharactersTabProps {
  searchQuery: string;
  isLoading?: boolean;
}

const ITEMS_PER_PAGE = 6;

export const CharactersTab: React.FC<CharactersTabProps> = ({ searchQuery, isLoading = false }) => {
  const [charactersList, setCharactersList] = useState<Character[]>(CHARACTERS_DATA);
  const [selectedRole, setSelectedRole] = useState<CharacterRole | 'All'>('All');
  const [activeModalCharacter, setActiveModalCharacter] = useState<Character | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [copiedLink, setCopiedLink] = useState(false);

  // Check URL query parameters for ?page= or ?slug= on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const pageParam = params.get('page');
      if (pageParam) {
        const p = parseInt(pageParam, 10);
        if (!isNaN(p) && p > 0) {
          setCurrentPage(p);
        }
      }
      const slugParam = params.get('slug');
      if (slugParam) {
        const found = charactersList.find(c => c.slug === slugParam);
        if (found) {
          setActiveModalCharacter(found);
        }
      }
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, []);

  // Smooth scroll to top of characters section whenever page changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const topEl = document.getElementById('characters-section-top');
      if (topEl) {
        topEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [currentPage]);

  useEffect(() => {
    // Load characters from store (localforage / Firestore / defaults)
    const loadCharacters = async () => {
      try {
        const stored = await getStoredCharacters();
        if (stored && stored.length > 0) {
          setCharactersList(stored);
        }
      } catch (err) {
        console.warn('Failed to load stored characters, using static defaults:', err);
      }
    };

    loadCharacters();

    const handleUpdated = (e: Event) => {
      const customEvt = e as CustomEvent<Character[]>;
      if (customEvt.detail && Array.isArray(customEvt.detail)) {
        setCharactersList(customEvt.detail);
      } else {
        loadCharacters();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(CHARACTERS_UPDATED_EVENT, handleUpdated);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(CHARACTERS_UPDATED_EVENT, handleUpdated);
      }
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedRole]);

  const roles: (CharacterRole | 'All')[] = [
    'All',
    'Protagonist',
    'Supporting',
    'Antagonist',
    'Faction Boss',
    'Law Enforcement',
  ];

  const filteredCharacters = charactersList.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.faction.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.socialHandle && c.socialHandle.toLowerCase().includes(searchQuery.toLowerCase())) ||
      c.keyTraits.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesRole = selectedRole === 'All' || c.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(filteredCharacters.length / ITEMS_PER_PAGE) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * ITEMS_PER_PAGE;
  const paginatedCharacters = filteredCharacters.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    if (typeof window !== 'undefined') {
      const topEl = document.getElementById('characters-section-top');
      if (topEl) {
        topEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleShare = (character: Character) => {
    const shareUrl = `${window.location.origin}/characters?slug=${character.slug}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div id="characters-section-top" className="space-y-6">
      {/* Top Banner Leaderboard Ad */}
      <div className="w-full my-3 sm:my-5 px-1 sm:px-2 grid grid-cols-1 place-items-center min-h-[100px] overflow-hidden transition-all">
        <AdSlot
          slotType="leaderboard"
          position="inline"
          refreshIntervalSeconds={60}
          fallbackContent={
            <div className="p-3 text-center w-full bg-zinc-950/80 rounded-xl border border-zinc-800">
              <span className="text-xs font-bold text-rose-400">GTA VI Vice City Characters &amp; Syndicate Intelligence</span>
              <p className="text-[11px] text-zinc-400">Official trailer dossiers, heist roles, and special ability profiles.</p>
            </div>
          }
        />
      </div>

      {/* Role Filter Pills */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-2 sm:pb-0 scrollbar-none">
          <Filter className="w-4 h-4 text-zinc-400 mr-1 shrink-0" />
          {roles.map((role) => (
            <button
              key={role}
              onClick={() => {
                setSelectedRole(role);
                handlePageChange(1);
              }}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedRole === role
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20 font-bold'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Character Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[550px]">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl h-80 animate-pulse p-4 space-y-4">
              <div className="h-40 bg-zinc-800/60 rounded-xl" />
              <div className="h-4 bg-zinc-700/80 rounded w-2/3" />
              <div className="h-3 bg-zinc-800 rounded w-full" />
            </div>
          ))
        ) : (
          paginatedCharacters.map((character) => (
            <div
              key={character.id}
              className="group bg-zinc-900/80 border border-zinc-800/90 hover:border-pink-500/50 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-pink-500/10 flex flex-col justify-between"
            >
              {/* Header Image & Avatar Banner */}
              <div className="relative h-48 w-full bg-zinc-950 overflow-hidden shrink-0">
                <img
                  src={character.imageUrl}
                  alt={character.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 opacity-70"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />

                {/* Role Badge */}
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className={`px-2.5 py-1 text-[10px] font-black uppercase rounded-md backdrop-blur-md border ${
                    character.role === 'Protagonist'
                      ? 'bg-rose-600/90 text-white border-rose-400/40'
                      : character.role === 'Antagonist'
                      ? 'bg-purple-600/90 text-white border-purple-400/40'
                      : character.role === 'Law Enforcement'
                      ? 'bg-blue-600/90 text-white border-blue-400/40'
                      : 'bg-amber-600/90 text-white border-amber-400/40'
                  }`}>
                    {character.role}
                  </span>
                  {character.socialHandle && (
                    <span className="px-2 py-1 text-[10px] font-bold text-pink-300 bg-pink-950/80 rounded-md border border-pink-600/40 backdrop-blur-md">
                      {character.socialHandle}
                    </span>
                  )}
                </div>

                {/* Status Indicator */}
                <div className="absolute top-3 right-3">
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-zinc-900/90 text-emerald-400 border border-emerald-500/30 backdrop-blur-md flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {character.status}
                  </span>
                </div>
              </div>

              {/* Card Body Details */}
              <div className="p-5 pt-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-white group-hover:text-pink-400 transition-colors">
                      {character.name}
                    </h3>
                  </div>
                  <p className="text-xs font-semibold text-rose-300 flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5 text-pink-400" />
                    {character.faction}
                  </p>

                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {character.description}
                  </p>
                </div>

                {/* Special Ability & Key Traits */}
                {character.specialAbility && (
                  <div className="p-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                      <Zap className="w-3.5 h-3.5 shrink-0" />
                      <span>{character.specialAbility}</span>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5">
                  {character.keyTraits.map((trait, i) => (
                    <span key={i} className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700/60">
                      #{trait}
                    </span>
                  ))}
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setActiveModalCharacter(character)}
                    className="flex-1 py-2 px-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-pink-600/20"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect Dossier</span>
                  </button>
                  <button
                    onClick={() => handleShare(character)}
                    className="py-2 px-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium rounded-xl text-xs transition border border-zinc-700/80 flex items-center gap-1"
                    title="Copy Character Link"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {filteredCharacters.length === 0 && (
        <div className="text-center py-12 bg-zinc-900/40 rounded-2xl border border-zinc-800 text-zinc-400">
          <Users className="w-10 h-10 mx-auto text-zinc-600 mb-2" />
          <p className="text-sm">No characters matched your criteria.</p>
        </div>
      )}

      {/* Pagination Controls */}
      {filteredCharacters.length > 0 && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-xs text-zinc-400">
          <div>
            Showing <span className="font-bold text-white">{startIndex + 1}</span> to{' '}
            <span className="font-bold text-white">
              {Math.min(startIndex + ITEMS_PER_PAGE, filteredCharacters.length)}
            </span>{' '}
            of <span className="font-bold text-rose-400">{filteredCharacters.length}</span> dossiers
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(Math.max(1, safeCurrentPage - 1))}
              disabled={safeCurrentPage === 1}
              className="p-2 rounded-xl bg-zinc-800 border border-zinc-700/80 text-zinc-200 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`w-8 h-8 rounded-xl font-bold transition flex items-center justify-center ${
                      safeCurrentPage === pageNum
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => handlePageChange(Math.min(totalPages, safeCurrentPage + 1))}
              disabled={safeCurrentPage === totalPages}
              className="p-2 rounded-xl bg-zinc-800 border border-zinc-700/80 text-zinc-200 hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {copiedLink && (
        <div className="fixed bottom-6 right-6 z-50 bg-rose-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xl animate-fade-in flex items-center gap-2">
          <Share2 className="w-4 h-4" />
          <span>Character dossier link copied to clipboard!</span>
        </div>
      )}

      {/* Character Dossier Modal */}
      {activeModalCharacter && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md p-4 sm:p-6 flex items-center justify-center min-h-screen">
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col">
            {/* Modal Header Banner */}
            <div className="relative h-48 sm:h-56 w-full bg-zinc-950 overflow-hidden shrink-0">
              <img
                src={activeModalCharacter.imageUrl}
                alt={activeModalCharacter.name}
                className="w-full h-full object-cover opacity-60"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/60 to-transparent" />

              <button
                onClick={() => setActiveModalCharacter(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-zinc-950/80 text-zinc-400 hover:text-white border border-zinc-800 transition z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute bottom-4 left-6 flex items-end gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 text-[10px] font-black uppercase rounded bg-pink-600 text-white border border-pink-400">
                      {activeModalCharacter.role}
                    </span>
                    {activeModalCharacter.socialHandle && (
                      <span className="px-2.5 py-1 text-[10px] font-bold text-pink-300 bg-pink-950/80 rounded border border-pink-700/60">
                        {activeModalCharacter.socialHandle}
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-black text-white mt-1">{activeModalCharacter.name}</h2>
                  <p className="text-xs text-pink-300 font-semibold">{activeModalCharacter.faction}</p>
                </div>
              </div>
            </div>

            {/* Modal Content Details - Smooth Scrollable Container */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Biography &amp; Dossier Summary</h4>
                <p className="text-sm text-zinc-200 leading-relaxed bg-zinc-950/60 p-4 rounded-2xl border border-zinc-800">
                  {activeModalCharacter.description}
                </p>
              </div>

              {/* Grid Attributes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {activeModalCharacter.voiceActor && (
                  <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 space-y-1">
                    <span className="text-zinc-400 block font-medium">Voice Actor / Performer</span>
                    <strong className="text-white text-sm block">{activeModalCharacter.voiceActor}</strong>
                  </div>
                )}

                {activeModalCharacter.specialAbility && (
                  <div className="p-3 bg-zinc-950/80 rounded-xl border border-rose-500/30 space-y-1">
                    <span className="text-amber-400 block font-medium flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" /> Special Ability
                    </span>
                    <strong className="text-white text-sm block">{activeModalCharacter.specialAbility}</strong>
                  </div>
                )}

                {activeModalCharacter.location && (
                  <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 space-y-1">
                    <span className="text-zinc-400 block font-medium flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" /> Primary Location
                    </span>
                    <strong className="text-white text-sm block">{activeModalCharacter.location}</strong>
                  </div>
                )}

                {activeModalCharacter.relationship && (
                  <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 space-y-1">
                    <span className="text-zinc-400 block font-medium flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-pink-400" /> Relationship &amp; Affiliation
                    </span>
                    <strong className="text-white text-sm block">{activeModalCharacter.relationship}</strong>
                  </div>
                )}

                {activeModalCharacter.heistRole && (
                  <div className="p-3 bg-zinc-950/80 rounded-xl border border-zinc-800 space-y-1 sm:col-span-2">
                    <span className="text-zinc-400 block font-medium flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-emerald-400" /> Tactical Heist Specialization
                    </span>
                    <strong className="text-emerald-300 text-sm block">{activeModalCharacter.heistRole}</strong>
                  </div>
                )}
              </div>

              {/* Key Traits */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">Key Tactical Traits</h4>
                <div className="flex flex-wrap gap-2">
                  {activeModalCharacter.keyTraits.map((trait, i) => (
                    <span key={i} className="px-3 py-1 text-xs font-bold rounded-xl bg-zinc-800 text-zinc-200 border border-zinc-700">
                      #{trait}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex justify-end shrink-0">
              <button
                onClick={() => setActiveModalCharacter(null)}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-lg shadow-rose-600/20"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


