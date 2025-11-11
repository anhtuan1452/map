import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ConservationStatus = 'critical' | 'watch' | 'good';

export interface Place {
  id: string;
  site_id: string;
  name: string;
  lat: number;
  lng: number;
  thumbnail?: string;
  images?: string[];
  shortDescription: string;
  fullDescription?: string;
  conservation: {
    status: ConservationStatus;
    note?: string;
    updatedAt?: string;
  };
  conduct?: {
    dos: string[];
    donts: string[];
    lawExcerpt?: string;
    lawLink?: string;
  };
  quizIds?: string[];
  tags?: string[];
}

interface PlacesState {
  places: Place[];
  selectedPlaceId: string | null;
  isDrawerOpen: boolean;
  activeTab: 'intro' | 'conduct' | 'status' | 'quiz' | 'gamification' | 'comments';
  
  setPlaces: (places: Place[]) => void;
  selectPlace: (id: string | null) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  setActiveTab: (tab: 'intro' | 'conduct' | 'status' | 'quiz' | 'gamification' | 'comments') => void;
  getSelectedPlace: () => Place | null;
}

export const usePlacesStore = create<PlacesState>((set, get) => ({
  places: [],
  selectedPlaceId: null,
  isDrawerOpen: false,
  activeTab: 'intro',
  
  setPlaces: (places) => set({ places }),
  
  selectPlace: (id) => set({ 
    selectedPlaceId: id,
    isDrawerOpen: id !== null,
    activeTab: 'intro' // Reset to intro tab when selecting new place
  }),
  
  openDrawer: () => set({ isDrawerOpen: true }),
  closeDrawer: () => set({ isDrawerOpen: false, selectedPlaceId: null }),
  
  setActiveTab: (tab) => set({ activeTab: tab }),
  
  getSelectedPlace: () => {
    const { places, selectedPlaceId } = get();
    return places.find(p => p.id === selectedPlaceId) || null;
  },
}));
