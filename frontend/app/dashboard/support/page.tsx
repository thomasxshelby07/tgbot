'use client';

import { useState, useEffect, useRef, useMemo, useCallback, memo } from 'react';
import axios from 'axios';
import { LifeBuoy, CheckCircle, Trash2, Search, Filter, MessageSquare, Smartphone, Hash, Send, ImageIcon, Video, FileAudio, X, ArrowLeft, ChevronDown, Clock, History } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SupportTicket {
    _id: string;
    telegramId: string;
    name: string;
    phoneNumber: string;
    dafabetId: string;
    issueType: string;
    problem: string;
    status: 'open' | 'resolved';
    unreadCount: number;
    updatedAt: string;
    createdAt: string;
}

interface ChatMessage {
    _id: string;
    sender: 'user' | 'admin';
    content: string;
    messageType: string;
    mediaUrl?: string;
    createdAt: string;
    isOptimistic?: boolean; // New flag for messages sent before server confirmation
}

// Memoized Ticket Item for performance
const TicketItem = memo(({ 
    ticket, 
    isSelected, 
    onClick, 
    bgColors 
}: { 
    ticket: SupportTicket, 
    isSelected: boolean, 
    onClick: () => void,
    bgColors: string[]
}) => {
    const colorIndex = ticket.name.charCodeAt(0) % bgColors.length;
    const avatarColor = bgColors[colorIndex] || 'bg-indigo-500';

    return (
        <div
            onClick={onClick}
            className={`p-3 cursor-pointer transition-all rounded-2xl relative group border ${
                isSelected 
                    ? 'bg-white border-indigo-100 shadow-[0_8px_20px_-10px_rgba(79,70,229,0.15)] ring-1 ring-indigo-500/5' 
                    : 'bg-transparent border-transparent hover:bg-white hover:border-slate-100'
            }`}
        >
            <div className="flex gap-3">
                <div className="relative shrink-0 pt-0.5">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-[16px] transition-transform group-hover:scale-105 duration-300 ${avatarColor}`}>
                        {ticket.name.charAt(0).toUpperCase()}
                    </div>
                    {ticket.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 min-w-[20px] h-5 bg-blue-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-md z-10 p-0.5">
                            {ticket.unreadCount}
                        </div>
                    )}
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                        <div className={`font-bold text-[14px] truncate transition-colors ${ticket.unreadCount > 0 ? 'text-slate-950' : 'text-slate-700'} ${isSelected ? 'text-blue-600' : ''}`}>
                            {ticket.name}
                        </div>
                        <span className={`text-[10px] font-bold shrink-0 mt-0.5 flex flex-col items-end gap-0.5 ${ticket.unreadCount > 0 ? 'text-blue-600' : 'text-slate-400'}`}>
                            {new Date(ticket.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 mt-0.5 opacity-60">
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md uppercase tracking-tighter">#{ticket.telegramId.slice(-5)}</span>
                        <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                        <span className={`text-[10px] font-black uppercase tracking-tight ${
                            ticket.status === 'resolved' ? 'text-slate-400' : 
                            ticket.issueType === 'Deposit' ? 'text-emerald-500' :
                            ticket.issueType === 'Withdrawal' ? 'text-orange-500' :
                            'text-blue-500'
                        }`}>
                            {ticket.issueType}
                        </span>
                    </div>
                    
                    <div className={`text-[12px] line-clamp-1 leading-normal mt-1.5 ${ticket.unreadCount > 0 ? 'text-slate-800 font-semibold' : 'text-slate-500 font-medium'}`}>
                        {ticket.problem}
                    </div>
                </div>
            </div>
        </div>
    );
});
TicketItem.displayName = 'TicketItem';

// Memoized Message Bubble for performance
const MessageBubble = memo(({ msg }: { msg: ChatMessage }) => {
    const isAdmin = msg.sender === 'admin';
    const isPending = msg.isOptimistic;
    
    return (
        <div className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[92%] sm:max-w-[75%] px-4 py-2 relative shadow-sm ${
                isAdmin 
                    ? `bg-blue-600 text-white rounded-2xl rounded-tr-none ${isPending ? 'opacity-70 saturate-50' : ''}` 
                    : 'bg-white text-slate-800 rounded-2xl rounded-tl-none border border-slate-200'
            }`}>
                {msg.mediaUrl ? (
                    <div className="mb-1.5">
                        {msg.messageType === 'photo' ? (
                            <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-xl border border-black/5"><img src={msg.mediaUrl} alt="Shared photo" className="max-w-full max-h-[300px] hover:scale-105 transition-transform duration-500" /></a>
                        ) : msg.messageType === 'video' ? (
                            <video src={msg.mediaUrl} controls className="max-w-full max-h-[300px] rounded-xl" />
                        ) : msg.messageType === 'audio' || msg.messageType === 'voice' ? (
                            <audio src={msg.mediaUrl} controls className={`max-w-full h-10 ${isAdmin ? 'brightness-200' : ''}`} />
                        ) : (
                            <a href={msg.mediaUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-[13px] p-3 text-blue-600 bg-blue-50/50 rounded-xl font-bold transition-all hover:bg-blue-100/50">
                                <div className="w-10 h-10 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0 text-blue-500"><FileAudio size={20} /></div> File Documentation
                            </a>
                        )}
                        {msg.content && <p className="text-[14px] mt-2 font-medium leading-relaxed">{msg.content}</p>}
                    </div>
                ) : (
                    <p className="text-[14px] font-medium leading-relaxed break-words">{msg.content}</p>
                )}
                <div className={`flex items-center justify-end gap-1.5 mt-1 opacity-50 ${msg.mediaUrl && !msg.content ? 'relative' : ''}`}>
                    <span className="text-[9px] font-black uppercase tracking-tighter">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {isAdmin && (
                        isPending ? (
                            <div className="w-2.5 h-2.5 border border-white/50 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <CheckCircle size={10} strokeWidth={3} className="text-white/80" />
                        )
                    )}
                </div>
            </div>
        </div>
    );
});
MessageBubble.displayName = 'MessageBubble';

export default function SupportPage() {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('open');
    const [showOnlyUnread, setShowOnlyUnread] = useState(false);

    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [userHistory, setUserHistory] = useState<SupportTicket[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [uploadingMedia, setUploadingMedia] = useState(false);
    
    // Performance & Auto-scroll State
    const [isAtBottom, setIsAtBottom] = useState(true);
    const lastMessageTimeRef = useRef<string | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Admin Role State
    const [adminRole, setAdminRole] = useState<string>('admin');
    const [permissions, setPermissions] = useState<string[]>([]);
    
    // Notification logic
    const lastTicketsRef = useRef<SupportTicket[]>([]);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    }, []);

    const playNotificationSound = () => {
        if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(e => console.log('Audio play failed:', e));
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('bot_admin_token');
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setAdminRole(payload.role);
                setPermissions(payload.permissions || []);
            } catch (e) { }
        }
    }, []);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    // Auto-scroll logic
    const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior });
        }
    }, []);

    const handleScroll = () => {
        if (!chatContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
        setIsAtBottom(isNearBottom);
    };

    useEffect(() => {
        if (isAtBottom) {
            scrollToBottom();
        }
    }, [messages, isAtBottom, scrollToBottom]);

    const fetchTickets = async () => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const response = await axios.get(`${apiUrl}/api/support/tickets`);
            const newTickets = response.data;

            // Check for notifications
            if (lastTicketsRef.current.length > 0) {
                const hadNewTicket = newTickets.length > lastTicketsRef.current.length;
                const hadNewUnread = newTickets.some((nt: SupportTicket) => {
                    const oldT = lastTicketsRef.current.find(ot => ot._id === nt._id);
                    return oldT && nt.unreadCount > oldT.unreadCount;
                });

                if (hadNewTicket || hadNewUnread) {
                    playNotificationSound();
                    if (hadNewTicket) toast.success('New support ticket received!');
                }
            }

            setTickets(newTickets);
            lastTicketsRef.current = newTickets;
            
            // Auto close selected ticket if deleted or resolved (optional depending on UX preference)
            if (selectedTicket && !newTickets.find((t: any) => t._id === selectedTicket._id)) {
                setSelectedTicket(null);
            }
        } catch (error) {
            console.error('Error fetching tickets:', error);
            toast.error('Failed to fetch tickets');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
        const interval = setInterval(fetchTickets, 10000); // Polling tickets every 10s
        return () => clearInterval(interval);
    }, []);

    const fetchMessages = async (ticketId: string, isInitial = false) => {
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const since = !isInitial && lastMessageTimeRef.current ? lastMessageTimeRef.current : '';
            const response = await axios.get(`${apiUrl}/api/support/tickets/${ticketId}/messages`, {
                params: { since }
            });
            
            const newMessages = response.data;
            if (newMessages.length > 0) {
                setMessages(prev => {
                    if (isInitial) return newMessages;
                    
                    // Filter out any messages that already exist in state (by _id)
                    const existingIds = new Set(prev.map(m => m._id));
                    const uniqueNew = newMessages.filter((m: ChatMessage) => !existingIds.has(m._id));
                    
                    if (uniqueNew.length === 0) return prev;

                    // When real messages arrive from admin, remove our optimistic equivalents
                    // We check for sender and content match if they don't have IDs yet
                    const optimisticIdsToRemove = new Set<string>();
                    uniqueNew.forEach((nm: ChatMessage) => {
                        if (nm.sender === 'admin') {
                            const match = prev.find(pm => 
                                pm.isOptimistic && 
                                pm.sender === 'admin' && 
                                pm.content === nm.content &&
                                pm.messageType === nm.messageType
                            );
                            if (match) optimisticIdsToRemove.add(match._id);
                        }
                    });

                    const filteredPrev = optimisticIdsToRemove.size > 0 
                        ? prev.filter(m => !optimisticIdsToRemove.has(m._id))
                        : prev;

                    return [...filteredPrev, ...uniqueNew];
                });
                lastMessageTimeRef.current = newMessages[newMessages.length - 1].createdAt;
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const fetchUserHistory = async (telegramId: string) => {
        setHistoryLoading(true);
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const response = await axios.get(`${apiUrl}/api/support/tickets/user/${telegramId}/history`);
            setUserHistory(response.data);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setHistoryLoading(false);
        }
    };

    // Poll messages if a ticket is selected
    useEffect(() => {
        if (!selectedTicket) {
            lastMessageTimeRef.current = null;
            setShowHistory(false);
            return;
        }
        
        fetchMessages(selectedTicket._id, true);
        fetchUserHistory(selectedTicket.telegramId);
        const interval = setInterval(() => fetchMessages(selectedTicket._id), 2000); // Polling faster (2s) for better UX
        return () => clearInterval(interval);
    }, [selectedTicket]);

    const handleResolve = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            await axios.patch(`${apiUrl}/api/support/tickets/${id}/resolve`);
            toast.success('Ticket marked as resolved');
            fetchTickets();
            if (selectedTicket?._id === id) {
                setSelectedTicket(prev => prev ? { ...prev, status: 'resolved' } : null);
            }
        } catch (error) {
            toast.error('Failed to resolve ticket');
        }
    };

    const handleReopen = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            await axios.patch(`${apiUrl}/api/support/tickets/${id}/reopen`);
            toast.success('Ticket reopened');
            fetchTickets();
            if (selectedTicket?._id === id) {
                setSelectedTicket(prev => prev ? { ...prev, status: 'open' } : null);
            }
        } catch (error) {
            toast.error('Failed to reopen ticket');
        }
    };

    const handleDelete = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        if (!confirm('Are you sure you want to delete this ticket?')) return;
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            await axios.delete(`${apiUrl}/api/support/tickets/${id}`);
            toast.success('Ticket deleted');
            if (selectedTicket?._id === id) setSelectedTicket(null);
            fetchTickets();
        } catch (error) {
            toast.error('Failed to delete ticket');
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const content = newMessage.trim();
        if (!selectedTicket || !content || isSending) return;

        setIsSending(true);
        // Optimistic Update
        const tempId = `temp-${Date.now()}`;
        const optimisticMsg: ChatMessage = {
            _id: tempId,
            sender: 'admin',
            content: content,
            messageType: 'text',
            createdAt: new Date().toISOString(),
            isOptimistic: true
        };

        setMessages(prev => [...prev, optimisticMsg]);
        setNewMessage('');
        
        // Reset textarea height
        const textarea = document.querySelector('textarea');
        if (textarea) textarea.style.height = '44px';

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            await axios.post(`${apiUrl}/api/support/tickets/${selectedTicket._id}/messages`, {
                content: content,
                messageType: 'text'
            });
            // Manual fetch to sync status and get real ID faster
            fetchMessages(selectedTicket._id);
        } catch (error) {
            toast.error('Failed to send message');
            // Remove optimistic message on failure
            setMessages(prev => prev.filter(m => m._id !== tempId));
        } finally {
            setIsSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e as unknown as React.FormEvent);
        }
    };

    const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
        const file = e.target.files?.[0];
        if (!file || !selectedTicket) return;

        setUploadingMedia(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
            const uploadRes = await axios.post(`${apiUrl}/api/upload`, formData);
            const mediaUrl = uploadRes.data.url;

            // Optimistic message for media
            const tempId = `temp-media-${Date.now()}`;
            const optimisticMsg: ChatMessage = {
                _id: tempId,
                sender: 'admin',
                content: '',
                messageType: type,
                mediaUrl: mediaUrl,
                createdAt: new Date().toISOString(),
                isOptimistic: true
            };
            setMessages(prev => [...prev, optimisticMsg]);

            await axios.post(`${apiUrl}/api/support/tickets/${selectedTicket._id}/messages`, {
                content: '',
                messageType: type,
                mediaUrl: mediaUrl
            });
            fetchMessages(selectedTicket._id);
        } catch (error) {
            toast.error('Failed to upload media');
        } finally {
            setUploadingMedia(false);
        }
    };

    const filteredTickets = useMemo(() => {
        return tickets
            .filter(ticket => {
                const searchLower = debouncedSearch.toLowerCase();
                const matchesSearch = ticket.name.toLowerCase().includes(searchLower) ||
                    ticket.phoneNumber.includes(debouncedSearch) ||
                    ticket.dafabetId.toLowerCase().includes(searchLower);
                const matchesType = filterType === 'all' || ticket.issueType === filterType;
                const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
                const matchesUnread = !showOnlyUnread || ticket.unreadCount > 0;
                return matchesSearch && matchesType && matchesStatus && matchesUnread;
            })
            .sort((a, b) => {
                // Primary sort: newest activity (updatedAt) first
                return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            });
    }, [tickets, debouncedSearch, filterType, filterStatus, showOnlyUnread]);

    const totalUnread = useMemo(() => tickets.reduce((acc, t) => acc + (t.unreadCount || 0), 0), [tickets]);
    const bgColors = ['bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-rose-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-cyan-500', 'bg-blue-500'];

    const canSeeDepositWithdraw = adminRole === 'superadmin' || permissions.includes('deposit_withdraw');
    const canSeeIdOther = adminRole === 'superadmin' || permissions.includes('id_other');

    return (
        <div className="flex flex-col h-screen h-[100svh] w-full bg-[#f8fafc] text-slate-900 overflow-hidden font-sans selection:bg-indigo-100 selection:text-indigo-900">
            {/* Top Navigation Bar - Premium Glassmorphism */}
            <div className="h-14 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 flex items-center justify-between px-6 shrink-0 z-30 sticky top-0 shadow-[0_1px_3px_0_rgba(0,0,0,0.02)]">
                <div className="flex items-center gap-5">
                    <button 
                        onClick={() => window.location.href = '/dashboard'}
                        className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-blue-600 transition-all active:scale-95 flex items-center gap-2 text-sm font-semibold"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft size={18} strokeWidth={2.5} /> <span className="hidden sm:inline">Dashboard</span>
                    </button>
                    <div className="h-4 w-px bg-slate-200"></div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-base font-bold text-slate-800 tracking-tight">Support Terminal</h1>
                        {totalUnread > 0 && (
                            <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-blue-600/20 ring-2 ring-white">
                                {totalUnread}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden md:flex flex-col items-end">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Status</span>
                        <span className="text-[12px] font-bold text-emerald-500 leading-tight">System Online</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-1 min-h-0 relative">
                {/* Left Side: Tickets List - Sleeker Sidebar */}
                <div className={`w-full md:w-[320px] shrink-0 bg-white border-r border-slate-200 flex flex-col z-20 ${selectedTicket ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-slate-100 space-y-3 bg-white shrink-0">
                        <div className="relative group">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                            <input
                                type="text"
                                placeholder="Search Name, Phone, ID..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all placeholder-slate-400 font-medium"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[12px] font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all appearance-none cursor-pointer"
                                >
                                    <option value="all">Issues</option>
                                    {canSeeDepositWithdraw && <option value="Withdrawal">Withdrawal</option>}
                                    {canSeeDepositWithdraw && <option value="Deposit">Deposit</option>}
                                    {canSeeIdOther && <option value="ID">ID Issue</option>}
                                    {canSeeIdOther && <option value="Other">Other</option>}
                                </select>
                            </div>
                            <button
                                onClick={() => setShowOnlyUnread(!showOnlyUnread)}
                                className={`px-3 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border ${
                                    showOnlyUnread 
                                        ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/20' 
                                        : 'bg-white border-slate-200 text-slate-400 hover:border-slate-300'
                                }`}
                            >
                                Unread
                            </button>
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="w-[85px] bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-[11px] font-black text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/10 appearance-none cursor-pointer text-center"
                            >
                                <option value="open">Open</option>
                                <option value="resolved">Closed</option>
                                <option value="all">Both</option>
                            </select>
                        </div>
                    </div>

                    <div id="ticket-list-container" className="flex-1 overflow-y-auto p-2 space-y-1.5 custom-scrollbar bg-slate-50/20">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-3 opacity-40">
                                <div className="w-8 h-8 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin"></div>
                                <span className="text-[11px] font-bold uppercase tracking-widest">Loading...</span>
                            </div>
                        ) : filteredTickets.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 gap-2 opacity-30">
                                <Search size={40} strokeWidth={1} />
                                <span className="text-[13px] font-medium">No results found</span>
                            </div>
                        ) : (
                            filteredTickets.map(ticket => (
                                <TicketItem 
                                    key={ticket._id} 
                                    ticket={ticket} 
                                    isSelected={selectedTicket?._id === ticket._id} 
                                    bgColors={bgColors}
                                    onClick={() => {
                                        setSelectedTicket(ticket);
                                        setTickets(prev => prev.map(t => t._id === ticket._id ? { ...t, unreadCount: 0 } : t));
                                        lastTicketsRef.current = lastTicketsRef.current.map(t => t._id === ticket._id ? { ...t, unreadCount: 0 } : t);
                                        setMessages([]);
                                        lastMessageTimeRef.current = null;
                                        setIsAtBottom(true);
                                    }}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Right Side: Chat Area - Pure WhatsApp Lite Style */}
                <div className={`flex-1 flex-col bg-[#f1f5f9] min-w-0 relative z-10 ${selectedTicket ? 'flex' : 'hidden md:flex'}`}>
                    {!selectedTicket ? (
                        <>
                            <div className="flex flex-col items-center justify-center h-full w-full px-4 animate-in fade-in duration-1000">
                                <div className="w-24 h-24 bg-white/50 rounded-[40px] flex items-center justify-center mb-8 relative">
                                    <div className="absolute inset-0 bg-indigo-500/5 blur-2xl rounded-full"></div>
                                    <MessageSquare size={40} className="text-slate-400 relative z-10" strokeWidth={1.5} />
                                </div>
                                <h2 className="text-xl font-black text-slate-800">Support Terminal</h2>
                                <p className="text-[13px] text-slate-400 mt-2 max-w-[280px] text-center font-medium leading-relaxed">
                                    Select a user to begin high-speed real-time technical support via Telegram.
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Chat Window Backdrop Pattern */}
                            <div className="absolute inset-0 z-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}></div>
                            
                            {/* Active Ticket Header - Glass */}
                            <div className="h-14 sm:h-16 px-4 sm:px-6 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl shrink-0 flex justify-between items-center z-20 shadow-[0_1px_4px_-1px_rgba(0,0,0,0.03)] sticky top-0">
                                <div className="flex items-center gap-3 sm:gap-4 overflow-hidden">
                                    <button 
                                        onClick={() => setSelectedTicket(null)}
                                        className="p-2 -ml-2 text-slate-400 hover:text-blue-600 transition-colors shrink-0"
                                    >
                                        <ArrowLeft size={20} strokeWidth={2.5} />
                                    </button>
                                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-[14px] sm:text-[16px] text-white shadow-sm shrink-0 ${bgColors[selectedTicket.name.charCodeAt(0) % bgColors.length] || 'bg-blue-500'}`}>
                                        {(selectedTicket.name || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="font-bold text-[14px] sm:text-[15px] text-slate-900 leading-none truncate">
                                            {selectedTicket.name}
                                        </h2>
                                        <div className="flex items-center gap-1.5 mt-1 sm:mt-1.5">
                                            <span className={`flex h-1.5 w-1.5 rounded-full ${selectedTicket.status === 'open' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate">{selectedTicket.status === 'open' ? 'Technical Chat' : 'Closed'}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {selectedTicket.status === 'open' && (
                                        <button 
                                            onClick={() => handleResolve(selectedTicket._id)} 
                                            className="h-10 px-5 text-[12px] font-black uppercase tracking-wider text-white bg-slate-900 hover:bg-black rounded-xl transition-all shadow-lg active:scale-95"
                                        >
                                            End Chat
                                        </button>
                                    )}
                                    {selectedTicket.status === 'resolved' && (
                                        <button 
                                            onClick={() => handleReopen(selectedTicket._id)} 
                                            className="h-10 px-5 text-[12px] font-black uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-lg shadow-blue-600/10"
                                        >
                                            Reopen
                                        </button>
                                    )}
                                    {adminRole === 'superadmin' && (
                                        <button onClick={() => handleDelete(selectedTicket._id)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                                            <Trash2 size={18} strokeWidth={2} />
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            {/* User Context Bar - Scrollable on mobile */}
                            <div className="bg-slate-50 border-b border-slate-200 p-2 sm:p-3 px-4 sm:px-6 shrink-0 z-10 flex items-center overflow-x-auto no-scrollbar gap-x-6">
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Phone</span>
                                    <span className="text-[12px] sm:text-[13px] font-bold text-slate-900 leading-none">{selectedTicket.phoneNumber}</span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">System ID</span>
                                    <span className="text-[12px] sm:text-[13px] font-bold text-slate-900 leading-none font-mono">DFA-{selectedTicket.dafabetId}</span>
                                </div>
                                <button 
                                    onClick={() => setShowHistory(!showHistory)}
                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${
                                        showHistory 
                                            ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' 
                                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                    }`}
                                >
                                    <History size={14} strokeWidth={2.5} /> 
                                    <span>{userHistory.filter(h => h._id !== selectedTicket?._id).length} Past Sessions</span>
                                </button>
                                {selectedTicket.issueType && (
                                    <div className="ml-auto flex items-center gap-2 shrink-0">
                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white shadow-sm border border-slate-200 text-blue-600 uppercase tracking-tighter">{selectedTicket.issueType}</span>
                                    </div>
                                )}
                            </div>

                             {/* Chat Messages */}
                            <div className="flex-1 flex min-h-0 relative">
                                <div 
                                    ref={chatContainerRef}
                                    onScroll={handleScroll}
                                    className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 z-10 relative custom-scrollbar flex flex-col scroll-smooth bg-white"
                                >
                                    {/* ... existing content ... */}
                                    {/* Problem Banner in message list */}
                                    <div className="self-center my-6 max-w-[95%] w-full animate-in fade-in zoom-in duration-500">
                                        <div className="bg-white border-2 border-blue-500/20 px-8 py-6 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>
                                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-500/5 rounded-full -ml-12 -mb-12 blur-xl"></div>
                                            
                                            <div className="flex flex-col items-center gap-3 relative z-10 text-center">
                                                <div className="px-4 py-1.5 bg-blue-50 rounded-full border border-blue-100 flex items-center gap-2.5">
                                                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700">Initial Problem / मुख्य समस्या</span>
                                                    <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></div>
                                                </div>
                                                
                                                <div className="relative">
                                                    <span className="absolute -left-6 -top-2 text-4xl text-blue-100 font-serif">"</span>
                                                    <p className="text-[16px] sm:text-[18px] font-black text-slate-900 leading-relaxed tracking-tight">
                                                        {selectedTicket.problem}
                                                    </p>
                                                    <span className="absolute -right-6 -bottom-4 text-4xl text-blue-100 font-serif">"</span>
                                                </div>
                                                
                                                <div className="h-px w-20 bg-slate-100 mt-2"></div>
                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Submitted via Telegram Support Bot</p>
                                            </div>
                                        </div>
                                    </div>

                                    {messages.map((msg) => (
                                        <MessageBubble key={msg._id} msg={msg} />
                                    ))}
                                    <div ref={messagesEndRef} className="h-2 shrink-0" />
                                </div>

                                {/* History Overlay Sidebar */}
                                {showHistory && (
                                    <div className="absolute inset-y-0 right-0 w-full sm:w-[350px] bg-slate-50/95 backdrop-blur-xl border-l border-slate-200 z-30 shadow-2xl animate-in slide-in-from-right duration-300 overflow-hidden flex flex-col">
                                        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
                                            <div className="flex items-center gap-3">
                                                <History className="text-blue-600" size={20} />
                                                <h3 className="font-black text-slate-900 uppercase tracking-widest text-[13px]">Past Sessions</h3>
                                            </div>
                                            <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
                                                <X size={20} className="text-slate-400" />
                                            </button>
                                        </div>
                                        
                                        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                            {historyLoading ? (
                                                <div className="py-20 flex flex-col items-center justify-center gap-3 opacity-40">
                                                    <div className="w-6 h-6 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin"></div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Fetching History...</span>
                                                </div>
                                            ) : userHistory.filter(h => h._id !== selectedTicket._id).length === 0 ? (
                                                <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-300 grayscale opacity-50">
                                                    <Clock size={40} strokeWidth={1} />
                                                    <span className="text-[11px] font-black uppercase tracking-widest text-center">No Previous History<br/>Found for this user</span>
                                                </div>
                                            ) : (
                                                userHistory.filter(h => h._id !== selectedTicket._id).map((past, i) => (
                                                    <div key={past._id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                                                        <div className="flex items-center justify-between mb-3">
                                                            <span className="text-[9px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 uppercase tracking-widest">
                                                                {past.issueType || 'Other'}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-slate-400">
                                                                {new Date(past.createdAt).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <p className="text-[13px] font-bold text-slate-800 leading-relaxed italic">
                                                            "{past.problem}"
                                                        </p>
                                                        <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg ${past.status === 'resolved' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                                {past.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Floating Scroll to Bottom Button */}
                            {!isAtBottom && messages.length > 0 && (
                                <button 
                                    onClick={() => scrollToBottom()}
                                    className="absolute bottom-28 right-6 z-20 w-10 h-10 rounded-full bg-white shadow-xl border border-slate-100 flex items-center justify-center text-blue-600 animate-bounce active:scale-95"
                                >
                                    <ChevronDown size={20} strokeWidth={3} />
                                </button>
                            )}
                            
                            {/* Input Center Overlay when resolution is processing */}
                            {(isSending || uploadingMedia) && (
                                <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-30 transition-all">
                                     <div className="bg-white/80 backdrop-blur-md px-6 py-2 rounded-full border border-slate-200 shadow-xl flex items-center gap-3">
                                         <div className="w-3 h-3 bg-blue-600 rounded-full animate-ping"></div>
                                         <span className="text-[11px] font-black uppercase tracking-widest text-slate-700">Syncing...</span>
                                     </div>
                                </div>
                            )}

                            {/* Input Area - Sleek floating bar */}
                            <div className="p-4 bg-transparent shrink-0 z-20 sticky bottom-0">
                                {selectedTicket.status === 'resolved' ? (
                                    <div className="flex flex-col items-center justify-center py-4 gap-3 bg-white/60 backdrop-blur-md rounded-3xl border border-slate-200 shadow-lg">
                                        <div className="text-center text-[12px] font-bold text-slate-400 uppercase tracking-widest">Session Closed</div>
                                        <button 
                                            onClick={() => handleReopen(selectedTicket._id)}
                                            className="px-8 py-2.5 bg-blue-600 text-white rounded-full font-black text-[12px] uppercase tracking-wider hover:bg-black transition-all shadow-xl shadow-blue-600/20 active:scale-95"
                                        >
                                            Unarchive chat
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSendMessage} className="max-w-5xl mx-auto flex items-end gap-2 bg-white/90 backdrop-blur-2xl p-2.5 rounded-[32px] border border-slate-200 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] ring-4 ring-slate-100/30">
                                        <div className="flex items-center gap-1">
                                            <label className="w-11 h-11 rounded-full hover:bg-slate-100 text-slate-400 hover:text-blue-600 flex items-center justify-center transition-all shrink-0 cursor-pointer mb-0.5 active:scale-90">
                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleMediaUpload(e, 'photo')} disabled={uploadingMedia} />
                                                <ImageIcon size={22} strokeWidth={2} />
                                            </label>
                                        </div>
                                        <textarea
                                            value={newMessage}
                                            onChange={(e) => {
                                                setNewMessage(e.target.value);
                                                e.target.style.height = 'auto';
                                                e.target.style.height = `${e.target.scrollHeight}px`;
                                            }}
                                            onKeyDown={handleKeyDown}
                                            placeholder={uploadingMedia ? "Uploading to Cloud..." : "Start typing tech support..."}
                                            disabled={uploadingMedia || isSending}
                                            rows={1}
                                            className="flex-1 py-3 px-2 bg-transparent text-[15px] focus:outline-none text-slate-900 transition-all resize-none min-h-[44px] max-h-[160px] overflow-y-auto w-full custom-scrollbar leading-relaxed placeholder-slate-400 font-medium"
                                            style={{ height: '44px' }}
                                        />
                                        <button 
                                            type="submit" 
                                            disabled={!newMessage.trim() || isSending || uploadingMedia}
                                            className="w-11 h-11 rounded-full bg-slate-900 hover:bg-blue-600 disabled:bg-slate-100 disabled:text-slate-300 text-white flex items-center justify-center transition-all shrink-0 mb-0.5 shadow-lg active:scale-90"
                                        >
                                            <Send size={18} strokeWidth={3} className="-ml-1" />
                                        </button>
                                    </form>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
            
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
                
                :root {
                    --font-sans: 'Plus Jakarta Sans', sans-serif;
                }

                * { font-family: var(--font-sans); }

                .custom-scrollbar::-webkit-scrollbar {
                    width: 5px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: #e2e8f0;
                    border-radius: 20px;
                }
                .custom-scrollbar:hover::-webkit-scrollbar-thumb {
                    background-color: #cbd5e1;
                }

                /* WhatsApp-like Tail effect (simplified with CSS for bubbles) */
                .rounded-tr-none {
                    border-bottom-right-radius: 24px;
                    border-top-right-radius: 4px;
                }
                .rounded-tl-none {
                    border-bottom-left-radius: 24px;
                    border-top-left-radius: 4px;
                }
            `}</style>
        </div>
    );
}
