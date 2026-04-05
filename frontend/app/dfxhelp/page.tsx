'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, ExternalLink, Send, HelpCircle } from 'lucide-react';

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

function VideoCard({ video, index }: { video: HelpVideo; index: number }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const [playing, setPlaying] = useState(false);
    const [muted, setMuted] = useState(true);
    const [loaded, setLoaded] = useState(false);

    // Pause when scrolled out of view
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting && playing) {
                    videoRef.current?.pause();
                    setPlaying(false);
                }
            },
            { threshold: 0.2 }
        );
        if (cardRef.current) observer.observe(cardRef.current);
        return () => observer.disconnect();
    }, [playing]);

    const togglePlay = () => {
        const vid = videoRef.current;
        if (!vid) return;
        if (playing) {
            vid.pause();
            setPlaying(false);
        } else {
            vid.play().then(() => setPlaying(true)).catch(() => {});
        }
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!videoRef.current) return;
        videoRef.current.muted = !muted;
        setMuted(!muted);
    };

    return (
        <div
            ref={cardRef}
            className="vc"
            style={{ animationDelay: `${index * 0.08}s` }}
        >
            {/* Video */}
            <div className="vw" onClick={togglePlay}>
                {/* Shimmer while loading */}
                {!loaded && <div className="vshimmer" />}

                <video
                    ref={videoRef}
                    src={video.videoUrl}
                    className={`vel ${loaded ? 'loaded' : ''}`}
                    loop
                    muted
                    playsInline
                    preload="metadata"
                    onLoadedMetadata={() => setLoaded(true)}
                    onEnded={() => setPlaying(false)}
                />

                {/* Play/Pause overlay */}
                <div className={`voverlay ${playing ? 'vplaying' : ''}`}>
                    <button className="vplaybtn" onClick={togglePlay}>
                        {playing ? <Pause size={22} /> : <Play size={22} />}
                    </button>
                </div>

                {/* Mute button */}
                {loaded && (
                    <button className="vmute" onClick={toggleMute}>
                        {muted ? <VolumeX size={13} /> : <Volume2 size={13} />}
                    </button>
                )}
            </div>

            {/* Content */}
            <div className="vcbody">
                <div className="vcnum">{String(index + 1).padStart(2, '0')}</div>
                <h3 className="vctitle">{video.title}</h3>
                {video.description && (
                    <p className="vcdesc">{video.description}</p>
                )}
                {video.buttonLabel && video.buttonUrl && (
                    <a
                        href={video.buttonUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="vcbtn"
                        onClick={e => e.stopPropagation()}
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
                    background: #f5f7fa;
                    color: #1a1d23;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                    -webkit-font-smoothing: antialiased;
                }

                .dfx-root {
                    min-height: 100vh;
                    background: #f5f7fa;
                }

                /* ── TOPBAR ── */
                .topbar {
                    background: #fff;
                    border-bottom: 1px solid #e8ecf0;
                    padding: 14px 24px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    position: sticky;
                    top: 0;
                    z-index: 50;
                    gap: 12px;
                }
                .topbar-brand {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    text-decoration: none;
                }
                .topbar-icon {
                    width: 34px; height: 34px;
                    background: #2563eb;
                    border-radius: 9px;
                    display: flex; align-items: center; justify-content: center;
                    color: #fff;
                    flex-shrink: 0;
                }
                .topbar-name {
                    font-size: 0.95rem;
                    font-weight: 700;
                    color: #1a1d23;
                }
                .topbar-tag {
                    font-size: 0.7rem;
                    font-weight: 600;
                    color: #2563eb;
                    background: #eff6ff;
                    padding: 3px 8px;
                    border-radius: 6px;
                    letter-spacing: 0.04em;
                }
                .btn-tg {
                    display: inline-flex;
                    align-items: center;
                    gap: 7px;
                    background: #2196F3;
                    color: #fff;
                    font-size: 0.82rem;
                    font-weight: 600;
                    padding: 9px 16px;
                    border-radius: 9px;
                    text-decoration: none;
                    transition: background 0.18s, transform 0.18s;
                    white-space: nowrap;
                    flex-shrink: 0;
                }
                .btn-tg:hover {
                    background: #1976D2;
                    transform: translateY(-1px);
                }

                /* ── HERO STRIP ── */
                .herostrip {
                    background: #fff;
                    border-bottom: 1px solid #e8ecf0;
                    padding: 32px 24px;
                    text-align: center;
                }
                .herostrip h1 {
                    font-size: clamp(1.5rem, 4vw, 2.2rem);
                    font-weight: 800;
                    color: #111827;
                    letter-spacing: -0.025em;
                    margin-bottom: 8px;
                }
                .herostrip h1 span {
                    color: #2563eb;
                }
                .herostrip p {
                    font-size: 0.9rem;
                    color: #6b7280;
                    max-width: 420px;
                    margin: 0 auto;
                    line-height: 1.6;
                }

                /* ── MAIN CONTENT ── */
                .main {
                    max-width: 1180px;
                    margin: 0 auto;
                    padding: 36px 20px 80px;
                }

                /* ── SECTION HEADER ── */
                .sec-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 24px;
                    flex-wrap: wrap;
                    gap: 10px;
                }
                .sec-title {
                    font-size: 1rem;
                    font-weight: 700;
                    color: #374151;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .sec-count {
                    font-size: 0.75rem;
                    font-weight: 600;
                    color: #6b7280;
                    background: #f3f4f6;
                    padding: 3px 9px;
                    border-radius: 20px;
                }

                /* ── GRID ── */
                .vgrid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 20px;
                }

                /* ── VIDEO CARD ── */
                .vc {
                    background: #fff;
                    border: 1px solid #e5e7eb;
                    border-radius: 16px;
                    overflow: hidden;
                    transition: box-shadow 0.2s, border-color 0.2s, transform 0.2s;
                    animation: fadein 0.4s ease both;
                }
                .vc:hover {
                    box-shadow: 0 8px 28px rgba(0,0,0,0.08);
                    border-color: #d1d5db;
                    transform: translateY(-2px);
                }
                @keyframes fadein {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                /* Video wrapper */
                .vw {
                    position: relative;
                    aspect-ratio: 16/9;
                    background: #111;
                    cursor: pointer;
                    overflow: hidden;
                }
                .vshimmer {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.4s infinite;
                }
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
                .vel {
                    position: absolute;
                    inset: 0;
                    width: 100%; height: 100%;
                    object-fit: cover;
                    display: block;
                    opacity: 0;
                    transition: opacity 0.3s;
                }
                .vel.loaded { opacity: 1; }

                /* overlay */
                .voverlay {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(0,0,0,0.22);
                    transition: background 0.2s;
                }
                .voverlay.vplaying { background: rgba(0,0,0,0); }
                .voverlay.vplaying:hover { background: rgba(0,0,0,0.15); }

                .vplaybtn {
                    width: 46px; height: 46px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.92);
                    color: #1a1d23;
                    display: flex; align-items: center; justify-content: center;
                    border: none;
                    cursor: pointer;
                    transition: all 0.18s;
                    box-shadow: 0 2px 12px rgba(0,0,0,0.18);
                }
                .vplaybtn:hover {
                    background: #fff;
                    transform: scale(1.08);
                }
                .voverlay.vplaying .vplaybtn { opacity: 0; }
                .voverlay.vplaying:hover .vplaybtn { opacity: 1; }

                /* mute btn */
                .vmute {
                    position: absolute;
                    top: 8px; right: 8px;
                    background: rgba(0,0,0,0.45);
                    color: #fff;
                    border: none;
                    border-radius: 7px;
                    padding: 5px;
                    cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    transition: background 0.15s;
                    z-index: 5;
                }
                .vmute:hover { background: rgba(0,0,0,0.65); }

                /* card body */
                .vcbody {
                    padding: 16px 18px 18px;
                }
                .vcnum {
                    font-size: 0.65rem;
                    font-weight: 700;
                    letter-spacing: 0.1em;
                    color: #2563eb;
                    margin-bottom: 5px;
                }
                .vctitle {
                    font-size: 0.95rem;
                    font-weight: 700;
                    color: #111827;
                    line-height: 1.35;
                    margin-bottom: 6px;
                }
                .vcdesc {
                    font-size: 0.82rem;
                    color: #6b7280;
                    line-height: 1.55;
                    margin-bottom: 12px;
                }
                .vcbtn {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    background: #2563eb;
                    color: #fff;
                    text-decoration: none;
                    font-size: 0.78rem;
                    font-weight: 600;
                    padding: 8px 14px;
                    border-radius: 8px;
                    transition: background 0.15s, transform 0.15s;
                }
                .vcbtn:hover {
                    background: #1d4ed8;
                    transform: translateY(-1px);
                }

                /* ── SKELETON LOADING ── */
                .skgrid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                    gap: 20px;
                }
                .skcard {
                    background: #fff;
                    border: 1px solid #e5e7eb;
                    border-radius: 16px;
                    overflow: hidden;
                }
                .skvideo {
                    aspect-ratio: 16/9;
                    background: linear-gradient(90deg, #f3f4f6 25%, #e9ebee 50%, #f3f4f6 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.4s infinite;
                }
                .skbody { padding: 16px 18px; }
                .skline {
                    height: 12px;
                    border-radius: 6px;
                    margin-bottom: 9px;
                    background: linear-gradient(90deg, #f3f4f6 25%, #e9ebee 50%, #f3f4f6 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.4s infinite;
                }
                .skline.sm { width: 55%; height: 10px; }
                .skline.xs { width: 35%; height: 8px; margin-bottom: 0; }

                /* ── EMPTY ── */
                .empty {
                    text-align: center;
                    padding: 60px 20px;
                    color: #9ca3af;
                }
                .empty svg { margin: 0 auto 12px; opacity: 0.35; display: block; }
                .empty h3 { font-size: 1rem; font-weight: 700; color: #374151; margin-bottom: 4px; }
                .empty p { font-size: 0.85rem; }

                /* ── TELEGRAM BANNER ── */
                .tgbanner {
                    margin-top: 48px;
                    background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%);
                    border: 1px solid #bfdbfe;
                    border-radius: 16px;
                    padding: 28px 32px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 20px;
                    flex-wrap: wrap;
                }
                .tgbanner-left {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .tgicon {
                    width: 48px; height: 48px;
                    background: #2196F3;
                    border-radius: 12px;
                    display: flex; align-items: center; justify-content: center;
                    color: #fff;
                    flex-shrink: 0;
                }
                .tgbanner h3 {
                    font-size: 1rem;
                    font-weight: 700;
                    color: #1e3a5f;
                    margin-bottom: 3px;
                }
                .tgbanner p {
                    font-size: 0.82rem;
                    color: #4b6a8a;
                }
                .btn-tg-lg {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: #2196F3;
                    color: #fff;
                    font-size: 0.85rem;
                    font-weight: 700;
                    padding: 12px 22px;
                    border-radius: 10px;
                    text-decoration: none;
                    transition: background 0.18s, transform 0.18s;
                    flex-shrink: 0;
                    white-space: nowrap;
                }
                .btn-tg-lg:hover {
                    background: #1976D2;
                    transform: translateY(-1px);
                }

                /* ── FOOTER ── */
                .footer {
                    border-top: 1px solid #e5e7eb;
                    background: #fff;
                    padding: 20px 24px;
                    text-align: center;
                    font-size: 0.78rem;
                    color: #9ca3af;
                }

                @media (max-width: 600px) {
                    .main { padding: 24px 14px 60px; }
                    .tgbanner { padding: 20px 18px; }
                    .herostrip { padding: 22px 16px; }
                    .topbar { padding: 12px 16px; }
                    .topbar-tag { display: none; }
                }
            `}</style>

            <div className="dfx-root">
                {/* ── TOPBAR ── */}
                <header className="topbar">
                    <div className="topbar-brand">
                        <div className="topbar-icon">
                            <HelpCircle size={18} />
                        </div>
                        <span className="topbar-name">DFX Help</span>
                        <span className="topbar-tag">Official</span>
                    </div>
                    <a
                        href={TELEGRAM_BOT_LINK}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-tg"
                    >
                        <Send size={14} />
                        {TELEGRAM_BOT_NAME}
                    </a>
                </header>

                {/* ── HERO STRIP ── */}
                <section className="herostrip">
                    <h1>DFX <span>Help Center</span></h1>
                    <p>Step-by-step video guides to help you get started and master every feature.</p>
                </section>

                {/* ── MAIN ── */}
                <main className="main">
                    <div className="sec-header">
                        <div className="sec-title">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5">
                                <path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.9L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
                            </svg>
                            Video Tutorials
                        </div>
                        {!loading && videos.length > 0 && (
                            <span className="sec-count">{videos.length} video{videos.length !== 1 ? 's' : ''}</span>
                        )}
                    </div>

                    {loading ? (
                        <div className="skgrid">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="skcard">
                                    <div className="skvideo" />
                                    <div className="skbody">
                                        <div className="skline xs" style={{ marginBottom: 8 }} />
                                        <div className="skline" />
                                        <div className="skline sm" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : videos.length === 0 ? (
                        <div className="empty">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
                        <div className="tgbanner-left">
                            <div className="tgicon">
                                <Send size={22} />
                            </div>
                            <div>
                                <h3>Need more help?</h3>
                                <p>Join our Telegram bot for live support and updates</p>
                            </div>
                        </div>
                        <a
                            href={TELEGRAM_BOT_LINK}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-tg-lg"
                        >
                            <Send size={16} />
                            Open {TELEGRAM_BOT_NAME}
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
