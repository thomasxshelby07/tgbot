'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, ExternalLink, ArrowRight, Video, HelpCircle, Send } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const TG_CHANNEL = 'https://t.me/dfx0777';
const TG_BOT     = 'https://t.me/DafaxbetBot';
const DFX_SITE   = 'http://dafaxbet.com/register?campaignId=tg07';

interface HelpVideo {
    _id: string;
    title: string;
    description: string;
    videoUrl: string;
    thumbnailUrl?: string;
    category: 'hindi' | 'english';
    buttonLabel: string;
    buttonUrl: string;
    order: number;
    isActive: boolean;
}

interface HelpSettings {
    logoUrl?: string;
    offerActive?: boolean;
    offerText?: string;
    offerButtonLabel?: string;
    offerButtonUrl?: string;
    bottomOfferActive?: boolean;
    bottomOfferText?: string;
    bottomOfferButtonLabel?: string;
    bottomOfferButtonUrl?: string;
}



function VideoCard({ video, index }: { video: HelpVideo; index: number }) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const cardRef = useRef<HTMLDivElement>(null);

    const [playing, setPlaying] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry.isIntersecting && playing) {
                    videoRef.current?.pause();
                    setPlaying(false);
                }
            },
            { threshold: 0.15 }
        );
        if (cardRef.current) observer.observe(cardRef.current);
        return () => observer.disconnect();
    }, [playing]);

    const handlePlayFullscreen = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!videoRef.current) return;
        try {
            await videoRef.current.play();
            setPlaying(true);
            const v = videoRef.current as any;
            if (v.requestFullscreen) {
                await v.requestFullscreen();
            } else if (v.webkitEnterFullscreen) {
                v.webkitEnterFullscreen();
            } else if (v.msRequestFullscreen) {
                v.msRequestFullscreen();
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div ref={cardRef} className="vc" style={{ animationDelay: `${index * 0.07}s` }}>
            <div className="vplayer">
                {!loaded && (
                    video.thumbnailUrl
                        ? <img src={video.thumbnailUrl} alt={video.title} className="vthumb" />
                        : <div className="vshimmer" />
                )}

                <video
                    ref={videoRef}
                    src={video.videoUrl}
                    className={`vel ${loaded ? 'visible' : ''}`}
                    controls
                    playsInline
                    preload="metadata"
                    onLoadedMetadata={() => setLoaded(true)}
                    onEnded={() => setPlaying(false)}
                    poster={video.thumbnailUrl || undefined}
                />

                {!playing && (
                    <div className="vcoverlay" onClick={handlePlayFullscreen}>
                        <button className="vcplaybtn" onClick={handlePlayFullscreen}>
                            <Play size={22} fill="currentColor" />
                        </button>
                    </div>
                )}
            </div>

            <div className="vcbody">
                <h3 className="vctitle">{video.title}</h3>
                {video.description && <p className="vcdesc">{video.description}</p>}
                {video.buttonLabel && video.buttonUrl && (
                    <a href={video.buttonUrl} target="_blank" rel="noopener noreferrer" className="vcbtn">
                        {video.buttonLabel} <ExternalLink size={14} />
                    </a>
                )}
            </div>
        </div>
    );
}

export default function DfxHelpPage() {
    const [videos, setVideos] = useState<HelpVideo[]>([]);
    const [settings, setSettings] = useState<HelpSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [filterCat, setFilterCat] = useState<'all' | 'hindi' | 'english'>('all');

    useEffect(() => {
        fetch(`${API}/api/dfxhelp`)
            .then(r => r.json())
            .then(d => {
                setVideos(d.videos || []);
                setSettings(d.settings || null);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    return (
        <>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                
                *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

                body {
                    background-color: #050000;
                    background-image: radial-gradient(circle at 50% 0%, #4a0000 0%, #050000 70%);
                    background-attachment: fixed;
                    color: #ffffff;
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                    -webkit-font-smoothing: antialiased;
                }

                .dfx-root { min-height: 100vh; display: flex; flex-direction: column; }

                /* ── TOPBAR ── */
                .topbar {
                    background: rgba(0,0,0,0.6);
                    backdrop-filter: blur(12px);
                    border-bottom: 1px solid #ff1a1a;
                    padding: 8px 24px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    position: sticky; top: 0; z-index: 100;
                    gap: 12px;
                }
                .brand { display: flex; align-items: center; gap: 10px; }
                .brand-logo { height: 46px; max-height: none; width: auto; object-fit: contain; }
                .brand-icon {
                    width: 34px; height: 34px;
                    background: #facc15;
                    border-radius: 50%;
                    display: flex; align-items: center; justify-content: center;
                    color: #000;
                }
                .brand-name { font-size: 1.1rem; font-weight: 800; color: #facc15; text-transform: uppercase; letter-spacing: 0.05em; }
                .topbar-links { display: flex; align-items: center; gap: 10px; flex-shrink: 0; flex-wrap: wrap; }
                
                .btn-tg, .btn-ch, .btn-reg {
                    display: inline-flex; align-items: center; justify-content: center;
                    font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
                    padding: 8px 16px; text-decoration: none; transition: all 0.2s;
                    border-radius: 4px; gap: 6px; letter-spacing: 0.05em;
                }
                .btn-tg { background: #2196F3; color: #fff; box-shadow: 0 0 10px rgba(33,150,243,0.3); }
                .btn-tg:hover { background: #1976D2; box-shadow: 0 0 15px rgba(33,150,243,0.5); transform: translateY(-1px); }
                .btn-ch { background: #000; color: #fff; border: 1px solid #333; }
                .btn-ch:hover { background: #111; border-color: #555; }
                .btn-reg { background: #e65100; color: #fff; box-shadow: 0 0 10px rgba(230,81,0,0.3); }
                .btn-reg:hover { background: #bf360c; box-shadow: 0 0 15px rgba(230,81,0,0.5); transform: translateY(-1px); }

                @media (max-width: 720px) {
                    .btn-label { display: none; }
                    .btn-tg, .btn-ch, .btn-reg { padding: 10px; }
                }

                /* ── OFFER BANNER ── */
                .offer-banner {
                    background: linear-gradient(90deg, #ff9900 0%, #ffcc00 50%, #ff9900 100%);
                    color: #0d0000;
                    padding: 14px 24px;
                    text-align: center;
                    font-weight: 900;
                    display: flex; align-items: center; justify-content: center; gap: 20px;
                    flex-wrap: wrap;
                    box-shadow: 0 4px 25px rgba(255, 170, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.6);
                    border-bottom: 2px solid #b36b00;
                }
                .offer-text { font-size: 1.05rem; letter-spacing: 0.02em; text-transform: uppercase; text-shadow: 0 1px 1px rgba(255,255,255,0.5); }
                .offer-btn {
                    background: #000; color: #fff;
                    font-size: 0.8rem; font-weight: 900; text-transform: uppercase; padding: 8px 18px;
                    text-decoration: none; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px;
                    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                }
                .offer-btn:hover { background: #1a1a1a; transform: translateY(-2px); box-shadow: 0 6px 15px rgba(0,0,0,0.5); color: #ffcc00; }
                
                .bottom-offer { margin-top: 40px; }

                /* ── HERO STRIP ── */
                .herostrip {
                    padding: 50px 24px 30px;
                    text-align: center;
                }
                .herostrip h1 {
                    font-size: clamp(2rem, 5vw, 3.5rem);
                    font-weight: 900; letter-spacing: -0.02em;
                    color: #fff; margin-bottom: 12px;
                    text-transform: uppercase;
                }
                .herostrip h1 span { color: #facc15; }
                .herostrip p { font-size: 1.05rem; color: #fca5a5; max-width: 600px; margin: 0 auto; line-height: 1.5; }

                /* ── MAIN ── */
                .main {
                    max-width: 1200px; margin: 0 auto;
                    padding: 10px 20px 80px; flex: 1; width: 100%;
                }
                
                /* ── FILTER TABS ── */
                .filter-row { display: flex; align-items: center; gap: 10px; margin-bottom: 24px; flex-wrap: wrap; justify-content: center; }
                .filter-tab {
                    padding: 8px 20px; font-size: 0.85rem; font-weight: 700;
                    border: 1px solid #4a0000; background: #1a0505; color: #fca5a5;
                    cursor: pointer; transition: all 0.2s; text-transform: uppercase; letter-spacing: 0.05em;
                }
                .filter-tab:hover { background: #2a0000; color: #fff; border-color: #fff; }
                .filter-tab.active { background: #facc15; color: #000; border-color: #facc15; }

                /* ── VIDEO CARD ── */
                .vc {
                    background: #0f0202; border: 1px solid #ffffff; border-radius: 6px;
                    overflow: hidden; transition: border-color 0.2s;
                    animation: fadein 0.35s ease both;
                    position: relative;
                }
                .vc:hover {
                    border-color: #facc15;
                }
                @keyframes fadein {
                    from { opacity: 0; transform: translateY(15px); }
                    to { opacity: 1;                /* ── PLAYER ── */
                .vplayer { position: relative; background: #000; display: block; overflow: hidden; border-bottom: 1px solid #2a0000; aspect-ratio: 1 / 1; width: 100%; }
                .vshimmer { width: 100%; height: 100%; background: #111; animation: pulse 2s infinite; }
                @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.7; } 100% { opacity: 1; } }
                
                .vel { width: 100%; height: 100%; object-fit: contain; background: #000; opacity: 0; transition: opacity 0.3s; cursor: pointer; display: block; }
                .vel.visible { opacity: 1; }
                .vthumb { width: 100%; height: 100%; object-fit: contain; display: block; }

                /* Overlay */
                .vcoverlay {
                    position: absolute; inset: 0;
                    display: flex; align-items: center; justify-content: center;
                    background: rgba(0,0,0,0.3); transition: background 0.3s; cursor: pointer; z-index: 10;
                }
                .vcoverlay:hover { background: rgba(0,0,0,0.1); }

                .vcplaybtn {
                    width: 56px; height: 56px; border-radius: 50%;
                    background: #facc15; color: #000; border: none; cursor: pointer;
                    display: flex; align-items: center; justify-content: center;
                    transition: all 0.2s; box-shadow: 0 4px 15px rgba(250,204,21,0.4);
                }
                .vcplaybtn:hover { transform: scale(1.1); background: #ffea00; box-shadow: 0 4px 25px rgba(250,204,21,0.6); }

                /* ── CARD BODY ── */flex; gap: 6px; }

                /* ── CARD BODY ── */
                .vcbody { padding: 20px; }
                .vcnum { font-size: 0.7rem; font-weight: 800; color: #facc15; letter-spacing: 0.1em; margin-bottom: 6px; }
                .vctitle { font-size: 1.1rem; font-weight: 700; color: #fff; line-height: 1.3; margin-bottom: 8px; }
                .vcdesc { font-size: 0.85rem; color: #fca5a5; line-height: 1.6; margin-bottom: 16px; opacity: 0.8; }
                .vcbtn {
                    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
                    background: #facc15; color: #000; text-decoration: none; text-transform: uppercase;
                    font-size: 0.75rem; font-weight: 800; padding: 10px 18px; letter-spacing: 0.05em;
                    transition: all 0.2s; border-radius: 2px; width: 100%;
                }
                .vcbtn:hover { background: #fff; transform: translateY(-2px); box-shadow: 0 4px 15px rgba(255,255,255,0.3); }

                /* ── GRID ── */
                .vgrid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; align-items: start; }
                
                @media (max-width: 900px) {
                    .vgrid { grid-template-columns: repeat(3, 1fr); gap: 16px; }
                }
                
                /* Skeletons */
                .skcard { background: #0f0202; border: 1px solid #2a0000; }
                .skline { height: 12px; background: #222; margin-bottom: 12px; animation: pulse 2s infinite; }
                .skline.sm { width: 60%; }

                /* Empty */
                .empty { text-align: center; padding: 80px 20px; color: #aaa; }
                .empty h3 { font-size: 1.2rem; font-weight: 700; color: #fff; margin: 12px 0 6px; }

                /* ── TELEGRAM BANNER ── */
                .linkbanner { margin-top: 60px; background: #0f0202; border: 1px solid #3a0000; border-top: 3px solid #facc15; padding: 30px; text-align: center; }
                .linkbanner-title { font-size: 1.5rem; font-weight: 800; color: #fff; margin-bottom: 6px; text-transform: uppercase; }
                .linkbanner-sub { color: #fca5a5; font-size: 0.9rem; margin-bottom: 24px; }
                .link-cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; max-width: 1000px; margin: 0 auto; }
                
                .link-card {
                    display: flex; align-items: center; justify-content: center; gap: 12px;
                    padding: 16px; background: #1a0505; border: 1px solid #3a0000; text-decoration: none;
                    transition: all 0.2s;
                }
                .link-card:hover { border-color: #facc15; background: #2a0000; transform: translateY(-3px); }
                .lc-icon { color: #facc15; }
                .lc-name { font-size: 0.95rem; font-weight: 700; color: #fff; text-transform: uppercase; letter-spacing: 0.05em; }

                /* ── FOOTER ── */
                .footer { border-top: 1px solid #2a0000; background: #050000; padding: 24px; text-align: center; font-size: 0.8rem; color: #888; font-weight: 500; }
                .footer span { color: #facc15; }

                @media (max-width: 600px) {
                    .topbar { padding: 8px 12px; flex-wrap: nowrap; justify-content: space-between; }
                    .brand-name { display: none; }
                    .topbar-links { gap: 4px; justify-content: flex-end; width: auto; }
                    .btn-tg, .btn-ch, .btn-reg { padding: 6px 10px; font-size: 0.65rem; }
                    .btn-tg { padding: 6px 6px; } .btn-ch { padding: 6px 6px; } .btn-reg { padding: 6px 8px; }
                    .offer-banner { padding: 10px; font-size: 0.85rem; flex-direction: column; gap: 8px; }
                    .herostrip { padding: 30px 16px 20px; }
                    .main { padding: 10px 12px 60px; }
                    .vgrid { grid-template-columns: 1fr 1fr; gap: 10px; }
                    .vcbody { padding: 12px; }
                    .vctitle { font-size: 0.85rem; line-height: 1.2; margin-bottom: 6px; }
                    .vcdesc { font-size: 0.7rem; margin-bottom: 10px; }
                    .vcbtn { padding: 8px 12px; font-size: 0.7rem; }
                    .linkbanner { padding: 24px 16px; }
                    .link-cards { grid-template-columns: 1fr; }
                    .filter-tab { padding: 8px 12px; font-size: 0.7rem; }
                }
            `}</style>

            <div className="dfx-root">
                {/* ── TOPBAR ── */}
                <header className="topbar">
                    <div className="brand">
                        {settings?.logoUrl ? (
                            <img src={settings.logoUrl} alt="DFX Logo" className="brand-logo" />
                        ) : (
                            <>
                                <div className="brand-icon"><HelpCircle size={18} /></div>
                                <span className="brand-name">DFX HELP</span>
                            </>
                        )}
                    </div>
                    <div className="topbar-links">
                        <a href={TG_CHANNEL} target="_blank" rel="noopener noreferrer" className="btn-ch">
                            <Send size={14} /><span className="btn-label">Channel</span>
                        </a>
                        <a href={TG_BOT} target="_blank" rel="noopener noreferrer" className="btn-tg">
                            <Send size={14} /><span className="btn-label">Support Bot</span>
                        </a>
                        <a href={DFX_SITE} target="_blank" rel="noopener noreferrer" className="btn-reg">
                            <ExternalLink size={14} /><span className="btn-label">Register</span>
                        </a>
                    </div>
                </header>

                {/* ── OFFER BANNER ── */}
                {settings?.offerActive && settings.offerText && (
                    <div className="offer-banner">
                        <span className="offer-text">{settings.offerText}</span>
                        {settings.offerButtonLabel && settings.offerButtonUrl && (
                            <a href={settings.offerButtonUrl} target="_blank" rel="noopener noreferrer" className="offer-btn">
                                {settings.offerButtonLabel} <ArrowRight size={14} />
                            </a>
                        )}
                    </div>
                )}

                {/* ── HERO STRIP ── */}
                <div className="herostrip">
                    <h1>DFX <span>Tutorials</span></h1>
                    <p>Official video guides to master every platform feature. Follow the steps below and start winning.</p>
                </div>

                {/* ── MAIN ── */}
                <main className="main">
                    {/* Filters */}
                    {!loading && videos.length > 0 && (
                        <div className="filter-row">
                            {(['all', 'english', 'hindi'] as const).map(cat => (
                                <button key={cat} className={`filter-tab ${filterCat === cat ? 'active' : ''}`} onClick={() => setFilterCat(cat)}>
                                    {cat === 'all' ? `ALL` : cat === 'english' ? `ENGLISH` : `HINDI`}
                                </button>
                            ))}
                        </div>
                    )}

                    {loading ? (
                        <div className="vgrid">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="skcard">
                                    <div className="vshimmer" />
                                    <div className="vcbody">
                                        <div className="skline sm" />
                                        <div className="skline" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : videos.filter(v => filterCat === 'all' || v.category === filterCat).length === 0 ? (
                        <div className="empty">
                            <Video size={48} className="mx-auto text-[#4a0000] mb-4" />
                            <h3>{videos.length === 0 ? 'NO GUIDES AVAILABLE' : 'NO GUIDES IN THIS LANGUAGE'}</h3>
                            <p>Guides are being recorded and will be uploaded shortly.</p>
                        </div>
                    ) : (
                        <div className="vgrid">
                            {videos
                                .filter(v => filterCat === 'all' || v.category === filterCat)
                                .map((video, i) => (
                                    <VideoCard key={video._id} video={video} index={i} />
                                ))}
                        </div>
                    )}

                    {/* ── BOTTOM OFFER BANNER ── */}
                    {settings?.bottomOfferActive && settings.bottomOfferText && (
                        <div className="offer-banner bottom-offer">
                            <span className="offer-text">{settings.bottomOfferText}</span>
                            {settings.bottomOfferButtonLabel && settings.bottomOfferButtonUrl && (
                                <a href={settings.bottomOfferButtonUrl} target="_blank" rel="noopener noreferrer" className="offer-btn">
                                    {settings.bottomOfferButtonLabel} <ArrowRight size={14} />
                                </a>
                            )}
                        </div>
                    )}

                    {/* ── LINKS BANNER ── */}
                    <div className="linkbanner">
                        <div className="linkbanner-title">Need More Action?</div>
                        <p className="linkbanner-sub">Join the community or directly contact absolute 24/7 support.</p>
                        <div className="link-cards">
                            <a href={TG_BOT} target="_blank" rel="noopener noreferrer" className="link-card">
                                <Send size={24} className="lc-icon" />
                                <span className="lc-name">@DafaxbetBot</span>
                            </a>
                            <a href={TG_CHANNEL} target="_blank" rel="noopener noreferrer" className="link-card">
                                <Send size={24} className="lc-icon" />
                                <span className="lc-name">@dfx0777</span>
                            </a>
                            <a href={DFX_SITE} target="_blank" rel="noopener noreferrer" className="link-card">
                                <ExternalLink size={24} className="lc-icon" />
                                <span className="lc-name">Dafaxbet.com</span>
                            </a>
                        </div>
                    </div>
                </main>

                {/* ── FOOTER ── */}
                <footer className="footer">
                    © {new Date().getFullYear()} <span>DFX</span> OFFICIAL HELP DESK
                </footer>
            </div>
        </>
    );
}
