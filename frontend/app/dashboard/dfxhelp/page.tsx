'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    Plus, Video, Trash2, Edit3, Eye, EyeOff, Save, X,
    Upload, Link2, Type, AlignLeft, ExternalLink, Loader2,
    CheckCircle2, AlertCircle, Image as ImageIcon, Globe, Languages,
    Settings as SettingsIcon, ToggleLeft, ToggleRight
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

type Category = 'hindi' | 'english';

interface HelpVideo {
    _id: string;
    title: string;
    description: string;
    videoUrl: string;
    thumbnailUrl: string;
    category: Category;
    buttonLabel: string;
    buttonUrl: string;
    order: number;
    isActive: boolean;
    createdAt: string;
}

interface HelpSettings {
    logoUrl: string;
    offerActive: boolean;
    offerText: string;
    offerButtonLabel: string;
    offerButtonUrl: string;
    bottomOfferActive: boolean;
    bottomOfferText: string;
    bottomOfferButtonLabel: string;
    bottomOfferButtonUrl: string;
}

interface Toast { id: number; message: string; type: 'success' | 'error'; }

const emptyForm = {
    title: '',
    description: '',
    videoUrl: '',
    thumbnailUrl: '',
    category: 'english' as Category,
    buttonLabel: '',
    buttonUrl: '',
};

const CAT_LABELS: Record<Category, string> = { english: '🌐 English', hindi: '🇮🇳 Hindi' };

export default function DfxHelpAdminPage() {
    // Media State
    const [videos, setVideos] = useState<HelpVideo[]>([]);
    const [settings, setSettings] = useState<HelpSettings>({ logoUrl: '', offerActive: false, offerText: '', offerButtonLabel: '', offerButtonUrl: '', bottomOfferActive: false, bottomOfferText: '', bottomOfferButtonLabel: '', bottomOfferButtonUrl: '' });
    
    // UI State
    const [loading, setLoading] = useState(true);
    const [filterCat, setFilterCat] = useState<'all' | Category>('all');
    const [activeTab, setActiveTab] = useState<'videos' | 'settings'>('videos');
    const [showForm, setShowForm] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const toastId = useRef(0);

    // Form State (Videos)
    const [editingVideo, setEditingVideo] = useState<HelpVideo | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [savingVideo, setSavingVideo] = useState(false);
    
    // Form State (Settings)
    const [savingSettings, setSavingSettings] = useState(false);

    // Upload State
    const [uploading, setUploading] = useState<'video' | 'thumb' | 'logo' | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const addToast = (message: string, type: 'success' | 'error') => {
        const id = ++toastId.current;
        setToasts(p => [...p, { id, message, type }]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
    };

    const fetchData = async () => {
        try {
            const [vidRes, setRes] = await Promise.all([
                axios.get(`${API}/api/dfxhelp/admin`),
                axios.get(`${API}/api/dfxhelp/settings`)
            ]);
            setVideos(vidRes.data.videos || []);
            if (setRes.data.settings) setSettings(setRes.data.settings);
        } catch { addToast('Failed to load data', 'error'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    // --- Media Upload ---
    const triggerUpload = (type: 'video' | 'thumb' | 'logo') => {
        setUploading(type);
        setTimeout(() => fileRef.current?.click(), 0);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !uploading) return;
        
        if (file.size > 100 * 1024 * 1024) {
            addToast('File too large (Max 100MB)', 'error');
            if (fileRef.current) fileRef.current.value = '';
            setUploading(null);
            return;
        }

        const currentUpload = uploading;
        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await axios.post(`${API}/api/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            
            if (currentUpload === 'video') setForm(p => ({ ...p, videoUrl: res.data.url }));
            if (currentUpload === 'thumb') setForm(p => ({ ...p, thumbnailUrl: res.data.url }));
            if (currentUpload === 'logo') setSettings(p => ({ ...p, logoUrl: res.data.url }));
            
            addToast(`File uploaded!`, 'success');
        } catch { addToast('Upload failed', 'error'); }
        finally { 
            setUploading(null); 
            if (fileRef.current) fileRef.current.value = '';
        }
    };

    // --- Video Management ---
    const openCreate = () => { setEditingVideo(null); setForm(emptyForm); setShowForm(true); };
    const openEdit = (v: HelpVideo) => {
        setEditingVideo(v);
        setForm({ title: v.title, description: v.description, videoUrl: v.videoUrl, thumbnailUrl: v.thumbnailUrl || '', category: v.category || 'english', buttonLabel: v.buttonLabel, buttonUrl: v.buttonUrl });
        setShowForm(true);
    };
    const closeForm = () => { setShowForm(false); setEditingVideo(null); setForm(emptyForm); };

    const handleSaveVideo = async () => {
        if (!form.title.trim() || !form.videoUrl.trim()) { addToast('Title and video are required', 'error'); return; }
        setSavingVideo(true);
        try {
            if (editingVideo) { await axios.put(`${API}/api/dfxhelp/${editingVideo._id}`, form); addToast('Video updated!', 'success'); }
            else { await axios.post(`${API}/api/dfxhelp`, form); addToast('Video added!', 'success'); }
            closeForm(); fetchData();
        } catch { addToast('Save failed', 'error'); }
        finally { setSavingVideo(false); }
    };

    const handleToggle = async (v: HelpVideo) => {
        try { await axios.patch(`${API}/api/dfxhelp/${v._id}/toggle`); addToast(`Video ${v.isActive ? 'hidden' : 'shown'}`, 'success'); fetchData(); }
        catch { addToast('Toggle failed', 'error'); }
    };

    const handleDelete = async (v: HelpVideo) => {
        if (!confirm(`Delete "${v.title}"?`)) return;
        try { await axios.delete(`${API}/api/dfxhelp/${v._id}`); addToast('Deleted', 'success'); fetchData(); }
        catch { addToast('Delete failed', 'error'); }
    };

    // --- Settings Management ---
    const handleSaveSettings = async () => {
        setSavingSettings(true);
        try {
            await axios.put(`${API}/api/dfxhelp/settings`, settings);
            addToast('Settings saved successfully!', 'success');
        } catch { addToast('Failed to save settings', 'error'); }
        finally { setSavingSettings(false); }
    };


    const filtered = filterCat === 'all' ? videos : videos.filter(v => v.category === filterCat);

    if (loading) {
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><Loader2 size={32} className="animate-spin text-blue-600" /></div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 pb-20">
            {/* Hidden file input */}
            <input ref={fileRef} type="file" accept={uploading === 'video' ? 'video/*' : 'image/*'} className="hidden" onChange={handleFileChange} />

            {/* Toasts */}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
                {toasts.map(t => (
                    <div key={t.id} className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold shadow-lg"
                        style={{ background: t.type === 'success' ? '#dcfce7' : '#fee2e2', color: t.type === 'success' ? '#166534' : '#991b1b', border: `1px solid ${t.type === 'success' ? '#bbf7d0' : '#fecaca'}` }}>
                        {t.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                        {t.message}
                    </div>
                ))}
            </div>

            {/* Header & Tabs */}
            <div className="max-w-4xl mx-auto mb-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            <Video size={24} className="text-blue-600" /> DFX Help Manager
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">Manage public help tutorials and page branding</p>
                    </div>
                    {activeTab === 'videos' && (
                        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all focus:ring-4 focus:ring-blue-100">
                            <Plus size={16} /> Add Video
                        </button>
                    )}
                </div>

                <div className="flex gap-2 p-1 bg-slate-200/60 rounded-xl w-max mb-6">
                    <button onClick={() => setActiveTab('videos')} className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'videos' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}>
                        <Video size={16} /> Tutorials
                    </button>
                    <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'settings' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}>
                        <SettingsIcon size={16} /> Page Settings & Offer
                    </button>
                </div>

                {/* --- VIDEOS TAB --- */}
                {activeTab === 'videos' && (
                    <>
                        <div className="flex items-center gap-2 mb-4">
                            {(['all', 'english', 'hindi'] as const).map(cat => (
                                <button key={cat} onClick={() => setFilterCat(cat)}
                                    className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${filterCat === cat ? 'bg-slate-800 text-white' : 'bg-white border text-slate-500 hover:border-slate-300'}`}>
                                    {cat === 'all' ? `All (${videos.length})` : cat}
                                </button>
                            ))}
                        </div>

                        {filtered.length === 0 ? (
                            <div className="bg-white border rounded-2xl p-12 flex flex-col items-center justify-center text-slate-400">
                                <Video size={40} className="mb-3 opacity-20" />
                                <p className="font-medium">No videos found</p>
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {filtered.map(v => (
                                    <div key={v._id} className={`bg-white rounded-xl border p-4 flex gap-4 transition-all hover:border-blue-200 ${!v.isActive ? 'opacity-60 bg-slate-50' : ''}`}>
                                        <div className="w-40 h-24 rounded-lg bg-slate-900 shrink-0 overflow-hidden relative group">
                                            {v.thumbnailUrl ? <img src={v.thumbnailUrl} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition" /> : <video src={v.videoUrl} className="w-full h-full object-cover" />}
                                            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] uppercase font-bold px-1.5 py-0.5 rounded">
                                                {v.category}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0 py-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="font-bold text-slate-900 truncate pr-4">{v.title}</h3>
                                                <div className="flex gap-1 shrink-0">
                                                    <button onClick={() => handleToggle(v)} className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hint-bottom-left" aria-label={v.isActive ? 'Hide Video' : 'Show Video'}>
                                                        {v.isActive ? <Eye size={15} /> : <EyeOff size={15} />}
                                                    </button>
                                                    <button onClick={() => openEdit(v)} className="p-1.5 rounded hover:bg-blue-50 text-blue-500"><Edit3 size={15} /></button>
                                                    <button onClick={() => handleDelete(v)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 size={15} /></button>
                                                </div>
                                            </div>
                                            {v.description && <p className="text-sm text-slate-500 line-clamp-1 mb-2">{v.description}</p>}
                                            <div className="flex gap-2 items-center mt-auto">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${v.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-500'}`}>
                                                    {v.isActive ? 'LIVE' : 'HIDDEN'}
                                                </span>
                                                {v.buttonLabel && <span className="text-xs text-blue-600 bg-blue-50 font-medium px-2 py-0.5 rounded-sm flex items-center gap-1"><Link2 size={12}/> {v.buttonLabel}</span>}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* --- SETTINGS TAB --- */}
                {activeTab === 'settings' && (
                    <div className="bg-white border rounded-2xl p-6 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><Globe size={20} className="text-blue-500" /> Branding & Promos</h2>
                        
                        <div className="space-y-8">
                            {/* Logo */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Platform Logo</label>
                                <p className="text-xs text-slate-500 mb-3">Upload a clean PNG logo to replace the default icon on the public page.</p>
                                
                                <div className="flex gap-4 items-end">
                                    <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 relative overflow-hidden group">
                                        {settings.logoUrl ? (
                                            <>
                                                <img src={settings.logoUrl} className="w-full h-full object-contain p-2" />
                                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => setSettings(p => ({...p, logoUrl: ''}))} className="text-white bg-red-500 p-1 rounded-md"><Trash2 size={14}/></button>
                                                </div>
                                            </>
                                        ) : <ImageIcon size={24} className="text-slate-300" />}
                                    </div>
                                    <div className="flex-1 max-w-sm">
                                        <button onClick={() => triggerUpload('logo')} disabled={uploading === 'logo'} className="text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors w-full flex justify-center items-center gap-2">
                                            {uploading === 'logo' ? <><Loader2 size={16} className="animate-spin" /> Uploading...</> : <><Upload size={16}/> Upload Logo</>}
                                        </button>
                                        <div className="mt-2 relative">
                                            <input type="text" value={settings.logoUrl} onChange={e => setSettings(p => ({...p, logoUrl: e.target.value}))} placeholder="Or paste image URL here..." className="w-full border rounded-lg px-3 py-2 text-xs text-slate-600 bg-slate-50" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            {/* Offer Banner */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700">Top Offer Banner</label>
                                        <p className="text-xs text-slate-500">Show a promotional banner at the very top of the help page.</p>
                                    </div>
                                    <button onClick={() => setSettings(p => ({...p, offerActive: !p.offerActive}))} className={`p-1 rounded-full transition-colors ${settings.offerActive ? 'text-green-500' : 'text-slate-300'}`}>
                                        {settings.offerActive ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                                    </button>
                                </div>

                                <div className={`space-y-4 pt-3 transition-opacity ${!settings.offerActive ? 'opacity-40 pointer-events-none' : ''}`}>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Announcement Text</label>
                                        <input type="text" value={settings.offerText} onChange={e => setSettings(p => ({...p, offerText: e.target.value}))} placeholder="e.g., 🔥 Get 200% Bonus on First Deposit!" className="w-full border rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Button Label</label>
                                            <input type="text" value={settings.offerButtonLabel} onChange={e => setSettings(p => ({...p, offerButtonLabel: e.target.value}))} placeholder="e.g., Claim Now" className="w-full border rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Button Link</label>
                                            <input type="text" value={settings.offerButtonUrl} onChange={e => setSettings(p => ({...p, offerButtonUrl: e.target.value}))} placeholder="https://..." className="w-full border rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            {/* Bottom Offer Banner */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700">Bottom Offer Banner</label>
                                        <p className="text-xs text-slate-500">Show a promotional banner above the footer link section.</p>
                                    </div>
                                    <button onClick={() => setSettings(p => ({...p, bottomOfferActive: !p.bottomOfferActive}))} className={`p-1 rounded-full transition-colors ${settings.bottomOfferActive ? 'text-green-500' : 'text-slate-300'}`}>
                                        {settings.bottomOfferActive ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                                    </button>
                                </div>

                                <div className={`space-y-4 pt-3 transition-opacity ${!settings.bottomOfferActive ? 'opacity-40 pointer-events-none' : ''}`}>
                                    <div>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Announcement Text</label>
                                        <input type="text" value={settings.bottomOfferText} onChange={e => setSettings(p => ({...p, bottomOfferText: e.target.value}))} placeholder="e.g., 🔥 Claim your daily reward now!" className="w-full border rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Button Label</label>
                                            <input type="text" value={settings.bottomOfferButtonLabel} onChange={e => setSettings(p => ({...p, bottomOfferButtonLabel: e.target.value}))} placeholder="e.g., Claim Now" className="w-full border rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase tracking-wider">Button Link</label>
                                            <input type="text" value={settings.bottomOfferButtonUrl} onChange={e => setSettings(p => ({...p, bottomOfferButtonUrl: e.target.value}))} placeholder="https://..." className="w-full border rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t flex justify-end">
                            <button onClick={handleSaveSettings} disabled={savingSettings} className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white text-sm font-semibold rounded-xl flex items-center gap-2 transition-colors">
                                {savingSettings ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Save Settings
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Video Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between px-5 py-4 border-b">
                            <h2 className="font-bold text-slate-800">{editingVideo ? 'Edit Tutorial' : 'New Tutorial'}</h2>
                            <button onClick={closeForm} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
                        </div>

                        <div className="p-5 overflow-y-auto space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Language Route</label>
                                <div className="flex gap-2">
                                    {(['english', 'hindi'] as Category[]).map(cat => (
                                        <button key={cat} onClick={() => setForm(p => ({...p, category: cat}))} className={`flex-1 py-2 rounded-lg text-sm font-semibold border ${form.category === cat ? 'bg-blue-50 border-blue-500 text-blue-700' : 'text-slate-500 border-slate-200'}`}>
                                            {CAT_LABELS[cat]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Title</label>
                                <input type="text" value={form.title} onChange={e => setForm(p => ({...p, title: e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm focus:border-blue-500" placeholder="e.g. How to deposit" />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Video Stream</label>
                                <div className="flex gap-2 items-start">
                                    <input type="text" value={form.videoUrl} onChange={e => setForm(p => ({...p, videoUrl: e.target.value}))} className="flex-1 border rounded-lg px-3 py-2 text-sm focus:border-blue-500 font-mono text-xs" placeholder="Video URL..." />
                                    <button onClick={() => triggerUpload('video')} disabled={uploading === 'video'} className="px-3 py-2 bg-slate-100 border text-slate-600 rounded-lg whitespace-nowrap text-sm font-semibold hover:bg-slate-200 flex items-center justify-center min-w-[90px]">
                                        {uploading === 'video' ? <Loader2 size={16} className="animate-spin" /> : 'Upload'}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Cover Thumbnail</label>
                                <div className="flex gap-2 items-start">
                                    <input type="text" value={form.thumbnailUrl} onChange={e => setForm(p => ({...p, thumbnailUrl: e.target.value}))} className="flex-1 border rounded-lg px-3 py-2 text-sm focus:border-blue-500 font-mono text-xs" placeholder="Image URL..." />
                                    <button onClick={() => triggerUpload('thumb')} disabled={uploading === 'thumb'} className="px-3 py-2 bg-slate-100 border text-slate-600 rounded-lg whitespace-nowrap text-sm font-semibold hover:bg-slate-200 flex items-center justify-center min-w-[90px]">
                                        {uploading === 'thumb' ? <Loader2 size={16} className="animate-spin" /> : 'Upload'}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Description (Optional)</label>
                                <textarea value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm focus:border-blue-500 h-20" placeholder="Short description..." />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">CTA Text</label>
                                    <input type="text" value={form.buttonLabel} onChange={e => setForm(p => ({...p, buttonLabel: e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm focus:border-blue-500" placeholder="e.g. Deposit Now" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">CTA URL</label>
                                    <input type="text" value={form.buttonUrl} onChange={e => setForm(p => ({...p, buttonUrl: e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm focus:border-blue-500" placeholder="https://..." />
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t flex justify-end gap-2 bg-slate-50">
                            <button onClick={closeForm} className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-200 rounded-lg text-sm text-sm">Cancel</button>
                            <button onClick={handleSaveVideo} disabled={savingVideo} className="px-5 py-2 font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-2 shadow-sm">
                                {savingVideo && <Loader2 size={14} className="animate-spin" />}
                                Save Tutorial
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
