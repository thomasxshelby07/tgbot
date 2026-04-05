import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'DFX Help Center — Video Tutorials & Guides',
    description: 'Watch official DFX help videos, tutorials, and guides. Learn how to use DFX features step by step.',
    openGraph: {
        title: 'DFX Help Center',
        description: 'Official video tutorials and guides for DFX users.',
    },
};

export default function DfxHelpLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
