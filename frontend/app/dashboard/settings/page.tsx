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
            const res = await fetch(`${apiUrl}/api/settings/welcome`);
            if (res.ok) {
                const data = await res.json();
                setFormData({
                    welcomeMessage: data.message || "",
                    welcomeMessageMediaUrl: data.mediaUrl || "",
                    welcomeMessageButtons: data.buttons || []
                });
            }
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
            const res = await axios.post(`${apiUrl}/api/upload`, uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

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
            const res = await fetch(`${apiUrl}/api/settings/welcome`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: formData.welcomeMessage,
                    mediaUrl: formData.welcomeMessageMediaUrl,
                    buttons: formData.welcomeMessageButtons
                }),
            });

            if (res.ok) {
                alert("Settings saved successfully!");
            } else {
                alert("Failed to save settings");
            }
        } catch (error) {
            console.error("Error saving settings:", error);
            alert("Network error");
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

    if (loading) return <div className="p-8 text-center text-zinc-500">Loading settings...</div>;

    return (
        <div className="max-w-4xl mx-auto pb-20">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Bot Settings</h1>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 font-medium disabled:opacity-50"
                >
                    {saving ? (
                        <>
                            <Loader2 size={18} className="animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save size={18} />
                            Save Changes
                        </>
                    )}
                </button>
            </div>

            <div className="grid gap-8">
                {/* Welcome Message Section */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 shadow-sm">
                    <h2 className="text-xl font-semibold mb-4 text-zinc-800 dark:text-zinc-200">Welcome Message</h2>

                    {/* Media Upload */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">Welcome Image / Video (Optional)</label>
                        <div className="flex items-start gap-6">
                            {formData.welcomeMessageMediaUrl ? (
                                <div className="relative w-40 h-40 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden bg-zinc-50 dark:bg-zinc-800">
                                    <img
                                        src={formData.welcomeMessageMediaUrl}
                                        alt="Welcome Media"
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        onClick={() => setFormData(prev => ({ ...prev, welcomeMessageMediaUrl: "" }))}
                                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded hover:bg-red-600 transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <div className="w-40 h-40 rounded-lg border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex flex-col items-center justify-center text-zinc-400 gap-2 bg-zinc-50 dark:bg-zinc-800/50">
                                    <Upload size={24} />
                                    <span className="text-xs">No media</span>
                                </div>
                            )}

                            <div className="flex-1">
                                <input
                                    type="file"
                                    accept="image/*,video/*"
                                    onChange={handleFileUpload}
                                    className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                                />
                                <p className="mt-2 text-xs text-zinc-500">
                                    Supports Images and Videos. This media will be sent with the welcome caption.
                                </p>
                                <input
                                    type="text"
                                    readOnly
                                    value={formData.welcomeMessageMediaUrl}
                                    className="w-full mt-3 p-2 text-xs bg-gray-100 dark:bg-zinc-800 text-gray-500 rounded border border-gray-200 dark:border-zinc-700 font-mono"
                                    placeholder="Media URL will appear here..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Message Text */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2 text-zinc-700 dark:text-zinc-300">Message Text</label>
                        <textarea
                            value={formData.welcomeMessage}
                            onChange={(e) => setFormData(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                            rows={6}
                            className="w-full p-3 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-mono text-sm"
                            placeholder="Enter your welcome message here..."
                        />
                    </div>

                    {/* Inline Buttons */}
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">Inline Buttons (Optional)</label>
                            <button
                                onClick={addInlineButton}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                            >
                                <Plus size={16} /> Add Button
                            </button>
                        </div>

                        <div className="space-y-3">
                            {formData.welcomeMessageButtons.map((btn, idx) => (
                                <div key={idx} className="flex gap-3 items-center bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                    <span className="text-zinc-400 font-mono text-sm w-6">{idx + 1}.</span>
                                    <input
                                        placeholder="Button Text"
                                        value={btn.text}
                                        onChange={(e) => updateInlineButton(idx, 'text', e.target.value)}
                                        className="flex-1 p-2 bg-white dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 text-sm"
                                    />
                                    <input
                                        placeholder="URL (https://...)"
                                        value={btn.url}
                                        onChange={(e) => updateInlineButton(idx, 'url', e.target.value)}
                                        className="flex-1 p-2 bg-white dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 text-sm"
                                    />
                                    <button
                                        onClick={() => removeInlineButton(idx)}
                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded transition-colors"
                                        title="Remove Button"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                            {formData.welcomeMessageButtons.length === 0 && (
                                <div className="text-center py-8 border-2 border-dashed border-zinc-100 dark:border-zinc-800 rounded-lg text-zinc-400 text-sm">
                                    No buttons added yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
