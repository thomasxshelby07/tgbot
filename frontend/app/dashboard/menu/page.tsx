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
        responseButtons: InlineButton[];
    }>({
        text: "",
        order: 0,
        responseMessage: "",
        mediaUrl: "",
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

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const res = await axios.post(`${apiUrl}/api/upload`, uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setFormData({ ...formData, mediaUrl: res.data.url });
        } catch (error) {
            console.error("Upload failed:", error);
            alert("Image upload failed");
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
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
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
        <div className="max-w-5xl mx-auto pb-20">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">Menu Configuration</h1>
                <button
                    onClick={openCreateModal}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2"
                >
                    <Plus size={20} />
                    <span>New Menu Button</span>
                </button>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-zinc-500">Loading buttons...</div>
                ) : buttons.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500">No buttons found. Create one to get started.</div>
                ) : (
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {buttons.sort((a, b) => a.order - b.order).map((btn) => (
                            <div key={btn._id} className="p-4 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <span className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-zinc-800 rounded text-sm text-zinc-500 font-mono">
                                        {btn.order}
                                    </span>
                                    <div>
                                        <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{btn.text}</h3>
                                        <p className="text-sm text-zinc-500 truncate max-w-sm">
                                            {btn.responseMessage ? `Response: ${btn.responseMessage.substring(0, 30)}...` : "No text response"}
                                            {btn.responseButtons && btn.responseButtons.length > 0 && ` • 🔘 ${btn.responseButtons.length} Buttons`}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleToggle(btn._id, btn.active)}
                                        className={`p-2 rounded-lg transition-colors ${btn.active
                                            ? "text-green-500 bg-green-50 dark:bg-green-900/10"
                                            : "text-zinc-400 bg-zinc-100 dark:bg-zinc-800"}`}
                                        title="Toggle Status"
                                    >
                                        {btn.active ? <Check size={18} /> : <X size={18} />}
                                    </button>
                                    <button
                                        onClick={() => openEditModal(btn)}
                                        className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 rounded-lg transition-colors"
                                        title="Edit"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(btn._id)}
                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center sticky top-0 bg-white dark:bg-zinc-900 z-10">
                            <h2 className="text-xl font-bold">{editingId ? "Edit Button" : "Create Button"}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Main Config */}
                            <div className="grid grid-cols-4 gap-4">
                                <div className="col-span-3">
                                    <label className="block text-sm font-medium mb-1">Button Label (Keyboard)</label>
                                    <input
                                        type="text"
                                        value={formData.text}
                                        onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                                        className="w-full p-2 bg-zinc-50 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700"
                                        placeholder="e.g. VIP Plan"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Order</label>
                                    <input
                                        type="number"
                                        value={formData.order}
                                        onChange={(e) => setFormData({ ...formData, order: Number(e.target.value) })}
                                        className="w-full p-2 bg-zinc-50 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700"
                                    />
                                </div>
                            </div>

                            <hr className="border-zinc-200 dark:border-zinc-800" />

                            <h3 className="font-semibold text-lg text-blue-500">Bot Response Configuration</h3>
                            <p className="text-sm text-zinc-500 -mt-4 mb-4">What should the bot send when this button is clicked?</p>

                            {/* Response Message */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Response Message</label>
                                <textarea
                                    value={formData.responseMessage}
                                    onChange={(e) => setFormData({ ...formData, responseMessage: e.target.value })}
                                    rows={4}
                                    className="w-full p-2 bg-zinc-50 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 font-mono text-sm"
                                    placeholder="Type the message here..."
                                />
                            </div>

                            {/* Image Upload */}
                            <div>
                                <label className="block text-sm font-medium mb-1">Response Image (Optional)</label>
                                <div className="flex items-center gap-4">
                                    {formData.mediaUrl && (
                                        <div className="relative w-20 h-20 rounded border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                                            <img src={formData.mediaUrl} alt="Response" className="w-full h-full object-cover" />
                                            <button
                                                onClick={() => setFormData({ ...formData, mediaUrl: "" })}
                                                className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl text-xs"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        className="block w-full text-sm text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                </div>
                            </div>



                            {/* Inline Buttons */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-sm font-medium">Response Inline Buttons</label>
                                    <button onClick={addInlineButton} className="text-xs text-blue-500 hover:underline flex items-center gap-1">
                                        <Plus size={14} /> Add Button
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {formData.responseButtons.map((btn, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <input
                                                placeholder="Button Text"
                                                value={btn.text}
                                                onChange={(e) => updateInlineButton(idx, 'text', e.target.value)}
                                                className="flex-1 p-2 bg-zinc-50 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 text-sm"
                                            />
                                            <input
                                                placeholder="URL (https://...)"
                                                value={btn.url}
                                                onChange={(e) => updateInlineButton(idx, 'url', e.target.value)}
                                                className="flex-1 p-2 bg-zinc-50 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 text-sm"
                                            />
                                            <button onClick={() => removeInlineButton(idx)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {formData.responseButtons.length === 0 && (
                                        <p className="text-xs text-zinc-400 italic">No inline buttons added.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end gap-3 sticky bottom-0">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded text-zinc-700 dark:text-zinc-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow-lg shadow-blue-500/20 flex items-center gap-2 font-medium"
                            >
                                <Save size={18} />
                                Save Configuration
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
