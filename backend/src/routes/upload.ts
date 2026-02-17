import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream';
import util from 'util';

const pump = util.promisify(pipeline);

export const uploadRoutes = async (fastify: FastifyInstance) => {
    fastify.post('/api/upload', async (req: FastifyRequest, reply: FastifyReply) => {
        console.log('Upload request received');
        try {
            const data = await req.file();
            console.log('File data received:', data ? data.filename : 'No file');

            if (!data) {
                return reply.status(400).send({ error: 'No file uploaded' });
            }

            const uploadDir = path.join(__dirname, '../../public/uploads');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const filename = `${Date.now()}-${data.filename}`;
            const filepath = path.join(uploadDir, filename);

            await pump(data.file, fs.createWriteStream(filepath));

            const fileUrl = `http://localhost:4000/uploads/${filename}`;

            return reply.send({ url: fileUrl });
        } catch (error) {
            console.error('Upload error:', error);
            return reply.status(500).send({ error: 'Upload failed' });
        }
    });
};
