"use client";

import { useState } from "react";
import { Upload, Plus, Trash2, Send } from "lucide-react";
import Image from "next/image";

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
            const res = await fetch("http://localhost:4000/api/upload", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (res.ok) {
                setMediaUrl(data.url);
            } else {
                setStatus({ type: "error", message: "Image upload failed" });
            }
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
            const res = await fetch("http://localhost:4000/api/broadcast", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message,
                    mediaUrl,
                    buttons: buttons.filter(b => b.text && b.url), // Filter empty buttons
                    limit, // Send the selected limit
                }),
                mode: 'cors', // Explicitly request CORS
            });

            console.log("Broadcast response status:", res.status);

            if (res.ok) {
                setStatus({ type: "success", message: "Broadcast started successfully! Messages are being queued." });
                setMessage("");
                setMediaUrl("");
                setButtons([]);
            } else {
                const errorData = await res.json().catch(() => ({}));
                console.error("Broadcast failed response:", errorData);
                setStatus({ type: "error", message: `Failed to start broadcast: ${errorData.error || res.statusText}` });
            }
        } catch (error: any) {
            console.error("Network Error during broadcast:", error);
            setStatus({ type: "error", message: `Network error: ${error.message}. Is the backend running on port 4000?` });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8">Broadcast Message</h1>

            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-gray-200 dark:border-zinc-800 p-6 space-y-6">

                {/* Status Message */}
                {status && (
                    <div className={`p-4 rounded-lg ${status.type === "success" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                        {status.message}
                    </div>
                )}

                {/* Message Input */}
                <div>
                    <label className="block text-sm font-medium mb-2">Message Text</label>
                    <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={5}
                        className="w-full p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        placeholder="Type your broadcast message here..."
                    />
                </div>

                {/* Image Upload */}
                <div>
                    <label className="block text-sm font-medium mb-2">Attach Image (Optional)</label>
                    <div className="flex items-center gap-4">
                        <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-zinc-800 rounded-lg hover:bg-gray-200 dark:hover:bg-zinc-700 transition-colors">
                            <Upload size={20} />
                            <span>{uploading ? "Uploading..." : "Upload Image"}</span>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                                disabled={uploading}
                            />
                        </label>
                        {mediaUrl && (
                            <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-700">
                                <Image
                                    src={mediaUrl}
                                    alt="Preview"
                                    fill
                                    className="object-cover"
                                />
                                <button
                                    onClick={() => setMediaUrl("")}
                                    className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-bl-lg hover:bg-red-600"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Dynamic Buttons */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium">Inline Buttons (Optional)</label>
                        <button
                            onClick={addButton}
                            className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1"
                        >
                            <Plus size={16} /> Add Button
                        </button>
                    </div>

                    <div className="space-y-3">
                        {buttons.map((btn, index) => (
                            <div key={index} className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Button Label"
                                    value={btn.text}
                                    onChange={(e) => updateButton(index, "text", e.target.value)}
                                    className="flex-1 p-2 bg-gray-50 dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <input
                                    type="url"
                                    placeholder="URL (https://...)"
                                    value={btn.url}
                                    onChange={(e) => updateButton(index, "url", e.target.value)}
                                    className="flex-1 p-2 bg-gray-50 dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                                <button
                                    onClick={() => removeButton(index)}
                                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>
                        ))}
                        {buttons.length === 0 && (
                            <p className="text-sm text-gray-500 italic">No buttons added.</p>
                        )}
                    </div>
                </div>

                {/* Target Audience Selector */}
                <div>
                    <label className="block text-sm font-medium mb-2">Target Audience</label>
                    <select
                        value={limit}
                        onChange={(e) => setLimit(Number(e.target.value))}
                        className="w-full p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    >
                        <option value={0}>All Users</option>
                        <option value={1}>Latest 1 User (Test)</option>
                        <option value={5}>Latest 5 Users</option>
                        <option value={10}>Latest 10 Users</option>
                        <option value={100}>Latest 100 Users</option>
                        <option value={200}>Latest 200 Users</option>
                        <option value={500}>Latest 500 Users</option>
                        <option value={1000}>Latest 1000 Users</option>
                        <option value={2000}>Latest 2000 Users</option>
                        <option value={5000}>Latest 5000 Users</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                        Select "All Users" to send to everyone, or limit to recent users for faster delivery.
                    </p>
                </div>

                {/* Submit Action */}
                <div className="pt-4 border-t border-gray-100 dark:border-zinc-800">
                    <button
                        onClick={handleBroadcast}
                        disabled={loading || uploading}
                        className={`w-full py-3 px-6 rounded-lg text-white font-medium flex items-center justify-center gap-2 transition-all ${loading || uploading
                            ? "bg-blue-400 cursor-not-allowed"
                            : "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                            }`}
                    >
                        <Send size={20} />
                        {loading ? "Queueing Broadcast..." : "Send Broadcast"}
                    </button>
                    <p className="text-xs text-center text-gray-500 mt-2">
                        Messages are processed in the background (Max 1500/min).
                    </p>
                </div>

            </div>
        </div>
    );
}
