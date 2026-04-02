'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { Menu, X, Send } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import axios from 'axios';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [adminRole, setAdminRole] = useState<{role: string, permissions: string[]} | null>(null);
    const pathname = usePathname();
    const router = useRouter();
    const isStandalonePage = pathname === '/dashboard/chat' || pathname === '/dashboard/support';

    useEffect(() => {
        const token = localStorage.getItem('bot_admin_token');
        if (!token) {
            router.push('/login');
            return;
        }

        // Setup Axios Interceptors
        const requestInterceptor = axios.interceptors.request.use((config) => {
            config.headers.Authorization = `Bearer ${token}`;
            return config;
        });

        const responseInterceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401 || error.response?.status === 403) {
                    localStorage.removeItem('bot_admin_token');
                    router.push('/login');
                }
                return Promise.reject(error);
            }
        );

        // Verify token locally for instant rendering
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setAdminRole({ role: payload.role, permissions: payload.permissions || [] });
            setIsAuthenticated(true);
        } catch (e) {
            localStorage.removeItem('bot_admin_token');
            router.push('/login');
            return;
        }

        return () => {
            axios.interceptors.request.eject(requestInterceptor);
            axios.interceptors.response.eject(responseInterceptor);
        };
    }, [router]);

    if (!isAuthenticated) {
        return <div className="min-h-screen bg-white flex items-center justify-center text-slate-900"><span className="animate-pulse font-bold tracking-tighter">Loading...</span></div>;
    }

    return (
        <div className={`flex h-screen bg-slate-50 transition-colors duration-300 ${isStandalonePage ? 'overflow-hidden' : ''}`}>
            {/* Mobile Header */}
            {!isStandalonePage && (
                <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-40 flex items-center px-4 justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Send size={18} className="text-white" />
                        </div>
                        <span className="text-slate-900 font-bold tracking-tight">Bot Admin</span>
                    </div>
                    <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 text-slate-400 hover:text-blue-600 transition-colors"
                    >
                        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </header>
            )}

            {/* Sidebar Overlay */}
            {!isStandalonePage && isSidebarOpen && (
                <div 
                    className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {!isStandalonePage && <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} adminRole={adminRole} />}
            
            <main className={`flex-1 ${!isStandalonePage ? 'lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8' : 'w-full'} overflow-y-auto w-full text-slate-900 transition-all duration-300 min-h-screen`}>
                <div className={`mx-auto h-full w-full ${!isStandalonePage ? 'max-w-7xl' : ''}`}>
                    {children}
                </div>
            </main>
        </div>
    );
}
