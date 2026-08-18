import { AnimatePresence, motion, type Transition } from 'framer-motion';
import gsap from 'gsap';
import { Howl } from 'howler';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Screen = 'passcode' | 'wrong' | 'gifts' | 'scrapbook';

const PASSCODE = '1234';

/* ─────────────────────────────────────────────
   Page transitions — slight 3-D page-flip feel
───────────────────────────────────────────── */
const sceneTransition: Transition = {
  duration: 0.85,
  ease: [0.16, 1, 0.3, 1],
};

const pageTurnTransition: Transition = {
  duration: 0.7,
  ease: [0.16, 1, 0.3, 1],
};

const pageMotion = {
  initial: { opacity: 0, x: 30, scale: 0.98, rotateY: 3 },
  animate: { opacity: 1, x: 0, scale: 1, rotateY: 0 },
  exit: { opacity: 0, x: -30, scale: 0.98, rotateY: -3 },
  transition: sceneTransition,
};

/* ─────────────────────────────────────────────
   Helper: generate sparkle particles
───────────────────────────────────────────── */
function makeSparkles(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    angle: (360 / count) * i + Math.random() * 20 - 10,
    dist: 60 + Math.random() * 80,
    color: ['#f6d989', '#eab4c4', '#ff8fae', '#f0c988', '#ffe3ec', '#e8a5c0'][i % 6],
    delay: Math.random() * 0.4,
  }));
}

/* ─────────────────────────────────────────────
   Helper: generate confetti pieces
───────────────────────────────────────────── */
function makeConfetti(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: ['#f6d989', '#ff8fae', '#eab4c4', '#f0c988', '#e8c9e0', '#ffe3ec'][i % 6],
    size: 6 + Math.random() * 8,
    delay: Math.random() * 1.5,
    duration: 2 + Math.random() * 2,
  }));
}

/* ─────────────────────────────────────────────
   Helper: generate heart-burst particles (cake celebration)
───────────────────────────────────────────── */
function makeHeartBurst(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    angle: (360 / count) * i + Math.random() * 24 - 12,
    dist: 70 + Math.random() * 90,
    delay: Math.random() * 0.3,
  }));
}

/* ─────────────────────────────────────────────
   Helper: generate ambient floating hearts (whole-site decoration)
───────────────────────────────────────────── */
function makeAmbientHearts(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    duration: 14 + Math.random() * 12,
    delay: Math.random() * 16,
    scale: 0.6 + Math.random() * 0.8,
  }));
}

/* ─────────────────────────────────────────────
   ROOT APP
───────────────────────────────────────────── */
function App() {
  const [screen, setScreen] = useState<Screen>('passcode');
  const [digits, setDigits] = useState('');
  const [page, setPage] = useState(0);
  const [candleOut, setCandleOut] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(0.28);
  const music = useRef<Howl | null>(null);
  const ambientHearts = useMemo(() => makeAmbientHearts(10), []);

  /* ── Music setup ── */
  useEffect(() => {
    music.current = new Howl({
      src: ['/assets/music.mp3'],
      loop: true,
      volume: 0,
      html5: true,
    });

    return () => {
      music.current?.unload();
    };
  }, []);

  /* ── Fade in music on screen change ── */
  const playMusicFadeIn = useCallback(() => {
    const h = music.current;
    if (!h) return;
    h.play();
    h.fade(0, volume, 1800);
  }, [volume]);

  /* ── Passcode auto-submit ── */
  useEffect(() => {
    if (digits.length !== 4) return;
    const timer = window.setTimeout(() => {
      if (digits === PASSCODE) {
        setScreen('gifts');
        playMusicFadeIn();
      } else {
        setScreen('wrong');
      }
      setDigits('');
    }, 260);
    return () => window.clearTimeout(timer);
  }, [digits, playMusicFadeIn]);

  const addDigit = (digit: string) => {
    if (digits.length < 4) setDigits((v) => v + digit);
  };

  /* ── Mute toggle ── */
  const toggleMute = () => {
    if (!music.current) return;
    if (muted) {
      music.current.volume(volume);
      setMuted(false);
    } else {
      music.current.volume(0);
      setMuted(true);
    }
  };

  /* ── Volume change ── */
  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (!muted && music.current) music.current.volume(v);
  };

  return (
    <main className="site-shell">
      <div className="paper-grain" />

      {/* Ambient floating hearts — purely decorative, present on every screen */}
      <div className="ambient-hearts" aria-hidden="true">
        {ambientHearts.map((h) => (
          <span
            key={h.id}
            style={{
              left: `${h.left}%`,
              animationDuration: `${h.duration}s`,
              animationDelay: `${h.delay}s`,
              transform: `scale(${h.scale})`,
            }}
          >
            ♥
          </span>
        ))}
      </div>

      {/* Music Controls */}
      <div className="music-controls">
        <button
          className="music-mute-btn"
          type="button"
          onClick={toggleMute}
          aria-label={muted ? 'Unmute' : 'Mute'}
        >
          {muted ? '🔇' : '🎵'}
        </button>
        <input
          className="music-volume"
          type="range"
          min="0"
          max="1"
          step="0.02"
          value={muted ? 0 : volume}
          onChange={handleVolume}
          aria-label="Volume"
        />
      </div>

      <AnimatePresence mode="wait">
        {screen === 'passcode' && (
          <PasscodeScene key="passcode" digits={digits} addDigit={addDigit} setDigits={setDigits} />
        )}
        {screen === 'wrong' && (
          <WrongScene key="wrong" onRetry={() => setScreen('passcode')} />
        )}
        {screen === 'gifts' && (
          <GiftScene
            key="gifts"
            onOpen={() => {
              setPage(0);
              setScreen('scrapbook');
            }}
          />
        )}
        {screen === 'scrapbook' && (
          <ScrapbookScene
            key="scrapbook"
            page={page}
            candleOut={candleOut}
            setCandleOut={setCandleOut}
            next={() => setPage((v) => Math.min(v + 1, 4))}
            previous={() => setPage((v) => Math.max(v - 1, 0))}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

/* ─────────────────────────────────────────────
   PASSCODE SCENE
───────────────────────────────────────────── */
function PasscodeScene({
  digits,
  addDigit,
  setDigits,
}: {
  digits: string;
  addDigit: (digit: string) => void;
  setDigits: (value: string | ((prev: string) => string)) => void;
}) {
  // Top 9 digit keys (rows 1–3 of keypad)
  const digitKeys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

  return (
    <motion.section className="scene passcode-scene burgundy" {...pageMotion}>
      <div className="music-sheet" />
      <div className="torn-paper" />

      <div className="heart-frame">
        <img src="/assets/r1.jpeg" alt="A cherished memory" />
        <span className="lace-dot dot-a" />
        <span className="lace-dot dot-b" />
        <span className="lace-dot dot-c" />
      </div>

      <div className="red-ribbon" />

      <div className="keypad-panel">
        <h1>Enter a passcode</h1>
        <div className="pass-boxes">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`pass-box${digits[i] ? ' filled' : ''}`}>
              {digits[i] ? '●' : ''}
            </span>
          ))}
        </div>
        {/* Keypad: 1–9, then bottom row [DELETE][0][CLEAR] */}
        <div className="keypad">
          {digitKeys.map((key) => (
            <button key={key} type="button" className="keypad-digit" onClick={() => addDigit(key)}>
              {key}
            </button>
          ))}
          {/* Bottom row */}
          <button
            type="button"
            className="keypad-action-key"
            onClick={() => setDigits((prev: string) => prev.slice(0, -1))}
            aria-label="Delete last digit"
          >
            DEL
          </button>
          <button
            type="button"
            className="keypad-digit"
            onClick={() => addDigit('0')}
          >
            0
          </button>
          <button
            type="button"
            className="keypad-action-key"
            onClick={() => setDigits('')}
            aria-label="Clear all"
          >
            CLR
          </button>
        </div>
      </div>
    </motion.section>
  );
}

/* ─────────────────────────────────────────────
   WRONG SCENE
───────────────────────────────────────────── */
function WrongScene({ onRetry }: { onRetry: () => void }) {
  return (
    <motion.section className="scene cream-scene wrong-scene" {...pageMotion}>
      <h1 className="arched-title">WRONG PASSCODE</h1>
      <div className="wrong-illustration">
        <img
          src="/assets/sad_penguin.jpg"
          alt="Sad penguin"
          className="sad-penguin-img"
        />
        <div className="question-marks">
          <span>?</span>
          <span>?</span>
          <span>?</span>
        </div>
      </div>
      <button className="try-again" type="button" onClick={onRetry}>
        Try Again
      </button>
    </motion.section>
  );
}

/* ─────────────────────────────────────────────
   GIFT SCENE
───────────────────────────────────────────── */
function GiftScene({ onOpen }: { onOpen: () => void }) {
  return (
    <motion.section className="scene cream-scene gift-scene" {...pageMotion}>
      <h1 className="arched-title">Click on Gifts to Open</h1>

      {/* Decorative stickers/doodles for gift page */}
      <span className="gift-deco star-1">⭐</span>
      <span className="gift-deco heart-1">💖</span>
      <span className="gift-deco ribbon-1">🎀</span>
      <span className="gift-deco sparkles-1">✨</span>

      <div className="gift-row">
        {[0, 1, 2].map((item, idx) => (
          <button
            className={`gift-penguin gift-penguin-${idx}`}
            type="button"
            key={item}
            onClick={onOpen}
            aria-label="Open gift"
          >
            <div className="gift-sticker-wrap">
              <span className="gift-tape" />
              <img
                src="/assets/penguin_gift_pink.jpg"
                alt="Gift penguin"
                className="gift-penguin-img"
              />
            </div>
          </button>
        ))}
      </div>
    </motion.section>
  );
}

/* ─────────────────────────────────────────────
   SCRAPBOOK SCENE (wrapper + navigation)
───────────────────────────────────────────── */
function ScrapbookScene({
  page,
  candleOut,
  setCandleOut,
  next,
  previous,
}: {
  page: number;
  candleOut: boolean;
  setCandleOut: (value: boolean) => void;
  next: () => void;
  previous: () => void;
}) {
  const pages = useMemo(
    () => [
      <BirthdayPage />,
      <WishPage candleOut={candleOut} setCandleOut={setCandleOut} />,
      <MemoriesPage />,
      <LetterPage />,
      <FinalPage />,
    ],
    [candleOut, setCandleOut],
  );

  return (
    <motion.section className="scene scrapbook-scene" {...pageMotion}>
      <AnimatePresence mode="wait">
        <motion.div
          key={page}
          className="scrap-page"
          initial={{ opacity: 0, y: 22, rotate: -0.5, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, y: -18, rotate: 0.5, scale: 0.99 }}
          transition={pageTurnTransition}
          style={{ perspective: 1000 }}
        >
          {pages[page]}
        </motion.div>
      </AnimatePresence>
      {page > 0 && (
        <button className="nav-arrow prev" type="button" onClick={previous} aria-label="Previous page">
          ‹
        </button>
      )}
      {page < pages.length - 1 && (
        <button className="nav-arrow next" type="button" onClick={next} aria-label="Next page">
          ›
        </button>
      )}
    </motion.section>
  );
}

/* ─────────────────────────────────────────────
   PAGE 0 — BIRTHDAY PAGE
───────────────────────────────────────────── */
function BirthdayPage() {
  return (
    <div className="birthday-page burgundy-grid">
      <div className="scallop-top" />
      <div className="white-bow" />

      <p className="left-note">
        Today is your special day, Ravina ❤️ A day to celebrate the amazing person you are. Wishing you a year filled with happiness, new experiences, and moments that make you smile.
      </p>

      {/* Camera card with personal photo */}
      <div className="camera-card">
        <span className="camera-lens" />
        <span className="camera-dial" />
        <img src="/assets/r2.jpeg" alt="A beautiful memory" />
      </div>

      <div className="birthday-title">
        <span>Happy Birthday</span>
        <strong>Ravina ✨</strong>
      </div>

      <p className="right-note">
        Some people make life more beautiful just by being there, and you are one of those people. I
        hope this year brings you unlimited smiles, success, happiness and everything your heart
        wishes for. Keep shining and always stay the wonderful person you are ✨
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PAGE 1 — WISH / CAKE PAGE (PRIORITY)
───────────────────────────────────────────── */
function WishPage({
  candleOut,
  setCandleOut,
}: {
  candleOut: boolean;
  setCandleOut: (value: boolean) => void;
}) {
  const flameRef = useRef<HTMLSpanElement>(null);
  const [showSmoke, setShowSmoke] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const sparkles = useMemo(() => makeSparkles(16), []);
  const confetti = useMemo(() => makeConfetti(30), []);
  const heartBurst = useMemo(() => makeHeartBurst(10), []);

  /* ── Candle flicker animation ── */
  useEffect(() => {
    if (!flameRef.current || candleOut) return;
    const tween = gsap.to(flameRef.current, {
      scaleX: 0.88,
      scaleY: 1.12,
      x: 2,
      duration: 0.22,
      yoyo: true,
      repeat: -1,
      ease: 'sine.inOut',
    });
    // Apply CSS animation as fallback too
    if (flameRef.current) {
      flameRef.current.style.animation = 'candle-flicker 0.8s ease-in-out infinite';
    }
    return () => {
      tween.kill();
    };
  }, [candleOut]);

  /* ── Blow candle handler ── */
  const blowCandle = useCallback(() => {
    if (candleOut) return;
    setCandleOut(true);
    setShowSmoke(true);
    setShowSparkles(true);
    setTimeout(() => setShowConfetti(true), 300);
    setTimeout(() => setShowSmoke(false), 2000);
    setTimeout(() => setShowSparkles(false), 1400);
  }, [candleOut, setCandleOut]);

  return (
    <div className="wish-page burgundy-soft">
      {/* Left copy */}
      <div className="wish-copy">
        <h2>
          MAKE
          <br />A WISH
        </h2>
        <button className="blow-link" type="button" onClick={blowCandle}>
          Blow Candle
          <span>↪</span>
        </button>
        <p>
          I hope all your dreams come true and that you are always happy. I truly want to see you
          smile everyday
        </p>
      </div>

      {/* Cake button */}
      <button
        className="cake"
        type="button"
        onClick={blowCandle}
        aria-label="Blow candle"
        disabled={candleOut}
        style={{ cursor: candleOut ? 'default' : 'pointer' }}
      >
        {/* Candle + flame + glow wrapper */}
        <div className="candle-wrapper">
          <span className="candle">
            {!candleOut && (
              <>
                <span ref={flameRef} className="flame" />
                <span className="flame-glow" />
              </>
            )}

            {/* Smoke after blow */}
            {candleOut && showSmoke && (
              <>
                <span className="smoke-particle" style={{ top: -40, animationDelay: '0s' }} />
                <span className="smoke-particle" style={{ top: -40, animationDelay: '0.15s', left: '70%' }} />
                <span className="smoke-particle" style={{ top: -40, animationDelay: '0.3s', left: '30%' }} />
                <span className="smoke-particle" style={{ top: -45, animationDelay: '0.5s', left: '55%' }} />
                <span className="smoke-particle" style={{ top: -35, animationDelay: '0.7s', left: '45%' }} />
              </>
            )}
          </span>
        </div>

        {/* Soft floating particles around cake */}
        {!candleOut && (
          <>
            <span className="cake-particle p1" />
            <span className="cake-particle p2" />
            <span className="cake-particle p3" />
            <span className="cake-particle p4" />
            <span className="cake-particle p5" />
          </>
        )}

        {/* Sparkle particles on blow */}
        {showSparkles &&
          sparkles.map((s) => {
            const rad = (s.angle * Math.PI) / 180;
            const tx = Math.cos(rad) * s.dist;
            const ty = Math.sin(rad) * s.dist;
            return (
              <span
                key={s.id}
                className="sparkle"
                style={{
                  left: '50%',
                  top: '18%',
                  backgroundColor: s.color,
                  animationDelay: `${s.delay}s`,
                  '--tx': `${tx}px`,
                  '--ty': `${ty}px`,
                } as React.CSSProperties}
              />
            );
          })}

        {/* Heart-burst particles — extra premium touch alongside the sparkles */}
        {showSparkles &&
          heartBurst.map((h) => {
            const rad = (h.angle * Math.PI) / 180;
            const tx = Math.cos(rad) * h.dist;
            const ty = Math.sin(rad) * h.dist;
            return (
              <span
                key={h.id}
                className="heart-burst"
                style={{
                  left: '50%',
                  top: '18%',
                  animationDelay: `${h.delay}s`,
                  '--tx': `${tx}px`,
                  '--ty': `${ty}px`,
                } as React.CSSProperties}
              >
                ♥
              </span>
            );
          })}

        {/* 3-Tier Premium Cake Layout */}
        <span className="cake-tier tier-top" />
        <span className="cake-tier tier-middle" />
        <span className="cake-tier tier-bottom" />
        <span className="cake-plate" />
      </button>

      {/* Confetti celebration */}
      {showConfetti &&
        confetti.map((c) => (
          <span
            key={c.id}
            style={{
              position: 'absolute',
              left: `${c.x}%`,
              top: '-20px',
              width: c.size,
              height: c.size,
              backgroundColor: c.color,
              borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              animation: `celebration-fall ${c.duration}s ease-in ${c.delay}s forwards`,
              pointerEvents: 'none',
              zIndex: 10,
            }}
          />
        ))}

      {/* Glass "wish granted" popup — small premium moment after the candle is blown */}
      {candleOut && (
        <div className="wish-popup" aria-hidden="true">
          Your wish is granted ✨
        </div>
      )}

      {/* Top note */}
      <p className="top-note">
        Your smile makes every space feel brighter, and your laugh feels like a warm day. You are
        gentle, caring, and such a joy to be around.
      </p>

      <StickerStar />
    </div>
  );
}

/* ─────────────────────────────────────────────
   PAGE 2 — MEMORIES PAGE
───────────────────────────────────────────── */
function MemoriesPage() {
  // Using p3–p6 for polaroids (personal photos)
  // Using p3–p6 for polaroids (personal photos)
  const photos: Array<{ src: string; caption: string }> = [
    { src: '/assets/r3.jpeg', caption: '🧸' },
    { src: '/assets/r4.jpeg', caption: '🌟' },
    { src: '/assets/r5.jpeg', caption: '🦋' },
    { src: '/assets/r6.jpeg', caption: '🎀' },
  ];

  return (
    <div className="memories-page burgundy-deep">
      <div className="string-line" />
      <div className="polaroid-row">
        {photos.map((photo, index) => (
          <figure className={`polaroid p${index + 1}`} key={photo.src}>
            <span className="clip" />
            <img src={photo.src} alt={photo.caption} />
            <figcaption>{photo.caption}</figcaption>
          </figure>
        ))}
      </div>
      <div className="cloud-paper" />
      <div className="memory-doodles">
        <span className="heart-doodle">♡</span>
        <span className="flower-doodle">✿</span>
        <span className="love-doodle">friends</span>
        <span className="star-doodle">☆</span>
      </div>
      <h2>Your Vibe In Frames</h2>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PAGE 3 — LETTER PAGE
───────────────────────────────────────────── */
function LetterPage() {
  return (
    <div className="letter-page striped">
      <div className="letter-paper">
        <h2>To My Good Friend Ravina 🤍</h2>
        <p>Happy Birthday Ravina ❤️</p>
        <p>
          Some friendships make things a little easier. Your positive nature and friendly vibe helped me become more open and comfortable. 
          Thank you for being a good friend and always being yourself.
        </p>
        <p>
          Thank you for always being such a kind and wonderful person. Birthdays are always a reminder to enjoy the little moments.
        </p>
        <p>
          I hope your life is always filled with happiness, success, peace and countless reasons to
          smile. Never change the beautiful person you are.
        </p>
        <p className="letter-sign">
          Keep smiling always ✨
          <br />
          Happy Birthday Ravina 🤍
            <br />
        </p>
      </div>

      <div className="photo-stack">
        <div className="script-paper" />
        <figure>
          <img src="/assets/r8.jpeg" alt="A precious memory" />
        </figure>
        <div className="wax-seal">♥</div>
        <span className="small-camera" />
        <span className="flower" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PAGE 4 — FINAL PAGE
───────────────────────────────────────────── */
function FinalPage() {
  return (
    <div className="final-page cream-final">
      <span className="tiny-heart">♥</span>
      <h2>
         NEVER
        <span>lose your spark</span>
      </h2>

      {/* Polaroid style frame for p8.jpeg */}
      <div className="final-photo-frame">
        <span className="tape tape-left" />
        <span className="tape tape-right" />
        <img src="/assets/r7.jpeg" alt="Our forever memory" />
        <figcaption className="final-caption">cheers to you 🤍</figcaption>
      </div>

      <div className="bear-left">
        <Bear />
        <Bear tan />
      </div>
      <div className="bear-right">
        <Bear tan />
        <Bear />
      </div>
      <span className="heart-bubble h1">♥</span>
      <span className="heart-bubble h2">♥</span>
      <span className="heart-bubble h3">♥</span>
    </div>
  );
}

/* ─────────────────────────────────────────────
   COMPONENTS — Penguin, StickerStar, Bear
───────────────────────────────────────────── */
function Penguin({ gift = false, peek = false }: { gift?: boolean; peek?: boolean }) {
  return (
    <span className={`penguin ${peek ? 'peek' : ''}`}>
      <span className="penguin-head">
        <span className="eye left" />
        <span className="eye right" />
        <span className="beak" />
      </span>
      <span className="penguin-body" />
      {gift && (
        <span className="gift-box">
          <span />
        </span>
      )}
    </span>
  );
}

function StickerStar() {
  return (
    <span className="sticker-star">
      <span />
      <span />
      <span />
    </span>
  );
}

function Bear({ tan = false }: { tan?: boolean }) {
  return (
    <span className={`bear ${tan ? 'tan' : ''}`}>
      <span className="ear e1" />
      <span className="ear e2" />
      <span className="face" />
      <span className="paw" />
    </span>
  );
}

export default App;
