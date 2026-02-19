import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { v2 as cloudinary } from 'cloudinary';
import '../config/cloudinary'; // Ensure config is loaded

export const uploadRoutes = async (fastify: FastifyInstance) => {
    fastify.post('/api/upload', async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const data = await req.file();
            if (!data) {
                return reply.status(400).send({ error: 'No file uploaded' });
            }

            // Validate mime type for Image and Audio only
            // Note: mime types can be spoofed, but it's a first line of defense
            const allowedMimeTypes = [
                'image/jpeg', 'image/png', 'image/gif', 'image/webp',
                'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a'
            ];

            if (!allowedMimeTypes.includes(data.mimetype)) {
                return reply.status(400).send({ error: 'Invalid file type. Only images and audio are allowed.' });
            }

            // Determine resource type based on mime type
            // Cloudinary 'auto' is usually best, but we can hint if we know it's audio
            const resourceType = data.mimetype.startsWith('audio') ? 'video' : 'image';

            return await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'tgbot_uploads',
                        resource_type: 'auto',
                    },
                    (error, result) => {
                        if (error) {
                            console.error('Cloudinary upload error:', error);
                            return reply.status(500).send({ error: 'Upload failed' });
                        }
                        if (!result) {
                            return reply.status(500).send({ error: 'Upload result empty' });
                        }
                        resolve(reply.send({ url: result.secure_url, type: result.resource_type }));
                    }
                );

                // Pipe the file stream directly to Cloudinary
                data.file.pipe(uploadStream);
            });

        } catch (error) {
            console.error('Upload handler error:', error);
            return reply.status(500).send({ error: 'Internal Server Error' });
        }
    });
};
