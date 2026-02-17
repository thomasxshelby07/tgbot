import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { MainMenuButton } from '../models/MainMenuButton';

interface MenuBody {
    text: string;
    order: number;
    responseMessage?: string;
    responseMediaUrl?: string;
    responseButtons?: { text: string; url: string }[];
}

export const menuRoutes = async (fastify: FastifyInstance) => {
    console.log('Initializing Menu Routes Plugin...');
    // GET all buttons
    fastify.get('/api/menu', async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const buttons = await MainMenuButton.find().sort({ order: 1 });
            return reply.send(buttons);
        } catch (error) {
            console.error('Error fetching menu buttons:', error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // POST add button
    fastify.post<{ Body: MenuBody }>('/api/menu', async (req, reply) => {
        try {
            const { text, order, responseMessage, responseMediaUrl, responseButtons } = req.body;
            if (!text) {
                return reply.status(400).send({ error: 'Text is required' });
            }
            const button = new MainMenuButton({
                text,
                order,
                responseMessage,
                responseMediaUrl,
                responseButtons
            });
            await button.save();
            return reply.send(button);
        } catch (error) {
            console.error('Error creating button:', error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // PUT update button details
    fastify.put<{ Params: { id: string }, Body: MenuBody }>('/api/menu/:id', async (req, reply) => {
        try {
            const { id } = req.params;
            const updateData = req.body;
            console.log('PUT /api/menu/:id - Received data:', JSON.stringify(updateData, null, 2));
            console.log('Updating button with ID:', id);

            const button = await MainMenuButton.findByIdAndUpdate(id, updateData, { new: true });
            if (!button) {
                console.error('Button not found with ID:', id);
                return reply.status(404).send({ error: 'Button not found' });
            }
            console.log('Button updated successfully:', button._id);
            return reply.send(button);
        } catch (error) {
            console.error('Error updating button:', error);
            if (error instanceof Error) {
                console.error('Error message:', error.message);
                console.error('Error stack:', error.stack);
            }
            return reply.status(500).send({ error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' });
        }
    });

    // DELETE button
    fastify.delete('/api/menu/:id', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            const { id } = req.params;
            await MainMenuButton.findByIdAndDelete(id);
            return reply.send({ success: true });
        } catch (error) {
            console.error('Error deleting button:', error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // PATCH toggle active
    fastify.patch('/api/menu/:id/toggle', async (req: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
        try {
            const { id } = req.params;
            const button = await MainMenuButton.findById(id);
            if (!button) {
                return reply.status(404).send({ error: 'Button not found' });
            }
            button.active = !button.active;
            await button.save();
            return reply.send(button);
        } catch (error) {
            console.error('Error toggling button:', error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });

    // PATCH update order
    fastify.patch('/api/menu/reorder', async (req: FastifyRequest<{ Body: { updates: { id: string; order: number }[] } }>, reply: FastifyReply) => {
        try {
            const { updates } = req.body;
            // Execute all updates
            await Promise.all(updates.map(u =>
                MainMenuButton.findByIdAndUpdate(u.id, { order: u.order })
            ));
            return reply.send({ success: true });
        } catch (error) {
            console.error('Error reordering buttons:', error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });
};
