import ClientPage from './ClientPage';

export const revalidate = 30; // ISR cache expiration

export default async function DfxHelpPageServer() {
    let videos = [];
    let settings = null;
    
    try {
        const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
        const res = await fetch(`${API}/api/dfxhelp`, { next: { revalidate: 30 } });
        if (res.ok) {
            const data = await res.json();
            videos = data.videos || [];
            settings = data.settings || null;
        }
    } catch (e) {
        console.error("Failed to fetch dfxhelp SSR data", e);
    }
    
    return <ClientPage initialVideos={videos} initialSettings={settings} />;
}
