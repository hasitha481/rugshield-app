// src/stores/uiStore.ts
import { create } from 'zustand';

interface UIState {
  /** Desktop sidebar open/closed (collapses below md breakpoint anyway). */
  sidebarOpen: boolean;
  /** Mobile drawer open/closed. */
  mobileNavOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  toggleSidebar: () => void;
  setMobileNavOpen: (v: boolean) => void;
  toggleMobileNav: () => void;
  closeMobileNav: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  mobileNavOpen: false,
  setSidebarOpen: (v) => set({ sidebarOpen: v }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setMobileNavOpen: (v) => set({ mobileNavOpen: v }),
  toggleMobileNav: () => set((s) => ({ mobileNavOpen: !s.mobileNavOpen })),
  closeMobileNav: () => set({ mobileNavOpen: false }),
}));