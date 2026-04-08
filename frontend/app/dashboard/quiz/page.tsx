'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Plus, Trash2, Send, List, Server,
    X, Info, BarChart2, MessageCircle
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

interface QuizResult {
    option: string;
    votes: number;
}

interface Quiz {
    _id: string;
    question: string;
    options: string[];
    status: 'active' | 'closed';
    totalBroadcasted: number;
    results?: QuizResult[];
    createdAt: string;
}

export default function QuizPage() {
    const [activeTab, setActiveTab] = useState<'create' | 'results'>('create');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    
    // Form state
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState<string[]>(['', '']);

    useEffect(() => {
        fetchQuizzes();
    }, []);

    const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    const fetchQuizzes = async () => {
        try {
            setLoading(true);
            const res = await axios.get(`${getApiUrl()}/api/quiz`);
            setQuizzes(res.data);
        } catch (error) {
            console.error('Error fetching quizzes:', error);
            toast.error('Failed to load quizzes');
        } finally {
            setLoading(false);
        }
    };

    const addOption = () => {
        if (options.length >= 6) {
            toast.error('Maximum 6 options allowed in Telegram inline keyboards safely.');
            return;
        }
        setOptions([...options, '']);
    };

    const updateOption = (index: number, val: string) => {
        const newOpts = [...options];
        newOpts[index] = val;
        setOptions(newOpts);
    };

    const removeOption = (index: number) => {
        if (options.length <= 2) {
            toast.error('A quiz must have at least 2 options.');
            return;
        }
        setOptions(options.filter((_, i) => i !== index));
    };

    const handleCreateAndBroadcast = async () => {
        if (!question.trim()) return toast.error('Question is required');
        const validOptions = options.map(o => o.trim()).filter(o => o !== '');
        if (validOptions.length < 2) return toast.error('At least 2 valid options are required');

        setSubmitting(true);
        try {
            // 1. Create Quiz
            const createRes = await axios.post(`${getApiUrl()}/api/quiz`, {
                question,
                options: validOptions
            });

            const newQuiz = createRes.data;

            // 2. Broadcast Quiz
            const broadcastRes = await axios.post(`${getApiUrl()}/api/quiz/${newQuiz._id}/broadcast`);
            
            toast.success(`Quiz Broadcasted to ${broadcastRes.data.queued} users!`);
            
            // Reset Form
            setQuestion('');
            setOptions(['', '']);
            setActiveTab('results');
            fetchQuizzes();

        } catch (error) {
            console.error('Error creating quiz:', error);
            toast.error('Failed to broadcast quiz');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteQuiz = async (id: string) => {
        if (!confirm('Are you sure you want to delete this quiz and all its results?')) return;
        
        try {
            await axios.delete(`${getApiUrl()}/api/quiz/${id}`);
            toast.success('Quiz deleted');
            fetchQuizzes();
        } catch (error) {
            toast.error('Failed to delete quiz');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans selection:bg-blue-500/30">
            <Toaster position="top-center" />
            
            <div className="max-w-[1200px] mx-auto space-y-8">
                {/* Header Phase */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                                <MessageCircle size={22} />
                            </div>
                            Quiz Broadcasts
                        </h1>
                        <p className="text-[13px] text-slate-400 font-semibold mt-1">Send polls via inline buttons and track votes live.</p>
                    </div>
                    
                    <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm shadow-indigo-500/5">
                        <button onClick={() => setActiveTab('create')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all ${activeTab === 'create' ? 'bg-slate-900 text-white shadow-lg shadow-black/10' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}>
                            <Plus size={16}/> Create Quiz
                        </button>
                        <button onClick={() => setActiveTab('results')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all ${activeTab === 'results' ? 'bg-slate-900 text-white shadow-lg shadow-black/10' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}>
                            <BarChart2 size={16}/> Live Results
                        </button>
                    </div>
                </div>

                {activeTab === 'create' ? (
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 max-w-3xl mx-auto space-y-8 animate-in zoom-in-95 duration-300">
                        
                        <div className="space-y-2">
                            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Quiz Question</label>
                            <textarea 
                                value={question} 
                                onChange={(e) => setQuestion(e.target.value)}
                                rows={3}
                                className="w-full p-5 bg-slate-50 rounded-2xl border border-slate-100 focus:bg-white outline-none transition-all resize-none font-bold text-[15px]"
                                placeholder="E.g., Who will win today's match?"
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Options (Max 6)</label>
                                <button onClick={addOption} className="text-[11px] font-black uppercase bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg flex items-center gap-1 hover:bg-indigo-100 transition-colors">
                                    <Plus size={14}/> Add Option
                                </button>
                            </div>

                            <div className="space-y-3">
                                {options.map((opt, i) => (
                                    <div key={i} className="flex relative items-center gap-3 group">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-black text-[12px] shrink-0 border border-slate-200">
                                            {i + 1}
                                        </div>
                                        <input 
                                            value={opt}
                                            onChange={(e) => updateOption(i, e.target.value)}
                                            placeholder={`Option ${i + 1}`}
                                            className="flex-1 p-4 bg-white rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-medium text-[14px]"
                                        />
                                        <button 
                                            onClick={() => removeOption(i)}
                                            className="absolute right-4 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <X size={18}/>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                            <div className="flex gap-3">
                                <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
                                <p className="text-[12px] text-amber-900 font-medium leading-relaxed">
                                    Clicking Broadcast will immediately send this quiz as an inline button message to ALL active bot users.
                                </p>
                            </div>
                        </div>

                        <button 
                            onClick={handleCreateAndBroadcast}
                            disabled={submitting}
                            className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.15em] text-[13px] hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95"
                        >
                            {submitting ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Send size={18}/>}
                            {submitting ? 'Broadcasting...' : 'Broadcast Quiz Now'}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in zoom-in-95 duration-300">
                        {loading && <div className="col-span-full py-10 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Loading Results...</div>}
                        
                        {!loading && quizzes.length === 0 && (
                            <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-300 bg-white rounded-3xl border border-slate-100 border-dashed">
                                <Server size={48} strokeWidth={1} className="mb-4 opacity-50"/>
                                <p className="font-bold uppercase tracking-widest text-[12px]">No Quiz Broadcasts Found</p>
                            </div>
                        )}

                        {quizzes.map((quiz) => {
                            const totalVotes = quiz.results?.reduce((sum, r) => sum + r.votes, 0) || 0;
                            
                            return (
                                <div key={quiz._id} className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 flex flex-col relative overflow-hidden group">
                                    
                                    <button 
                                        onClick={() => handleDeleteQuiz(quiz._id)}
                                        className="absolute top-6 right-6 p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={18}/>
                                    </button>

                                    <div className="mb-6 pr-8">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            {new Date(quiz.createdAt).toLocaleDateString()} at {new Date(quiz.createdAt).toLocaleTimeString()}
                                        </span>
                                        <h3 className="text-lg font-bold text-slate-900 mt-2 leading-snug">{quiz.question}</h3>
                                    </div>

                                    <div className="space-y-4 flex-1">
                                        {quiz.results?.map((res, i) => {
                                            const percentage = totalVotes === 0 ? 0 : Math.round((res.votes / totalVotes) * 100);
                                            return (
                                                <div key={i} className="relative">
                                                    <div className="flex items-center justify-between text-[12px] font-bold mb-1.5 relative z-10 px-2">
                                                        <span className="text-slate-700">{res.option}</span>
                                                        <span className="text-slate-500">{res.votes} votes ({percentage}%)</span>
                                                    </div>
                                                    <div className="h-8 w-full bg-slate-50 rounded-lg overflow-hidden relative">
                                                        <div 
                                                            className="absolute top-0 left-0 h-full bg-indigo-100/50 transition-all duration-1000 ease-out"
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-slate-400">
                                        <span>Total Votes: <span className="text-indigo-600">{totalVotes}</span></span>
                                        <span>Sent To: <span className="text-slate-700">{quiz.totalBroadcasted}</span></span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
