'use client';

import { useEffect, useMemo, useState } from 'react';

// GIFT DATA DEFINITION
interface MemoryItem {
  number: string;
  title: string;
  detail: string;
  secretBackNote?: string;
  themeColor?: string;
}

interface PlacedSticker {
  id: number;
  emoji: string;
  x: number;
  y: number;
  rotation: number;
}

interface GiftData {
  name: string;
  nickname: string;
  from: string;
  intro: string;
  message: string;
  ending: string;
  wishBlessing: string;
  photos: { src: string; caption: string; backNote: string }[];
  memories: MemoryItem[];
}

const defaultGift: GiftData = {
  name: 'Naya',
  nickname: 'Nay',
  from: 'your forever bestie, Rara',
  intro: 'Ada seseorang spesial yang hari ini bertambah usia...',
  message: 'Semoga di lembaran umur yang baru ini, setiap harimu dipenuhi tawa lepas, hati yang tenang, dikelilingi orang-orang tulus, dan semua mimpimu perlahan terwujud dengan indah. Terima kasih sudah selalu menjadi tempat cerita ternyaman.',
  ending: 'Terima kasih sudah selalu jadi kamu. Dunia terasa jauh lebih hangat karenamu. ✦',
  wishBlessing: '✨ Harapan Rahasia: Semoga tahun ini membawamu ke tempat-tempat baru yang indah, mimpi besarmu didekatkan, dan hatimu selalu dipenuhi rasa cukup dan bahagia! ♡',
  photos: [
    { src: '/memories/hero.jpg', caption: 'main character energy', backNote: 'Foto ini pas kita pertama kali nongkrong bareng dan ngobrol sampai lupa waktu.' },
    { src: '/memories/memory-2.jpg', caption: 'the prettiest chaos', backNote: 'Momen candid paling chaos tapi entah kenapa kamu selalu keliatan aesthetic.' },
    { src: '/memories/memory-3.jpg', caption: 'this smile >>>', backNote: 'Senyum yang selalu nularin energi positif ke siapapun di sekitarmu.' },
    { src: '/memories/memory-4.jpg', caption: 'icon behavior', backNote: 'Tetap jadi dirimu yang ikonik, berani, dan penuh kejutan ya!' },
  ],
  memories: [
    { number: '01', title: 'The First Random Chat', detail: 'Dari obrolan receh di DM, siapa sangka bisa jadi sahabat paling mengerti luar dalam.', secretBackNote: 'Chat pertama yang berujung jadi tempat pulang ternyaman.', themeColor: '#ffd45c' },
    { number: '02', title: 'Our Loudest Laugh', detail: 'Masih nggak percaya kita ketawa sampai diliatin satu kafe gara-gara hal sepele.', secretBackNote: 'Hal receh bareng kamu selalu jadi memori paling mahal.', themeColor: '#ff8eb1' },
    { number: '03', title: 'Safe Place & Comfort', detail: 'Terima kasih selalu jadi tempat mendengarkan setiap kali dunia lagi capek-capeknya.', secretBackNote: 'You are truly a rare and precious gem in my life.', themeColor: '#a99aff' },
    { number: '04', title: 'To Be Continued...', detail: 'Masih ada ribuan petualangan seru dan cerita baru yang menunggu di depan.', secretBackNote: 'Let\'s make a million more memories together!', themeColor: '#9fe1ca' },
  ],
};

const templateOptions = [
  {
    id: 'scrapbook',
    number: '01',
    name: 'Lilac Scrapbook',
    category: 'bestie',
    badge: 'Popular',
    tag: 'playful · bestie · stickers & music',
    description: 'Aesthetic Y2K scrapbook dengan efek washi tape, stiker bergerak, polaroid deck, dan mini vinyl player.',
    palette: { accent: '#7651c6', soft: '#f4eeff', glow: '#d8caff', ink: '#29213a' },
  },
  {
    id: 'vintage',
    number: '02',
    name: 'Vintage Love Letter',
    category: 'romantic',
    badge: 'Bestseller',
    tag: 'romantic · wax seal · anniversary',
    description: 'Surat cinta klasik dengan segel lilin merah interaktif yang bisa dipecahkan, tekstur perkamen, dan stempel kenangan.',
    palette: { accent: '#801a25', soft: '#f4ead7', glow: '#dfcbb0', ink: '#381219' },
  },
  {
    id: 'jar',
    number: '03',
    name: 'Wishing Star Bottle',
    category: 'sweet',
    badge: 'Interactive',
    tag: 'cute · origami stars · pastel 3D',
    description: 'Toples kaca 3D bercahaya berisi 4 bintang origami harapan. Sentuh bintang untuk membuka lipatan pesan rahasia.',
    palette: { accent: '#a43b69', soft: '#fdecf4', glow: '#f9c8de', ink: '#3f1028' },
  },
  {
    id: 'midnight',
    number: '04',
    name: 'Midnight Mixtape',
    category: 'cyber',
    badge: 'New Theme',
    tag: 'retro 90s · walkman tape · stars',
    description: 'Sentuhan retro kaset pita berputar & rasi bintang bercahaya neon. Pilihan paling estetik untuk pasangan atau sahabat.',
    palette: { accent: '#38bdf8', soft: '#0e1224', glow: '#7155ff', ink: '#e2e8f0' },
  },
] as const;

type TemplateId = typeof templateOptions[number]['id'];

const decorationAssets: Record<TemplateId, string> = {
  scrapbook: '/decorations/scrapbook-collage.png',
  vintage: '/decorations/vintage-heart-frame.png',
  jar: '/decorations/memory-jar.png',
  midnight: '/decorations/midnight-cassette.png',
};

// ==========================================
// WEB AUDIO SYNTHESIZER ENGINE (BGM & SFX)
// ==========================================
class SoundEngine {
  private ctx: AudioContext | null = null;
  private isBgmPlaying = false;
  private bgmTimer: number | null = null;
  private isMuted = false;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playSfx(type: 'pop' | 'sparkle' | 'chime' | 'crack' | 'candle' | 'rustle' | 'sticker') {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    if (type === 'pop' || type === 'sticker') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(type === 'sticker' ? 620 : 440, now);
      osc.frequency.exponentialRampToValueAtTime(type === 'sticker' ? 880 : 780, now + 0.07);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } else if (type === 'sparkle') {
      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        gain.gain.setValueAtTime(0.12, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.28);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.3);
      });
    } else if (type === 'crack') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.16);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.17);
    } else if (type === 'candle') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(540, now + 0.3);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'rustle' || type === 'chime') {
      const chords = [523.25, 659.25, 783.99, 1046.50];
      chords.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);
        gain.gain.setValueAtTime(0.18, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.45);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.48);
      });
    }
  }

  toggleBgm(): boolean {
    this.initCtx();
    if (this.isBgmPlaying) {
      this.stopBgm();
      return false;
    } else {
      this.startBgm();
      return true;
    }
  }

  private startBgm() {
    if (!this.ctx || this.isBgmPlaying) return;
    this.isBgmPlaying = true;
    const notes = [
      261.63, 329.63, 392.00, 523.25,
      220.00, 261.63, 329.63, 440.00,
      174.61, 220.00, 261.63, 349.23,
      196.00, 246.94, 293.66, 392.00
    ];
    let noteIdx = 0;

    const playNext = () => {
      if (!this.isBgmPlaying || !this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(notes[noteIdx % notes.length], now);
      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.38);

      noteIdx++;
      this.bgmTimer = window.setTimeout(playNext, 420);
    };

    playNext();
  }

  private stopBgm() {
    this.isBgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

const audio = new SoundEngine();

// ==========================================
// MAIN COMPONENT
// ==========================================
export default function Home() {
  const [giftData, setGiftData] = useState<GiftData>(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      try {
        const hash = window.location.hash.replace('#data=', '');
        if (hash) {
          const decoded = JSON.parse(decodeURIComponent(escape(atob(hash))));
          if (decoded && decoded.name) {
            return { ...defaultGift, ...decoded };
          }
        }
      } catch (e) {
        console.error('Failed to parse URL gift data', e);
      }
    }
    return defaultGift;
  });

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [opened, setOpened] = useState(false);
  const [activePhoto, setActivePhoto] = useState<number | null>(null);

  // Tactical & Creative States
  const [deckIndex, setDeckIndex] = useState(0);
  const [isDeckFlipped, setIsDeckFlipped] = useState(false);
  const [letterFoldStage, setLetterFoldStage] = useState(1); // 1 = teaser, 2 = half open, 3 = fully open
  const [activeStarNote, setActiveStarNote] = useState<number | null>(null);
  const [surprise, setSurprise] = useState(false);
  const [candleBlown, setCandleBlown] = useState(false);
  const [isWaxCracked, setIsWaxCracked] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sticker Palette & Placed Stamps
  const [selectedStickerEmoji, setSelectedStickerEmoji] = useState<string | null>(null);
  const [placedStickers, setPlacedStickers] = useState<PlacedSticker[]>([]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (activePhoto === null) return;
      if (event.key === 'Escape') setActivePhoto(null);
      if (event.key === 'ArrowRight') setActivePhoto((activePhoto + 1) % giftData.photos.length);
      if (event.key === 'ArrowLeft') setActivePhoto((activePhoto - 1 + giftData.photos.length) % giftData.photos.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activePhoto, giftData.photos.length]);

  useEffect(() => {
    document.body.style.overflow = activePhoto !== null || isCustomizerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [activePhoto, isCustomizerOpen]);

  // Confetti particles generator
  const confetti = useMemo(() => Array.from({ length: 65 }, (_, i) => ({
    id: i,
    left: `${(i * 37) % 100}%`,
    delay: `${(i % 11) * 0.09}s`,
    color: ['#ff8eb1', '#ffd45c', '#9fe1ca', '#a99aff', '#ffffff', '#38bdf8'][i % 6],
    rotate: `${(i * 53) % 360}deg`,
  })), []);

  const currentTemplate = templateOptions.find((t) => t.id === selectedTemplate) || templateOptions[0];

  // HANDLERS
  const handleOpenTemplate = () => {
    audio.playSfx('pop');
    if (selectedTemplate === 'vintage') {
      setIsWaxCracked(true);
      audio.playSfx('crack');
      setTimeout(() => setOpened(true), 550);
    } else {
      audio.playSfx('sparkle');
      setOpened(true);
    }
  };

  const handleBlowCandle = () => {
    if (candleBlown) return;
    setCandleBlown(true);
    audio.playSfx('candle');
    setTimeout(() => {
      audio.playSfx('sparkle');
      setSurprise(true);
      showToast('🎂 Harapanmu telah dipanjatkan ke langit! ✦');
    }, 380);
  };

  const toggleBgmState = () => {
    const playing = audio.toggleBgm();
    setIsAudioPlaying(playing);
    if (playing) {
      showToast('🎵 Musik Latar Mengalun');
    } else {
      showToast('🔇 Musik Dimatikan');
    }
  };

  const handlePlaceSticker = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedStickerEmoji) return;
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input') || target.closest('textarea') || target.closest('.lightbox-overlay')) {
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const randomRot = Math.floor(Math.random() * 40) - 20;

    const newSticker: PlacedSticker = {
      id: Date.now() + Math.random(),
      emoji: selectedStickerEmoji,
      x,
      y,
      rotation: randomRot,
    };

    audio.playSfx('sticker');
    setPlacedStickers((prev) => [...prev, newSticker]);
  };

  const handleShuffleDeck = (e: React.MouseEvent) => {
    e.stopPropagation();
    audio.playSfx('pop');
    setIsDeckFlipped(false);
    setDeckIndex((prev) => (prev + 1) % giftData.photos.length);
  };

  const goBackToCatalog = () => {
    setSelectedTemplate(null);
    setOpened(false);
    setIsWaxCracked(false);
    setCandleBlown(false);
    setLetterFoldStage(1);
    setActiveStarNote(null);
    setPlacedStickers([]);
    setSelectedStickerEmoji(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShareLink = () => {
    try {
      const serialized = btoa(unescape(encodeURIComponent(JSON.stringify(giftData))));
      const shareUrl = `${window.location.origin}${window.location.pathname}#data=${serialized}`;
      navigator.clipboard.writeText(shareUrl);
      audio.playSfx('sparkle');
      showToast('✨ Link Hadiah Berhasil Disalin!');
    } catch (e) {
      console.error(e);
      showToast('Gagal menyalin link');
    }
  };

  const filteredTemplates = useMemo(() => {
    if (categoryFilter === 'all') return templateOptions;
    return templateOptions.filter((t) => t.category === categoryFilter);
  }, [categoryFilter]);

  // ==========================================
  // VIEW 1: BOUTIQUE CATALOG
  // ==========================================
  if (!selectedTemplate) {
    return (
      <main className="catalog-wrapper">
        {toastMessage && <div className="toast-notice">✦ {toastMessage}</div>}

        <nav className="catalog-nav">
          <a className="brand-logo" href="#top">
            made for you <span>✦</span>
          </a>
          <div className="nav-actions">
            <button className="btn-pill" onClick={() => setIsCustomizerOpen(true)}>
              🎨 Buat / Edit Kado
            </button>
            <button className="btn-pill highlight" onClick={handleShareLink}>
              🔗 Salin Link Hadiah
            </button>
          </div>
        </nav>

        <header className="catalog-hero" id="top">
          <div>
            <p className="catalog-kicker">✦ artisanal digital gifts for your favorite person</p>
            <h1>
              Kado Digital Unik.<br />
              <em>Bikin Momen Abadi.</em>
            </h1>
          </div>
          <div className="catalog-intro-box">
            <p>
              Satu link interaktif berisi cerita, tumpukan polaroid yang bisa dikocok & dibalik, toples bintang origami, segel lilin wax seal, dan lilin ulang tahun virtual.
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span className="template-feature-chip">🎵 Web Audio Melody</span>
              <span className="template-feature-chip">💌 Unfolding Origami Letter</span>
              <span className="template-feature-chip">✨ Sticker Stamping</span>
              <span className="template-feature-chip">🎂 Virtual Candle Ceremony</span>
            </div>
          </div>
        </header>

        {/* Category Filters */}
        <div className="catalog-filters">
          <div className="filter-group">
            {[
              { key: 'all', label: 'Semua Desain' },
              { key: 'bestie', label: '👭 Bestie & Fun' },
              { key: 'romantic', label: '💌 Romantic & Anniversary' },
              { key: 'sweet', label: '🌸 Cute & Sweet' },
              { key: 'cyber', label: '⚡ Retro Cyber & Partner' },
            ].map((f) => (
              <button
                key={f.key}
                className={`filter-btn ${categoryFilter === f.key ? 'active' : ''}`}
                onClick={() => setCategoryFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Template Cards Grid */}
        <section className="template-grid" aria-label="Template Kado Digital">
          {filteredTemplates.map((template) => (
            <article className="template-card-modern" key={template.id}>
              <span className={`card-banner ${template.badge === 'Bestseller' ? 'hot' : template.badge === 'New Theme' ? 'new' : 'special'}`}>
                {template.badge}
              </span>
              <div
                className={`template-preview-frame preview-${template.id}`}
                onClick={() => {
                  setSelectedTemplate(template.id);
                  window.scrollTo({ top: 0 });
                }}
              >
                <img
                  className="generated-template-art"
                  src={decorationAssets[template.id]}
                  alt={`Ilustrasi orisinal untuk template ${template.name}`}
                />
              </div>

              <div className="template-card-body">
                <div className="template-card-header">
                  <h3>{template.name}</h3>
                </div>
                <p style={{ margin: 0, fontSize: '13px', color: '#605759', lineHeight: 1.45 }}>
                  {template.description}
                </p>
                <ul className="template-features-list">
                  {template.tag.split(' · ').map((tag, i) => (
                    <li className="template-feature-chip" key={i}>
                      ✦ {tag}
                    </li>
                  ))}
                </ul>
                <div className="template-card-actions">
                  <button
                    className="btn-demo"
                    onClick={() => {
                      setSelectedTemplate(template.id);
                      window.scrollTo({ top: 0 });
                    }}
                  >
                    Buka Hadiah Ini ↗
                  </button>
                </div>
              </div>
            </article>
          ))}
        </section>

        {/* Customizer Modal */}
        {isCustomizerOpen && (
          <div className="customizer-overlay" onClick={() => setIsCustomizerOpen(false)}>
            <div className="customizer-modal" onClick={(e) => e.stopPropagation()}>
              <div className="customizer-header">
                <h2>🎨 Kustomisasi Hadiah Digital</h2>
                <button
                  style={{ border: 0, background: 'none', fontSize: '24px' }}
                  onClick={() => setIsCustomizerOpen(false)}
                >
                  ✕
                </button>
              </div>

              <div className="form-group">
                <label>Nama Penerima</label>
                <input
                  className="form-input"
                  value={giftData.name}
                  onChange={(e) => setGiftData({ ...giftData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Nama Panggilan / Nickname</label>
                <input
                  className="form-input"
                  value={giftData.nickname}
                  onChange={(e) => setGiftData({ ...giftData, nickname: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Dari (Pengirim)</label>
                <input
                  className="form-input"
                  value={giftData.from}
                  onChange={(e) => setGiftData({ ...giftData, from: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Pesan Surat Utama</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={giftData.message}
                  onChange={(e) => setGiftData({ ...giftData, message: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Pesan Harapan Lilin (Wish Blessing)</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={giftData.wishBlessing}
                  onChange={(e) => setGiftData({ ...giftData, wishBlessing: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  className="btn-pill highlight"
                  style={{ flex: 1, padding: '12px' }}
                  onClick={() => {
                    handleShareLink();
                    setIsCustomizerOpen(false);
                  }}
                >
                  Simpan & Salin Link Hadiah 🔗
                </button>
                <button
                  className="btn-pill"
                  onClick={() => {
                    setGiftData(defaultGift);
                    showToast('Data kembali ke default');
                  }}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }

  // ==========================================
  // VIEW 2: THEMATIC OPENING EXPERIENCES
  // ==========================================
  const style = {
    '--accent': currentTemplate.palette.accent,
    '--soft': currentTemplate.palette.soft,
    '--glow': currentTemplate.palette.glow,
    '--ink': currentTemplate.palette.ink,
  } as React.CSSProperties;

  if (!opened) {
    return (
      <main className={`opening-viewport theme-${selectedTemplate}`} style={style}>
        {toastMessage && <div className="toast-notice">✦ {toastMessage}</div>}

        <div className="opening-top-nav">
          <button className="back-catalog-btn" onClick={goBackToCatalog}>
            ← Kembali ke Katalog
          </button>
          <button className="back-catalog-btn" onClick={toggleBgmState}>
            {isAudioPlaying ? '🎵 Musik: Nyala' : '🔇 Musik: Mati'}
          </button>
        </div>

        <div className="opening-container">
          {/* SCRAPBOOK THEME OPENING */}
          {selectedTemplate === 'scrapbook' && (
            <div className="scrapbook-cover-card">
              <img className="opening-generated-art scrapbook-art" src={decorationAssets.scrapbook} alt="Kolase scrapbook dengan bunga, pita, dan bingkai foto" />
              <span className="scrapbook-sticker top-right">SPECIAL DAY ✦</span>
              <span className="scrapbook-sticker bottom-left">FOR {giftData.nickname.toUpperCase()} ♡</span>
              <p className="catalog-kicker" style={{ justifyContent: 'center' }}>
                A tiny zine made with lots of love
              </p>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(36px, 8vw, 68px)', margin: '14px 0' }}>
                Happy Birthday,<br />
                <em style={{ color: currentTemplate.palette.accent }}>{giftData.name}!</em>
              </h1>
              <p style={{ margin: '12px auto 28px', maxWidth: '420px', color: '#605759', fontSize: '15px' }}>
                {giftData.intro}
              </p>
              <button className="btn-pill primary" style={{ padding: '14px 32px', fontSize: '14px' }} onClick={handleOpenTemplate}>
                Buka Scrapbook Kita 📖 →
              </button>
            </div>
          )}

          {/* VINTAGE WAX SEAL OPENING */}
          {selectedTemplate === 'vintage' && (
            <div className="wax-envelope-wrapper">
              <img className="opening-generated-art vintage-art" src={decorationAssets.vintage} alt="Bingkai surat cinta berbentuk hati dengan renda dan pita beludru" />
              <p className="catalog-kicker" style={{ color: '#801a25', justifyContent: 'center' }}>
                CONFIDENTIAL · SENT WITH LOVE
              </p>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(34px, 7vw, 62px)', margin: '12px 0', color: '#381219' }}>
                To My Favorite<br />
                <em>Person.</em>
              </h1>
              <p style={{ margin: '10px auto 20px', maxWidth: '380px', color: '#6e454c', fontStyle: 'italic' }}>
                {giftData.intro}
              </p>

              {/* Interactive Wax Seal */}
              <div
                className={`wax-seal-interactive ${isWaxCracked ? 'cracking' : ''}`}
                onClick={handleOpenTemplate}
                title="Tekan untuk memecahkan segel lilin"
              >
                <span className="wax-seal-text">
                  PRESS<br />TO BREAK<br />SEAL ✦
                </span>
              </div>
              <p style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#8a5e66', textTransform: 'uppercase' }}>
                Sent with warmth from {giftData.from}
              </p>
            </div>
          )}

          {/* REASONS GLOWING JAR OPENING */}
          {selectedTemplate === 'jar' && (
            <div>
              <p className="catalog-kicker" style={{ color: '#ffb5d3', justifyContent: 'center' }}>
                A bottle full of sweet origami wishes
              </p>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(36px, 8vw, 64px)', color: '#fff' }}>
                Wishing Stars For<br />
                <em style={{ color: '#ffb5d3' }}>{giftData.name}.</em>
              </h1>
              <div className="glowing-jar-hero" onClick={handleOpenTemplate}>
                <img className="opening-generated-art jar-art" src={decorationAssets.jar} alt="Toples kaca bercahaya berisi surat-surat kecil" />
                <span style={{ position: 'absolute', bottom: '16px', fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#ffe6f1', textTransform: 'uppercase' }}>
                  Ketuk Untuk Membuka
                </span>
              </div>
              <button className="btn-pill highlight" style={{ padding: '12px 28px' }} onClick={handleOpenTemplate}>
                Buka Botol Harapan ✦
              </button>
            </div>
          )}

          {/* MIDNIGHT MIXTAPE OPENING */}
          {selectedTemplate === 'midnight' && (
            <div className="cassette-box-wrapper">
              <p className="catalog-kicker" style={{ color: '#38bdf8', justifyContent: 'center' }}>
                ⚡ RETRO WALKMAN & STARRY CONSTELLATION
              </p>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(36px, 8vw, 64px)', color: '#fff' }}>
                Side A: For You,<br />
                <em style={{ color: '#38bdf8' }}>{giftData.nickname}.</em>
              </h1>
              <p style={{ color: '#94a3b8', maxWidth: '400px', margin: '14px auto 20px', fontSize: '14px' }}>
                {giftData.intro}
              </p>
              <img className="opening-generated-art cassette-art" src={decorationAssets.midnight} alt="Kaset retro biru dengan pita membentuk hati dan bintang" />
              <button className="cassette-play-btn" onClick={handleOpenTemplate}>
                ▶ Putar Kaset & Jelajahi Bintang ✦
              </button>
            </div>
          )}
        </div>
      </main>
    );
  }

  // ==========================================
  // VIEW 3: ACTIVE BESPOKE MINI-SITE
  // ==========================================
  return (
    <div
      className={`site-main theme-${selectedTemplate}`}
      style={style}
      onClick={handlePlaceSticker}
    >
      {toastMessage && <div className="toast-notice">✦ {toastMessage}</div>}

      {/* Floating Confetti Shower when candle is blown or surprise is active */}
      {surprise && (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 90, overflow: 'hidden' }}>
          {confetti.map((item) => (
            <div
              key={item.id}
              style={{
                position: 'absolute',
                top: '-20px',
                left: item.left,
                width: '10px',
                height: '14px',
                backgroundColor: item.color,
                borderRadius: '2px',
                transform: `rotate(${item.rotate})`,
                animation: `confettiFall 3.2s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
                animationDelay: item.delay,
              }}
            />
          ))}
        </div>
      )}

      {/* Floating Action Dock */}
      <div className="floating-dock">
        <button className="dock-btn" onClick={goBackToCatalog} title="Kembali ke katalog">
          ← Desain
        </button>
        <button className={`dock-btn ${isAudioPlaying ? 'active' : ''}`} onClick={toggleBgmState}>
          {isAudioPlaying ? (
            <>
              <div className="audio-pulsing-bar">
                <span /><span /><span />
              </div>
              <span>Musik</span>
            </>
          ) : (
            '🔇 Musik'
          )}
        </button>
        <button
          className={`dock-btn ${selectedStickerEmoji ? 'active' : ''}`}
          onClick={() => {
            if (selectedStickerEmoji) {
              setSelectedStickerEmoji(null);
              showToast('Mode Stiker Nonaktif');
            } else {
              setSelectedStickerEmoji('✨');
              showToast('🎨 Mode Tempel Stiker Aktif! Ketuk di mana saja');
            }
          }}
        >
          {selectedStickerEmoji ? '✨ Tempel: Aktif' : '🎨 Tempel Stiker'}
        </button>
        <button className="dock-btn" onClick={() => document.getElementById('cake-section')?.scrollIntoView({ behavior: 'smooth' })}>
          🎂 Tiup Lilin
        </button>
        <button className="dock-btn primary" onClick={handleShareLink}>
          🔗 Bagikan
        </button>
      </div>

      {/* Floating Sticker Selector Tray when active */}
      {selectedStickerEmoji && (
        <div className="sticker-bar">
          {['✨', '🎀', '🧸', '🍰', '💌', '🍓', '🌸', '🧃', '🎵', '✦'].map((emoji) => (
            <button
              key={emoji}
              className={`sticker-item-btn ${selectedStickerEmoji === emoji ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedStickerEmoji(emoji);
                audio.playSfx('pop');
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Placed Interactive Stickers on page */}
      {placedStickers.map((stk) => (
        <div
          key={stk.id}
          className="placed-sticker"
          style={{
            left: stk.x,
            top: stk.y,
            transform: `rotate(${stk.rotation}deg)`,
          }}
          onClick={(e) => {
            e.stopPropagation();
            audio.playSfx('pop');
            setPlacedStickers((prev) => prev.filter((s) => s.id !== stk.id));
            showToast('Stiker dilepas');
          }}
          title="Ketuk untuk melepas stiker"
        >
          {stk.emoji}
        </div>
      ))}

      {/* SECTION: HERO */}
      <section className="hero-section" style={{ textAlign: 'center', padding: ' clamp(48px, 8vw, 90px) 20px clamp(24px, 4vw, 40px)' }}>
        <p className="catalog-kicker" style={{ justifyContent: 'center' }}>
          ✦ SPECIAL BIRTHDAY EDITION FOR {giftData.nickname.toUpperCase()} ✦
        </p>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(42px, 9vw, 88px)', lineHeight: 1, margin: '12px 0 20px', letterSpacing: '-0.04em' }}>
          Happy Birthday,<br />
          <em style={{ color: currentTemplate.palette.accent }}>{giftData.name}</em> <span>♡</span>
        </h1>
        <p style={{ maxWidth: '520px', margin: '0 auto 24px', fontSize: '16px', lineHeight: 1.6, opacity: 0.85 }}>
          {giftData.intro}
        </p>

        {/* Mini Spinning Audio Widget */}
        <div className="mini-player-widget">
          <div className={`vinyl-disc ${isAudioPlaying ? 'spinning' : ''}`}>
            <div className="vinyl-center" />
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
              {giftData.nickname}&rsquo;s Melody
            </p>
            <p style={{ margin: '2px 0 0', fontSize: '12px', opacity: 0.7 }}>
              {isAudioPlaying ? 'Sedang Memutar Suasana' : 'Ketuk untuk memutar musik latar'}
            </p>
          </div>
          <button
            className="btn-pill"
            style={{ padding: '8px 14px' }}
            onClick={(e) => {
              e.stopPropagation();
              toggleBgmState();
            }}
          >
            {isAudioPlaying ? '⏸ Jeda' : '▶ Putar'}
          </button>
        </div>
      </section>

      {/* SECTION 1: UNFOLDING SECRET ORIGAMI LETTER */}
      <section className="section" id="letter-section" style={{ padding: '0 20px 40px' }}>
        <div className="unfolding-letter-box">
          <p className="catalog-kicker">01 / A SECRET ORIGAMI LETTER</p>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', margin: '6px 0 18px' }}>
            Surat Rahasia Yang Terlipat ✉️
          </h2>

          {letterFoldStage === 1 && (
            <div style={{ background: '#f8f4ec', borderRadius: '12px', padding: '24px', textAlign: 'center', border: '1px dashed #d5c8b5' }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: '#68595b', margin: '0 0 16px' }}>
                📩 Ada sebuah surat tulus dari <strong>{giftData.from}</strong> yang menunggu untuk dibuka.
              </p>
              <button
                className="btn-pill highlight"
                onClick={(e) => {
                  e.stopPropagation();
                  audio.playSfx('rustle');
                  setLetterFoldStage(2);
                }}
              >
                📜 Buka Lipatan Pertama
              </button>
            </div>
          )}

          {letterFoldStage >= 2 && (
            <div className={`origami-fold ${letterFoldStage === 3 ? 'unfolded' : 'unfolded'}`}>
              <div style={{ padding: '16px 8px', borderLeft: `3px solid ${currentTemplate.palette.accent}`, paddingLeft: '20px', margin: '16px 0' }}>
                <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 'clamp(18px, 3.5vw, 24px)', lineHeight: 1.6, margin: 0, color: 'var(--ink, #251f20)' }}>
                  &ldquo;{giftData.message}&rdquo;
                </p>
              </div>

              {letterFoldStage === 2 && (
                <button
                  className="unfold-trigger-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    audio.playSfx('sparkle');
                    setLetterFoldStage(3);
                    showToast('Surat terbuka sepenuhnya 💌');
                  }}
                >
                  ✦ Buka Seluruh Surat & Tanda Tangan
                </button>
              )}

              {letterFoldStage === 3 && (
                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                  <p style={{ fontFamily: 'var(--font-handwriting)', fontSize: '28px', color: currentTemplate.palette.accent, margin: 0 }}>
                    Warmest hugs & love,<br />
                    {giftData.from} ♡
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 2: TACTILE POLAROID MEMORIES DECK */}
      <section className="section" style={{ padding: '0 20px 50px', textAlign: 'center' }}>
        <p className="catalog-kicker" style={{ justifyContent: 'center' }}>02 / TACTILE POLAROID STACK</p>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', margin: '6px 0 10px' }}>
          Tumpukan Kenangan Abadi 📸
        </h2>
        <p style={{ fontSize: '14px', color: '#68595b', maxWidth: '440px', margin: '0 auto 20px' }}>
          Ketuk kartu polaroid untuk <strong>membalik & membaca catatan tulisan tangan di belakang</strong>.
        </p>

        <div className="polaroid-stack-container">
          {giftData.photos.map((photo, idx) => {
            const isCurrent = idx === deckIndex;
            if (!isCurrent) return null;
            return (
              <div
                key={photo.src}
                className={`polaroid-stack-card ${isDeckFlipped ? 'flipped' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  audio.playSfx('pop');
                  setIsDeckFlipped(!isDeckFlipped);
                }}
                title="Ketuk untuk membalik kartu"
              >
                <div className="polaroid-card-face">
                  <img
                    src={photo.src}
                    alt={photo.caption}
                    onClick={(e) => {
                      if (!isDeckFlipped) {
                        e.stopPropagation();
                        setActivePhoto(idx);
                        audio.playSfx('pop');
                      }
                    }}
                  />
                  <h3 style={{ fontFamily: 'var(--font-handwriting)', fontSize: '24px', margin: '14px 0 0', color: '#251f20' }}>
                    {photo.caption}
                  </h3>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#8c7b80', marginTop: '4px' }}>
                    (Ketuk foto untuk zoom / Ketuk kartu untuk balik)
                  </span>
                </div>
                <div className="polaroid-card-back">
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#801a25', textTransform: 'uppercase', marginBottom: '8px' }}>
                    ✦ Handwritten Note
                  </span>
                  <p>&ldquo;{photo.backNote}&rdquo;</p>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#8c7b80', marginTop: '16px' }}>
                    (Ketuk untuk balik ke foto)
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="polaroid-stack-controls">
          <button className="btn-pill highlight" onClick={handleShuffleDeck}>
            🃏 Geser Foto ({deckIndex + 1}/{giftData.photos.length}) ✦
          </button>
          <button
            className="btn-pill"
            onClick={() => {
              setActivePhoto(deckIndex);
              audio.playSfx('pop');
            }}
          >
            🔍 Zoom Foto
          </button>
        </div>
      </section>

      {/* SECTION 3: BESPOKE THEMATIC EXPERIENCES */}
      <section className="section" style={{ padding: '0 20px 50px', textAlign: 'center' }}>
        {/* TEMPLATE JAR: WISHING STAR BOTTLE */}
        {selectedTemplate === 'jar' && (
          <div>
            <p className="catalog-kicker" style={{ justifyContent: 'center' }}>03 / TOPLES BINTANG HARAPAN</p>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', margin: '6px 0 10px' }}>
              4 Bintang Origami Rahasia ⭐
            </h2>
            <p style={{ fontSize: '14px', color: '#68595b', maxWidth: '440px', margin: '0 auto 24px' }}>
              Pilih dan ketuk salah satu bintang origami untuk membuka lipatan pesan harapan rahasia di dalamnya!
            </p>

            <div className="wishing-stars-grid">
              {giftData.memories.map((mem, idx) => {
                const isOpen = activeStarNote === idx;
                return (
                  <div
                    key={mem.number}
                    className={`origami-star-card ${isOpen ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      audio.playSfx(isOpen ? 'pop' : 'sparkle');
                      setActiveStarNote(isOpen ? null : idx);
                    }}
                  >
                    <div className="star-card-folded">
                      <div className="star-badge-icon">⭐</div>
                      <div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#a43b69', fontWeight: 700 }}>
                          STAR #{mem.number}
                        </span>
                        <h4 style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: 600 }}>
                          {mem.title}
                        </h4>
                      </div>
                    </div>
                    {isOpen && (
                      <div className="star-note-expanded">
                        <p style={{ margin: 0 }}>{mem.detail}</p>
                        {mem.secretBackNote && (
                          <p style={{ margin: '8px 0 0', fontSize: '18px', color: '#a43b69', fontStyle: 'italic' }}>
                            ✨ {mem.secretBackNote}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TEMPLATE MIDNIGHT: RETRO MIXTAPE & CONSTELLATION */}
        {selectedTemplate === 'midnight' && (
          <div>
            <p className="catalog-kicker" style={{ justifyContent: 'center', color: '#38bdf8' }}>
              03 / CASSETTE SIDE A TRACKLIST
            </p>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', margin: '6px 0 10px', color: '#fff' }}>
              Mixtape Rasi Bintang 📼
            </h2>
            <p style={{ fontSize: '14px', color: '#94a3b8', maxWidth: '440px', margin: '0 auto 24px' }}>
              4 lagu kenangan & koordinat rasi bintang yang menyinari perjalanan kita.
            </p>

            <div className="wishing-stars-grid">
              {giftData.memories.map((mem, idx) => {
                const isOpen = activeStarNote === idx;
                return (
                  <div
                    key={mem.number}
                    className={`origami-star-card ${isOpen ? 'active' : ''}`}
                    style={{ background: '#171d3d', borderColor: '#3d4a82', color: '#e2e8f0' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      audio.playSfx(isOpen ? 'pop' : 'sparkle');
                      setActiveStarNote(isOpen ? null : idx);
                    }}
                  >
                    <div className="star-card-folded">
                      <div className="star-badge-icon" style={{ background: 'rgba(56, 189, 248, 0.2)' }}>
                        🎵
                      </div>
                      <div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#38bdf8', fontWeight: 700 }}>
                          TRACK #{mem.number}
                        </span>
                        <h4 style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: 600, color: '#fff' }}>
                          {mem.title}
                        </h4>
                      </div>
                    </div>
                    {isOpen && (
                      <div className="star-note-expanded" style={{ color: '#bae6fd', borderTopColor: '#3d4a82' }}>
                        <p style={{ margin: 0 }}>{mem.detail}</p>
                        {mem.secretBackNote && (
                          <p style={{ margin: '8px 0 0', fontSize: '18px', color: '#38bdf8' }}>
                            ⚡ {mem.secretBackNote}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TEMPLATE VINTAGE & SCRAPBOOK: MEMORY ARCHIVE */}
        {(selectedTemplate === 'vintage' || selectedTemplate === 'scrapbook') && (
          <div>
            <p className="catalog-kicker" style={{ justifyContent: 'center' }}>
              03 / OUR MEMORY ARCHIVE
            </p>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', margin: '6px 0 10px' }}>
              Lembaran Momen Berharga 📖
            </h2>
            <p style={{ fontSize: '14px', color: '#68595b', maxWidth: '440px', margin: '0 auto 24px' }}>
              Setiap babak cerita yang membuat persahabatan & cinta kita begitu berwarna.
            </p>

            <div className="wishing-stars-grid">
              {giftData.memories.map((mem, idx) => {
                const isOpen = activeStarNote === idx;
                return (
                  <div
                    key={mem.number}
                    className={`origami-star-card ${isOpen ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      audio.playSfx(isOpen ? 'pop' : 'sparkle');
                      setActiveStarNote(isOpen ? null : idx);
                    }}
                  >
                    <div className="star-card-folded">
                      <div className="star-badge-icon" style={{ background: 'rgba(118, 81, 198, 0.15)' }}>
                        💌
                      </div>
                      <div>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: currentTemplate.palette.accent, fontWeight: 700 }}>
                          CHAPTER #{mem.number}
                        </span>
                        <h4 style={{ margin: '2px 0 0', fontSize: '16px', fontWeight: 600 }}>
                          {mem.title}
                        </h4>
                      </div>
                    </div>
                    {isOpen && (
                      <div className="star-note-expanded">
                        <p style={{ margin: 0 }}>{mem.detail}</p>
                        {mem.secretBackNote && (
                          <p style={{ margin: '8px 0 0', fontSize: '18px', color: currentTemplate.palette.accent, fontStyle: 'italic' }}>
                            ✦ {mem.secretBackNote}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* SECTION 4: VIRTUAL BIRTHDAY CAKE & CANDLE CEREMONY */}
      <section className="section" id="cake-section" style={{ padding: '0 20px 60px' }}>
        <div className="cake-ceremony-box">
          <p className="catalog-kicker" style={{ justifyContent: 'center' }}>04 / MAKE A WISH CEREMONY</p>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(28px, 6vw, 42px)', margin: '6px 0 10px' }}>
            {candleBlown ? 'Permohonan Terkabul! 🎉' : 'Tiup Lilin Ulang Tahunmu 🎂'}
          </h2>
          <p style={{ fontSize: '15px', color: '#68595b', maxWidth: '420px', margin: '0 auto' }}>
            {candleBlown
              ? 'Lilin telah ditiup! Semoga semua doa dan harapan baikmu terwujud.'
              : 'Pikirkan 1 permohonan tulusmu dalam hati, lalu ketuk kue/lilin di bawah ini untuk meniupnya.'}
          </p>

          <div className="cake-visual-container" onClick={handleBlowCandle} title="Ketuk untuk meniup lilin">
            <div className="candles-row">
              {[0, 1, 2].map((i) => (
                <div className="candle-stick" key={i}>
                  <div className={candleBlown ? 'candle-smoke' : 'candle-flame'} />
                </div>
              ))}
            </div>
            <div className="cake-tier-top" />
            <div className="cake-tier-bottom" />
          </div>

          {!candleBlown ? (
            <button className="btn-pill highlight" style={{ padding: '12px 28px' }} onClick={handleBlowCandle}>
              💨 Ketuk Untuk Tiup Lilin ✦
            </button>
          ) : (
            <div className="wish-reveal-box">
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: currentTemplate.palette.accent, textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                ✨ Secret Birthday Wish & Blessing
              </span>
              <p>&ldquo;{giftData.wishBlessing}&rdquo;</p>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 5: FOOTER & CLOSING NOTE */}
      <footer style={{ textAlign: 'center', padding: '60px 20px 100px', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
        <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '20px', maxWidth: '520px', margin: '0 auto 16px', color: 'var(--ink, #251f20)' }}>
          &ldquo;{giftData.ending}&rdquo;
        </p>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', textTransform: 'uppercase', opacity: 0.7, margin: '0 0 28px' }}>
          Crafted with love by {giftData.from}
        </p>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="btn-pill" onClick={() => setIsCustomizerOpen(true)}>
            🎨 Kustomisasi Hadiah Ini
          </button>
          <button className="btn-pill highlight" onClick={handleShareLink}>
            🔗 Salin Link Hadiah
          </button>
          <button className="btn-pill" onClick={goBackToCatalog}>
            ← Lihat Template Lain
          </button>
        </div>
      </footer>

      {/* Lightbox Overlay */}
      {activePhoto !== null && (
        <div className="lightbox-overlay" onClick={() => setActivePhoto(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img src={giftData.photos[activePhoto].src} alt={giftData.photos[activePhoto].caption} />
            <div style={{ marginTop: '12px', color: '#fff', textAlign: 'center' }}>
              <p style={{ fontFamily: 'var(--font-handwriting)', fontSize: '24px', margin: 0 }}>
                {giftData.photos[activePhoto].caption}
              </p>
              <p style={{ fontSize: '13px', opacity: 0.8, margin: '4px 0 12px' }}>
                {giftData.photos[activePhoto].backNote}
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  className="btn-pill"
                  style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid #fff' }}
                  onClick={() => setActivePhoto((activePhoto - 1 + giftData.photos.length) % giftData.photos.length)}
                >
                  ← Sebelumnya
                </button>
                <button
                  className="btn-pill"
                  style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', border: '1px solid #fff' }}
                  onClick={() => setActivePhoto((activePhoto + 1) % giftData.photos.length)}
                >
                  Berikutnya →
                </button>
                <button
                  className="btn-pill"
                  style={{ background: '#fff', color: '#000' }}
                  onClick={() => setActivePhoto(null)}
                >
                  Tutup ✕
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customizer Modal */}
      {isCustomizerOpen && (
        <div className="customizer-overlay" onClick={() => setIsCustomizerOpen(false)}>
          <div className="customizer-modal" onClick={(e) => e.stopPropagation()}>
            <div className="customizer-header">
              <h2>🎨 Kustomisasi Hadiah Digital</h2>
              <button
                style={{ border: 0, background: 'none', fontSize: '24px' }}
                onClick={() => setIsCustomizerOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="form-group">
              <label>Nama Penerima</label>
              <input
                className="form-input"
                value={giftData.name}
                onChange={(e) => setGiftData({ ...giftData, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Nama Panggilan / Nickname</label>
              <input
                className="form-input"
                value={giftData.nickname}
                onChange={(e) => setGiftData({ ...giftData, nickname: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Dari (Pengirim)</label>
              <input
                className="form-input"
                value={giftData.from}
                onChange={(e) => setGiftData({ ...giftData, from: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Pesan Surat Utama</label>
              <textarea
                className="form-textarea"
                rows={4}
                value={giftData.message}
                onChange={(e) => setGiftData({ ...giftData, message: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Pesan Harapan Lilin (Wish Blessing)</label>
              <textarea
                className="form-textarea"
                rows={2}
                value={giftData.wishBlessing}
                onChange={(e) => setGiftData({ ...giftData, wishBlessing: e.target.value })}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                className="btn-pill highlight"
                style={{ flex: 1, padding: '12px' }}
                onClick={() => {
                  handleShareLink();
                  setIsCustomizerOpen(false);
                }}
              >
                Simpan & Salin Link Hadiah 🔗
              </button>
              <button
                className="btn-pill"
                onClick={() => {
                  setGiftData(defaultGift);
                  showToast('Data kembali ke default');
                }}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
