import { create } from "zustand";

interface StoreState {
  // Add your state properties here
}

export const useStore = create<StoreState>((set) => ({
  // Add your initial state and actions here
}));
