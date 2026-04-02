'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Users,
    Send,
    Settings,
    FileText,
    LogOut,
    MessageSquare,
    MessageCircle,
    Radio,
    Star,
    LifeBuoy,
    Menu as MenuIcon,
    Tv,
    X
} from 'lucide-react';

interface SidebarProps {
    isOpen?: boolean;
    onClose?: () => void;
    adminRole?: { role: string; permissions: string[] } | null;
}

const Sidebar = ({ isOpen, onClose, adminRole }: SidebarProps) => {
    const pathname = usePathname();
    const router = useRouter();

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Channels', href: '/dashboard/channels', icon: Radio },
        { name: 'Channel Welcome', href: '/dashboard/welcome-messages', icon: Tv },
        { name: 'Default Welcome', href: '/dashboard/welcome', icon: MessageSquare },
        { name: 'VIP Members', href: '/dashboard/vip', icon: Star },
        { name: 'Support Tickets', href: '/dashboard/support', icon: LifeBuoy },
        { name: 'Menu Buttons', href: '/dashboard/menu', icon: MenuIcon },
        { name: 'Broadcast', href: '/dashboard/broadcast', icon: Send },
        { name: 'Users', href: '/dashboard/users', icon: Users },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
        { name: 'Logs', href: '/dashboard/logs', icon: FileText },
        { name: 'Admins', href: '/dashboard/admins', icon: Users },
    ].filter(item => {
        if (!adminRole) return false;
        if (adminRole.role === 'superadmin') return true;
        
        // Normal admin only gets Support Tickets
        if (item.name === 'Support Tickets') return true;
        
        return false;
    });

    const handleLogout = () => {
        localStorage.removeItem('bot_admin_token');
        router.push('/login');
    };

    return (
        <aside 
            className={`
                h-screen w-64 bg-white border-r border-zinc-200 flex flex-col fixed left-0 top-0 overflow-y-auto z-50 transition-transform duration-300
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}
        >
            <div className="p-6 flex items-center justify-between border-b border-zinc-100">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <Send size={16} className="text-white ml-0.5" />
                    </div>
                    <h1 className="text-lg font-bold text-zinc-900 tracking-tight">
                        Bot Admin
                    </h1>
                </div>
                {/* Mobile Close Button */}
                <button onClick={onClose} className="lg:hidden p-2 text-zinc-400 hover:text-zinc-600 transition-colors">
                    <X size={20} />
                </button>
            </div>
 
            <nav className="flex-1 px-3 py-6">
                <p className="px-3 text-[10px] font-bold text-zinc-400 uppercase tracking-[0.1em] mb-4">Main Menu</p>
                <ul className="space-y-1">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;
 
                        return (
                            <li key={item.name}>
                                <Link
                                    href={item.href}
                                    onClick={onClose}
                                    className={`
                                        flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group
                                        ${isActive
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                                            : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
                                        }
                                    `}
                                >
                                    <Icon size={18} className={`transition-colors duration-200 ${isActive ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-600'}`} />
                                    <span>{item.name}</span>
                                    {isActive && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/40" />
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
 
            <div className="p-4 border-t border-zinc-100 bg-zinc-50/50">
                <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 w-full rounded-xl text-sm font-semibold text-zinc-500 hover:bg-red-50 hover:text-red-600 transition-all group">
                    <LogOut size={18} className="group-hover:text-red-500 transition-colors" />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
