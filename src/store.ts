import { create } from 'zustand'

type AppState = {
  mode: 'TREE' | 'EXPLODE'
  setMode: (mode: 'TREE' | 'EXPLODE') => void
  toggleMode: () => void
  
  interactionMode: 'MOUSE' | 'GESTURE'
  setInteractionMode: (mode: 'MOUSE' | 'GESTURE') => void
  
  hasStarted: boolean
  setStarted: (started: boolean) => void
  
  rotationSpeed: number
  targetRotationY: number
  setTargetRotationY: (y: number) => void
  
  targetDistance: number // For Zoom
  setTargetDistance: (d: number) => void

  audioPlaying: boolean
  toggleAudio: () => void

  isAwake: boolean
  setAwake: (awake: boolean) => void
}

export const useStore = create<AppState>((set) => ({
  mode: 'EXPLODE', // Start as scattered
  setMode: (mode) => set({ mode }),
  toggleMode: () => set((state) => ({ mode: state.mode === 'TREE' ? 'EXPLODE' : 'TREE' })),
  
  interactionMode: 'MOUSE',
  setInteractionMode: (mode) => set({ interactionMode: mode }),
  
  hasStarted: false,
  setStarted: (started) => set({ hasStarted: started }),
  
  rotationSpeed: 0.2,
  targetRotationY: 0,
  setTargetRotationY: (y) => set({ targetRotationY: y }),
  
  targetDistance: 12, // Default distance
  setTargetDistance: (d) => set({ targetDistance: d }),

  audioPlaying: false,
  toggleAudio: () => set((state) => ({ audioPlaying: !state.audioPlaying })),

  isAwake: false,
  setAwake: (awake) => set({ isAwake: awake }),
}))
