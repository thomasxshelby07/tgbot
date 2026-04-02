'use client';

import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Send, Hash, X, Search, ArrowLeft, Settings as SettingsIcon, PlusCircle, Trash2, Filter, ImageIcon, Loader2, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface UserDetail {
    firstName: string;
    lastName?: string;
    username?: string;
}

interface ChatSession {
    _id: string;
    telegramId: string;
    userId?: UserDetail;
    status: 'active' | 'closed';
    unreadCount?: number;
    updatedAt: string;
}

interface ChatMessage {
    _id: string;
    sessionId: string;
    sender: 'user' | 'admin';
    content: string;
    messageType: string;
    createdAt: string;
    mediaUrl?: string;
}

export default function ChatPage() {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
    const [loadingSessions, setLoadingSessions] = useState(true);
    const [inputMessage, setInputMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [isAutoScroll, setIsAutoScroll] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Admin Role State
    const [adminRole, setAdminRole] = useState<string>('admin');

    useEffect(() => {
        const token = localStorage.getItem('bot_admin_token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setAdminRole(payload.role);
            } catch (e) { }
        }
    }, []);

    // Modals state
    const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [sessionFilter, setSessionFilter] = useState<'all' | 'active' | 'closed'>('all');

    const [settings, setSettings] = useState({
        chatButtonText: '💬 Live Chat',
        chatActive: true
    });

    const fetchSessions = async (showLoading = true) => {
        try {
            if (showLoading) setLoadingSessions(true);
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const response = await axios.get(`${apiUrl}/api/chat/sessions`);
            setSessions(response.data);
        } catch (error) {
            console.error('Error fetching sessions:', error);
            if (showLoading) toast.error('Failed to fetch chat sessions');
        } finally {
            if (showLoading) setLoadingSessions(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const response = await axios.get(`${apiUrl}/api/chat/settings`);
            setSettings({
                chatButtonText: response.data?.chatButtonText || '💬 Live Chat',
                chatActive: response.data?.chatActive ?? true
            });
        } catch (error) {
            console.error('Error fetching chat settings:', error);
        }
    };

    const fetchMessages = async (sessionId: string) => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const response = await axios.get(`${apiUrl}/api/chat/sessions/${sessionId}/messages`);
            setMessages(response.data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const fetchAllUsers = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const response = await axios.get(`${apiUrl}/api/users`);
            setAllUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Failed to load users for new chat');
        }
    };

    useEffect(() => {
        fetchSessions();
        fetchSettings();

        // Polling loop for sessions
        const intervalId = setInterval(() => {
            fetchSessions(false);
        }, 3000);

        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        if (!selectedSession) return;
        
        fetchMessages(selectedSession._id);

        // Polling loop for messages of selected session
        const intervalId = setInterval(() => {
            fetchMessages(selectedSession._id);
        }, 2000);

        return () => clearInterval(intervalId);
    }, [selectedSession]);

    // Auto-scroll to bottom of messages
    useEffect(() => {
        if (isAutoScroll) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isAutoScroll]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        const isBottom = scrollHeight - scrollTop - clientHeight < 150;
        setIsAutoScroll(isBottom);
    };

    const handleUpdateSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            await axios.patch(`${apiUrl}/api/chat/settings`, settings);
            toast.success('Chat settings updated');
            setIsSettingsModalOpen(false);
        } catch (error) {
            console.error('Error updating chat settings:', error);
            toast.error('Failed to update settings');
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSession || !inputMessage.trim()) return;

        setSending(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            await axios.post(`${apiUrl}/api/chat/sessions/${selectedSession._id}/messages`, {
                content: inputMessage
            });
            setInputMessage('');
            setIsAutoScroll(true);
            fetchMessages(selectedSession._id); // instant refresh
            fetchSessions(false); // update last modified sorting
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedSession) return;

        setUploadingImage(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const uploadRes = await axios.post(`${apiUrl}/api/upload`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            const mediaUrl = uploadRes.data.url;
            
            await axios.post(`${apiUrl}/api/chat/sessions/${selectedSession._id}/messages`, {
                content: '', // Optional caption could be added here
                messageType: 'photo',
                mediaUrl: mediaUrl
            });
            
            setIsAutoScroll(true);
            fetchMessages(selectedSession._id);
            fetchSessions(false);
        } catch (error) {
            console.error('Error uploading image:', error);
            toast.error('Failed to send image');
        } finally {
            setUploadingImage(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleStartNewChat = async (user: any) => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const res = await axios.post(`${apiUrl}/api/chat/sessions`, {
                telegramId: user.telegramId,
                userId: user._id
            });
            setSelectedSession(res.data);
            setIsNewChatModalOpen(false);
            setUserSearchTerm('');
            toast.success('Chat session started');
            fetchSessions(false);
        } catch (err) {
            console.error('Error starting new chat:', err);
            toast.error('Failed to start new chat');
        }
    };

    const handleEndChat = async () => {
        if (!selectedSession || !confirm('End this chat session?')) return;
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            await axios.post(`${apiUrl}/api/chat/sessions/${selectedSession._id}/messages`, {
                content: "System closing chat...",
                action: 'close'
            });
            toast.success('Chat ended');
            setSelectedSession({ ...selectedSession, status: 'closed' });
            fetchSessions(false);
        } catch (error) {
            console.error('Error ending chat:', error);
            toast.error('Failed to end chat');
        }
    };

    const handleDeleteChat = async () => {
        if (!selectedSession || !confirm('Are you sure you want to delete this session AND all messages? This cannot be undone.')) return;
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            await axios.delete(`${apiUrl}/api/chat/sessions/${selectedSession._id}`);
            toast.success('Chat deleted');
            setSelectedSession(null);
            fetchSessions(false);
        } catch (error) {
            console.error('Error deleting chat:', error);
            toast.error('Failed to delete chat');
        }
    };

    const filteredUsers = allUsers.filter(u => {
        const term = userSearchTerm.toLowerCase();
        return (u.firstName?.toLowerCase().includes(term) || u.lastName?.toLowerCase().includes(term) || u.telegramId.includes(term));
    });

    return (
        <div className="flex flex-col h-[100dvh] w-full bg-slate-50 overflow-hidden font-sans">
            {/* Top Navigation Bar */}
            <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-sm z-20">
                <div className="flex items-center gap-6">
                    <button 
                        onClick={() => window.location.href = '/dashboard'}
                        className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-all flex items-center gap-2 text-[13px] font-black uppercase tracking-widest border border-transparent hover:border-slate-100"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft size={16} strokeWidth={3} /> <span className="hidden sm:inline">Dashboard</span>
                    </button>
                    <div className="h-6 w-px bg-slate-100"></div>
                    <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <Send size={14} strokeWidth={3} className="-rotate-12" />
                         </div>
                         <h1 className="text-[15px] font-black text-slate-900 tracking-tight italic uppercase">Direct Terminal</h1>
                    </div>
                </div>
                <div>
                    <button 
                        onClick={() => setIsSettingsModalOpen(true)}
                        className="p-2.5 hover:bg-slate-50 rounded-xl text-slate-500 transition-all flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] border border-slate-100 shadow-sm"
                    >
                        <SettingsIcon size={14} strokeWidth={2.5} /> <span>Settings</span>
                    </button>
                </div>
            </div>

            {/* Main Chat Interface */}
            <div className="flex flex-1 min-h-0 relative">
                {/* Left Sidebar - Chat List */}
                <div className={`w-full md:w-[360px] shrink-0 bg-white border-r border-slate-200 flex-col shadow-xl shadow-slate-900/[0.02] z-10 ${selectedSession ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                        <div className="flex items-center gap-2">
                             <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                             <span className="text-[10px] font-black text-slate-400 tracking-[0.25em] uppercase">Active Streams</span>
                        </div>
                        <div className="flex gap-2">
                            <select 
                                value={sessionFilter} 
                                onChange={(e) => setSessionFilter(e.target.value as any)}
                                className="bg-white text-slate-600 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none border border-slate-200 cursor-pointer shadow-sm hover:border-blue-500 transition-all"
                            >
                                <option value="all">Global</option>
                                <option value="active">Active</option>
                                <option value="closed">History</option>
                            </select>
                            <button 
                                onClick={() => { fetchAllUsers(); setIsNewChatModalOpen(true); }}
                                className="bg-slate-900 hover:bg-blue-600 text-white p-2 rounded-xl transition-all shadow-lg active:scale-95"
                                title="Init Secure Stream"
                            >
                                <PlusCircle size={18} strokeWidth={2.5} />
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar bg-white">
                        {loadingSessions ? (
                            <div className="py-20 text-center flex flex-col items-center gap-3">
                                <div className="w-6 h-6 border-2 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Syncing...</span>
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="py-20 text-center flex flex-col items-center gap-4 opacity-30">
                                <Search size={40} strokeWidth={1} className="text-slate-200" />
                                <p className="text-[11px] font-black uppercase tracking-widest">No Active Channels</p>
                            </div>
                        ) : (
                            [...sessions]
                                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                                .filter(s => sessionFilter === 'all' || s.status === sessionFilter)
                                .map(session => {
                                const isSelected = selectedSession?._id === session._id;
                                const titleName = session.userId?.firstName 
                                    ? `${session.userId.firstName} ${session.userId.lastName || ''}`.trim() 
                                    : session.telegramId;
                                
                                return (
                                    <div 
                                        key={session._id}
                                        onClick={() => {
                                            setSelectedSession(session);
                                            setIsAutoScroll(true);
                                            setSessions(prev => prev.map(s => s._id === session._id ? { ...s, unreadCount: 0 } : s));
                                        }}
                                        className={`p-4 rounded-3xl cursor-pointer transition-all border flex items-center gap-4 relative overflow-hidden group ${
                                            isSelected 
                                                ? 'bg-blue-600 border-blue-600 shadow-xl shadow-blue-600/20 translate-x-1' 
                                                : 'bg-white border-white hover:bg-slate-50 hover:border-slate-100'
                                        }`}
                                    >
                                        {isSelected && (
                                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150"></div>
                                        )}
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-[16px] shrink-0 shadow-inner ${
                                            isSelected ? 'bg-white text-blue-600' : 'bg-slate-100 text-slate-400'
                                        }`}>
                                            {titleName.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <div className={`font-black text-[14px] truncate tracking-tight transition-colors ${isSelected ? 'text-white' : 'text-slate-900 group-hover:text-blue-600'}`}>
                                                    {titleName}
                                                </div>
                                                <span className={`text-[9px] font-bold shrink-0 ml-2 uppercase opacity-60 ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                                                    {new Date(session.updatedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className={`text-[11px] font-bold truncate flex items-center gap-1.5 ${isSelected ? 'text-blue-100/70' : 'text-slate-400'}`}>
                                                    <Hash size={10} strokeWidth={3}/>{session.telegramId}
                                                </span>
                                                <div className="flex items-center gap-2">
                                                    {!!session.unreadCount && session.unreadCount > 0 && (
                                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full min-w-[20px] text-center shadow-lg ${
                                                            isSelected ? 'bg-white text-blue-600' : 'bg-blue-600 text-white shadow-blue-500/20'
                                                        }`}>
                                                            {session.unreadCount}
                                                        </span>
                                                    )}
                                                    <div className={`w-2 h-2 rounded-full ring-4 ${
                                                        isSelected ? 'ring-white/20' : 'ring-transparent'
                                                    } ${session.status === 'active' ? 'bg-emerald-400' : 'bg-rose-400/50'}`}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Right Area - Chat Messages */}
                <div className={`flex-1 bg-slate-50 flex-col min-w-0 relative ${selectedSession ? 'flex' : 'hidden md:flex'}`}>
                    {selectedSession ? (
                        <>
                            {/* Visual Pattern Overlay */}
                            <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}></div>
                            
                            {/* Active Chat Header */}
                            <div className="h-20 p-4 border-b border-slate-200 bg-white/80 backdrop-blur-md shrink-0 flex justify-between items-center z-10 shadow-sm shadow-slate-900/[0.01]">
                                <div className="flex items-center gap-4 px-2">
                                    <button 
                                        onClick={() => setSelectedSession(null)}
                                        className="md:hidden p-2.5 -ml-2 bg-slate-50 hover:bg-slate-100 rounded-xl text-slate-400 transition-all border border-slate-100"
                                    >
                                        <ArrowLeft size={18} strokeWidth={3} />
                                    </button>
                                    <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-[18px] shrink-0 shadow-xl shadow-slate-900/10 hover:scale-110 transition-transform">
                                        {(selectedSession?.userId?.firstName || selectedSession?.telegramId?.toString() || '').charAt(0)}
                                    </div>
                                    <div className="flex flex-col">
                                        <h2 className="font-black text-[16px] text-slate-900 tracking-tight leading-none mb-1">
                                            {selectedSession?.userId?.firstName || selectedSession?.telegramId}
                                        </h2>
                                        <div className="flex items-center gap-2">
                                             <div className={`w-1.5 h-1.5 rounded-full ${selectedSession?.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                                             <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                                                {selectedSession?.status === 'active' ? 'Secured Line' : 'Closed Archive'}
                                             </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 px-2">
                                    {selectedSession?.status === 'active' && (
                                        <button 
                                            onClick={handleEndChat}
                                            className="text-[10px] text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-100 px-5 py-2.5 rounded-xl font-black uppercase tracking-widest transition-all shadow-sm active:scale-95"
                                        >
                                            Terminate
                                        </button>
                                    )}
                                    {adminRole === 'superadmin' && (
                                        <button 
                                            onClick={handleDeleteChat}
                                            className="p-3 text-slate-400 hover:text-rose-600 hover:bg-white bg-slate-100 rounded-xl transition-all border border-transparent shadow-sm"
                                            title="Purge Logs"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Message List */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 z-10 relative custom-scrollbar bg-slate-50/50" onScroll={handleScroll}>
                                <div className="flex justify-center my-10">
                                     <div className="px-5 py-1.5 bg-slate-200/50 backdrop-blur-sm rounded-full text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 italic border border-slate-100 whitespace-nowrap">
                                        End-to-End Encryption Active
                                     </div>
                                </div>

                                {messages.map((msg, idx) => {
                                    const isAdmin = msg.sender === 'admin';
                                    const isPhoto = msg.messageType === 'photo' && msg.mediaUrl;
                                    const isVideo = msg.messageType === 'video' && msg.mediaUrl;
                                    const isAudio = (msg.messageType === 'audio' || msg.messageType === 'voice') && msg.mediaUrl;
                                    const isDocument = msg.messageType === 'document' && msg.mediaUrl;
                                    const hasMedia = isPhoto || isVideo || isAudio || isDocument;

                                    return (
                                        <div key={msg._id || idx} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'} group`}>
                                            <div className={`max-w-[85%] sm:max-w-[70%] px-5 py-3 relative shadow-sm transition-all duration-300 ${
                                                isAdmin 
                                                    ? 'bg-blue-600 text-white rounded-[24px] rounded-tr-[4px] hover:shadow-xl hover:shadow-blue-600/20' 
                                                    : 'bg-white text-slate-900 rounded-[24px] rounded-tl-[4px] border border-slate-100 hover:shadow-xl hover:shadow-slate-900/5'
                                            }`}>
                                                {isPhoto && (
                                                    <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" className="block mb-2 rounded-2xl overflow-hidden ring-4 ring-black/5 hover:ring-white/30 transition-all">
                                                        <img src={msg.mediaUrl} alt="Media Attachment" className="max-w-full max-h-[300px] object-contain mx-auto" />
                                                    </a>
                                                )}
                                                {isVideo && (
                                                    <video src={msg.mediaUrl} controls className="max-w-full max-h-[300px] rounded-2xl mb-2 bg-black ring-4 ring-black/5" />
                                                )}
                                                {isAudio && (
                                                    <audio src={msg.mediaUrl} controls className="max-w-full mb-2 h-10 ring-4 ring-black/5 rounded-full" />
                                                )}
                                                {isDocument && (
                                                    <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-3 mb-2 p-3 rounded-2xl border transition-all ${isAdmin ? 'bg-white/10 border-white/20 hover:bg-white/20' : 'bg-slate-50 border-slate-100 hover:bg-slate-100'} text-[13px] font-bold`}>
                                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isAdmin ? 'bg-white text-blue-600' : 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'}`}>
                                                            <Hash size={14} />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="leading-none mb-1">Attachment File</span>
                                                            <span className={`text-[10px] font-medium ${isAdmin ? 'text-white/60' : 'text-slate-400'}`}>Click to open in viewport</span>
                                                        </div>
                                                    </a>
                                                )}
                                                {msg.content ? (
                                                    <p className={`text-[14px] font-medium whitespace-pre-wrap leading-relaxed ${hasMedia ? 'mt-2' : ''}`}>{msg.content}</p>
                                                ) : null}
                                                <div className={`flex items-center gap-1.5 mt-2 transition-opacity ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                                                    {isAdmin && <Check size={10} strokeWidth={4} className="text-blue-100" />}
                                                    <span className={`text-[9px] font-black tracking-tighter uppercase opacity-50 ${isAdmin ? 'text-blue-50' : 'text-slate-400'}`}>
                                                        {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} className="h-6" />
                            </div>

                            {/* Input Area */}
                            {(selectedSession?.status === 'active') ? (
                                <div className="p-6 bg-white shrink-0 z-10 border-t border-slate-50 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
                                    <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto flex items-center gap-4">
                                        <input 
                                            type="file" 
                                            accept="image/*,video/*,audio/*,application/pdf" 
                                            className="hidden" 
                                            ref={fileInputRef} 
                                            onChange={handleImageUpload} 
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploadingImage}
                                            className="w-12 h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-400 flex items-center justify-center transition-all shrink-0 border border-slate-100 shadow-sm active:scale-95 disabled:opacity-50"
                                        >
                                            {uploadingImage ? <Loader2 size={18} className="animate-spin" /> : <PlusCircle size={22} />}
                                        </button>
                                        <div className="flex-1 relative">
                                            <input
                                                type="text"
                                                value={inputMessage}
                                                onChange={(e) => setInputMessage(e.target.value)}
                                                placeholder="Type your secure response..."
                                                className="w-full pl-6 pr-14 py-4 rounded-[42px] border border-slate-100 bg-slate-50 text-[14px] font-medium focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none placeholder-slate-300 transition-all shadow-inner"
                                                disabled={sending}
                                            />
                                            <button 
                                                type="submit"
                                                disabled={sending || (!inputMessage.trim() && !uploadingImage)}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-blue-600 hover:bg-slate-900 disabled:bg-slate-200 text-white flex items-center justify-center transition-all shadow-xl shadow-blue-500/20 active:scale-75"
                                            >
                                                <Send size={16} strokeWidth={3} className="-rotate-12 -ml-0.5" />
                                            </button>
                                        </div>
                                    </form>
                                    <p className="max-w-4xl mx-auto text-[9px] text-center font-black uppercase tracking-[0.3em] text-slate-300 mt-4 px-2">Messages are delivered instantly via global telegram cloud API</p>
                                </div>
                            ) : (
                                <div className="p-8 bg-slate-100 shrink-0 text-center z-10 border-t border-slate-200 flex flex-col items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-400">
                                        <Hash size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[12px] font-black uppercase tracking-widest text-slate-400">Read Only Archive</p>
                                        <p className="text-[10px] text-slate-300 font-medium">This secure session was terminated across all platforms.</p>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 z-10 p-10">
                            <div className="w-24 h-24 bg-white rounded-[32px] flex items-center justify-center shadow-xl shadow-slate-900/[0.03] mb-8 border border-slate-50 group">
                                <Send size={32} strokeWidth={1} className="text-slate-200 group-hover:scale-125 group-hover:text-blue-500 transition-all duration-700 -rotate-12" />
                            </div>
                            <h2 className="text-[20px] font-black text-slate-900 tracking-tight mb-2">Direct Communication Hub</h2>
                            <p className="text-[13px] font-medium text-slate-400 text-center max-w-xs leading-relaxed">
                                Select a live stream from the left panel to begin a secure encrypted session with your users.
                            </p>
                            <button 
                                onClick={() => { fetchAllUsers(); setIsNewChatModalOpen(true); }}
                                className="mt-8 px-10 py-4 bg-slate-900 text-white rounded-[20px] font-black text-[11px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/10 active:scale-95"
                            >
                                Init Direct Message
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals area */}
            
            {/* New Chat Modal */}
            {isNewChatModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[40px] w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[85vh] border border-white/20 animate-in slide-in-from-bottom-5 duration-500">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
                            <div>
                                <h3 className="font-black text-2xl text-slate-900 tracking-tighter">Terminal Link</h3>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">Select identity to bind session</p>
                            </div>
                            <button onClick={() => setIsNewChatModalOpen(false)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 hover:rotate-90 transition-all rounded-2xl">
                                <X size={20} strokeWidth={3} />
                            </button>
                        </div>
                        <div className="p-6 border-b border-slate-50">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} strokeWidth={3} />
                                <input 
                                    type="text" 
                                    autoFocus
                                    placeholder="Search global directory..."
                                    value={userSearchTerm}
                                    onChange={(e) => setUserSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-6 py-4 rounded-3xl border border-slate-100 bg-slate-50 text-[14px] font-medium outline-none focus:bg-white focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 transition-all shadow-inner"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/20">
                            {filteredUsers.length === 0 ? (
                                <div className="py-20 text-center opacity-30 flex flex-col items-center">
                                    <Hash size={40} className="mb-4" />
                                    <p className="text-[11px] font-black uppercase tracking-[0.3em]">Identity Not Found</p>
                                </div>
                            ) : (
                                <div className="grid gap-2">
                                    {filteredUsers.map(user => (
                                        <div 
                                            key={user._id}
                                            onClick={() => handleStartNewChat(user)}
                                            className="flex items-center justify-between p-4 bg-white rounded-3xl border border-slate-100 hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/5 cursor-pointer transition-all animate-in zoom-in-95 duration-200"
                                        >
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-[14px] shrink-0 shadow-lg shadow-slate-900/10">
                                                    {(user.firstName || 'U').charAt(0)}
                                                </div>
                                                <div className="truncate">
                                                    <div className="font-bold text-[14px] text-slate-900 truncate leading-tight mb-1">
                                                        {[user.firstName, user.lastName].filter(Boolean).join(' ') || 'Legacy User'}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest truncate">
                                                        #{user.telegramId}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-2 transition-transform hover:translate-x-1">
                                                <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center"><PlusCircle size={18} strokeWidth={2.5} /></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Chat Settings Modal */}
            {isSettingsModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white rounded-[40px] w-full max-w-sm shadow-2xl overflow-hidden flex flex-col border border-white/20 animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white">
                            <div>
                                <h3 className="font-black text-2xl text-slate-900 tracking-tighter">Terminal Logic</h3>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">Module configuration override</p>
                            </div>
                            <button onClick={() => setIsSettingsModalOpen(false)} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all">
                                <X size={20} strokeWidth={3} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateSettings} className="p-8 space-y-8 bg-white">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Keyboard Label / बटन का नाम</label>
                                <input
                                    type="text"
                                    value={settings.chatButtonText}
                                    onChange={(e) => setSettings({ ...settings, chatButtonText: e.target.value })}
                                    className="w-full px-6 py-4 rounded-3xl bg-slate-50 border border-slate-100 text-[14px] font-bold focus:bg-white focus:ring-8 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all shadow-inner"
                                />
                                <p className="text-[9px] text-slate-300 italic px-1 leading-relaxed mt-1.5 font-medium">This text will appear in the bot's interactive keyboard menu.</p>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center justify-between p-5 rounded-3xl border border-slate-100 bg-slate-50 shadow-inner group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><Check size={14} strokeWidth={4} /></div>
                                        <label htmlFor="chatActive" className="text-[13px] font-black uppercase tracking-widest text-slate-700 cursor-pointer">Module Enabled</label>
                                    </div>
                                    <input
                                        type="checkbox"
                                        id="chatActive"
                                        checked={settings.chatActive}
                                        onChange={(e) => setSettings({ ...settings, chatActive: e.target.checked })}
                                        className="w-6 h-6 rounded-lg border-slate-200 text-blue-600 focus:ring-0 cursor-pointer shadow-sm"
                                    />
                                </div>
                                <p className="text-[9px] text-slate-300 italic px-5 leading-relaxed mt-2 font-medium">Toggle off to temporarily disable the chat interface in the TG bot.</p>
                            </div>
                            <button
                                type="submit"
                                className="w-full py-5 bg-slate-900 hover:bg-blue-600 text-white rounded-[24px] font-black text-[13px] uppercase tracking-[0.25em] transition-all shadow-xl shadow-slate-900/10 active:scale-95"
                            >
                                Deploy Meta Policy
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Custom scrollbar styling scoped just to the lists */}
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 5px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(71, 85, 105, 0.1);
                    border-radius: 20px;
                }
                .custom-scrollbar:hover::-webkit-scrollbar-thumb {
                    background-color: rgba(59, 130, 246, 0.2);
                }
            `}</style>
        </div>
    );
}
