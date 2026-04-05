'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
    Plus, Video, Trash2, Edit3, Eye, EyeOff, Save, X, 
    Upload, Link2, Type, AlignLeft, ExternalLink, Loader2,
    GripVertical, CheckCircle2, AlertCircle
} from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface HelpVideo {
    _id: string;
    title: string;
    description: string;
    videoUrl: string;
    buttonLabel: string;
    buttonUrl: string;
    order: number;
    isActive: boolean;
    createdAt: string;
}

interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error';
}

const emptyForm = {
    title: '',
    description: '',
    videoUrl: '',
    buttonLabel: '',
    buttonUrl: '',
};

export default function DfxHelpAdminPage() {
    const [videos, setVideos] = useState<HelpVideo[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingVideo, setEditingVideo] = useState<HelpVideo | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toasts, setToasts] = useState<Toast[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    let toastId = useRef(0);

    const addToast = (message: string, type: 'success' | 'error') => {
        const id = ++toastId.current;
        setToasts(p => [...p, { id, message, type }]);
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
    };

    const fetchVideos = async () => {
        try {
            const res = await axios.get(`${API}/api/dfxhelp/admin`);
            setVideos(res.data.videos);
        } catch {
            addToast('Failed to load videos', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchVideos(); }, []);

    const openCreate = () => {
        setEditingVideo(null);
        setForm(emptyForm);
        setShowForm(true);
    };

    const openEdit = (v: HelpVideo) => {
        setEditingVideo(v);
        setForm({
            title: v.title,
            description: v.description,
            videoUrl: v.videoUrl,
            buttonLabel: v.buttonLabel,
            buttonUrl: v.buttonUrl,
        });
        setShowForm(true);
    };

    const closeForm = () => {
        setShowForm(false);
        setEditingVideo(null);
        setForm(emptyForm);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await axios.post(`${API}/api/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setForm(p => ({ ...p, videoUrl: res.data.url }));
            addToast('Video uploaded successfully!', 'success');
        } catch {
            addToast('Video upload failed', 'error');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSave = async () => {
        if (!form.title.trim() || !form.videoUrl.trim()) {
            addToast('Title and video are required', 'error');
            return;
        }
        setSaving(true);
        try {
            if (editingVideo) {
                await axios.put(`${API}/api/dfxhelp/${editingVideo._id}`, form);
                addToast('Video updated!', 'success');
            } else {
                await axios.post(`${API}/api/dfxhelp`, form);
                addToast('Video added!', 'success');
            }
            closeForm();
            fetchVideos();
        } catch {
            addToast('Save failed', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleToggle = async (v: HelpVideo) => {
        try {
            await axios.patch(`${API}/api/dfxhelp/${v._id}/toggle`);
            addToast(`Video ${v.isActive ? 'hidden' : 'shown'} on public page`, 'success');
            fetchVideos();
        } catch {
            addToast('Toggle failed', 'error');
        }
    };

    const handleDelete = async (v: HelpVideo) => {
        if (!confirm(`Delete "${v.title}"? This cannot be undone.`)) return;
        try {
            await axios.delete(`${API}/api/dfxhelp/${v._id}`);
            addToast('Video deleted', 'success');
            fetchVideos();
        } catch {
            addToast('Delete failed', 'error');
        }
    };

    return (
        <div className="min-h-screen" style={{ background: 'var(--bg-page, #f8fafc)' }}>
            {/* Toast Notifications */}
            <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
                {toasts.map(t => (
                    <div
                        key={t.id}
                        className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold shadow-lg animate-fade-in-down"
                        style={{
                            background: t.type === 'success' ? '#dcfce7' : '#fee2e2',
                            color: t.type === 'success' ? '#166534' : '#991b1b',
                            border: `1px solid ${t.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
                        }}
                    >
                        {t.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                        {t.message}
                    </div>
                ))}
            </div>

            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <Video size={26} className="text-blue-600" />
                        DFX Help Videos
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">
                        Manage help videos shown on the public DFX Help page
                    </p>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-600/20 transition-all"
                >
                    <Plus size={18} /> Add Video
                </button>
            </div>

            {/* Video List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 size={28} className="animate-spin text-blue-500" />
                </div>
            ) : videos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <Video size={48} className="mb-3 opacity-30" />
                    <p className="font-medium">No videos yet</p>
                    <p className="text-sm mt-1">Click "Add Video" to get started</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {videos.map((v) => (
                        <div
                            key={v._id}
                            className={`bg-white rounded-2xl border shadow-sm p-5 flex gap-4 transition-all ${
                                v.isActive ? 'border-slate-200' : 'border-slate-100 opacity-60'
                            }`}
                        >
                            {/* Video Thumbnail */}
                            <div className="w-32 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0 flex items-center justify-center">
                                <video
                                    src={v.videoUrl}
                                    className="w-full h-full object-cover"
                                    muted
                                    preload="metadata"
                                />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold text-slate-900 truncate">{v.title}</h3>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                        v.isActive 
                                            ? 'bg-green-100 text-green-700' 
                                            : 'bg-slate-100 text-slate-500'
                                    }`}>
                                        {v.isActive ? 'LIVE' : 'HIDDEN'}
                                    </span>
                                </div>
                                {v.description && (
                                    <p className="text-slate-500 text-sm line-clamp-2 mb-2">{v.description}</p>
                                )}
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
                                <button
                                    onClick={() => handleToggle(v)}
                                    title={v.isActive ? 'Hide from public' : 'Show on public'}
                                    className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                                >
                                    {v.isActive ? <Eye size={16} /> : <EyeOff size={16} />}
                                </button>
                                <button
                                    onClick={() => openEdit(v)}
                                    className="p-2 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                                >
                                    <Edit3 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(v)}
                                    className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add / Edit Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                            <h2 className="font-bold text-slate-900 text-lg">
                                {editingVideo ? 'Edit Video' : 'Add New Video'}
                            </h2>
                            <button onClick={closeForm} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Title */}
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                                    <Type size={13} /> Title
                                </label>
                                <input
                                    id="help-video-title"
                                    type="text"
                                    value={form.title}
                                    onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                                    placeholder="e.g. How to use DFX"
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                                    <AlignLeft size={13} /> Description
                                </label>
                                <textarea
                                    id="help-video-description"
                                    value={form.description}
                                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                    placeholder="Short description for this video..."
                                    rows={3}
                                    className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-slate-50 resize-none"
                                />
                            </div>

                            {/* Video Upload */}
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                                    <Video size={13} /> Video
                                </label>
                                {form.videoUrl ? (
                                    <div className="relative rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                                        <video
                                            src={form.videoUrl}
                                            controls
                                            className="w-full max-h-40 object-contain"
                                        />
                                        <button
                                            onClick={() => setForm(p => ({ ...p, videoUrl: '' }))}
                                            className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-lg hover:bg-red-600 transition-colors"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploading}
                                            className="w-full border-2 border-dashed border-slate-200 rounded-xl py-8 flex flex-col items-center gap-2 text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-all"
                                        >
                                            {uploading ? (
                                                <Loader2 size={24} className="animate-spin" />
                                            ) : (
                                                <Upload size={24} />
                                            )}
                                            <span className="text-sm font-medium">
                                                {uploading ? 'Uploading to Cloudinary...' : 'Click to upload video'}
                                            </span>
                                            <span className="text-xs">MP4, WebM, MOV supported</span>
                                        </button>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="video/*"
                                            className="hidden"
                                            onChange={handleFileUpload}
                                        />
                                        <div className="mt-2">
                                            <p className="text-xs text-slate-400 mb-1">Or paste Cloudinary URL directly:</p>
                                            <input
                                                type="text"
                                                value={form.videoUrl}
                                                onChange={e => setForm(p => ({ ...p, videoUrl: e.target.value }))}
                                                placeholder="https://res.cloudinary.com/..."
                                                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Button */}
                            <div>
                                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
                                    <Link2 size={13} /> Action Button (Optional)
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        id="help-video-btn-label"
                                        type="text"
                                        value={form.buttonLabel}
                                        onChange={e => setForm(p => ({ ...p, buttonLabel: e.target.value }))}
                                        placeholder="Button Text"
                                        className="border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                                    />
                                    <input
                                        id="help-video-btn-url"
                                        type="text"
                                        value={form.buttonUrl}
                                        onChange={e => setForm(p => ({ ...p, buttonUrl: e.target.value }))}
                                        placeholder="https://..."
                                        className="border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={closeForm}
                                    className="flex-1 py-3 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving || uploading}
                                    id="help-video-save"
                                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                                >
                                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    {saving ? 'Saving...' : 'Save Video'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                @keyframes fade-in-down {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in-down {
                    animation: fade-in-down 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}
