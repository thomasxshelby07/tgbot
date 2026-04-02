"use client";

import { useState, useEffect } from "react";
import { Save, Upload, Plus, Trash2, X, Loader2 } from "lucide-react";
import axios from "axios";

interface InlineButton {
    text: string;
    url: string;
}

interface SettingsData {
    welcomeMessage: string;
    welcomeMessageMediaUrl: string;
    welcomeMessageButtons: InlineButton[];
}

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState<SettingsData>({
        welcomeMessage: "",
        welcomeMessageMediaUrl: "",
        welcomeMessageButtons: []
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const res = await axios.get(`${apiUrl}/api/settings/welcome`);
            const data = res.data;
            setFormData({
                welcomeMessage: data.message || "",
                welcomeMessageMediaUrl: data.mediaUrl || "",
                welcomeMessageButtons: data.buttons || []
            });
        } catch (error) {
            console.error("Error fetching settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('image', file);
        setSaving(true);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const res = await axios.post(`${apiUrl}/api/upload`, uploadData);

            setFormData(prev => ({
                ...prev,
                welcomeMessageMediaUrl: res.data.url
            }));
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Image upload failed");
        } finally {
            setSaving(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            await axios.post(`${apiUrl}/api/settings/welcome`, {
                message: formData.welcomeMessage,
                mediaUrl: formData.welcomeMessageMediaUrl,
                buttons: formData.welcomeMessageButtons
            });

            alert("Settings saved successfully!");
        } catch (error) {
            console.error("Error saving settings:", error);
            alert("Failed to save settings. Is the server running?");
        } finally {
            setSaving(false);
        }
    };

    const addInlineButton = () => {
        setFormData(prev => ({
            ...prev,
            welcomeMessageButtons: [...prev.welcomeMessageButtons, { text: "", url: "" }]
        }));
    };

    const updateInlineButton = (index: number, field: 'text' | 'url', value: string) => {
        const newButtons = [...formData.welcomeMessageButtons];
        newButtons[index][field] = value;
        setFormData(prev => ({ ...prev, welcomeMessageButtons: newButtons }));
    };

    const removeInlineButton = (index: number) => {
        setFormData(prev => ({
            ...prev,
            welcomeMessageButtons: prev.welcomeMessageButtons.filter((_, i) => i !== index)
        }));
    };

    if (loading) return <div className="p-20 text-center flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
        <span className="text-[13px] font-black uppercase tracking-widest text-slate-400">Loading Configuration...</span>
    </div>;

    return (
        <div className="max-w-4xl mx-auto pb-20 bg-slate-50 min-h-screen">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4 px-2">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">Bot Configuration</h1>
                    <p className="text-slate-500 font-medium mt-1">Configure global bot behavior and automation.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-black text-white rounded-[20px] flex items-center justify-center gap-3 font-black text-[13px] uppercase tracking-widest disabled:opacity-50 shadow-xl shadow-slate-900/10 transition-all active:scale-95"
                >
                    {saving ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            <span>Optimizing...</span>
                        </>
                    ) : (
                        <>
                            <Save size={18} strokeWidth={2.5} />
                            <span>Deploy Changes</span>
                        </>
                    )}
                </button>
            </div>

            <div className="grid gap-10">
                {/* Welcome Message Section */}
                <div className="bg-white rounded-[32px] border border-slate-200 p-8 shadow-sm shadow-indigo-500/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/50 rounded-full -mr-32 -mt-32 blur-3xl transition-all group-hover:scale-110 duration-1000"></div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100">
                                <Plus size={20} strokeWidth={3} />
                            </div>
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">Welcome Automation / स्वागत संदेश</h2>
                        </div>

                        {/* Media Upload */}
                        <div className="mb-8">
                            <label className="block text-[11px] font-black uppercase tracking-[0.2em] mb-4 text-slate-400 ml-1">Media Asset (Photo/Video)</label>
                            <div className="flex flex-col md:flex-row items-start gap-8">
                                {formData.welcomeMessageMediaUrl ? (
                                    <div className="relative w-full md:w-56 h-56 md:h-48 rounded-[24px] border border-slate-200 overflow-hidden bg-slate-50 shadow-lg group/media">
                                        <img
                                            src={formData.welcomeMessageMediaUrl}
                                            alt="Welcome Media"
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover/media:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                                onClick={() => setFormData(prev => ({ ...prev, welcomeMessageMediaUrl: "" }))}
                                                className="bg-white text-rose-500 p-3 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-2xl scale-125"
                                            >
                                                <X size={20} strokeWidth={3} />
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="w-full md:w-48 h-48 rounded-[24px] border-4 border-dotted border-slate-100 flex flex-col items-center justify-center text-slate-300 gap-3 bg-slate-50 relative group/empty">
                                        <Upload size={32} strokeWidth={1} className="group-hover/empty:text-blue-400 transition-colors" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">No Media Attached</span>
                                    </div>
                                )}

                                <div className="flex-1 w-full space-y-4">
                                    <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100 shadow-inner">
                                        <input
                                            type="file"
                                            accept="image/*,video/*"
                                            onChange={handleFileUpload}
                                            className="block w-full text-[13px] text-slate-500 file:mr-6 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-[11px] file:font-black file:uppercase file:tracking-widest file:bg-blue-600 file:text-white hover:file:bg-black file:transition-all cursor-pointer"
                                        />
                                        <p className="mt-4 text-[11px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                            High resolution assets recommended
                                        </p>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.welcomeMessageMediaUrl}
                                            className="w-full p-4 pl-10 text-[11px] bg-white text-slate-400 rounded-xl border border-slate-100 font-mono tracking-tighter shadow-sm overflow-hidden text-ellipsis"
                                            placeholder="Asset deep link will appear here..."
                                        />
                                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300">
                                            <Save size={14} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Message Text */}
                        <div className="mb-8">
                            <label className="block text-[11px] font-black uppercase tracking-[0.2em] mb-3 text-slate-400 ml-1">Caption / मुख्य संदेश</label>
                            <textarea
                                value={formData.welcomeMessage}
                                onChange={(e) => setFormData(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                                rows={8}
                                className="w-full p-6 bg-slate-50 rounded-[28px] border border-slate-100 focus:bg-white focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-medium text-[15px] leading-relaxed shadow-inner placeholder-slate-300"
                                placeholder="Enter the text your users see the first time they interact with the bot..."
                            />
                        </div>

                        {/* Inline Buttons */}
                        <div className="border-t border-slate-50 pt-8">
                            <div className="flex justify-between items-center mb-6">
                                <label className="block text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Interactive Triggers / बटन</label>
                                <button
                                    onClick={addInlineButton}
                                    className="text-[11px] font-black uppercase tracking-wider text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all px-4 py-1.5 rounded-lg border border-blue-100"
                                >
                                    + Add Trigger
                                </button>
                            </div>

                            <div className="grid gap-3">
                                {formData.welcomeMessageButtons.map((btn, idx) => (
                                    <div key={idx} className="flex flex-col sm:flex-row gap-3 items-center bg-white p-2 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md animate-in slide-in-from-right-4 duration-300">
                                        <div className="flex items-center gap-3 w-full sm:w-auto flex-1">
                                            <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[10px] font-black text-slate-400 border border-slate-100">
                                                {idx + 1}
                                            </div>
                                            <input
                                                placeholder="Label Text"
                                                value={btn.text}
                                                onChange={(e) => updateInlineButton(idx, 'text', e.target.value)}
                                                className="flex-1 p-3 bg-slate-50 rounded-xl border border-slate-50 text-[13px] font-bold text-slate-700 focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                                            />
                                        </div>
                                        <input
                                            placeholder="Destination URL (https://...)"
                                            value={btn.url}
                                            onChange={(e) => updateInlineButton(idx, 'url', e.target.value)}
                                            className="flex-[2] w-full p-3 bg-slate-50 rounded-xl border border-slate-50 text-[13px] font-medium font-mono text-slate-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none shadow-inner"
                                        />
                                        <button
                                            onClick={() => removeInlineButton(idx)}
                                            className="p-3 text-rose-400 hover:bg-rose-50 hover:text-rose-500 rounded-xl transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                                {formData.welcomeMessageButtons.length === 0 && (
                                    <div className="text-center py-12 border-2 border-dotted border-slate-100 rounded-[24px] bg-slate-50/50">
                                        <p className="text-[11px] text-slate-300 font-bold uppercase tracking-[0.2em] italic">No active triggers configured</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
