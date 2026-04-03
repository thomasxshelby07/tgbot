'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Gift, Plus, Trash2, Save, Users, Settings as SettingsIcon, 
    Upload, FileText, ChevronRight, X, List, Hash, Type, Info
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
    phoneNumber: string;
    dafabetId: string;
    answers: { question: string; answer: string }[];
    createdAt: string;
}

export default function GiveawayPage() {
    const [activeTab, setActiveTab] = useState<'setup' | 'participants'>('setup');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    
    const [allGiveaways, setAllGiveaways] = useState<GiveawayConfig[]>([]);
    
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
        fetchAllGiveaways();
        fetchInitialConfig();
    }, []);

    const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

    const fetchAllGiveaways = async () => {
        try {
            const res = await axios.get(`${getApiUrl()}/api/giveaway/all`);
            setAllGiveaways(res.data);
        } catch (error) {
            console.error('Error fetching giveaway list:', error);
        }
    };

    const fetchInitialConfig = async () => {
        try {
            const res = await axios.get(`${getApiUrl()}/api/giveaway`);
            if (res.data._id) {
                setConfig(res.data);
                fetchSubmissions(res.data._id);
            }
        } catch (error) {
            toast.error('Failed to load initial config');
        } finally {
            setLoading(false);
        }
    };

    const fetchSubmissions = async (giveawayId?: string) => {
        const id = giveawayId || config._id;
        if (!id) return;
        try {
            const res = await axios.get(`${getApiUrl()}/api/giveaway/submissions/${id}`);
            setSubmissions(res.data);
        } catch (error) {
            console.error('Error fetching submissions:', error);
        }
    };

    const handleSelectGiveaway = async (giveaway: GiveawayConfig) => {
        setConfig(giveaway);
        fetchSubmissions(giveaway._id);
        setActiveTab('setup');
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await axios.post(`${getApiUrl()}/api/giveaway`, config);
            setConfig(res.data);
            fetchAllGiveaways(); // Refresh list
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
        formData.append('image', file);

        try {
            const res = await axios.post(`${getApiUrl()}/api/upload`, formData);
            setConfig({ ...config, mediaUrl: res.data.url, mediaType: res.data.mediaType || 'photo' });
            toast.success('Media uploaded!');
        } catch (error) {
            toast.error('Upload failed');
        } finally {
            setUploading(false);
        }
    };

    const handleNew = () => {
        if (config._id && !confirm('Are you sure you want to start a new giveaway? Any unsaved changes will be lost.')) return;
        
        setConfig({
            title: '',
            description: '',
            mediaUrl: '',
            mediaType: '',
            active: false,
            questions: [],
            buttonText: '🎁 Giveaway Offer'
        });
        toast('Form cleared! Ready for new giveaway.', { icon: '✨' });
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

    const handleExport = () => {
        if (!config._id) return;
        window.open(`${getApiUrl()}/api/giveaway/export/${config._id}`, '_blank');
    };

    const handleDelete = async () => {
        if (!config._id) return;
        if (!window.confirm('Are you sure you want to delete this giveaway and all its results forever? / क्या आप वाकई इस गिवअवे और इसके सभी डेटा को हमेशा के लिए हटाना चाहते हैं?')) return;
        
        try {
            await axios.delete(`${getApiUrl()}/api/giveaway/${config._id}`);
            toast.success('Giveaway deleted successfully');
            fetchAllGiveaways();
            handleNew();
        } catch (error) {
            toast.error('Failed to delete giveaway');
        }
    };

    const clearSubmissions = async () => {
        if (!config._id) return;
        if (!confirm('Are you sure you want to delete ALL submissions for this giveaway? This cannot be undone.')) return;

        try {
            await axios.delete(`${getApiUrl()}/api/giveaway/submissions/${config._id}`);
            setSubmissions([]);
            toast.success('Submissions cleared');
        } catch (error: any) {
            toast.error(error.response?.data?.error || 'Delete failed');
        }
    };

    if (loading) return <div className="p-8 text-center animate-pulse font-bold">Initializing System...</div>;

    return (
        <div className="max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
            <Toaster position="top-right" />
            
            <Header 
                activeTab={activeTab} 
                setActiveTab={setActiveTab} 
                config={config} 
                handleNew={handleNew} 
            />

            <div className="flex flex-col xl:flex-row gap-8">
                {/* List Sidebar */}
                <div className="xl:w-[350px] space-y-4 shrink-0">
                    <div className="bg-white rounded-[32px] p-6 shadow-sm border border-slate-100 flex flex-col h-[700px]">
                        <div className="flex items-center justify-between mb-6 px-1">
                            <h3 className="font-black text-slate-900 text-[12px] uppercase tracking-[0.2em]">Campaign List</h3>
                            <button onClick={handleNew} className="p-2 bg-slate-900 text-white rounded-xl hover:bg-black transition-all">
                                <Plus size={16}/>
                            </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                            {allGiveaways.map((g) => (
                                <button 
                                    key={g._id}
                                    onClick={() => handleSelectGiveaway(g)}
                                    className={`w-full text-left p-4 rounded-2xl border transition-all group relative ${config._id === g._id ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-600/20' : 'bg-slate-50 border-slate-50 hover:bg-white hover:border-slate-200'}`}
                                >
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center justify-between">
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${config._id === g._id ? 'text-blue-100' : 'text-slate-400'}`}>
                                                {new Date(g as any).toLocaleDateString()}
                                            </span>
                                            {g.active && (
                                                <div className={`w-2 h-2 rounded-full ${config._id === g._id ? 'bg-white animate-pulse' : 'bg-emerald-500 animate-pulse'}`}></div>
                                            )}
                                        </div>
                                        <h4 className={`font-bold text-[14px] truncate ${config._id === g._id ? 'text-white' : 'text-slate-700'}`}>
                                            {g.title || 'Untitled Campaign'}
                                        </h4>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className={`text-[10px] flex items-center gap-1 font-bold ${config._id === g._id ? 'text-blue-200' : 'text-slate-400'}`}>
                                                <List size={10}/> {g.questions.length} steps
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1">
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

                                <div className="flex gap-4">
                                    <button 
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-[0.15em] text-[13px] hover:bg-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-slate-900/10 active:scale-95"
                                    >
                                        {saving ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : <Save size={18}/>}
                                        {saving ? 'Saving...' : config._id ? 'Update Giveaway' : 'Create Giveaway'}
                                    </button>
                                    {config._id && (
                                        <button 
                                            onClick={handleDelete}
                                            className="px-6 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black uppercase tracking-[0.15em] text-[13px] hover:bg-rose-100 transition-all flex items-center justify-center gap-2 border border-rose-100 active:scale-95"
                                            title="Delete Giveaway"
                                        >
                                            <Trash2 size={18}/>
                                        </button>
                                    )}
                                </div>
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
                                            The bot will automatically ask for <span className="font-bold underline">Mobile Number</span>, <span className="font-bold underline">Real Name</span> and <span className="font-bold underline">Dafabet ID</span> after your custom questions.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Participants Tab */
                        <div className="bg-white rounded-[32px] overflow-hidden border border-slate-100 shadow-sm animate-in zoom-in-95 duration-300">
                            <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-black tracking-tight text-slate-900">Participant List</h2>
                                    <p className="text-[12px] text-slate-500 font-medium">Results for: <span className="text-blue-600 underline font-bold">{config.title || 'Selected Campaign'}</span> ({submissions.length} Entries)</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={handleExport}
                                        className="flex items-center gap-2 px-5 py-3 bg-emerald-50 text-emerald-600 rounded-2xl text-[12px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all border border-emerald-100/50"
                                    >
                                        <FileText size={16}/> Export CSV
                                    </button>
                                    <button 
                                        onClick={() => fetchSubmissions()}
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
                                            <th className="px-8 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Phone & ID</th>
                                            <th className="px-8 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Custom Answers</th>
                                            <th className="px-8 py-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {submissions.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-8 py-20 text-center font-bold text-slate-300 uppercase tracking-widest text-[12px]">No submissions found for this campaign</td>
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
                                                        <div className="flex flex-col gap-1">
                                                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-md font-bold text-[11px] w-fit italic">{sub.phoneNumber || 'No Phone'}</span>
                                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md font-black text-[11px] w-fit">{sub.dafabetId}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-8 py-5">
                                                        <div className="space-y-1">
                                                            {sub.answers.map((ans, idx) => (
                                                                <div key={idx} className="text-[11px] flex items-center gap-1.5">
                                                                    <span className="text-slate-400 font-bold">{ans.question.substring(0, 20)}...:</span>
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
            </div>
        </div>
    );
}

// Sub-components
function Header({ 
    activeTab, 
    setActiveTab, 
    config, 
    handleNew 
}: { 
    activeTab: 'setup' | 'participants', 
    setActiveTab: (t: 'setup' | 'participants') => void,
    config: GiveawayConfig,
    handleNew: () => void
}) {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center text-white shadow-xl shadow-black/10">
                        <Gift size={22} />
                    </div>
                    Giveaway System
                </h1>
                <div className="flex items-center gap-4 mt-1">
                    <p className="text-[13px] text-slate-400 font-semibold">{config._id ? `Editing: ${config.title}` : 'Creating New Funnel'}</p>
                    {config._id && (
                        <button 
                            onClick={handleNew}
                            className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-lg font-black uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-1"
                        >
                            <Plus size={10} strokeWidth={4}/> New Giveaway
                        </button>
                    )}
                </div>
            </div>
            
            <div className="flex bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm shadow-blue-500/5">
                <TabButton active={activeTab === 'setup'} onClick={() => setActiveTab('setup')} icon={<SettingsIcon size={16}/>} label="Configuration" />
                <TabButton active={activeTab === 'participants'} onClick={() => setActiveTab('participants')} icon={<Users size={16}/>} label="Participants" />
            </div>
        </div>
    );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
    return (
        <button onClick={onClick} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[12px] font-black uppercase tracking-widest transition-all ${active ? 'bg-slate-900 text-white shadow-lg shadow-black/10' : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50'}`}>
            {icon} {label}
        </button>
    );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode, title: string }) {
    return (
        <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center">
                {icon}
            </div>
            <h3 className="font-black text-slate-900 text-[14px] uppercase tracking-wider">{title}</h3>
        </div>
    );
}

function InputGroup({ label, value, onChange, placeholder }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string }) {
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

function QuestionCard({ index, question, onUpdate, onRemove }: { index: number, question: Question, onUpdate: (i: number, k: keyof Question, v: any) => void, onRemove: (i: number) => void }) {
    return (
        <div className="p-6 bg-slate-50/50 rounded-[24px] border border-slate-100 space-y-4 group/q relative animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-600 text-white text-[10px] font-black flex items-center justify-center shadow-md shadow-blue-600/20">{index + 1}</span>
                    <select 
                        value={question.type} 
                        onChange={(e) => onUpdate(index, 'type', e.target.value as any)}
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
                                    const next = question.options.filter((_, i) => i !== oi);
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
                                    const val = (e.currentTarget as HTMLInputElement).value;
                                    if(val) {
                                        onUpdate(index, 'options', [...question.options, val]);
                                        (e.currentTarget as HTMLInputElement).value = '';
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

function MediaUpload({ url, type, setUrl, setType, onUpload, uploading }: { url: string, type: 'photo' | 'video' | 'audio' | '', setUrl: (v: string) => void, setType: (v: 'photo' | 'video' | 'audio' | '') => void, onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void, uploading: boolean }) {
    return (
        <div className="space-y-2">
            <label className="text-[11px] font-black uppercase tracking-widest text-slate-400 ml-1">Media Attachment / मीडिया</label>
            <div className="flex gap-3 mb-3">
                {['photo', 'video', 'audio'].map((t) => (
                    <button 
                        key={t}
                        onClick={() => setType(t as 'photo' | 'video' | 'audio')}
                        type="button"
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

function StatusToggle({ active, onToggle }: { active: boolean, onToggle: () => void }) {
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
