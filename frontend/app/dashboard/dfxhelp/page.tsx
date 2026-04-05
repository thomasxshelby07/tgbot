'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    Plus, Video, Trash2, Edit3, Eye, EyeOff, Save, X,
    Upload, Link2, Type, AlignLeft, ExternalLink, Loader2,
    CheckCircle2, AlertCircle, Image as ImageIcon, Globe, Languages
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
    const [videos, setVideos] = useState<HelpVideo[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterCat, setFilterCat] = useState<'all' | Category>('all');
    const [showForm, setShowForm] = useState(false);
    const [editingVideo, setEditingVideo] = useState<HelpVideo | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [uploadingVideo, setUploadingVideo] = useState(false);
    const [uploadingThumb, setUploadingThumb] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const videoFileRef = useRef<HTMLInputElement>(null);
    const thumbFileRef = useRef<HTMLInputElement>(null);
    const toastId = useRef(0);

    const addToast = (message: string, type: 'success' | 'error') => {
        const id = ++toastId.current;
        setToasts(p => [...p, { id, message, type }]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
    };

    const fetchVideos = async () => {
        try {
            const res = await axios.get(`${API}/api/dfxhelp/admin`);
            setVideos(res.data.videos);
        } catch { addToast('Failed to load videos', 'error'); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchVideos(); }, []);

    const openCreate = () => { setEditingVideo(null); setForm(emptyForm); setShowForm(true); };
    const openEdit = (v: HelpVideo) => {
        setEditingVideo(v);
        setForm({ title: v.title, description: v.description, videoUrl: v.videoUrl, thumbnailUrl: v.thumbnailUrl || '', category: v.category || 'english', buttonLabel: v.buttonLabel, buttonUrl: v.buttonUrl });
        setShowForm(true);
    };
    const closeForm = () => { setShowForm(false); setEditingVideo(null); setForm(emptyForm); };

    const handleUpload = async (file: File, type: 'video' | 'thumb') => {
        if (type === 'video') setUploadingVideo(true); else setUploadingThumb(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            const res = await axios.post(`${API}/api/upload`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            if (type === 'video') setForm(p => ({ ...p, videoUrl: res.data.url }));
            else setForm(p => ({ ...p, thumbnailUrl: res.data.url }));
            addToast(`${type === 'video' ? 'Video' : 'Thumbnail'} uploaded!`, 'success');
        } catch { addToast('Upload failed', 'error'); }
        finally { if (type === 'video') setUploadingVideo(false); else setUploadingThumb(false); }
    };

    const handleSave = async () => {
        if (!form.title.trim() || !form.videoUrl.trim()) { addToast('Title and video are required', 'error'); return; }
        setSaving(true);
        try {
            if (editingVideo) { await axios.put(`${API}/api/dfxhelp/${editingVideo._id}`, form); addToast('Video updated!', 'success'); }
            else { await axios.post(`${API}/api/dfxhelp`, form); addToast('Video added!', 'success'); }
            closeForm(); fetchVideos();
        } catch { addToast('Save failed', 'error'); }
        finally { setSaving(false); }
    };

    const handleToggle = async (v: HelpVideo) => {
        try { await axios.patch(`${API}/api/dfxhelp/${v._id}/toggle`); addToast(`Video ${v.isActive ? 'hidden' : 'shown'}`, 'success'); fetchVideos(); }
        catch { addToast('Toggle failed', 'error'); }
    };

    const handleDelete = async (v: HelpVideo) => {
        if (!confirm(`Delete "${v.title}"?`)) return;
        try { await axios.delete(`${API}/api/dfxhelp/${v._id}`); addToast('Deleted', 'success'); fetchVideos(); }
        catch { addToast('Delete failed', 'error'); }
    };

    const filtered = filterCat === 'all' ? videos : videos.filter(v => v.category === filterCat);

    return (
        <div className="min-h-screen" style={{ background: '#f8fafc' }}>
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

            {/* Header */}
            <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <Video size={24} className="text-blue-600" /> DFX Help Videos
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Manage videos shown on the public DFX Help page</p>
                </div>
                <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-600/20 transition-all">
                    <Plus size={17} /> Add Video
                </button>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 mb-5 flex-wrap">
                {(['all', 'english', 'hindi'] as const).map(cat => (
                    <button key={cat} onClick={() => setFilterCat(cat)}
                        className={`px-4 py-2 text-sm font-semibold rounded-lg border transition-all ${filterCat === cat ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'}`}>
                        {cat === 'all' ? `All (${videos.length})` : cat === 'english' ? `🌐 English (${videos.filter(v => v.category === 'english').length})` : `🇮🇳 Hindi (${videos.filter(v => v.category === 'hindi').length})`}
                    </button>
                ))}
            </div>

            {/* Video List */}
            {loading ? (
                <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-blue-500" /></div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Video size={48} className="mb-3 opacity-30" />
                    <p className="font-medium">No videos</p>
                    <p className="text-sm mt-1">Add a video to get started</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filtered.map(v => (
                        <div key={v._id} className={`bg-white rounded-2xl border shadow-sm p-5 flex gap-4 transition-all ${v.isActive ? 'border-slate-200' : 'border-slate-100 opacity-60'}`}>
                            {/* Thumbnail / Video Preview */}
                            <div className="w-36 h-22 rounded-xl overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center relative" style={{ minHeight: 80 }}>
                                {v.thumbnailUrl ? (
                                    <img src={v.thumbnailUrl} alt={v.title} className="w-full h-full object-cover" />
                                ) : (
                                    <video src={v.videoUrl} className="w-full h-full object-cover" muted preload="metadata" />
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                    <h3 className="font-bold text-slate-900 truncate">{v.title}</h3>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${v.isActive ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {v.isActive ? 'LIVE' : 'HIDDEN'}
                                    </span>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${v.category === 'hindi' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                        {CAT_LABELS[v.category] || 'English'}
                                    </span>
                                </div>
                                {v.description && <p className="text-slate-500 text-sm line-clamp-2 mb-2">{v.description}</p>}
                                {v.buttonLabel && (
                                    <div className="flex items-center gap-1 text-xs text-blue-600">
                                        <ExternalLink size={12} />
                                        <span className="font-medium">{v.buttonLabel}</span>
                                        <span className="text-slate-400">→ {v.buttonUrl}</span>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 shrink-0">
                                <button onClick={() => handleToggle(v)} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
                                    {v.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                                </button>
                                <button onClick={() => openEdit(v)} className="p-2 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors">
                                    <Edit3 size={16} />
                                </button>
                                <button onClick={() => handleDelete(v)} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                            <h2 className="font-bold text-slate-900 text-lg">{editingVideo ? 'Edit Video' : 'Add New Video'}</h2>
                            <button onClick={closeForm} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"><X size={18} /></button>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Category */}
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                                    <Languages size={13} /> Category
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    {(['english', 'hindi'] as Category[]).map(cat => (
                                        <button key={cat} type="button" onClick={() => setForm(p => ({ ...p, category: cat }))}
                                            className={`py-3 px-4 border-2 font-semibold text-sm transition-all rounded-xl ${form.category === cat ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}>
                                            {CAT_LABELS[cat]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Title */}
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2"><Type size={13} /> Title</label>
                                <input id="help-video-title" type="text" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                    placeholder="e.g. How to Withdraw on DFX"
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2"><AlignLeft size={13} /> Description</label>
                                <textarea id="help-video-description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                    placeholder="Short description..." rows={3}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 resize-none" />
                            </div>

                            {/* Video Upload */}
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2"><Video size={13} /> Video</label>
                                {form.videoUrl ? (
                                    <div className="relative rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                                        <video src={form.videoUrl} controls className="w-full max-h-40 object-contain" />
                                        <button onClick={() => setForm(p => ({ ...p, videoUrl: '' }))} className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg hover:bg-red-600">
                                            <X size={12} />
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <button onClick={() => videoFileRef.current?.click()} disabled={uploadingVideo}
                                            className="w-full border-2 border-dashed border-slate-200 rounded-xl py-7 flex flex-col items-center gap-2 text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all">
                                            {uploadingVideo ? <Loader2 size={22} className="animate-spin" /> : <Upload size={22} />}
                                            <span className="text-sm font-medium">{uploadingVideo ? 'Uploading to Cloudinary...' : 'Click to upload video'}</span>
                                            <span className="text-xs">MP4, WebM, MOV</span>
                                        </button>
                                        <input ref={videoFileRef} type="file" accept="video/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f, 'video'); e.target.value = ''; }} />
                                        <div className="mt-2">
                                            <p className="text-xs text-slate-400 mb-1">Or paste Cloudinary URL:</p>
                                            <input type="text" value={form.videoUrl} onChange={e => setForm(p => ({ ...p, videoUrl: e.target.value }))}
                                                placeholder="https://res.cloudinary.com/..." className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Thumbnail Upload */}
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2"><ImageIcon size={13} /> Thumbnail (Optional)</label>
                                {form.thumbnailUrl ? (
                                    <div className="relative rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center" style={{ height: 120 }}>
                                        <img src={form.thumbnailUrl} alt="thumb" className="h-full object-contain" />
                                        <button onClick={() => setForm(p => ({ ...p, thumbnailUrl: '' }))} className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg hover:bg-red-600">
                                            <X size={12} />
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <button onClick={() => thumbFileRef.current?.click()} disabled={uploadingThumb}
                                            className="w-full border-2 border-dashed border-slate-200 rounded-xl py-5 flex flex-col items-center gap-2 text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all">
                                            {uploadingThumb ? <Loader2 size={20} className="animate-spin" /> : <ImageIcon size={20} />}
                                            <span className="text-sm font-medium">{uploadingThumb ? 'Uploading thumbnail...' : 'Click to upload thumbnail'}</span>
                                            <span className="text-xs">JPEG, PNG, WebP</span>
                                        </button>
                                        <input ref={thumbFileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f, 'thumb'); e.target.value = ''; }} />
                                        <div className="mt-2">
                                            <p className="text-xs text-slate-400 mb-1">Or paste image URL:</p>
                                            <input type="text" value={form.thumbnailUrl} onChange={e => setForm(p => ({ ...p, thumbnailUrl: e.target.value }))}
                                                placeholder="https://res.cloudinary.com/..." className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Button */}
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2"><Link2 size={13} /> Action Button (Optional)</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <input id="help-video-btn-label" type="text" value={form.buttonLabel} onChange={e => setForm(p => ({ ...p, buttonLabel: e.target.value }))}
                                        placeholder="Button Text" className="border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" />
                                    <input id="help-video-btn-url" type="text" value={form.buttonUrl} onChange={e => setForm(p => ({ ...p, buttonUrl: e.target.value }))}
                                        placeholder="https://..." className="border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50" />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button onClick={closeForm} className="flex-1 py-3 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors">Cancel</button>
                                <button onClick={handleSave} disabled={saving || uploadingVideo || uploadingThumb} id="help-video-save"
                                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    {saving ? 'Saving...' : 'Save Video'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
