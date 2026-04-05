'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, ExternalLink, Send, HelpCircle, Maximize2 } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const TELEGRAM_BOT_LINK = process.env.NEXT_PUBLIC_TELEGRAM_BOT_URL || 'https://t.me/yourbot';
const TELEGRAM_BOT_NAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_NAME || 'DFX Bot';

interface HelpVideo {
    _id: string;
    title: string;
    description: string;
    videoUrl: string;
    buttonLabel: string;
    buttonUrl: string;
    order: number;
    isActive: boolean;
}

function formatTime(sec: number) {
    if (isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function VideoCard({ video, index }: { video: HelpVideo; index: number }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const sliderRef = useRef<HTMLInputElement>(null);

    const [playing, setPlaying] = useState(false);
    const [muted, setMuted] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [loaded, setLoaded] = useState(false);
    const [dragging, setDragging] = useState(false);

    // auto-pause when scrolled out
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting) {
                    videoRef.current?.pause();
                    setPlaying(false);
                }
            },
            { threshold: 0.15 }
        );
        if (cardRef.current) observer.observe(cardRef.current);
        return () => observer.disconnect();
    }, []);

    const togglePlay = useCallback(() => {
        const vid = videoRef.current;
        if (!vid) return;
        if (playing) { vid.pause(); setPlaying(false); }
        else { vid.play().then(() => setPlaying(true)).catch(() => {}); }
    }, [playing]);

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!videoRef.current) return;
        videoRef.current.muted = !muted;
        setMuted(!muted);
    };

    const onTimeUpdate = () => {
        if (!dragging && videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    const onLoadedMetadata = () => {
        setDuration(videoRef.current?.duration || 0);
        setLoaded(true);
    };

    const onSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = Number(e.target.value);
        setCurrentTime(val);
        if (videoRef.current) videoRef.current.currentTime = val;
    };

    const onSliderMouseDown = () => setDragging(true);
    const onSliderMouseUp = () => setDragging(false);

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div ref={cardRef} className="vc" style={{ animationDelay: `${index * 0.07}s` }}>

            {/* ── VIDEO PLAYER ── */}
            <div className="vplayer">
                {/* Shimmer */}
                {!loaded && <div className="vshimmer" />}

                {/* Video element */}
                <video
                    ref={videoRef}
                    src={video.videoUrl}
                    className={`vel ${loaded ? 'visible' : ''}`}
                    playsInline
                    preload="metadata"
                    onLoadedMetadata={onLoadedMetadata}
                    onTimeUpdate={onTimeUpdate}
                    onEnded={() => setPlaying(false)}
                    onClick={togglePlay}
                />

                {/* Centre play/pause overlay */}
                <div
                    className={`vcoverlay ${playing ? 'playing' : ''}`}
                    onClick={togglePlay}
                >
                    <button className="vcplaybtn" onClick={e => { e.stopPropagation(); togglePlay(); }}>
                        {playing ? <Pause size={20} /> : <Play size={20} />}
                    </button>
                </div>

                {/* ── CONTROLS BAR ── */}
                {loaded && (
                    <div className="vcontrols" onClick={e => e.stopPropagation()}>
                        {/* Seek slider */}
                        <div className="vslider-wrap">
                            <input
                                ref={sliderRef}
                                type="range"
                                className="vslider"
                                min={0}
                                max={duration || 0}
                                step={0.1}
                                value={currentTime}
                                onChange={onSliderChange}
                                onMouseDown={onSliderMouseDown}
                                onMouseUp={onSliderMouseUp}
                                onTouchStart={onSliderMouseDown}
                                onTouchEnd={onSliderMouseUp}
                                style={{ '--pct': `${progress}%` } as React.CSSProperties}
                            />
                        </div>

                        {/* Bottom row */}
                        <div className="vctoolbar">
                            <button className="vctool" onClick={togglePlay}>
                                {playing ? <Pause size={15} /> : <Play size={15} />}
                            </button>
                            <span className="vctime">
                                {formatTime(currentTime)} / {formatTime(duration)}
                            </span>
                            <div className="vctool-right">
                                <button className="vctool" onClick={toggleMute}>
                                    {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                                </button>
                                <button className="vctool" onClick={() => videoRef.current?.requestFullscreen?.()}>
                                    <Maximize2 size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── CARD BODY ── */}
            <div className="vcbody">
                <div className="vcnum">#{String(index + 1).padStart(2, '0')}</div>
                <h3 className="vctitle">{video.title}</h3>
                {video.description && <p className="vcdesc">{video.description}</p>}
                {video.buttonLabel && video.buttonUrl && (
                    <a
                        href={video.buttonUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="vcbtn"
                    >
                        <ExternalLink size={13} />
                        {video.buttonLabel}
                    </a>
                )}
            </div>
        </div>
    );
}

export default function DfxHelpPage() {
    const [videos, setVideos] = useState<HelpVideo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API}/api/dfxhelp`)
            .then(r => r.json())
            .then(d => setVideos(d.videos || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

                body {
                    background: #f4f6f9;
                    color: #111827;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                    -webkit-font-smoothing: antialiased;
                }

                .dfx-root { min-height: 100vh; background: #f4f6f9; }

                /* ── TOPBAR ── */
                .topbar {
                    background: #fff;
                    border-bottom: 1px solid #e2e8f0;
                    padding: 13px 24px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    position: sticky; top: 0; z-index: 100;
                    gap: 12px;
                }
                .brand { display: flex; align-items: center; gap: 10px; }
                .brand-icon {
                    width: 32px; height: 32px;
                    background: #2563eb;
                    display: flex; align-items: center; justify-content: center;
                    color: #fff;
                }
                .brand-name { font-size: 0.95rem; font-weight: 700; color: #111827; }
                .brand-tag {
                    font-size: 0.68rem; font-weight: 700;
                    background: #eff6ff; color: #2563eb;
                    padding: 2px 8px; letter-spacing: 0.06em;
                }
                .btn-tg {
                    display: inline-flex; align-items: center; gap: 7px;
                    background: #2196F3; color: #fff;
                    font-size: 0.82rem; font-weight: 600;
                    padding: 9px 16px;
                    text-decoration: none;
                    transition: background 0.15s;
                    white-space: nowrap; flex-shrink: 0;
                }
                .btn-tg:hover { background: #1976D2; }

                /* ── HERO STRIP ── */
                .herostrip {
                    background: #fff;
                    border-bottom: 1px solid #e2e8f0;
                    padding: 28px 24px;
                    text-align: center;
                }
                .herostrip h1 {
                    font-size: clamp(1.4rem, 3.5vw, 2rem);
                    font-weight: 800; letter-spacing: -0.02em;
                    color: #111827; margin-bottom: 6px;
                }
                .herostrip h1 span { color: #2563eb; }
                .herostrip p { font-size: 0.875rem; color: #6b7280; }

                /* ── MAIN ── */
                .main {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 32px 20px 80px;
                }
                .sec-row {
                    display: flex; align-items: center;
                    justify-content: space-between;
                    margin-bottom: 20px; gap: 12px;
                    flex-wrap: wrap;
                }
                .sec-title {
                    font-size: 0.875rem; font-weight: 700; color: #374151;
                    display: flex; align-items: center; gap: 7px;
                }
                .sec-badge {
                    font-size: 0.7rem; font-weight: 600;
                    background: #f3f4f6; color: #6b7280;
                    padding: 3px 9px;
                }

                /* ── VIDEO CARD ── */
                .vc {
                    background: #fff;
                    border: 1px solid #e2e8f0;
                    overflow: hidden;
                    transition: box-shadow 0.2s, border-color 0.2s;
                    animation: fadein 0.35s ease both;
                }
                .vc:hover {
                    box-shadow: 0 6px 24px rgba(0,0,0,0.08);
                    border-color: #c7d2e0;
                }
                @keyframes fadein {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                /* ── PLAYER ── */
                .vplayer {
                    position: relative;
                    background: #000;
                    overflow: hidden;
                    /* natural ratio, show full video */
                    display: flex;
                    flex-direction: column;
                }
                .vshimmer {
                    width: 100%;
                    aspect-ratio: 16/9;
                    background: linear-gradient(90deg, #e9ebee 25%, #f3f4f6 50%, #e9ebee 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.3s infinite;
                }
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
                .vel {
                    width: 100%;
                    /* contain so full video is always visible, natural height */
                    max-height: 340px;
                    object-fit: contain;
                    background: #000;
                    display: block;
                    opacity: 0;
                    transition: opacity 0.25s;
                    cursor: pointer;
                }
                .vel.visible { opacity: 1; }

                /* centre play overlay */
                .vcoverlay {
                    position: absolute;
                    top: 0; left: 0; right: 0;
                    /* only covers video area, not controls */
                    bottom: 52px;
                    display: flex; align-items: center; justify-content: center;
                    background: rgba(0,0,0,0.18);
                    transition: background 0.2s;
                    cursor: pointer;
                }
                .vcoverlay.playing { background: transparent; }
                .vcoverlay.playing:hover { background: rgba(0,0,0,0.12); }

                .vcplaybtn {
                    width: 44px; height: 44px;
                    background: rgba(255,255,255,0.9);
                    color: #111827;
                    border: none; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    transition: all 0.15s;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                }
                .vcplaybtn:hover { background: #fff; transform: scale(1.08); }
                .vcoverlay.playing .vcplaybtn { opacity: 0; }
                .vcoverlay.playing:hover .vcplaybtn { opacity: 1; }

                /* ── CONTROLS BAR ── */
                .vcontrols {
                    background: #1a1d23;
                    padding: 0 10px 8px;
                    position: relative;
                    z-index: 10;
                }

                /* seek slider */
                .vslider-wrap { padding: 6px 0 2px; }
                .vslider {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 100%; height: 3px;
                    background: linear-gradient(to right, #2563eb var(--pct, 0%), #4b5563 var(--pct, 0%));
                    outline: none; border: none;
                    cursor: pointer;
                    transition: height 0.1s;
                }
                .vslider:hover { height: 5px; }
                .vslider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 13px; height: 13px;
                    background: #2563eb;
                    cursor: pointer;
                    border: 2px solid #fff;
                    box-shadow: 0 0 3px rgba(0,0,0,0.4);
                }
                .vslider::-moz-range-thumb {
                    width: 13px; height: 13px;
                    background: #2563eb;
                    border: 2px solid #fff;
                    cursor: pointer;
                }

                /* toolbar */
                .vctoolbar {
                    display: flex; align-items: center; gap: 10px;
                    padding-top: 3px;
                }
                .vctool {
                    display: flex; align-items: center; justify-content: center;
                    color: #d1d5db; background: none; border: none;
                    cursor: pointer; padding: 4px;
                    transition: color 0.15s;
                }
                .vctool:hover { color: #fff; }
                .vctime {
                    font-size: 0.7rem; font-weight: 500;
                    color: #9ca3af; font-variant-numeric: tabular-nums;
                    white-space: nowrap;
                }
                .vctool-right { margin-left: auto; display: flex; gap: 4px; }

                /* ── CARD BODY ── */
                .vcbody { padding: 14px 16px 18px; }
                .vcnum {
                    font-size: 0.65rem; font-weight: 700;
                    color: #2563eb; letter-spacing: 0.08em;
                    margin-bottom: 4px;
                }
                .vctitle {
                    font-size: 0.95rem; font-weight: 700;
                    color: #111827; line-height: 1.35;
                    margin-bottom: 6px;
                }
                .vcdesc {
                    font-size: 0.82rem; color: #6b7280;
                    line-height: 1.55; margin-bottom: 12px;
                }
                .vcbtn {
                    display: inline-flex; align-items: center; gap: 6px;
                    background: #2563eb; color: #fff;
                    text-decoration: none;
                    font-size: 0.78rem; font-weight: 600;
                    padding: 8px 14px;
                    transition: background 0.15s;
                }
                .vcbtn:hover { background: #1d4ed8; }

                /* ── GRID ── */
                .vgrid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 18px;
                }

                /* ── SKELETON ── */
                .skgrid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 18px;
                }
                .skcard { background: #fff; border: 1px solid #e2e8f0; }
                .skvideo {
                    aspect-ratio: 16/9;
                    background: linear-gradient(90deg, #f3f4f6 25%, #e9ebee 50%, #f3f4f6 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.3s infinite;
                }
                .skbody { padding: 14px 16px; }
                .skline {
                    height: 11px; margin-bottom: 8px;
                    background: linear-gradient(90deg, #f3f4f6 25%, #e9ebee 50%, #f3f4f6 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.3s infinite;
                }
                .skline.sm { width: 55%; height: 9px; margin-bottom: 0; }

                /* ── EMPTY ── */
                .empty { text-align: center; padding: 60px 20px; color: #9ca3af; }
                .empty h3 { font-size: 1rem; font-weight: 700; color: #374151; margin-bottom: 4px; }
                .empty p { font-size: 0.85rem; }

                /* ── TELEGRAM BANNER ── */
                .tgbanner {
                    margin-top: 40px;
                    background: #eff6ff;
                    border: 1px solid #bfdbfe;
                    padding: 26px 28px;
                    display: flex; align-items: center;
                    justify-content: space-between;
                    gap: 20px; flex-wrap: wrap;
                }
                .tgleft { display: flex; align-items: center; gap: 14px; }
                .tgicon {
                    width: 44px; height: 44px;
                    background: #2196F3;
                    display: flex; align-items: center; justify-content: center;
                    color: #fff; flex-shrink: 0;
                }
                .tgbanner h3 { font-size: 0.95rem; font-weight: 700; color: #1e3a5f; margin-bottom: 3px; }
                .tgbanner p { font-size: 0.8rem; color: #4b6a8a; }
                .btn-tg-lg {
                    display: inline-flex; align-items: center; gap: 8px;
                    background: #2196F3; color: #fff;
                    font-size: 0.85rem; font-weight: 700;
                    padding: 11px 20px;
                    text-decoration: none;
                    transition: background 0.15s;
                    flex-shrink: 0; white-space: nowrap;
                }
                .btn-tg-lg:hover { background: #1976D2; }

                /* ── FOOTER ── */
                .footer {
                    border-top: 1px solid #e2e8f0;
                    background: #fff;
                    padding: 18px 24px;
                    text-align: center;
                    font-size: 0.75rem; color: #9ca3af;
                }

                @media (max-width: 600px) {
                    .main { padding: 20px 12px 60px; }
                    .vgrid, .skgrid { grid-template-columns: 1fr; }
                    .tgbanner { padding: 18px 16px; }
                    .topbar { padding: 11px 14px; }
                    .brand-tag { display: none; }
                }
            `}</style>

            <div className="dfx-root">
                {/* ── TOPBAR ── */}
                <header className="topbar">
                    <div className="brand">
                        <div className="brand-icon"><HelpCircle size={17} /></div>
                        <span className="brand-name">DFX Help</span>
                        <span className="brand-tag">OFFICIAL</span>
                    </div>
                    <a href={TELEGRAM_BOT_LINK} target="_blank" rel="noopener noreferrer" className="btn-tg">
                        <Send size={14} />{TELEGRAM_BOT_NAME}
                    </a>
                </header>

                {/* ── HERO STRIP ── */}
                <div className="herostrip">
                    <h1>DFX <span>Help Center</span></h1>
                    <p>Step-by-step video guides to help you master every feature.</p>
                </div>

                {/* ── MAIN ── */}
                <main className="main">
                    <div className="sec-row">
                        <div className="sec-title">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5">
                                <path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.9L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
                            </svg>
                            Video Tutorials
                        </div>
                        {!loading && videos.length > 0 && (
                            <span className="sec-badge">{videos.length} video{videos.length !== 1 ? 's' : ''}</span>
                        )}
                    </div>

                    {loading ? (
                        <div className="skgrid">
                            {[1,2,3,4,5,6].map(i => (
                                <div key={i} className="skcard">
                                    <div className="skvideo" />
                                    <div className="skbody">
                                        <div className="skline" style={{width:'30%', height:8, marginBottom:8}} />
                                        <div className="skline" />
                                        <div className="skline sm" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : videos.length === 0 ? (
                        <div className="empty">
                            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" style={{margin:'0 auto 12px', display:'block'}}>
                                <path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.9L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
                            </svg>
                            <h3>No tutorials yet</h3>
                            <p>Check back soon — guides are being added!</p>
                        </div>
                    ) : (
                        <div className="vgrid">
                            {videos.map((video, i) => (
                                <VideoCard key={video._id} video={video} index={i} />
                            ))}
                        </div>
                    )}

                    {/* ── TELEGRAM BANNER ── */}
                    <div className="tgbanner">
                        <div className="tgleft">
                            <div className="tgicon"><Send size={20} /></div>
                            <div>
                                <h3>Need more help?</h3>
                                <p>Join our Telegram bot for live support and updates</p>
                            </div>
                        </div>
                        <a href={TELEGRAM_BOT_LINK} target="_blank" rel="noopener noreferrer" className="btn-tg-lg">
                            <Send size={15} /> Open {TELEGRAM_BOT_NAME}
                        </a>
                    </div>
                </main>

                {/* ── FOOTER ── */}
                <footer className="footer">
                    © {new Date().getFullYear()} DFX Help Center · Managed by admin team
                </footer>
            </div>
        </>
    );
}
