"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Check, X, Upload, Save } from "lucide-react";
import Image from "next/image";
import axios from "axios";

interface InlineButton {
    text: string;
    url: string;
}

interface MenuButton {
    _id: string;
    text: string;
    order: number;
    active: boolean;
    responseMessage?: string;
    mediaUrl?: string;
    mediaType?: string;
    responseButtons?: InlineButton[];
}

export default function MenuPage() {
    const [buttons, setButtons] = useState<MenuButton[]>([]);
    const [loading, setLoading] = useState(true);

    // Edit/Create Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState<{
        text: string;
        order: number;
        responseMessage: string;
        mediaUrl: string;
        mediaType: string;
        responseButtons: InlineButton[];
    }>({
        text: "",
        order: 0,
        responseMessage: "",
        mediaUrl: "",
        mediaType: "",
        responseButtons: [],
    });

    const fetchButtons = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const res = await fetch(`${apiUrl}/api/menu`);
            if (res.ok) {
                const data = await res.json();
                setButtons(data);
            }
        } catch (error) {
            console.error("Error fetching menu buttons:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchButtons();
    }, []);

    const openCreateModal = () => {
        const maxOrder = buttons.length > 0 ? Math.max(...buttons.map(b => b.order)) : 0;
        setFormData({
            text: "",
            order: maxOrder + 1,
            responseMessage: "",
            mediaUrl: "",
            mediaType: "",
            responseButtons: [],
        });
        setEditingId(null);
        setIsModalOpen(true);
    };

    const openEditModal = (btn: MenuButton) => {
        setFormData({
            text: btn.text,
            order: btn.order,
            responseMessage: btn.responseMessage || "",
            mediaUrl: btn.mediaUrl || "",
            mediaType: btn.mediaType || "",
            responseButtons: btn.responseButtons || [],
        });
        setEditingId(btn._id);
        setIsModalOpen(true);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('image', file);

        console.log('Starting upload...', file.type);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const res = await axios.post(`${apiUrl}/api/upload`, uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            console.log('Upload success, URL:', res.data.url, 'mediaType:', res.data.mediaType);

            setFormData(prev => ({
                ...prev,
                mediaUrl: res.data.url,
                mediaType: res.data.mediaType || 'image',
            }));
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Media upload failed");
        }
    };

    const handleSave = async () => {
        if (!formData.text) return alert("Button name is required");

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const url = editingId
            ? `${apiUrl}/api/menu/${editingId}`
            : `${apiUrl}/api/menu`;

        const method = editingId ? "PUT" : "POST";

        try {
            console.log('Sending request:', { url, method, data: formData });
            console.log('Media URL being saved:', formData.mediaUrl);

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                const savedData = await res.json();
                console.log('Server response success:', savedData);
                setIsModalOpen(false);
                fetchButtons();
            } else {
                const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
                console.error('Server error:', errorData);
                alert(`Failed to save button: ${errorData.error || 'Unknown error'}\n${errorData.details || ''}`);
            }
        } catch (error) {
            console.error("Error saving:", error);
            alert(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this button?")) return;
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            await fetch(`${apiUrl}/api/menu/${id}`, { method: "DELETE" });
            fetchButtons();
        } catch (error) {
            console.error("Error deleting:", error);
        }
    };

    const handleToggle = async (id: string, currentActive: boolean) => {
        // Optimistic update
        const newButtons = buttons.map(b => b._id === id ? { ...b, active: !currentActive } : b);
        setButtons(newButtons);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            await fetch(`${apiUrl}/api/menu/${id}/toggle`, { method: "PATCH" });
        } catch (error) {
            fetchButtons(); // Revert on error
        }
    };



    // Helper to manage inline buttons in form
    const addInlineButton = () => {
        setFormData({
            ...formData,
            responseButtons: [...formData.responseButtons, { text: "", url: "" }]
        });
    };

    const updateInlineButton = (index: number, field: 'text' | 'url', value: string) => {
        const newButtons = [...formData.responseButtons];
        newButtons[index][field] = value;
        setFormData({ ...formData, responseButtons: newButtons });
    };

    const removeInlineButton = (index: number) => {
        const newButtons = formData.responseButtons.filter((_, i) => i !== index);
        setFormData({ ...formData, responseButtons: newButtons });
    };

    return (
        <div className="max-w-5xl mx-auto pb-20 bg-slate-50 min-h-screen">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-6 px-2">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">Menu Configuration</h1>
                    <p className="text-slate-500 font-medium mt-1">Design the interactive keyboard layout for your bot.</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-black text-white rounded-[24px] shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3 font-black text-[13px] uppercase tracking-widest transition-all active:scale-95"
                >
                    <Plus size={20} strokeWidth={3} />
                    <span>Create Trigger</span>
                </button>
            </div>

            {/* List */}
            <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm shadow-indigo-500/5">
                {loading ? (
                    <div className="p-20 text-center flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                        <span className="text-[13px] font-black uppercase tracking-widest text-slate-400">Syncing Menu...</span>
                    </div>
                ) : buttons.length === 0 ? (
                    <div className="p-24 text-center">
                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-200 mx-auto mb-6">
                            <Plus size={40} strokeWidth={1} />
                        </div>
                        <p className="text-[15px] font-bold text-slate-400">No active triggers found.</p>
                        <button onClick={openCreateModal} className="mt-4 text-blue-600 font-black text-xs uppercase tracking-widest hover:underline">Add your first button</button>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-50">
                        {buttons.sort((a, b) => a.order - b.order).map((btn) => (
                            <div key={btn._id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50/50 transition-all gap-6 group">
                                <div className="flex items-center gap-5">
                                    <span className="w-12 h-12 flex items-center justify-center bg-slate-50 rounded-2xl text-[14px] text-slate-400 font-black shadow-inner border border-slate-100 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-500">
                                        {String(btn.order).padStart(2, '0')}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-black text-slate-900 flex items-center gap-2 truncate text-[16px] tracking-tight">
                                            {btn.text}
                                            {btn.mediaUrl && (
                                                <div className={`p-1 rounded-lg ${btn.mediaType === 'video' ? 'bg-purple-50 text-purple-600' : btn.mediaType === 'audio' ? 'bg-orange-50 text-orange-600' : 'bg-cyan-50 text-cyan-600'}`}>
                                                    <Upload size={14} className="animate-pulse" />
                                                </div>
                                            )}
                                        </h3>
                                        <p className="text-[13px] font-medium text-slate-400 truncate max-w-[200px] sm:max-w-xs mt-1">
                                            {btn.responseMessage ? btn.responseMessage : "No voice/text response"}
                                            {btn.responseButtons && btn.responseButtons.length > 0 && (
                                                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-black text-[9px] uppercase tracking-tighter">
                                                    {btn.responseButtons.length} Call-to-actions
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center justify-end gap-3 shrink-0">
                                    <button
                                        onClick={() => handleToggle(btn._id, btn.active)}
                                        className={`px-4 py-2 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest border ${btn.active
                                            ? "text-emerald-600 bg-emerald-50 border-emerald-100 shadow-sm"
                                            : "text-slate-300 bg-slate-50 border-slate-100"}`}
                                        title="Toggle Status"
                                    >
                                        {btn.active ? "Enabled" : "Disabled"}
                                    </button>
                                    <div className="h-8 w-px bg-slate-100 mx-1 hidden sm:block"></div>
                                    <button
                                        onClick={() => openEditModal(btn)}
                                        className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all group/edit"
                                        title="Modify Configuration"
                                    >
                                        <Edit2 size={18} className="group-hover/edit:scale-110 transition-transform" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(btn._id)}
                                        className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all group/trash"
                                        title="Delete Asset"
                                    >
                                        <Trash2 size={18} className="group-hover/trash:scale-110 transition-transform" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{editingId ? "Edit Trigger" : "New Trigger"}</h2>
                                <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mt-1">Configure button-response logic</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-2xl transition-all hover:rotate-90">
                                <X size={20} strokeWidth={3} />
                            </button>
                        </div>

                        <div className="p-8 space-y-10 overflow-y-auto custom-scrollbar flex-1">
                            {/* Main Config */}
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-8">
                                <div className="sm:col-span-3">
                                    <label className="block text-[11px] font-black uppercase tracking-[0.2em] mb-3 text-slate-400 ml-1">Keyboard Label / बटन का नाम</label>
                                    <input
                                        type="text"
                                        value={formData.text}
                                        onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                                        className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all outline-none font-bold placeholder-slate-300 shadow-inner"
                                        placeholder="e.g. 💎 VIP ACCESS"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black uppercase tracking-[0.2em] mb-3 text-slate-400 ml-1">Sequence</label>
                                    <input
                                        type="number"
                                        value={formData.order}
                                        onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                                        className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 transition-all outline-none font-black text-blue-600 shadow-inner"
                                    />
                                </div>
                            </div>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                                <div className="relative flex justify-center uppercase tracking-widest text-[9px] font-black"><span className="bg-white px-4 text-slate-300">Logic Definition</span></div>
                            </div>

                            {/* Response Message */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-black text-[12px]">01</div>
                                    <h3 className="font-black text-slate-900 tracking-tight text-[15px]">Automated Response / उत्तर</h3>
                                </div>
                                <textarea
                                    value={formData.responseMessage}
                                    onChange={(e) => setFormData({ ...formData, responseMessage: e.target.value })}
                                    rows={5}
                                    className="w-full p-6 bg-slate-50 rounded-[28px] border border-slate-100 focus:bg-white focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-medium text-[14px] leading-relaxed shadow-inner placeholder-slate-300"
                                    placeholder="Type the message the bot should send..."
                                />
                                <div className="flex gap-4 px-2">
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">*Bold*</span>
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">_Italic_</span>
                                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">[Link](Url)</span>
                                </div>
                            </div>

                            {/* Media Upload */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-[12px]">02</div>
                                    <h3 className="font-black text-slate-900 tracking-tight text-[15px]">Rich Media Attachment / मीडिया</h3>
                                </div>
                                <div className="flex flex-col sm:flex-row items-start gap-6 p-6 bg-slate-50 rounded-[32px] border border-slate-100 shadow-inner">
                                    {formData.mediaUrl && (
                                        <div className="relative w-full sm:w-40 h-40 rounded-[24px] border border-slate-200 overflow-hidden bg-white shadow-lg group/preview shrink-0">
                                            {formData.mediaType === 'video' ? (
                                                <video src={formData.mediaUrl} className="w-full h-full object-cover" muted />
                                            ) : formData.mediaType === 'audio' ? (
                                                <div className="w-full h-full flex items-center justify-center bg-orange-50 text-orange-500"><Upload size={32} /></div>
                                            ) : (
                                                <img src={formData.mediaUrl} alt="Response" className="w-full h-full object-cover" />
                                            )}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center">
                                                <button
                                                    onClick={() => setFormData({ ...formData, mediaUrl: "", mediaType: "" })}
                                                    className="bg-white text-rose-500 p-2.5 rounded-xl shadow-2xl active:scale-90 transition-all"
                                                >
                                                    <X size={16} strokeWidth={3} />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    <div className="flex-1 w-full space-y-4">
                                        <input
                                            type="file"
                                            accept="image/*,video/mp4,video/webm,video/quicktime,audio/*"
                                            onChange={handleFileUpload}
                                            className="block w-full text-[13px] text-slate-500 file:mr-6 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-[11px] file:font-black file:uppercase file:bg-blue-600 file:text-white hover:file:bg-black cursor-pointer shadow-sm"
                                        />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 leading-relaxed px-1">Supports HD Images • 4K Video • Voice Notes • High Quality MP3</p>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                readOnly
                                                value={formData.mediaUrl}
                                                className="w-full p-3 pl-8 bg-white border border-slate-100 text-[10px] font-mono text-slate-400 rounded-lg shadow-sm truncate"
                                                placeholder="Media asset link..."
                                            />
                                            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-200"><Save size={12} /></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Inline Buttons */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-black text-[12px]">03</div>
                                        <h3 className="font-black text-slate-900 tracking-tight text-[15px]">Interactive Triggers / कॉल-टू-एक्शन</h3>
                                    </div>
                                    <button onClick={addInlineButton} className="px-4 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all hover:bg-blue-600 hover:text-white">
                                        + Add New
                                    </button>
                                </div>
                                <div className="grid gap-3">
                                    {formData.responseButtons.map((btn, idx) => (
                                        <div key={idx} className="flex flex-col sm:flex-row gap-3 items-center bg-white p-3 rounded-[20px] border border-slate-100 shadow-sm group/btn hover:shadow-md transition-all animate-in slide-in-from-right-4 duration-300">
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-300 border border-slate-50 shrink-0">
                                                {idx + 1}
                                            </div>
                                            <input
                                                placeholder="Label text..."
                                                value={btn.text}
                                                onChange={(e) => updateInlineButton(idx, 'text', e.target.value)}
                                                className="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-50 text-[13px] font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10"
                                            />
                                            <input
                                                placeholder="Destination URL..."
                                                value={btn.url}
                                                onChange={(e) => updateInlineButton(idx, 'url', e.target.value)}
                                                className="flex-[2] w-full p-3 bg-slate-50 rounded-xl border border-slate-50 text-[13px] font-medium font-mono text-slate-500 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/10"
                                            />
                                            <button onClick={() => removeInlineButton(idx)} className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                    {formData.responseButtons.length === 0 && (
                                        <div className="p-10 border-2 border-dotted border-slate-100 rounded-[28px] text-center">
                                            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-300 italic">No secondary actions configured</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border-t border-slate-50 bg-slate-50/10 flex flex-col sm:flex-row justify-end gap-4 sticky bottom-0 z-10">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-8 py-4 text-slate-400 font-black text-[11px] uppercase tracking-[0.2em] hover:text-slate-900 transition-all"
                            >
                                Discard Changes
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-10 py-4 bg-slate-900 hover:bg-black text-white rounded-[20px] shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3 font-black text-[13px] uppercase tracking-widest transition-all active:scale-95"
                            >
                                <Save size={18} strokeWidth={2.5} />
                                <span>Deploy Configuration</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
