import { useEffect, useRef, useState } from 'react'
import Webcam from 'react-webcam'
import { FilesetResolver, GestureRecognizer } from '@mediapipe/tasks-vision'
import { useStore } from '../../store'
import { clsx } from 'clsx'
import * as THREE from 'three'

export function GestureController() {
  const webcamRef = useRef<Webcam>(null)
  const [recognizer, setRecognizer] = useState<GestureRecognizer | null>(null)
  const [loaded, setLoaded] = useState(false)
  const requestRef = useRef<number>()
  
  // Store
  const interactionMode = useStore((state) => state.interactionMode)
  const setMode = useStore((state) => state.setMode)
  const setTargetRotationY = useStore((state) => state.setTargetRotationY)
  const setTargetDistance = useStore((state) => state.setTargetDistance)
  
  // Cursor State (Direct DOM manipulation for performance)
  const cursorRef = useRef<HTMLDivElement>(null)
  const smoothCursor = useRef(new THREE.Vector2(0, 0))
  const lastVideoTime = useRef(-1)

  // Zoom State (Pinch & Drag)
  const isPinching = useRef(false)
  const pinchStartY = useRef<number>(0)
  const pinchStartDist = useRef<number>(12)
  const currentDistRef = useRef<number>(12)

  // Mode Switch Debounce
  const gestureHistory = useRef<string[]>([])
  
  // Load model
  useEffect(() => {
    const load = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.9/wasm"
        )
        const gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 2,
          minHandDetectionConfidence: 0.6,
          minHandPresenceConfidence: 0.6,
          minTrackingConfidence: 0.6
        })
        setRecognizer(gestureRecognizer)
        setLoaded(true)
      } catch (e) {
        console.error("Failed to load MediaPipe", e)
      }
    }
    load()
  }, [])
  
  // Detection loop
  useEffect(() => {
    if (interactionMode !== 'GESTURE' || !recognizer || !webcamRef.current?.video) return
    
    const detect = () => {
      if (webcamRef.current?.video?.readyState === 4) {
        const video = webcamRef.current.video
        const now = Date.now()
        
        // Limit inference FPS to ~20 (50ms interval)
        if (now - lastVideoTime.current < 50) {
            requestRef.current = requestAnimationFrame(detect)
            return
        }
        lastVideoTime.current = now

        const results = recognizer.recognizeForVideo(video, now)
        
        // Default: No Pinch
        let currentPinch = false
        
        if (results.landmarks.length > 0) {
            const hand = results.landmarks[0]
            const tipIndex = hand[8]
            const tipThumb = hand[4]

            // --- 1. PINCH DETECTION (Thumb + Index distance) ---
            // Calculate distance in 3D (approx) or just 2D
            const dx = tipIndex.x - tipThumb.x
            const dy = tipIndex.y - tipThumb.y
            // const dz = tipIndex.z - tipThumb.z // z is relative depth
            const pinchDist = Math.sqrt(dx*dx + dy*dy)
            
            // Threshold for pinch (tune this: 0.05 is usually good for closed pinch)
            if (pinchDist < 0.05) {
                currentPinch = true
            }

            // --- 2. LOGIC ---
            if (currentPinch) {
                // PINCHED: Control Camera (Zoom & Rotate)
                
                if (!isPinching.current) {
                    // Start Pinch
                    isPinching.current = true
                    pinchStartY.current = tipIndex.y // 0..1 (0 is top, 1 is bottom)
                    pinchStartDist.current = currentDistRef.current
                    // Lock cursor style if possible
                    if (cursorRef.current) {
                        cursorRef.current.style.borderColor = '#FFD700' // Gold
                        cursorRef.current.style.backgroundColor = 'rgba(255, 215, 0, 0.3)'
                    }
                } else {
                    // Dragging
                    // Y-axis movement -> Zoom
                    // Moving UP (y decreases) -> Zoom IN (dist decreases)
                    // Moving DOWN (y increases) -> Zoom OUT (dist increases)
                    
                    const deltaY = tipIndex.y - pinchStartY.current
                    const sensitivity = 20 
                    
                    let newDist = pinchStartDist.current + (deltaY * sensitivity)
                    newDist = THREE.MathUtils.clamp(newDist, 5, 30)
                    
                    currentDistRef.current = newDist
                    setTargetDistance(newDist)
                    
                    // X-axis movement -> Rotate (Optional, or separate?)
                    // Let's keep Rotate logic separate below for simplicity? 
                    // Or combine: Drag X -> Rotate, Drag Y -> Zoom
                    // The user asked for "Rotate finger to zoom", but pinch-drag is better.
                    // Let's enable Rotation here too for full control
                    
                    const centerX = 0.5
                    let deltaX = (1 - tipIndex.x) - centerX
                    // Deadzone
                    if (Math.abs(deltaX) < 0.1) deltaX = 0
                    else deltaX = Math.sign(deltaX) * (Math.abs(deltaX) - 0.1) / 0.4
                    
                    setTargetRotationY(deltaX * 1.5)
                }
                
                // Clear gesture history to prevent state switch during pinch
                gestureHistory.current = []

            } else {
                // NOT PINCHED: Hover & State Switch
                if (isPinching.current) {
                    // Just released
                    isPinching.current = false
                    if (cursorRef.current) {
                        cursorRef.current.style.borderColor = '#FF69B4' // Pink
                        cursorRef.current.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
                    }
                    // Reset rotation target to stop spinning when released
                    setTargetRotationY(0)
                }

                // 3. MODE SWITCH (Debounced)
                // Only if NOT pinching
                let gesture = ""
                if (results.gestures.length > 0) {
                     gesture = results.gestures[0][0].categoryName
                }
                
                // Push to history
                gestureHistory.current.push(gesture)
                if (gestureHistory.current.length > 20) gestureHistory.current.shift() // Keep last 1s (20 frames)
                
                // Check if stable
                const isStableOpen = gestureHistory.current.every(g => g === 'Open_Palm')
                const isStableFist = gestureHistory.current.every(g => g === 'Closed_Fist')
                
                if (isStableFist && gestureHistory.current.length === 20) {
                     setMode('TREE')
                     // Clear to avoid re-trigger
                     gestureHistory.current = [] 
                } else if (isStableOpen && gestureHistory.current.length === 20) {
                     setMode('EXPLODE')
                     gestureHistory.current = []
                }
                
                // 4. Cursor Update (Follow Hand)
                // Map 0..1 to Screen Coordinates
                const x = (1 - tipIndex.x) * window.innerWidth
                const y = tipIndex.y * window.innerHeight
                
                smoothCursor.current.x = THREE.MathUtils.lerp(smoothCursor.current.x, x, 0.4)
                smoothCursor.current.y = THREE.MathUtils.lerp(smoothCursor.current.y, y, 0.4)
                
                if (cursorRef.current) {
                    cursorRef.current.style.opacity = '1'
                    cursorRef.current.style.left = `${smoothCursor.current.x}px`
                    cursorRef.current.style.top = `${smoothCursor.current.y}px`
                }
                
                // Rotation (When not pinching, just hovering left/right can also rotate? 
                // Or should we restrict rotation to Pinch? 
                // User complained about "too sensitive". 
                // Let's RESTRICT Rotation to Pinching for stability, OR make hover rotation very subtle.
                // Let's DISABLE hover rotation to prevent "accidental" moves. 
                // Only Pinch-Drag rotates and zooms.
                setTargetRotationY(0) 
            }
        } else {
            // No Hand
            isPinching.current = false
            setTargetRotationY(0)
            if (cursorRef.current) cursorRef.current.style.opacity = '0'
            gestureHistory.current = []
        }
      }
      requestRef.current = requestAnimationFrame(detect)
    }

    detect()
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current)
    }
  }, [recognizer, interactionMode, setMode, setTargetRotationY, setTargetDistance])

  if (interactionMode !== 'GESTURE') return null

  return (
    <>
      {/* Custom Cursor */}
      <div 
        ref={cursorRef}
        className={clsx(
          "fixed w-8 h-8 rounded-full border-2 border-hot-pink bg-white/20 backdrop-blur pointer-events-none z-[60] transition-opacity duration-200 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center opacity-0",
        )}
      >
        <div className="w-1 h-1 bg-white rounded-full" />
      </div>

      {/* Camera Preview */}
      <div className="fixed bottom-8 right-8 w-48 h-36 border border-white/20 rounded-2xl overflow-hidden z-50 bg-black/50 backdrop-blur shadow-2xl">
        {!loaded && <div className="absolute inset-0 flex items-center justify-center text-white text-xs">Loading AI...</div>}
        <Webcam
          ref={webcamRef}
          audio={false}
          mirrored={true}
          className="w-full h-full object-cover opacity-80"
          width={320}
          height={240}
        />
        <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-white/50 uppercase tracking-widest">
          Camera Active
        </div>
      </div>
    </>
  )
}
