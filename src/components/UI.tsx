import { useStore } from '../store'
import { useEffect, useRef, useState } from 'react'
import { clsx } from 'clsx'
import { motion } from 'framer-motion'

function AnimatedTitle({ isHud = false }: { isHud?: boolean }) {
  const text = "Merry Christmas"
  
  return (
    <div className="flex justify-center overflow-visible py-2">
      {text.split("").map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
          animate={{ 
            opacity: 1, 
            y: [0, -10, 0],
            filter: "blur(0px)",
            textShadow: [
               isHud ? "0 0 20px rgba(240,230,140,0.5)" : "0 0 25px rgba(255,255,255,0.4)",
               isHud ? "0 0 30px rgba(255,183,197,0.8)" : "0 0 35px rgba(255,192,203,0.6)",
               isHud ? "0 0 20px rgba(240,230,140,0.5)" : "0 0 25px rgba(255,255,255,0.4)"
            ],
            color: isHud 
              ? ["#F0E68C", "#FFB7C5", "#F0E68C"] 
              : ["#FFFFFF", "#FFB7C5", "#FFFFFF"]
          }}
          transition={{
            opacity: { duration: 1.5, delay: i * 0.1 },
            filter: { duration: 1.5, delay: i * 0.1 },
            y: {
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.15
            },
            textShadow: {
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.1
            },
            color: {
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.2
            }
          }}
          className={clsx(
            "text-5xl md:text-7xl font-vibes tracking-wide select-none cursor-default",
          )}
          style={{ 
             display: "inline-block",
             marginRight: char === " " ? "0.3em" : "0.02em"
          }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </div>
  )
}

export function UI() {
  const hasStarted = useStore((state) => state.hasStarted)
  const setStarted = useStore((state) => state.setStarted)
  const interactionMode = useStore((state) => state.interactionMode)
  const setInteractionMode = useStore((state) => state.setInteractionMode)
  const audioPlaying = useStore((state) => state.audioPlaying)
  const toggleAudio = useStore((state) => state.toggleAudio)
  const isAwake = useStore((state) => state.isAwake)
  const setAwake = useStore((state) => state.setAwake)
  
  const [clickCount, setClickCount] = useState(0)
  const audioRef = useRef<HTMLAudioElement>(null)

  // Initial Auto-play attempt & Click handling
  useEffect(() => {
    // Attempt auto-play on mount (often blocked but worth a try)
    if (audioRef.current && !audioPlaying) {
        audioRef.current.volume = 0.4
        const playPromise = audioRef.current.play()
        if (playPromise !== undefined) {
            playPromise.then(() => {
                // Auto-play started!
                if (!audioPlaying) toggleAudio()
            }).catch(error => {
                console.log("Auto-play prevented:", error)
            })
        }
    }
  }, [])

  const handleGlobalClick = () => {
    if (hasStarted) return
    
    // Ensure audio is playing on first interaction
    if (audioRef.current && (!audioPlaying || audioRef.current.paused)) {
        audioRef.current.volume = 0.4
        audioRef.current.play().catch(() => {})
        if (!audioPlaying) toggleAudio()
    }

    if (!isAwake) {
        const newCount = clickCount + 1
        setClickCount(newCount)
        if (newCount >= 3) {
            setAwake(true)
        }
    }
  }

  // Audio control
  useEffect(() => {
    if (audioRef.current) {
      if (audioPlaying) {
        audioRef.current.play().catch(() => {})
      } else {
        audioRef.current.pause()
      }
    }
  }, [audioPlaying])
  
  // Start interaction
  const handleEnter = (mode: 'MOUSE' | 'GESTURE') => {
    setInteractionMode(mode)
    setStarted(true)
  }

  const puppyText = "——My puppy Dayday"

  return (
    <div onClick={handleGlobalClick} className={clsx("absolute inset-0 z-50", hasStarted ? "pointer-events-none" : "cursor-pointer")}>
      <audio 
        ref={audioRef} 
        loop 
        preload="auto"
        src="/christmas-list.mp3" 
      />
      
      {/* Awakening Overlay (Black Screen) */}
      <div 
        className={clsx(
            "absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black transition-opacity duration-1000",
            isAwake ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
      >
        <div className="text-center">
             <motion.div
                key={clickCount}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-white/80 font-serif text-xl md:text-2xl tracking-widest"
             >
                {clickCount === 0 && "请连续点击三下唤醒您的圣诞树"}
                {clickCount === 1 && "再点击两下..."}
                {clickCount === 2 && "最后一下..."}
             </motion.div>
             <div className="mt-4 flex justify-center gap-2">
                {[0, 1, 2].map(i => (
                    <div 
                        key={i} 
                        className={clsx(
                            "w-2 h-2 rounded-full transition-colors duration-300",
                            i < clickCount ? "bg-dream-pink shadow-[0_0_10px_#FFB7C5]" : "bg-white/20"
                        )} 
                    />
                ))}
             </div>
        </div>
      </div>

      {/* Landing Page Overlay */}
      <div 
        className={clsx(
          "absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-1000",
          (isAwake && !hasStarted) ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <div className="text-center p-8 border border-white/10 bg-white/5 rounded-2xl shadow-2xl max-w-2xl w-full mx-4">
          <AnimatedTitle />

          {/* Dynamic Puppy Text */}
          <div className="mb-12 flex justify-end flex-wrap gap-x-1 pr-12">
            {puppyText.split("").map((char, index) => (
              <motion.span
                key={index}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  y: [0, -10, 0],
                  color: ['#E8D0D8', '#F9F1F5', '#E8D0D8'] // Luxury Pink -> Dream Pink -> Luxury Pink
                }}
                transition={{ 
                  duration: 2,
                  delay: index * 0.1, // Stagger effect
                  y: {
                    repeat: Infinity,
                    duration: 3,
                    ease: "easeInOut",
                    delay: index * 0.2 // Wave effect
                  },
                  color: {
                    repeat: Infinity,
                    duration: 4,
                    ease: "easeInOut"
                  }
                }}
                className="text-xl md:text-3xl font-vibes text-luxury-pink drop-shadow-[0_0_15px_rgba(255,182,193,0.6)]"
                style={{ display: char === " " ? "inline" : "inline-block" }}
              >
                {char === " " ? "\u00A0" : char}
              </motion.span>
            ))}
          </div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="flex flex-col md:flex-row gap-6 justify-center"
          >
            <button 
              onClick={() => handleEnter('MOUSE')}
              className="group relative px-8 py-4 bg-white/5 overflow-hidden rounded-full transition-all hover:scale-105 active:scale-95"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <div className="absolute inset-0 border border-white/20 rounded-full" />
              <span className="relative z-10 text-white font-serif tracking-[0.2em] text-sm uppercase group-hover:text-dream-pink transition-colors">
                打开独属于你的圣诞树
              </span>
            </button>
            
            <button 
              onClick={() => handleEnter('GESTURE')}
              className="group relative px-8 py-4 bg-gradient-to-r from-dream-pink/80 to-luxury-pink/80 overflow-hidden rounded-full transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,105,180,0.3)] hover:shadow-[0_0_50px_rgba(255,105,180,0.6)]"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <span className="relative z-10 flex items-center gap-2 text-white font-bold tracking-[0.1em] text-sm uppercase">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
                开启手势互动
              </span>
            </button>
          </motion.div>
        </div>
      </div>

      {/* Persistent HUD Title (In-Game) */}
      <div 
        className={clsx(
          "absolute top-8 left-0 right-0 z-30 flex justify-center pointer-events-none transition-opacity duration-1000",
          hasStarted ? "opacity-100" : "opacity-0"
        )}
      >
        <AnimatedTitle isHud={true} />
      </div>

      {/* HUD */}
      <div 
        className={clsx(
          "absolute inset-0 pointer-events-none z-40 transition-opacity duration-1000",
          hasStarted ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Top Right: Audio Toggle */}
        <button 
          onClick={toggleAudio} 
          className="absolute top-8 right-8 pointer-events-auto text-white/70 hover:text-white transition-colors"
        >
          {audioPlaying ? (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
            </svg>
          )}
        </button>
        
        {/* Bottom Left: Instructions */}
        <div className="absolute bottom-8 left-8 text-white/60 font-serif max-w-sm">
          <h3 className="text-xl text-dream-pink mb-2 border-b border-white/20 pb-1 inline-block">操作指南 (Controls)</h3>
          {interactionMode === 'GESTURE' ? (
            <ul className="space-y-1 text-sm">
              <li>✊ <b>握拳 / 捏合</b>: 聚拢成树 (Form Tree)</li>
              <li>✋ <b>张开手掌</b>: 粒子爆发 (Explode)</li>
              <li>↔️ <b>左右移动</b>: 旋转视角 (Rotate)</li>
              <li>👐 <b>双手开合</b>: 缩放视角 (Two-Hand Zoom)</li>
            </ul>
          ) : (
            <ul className="space-y-1 text-sm">
              <li>🖱️ <b>点击任意处</b>: 切换状态 (Toggle)</li>
              <li>👆 <b>拖拽</b>: 旋转视角 (Rotate)</li>
              <li>🤏 <b>滚轮/捏合</b>: 缩放视角 (Zoom)</li>
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
