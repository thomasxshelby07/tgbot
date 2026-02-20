import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { Channel } from '../models/Channel';

export const channelRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    // Get all channels
    fastify.get('/api/channels', async (request, reply) => {
        try {
            const channels = await Channel.find().sort({ createdAt: -1 });
            return channels;
        } catch (error) {
            reply.code(500).send(error);
        }
    });

    // Create a new channel
    fastify.post('/api/channels', async (request: any, reply) => {
        try {
            const channel = new Channel(request.body);
            await channel.save();
            return channel;
        } catch (error) {
            reply.code(500).send(error);
        }
    });

    // Toggle channel status
    fastify.put('/api/channels/:id/toggle', async (request: any, reply) => {
        try {
            const channel = await Channel.findById(request.params.id);
            if (!channel) {
                return reply.code(404).send({ message: 'Channel not found' });
            }
            channel.active = !channel.active;
            await channel.save();
            return channel;
        } catch (error) {
            reply.code(500).send(error);
        }
    });

    // Delete a channel
    fastify.delete('/api/channels/:id', async (request: any, reply) => {
        try {
            await Channel.findByIdAndDelete(request.params.id);
            return { message: 'Channel deleted' };
        } catch (error) {
            reply.code(500).send(error);
        }
    });
};
