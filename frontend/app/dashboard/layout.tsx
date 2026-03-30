'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { Menu, X } from 'lucide-react';
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
    const isChatPage = pathname === '/dashboard/chat';

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

        // Verify token via API
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        axios.get(`${apiUrl}/api/auth/me`)
            .then(res => {
                setAdminRole({ role: res.data.role, permissions: res.data.permissions });
                setIsAuthenticated(true);
            })
            .catch(() => {
                setIsAuthenticated(false);
            });

        return () => {
            axios.interceptors.request.eject(requestInterceptor);
            axios.interceptors.response.eject(responseInterceptor);
        };
    }, [router]);

    if (!isAuthenticated) {
        return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-white"><span className="animate-pulse">Loading Dashboard...</span></div>;
    }

    return (
        <div className={`flex h-screen bg-zinc-50 dark:bg-zinc-950 transition-colors duration-300 ${isChatPage ? 'overflow-hidden' : ''}`}>
            {/* Mobile Header */}
            {!isChatPage && (
                <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-zinc-900 border-b border-zinc-800 z-40 flex items-center px-4 justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg\">
                            <span className="text-white font-black text-xs">B</span>
                        </div>
                        <span className="text-white font-bold">Bot Admin</span>
                    </div>
                    <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 text-zinc-400 hover:text-white transition-colors"
                    >
                        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </header>
            )}

            {/* Sidebar Overlay */}
            {!isChatPage && isSidebarOpen && (
                <div 
                    className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {!isChatPage && <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} adminRole={adminRole} />}
            
            <main className={`flex-1 ${!isChatPage ? 'lg:ml-64 p-4 lg:p-8 pt-20 lg:pt-8' : 'w-full'} overflow-y-auto w-full text-zinc-900 dark:text-zinc-100 transition-all duration-300 min-h-screen`}>
                <div className={`mx-auto h-full w-full ${!isChatPage ? 'max-w-7xl' : ''}`}>
                    {children}
                </div>
            </main>
        </div>
    );
}
