import { FastifyInstance, FastifyPluginAsync } from 'fastify';
import { WelcomeMessage } from '../models/WelcomeMessage';

export const welcomeMessageRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
    // Get all welcome messages
    fastify.get('/api/welcome-messages', async (request, reply) => {
        try {
            // Populate channel details
            const messages = await WelcomeMessage.find().populate('channelId').sort({ createdAt: -1 });
            return messages;
        } catch (error) {
            reply.code(500).send(error);
        }
    });

    // Get welcome message by channel ID
    fastify.get('/api/welcome-messages/channel/:channelId', async (request: any, reply) => {
        try {
            const message = await WelcomeMessage.findOne({ channelId: request.params.channelId });
            return message || {};
        } catch (error) {
            reply.code(500).send(error);
        }
    });

    // Create or Update welcome message
    fastify.post('/api/welcome-messages', async (request: any, reply) => {
        try {
            const { channelId } = request.body;
            let message = await WelcomeMessage.findOne({ channelId });

            if (message) {
                // Update existing
                Object.assign(message, request.body);
            } else {
                // Create new
                message = new WelcomeMessage(request.body);
            }

            await message.save();
            return message;
        } catch (error) {
            reply.code(500).send(error);
        }
    });

    // Toggle welcome message status
    fastify.put('/api/welcome-messages/:id/toggle', async (request: any, reply) => {
        try {
            const message = await WelcomeMessage.findById(request.params.id);
            if (!message) {
                return reply.code(404).send({ message: 'Welcome message not found' });
            }
            message.enabled = !message.enabled;
            await message.save();
            return message;
        } catch (error) {
            reply.code(500).send(error);
        }
    });
};
