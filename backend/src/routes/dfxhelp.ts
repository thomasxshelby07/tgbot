import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { HelpVideo } from '../models/HelpVideo';

export const dfxHelpRoutes = async (fastify: FastifyInstance) => {
    // ─── PUBLIC: Get all active videos (no auth required) ─────────────────────
    fastify.get('/api/dfxhelp', async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const videos = await HelpVideo.find({ isActive: true }).sort({ order: 1, createdAt: 1 });
            return reply.send({ success: true, videos });
        } catch (error) {
            console.error('Error fetching help videos:', error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });
};

export const dfxHelpAdminRoutes = async (fastify: FastifyInstance) => {
    // ─── ADMIN: Get all videos (including inactive) ────────────────────────────
    fastify.get('/api/dfxhelp/admin', async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const admin = (req as any).admin;
            if (admin.role !== 'superadmin') {
                return reply.status(403).send({ error: 'Forbidden: Super Admin only' });
            }
            const videos = await HelpVideo.find().sort({ order: 1, createdAt: 1 });
            return reply.send({ success: true, videos });
        } catch (error) {
            console.error('Error fetching all help videos:', error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // ─── ADMIN: Create a new video ─────────────────────────────────────────────
    fastify.post(
        '/api/dfxhelp',
        async (
            req: FastifyRequest<{
                Body: {
                    title: string;
                    description?: string;
                    videoUrl: string;
                    thumbnailUrl?: string;
                    category?: 'hindi' | 'english';
                    buttonLabel?: string;
                    buttonUrl?: string;
                    order?: number;
                };
            }>,
            reply: FastifyReply
        ) => {
            try {
                const admin = (req as any).admin;
                if (admin.role !== 'superadmin') {
                    return reply.status(403).send({ error: 'Forbidden: Super Admin only' });
                }

                const { title, description, videoUrl, thumbnailUrl, category, buttonLabel, buttonUrl, order } = req.body;

                if (!title || !videoUrl) {
                    return reply.status(400).send({ error: 'Title and videoUrl are required' });
                }

                const maxOrderVideo = await HelpVideo.findOne().sort({ order: -1 });
                const nextOrder = order ?? (maxOrderVideo ? maxOrderVideo.order + 1 : 0);

                const video = await HelpVideo.create({
                    title,
                    description: description || '',
                    videoUrl,
                    thumbnailUrl: thumbnailUrl || '',
                    category: category || 'english',
                    buttonLabel: buttonLabel || '',
                    buttonUrl: buttonUrl || '',
                    order: nextOrder,
                    isActive: true,
                });

                return reply.status(201).send({ success: true, video });
            } catch (error) {
                console.error('Error creating help video:', error);
                return reply.status(500).send({ error: 'Internal Server Error' });
            }
        }
    );

    // ─── ADMIN: Update a video ─────────────────────────────────────────────────
    fastify.put(
        '/api/dfxhelp/:id',
        async (
            req: FastifyRequest<{
                Params: { id: string };
                Body: {
                    title?: string;
                    description?: string;
                    videoUrl?: string;
                    buttonLabel?: string;
                    buttonUrl?: string;
                    order?: number;
                    isActive?: boolean;
                };
            }>,
            reply: FastifyReply
        ) => {
            try {
                const admin = (req as any).admin;
                if (admin.role !== 'superadmin') {
                    return reply.status(403).send({ error: 'Forbidden: Super Admin only' });
                }

                const { id } = req.params;
                const updates = req.body;

                const video = await HelpVideo.findByIdAndUpdate(id, updates, { new: true });
                if (!video) {
                    return reply.status(404).send({ error: 'Video not found' });
                }

                return reply.send({ success: true, video });
            } catch (error) {
                console.error('Error updating help video:', error);
                return reply.status(500).send({ error: 'Internal Server Error' });
            }
        }
    );

    // ─── ADMIN: Delete a video ─────────────────────────────────────────────────
    fastify.delete(
        '/api/dfxhelp/:id',
        async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            try {
                const admin = (req as any).admin;
                if (admin.role !== 'superadmin') {
                    return reply.status(403).send({ error: 'Forbidden: Super Admin only' });
                }

                const { id } = req.params;
                const video = await HelpVideo.findByIdAndDelete(id);
                if (!video) {
                    return reply.status(404).send({ error: 'Video not found' });
                }

                return reply.send({ success: true, message: 'Video deleted' });
            } catch (error) {
                console.error('Error deleting help video:', error);
                return reply.status(500).send({ error: 'Internal Server Error' });
            }
        }
    );

    // ─── ADMIN: Toggle active status ───────────────────────────────────────────
    fastify.patch(
        '/api/dfxhelp/:id/toggle',
        async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
            try {
                const admin = (req as any).admin;
                if (admin.role !== 'superadmin') {
                    return reply.status(403).send({ error: 'Forbidden: Super Admin only' });
                }

                const { id } = req.params;
                const video = await HelpVideo.findById(id);
                if (!video) {
                    return reply.status(404).send({ error: 'Video not found' });
                }

                video.isActive = !video.isActive;
                await video.save();

                return reply.send({ success: true, video });
            } catch (error) {
                console.error('Error toggling help video:', error);
                return reply.status(500).send({ error: 'Internal Server Error' });
            }
        }
    );
};
