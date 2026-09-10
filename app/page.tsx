'use client';

import { useEffect, useMemo, useState } from 'react';

// ORDER DATA — copy this project, then only edit this object for a new order.
const birthday = {
  name: 'Naya', nickname: 'Nay', from: 'your forever bestie, Rara', theme: 'lilac' as const,
  intro: 'Ada seseorang yang hari ini naik level...',
  message: 'Semoga di umur yang baru ini, kamu dikelilingi hal-hal baik, hati yang lebih tenang, dan banyak alasan buat ketawa sampai sakit perut.',
  ending: 'Thanks for being exactly you. The world is softer with you in it. ✦',
  photos: [
    { src: '/memories/hero.jpg', caption: 'main character energy' },
    { src: '/memories/memory-2.jpg', caption: 'the prettiest chaos' },
    { src: '/memories/memory-3.jpg', caption: 'this smile >>>' },
    { src: '/memories/memory-4.jpg', caption: 'icon behavior' },
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
const templateOptions = [
  { id: 'scrapbook', number: '01', name: 'Lilac Scrapbook', tag: 'playful · bestie · birthday' },
  { id: 'vintage', number: '02', name: 'Vintage Love Letter', tag: 'romantic · classic · anniversary' },
  { id: 'jar', number: '03', name: 'Reasons Jar', tag: 'interactive · cute · personal' },
] as const;
type TemplateId = typeof templateOptions[number]['id'];
const templatePalettes = {
  scrapbook: themes.lilac,
  vintage: { accent: '#8b1e2d', soft: '#efe3ce', glow: '#d3bda0', ink: '#3f151c' },
  jar: { accent: '#a43b69', soft: '#f8d9e7', glow: '#e7a8c2', ink: '#4b1830' },
};

export default function Home() {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateId | null>(null);
  const [noteIndex, setNoteIndex] = useState(-1);
  const [activeMemory, setActiveMemory] = useState(0);
  const [opened, setOpened] = useState(false); const [surprise, setSurprise] = useState(false); const [activePhoto, setActivePhoto] = useState<number | null>(null);
  const palette = selectedTemplate ? templatePalettes[selectedTemplate] : themes[birthday.theme];
  const confetti = useMemo(() => Array.from({ length: 80 }, (_, i) => ({ id: i, left: `${(i * 37) % 100}%`, delay: `${(i % 11) * 0.08}s`, color: ['#ff8eb1', '#ffd45c', '#9fe1ca', '#a99aff', '#ffffff'][i % 5], rotate: `${(i * 53) % 360}deg` })), []);
  useEffect(() => { if (!surprise) return; const timer = window.setTimeout(() => setSurprise(false), 4800); return () => window.clearTimeout(timer); }, [surprise]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (activePhoto === null) return;
      if (event.key === 'Escape') setActivePhoto(null);
      if (event.key === 'ArrowRight') setActivePhoto((activePhoto + 1) % birthday.photos.length);
      if (event.key === 'ArrowLeft') setActivePhoto((activePhoto - 1 + birthday.photos.length) % birthday.photos.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activePhoto]);
  useEffect(() => {
    document.body.style.overflow = activePhoto === null ? '' : 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [activePhoto]);
  const style = { '--accent': palette.accent, '--soft': palette.soft, '--glow': palette.glow, '--ink': palette.ink } as React.CSSProperties;
  if (!selectedTemplate) return <main className="catalog"><nav><a className="brand" href="#top">made for you <span>✦</span></a><p>tiny websites, big feelings</p></nav><header id="top"><p className="catalog-kicker">digital gifts for your favorite person</p><h1>Choose a feeling.<br /><em>Make it theirs.</em></h1><p className="catalog-intro">Satu link berisi nama, foto, dan cerita kalian—dibuat khusus untuk orang favoritmu.</p></header><div className="catalog-guide"><span>03 unique templates</span><span>pilih untuk melihat demo ↓</span></div><section className="template-grid" aria-label="Birthday website templates">{templateOptions.map((template) => <button className={`template-card ${template.id}`} key={template.id} onClick={() => { setSelectedTemplate(template.id); window.scrollTo({ top: 0 }); }}><span className="template-number">{template.number}</span><div className="template-art" aria-hidden="true"><i /><b>{template.id === 'vintage' ? 'for you, always' : template.id === 'jar' ? '7 reasons why' : 'best day ever'}</b></div><div className="template-meta"><span><strong>{template.name}</strong><small>{template.tag}</small></span><b>lihat demo <span aria-hidden="true">↗</span></b></div></button>)}</section><footer className="catalog-footer"><span>made with care, sent with love</span><span>three templates · endless stories</span></footer></main>;
  const goBack = () => { setSelectedTemplate(null); setOpened(false); setNoteIndex(-1); window.scrollTo({ top: 0 }); };
  if (!opened) return <main className={`opening theme-${selectedTemplate}`} style={style}><button className="back-templates" onClick={goBack}>← all templates</button><div className="opening-spark one">✦</div><div className="opening-spark two">✧</div><div className="opening-spark three">✦</div><div className="opening-card">{selectedTemplate === 'vintage' && <div className="lace-line" />}<p className="eyebrow">{selectedTemplate === 'jar' ? 'a jar full of little truths' : 'a tiny page made with lots of love'}</p><p className="opening-copy">{birthday.intro}</p><h1>{selectedTemplate === 'vintage' ? <>To my favorite<br /><em>person.</em></> : selectedTemplate === 'jar' ? <>Reasons I adore<br /><em>{birthday.name}.</em></> : <>Happy birthday,<br /><em>{birthday.name}.</em></>}</h1><button className="open-button" onClick={() => setOpened(true)}><span>{selectedTemplate === 'jar' ? 'open the jar' : selectedTemplate === 'vintage' ? 'unseal this letter' : 'open your little surprise'}</span><b>→</b></button><p className="opening-from">from {birthday.from}</p></div></main>;
  return <main className={`site theme-${selectedTemplate}`} style={style}>
    <button className="back-templates floating" onClick={goBack}>← templates</button>
    {surprise && <div className="confetti" aria-hidden="true">{confetti.map((piece) => <i key={piece.id} style={{ left: piece.left, animationDelay: piece.delay, background: piece.color, transform: `rotate(${piece.rotate})` }} />)}</div>}
    <section className="hero"><div className="grain" /><p className="eyebrow">today is all about you</p><div className="hero-layout"><div><p className="mini-note">one more trip around the sun</p><h1>Happy<br /><em>birthday,</em><br />{birthday.nickname} <span>♡</span></h1></div><div className="hero-photo"><img src={birthday.photos[0].src} alt={`A memory with ${birthday.name}`} /><p>the birthday girl ✦</p></div></div><a className="scroll-cue" href="#letter">scroll for a little love ↓</a></section>
    <section className="letter section" id="letter"><p className="section-number">01 / a note for you</p><div className="letter-content"><span className="quote-mark">“</span><p>{birthday.message}</p><span className="signature">with love,<br />{birthday.from}</span></div></section>
    <section className="gallery section"><div className="section-heading"><p className="section-number">02 / little memories</p><h2>some frames<br />I <em>love</em> of us.</h2></div><div className="photo-grid">{birthday.photos.map((photo, index) => <button key={photo.src} className={`polaroid photo-${index + 1}`} onClick={() => setActivePhoto(index)} aria-label={`Open photo: ${photo.caption}`}><img src={photo.src} alt={photo.caption} /><span>{photo.caption}</span></button>)}</div></section>
    <section className="timeline section"><p className="section-number">03 / our tiny archive</p><div className="memory-list">{birthday.memories.map(([number, title, detail], index) => <button className={activeMemory === index ? 'active' : ''} onClick={() => setActiveMemory(index)} aria-expanded={activeMemory === index} key={number}><span>{number}</span><div><h3>{title}</h3><p>{detail}</p></div><b>{activeMemory === index ? '−' : '+'}</b></button>)}</div></section>
    <section className="surprise section"><p className="section-number">04 / one last thing</p>{selectedTemplate === 'jar' ? <div className="surprise-card jar-card"><h2>reasons I’m grateful<br />to know <em>you.</em></h2><p className="jar-hint">Tap the jar and pick a tiny note.</p><button className="memory-jar" aria-label="Pick a reason from the jar" onClick={() => { setNoteIndex((noteIndex + 1) % birthday.memories.length); setSurprise(true); }}><i /><i /><i /><span>♡</span></button><div className={`reason-note ${noteIndex >= 0 ? 'visible' : ''}`} aria-live="polite">{noteIndex >= 0 ? birthday.memories[noteIndex][2] : 'your note will appear here'}</div></div> : <div className="surprise-card"><span className="cake">✦</span><h2>{selectedTemplate === 'vintage' ? <>with all my love,<br /><em>always.</em></> : <>make a wish,<br /><em>{birthday.name}.</em></>}</h2><p>I hope every good thing finds its way to you.</p><button onClick={() => setSurprise(true)}>tap for birthday magic <span>✦</span></button></div>}</section>
    <footer><span>made just for {birthday.name} ♡</span><p>{birthday.ending}</p><span>{new Date().getFullYear()}</span></footer>
    {activePhoto !== null && <div className="lightbox" role="dialog" aria-modal="true" aria-label="Memory photo" onClick={() => setActivePhoto(null)}><figure onClick={(event) => event.stopPropagation()}><button className="close-lightbox" onClick={() => setActivePhoto(null)} aria-label="Close photo">×</button><button className="prev-photo" onClick={() => setActivePhoto((activePhoto - 1 + birthday.photos.length) % birthday.photos.length)} aria-label="Previous photo">←</button><img src={birthday.photos[activePhoto].src} alt={birthday.photos[activePhoto].caption} /><button className="next-photo" onClick={() => setActivePhoto((activePhoto + 1) % birthday.photos.length)} aria-label="Next photo">→</button><figcaption><span>{birthday.photos[activePhoto].caption}</span><small>{activePhoto + 1} / {birthday.photos.length}</small></figcaption></figure></div>}
  </main>;
}
