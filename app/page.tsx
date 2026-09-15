/* eslint-disable @next/next/no-img-element -- Customizable remote photo URLs and decorative images are intentionally rendered directly. */
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type JourneyStage = 'intro' | 'game' | 'gift' | 'story';
type ThemeId = 'blush' | 'lilac' | 'sage' | 'midnight';

interface GiftData {
  name: string;
  nickname: string;
  from: string;
  password: string;
  passwordHint: string;
  intro: string;
  message: string;
  ending: string;
  wish: string;
  theme: ThemeId;
  photos: { src: string; caption: string }[];
}

interface FallingItem { id: number; x: number; y: number; icon: string; }

const defaultGift: GiftData = {
  name: 'Naya', nickname: 'Nay', from: 'Ken',
  password: '1209', passwordHint: 'Tanggal dan bulan ulang tahunmu — format DDMM.',
  intro: 'Naya, ada kejutan kecil dari Ken yang dibuat khusus untuk hari spesialmu.',
  message: 'Selamat ulang tahun, Naya. Terima kasih sudah menjadi perempuan yang selalu berhasil membuat hari-hariku terasa lebih hangat. Aku mungkin tidak selalu pandai merangkai kata, tapi aku ingin kamu tahu kalau hadirnya kamu adalah salah satu hal terbaik dalam hidupku. Semoga di umur yang baru ini kamu selalu dikelilingi kebahagiaan, dimudahkan dalam setiap langkah, dan tidak pernah lupa betapa berharganya dirimu untukku.',
  ending: 'Kalau suatu hari kamu lupa betapa berharganya dirimu, semoga hadiah kecil dari Ken ini bisa mengingatkanmu bahwa kamu selalu dicintai.',
  wish: 'Semoga semua impianmu menemukan jalan untuk menjadi nyata, hatimu selalu dijaga, dan aku masih boleh menemani banyak ulang tahunmu setelah ini.',
  theme: 'blush',
  photos: [
    { src: '/memories/ken-naya-couple.jpg', caption: 'Kalau ada kamu, tempat mana pun terasa seperti rumah.' },
    { src: '/memories/naya-portrait.jpg', caption: 'Cantikmu selalu berhasil membuatku berhenti sebentar.' },
    { src: '/memories/naya-smile-one.jpeg', caption: 'Tatapan yang diam-diam selalu aku rindukan.' },
    { src: '/memories/naya-smile-two.jpeg', caption: 'Senyum ini yang ingin terus aku jaga.' },
  ],
};

const themes: Record<ThemeId, { name: string; accent: string; soft: string; ink: string; glow: string }> = {
  blush: { name: 'Blush Garden', accent: '#d94d7b', soft: '#fff3f6', ink: '#4d2431', glow: '#ffc4d7' },
  lilac: { name: 'Lilac Dream', accent: '#8055c9', soft: '#f7f1ff', ink: '#382750', glow: '#dac8ff' },
  sage: { name: 'Sage Picnic', accent: '#4d8c70', soft: '#f0f8f2', ink: '#294638', glow: '#c5e7d3' },
  midnight: { name: 'Midnight Love', accent: '#8267e8', soft: '#11162d', ink: '#eef0ff', glow: '#536fff' },
};

const isThemeId = (value: unknown): value is ThemeId => typeof value === 'string' && value in themes;
const normalizeBirthdayPassword = (value: string) => value.replace(/\D/g, '').slice(0, 4);
const safeImageSource = (value: string, fallback: string) => {
  const source = value.trim();
  if (source.startsWith('/')) return source;
  try { return new URL(source).protocol === 'https:' ? source : fallback; }
  catch { return fallback; }
};

const readGiftFromUrl = (): GiftData => {
  if (typeof window === 'undefined' || !window.location.hash.startsWith('#gift=')) return defaultGift;
  try {
    const parsed = JSON.parse(decodeURIComponent(escape(atob(window.location.hash.slice(6))))) as Partial<GiftData>;
    const photos = Array.isArray(parsed.photos)
      ? parsed.photos.slice(0, 4).map((photo, index) => ({
          src: typeof photo?.src === 'string' && photo.src.trim() ? photo.src.trim() : defaultGift.photos[index]?.src ?? defaultGift.photos[0].src,
          caption: typeof photo?.caption === 'string' && photo.caption.trim() ? photo.caption.trim() : defaultGift.photos[index]?.caption ?? 'Kenangan favorit kita.',
        }))
      : defaultGift.photos;
    return {
      ...defaultGift,
      ...parsed,
      password: typeof parsed.password === 'string' && normalizeBirthdayPassword(parsed.password).length === 4 ? normalizeBirthdayPassword(parsed.password) : defaultGift.password,
      passwordHint: typeof parsed.passwordHint === 'string' && parsed.passwordHint.trim() ? parsed.passwordHint.trim() : defaultGift.passwordHint,
      theme: isThemeId(parsed.theme) ? parsed.theme : defaultGift.theme,
      photos: photos.length ? photos : defaultGift.photos,
    };
  } catch {
    return defaultGift;
  }
};

const floatingMotifs = Array.from({ length: 20 }, (_, index) => ({
  id: index, left: `${(index * 47) % 96}%`, top: `${8 + ((index * 31) % 84)}%`,
  delay: `${(index % 7) * -0.7}s`, icon: ['♥', '✿', '♡', '✦'][index % 4],
}));

const transitionFlowers = Array.from({ length: 36 }, (_, index) => {
  const column = index % 6;
  const row = Math.floor(index / 6);
  const distanceFromCenter = Math.hypot(column - 2.5, row - 2.5);
  return {
    id: index,
    x: `${(column - 2.5) * 19}vw`,
    y: `${(row - 2.5) * 19}vh`,
    rotation: `${(index * 71) % 360 - 180}deg`,
    scale: `${0.84 + ((index * 17) % 40) / 100}`,
    delay: `${Math.min(0.13, distanceFromCenter * 0.018)}s`,
  };
});

const musicTracks = [
  { title: 'Shape of My Heart', mood: 'Backstreet Boys', src: '/music/shape-of-my-heart.mp3' },
  { title: 'Just the Way You Are', mood: 'Bruno Mars', src: '/music/just-the-way-you-are.mp3' },
  { title: 'Perfect', mood: 'Ed Sheeran', src: '/music/perfect.mp3' },
] as const;

class MelodyPlayer {
  private audio: HTMLAudioElement | null = null;
  private playing = false;
  private trackIndex = 0;

  private loadTrack(trackIndex: number) {
    if (this.audio) {
      this.audio.pause();
      this.audio.src = '';
    }
    this.trackIndex = trackIndex;
    this.audio = new Audio(musicTracks[trackIndex].src);
    this.audio.loop = true;
    this.audio.volume = 0.7;
  }

  play(trackIndex = this.trackIndex) {
    if (typeof window === 'undefined') return false;
    if (!this.audio || this.trackIndex !== trackIndex) {
      this.loadTrack(trackIndex);
    }
    void this.audio!.play().catch(() => null);
    this.playing = true;
    return true;
  }

  pause() {
    if (this.audio) this.audio.pause();
    this.playing = false;
  }

  toggle(trackIndex: number) {
    if (this.playing) { this.pause(); return false; }
    return this.play(trackIndex);
  }

  sparkle() {
    // sparkle effect — keep audio context for short chime
    if (typeof window === 'undefined') return;
    const AudioCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;
    const ctx = new AudioCtor();
    [659.25, 783.99, 1046.5].forEach((frequency, index) => {
      const now = ctx.currentTime + index * 0.07;
      const oscillator = ctx.createOscillator(); const gain = ctx.createGain();
      oscillator.type = 'triangle'; oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.09, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      oscillator.connect(gain).connect(ctx.destination); oscillator.start(now); oscillator.stop(now + 0.32);
    });
  }
}
const melody = new MelodyPlayer();

export default function Home() {
  const [gift, setGift] = useState<GiftData>(readGiftFromUrl);
  const [draftGift, setDraftGift] = useState<GiftData>(gift);
  const [stage, setStage] = useState<JourneyStage>('intro');
  const [transitioning, setTransitioning] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [storyPreview, setStoryPreview] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [musicUnlocked, setMusicUnlocked] = useState(false);
  const [activeTrack, setActiveTrack] = useState(0);
  const [toast, setToast] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [giftOpened, setGiftOpened] = useState(false);
  const [openedPetals, setOpenedPetals] = useState<number[]>([]);
  const [flippedMemories, setFlippedMemories] = useState<number[]>([]);
  const [openEnvelope, setOpenEnvelope] = useState<number | null>(null);
  const [candleProgress, setCandleProgress] = useState(0);
  const [candleBlown, setCandleBlown] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(7);
  const [timeLeft, setTimeLeft] = useState(35);
  const [playerX, setPlayerX] = useState(50);
  const [fallingItems, setFallingItems] = useState<FallingItem[]>([]);
  const playerXRef = useRef(playerX);
  const wonRef = useRef(false);
  const candleTimerRef = useRef<number | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const currentTheme = themes[gift.theme];

  useEffect(() => { playerXRef.current = playerX; }, [playerX]);
  useEffect(() => () => {
    melody.pause();
    if (candleTimerRef.current !== null) window.clearInterval(candleTimerRef.current);
  }, []);
  useEffect(() => {
    document.body.style.overflow = editorOpen || storyPreview ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [editorOpen, storyPreview]);

  useEffect(() => {
    const modal = editorOpen ? editorRef.current : storyPreview ? previewRef.current : null;
    if (!modal) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const focusable = () => Array.from(modal.querySelectorAll<HTMLElement>('button:not(:disabled), input, textarea, select, [tabindex]:not([tabindex="-1"])'));
    focusable()[0]?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (editorOpen) setEditorOpen(false);
        if (storyPreview) setStoryPreview(false);
        return;
      }
      if (event.key !== 'Tab') return;
      const elements = focusable();
      if (!elements.length) return;
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('keydown', onKeyDown); previousFocus?.focus(); };
  }, [editorOpen, storyPreview]);

  const showToast = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2800); };
  const moveTo = useCallback((next: JourneyStage) => {
    if (transitioning) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setStage(next); window.scrollTo({ top: 0 }); return;
    }
    setTransitioning(true);
    window.setTimeout(() => { setStage(next); window.scrollTo({ top: 0 }); }, 720);
    window.setTimeout(() => setTransitioning(false), 1500);
  }, [transitioning]);
  const startGame = () => {
    setScore(0); setLives(7); setTimeLeft(35); setPlayerX(50); setFallingItems([]);
    setGiftOpened(false);
    wonRef.current = false; setPlaying(true);
  };
  const unlockGift = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (passwordInput !== gift.password) {
      setPasswordError(true);
      return;
    }
    setPasswordError(false);
    setGiftOpened(false);
    moveTo('gift');
  };
  const addPasswordDigit = (digit: string) => {
    setPasswordInput((value) => `${value}${digit}`.slice(0, 4));
    setPasswordError(false);
  };
  const removePasswordDigit = () => {
    setPasswordInput((value) => value.slice(0, -1));
    setPasswordError(false);
  };
  const returnToStart = () => {
    melody.pause();
    setMusicPlaying(false);
    setMusicUnlocked(false);
    setPlaying(false);
    setFallingItems([]);
    setPasswordInput('');
    setPasswordError(false);
    setGiftOpened(false);
    setOpenedPetals([]);
    setFlippedMemories([]);
    setOpenEnvelope(null);
    setCandleProgress(0);
    setCandleBlown(false);
    moveTo('intro');
  };
  const movePlayer = useCallback((amount: number) => {
    if (playing) setPlayerX((position) => Math.max(7, Math.min(93, position + amount)));
  }, [playing]);

  useEffect(() => {
    if (stage !== 'game' || !playing) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') movePlayer(-9);
      if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') movePlayer(9);
    };
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey);
  }, [movePlayer, playing, stage]);

  useEffect(() => {
    if (stage !== 'game' || !playing) return;
    const icons = ['♥', '🍓', '🧁', '✦'];
    const spawn = window.setInterval(() => setFallingItems((items) => [...items, {
      id: Date.now() + Math.random(), x: 7 + Math.random() * 86, y: -8, icon: icons[Math.floor(Math.random() * icons.length)],
    }]), 920);
    const fall = window.setInterval(() => {
      setFallingItems((items) => {
        let caught = 0; let missed = 0;
        const next = items.map((item) => ({ ...item, y: item.y + 1.05 })).filter((item) => {
          if (item.y >= 73 && item.y <= 96 && Math.abs(item.x - playerXRef.current) < 19) { caught += 1; return false; }
          if (item.y > 104) { missed += 1; return false; }
          return true;
        });
        if (caught) setScore((value) => Math.min(8, value + caught));
        if (missed) setLives((value) => Math.max(0, value - missed));
        return next;
      });
    }, 50);
    const timer = window.setInterval(() => setTimeLeft((value) => Math.max(0, value - 1)), 1000);
    return () => { window.clearInterval(spawn); window.clearInterval(fall); window.clearInterval(timer); };
  }, [playing, stage]);

  useEffect(() => {
    if (!playing) return;
    if (score >= 8 && !wonRef.current) {
      wonRef.current = true;
      const finishWin = window.setTimeout(() => {
        setPlaying(false); setFallingItems([]); melody.sparkle();
        window.setTimeout(() => moveTo('story'), 450);
      }, 0);
      return () => window.clearTimeout(finishWin);
    }
    if (lives <= 0 || timeLeft <= 0) {
      const finishGame = window.setTimeout(() => { setPlaying(false); setFallingItems([]); }, 0);
      return () => window.clearTimeout(finishGame);
    }
  }, [lives, moveTo, playing, score, timeLeft]);

  const copyGiftLink = async (data: GiftData = gift) => {
    try {
      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
      await navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}#gift=${encoded}`);
      showToast('Link hadiah berhasil disalin ♥');
    } catch { showToast('Belum bisa menyalin link. Coba lagi, ya.'); }
  };
  const openEditor = () => { setDraftGift(structuredClone(gift)); setEditorOpen(true); };
  const saveEditor = async () => {
    const normalized: GiftData = {
      ...draftGift,
      name: draftGift.name.trim() || defaultGift.name,
      nickname: draftGift.nickname.trim() || draftGift.name.trim() || defaultGift.nickname,
      from: draftGift.from.trim() || defaultGift.from,
      password: normalizeBirthdayPassword(draftGift.password).length === 4 ? normalizeBirthdayPassword(draftGift.password) : defaultGift.password,
      passwordHint: draftGift.passwordHint.trim() || defaultGift.passwordHint,
      intro: draftGift.intro.trim() || defaultGift.intro,
      message: draftGift.message.trim() || defaultGift.message,
      ending: draftGift.ending.trim() || defaultGift.ending,
      wish: draftGift.wish.trim() || defaultGift.wish,
      photos: draftGift.photos.map((photo, index) => ({
        src: safeImageSource(photo.src, defaultGift.photos[index].src),
        caption: photo.caption.trim() || defaultGift.photos[index].caption,
      })),
    };
    setGift(normalized); setDraftGift(normalized); await copyGiftLink(normalized); setEditorOpen(false);
  };
  const toggleMusic = () => {
    const next = melody.toggle(activeTrack);
    setMusicPlaying(next);
    showToast(next ? `${musicTracks[activeTrack].title} diputar ♪` : 'Musik dijeda');
  };
  const selectTrack = (trackIndex: number) => {
    setActiveTrack(trackIndex);
    if (musicPlaying) melody.play(trackIndex);
    showToast(`Sekarang memutar ${musicTracks[trackIndex].title} ♪`);
  };
  const changeTrack = (direction: number) => selectTrack((activeTrack + direction + musicTracks.length) % musicTracks.length);
  const openGift = () => {
    if (giftOpened) return;
    setGiftOpened(true);
    melody.sparkle();
  };
  const acceptBouquet = () => {
    const started = melody.play(activeTrack);
    setMusicPlaying(started);
    setMusicUnlocked(true);
    startGame();
    moveTo('game');
    showToast(`${musicTracks[activeTrack].title} mulai diputar ♪`);
  };
  const revealPetal = (index: number) => {
    setOpenedPetals((current) => current.includes(index) ? current : [...current, index]);
    melody.sparkle();
  };
  const flipMemory = (index: number) => {
    setFlippedMemories((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index]);
  };
  const stopCandleHold = (reset = true) => {
    if (candleTimerRef.current !== null) {
      window.clearInterval(candleTimerRef.current);
      candleTimerRef.current = null;
    }
    if (reset) setCandleProgress((current) => current >= 100 ? current : 0);
  };
  const startCandleHold = () => {
    if (candleBlown || candleTimerRef.current !== null) return;
    candleTimerRef.current = window.setInterval(() => {
      setCandleProgress((current) => {
        const next = Math.min(100, current + 4);
        if (next >= 100) {
          if (candleTimerRef.current !== null) window.clearInterval(candleTimerRef.current);
          candleTimerRef.current = null;
          setCandleBlown(true);
          melody.sparkle();
        }
        return next;
      });
    }, 45);
  };
  const themeStyle = { '--accent': currentTheme.accent, '--soft': currentTheme.soft, '--ink': currentTheme.ink, '--glow': currentTheme.glow } as React.CSSProperties;
  const ambient = useMemo(() => floatingMotifs.map((motif) => (
    <span className="ambient-motif" key={motif.id} style={{ left: motif.left, top: motif.top, animationDelay: motif.delay }}>{motif.icon}</span>
  )), []);

  return (
    <main className={`journey-root theme-${gift.theme}${stage === 'story' ? ' stage-story' : ''}`} style={themeStyle}>
      {toast && <div className="journey-toast" role="status">{toast}</div>}
      <div className={`flower-curtain ${transitioning ? 'active' : ''}`} aria-hidden="true">
        <div className="flower-transition-backdrop" />
        {transitionFlowers.map((flower) => (
          <span
            className="transition-bloom"
            key={flower.id}
            style={{
              '--flower-x': flower.x,
              '--flower-y': flower.y,
              '--flower-rotation': flower.rotation,
              '--flower-scale': flower.scale,
              '--flower-delay': flower.delay,
            } as React.CSSProperties}
          />
        ))}
      </div>
      <header className="journey-controls">
        {stage !== 'intro' ? <button className="round-control" onClick={returnToStart} aria-label="Kembali ke awal">←</button> : <span className="tiny-brand">made for you ♥</span>}
        {stage !== 'intro' && <div><button className="soft-control" onClick={openEditor}>Edit hadiah</button></div>}
      </header>

      {musicUnlocked && (
        <aside className="music-dock" aria-label="Pemutar musik hadiah">
          <button className="music-skip" onClick={() => changeTrack(-1)} aria-label="Lagu sebelumnya">‹</button>
          <button className={`music-toggle ${musicPlaying ? 'playing' : ''}`} onClick={toggleMusic} aria-label={musicPlaying ? 'Jeda musik' : 'Putar musik'}>{musicPlaying ? 'Ⅱ' : '▶'}</button>
          <div className="music-copy"><span>{musicPlaying ? 'now playing' : 'music paused'}</span><strong>{musicTracks[activeTrack].title}</strong><small>{musicTracks[activeTrack].mood}</small></div>
          <button className="music-skip" onClick={() => changeTrack(1)} aria-label="Lagu berikutnya">›</button>
          <div className="music-track-dots" aria-label="Pilih musik">{musicTracks.map((track, index) => <button className={activeTrack === index ? 'active' : ''} onClick={() => selectTrack(index)} key={track.title} aria-label={`Putar ${track.title}`} aria-pressed={activeTrack === index} />)}</div>
        </aside>
      )}

      {stage === 'intro' && (
        <section className="intro-stage stage-screen">
          {ambient}
          <div className="intro-copy"><span className="eyebrow">A private little surprise for</span><h1>{gift.name}<em>♥</em></h1><p>{gift.intro}</p>
            <form className={`password-gate ${passwordError ? 'has-error' : ''}`} onSubmit={unlockGift}>
              <div className="birthday-lock-heading"><span aria-hidden="true">♡</span><div><strong>Birthday password</strong><small>Masukkan tanggal ulang tahunmu</small></div></div>
              <div className="birthday-code" aria-label={`${passwordInput.length} dari 4 angka terisi`} aria-live="polite">
                {Array.from({ length: 4 }, (_, index) => <span className={passwordInput[index] ? 'filled' : ''} key={index}>{passwordInput[index] ?? '·'}</span>)}
              </div>
              <div className="birthday-keypad" aria-label="Keypad tanggal ulang tahun">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => <button type="button" key={digit} onClick={() => addPasswordDigit(String(digit))} aria-label={`Angka ${digit}`}>{digit}</button>)}
                <button type="button" className="keypad-delete" onClick={removePasswordDigit} disabled={!passwordInput} aria-label="Hapus angka terakhir">⌫</button>
                <button type="button" onClick={() => addPasswordDigit('0')} aria-label="Angka 0">0</button>
                <button type="submit" className="keypad-enter" disabled={passwordInput.length !== 4} aria-label="Buka kejutan">♥</button>
              </div>
              <p id="password-hint" className="password-hint"><span>Hint</span> {gift.passwordHint}</p>
              <p id="password-error" className="password-error" role="alert" aria-live="polite">{passwordError ? 'Belum tepat. Coba ingat petunjuknya, ya ♥' : '\u00a0'}</p>
            </form>
          </div>
          <div className="intro-visual"><div className="bouquet-halo" /><img src="/journey/birthday-bouquet.webp" alt="Buket ulang tahun untuk penerima" fetchPriority="high" decoding="async" /><span className="hand-note">picked just for you</span></div>
          <div className="scroll-cue">only the right person can enter</div>
        </section>
      )}

      {stage === 'game' && (
        <section className="game-stage stage-screen" onPointerMove={(event) => { if (!playing) return; const rect = event.currentTarget.getBoundingClientRect(); setPlayerX(Math.max(7, Math.min(93, ((event.clientX - rect.left) / rect.width) * 100))); }}>
          <div className="game-hud" aria-live="polite"><p>Bantu Momo mengumpulkan bunga untuk cerita {gift.nickname}</p><div><span>♥ {score}/8</span><span>♡ {lives}</span><span>{timeLeft}s</span></div></div>
          {fallingItems.map((item) => <span aria-hidden="true" className={`journey-falling-item ${item.icon === '♥' ? 'heart' : ''}`} key={item.id} style={{ left: `${item.x}%`, top: `${item.y}%` }}>{item.icon}</span>)}
          <div className="catcher" style={{ left: `${playerX}%` }}><img src="/journey/otter-catcher.webp" alt="Momo si berang-berang membawa keranjang" decoding="async" /></div>
          {!playing && score < 8 && <div className="game-start-card"><span>{lives <= 0 || timeLeft <= 0 ? 'almost!' : 'mini game'}</span><h2>{lives <= 0 || timeLeft <= 0 ? 'Coba sekali lagi?' : 'Catch the sweet things'}</h2><p>Gerakkan Momo dengan tombol, A/D, atau geser jari. Tangkap 8 hadiah sebelum waktunya habis.</p><div className="game-card-actions"><button className="journey-cta" onClick={startGame}>{lives <= 0 || timeLeft <= 0 ? 'Main lagi ↻' : 'Mulai main →'}</button><button className="skip-game" onClick={() => moveTo('story')}>Lanjut ke cerita</button></div></div>}
          <div className="game-move-controls"><button onClick={() => movePlayer(-10)} disabled={!playing} aria-label="Gerak ke kiri">←</button><span>geser di layar · A / D</span><button onClick={() => movePlayer(10)} disabled={!playing} aria-label="Gerak ke kanan">→</button></div>
        </section>
      )}

      {stage === 'gift' && (
        <section className={`gift-stage stage-screen ${giftOpened ? 'gift-opened' : ''}`}>
          <div className="sky-sparkles">{ambient}</div>
          <div className="gift-reveal">
            <span className="eyebrow">you did it, {gift.nickname}!</span>
            <h2>{giftOpened ? <>A bouquet <em>just for you.</em></> : <>A little gift <em>for you.</em></>}</h2>
            <div className="gift-box-scene">
              <img className="gift-bouquet" src="/journey/birthday-bouquet.webp" alt={giftOpened ? 'Buket bunga muncul dari kotak hadiah' : ''} decoding="async" />
              <button className="gift-box" type="button" onClick={openGift} disabled={giftOpened} aria-label="Buka kotak hadiah" aria-expanded={giftOpened}>
                <span className="gift-box-lid" aria-hidden="true"><i /></span>
                <span className="gift-box-body" aria-hidden="true"><i /></span>
                {!giftOpened && <strong>Buka hadiah</strong>}
              </button>
            </div>
            <div className="gift-reveal-copy" aria-live="polite">
              {giftOpened
                ? <><p>Setiap bunga membawa satu doa baik untuk tahun barumu.</p><button className="journey-cta" onClick={acceptBouquet}>Terima buketnya →</button></>
                : <p>Ketuk kotaknya untuk melihat kejutanmu.</p>}
            </div>
          </div>
        </section>
      )}

      {stage === 'story' && (
        <div className="story-stage"><div className="story-ambient" aria-hidden="true">{ambient}</div>
          <section className="story-hero story-section"><span className="eyebrow">the bouquet is yours</span><h1>Happy Birthday,<br /><em>{gift.name}.</em></h1><p>Masih ada beberapa kejutan kecil dari {gift.from}. Scroll pelan-pelan, ya.</p><span className="story-scroll-cue" aria-hidden="true">↓</span></section>

          <section className="petal-story story-section">
            <div className="interactive-heading"><span className="eyebrow">01 · pick a flower</span><h2>Petik empat bunga<br />dari {gift.from}.</h2><p>Setiap bunga menyimpan satu hal yang ingin aku katakan kepadamu.</p></div>
            <div className="petal-bouquet">
              <img src="/journey/birthday-bouquet.webp" alt="Buket dengan empat bunga yang bisa dipetik" loading="lazy" decoding="async" />
              {[
                `Aku suka caramu membuat hal sederhana terasa istimewa, ${gift.nickname}.`,
                'Senyummu selalu punya cara sendiri untuk menenangkan hariku.',
                'Aku bangga melihatmu terus tumbuh menjadi perempuan yang hebat.',
                `Terima kasih sudah menjadi tempat pulang paling hangat untuk ${gift.from}.`,
              ].map((message, index) => (
                <button className={`petal-button petal-${index + 1} ${openedPetals.includes(index) ? 'picked' : ''}`} key={message} onClick={() => revealPetal(index)} aria-label={`Petik bunga ${index + 1}`} aria-pressed={openedPetals.includes(index)}><span>✿</span></button>
              ))}
            </div>
            <div className="petal-message" aria-live="polite">
              {openedPetals.length ? <><span>{String(openedPetals.length).padStart(2, '0')} / 04</span><p>{[
                `Aku suka caramu membuat hal sederhana terasa istimewa, ${gift.nickname}.`,
                'Senyummu selalu punya cara sendiri untuk menenangkan hariku.',
                'Aku bangga melihatmu terus tumbuh menjadi perempuan yang hebat.',
                `Terima kasih sudah menjadi tempat pulang paling hangat untuk ${gift.from}.`,
              ][openedPetals[openedPetals.length - 1]]}</p></> : <p>Sentuh salah satu bunga yang berkilau.</p>}
            </div>
          </section>

          <section className="memory-play story-section">
            <div className="interactive-heading"><span className="eyebrow">02 · flip our memories</span><h2>Balik polaroidnya.</h2><p>Ada tulisan kecil di belakang setiap foto kita.</p></div>
            <div className="polaroid-deck">{gift.photos.map((photo, index) => <button className={`flip-polaroid polaroid-${index + 1} ${flippedMemories.includes(index) ? 'flipped' : ''}`} key={index} onClick={() => flipMemory(index)} aria-label={`${flippedMemories.includes(index) ? 'Lihat foto' : 'Baca pesan'} kenangan ${index + 1}`} aria-pressed={flippedMemories.includes(index)}><span className="polaroid-inner"><span className="polaroid-front"><img src={photo.src} alt={photo.caption} loading="lazy" decoding="async" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = defaultGift.photos[index].src; }} /><small>ketuk untuk membalik ↻</small></span><span className="polaroid-back"><span>0{index + 1}</span><p>{photo.caption}</p><small>— {gift.from}</small></span></span></button>)}</div>
          </section>

          <section className="envelope-story story-section">
            <div className="interactive-heading"><span className="eyebrow">03 · choose a letter</span><h2>Pilih satu amplop.</h2><p>Boleh dibuka semuanya, tapi pilih yang paling kamu butuhkan dulu.</p></div>
            <div className="envelope-row">{[
              { title: 'Kalau kamu sedih', text: `Kamu tidak harus selalu terlihat kuat, ${gift.nickname}. Cerita saja kepadaku, aku akan mendengarkan.` },
              { title: 'Kalau kamu kangen', text: 'Ingat, jarak hanya mengubah tempat kita berdiri—bukan rasa yang aku simpan.' },
              { title: 'Buka sekarang', text: gift.message },
            ].map((letter, index) => <button className={`love-envelope ${openEnvelope === index ? 'open' : ''}`} key={letter.title} onClick={() => { setOpenEnvelope(index); melody.sparkle(); }} aria-expanded={openEnvelope === index}><span className="envelope-icon" aria-hidden="true">♡</span><strong>{letter.title}</strong><small>{openEnvelope === index ? 'sudah dibuka' : 'ketuk amplop'}</small></button>)}</div>
            <div className={`envelope-letter ${openEnvelope !== null ? 'visible' : ''}`} aria-live="polite">{openEnvelope !== null && <><span>Dear {gift.nickname},</span><p>“{[
              `Kamu tidak harus selalu terlihat kuat, ${gift.nickname}. Cerita saja kepadaku, aku akan mendengarkan.`,
              'Ingat, jarak hanya mengubah tempat kita berdiri—bukan rasa yang aku simpan.',
              gift.message,
            ][openEnvelope]}”</p><small>with all my love, {gift.from}</small></>}</div>
          </section>

          <section className={`candle-story story-section ${candleBlown ? 'wish-made' : ''}`}>
            <div className="interactive-heading"><span className="eyebrow">04 · make a wish</span><h2>{candleBlown ? 'Doamu sudah terbang ✦' : 'Tutup mata, lalu buat harapan.'}</h2><p>{candleBlown ? 'Semoga semesta mendengar semuanya.' : 'Tahan tombol lilinnya sampai apinya padam.'}</p></div>
            <div className="birthday-cake" aria-hidden="true"><span className="cake-flame" /><span className="cake-candle" /><span className="cake-top">♡ · ♡ · ♡</span><span className="cake-layer cake-layer-one" /><span className="cake-layer cake-layer-two" /></div>
            <button className="candle-hold" style={{ '--wish-progress': `${candleProgress}%` } as React.CSSProperties} onPointerDown={startCandleHold} onPointerUp={() => stopCandleHold()} onPointerLeave={() => stopCandleHold()} onPointerCancel={() => stopCandleHold()} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') startCandleHold(); }} onKeyUp={(event) => { if (event.key === 'Enter' || event.key === ' ') stopCandleHold(); }} disabled={candleBlown} aria-label="Tahan untuk meniup lilin"><span>{candleBlown ? '✓' : '♥'}</span><strong>{candleBlown ? 'Wish made' : 'Tahan di sini'}</strong></button>
            {candleBlown && <div className="final-wish"><p>{gift.ending}</p><blockquote>“{gift.wish}”</blockquote><span>— {gift.from}</span></div>}
            {candleBlown && <div className="ending-actions"><button onClick={() => setStoryPreview(true)}>Preview untuk Story</button><button onClick={() => copyGiftLink()}>Salin link hadiah</button><button onClick={returnToStart}>Ulangi dari awal</button></div>}
          </section>
        </div>
      )}

      {editorOpen && <div className="journey-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditorOpen(false); }}><div ref={editorRef} className="journey-editor" role="dialog" aria-modal="true" aria-labelledby="editor-title"><div className="editor-heading"><div><span className="eyebrow">personalize it</span><h2 id="editor-title">Edit hadiahmu</h2></div><button onClick={() => setEditorOpen(false)} aria-label="Tutup editor">×</button></div><div className="editor-grid"><label>Nama penerima<input value={draftGift.name} maxLength={40} onChange={(event) => setDraftGift({ ...draftGift, name: event.target.value })} /></label><label>Nama panggilan<input value={draftGift.nickname} maxLength={24} onChange={(event) => setDraftGift({ ...draftGift, nickname: event.target.value })} /></label><label>Nama pengirim<input value={draftGift.from} maxLength={40} onChange={(event) => setDraftGift({ ...draftGift, from: event.target.value })} /></label><label>Tema<select value={draftGift.theme} onChange={(event) => setDraftGift({ ...draftGift, theme: event.target.value as ThemeId })}>{(Object.keys(themes) as ThemeId[]).map((theme) => <option key={theme} value={theme}>{themes[theme].name}</option>)}</select></label><label>Password pembuka<input value={draftGift.password} maxLength={60} autoComplete="off" onChange={(event) => setDraftGift({ ...draftGift, password: event.target.value })} /></label><label>Hint password<input value={draftGift.passwordHint} maxLength={120} onChange={(event) => setDraftGift({ ...draftGift, passwordHint: event.target.value })} /></label></div><label>Kalimat pembuka<textarea rows={2} value={draftGift.intro} maxLength={180} onChange={(event) => setDraftGift({ ...draftGift, intro: event.target.value })} /></label><label>Pesan utama<textarea rows={5} value={draftGift.message} maxLength={900} onChange={(event) => setDraftGift({ ...draftGift, message: event.target.value })} /></label><label>Pesan penutup<textarea rows={3} value={draftGift.ending} maxLength={360} onChange={(event) => setDraftGift({ ...draftGift, ending: event.target.value })} /></label><label>Doa rahasia<textarea rows={3} value={draftGift.wish} maxLength={360} onChange={(event) => setDraftGift({ ...draftGift, wish: event.target.value })} /></label><fieldset className="photo-editor"><legend>Foto & caption kenangan</legend><p>Gunakan link gambar publik agar fotonya ikut terbuka saat link hadiah dibagikan.</p>{draftGift.photos.map((photo, index) => <div className="photo-editor-row" key={index}><span>0{index + 1}</span><label>Link foto<input type="url" inputMode="url" value={photo.src} onChange={(event) => setDraftGift({ ...draftGift, photos: draftGift.photos.map((item, photoIndex) => photoIndex === index ? { ...item, src: event.target.value } : item) })} /></label><label>Caption<input value={photo.caption} maxLength={120} onChange={(event) => setDraftGift({ ...draftGift, photos: draftGift.photos.map((item, photoIndex) => photoIndex === index ? { ...item, caption: event.target.value } : item) })} /></label></div>)}</fieldset><div className="editor-actions"><button className="cancel-editor" onClick={() => setEditorOpen(false)}>Batal</button><button className="journey-cta" onClick={saveEditor}>Simpan & salin link →</button></div></div></div>}

      {storyPreview && <div className="journey-modal-backdrop story-preview-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setStoryPreview(false); }}><div ref={previewRef} className="story-preview-wrap" role="dialog" aria-modal="true" aria-label="Preview hadiah untuk Story"><button className="preview-close" onClick={() => setStoryPreview(false)} aria-label="Tutup preview">×</button><div className="story-poster"><span>UNTUK YANG TERSAYANG</span><h2>{gift.name}</h2><img src={gift.photos[0].src} alt={gift.photos[0].caption} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = defaultGift.photos[0].src; }} /><div className="poster-heart">♥</div><p>Dari {gift.from}</p></div><button className="journey-cta full" onClick={() => copyGiftLink()}>Bagikan link hadiah →</button></div></div>}
    </main>
  );
}
