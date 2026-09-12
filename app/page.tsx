/* eslint-disable @next/next/no-img-element -- Customizable remote photo URLs and decorative images are intentionally rendered directly. */
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type JourneyStage = 'intro' | 'game' | 'gift' | 'crowd' | 'story';
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
  name: 'Naya', nickname: 'Nay', from: 'Rara',
  password: 'naya', passwordHint: 'Nama kamu, huruf kecil.',
  intro: 'Ada kejutan kecil yang dibuat khusus untukmu.',
  message: 'Selamat ulang tahun untuk seseorang yang selalu berhasil membuat hari biasa terasa lebih hangat. Semoga langkahmu tahun ini dipenuhi cerita baru, tawa yang tulus, dan orang-orang yang selalu memilih tinggal.',
  ending: 'Terima kasih sudah hadir dan tumbuh menjadi dirimu yang sekarang. Dunia lebih indah karena ada kamu.',
  wish: 'Semoga semua yang sedang kamu perjuangkan perlahan menemukan jalannya menuju kamu.',
  theme: 'blush',
  photos: [
    { src: '/memories/hero.webp', caption: 'Senyum favorit yang selalu bikin tenang.' },
    { src: '/memories/memory-2.webp', caption: 'Hari sederhana yang berubah jadi kenangan.' },
    { src: '/memories/memory-3.webp', caption: 'Main character di setiap cerita kita.' },
    { src: '/memories/memory-4.webp', caption: 'Masih banyak petualangan yang menunggu.' },
  ],
};

const themes: Record<ThemeId, { name: string; accent: string; soft: string; ink: string; glow: string }> = {
  blush: { name: 'Blush Garden', accent: '#d94d7b', soft: '#fff3f6', ink: '#4d2431', glow: '#ffc4d7' },
  lilac: { name: 'Lilac Dream', accent: '#8055c9', soft: '#f7f1ff', ink: '#382750', glow: '#dac8ff' },
  sage: { name: 'Sage Picnic', accent: '#4d8c70', soft: '#f0f8f2', ink: '#294638', glow: '#c5e7d3' },
  midnight: { name: 'Midnight Love', accent: '#8267e8', soft: '#11162d', ink: '#eef0ff', glow: '#536fff' },
};

const isThemeId = (value: unknown): value is ThemeId => typeof value === 'string' && value in themes;
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
      password: typeof parsed.password === 'string' && parsed.password.trim() ? parsed.password.trim() : defaultGift.password,
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

class MelodyPlayer {
  private context: AudioContext | null = null;
  private timer: number | null = null;
  private playing = false;
  toggle() {
    if (this.playing) {
      if (this.timer) window.clearTimeout(this.timer);
      this.timer = null; this.playing = false; return false;
    }
    const AudioCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return false;
    this.context ||= new AudioCtor(); this.context.resume(); this.playing = true;
    const notes = [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880, 698.46];
    let index = 0;
    const play = () => {
      if (!this.playing || !this.context) return;
      const now = this.context.currentTime;
      const oscillator = this.context.createOscillator(); const gain = this.context.createGain();
      oscillator.type = 'sine'; oscillator.frequency.value = notes[index % notes.length];
      gain.gain.setValueAtTime(0.045, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      oscillator.connect(gain).connect(this.context.destination); oscillator.start(now); oscillator.stop(now + 0.58);
      index += 1; this.timer = window.setTimeout(play, 620);
    };
    play(); return true;
  }
  sparkle() {
    if (!this.context) return;
    [659.25, 783.99, 1046.5].forEach((frequency, index) => {
      if (!this.context) return;
      const now = this.context.currentTime + index * 0.07;
      const oscillator = this.context.createOscillator(); const gain = this.context.createGain();
      oscillator.type = 'triangle'; oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.09, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      oscillator.connect(gain).connect(this.context.destination); oscillator.start(now); oscillator.stop(now + 0.32);
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
  const [toast, setToast] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  const [letterOpen, setLetterOpen] = useState(false);
  const [wishOpen, setWishOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(7);
  const [timeLeft, setTimeLeft] = useState(35);
  const [playerX, setPlayerX] = useState(50);
  const [fallingItems, setFallingItems] = useState<FallingItem[]>([]);
  const playerXRef = useRef(playerX);
  const wonRef = useRef(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const currentTheme = themes[gift.theme];

  useEffect(() => { playerXRef.current = playerX; }, [playerX]);
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
    wonRef.current = false; setPlaying(true);
  };
  const unlockGift = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (passwordInput.trim().toLocaleLowerCase('id-ID') !== gift.password.trim().toLocaleLowerCase('id-ID')) {
      setPasswordError(true);
      return;
    }
    setPasswordError(false);
    startGame();
    moveTo('game');
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
        window.setTimeout(() => moveTo('gift'), 450);
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
      password: draftGift.password.trim() || defaultGift.password,
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
  const toggleMusic = () => { const next = melody.toggle(); setMusicPlaying(next); showToast(next ? 'Lagu kejutan diputar ♪' : 'Musik dijeda'); };
  const themeStyle = { '--accent': currentTheme.accent, '--soft': currentTheme.soft, '--ink': currentTheme.ink, '--glow': currentTheme.glow } as React.CSSProperties;
  const ambient = useMemo(() => floatingMotifs.map((motif) => (
    <span className="ambient-motif" key={motif.id} style={{ left: motif.left, top: motif.top, animationDelay: motif.delay }}>{motif.icon}</span>
  )), []);

  return (
    <main className={`journey-root theme-${gift.theme}`} style={themeStyle}>
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
        {stage !== 'intro' ? <button className="round-control" onClick={() => moveTo('intro')} aria-label="Kembali ke awal">←</button> : <span className="tiny-brand">made for you ♥</span>}
        {stage !== 'intro' && <div><button className="soft-control" onClick={openEditor}>Edit hadiah</button><button className="round-control" onClick={toggleMusic} aria-label={musicPlaying ? 'Jeda musik' : 'Putar musik'}>{musicPlaying ? '♪' : '♫'}</button></div>}
      </header>

      {stage === 'intro' && (
        <section className="intro-stage stage-screen">
          {ambient}
          <div className="intro-copy"><span className="eyebrow">A private little surprise for</span><h1>{gift.name}<em>♥</em></h1><p>{gift.intro}</p>
            <form className={`password-gate ${passwordError ? 'has-error' : ''}`} onSubmit={unlockGift}>
              <label htmlFor="gift-password">Masukkan password rahasianya</label>
              <div className="password-field">
                <span aria-hidden="true">♡</span>
                <input
                  id="gift-password"
                  type="password"
                  value={passwordInput}
                  onChange={(event) => { setPasswordInput(event.target.value); if (passwordError) setPasswordError(false); }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      event.currentTarget.form?.requestSubmit();
                    }
                  }}
                  placeholder="password..."
                  autoComplete="off"
                  aria-describedby="password-hint password-error"
                  aria-invalid={passwordError}
                  autoFocus
                />
                <button type="submit" disabled={!passwordInput.trim()} aria-label="Buka kejutan">→</button>
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
          <div className="game-hud" aria-live="polite"><p>Help Momo prepare a surprise for {gift.nickname}</p><div><span>♥ {score}/8</span><span>♡ {lives}</span><span>{timeLeft}s</span></div></div>
          {fallingItems.map((item) => <span aria-hidden="true" className={`journey-falling-item ${item.icon === '♥' ? 'heart' : ''}`} key={item.id} style={{ left: `${item.x}%`, top: `${item.y}%` }}>{item.icon}</span>)}
          <div className="catcher" style={{ left: `${playerX}%` }}><img src="/journey/otter-catcher.webp" alt="Momo si berang-berang membawa keranjang" decoding="async" /></div>
          {!playing && score < 8 && <div className="game-start-card"><span>{lives <= 0 || timeLeft <= 0 ? 'almost!' : 'mini game'}</span><h2>{lives <= 0 || timeLeft <= 0 ? 'Coba sekali lagi?' : 'Catch the sweet things'}</h2><p>Gerakkan Momo dengan tombol, A/D, atau geser jari. Tangkap 8 hadiah sebelum waktunya habis.</p><div className="game-card-actions"><button className="journey-cta" onClick={startGame}>{lives <= 0 || timeLeft <= 0 ? 'Main lagi ↻' : 'Mulai main →'}</button><button className="skip-game" onClick={() => moveTo('gift')}>Lewati game</button></div></div>}
          <div className="game-move-controls"><button onClick={() => movePlayer(-10)} disabled={!playing} aria-label="Gerak ke kiri">←</button><span>geser di layar · A / D</span><button onClick={() => movePlayer(10)} disabled={!playing} aria-label="Gerak ke kanan">→</button></div>
        </section>
      )}

      {stage === 'gift' && <section className="gift-stage stage-screen"><div className="sky-sparkles">{ambient}</div><div className="gift-copy"><span className="eyebrow">you did it, {gift.nickname}!</span><h2>A bouquet<br /><em>just for you.</em></h2><p>Setiap bunga membawa satu doa baik untuk tahun barumu.</p><button className="journey-cta" onClick={() => moveTo('crowd')}>Terima buketnya →</button></div><img className="gift-bouquet" src="/journey/birthday-bouquet.webp" alt="Buket bunga hadiah" decoding="async" /><img className="gift-mascot" src="/journey/otter-catcher.webp" alt="Momo memberikan buket" decoding="async" /></section>}

      {stage === 'crowd' && <section className="crowd-stage stage-screen"><div className="mascot-crowd" aria-hidden="true">{Array.from({ length: 15 }, (_, index) => <img key={index} src="/journey/mascot-couple.webp" alt="" decoding="async" style={{ '--crowd-delay': `${(index % 5) * -0.18}s`, '--crowd-rotate': `${(index % 3 - 1) * 5}deg` } as React.CSSProperties} />)}</div><button className="envelope-reveal" onClick={() => moveTo('story')}><span className="envelope-icon">✉</span><strong>We have one more thing</strong><small>ketuk untuk membuka surat</small></button></section>}

      {stage === 'story' && (
        <div className="story-stage"><div className="story-ambient" aria-hidden="true">{ambient}</div>
          <section className="story-hero story-section"><img src="/journey/mascot-couple.webp" alt="Momo dan Lili membawa surat" loading="lazy" decoding="async" /><span className="eyebrow">for someone very special</span><h1>Happy Birthday,<br /><em>{gift.name}.</em></h1><p>Scroll pelan-pelan. Ada cerita kecil yang dibuat khusus untukmu.</p><span className="down-arrow">↓</span></section>
          <section className="letter-scene story-section"><div className={`letter-card ${letterOpen ? 'open' : ''}`}><button className="wax-heart" onClick={() => setLetterOpen(true)} disabled={letterOpen} aria-label="Buka surat cinta">♥</button><span className="eyebrow">a letter from {gift.from}</span><h2>{letterOpen ? `Dear ${gift.nickname},` : 'Ada surat untukmu'}</h2>{letterOpen ? <><p className="letter-message">“{gift.message}”</p><p className="signature">with all my love,<br />{gift.from}</p></> : <p>Tekan segel hati untuk membuka pesan.</p>}</div></section>
          <section className="memory-story story-section"><div className="story-heading"><span className="eyebrow">our little archive</span><h2>Potongan waktu<br />yang ingin kusimpan.</h2></div><div className="memory-column">{gift.photos.map((photo, index) => <figure className={index % 2 ? 'tilt-right' : 'tilt-left'} key={index}><img src={photo.src} alt={photo.caption} loading="lazy" decoding="async" onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = defaultGift.photos[index].src; }} /><figcaption><span>0{index + 1}</span>{photo.caption}</figcaption></figure>)}</div></section>
          <section className="wish-scene story-section"><img src="/journey/birthday-bouquet.webp" alt="Buket penutup" loading="lazy" decoding="async" /><span className="eyebrow">one last wish</span><h2>{gift.ending}</h2>{wishOpen ? <p className="wish-reveal">“{gift.wish}”</p> : <button className="journey-cta" onClick={() => { setWishOpen(true); melody.sparkle(); }}>Buka doa rahasia ✦</button>}<div className="ending-actions"><button onClick={() => setStoryPreview(true)}>Preview untuk Story</button><button onClick={() => copyGiftLink()}>Salin link hadiah</button><button onClick={() => moveTo('intro')}>Ulangi dari awal</button></div></section>
        </div>
      )}

      {editorOpen && <div className="journey-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditorOpen(false); }}><div ref={editorRef} className="journey-editor" role="dialog" aria-modal="true" aria-labelledby="editor-title"><div className="editor-heading"><div><span className="eyebrow">personalize it</span><h2 id="editor-title">Edit hadiahmu</h2></div><button onClick={() => setEditorOpen(false)} aria-label="Tutup editor">×</button></div><div className="editor-grid"><label>Nama penerima<input value={draftGift.name} maxLength={40} onChange={(event) => setDraftGift({ ...draftGift, name: event.target.value })} /></label><label>Nama panggilan<input value={draftGift.nickname} maxLength={24} onChange={(event) => setDraftGift({ ...draftGift, nickname: event.target.value })} /></label><label>Nama pengirim<input value={draftGift.from} maxLength={40} onChange={(event) => setDraftGift({ ...draftGift, from: event.target.value })} /></label><label>Tema<select value={draftGift.theme} onChange={(event) => setDraftGift({ ...draftGift, theme: event.target.value as ThemeId })}>{(Object.keys(themes) as ThemeId[]).map((theme) => <option key={theme} value={theme}>{themes[theme].name}</option>)}</select></label><label>Password pembuka<input value={draftGift.password} maxLength={60} autoComplete="off" onChange={(event) => setDraftGift({ ...draftGift, password: event.target.value })} /></label><label>Hint password<input value={draftGift.passwordHint} maxLength={120} onChange={(event) => setDraftGift({ ...draftGift, passwordHint: event.target.value })} /></label></div><label>Kalimat pembuka<textarea rows={2} value={draftGift.intro} maxLength={180} onChange={(event) => setDraftGift({ ...draftGift, intro: event.target.value })} /></label><label>Pesan utama<textarea rows={5} value={draftGift.message} maxLength={900} onChange={(event) => setDraftGift({ ...draftGift, message: event.target.value })} /></label><label>Pesan penutup<textarea rows={3} value={draftGift.ending} maxLength={360} onChange={(event) => setDraftGift({ ...draftGift, ending: event.target.value })} /></label><label>Doa rahasia<textarea rows={3} value={draftGift.wish} maxLength={360} onChange={(event) => setDraftGift({ ...draftGift, wish: event.target.value })} /></label><fieldset className="photo-editor"><legend>Foto & caption kenangan</legend><p>Gunakan link gambar publik agar fotonya ikut terbuka saat link hadiah dibagikan.</p>{draftGift.photos.map((photo, index) => <div className="photo-editor-row" key={index}><span>0{index + 1}</span><label>Link foto<input type="url" inputMode="url" value={photo.src} onChange={(event) => setDraftGift({ ...draftGift, photos: draftGift.photos.map((item, photoIndex) => photoIndex === index ? { ...item, src: event.target.value } : item) })} /></label><label>Caption<input value={photo.caption} maxLength={120} onChange={(event) => setDraftGift({ ...draftGift, photos: draftGift.photos.map((item, photoIndex) => photoIndex === index ? { ...item, caption: event.target.value } : item) })} /></label></div>)}</fieldset><div className="editor-actions"><button className="cancel-editor" onClick={() => setEditorOpen(false)}>Batal</button><button className="journey-cta" onClick={saveEditor}>Simpan & salin link →</button></div></div></div>}

      {storyPreview && <div className="journey-modal-backdrop story-preview-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setStoryPreview(false); }}><div ref={previewRef} className="story-preview-wrap" role="dialog" aria-modal="true" aria-label="Preview hadiah untuk Story"><button className="preview-close" onClick={() => setStoryPreview(false)} aria-label="Tutup preview">×</button><div className="story-poster"><span>UNTUK YANG TERSAYANG</span><h2>{gift.name}</h2><img src={gift.photos[0].src} alt={gift.photos[0].caption} onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = defaultGift.photos[0].src; }} /><div className="poster-heart">♥</div><p>Dari {gift.from}</p></div><button className="journey-cta full" onClick={() => copyGiftLink()}>Bagikan link hadiah →</button></div></div>}
    </main>
  );
}
