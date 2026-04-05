'use client';

import { useState, useEffect, useRef } from 'react';
import { Play, Pause, ExternalLink, Send, ChevronDown, Volume2, VolumeX } from 'lucide-react';

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
    const [playing, setPlaying] = useState(false);
    const [muted, setMuted] = useState(true);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Intersection Observer for scroll animation
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.15 }
        );
        const el = document.getElementById(`video-card-${video._id}`);
        if (el) observer.observe(el);
        return () => observer.disconnect();
    }, [video._id]);

    const togglePlay = () => {
        const vid = videoRef.current;
        if (!vid) return;
        if (playing) {
            vid.pause();
            setPlaying(false);
        } else {
            vid.play();
            setPlaying(true);
        }
    };

    const toggleMute = (e: React.MouseEvent) => {
        e.stopPropagation();
        const vid = videoRef.current;
        if (!vid) return;
        vid.muted = !muted;
        setMuted(!muted);
    };

    return (
        <div
            id={`video-card-${video._id}`}
            className="video-card"
            style={{
                animationDelay: `${index * 0.12}s`,
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(32px)',
                transition: `opacity 0.6s ease ${index * 0.12}s, transform 0.6s ease ${index * 0.12}s`,
            }}
        >
            {/* Video Player */}
            <div
                className="video-wrapper"
                onClick={togglePlay}
            >
                <video
                    ref={videoRef}
                    src={video.videoUrl}
                    className="video-element"
                    loop
                    muted={muted}
                    playsInline
                    preload="metadata"
                    onEnded={() => setPlaying(false)}
                />
                {/* Overlay Controls */}
                <div className={`video-overlay ${playing ? 'playing' : ''}`}>
                    <button className="play-btn" onClick={togglePlay}>
                        {playing ? <Pause size={28} /> : <Play size={28} />}
                    </button>
                </div>
                {/* Mute Toggle */}
                <button
                    className="mute-btn"
                    onClick={toggleMute}
                >
                    {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
                {/* Gradient */}
                <div className="video-gradient" />
            </div>

            {/* Card Content */}
            <div className="card-body">
                <h3 className="card-title">{video.title}</h3>
                {video.description && (
                    <p className="card-description">{video.description}</p>
                )}
                {video.buttonLabel && video.buttonUrl && (
                    <a
                        href={video.buttonUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="card-btn"
                        onClick={e => e.stopPropagation()}
                    >
                        <ExternalLink size={14} />
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
                * { box-sizing: border-box; margin: 0; padding: 0; }

                :root {
                    --dark: #0a0a0f;
                    --dark2: #111118;
                    --dark3: #1a1a26;
                    --border: rgba(255,255,255,0.07);
                    --accent: #4f6ef7;
                    --accent2: #7c3aed;
                    --accent-glow: rgba(79,110,247,0.25);
                    --text: #e8e8f0;
                    --text-muted: #8888a8;
                    --tg: #2196F3;
                }

                body { background: var(--dark); color: var(--text); }

                .dfx-root {
                    min-height: 100vh;
                    background: var(--dark);
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                    overflow-x: hidden;
                }

                /* ── HERO ── */
                .hero {
                    position: relative;
                    min-height: 100vh;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    padding: 80px 24px 120px;
                    overflow: hidden;
                }

                .hero-orb-1 {
                    position: absolute;
                    width: 500px; height: 500px;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(79,110,247,0.15) 0%, transparent 70%);
                    top: -100px; left: 50%;
                    transform: translateX(-50%);
                    pointer-events: none;
                    animation: pulse-orb 6s ease-in-out infinite alternate;
                }
                .hero-orb-2 {
                    position: absolute;
                    width: 300px; height: 300px;
                    border-radius: 50%;
                    background: radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%);
                    bottom: 60px; right: 10%;
                    pointer-events: none;
                    animation: pulse-orb 8s ease-in-out infinite alternate-reverse;
                }

                @keyframes pulse-orb {
                    from { transform: translateX(-50%) scale(1); opacity: 0.7; }
                    to { transform: translateX(-50%) scale(1.15); opacity: 1; }
                }

                .hero-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    border: 1px solid var(--border);
                    background: rgba(255,255,255,0.04);
                    backdrop-filter: blur(12px);
                    padding: 8px 18px;
                    border-radius: 100px;
                    font-size: 12px;
                    font-weight: 600;
                    color: var(--text-muted);
                    letter-spacing: 0.08em;
                    text-transform: uppercase;
                    margin-bottom: 28px;
                    animation: fade-up 0.6s ease both;
                }
                .hero-badge-dot {
                    width: 6px; height: 6px;
                    border-radius: 50%;
                    background: var(--accent);
                    animation: blink 2s ease-in-out infinite;
                }
                @keyframes blink {
                    0%, 100% { opacity: 1; } 50% { opacity: 0.3; }
                }

                .hero-title {
                    font-size: clamp(2.6rem, 7vw, 5rem);
                    font-weight: 900;
                    line-height: 1.08;
                    letter-spacing: -0.03em;
                    color: #fff;
                    margin-bottom: 20px;
                    animation: fade-up 0.6s 0.1s ease both;
                }
                .hero-title .gradient-text {
                    background: linear-gradient(135deg, var(--accent), #a78bfa);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .hero-subtitle {
                    font-size: 1.1rem;
                    color: var(--text-muted);
                    max-width: 520px;
                    line-height: 1.7;
                    margin-bottom: 40px;
                    animation: fade-up 0.6s 0.2s ease both;
                }

                .hero-actions {
                    display: flex;
                    gap: 14px;
                    flex-wrap: wrap;
                    justify-content: center;
                    animation: fade-up 0.6s 0.3s ease both;
                }

                .btn-primary {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: linear-gradient(135deg, var(--accent), var(--accent2));
                    color: #fff;
                    font-size: 0.9rem;
                    font-weight: 700;
                    padding: 14px 28px;
                    border-radius: 14px;
                    text-decoration: none;
                    transition: all 0.2s ease;
                    box-shadow: 0 8px 32px var(--accent-glow);
                    border: none;
                    cursor: pointer;
                }
                .btn-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 40px rgba(79,110,247,0.4);
                }

                .btn-tg {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    background: rgba(33, 150, 243, 0.12);
                    border: 1px solid rgba(33, 150, 243, 0.3);
                    color: #64b5f6;
                    font-size: 0.9rem;
                    font-weight: 700;
                    padding: 14px 28px;
                    border-radius: 14px;
                    text-decoration: none;
                    transition: all 0.2s ease;
                    cursor: pointer;
                }
                .btn-tg:hover {
                    background: rgba(33, 150, 243, 0.2);
                    border-color: rgba(33, 150, 243, 0.5);
                    color: #90caf9;
                    transform: translateY(-2px);
                }

                .scroll-indicator {
                    position: absolute;
                    bottom: 36px;
                    left: 50%;
                    transform: translateX(-50%);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 6px;
                    color: var(--text-muted);
                    font-size: 11px;
                    font-weight: 600;
                    letter-spacing: 0.06em;
                    text-transform: uppercase;
                    animation: bounce-down 2s ease-in-out infinite;
                    opacity: 0.6;
                }
                @keyframes bounce-down {
                    0%, 100% { transform: translateX(-50%) translateY(0); }
                    50% { transform: translateX(-50%) translateY(6px); }
                }

                /* ── VIDEOS SECTION ── */
                .videos-section {
                    padding: 60px 24px 100px;
                    max-width: 1200px;
                    margin: 0 auto;
                }

                .section-label {
                    text-align: center;
                    font-size: 11px;
                    font-weight: 700;
                    letter-spacing: 0.15em;
                    text-transform: uppercase;
                    color: var(--accent);
                    margin-bottom: 12px;
                }
                .section-heading {
                    text-align: center;
                    font-size: clamp(1.6rem, 4vw, 2.8rem);
                    font-weight: 800;
                    color: #fff;
                    letter-spacing: -0.02em;
                    margin-bottom: 48px;
                }

                .videos-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 28px;
                }

                /* ── VIDEO CARD ── */
                .video-card {
                    background: var(--dark2);
                    border: 1px solid var(--border);
                    border-radius: 24px;
                    overflow: hidden;
                    transition: border-color 0.3s ease, box-shadow 0.3s ease;
                }
                .video-card:hover {
                    border-color: rgba(79,110,247,0.3);
                    box-shadow: 0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(79,110,247,0.15);
                }

                .video-wrapper {
                    position: relative;
                    aspect-ratio: 16/9;
                    background: #000;
                    cursor: pointer;
                    overflow: hidden;
                }
                .video-element {
                    width: 100%; height: 100%;
                    object-fit: cover;
                    display: block;
                }
                .video-overlay {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(0,0,0,0.3);
                    transition: background 0.2s;
                }
                .video-overlay.playing {
                    background: rgba(0,0,0,0);
                }
                .video-overlay.playing:hover {
                    background: rgba(0,0,0,0.2);
                }

                .play-btn {
                    width: 56px; height: 56px;
                    border-radius: 50%;
                    background: rgba(255,255,255,0.15);
                    backdrop-filter: blur(8px);
                    border: 1px solid rgba(255,255,255,0.25);
                    color: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: all 0.2s;
                    cursor: pointer;
                }
                .play-btn:hover {
                    background: rgba(79,110,247,0.6);
                    transform: scale(1.1);
                }
                .video-overlay.playing .play-btn {
                    opacity: 0;
                }
                .video-overlay.playing:hover .play-btn {
                    opacity: 1;
                }

                .mute-btn {
                    position: absolute;
                    top: 10px; right: 10px;
                    background: rgba(0,0,0,0.5);
                    backdrop-filter: blur(8px);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: #fff;
                    border-radius: 8px;
                    padding: 6px;
                    cursor: pointer;
                    transition: background 0.2s;
                    display: flex; align-items: center; justify-content: center;
                    z-index: 10;
                }
                .mute-btn:hover { background: rgba(79,110,247,0.6); }

                .video-gradient {
                    position: absolute;
                    bottom: 0; left: 0; right: 0;
                    height: 60px;
                    background: linear-gradient(transparent, rgba(10,10,15,0.8));
                    pointer-events: none;
                }

                .card-body {
                    padding: 20px 22px 22px;
                }
                .card-title {
                    font-size: 1.05rem;
                    font-weight: 700;
                    color: #fff;
                    margin-bottom: 8px;
                    line-height: 1.35;
                }
                .card-description {
                    font-size: 0.875rem;
                    color: var(--text-muted);
                    line-height: 1.6;
                    margin-bottom: 14px;
                }
                .card-btn {
                    display: inline-flex;
                    align-items: center;
                    gap: 7px;
                    background: linear-gradient(135deg, var(--accent), var(--accent2));
                    color: #fff;
                    text-decoration: none;
                    font-size: 0.8rem;
                    font-weight: 700;
                    padding: 10px 18px;
                    border-radius: 10px;
                    transition: all 0.2s;
                    box-shadow: 0 4px 16px var(--accent-glow);
                }
                .card-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 8px 24px rgba(79,110,247,0.4);
                }

                /* ── EMPTY STATE ── */
                .empty-state {
                    text-align: center;
                    padding: 80px 20px;
                    color: var(--text-muted);
                }
                .empty-state svg {
                    margin: 0 auto 16px;
                    opacity: 0.3;
                }

                /* ── TELEGRAM BANNER ── */
                .tg-banner {
                    margin: 0 24px 80px;
                    max-width: 1200px;
                    margin-left: auto;
                    margin-right: auto;
                    background: linear-gradient(135deg, rgba(33,150,243,0.08) 0%, rgba(79,110,247,0.08) 100%);
                    border: 1px solid rgba(33,150,243,0.2);
                    border-radius: 24px;
                    padding: 40px 48px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    gap: 24px;
                    flex-wrap: wrap;
                }
                .tg-banner-left {
                    display: flex;
                    align-items: center;
                    gap: 18px;
                }
                .tg-icon {
                    width: 56px; height: 56px;
                    border-radius: 16px;
                    background: rgba(33,150,243,0.15);
                    border: 1px solid rgba(33,150,243,0.3);
                    display: flex; align-items: center; justify-content: center;
                    color: #64b5f6;
                    flex-shrink: 0;
                }
                .tg-banner h3 {
                    font-size: 1.2rem;
                    font-weight: 800;
                    color: #fff;
                    margin-bottom: 4px;
                }
                .tg-banner p {
                    font-size: 0.875rem;
                    color: var(--text-muted);
                }
                .btn-tg-banner {
                    display: inline-flex;
                    align-items: center;
                    gap: 10px;
                    background: linear-gradient(135deg, #1976D2, #2196F3);
                    color: #fff;
                    font-size: 0.9rem;
                    font-weight: 700;
                    padding: 14px 28px;
                    border-radius: 14px;
                    text-decoration: none;
                    transition: all 0.2s ease;
                    box-shadow: 0 8px 24px rgba(33,150,243,0.3);
                    white-space: nowrap;
                    flex-shrink: 0;
                }
                .btn-tg-banner:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 32px rgba(33,150,243,0.45);
                }

                /* ── FOOTER ── */
                .footer {
                    border-top: 1px solid var(--border);
                    padding: 28px 24px;
                    text-align: center;
                    color: var(--text-muted);
                    font-size: 0.8rem;
                }

                /* ── LOADING SHIMMER ── */
                .shimmer-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 28px;
                }
                .shimmer-card {
                    background: var(--dark2);
                    border: 1px solid var(--border);
                    border-radius: 24px;
                    overflow: hidden;
                }
                .shimmer-video { height: 180px; }
                .shimmer-body { padding: 20px; }
                .shimmer-line {
                    height: 14px;
                    border-radius: 8px;
                    margin-bottom: 10px;
                    background: linear-gradient(90deg, var(--dark3) 25%, rgba(255,255,255,0.04) 50%, var(--dark3) 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.5s infinite;
                }
                .shimmer-line.short { width: 60%; }
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }

                @keyframes fade-up {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @media (max-width: 640px) {
                    .hero { padding: 60px 20px 100px; }
                    .tg-banner { padding: 28px 24px; }
                    .videos-grid, .shimmer-grid { grid-template-columns: 1fr; }
                }
            `}</style>

            <div className="dfx-root">
                {/* ── HERO ── */}
                <section className="hero">
                    <div className="hero-orb-1" />
                    <div className="hero-orb-2" />

                    <div className="hero-badge">
                        <span className="hero-badge-dot" />
                        Help &amp; Tutorials
                    </div>

                    <h1 className="hero-title">
                        DFX <span className="gradient-text">Help Center</span>
                    </h1>

                    <p className="hero-subtitle">
                        Watch official guides and tutorials to get the most out of DFX.
                        Everything you need, in one place.
                    </p>

                    <div className="hero-actions">
                        <a href="#videos" className="btn-primary">
                            Watch Tutorials
                        </a>
                        <a
                            href={TELEGRAM_BOT_LINK}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-tg"
                        >
                            <Send size={16} />
                            Open {TELEGRAM_BOT_NAME}
                        </a>
                    </div>

                    <div className="scroll-indicator">
                        <span>Scroll</span>
                        <ChevronDown size={16} />
                    </div>
                </section>

                {/* ── VIDEOS ── */}
                <section id="videos" className="videos-section">
                    <p className="section-label">Official Guides</p>
                    <h2 className="section-heading">Video Tutorials</h2>

                    {loading ? (
                        <div className="shimmer-grid">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="shimmer-card">
                                    <div className="shimmer-line shimmer-video" />
                                    <div className="shimmer-body">
                                        <div className="shimmer-line" />
                                        <div className="shimmer-line short" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : videos.length === 0 ? (
                        <div className="empty-state">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.9L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
                            </svg>
                            <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'white', marginBottom: 8 }}>
                                No videos yet
                            </p>
                            <p>Check back soon for tutorials!</p>
                        </div>
                    ) : (
                        <div className="videos-grid">
                            {videos.map((video, i) => (
                                <VideoCard key={video._id} video={video} index={i} />
                            ))}
                        </div>
                    )}
                </section>

                {/* ── TELEGRAM BANNER ── */}
                <div className="tg-banner">
                    <div className="tg-banner-left">
                        <div className="tg-icon">
                            <Send size={26} />
                        </div>
                        <div>
                            <h3>Join us on Telegram</h3>
                            <p>Get updates, support and more — directly on Telegram</p>
                        </div>
                    </div>
                    <a
                        href={TELEGRAM_BOT_LINK}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-tg-banner"
                    >
                        <Send size={18} />
                        Open {TELEGRAM_BOT_NAME}
                    </a>
                </div>

                {/* ── FOOTER ── */}
                <footer className="footer">
                    <p>© {new Date().getFullYear()} DFX Help Center · All videos managed by the admin team</p>
                </footer>
            </div>
        </>
    );
}
