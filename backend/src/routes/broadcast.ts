import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { User } from '../models/User';
import { broadcastQueue } from '../queue/broadcastQueue';

export const broadcastRoutes = async (fastify: FastifyInstance) => {
    fastify.post('/api/broadcast', async (request: FastifyRequest<{ Body: { message: string; mediaUrl?: string; buttons?: any[]; limit?: number } }>, reply: FastifyReply) => {
        const { message, mediaUrl, buttons, limit } = request.body;

        if (!message) {
            return reply.status(400).send({ error: 'Message is required' });
        }

        // Prepare Query
        let cursor;
        const query = { isBlocked: false };

        if (limit && limit > 0) {
            console.log(`Creating broadcast for latest ${limit} users...`);
            // For limited broadcast, we must sort by createdAt DESC
            cursor = User.find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .select('telegramId')
                .cursor();
        } else {
            console.log(`Creating broadcast for ALL users...`);
            cursor = User.find(query).select('telegramId').cursor();
        }

        let count = 0;

        // Process in chunks to efficient queueing? 
        // BullMQ addBulk is more efficient but simple add is fine for now as streaming users is the bottleneck.
        // Actually, let's use a batching strategy for queue addition if possible, 
        // but simple iteration is robust enough for now if we don't await every single one sequentially.

        // Better: Collect a batch of promises then await? 
        // Or just let connection handle pipelining.

        reply.send({ success: true, message: 'Broadcast started' }); // Respond immediately

        try {
            for await (const user of cursor) {
                if (user.telegramId) {
                    await broadcastQueue.add('broadcast-message', {
                        userId: user.telegramId,
                        message,
                        mediaUrl,
                        buttons
                    }, {
                        removeOnComplete: true,
                        removeOnFail: 1000
                    });
                    count++;
                }
            }
            console.log(`✅ Queued ${count} broadcast messages.`);
        } catch (error) {
            console.error('Error queueing broadcast:', error);
        }
    });
};
