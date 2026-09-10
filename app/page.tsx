'use client';

import { useEffect, useMemo, useState } from 'react';

// ORDER DATA — copy this project, then only edit this object for a new order.
const birthday = {
  name: 'Naya', nickname: 'Nay', from: 'your forever bestie, Rara', theme: 'lilac' as const,
  intro: 'Ada seseorang yang hari ini naik level...',
  message: 'Semoga di umur yang baru ini, kamu dikelilingi hal-hal baik, hati yang lebih tenang, dan banyak alasan buat ketawa sampai sakit perut.',
  ending: 'Thanks for being exactly you. The world is softer with you in it. ✦',
  photos: [
    { src: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f8e1c1?auto=format&fit=crop&w=900&q=85', caption: 'main character energy' },
    { src: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=85', caption: 'the prettiest chaos' },
    { src: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=85', caption: 'this smile >>>' },
    { src: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=85', caption: 'icon behavior' },
  ],
  memories: [
    ['01', 'the first random chat', 'Ternyata dari obrolan receh bisa jadi rumah.'],
    ['02', 'our loudest laugh', 'Masih nggak percaya kita ketawa sampai diliatin satu kafe.'],
    ['03', 'to be continued...', 'Masih banyak birthday, cerita, dan foto blur yang menunggu.'],
  ],
};
const themes = {
  lilac: { accent: '#7651c6', soft: '#eee8ff', glow: '#d8caff', ink: '#29213a' },
  rose: { accent: '#c44771', soft: '#ffedf3', glow: '#ffc6d9', ink: '#431b2a' },
  ocean: { accent: '#177f9b', soft: '#e5f7fb', glow: '#bdeaf5', ink: '#102f39' },
};

export default function Home() {
  const [opened, setOpened] = useState(false); const [surprise, setSurprise] = useState(false); const [activePhoto, setActivePhoto] = useState<number | null>(null);
  const palette = themes[birthday.theme];
  const confetti = useMemo(() => Array.from({ length: 80 }, (_, i) => ({ id: i, left: `${(i * 37) % 100}%`, delay: `${(i % 11) * 0.08}s`, color: ['#ff8eb1', '#ffd45c', '#9fe1ca', '#a99aff', '#ffffff'][i % 5], rotate: `${(i * 53) % 360}deg` })), []);
  useEffect(() => { if (!surprise) return; const timer = window.setTimeout(() => setSurprise(false), 4800); return () => window.clearTimeout(timer); }, [surprise]);
  const style = { '--accent': palette.accent, '--soft': palette.soft, '--glow': palette.glow, '--ink': palette.ink } as React.CSSProperties;
  if (!opened) return <main className="opening" style={style}><div className="opening-spark one">✦</div><div className="opening-spark two">✧</div><div className="opening-spark three">✦</div><div className="opening-card"><p className="eyebrow">a tiny page made with lots of love</p><p className="opening-copy">{birthday.intro}</p><h1>Happy birthday,<br /><em>{birthday.name}.</em></h1><button className="open-button" onClick={() => setOpened(true)}><span>open your little surprise</span><b>→</b></button><p className="opening-from">from {birthday.from}</p></div></main>;
  return <main className="site" style={style}>
    {surprise && <div className="confetti" aria-hidden="true">{confetti.map((piece) => <i key={piece.id} style={{ left: piece.left, animationDelay: piece.delay, background: piece.color, transform: `rotate(${piece.rotate})` }} />)}</div>}
    <section className="hero"><div className="grain" /><p className="eyebrow">today is all about you</p><div className="hero-layout"><div><p className="mini-note">one more trip around the sun</p><h1>Happy<br /><em>birthday,</em><br />{birthday.nickname} <span>♡</span></h1></div><div className="hero-photo"><img src={birthday.photos[0].src} alt={`A memory with ${birthday.name}`} /><p>the birthday girl ✦</p></div></div><a className="scroll-cue" href="#letter">scroll for a little love ↓</a></section>
    <section className="letter section" id="letter"><p className="section-number">01 / a note for you</p><div className="letter-content"><span className="quote-mark">“</span><p>{birthday.message}</p><span className="signature">with love,<br />{birthday.from}</span></div></section>
    <section className="gallery section"><div className="section-heading"><p className="section-number">02 / little memories</p><h2>some frames<br />I <em>love</em> of us.</h2></div><div className="photo-grid">{birthday.photos.map((photo, index) => <button key={photo.src} className={`polaroid photo-${index + 1}`} onClick={() => setActivePhoto(index)} aria-label={`Open photo: ${photo.caption}`}><img src={photo.src} alt={photo.caption} /><span>{photo.caption}</span></button>)}</div></section>
    <section className="timeline section"><p className="section-number">03 / our tiny archive</p><div className="memory-list">{birthday.memories.map(([number, title, detail]) => <article key={number}><span>{number}</span><div><h3>{title}</h3><p>{detail}</p></div><b>↗</b></article>)}</div></section>
    <section className="surprise section"><p className="section-number">04 / one last thing</p><div className="surprise-card"><span className="cake">✦</span><h2>make a wish,<br /><em>{birthday.name}.</em></h2><p>I hope every good thing finds its way to you.</p><button onClick={() => setSurprise(true)}>tap for birthday magic <span>✦</span></button></div></section>
    <footer><span>made just for {birthday.name} ♡</span><p>{birthday.ending}</p><span>{new Date().getFullYear()}</span></footer>
    {activePhoto !== null && <div className="lightbox" role="dialog" aria-modal="true" aria-label="Memory photo" onClick={() => setActivePhoto(null)}><figure onClick={(event) => event.stopPropagation()}><button onClick={() => setActivePhoto(null)} aria-label="Close photo">×</button><img src={birthday.photos[activePhoto].src} alt={birthday.photos[activePhoto].caption} /><figcaption>{birthday.photos[activePhoto].caption}</figcaption></figure></div>}
  </main>;
}
