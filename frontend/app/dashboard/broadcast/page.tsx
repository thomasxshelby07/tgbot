"use client";

import { useState } from "react";
import { Upload, Plus, Trash2, Send } from "lucide-react";
import Image from "next/image";
import axios from "axios";

interface Button {
    text: string;
    url: string;
}

export default function BroadcastPage() {
    const [message, setMessage] = useState("");
    const [mediaUrl, setMediaUrl] = useState("");
    const [buttons, setButtons] = useState<Button[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

    const [limit, setLimit] = useState<number>(0); // 0 = All users

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setStatus(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const res = await axios.post(`${apiUrl}/api/upload`, formData);
            setMediaUrl(res.data.url);
        } catch (error) {
            setStatus({ type: "error", message: "Error uploading image" });
        } finally {
            setUploading(false);
        }
    };

    const addButton = () => {
        setButtons([...buttons, { text: "", url: "" }]);
    };

    const removeButton = (index: number) => {
        setButtons(buttons.filter((_, i) => i !== index));
    };

    const updateButton = (index: number, key: keyof Button, value: string) => {
        const newButtons = [...buttons];
        newButtons[index][key] = value;
        setButtons(newButtons);
    };

    const handleBroadcast = async () => {
        if (!message) {
            setStatus({ type: "error", message: "Message cannot be empty" });
            return;
        }

        setLoading(true);
        setStatus(null);

        try {
            console.log("Sending broadcast request...");
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const res = await axios.post(`${apiUrl}/api/broadcast`, {
                message,
                mediaUrl,
                buttons: buttons.filter(b => b.text && b.url), // Filter empty buttons
                limit, // Send the selected limit
            });

            console.log("Broadcast success");
            setStatus({ type: "success", message: "Broadcast started successfully! Messages are being queued." });
            setMessage("");
            setMediaUrl("");
            setButtons([]);
        } catch (error: any) {
            console.error("Network Error during broadcast:", error);
            const errorMsg = error.response?.data?.error || error.message;
            setStatus({ type: "error", message: `Broadcast failed: ${errorMsg}` });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-10">
            <h1 className="text-3xl font-black mb-8 text-slate-900 tracking-tight px-2">Broadcast Message</h1>

            <div className="bg-white rounded-[32px] shadow-sm border border-slate-200 p-8 space-y-8 relative overflow-hidden group shadow-indigo-500/5">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/30 rounded-full -mr-32 -mt-32 blur-3xl transition-all group-hover:scale-110 duration-1000"></div>

                {/* Status Message */}
                {status && (
                    <div className={`p-4 rounded-2xl animate-in slide-in-from-top-2 duration-300 border ${status.type === "success" ? "bg-emerald-50 border-emerald-100 text-emerald-700" : "bg-rose-50 border-rose-100 text-rose-700"}`}>
                        <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${status.type === "success" ? "bg-emerald-500" : "bg-rose-500"}`}></div>
                            <span className="text-[13px] font-bold">{status.message}</span>
                        </div>
                    </div>
                )}

                {/* Message Input */}
                <div className="relative z-10">
                    <label className="block text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 mb-3 ml-1">Message Content / संदेश</label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={6}
                        className="w-full p-5 bg-slate-50 rounded-[24px] border border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all placeholder-slate-300 font-medium text-[15px] leading-relaxed shadow-inner"
                        placeholder="Type your professional broadcast message here... Markdown is supported."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                    {/* Image Upload */}
                    <div className="space-y-3">
                        <label className="block text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">Attach Media (Optional) / मीडिया</label>
                        <div className="flex flex-col gap-4">
                            <label className="cursor-pointer flex flex-col items-center justify-center gap-3 p-8 bg-slate-50 rounded-[28px] border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all group/upload relative overflow-hidden h-40">
                                <div className="p-3 bg-white rounded-xl shadow-sm text-slate-400 group-hover/upload:text-blue-500 transition-colors">
                                    <Upload size={24} />
                                </div>
                                <span className="text-[13px] font-bold text-slate-500">{uploading ? "Analyzing & Uploading..." : "Tap to Upload Photo"}</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleImageUpload}
                                    disabled={uploading}
                                />
                            </label>
                            {mediaUrl && (
                                <div className="relative w-full aspect-video rounded-[24px] overflow-hidden border border-slate-200 shadow-xl group/preview">
                                    <Image
                                        src={mediaUrl}
                                        alt="Preview"
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover/preview:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center">
                                        <button
                                            onClick={() => setMediaUrl("")}
                                            className="p-3 bg-white text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-2xl scale-125"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Target Audience Selector */}
                    <div className="space-y-4">
                        <div className="space-y-3">
                            <label className="block text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 ml-1">Delivery Limit / वितरण सीमा</label>
                            <select
                                value={limit}
                                onChange={(e) => setLimit(Number(e.target.value))}
                                className="w-full p-4 bg-slate-50 rounded-[20px] border border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all appearance-none cursor-pointer font-bold text-slate-700 text-[14px] shadow-sm"
                            >
                                <option value={0}>🚀 All Active Users (Full Reach)</option>
                                <option value={1}>🧪 Test Run (Latest 1 User)</option>
                                <option value={5}>Latest 5 Users</option>
                                <option value={10}>Latest 10 Users</option>
                                <option value={100}>Latest 100 Users</option>
                                <option value={500}>Latest 500 Users</option>
                                <option value={1000}>Latest 1000 Users</option>
                            </select>
                            <p className="text-[11px] text-slate-400 font-medium px-1 flex items-center gap-1.5 leading-relaxed">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                                Messages are queued for background processing (1,500/min).
                            </p>
                        </div>
                        
                        <div className="h-px w-full bg-slate-100 my-4"></div>

                        {/* Inline Buttons Summary */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between ml-1">
                                <label className="block text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">Interactive Buttons / बटन</label>
                                <button
                                    onClick={addButton}
                                    className="text-[11px] font-black uppercase tracking-wider text-blue-600 hover:scale-105 transition-all bg-blue-50 px-3 py-1 rounded-lg"
                                >
                                    + Add New
                                </button>
                            </div>

                            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                                {buttons.map((btn, index) => (
                                    <div key={index} className="flex gap-2 animate-in slide-in-from-right-4 duration-300">
                                        <input
                                            type="text"
                                            placeholder="Label"
                                            value={btn.text}
                                            onChange={(e) => updateButton(index, "text", e.target.value)}
                                            className="flex-1 p-2.5 bg-slate-50 rounded-xl border border-slate-100 focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-[12px] font-bold shadow-sm"
                                        />
                                        <input
                                            type="url"
                                            placeholder="https://..."
                                            value={btn.url}
                                            onChange={(e) => updateButton(index, "url", e.target.value)}
                                            className="flex-[2] p-2.5 bg-slate-50 rounded-xl border border-slate-100 focus:bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-[12px] font-medium font-mono shadow-sm"
                                        />
                                        <button
                                            onClick={() => removeButton(index)}
                                            className="p-2.5 text-rose-400 hover:bg-rose-50 hover:text-rose-500 rounded-xl transition-all"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                                {buttons.length === 0 && (
                                    <div className="py-4 border-2 border-dotted border-slate-100 rounded-xl flex items-center justify-center">
                                        <p className="text-[11px] text-slate-300 font-bold uppercase tracking-widest italic">No buttons configured</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit Action */}
                <div className="pt-8 relative z-10">
                    <button
                        onClick={handleBroadcast}
                        disabled={loading || uploading}
                        className={`w-full py-5 px-8 rounded-[24px] text-white font-black text-[14px] uppercase tracking-[0.2em] flex items-center justify-center gap-4 transition-all shadow-xl active:scale-95 ${loading || uploading
                            ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                            : "bg-slate-900 shadow-slate-900/10 hover:bg-black hover:shadow-slate-900/20"
                            }`}
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                                <span>Distributing...</span>
                            </>
                        ) : (
                            <>
                                <Send size={20} strokeWidth={2.5} />
                                <span>Initiate Global Broadcast</span>
                            </>
                        )}
                    </button>
                    <div className="mt-6 flex flex-col items-center gap-2">
                        <div className="px-4 py-1.5 bg-slate-50 rounded-full border border-slate-100 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Secure AES Delivery Protocol</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
