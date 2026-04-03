'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Gift, Plus, Trash2, Save, Users, Settings as SettingsIcon, 
    Upload, FileText, ChevronRight, X, List, Hash, Type
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';

interface Question {
    question: string;
    type: 'text' | 'options';
    options: string[];
}

interface GiveawayConfig {
    _id?: string;
    title: string;
    description: string;
    mediaUrl: string;
    mediaType: 'photo' | 'video' | 'audio' | '';
    active: boolean;
    questions: Question[];
    buttonText: string;
}

interface Submission {
    _id: string;
    telegramId: string;
    firstName: string;
    username?: string;
    realName: string;
    dafabetId: string;
    answers: { question: string; answer: string }[];
    createdAt: string;
}

export default function GiveawayPage() {
    const [activeTab, setActiveTab] = useState<'setup' | 'participants'>('setup');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    
    const [config, setConfig] = useState<GiveawayConfig>({
        title: '',
        description: '',
        mediaUrl: '',
        mediaType: '',
        active: false,
        questions: [],
        buttonText: '🎁 Giveaway Offer'
    });
    
    const [submissions, setSubmissions] = useState<Submission[]>([]);

    useEffect(() => {
        fetchConfig();
        fetchSubmissions();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await axios.get('/api/giveaway');
            if (res.data._id) setConfig(res.data);
        } catch (error) {
            toast.error('Failed to load giveaway config');
        } finally {
            setLoading(false);
        }
    };

    const fetchSubmissions = async () => {
        try {
            const res = await axios.get('/api/giveaway/submissions');
            setSubmissions(res.data);
        } catch (error) {
            console.error('Error fetching submissions:', error);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await axios.post('/api/giveaway', config);
            setConfig(res.data);
            toast.success('Giveaway configuration saved successfully!');
        } catch (error) {
            toast.error('Failed to save giveaway');
        } finally {
            setSaving(false);
        }
    };

    const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await axios.post('/api/upload', formData);
            setConfig({ ...config, mediaUrl: res.data.url });
            toast.success('Media uploaded!');
        } catch (error) {
            toast.error('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const addQuestion = () => {
        setConfig({
            ...config,
            questions: [...config.questions, { question: '', type: 'text', options: [] }]
        });
    };

    const removeQuestion = (index: number) => {
        setConfig({
            ...config,
            questions: config.questions.filter((_, i) => i !== index)
        });
    };

    const updateQuestion = (index: number, key: keyof Question, value: any) => {
        const newQs = [...config.questions];
        newQs[index] = { ...newQs[index], [key]: value };
        setConfig({ ...config, questions: newQs });
    };

    const clearSubmissions = async () => {
        if (!config._id) return;
        if (!confirm('Are you sure you want to delete ALL submissions for this giveaway? This cannot be undone.')) return;

        try {
            await axios.delete(`/api/giveaway/submissions/${config._id}`);
            setSubmissions([]);
            toast.success('Submissions cleared');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Delete failed');
        }
    };

    if (loading) return <div className="p-8 text-center animate-pulse font-bold">Initializing System...</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
            <Toaster position="top-right" />
            
            <Header activeTab={activeTab} setActiveTab={setActiveTab} />

            {activeTab === 'setup' ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Basic Settings */}
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 space-y-6">
                        <SectionTitle icon={<SettingsIcon size={18}/>} title="General Configuration" />
                        
                        <div className="space-y-4">
                            <InputGroup label="Giveaway Title" value={config.title} onChange={(v) => setConfig({...config, title: v})} placeholder="e.g., Weekly IPL Raffle" />
                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Bot Button Text / बटन टेक्स्ट</label>
                                <input 
                                    value={config.buttonText} 
                                    onChange={(e) => setConfig({...config, buttonText: e.target.value})}
                                    className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 focus:bg-white outline-none transition-all font-bold text-blue-600"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Description / विवरण</label>
                                <textarea 
                                    value={config.description} 
                                    onChange={(e) => setConfig({...config, description: e.target.value})}
                                    rows={4}
                                    className="w-full p-5 bg-slate-50 rounded-2xl border border-slate-100 focus:bg-white outline-none transition-all resize-none text-[14px]"
                                    placeholder="Tell users what they can win..."
                                />
                            </div>

                            <MediaUpload 
                                url={config.mediaUrl} 
                                type={config.mediaType} 
                                setUrl={(v) => setConfig({...config, mediaUrl: v})} 
                                setType={(v) => setConfig({...config, mediaType: v})}
                                onUpload={handleMediaUpload}
                                uploading={uploading}
                            />

                            <StatusToggle active={config.active} onToggle={() => setConfig({...config, active: !config.active})} />
                        </div>

                        <button 
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.15em] text-[13px] hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 active:scale-95"
                        >
                            {saving ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Save size={18}/>}
                            {saving ? 'Synchronizing...' : 'Save Configuration'}
                        </button>
                    </div>

                    {/* Questions Flow */}
                    <div className="bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 flex flex-col">
                        <div className="flex items-center justify-between mb-8">
                            <SectionTitle icon={<List size={18}/>} title="Question Funnel" />
                            <button onClick={addQuestion} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-[12px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all">
                                <Plus size={16}/> Add Question
                            </button>
                        </div>

                        <div className="flex-1 space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {config.questions.length === 0 && (
                                <div className="h-64 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center text-slate-300 gap-3 grayscale opacity-60">
                                    <List size={48} strokeWidth={1}/>
                                    <p className="font-bold uppercase tracking-widest text-[11px]">No custom questions added</p>
                                </div>
                            )}
                            {config.questions.map((q, i) => (
                                <QuestionCard 
                                    key={i} 
                                    index={i} 
                                    question={q} 
                                    onUpdate={updateQuestion} 
                                    onRemove={removeQuestion}
                                />
                            ))}
                        </div>
                        
                        <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                            <div className="flex gap-3">
                                <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
                                <p className="text-[12px] text-amber-900 font-medium leading-relaxed">
                                    The bot will automatically ask for <span className="font-bold underline">Real Name</span> and <span className="font-bold underline">Dafabet ID</span> after your custom questions.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Participants Tab */
                <div className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm">
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-black tracking-tight text-slate-900">Participant List</h2>
                            <p className="text-[12px] text-slate-500 font-medium">Total Entries: {submissions.length}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={fetchSubmissions}
                                className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all border border-slate-100 hover:shadow-sm"
                            >
                                <ChevronRight className="rotate-90" size={20}/>
                            </button>
                            <button 
                                onClick={clearSubmissions}
                                className="flex items-center gap-2 px-5 py-3 bg-rose-50 text-rose-600 rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all border border-rose-100/50"
                            >
                                <Trash2 size={16}/> Clear List
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-8 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400">User Details</th>
                                    <th className="px-8 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Dafabet ID</th>
                                    <th className="px-8 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Answers</th>
                                    <th className="px-8 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {submissions.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center font-bold text-slate-300 uppercase tracking-widest text-[12px]">No submissions found</td>
                                    </tr>
                                ) : (
                                    submissions.map((sub) => (
                                        <tr key={sub._id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900">{sub.realName || sub.firstName}</span>
                                                    <span className="text-[11px] text-slate-400 font-mono">@{sub.username || sub.telegramId}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg font-black text-[12px]">{sub.dafabetId}</span>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="space-y-1">
                                                    {sub.answers.map((ans, idx) => (
                                                        <div key={idx} className="text-[11px] flex items-center gap-1.5">
                                                            <span className="text-slate-400 font-bold">{ans.question}:</span>
                                                            <span className="text-slate-700 font-medium">{ans.answer}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-[11px] font-medium text-slate-400">
                                                {new Date(sub.createdAt).toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

// Sub-components
function Header({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: any) => void }) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center text-white shadow-xl shadow-black/10">
                        <Gift size={22} />
                    </div>
                    Giveaway System
                </h1>
                <p className="text-[13px] text-slate-400 font-semibold mt-1">Configure user funnels and manage rewards.</p>
            </div>
            
            <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm shadow-blue-500/5">
                <TabButton active={activeTab === 'setup'} onClick={() => setActiveTab('setup')} icon={<SettingsIcon size={16}/>} label="Configuration" />
                <TabButton active={activeTab === 'participants'} onClick={() => setActiveTab('participants')} icon={<Users size={16}/>} label="Participants" />
            </div>
        </div>
    );
}

function TabButton({ active, onClick, icon, label }: any) {
    return (
        <button onClick={onClick} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all ${active ? 'bg-slate-900 text-white shadow-lg shadow-black/10' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}>
            {icon} {label}
        </button>
    );
}

function SectionTitle({ icon, title }: any) {
    return (
        <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center">
                {icon}
            </div>
            <h3 className="font-black text-slate-900 text-[14px] uppercase tracking-wider">{title}</h3>
        </div>
    );
}

function InputGroup({ label, value, onChange, placeholder }: any) {
    return (
        <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">{label} / नाम</label>
            <input 
                value={value} 
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full p-4 bg-slate-50 rounded-2xl border border-slate-100 focus:bg-white focus:ring-4 focus:ring-blue-500/5 focus:border-blue-500 outline-none transition-all font-bold text-slate-700 placeholder-slate-300 shadow-inner"
            />
        </div>
    );
}

function QuestionCard({ index, question, onUpdate, onRemove }: any) {
    return (
        <div className="p-6 bg-slate-50/50 rounded-[24px] border border-slate-100 space-y-4 group/q relative animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-[10px] font-black flex items-center justify-center shadow-md shadow-blue-600/20">{index + 1}</span>
                    <select 
                        value={question.type} 
                        onChange={(e) => onUpdate(index, 'type', e.target.value)}
                        className="bg-transparent text-[11px] font-black uppercase tracking-widest text-slate-400 outline-none cursor-pointer hover:text-slate-900 transition-colors"
                    >
                        <option value="text">✎ Text Input</option>
                        <option value="options">🔘 Options</option>
                    </select>
                </div>
                <button onClick={() => onRemove(index)} className="p-2 text-slate-300 hover:text-rose-500 transition-all opacity-0 group-hover/q:opacity-100">
                    <Trash2 size={16}/>
                </button>
            </div>
            
            <input 
                value={question.question}
                onChange={(e) => onUpdate(index, 'question', e.target.value)}
                className="w-full p-3 bg-white rounded-xl border border-slate-100 font-bold text-[14px] outline-none focus:ring-2 focus:ring-blue-500/10 placeholder-slate-200"
                placeholder="Type your question..."
            />

            {question.type === 'options' && (
                <div className="space-y-2 mt-2 pl-4 border-l-2 border-blue-100">
                    <div className="flex flex-wrap gap-2">
                        {question.options.map((opt: string, oi: number) => (
                            <div key={oi} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                                <span className="text-[12px] font-bold text-slate-700">{opt}</span>
                                <button onClick={() => {
                                    const next = question.options.filter((_: any, i: any) => i !== oi);
                                    onUpdate(index, 'options', next);
                                }} className="text-slate-300 hover:text-rose-500">
                                    <X size={12}/>
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <input 
                            placeholder="Add option..."
                            className="bg-white border text-[12px] px-3 py-1.5 rounded-lg outline-none w-32 font-medium"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const val = (e.target as any).value;
                                    if(val) {
                                        onUpdate(index, 'options', [...question.options, val]);
                                        (e.target as any).value = '';
                                    }
                                }
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

function MediaUpload({ url, type, setUrl, setType, onUpload, uploading }: any) {
    return (
        <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Media Attachment / मीडिया</label>
            <div className="flex gap-3 mb-3">
                {['photo', 'video', 'audio'].map((t) => (
                    <button 
                        key={t}
                        onClick={() => setType(t)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${type === t ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                    >
                        {t}
                    </button>
                ))}
            </div>
            <div className="relative group">
                <label className={`w-full h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${url ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100'}`}>
                    <Upload size={20} className={url ? 'text-emerald-500' : 'text-slate-300'} />
                    <span className="text-[11px] font-bold text-slate-500">{uploading ? 'Processing...' : url ? 'File Attached✓' : 'Click to Upload'}</span>
                    <input type="file" className="hidden" onChange={onUpload} accept={type === 'photo' ? 'image/*' : type === 'video' ? 'video/*' : 'audio/*'} disabled={!type || uploading}/>
                </label>
                {url && (
                    <button onClick={() => setUrl('')} className="absolute -top-2 -right-2 w-7 h-7 bg-white rounded-full border border-slate-100 text-rose-500 flex items-center justify-center shadow-lg hover:bg-rose-500 hover:text-white transition-all">
                        <X size={14}/>
                    </button>
                )}
            </div>
        </div>
    );
}

function StatusToggle({ active, onToggle }: any) {
    return (
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                <span className="text-[13px] font-black uppercase tracking-widest text-slate-700">Giveaway Status</span>
            </div>
            <button 
                onClick={onToggle}
                className={`w-14 h-8 rounded-full relative transition-all duration-300 px-1 ${active ? 'bg-emerald-500' : 'bg-slate-300'}`}
            >
                <div className={`w-6 h-6 bg-white rounded-full transition-transform duration-300 ${active ? 'translate-x-[24px]' : 'translate-x-0'} shadow-sm`}></div>
            </button>
        </div>
    );
}
