import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { User } from '../models/User';

export const userRoutes = async (fastify: FastifyInstance) => {
    fastify.get('/api/users', async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const users = await User.find().sort({ createdAt: -1 });
            return reply.send(users);
        } catch (error) {
            console.error('Error fetching users:', error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });
};
