import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import '../config/cloudinary'; // Ensure config is loaded

export const uploadRoutes = async (fastify: FastifyInstance) => {
    fastify.post('/api/upload', async (req: FastifyRequest, reply: FastifyReply) => {
        try {
            const data = await req.file();
            if (!data) {
                return reply.status(400).send({ error: 'No file uploaded' });
            }

            // Validate mime type for Image, Audio, and Video
            const allowedMimeTypes = [
                'image/jpeg', 'image/png', 'image/gif', 'image/webp',
                'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 'audio/x-m4a',
                'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/mpeg'
            ];

            if (!allowedMimeTypes.includes(data.mimetype)) {
                return reply.status(400).send({ error: 'Invalid file type. Only images, audio, and videos are allowed.' });
            }

            // Determine media type for client response
            const mediaType = data.mimetype.startsWith('video') ? 'video' : data.mimetype.startsWith('audio') ? 'audio' : 'image';
            // Determine resource type based on mime type
            const resourceType = (data.mimetype.startsWith('audio') || data.mimetype.startsWith('video')) ? 'video' : 'image';

            return await new Promise((resolve, reject) => {
                const publicId = path.parse(data.filename).name;
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'tgbot_uploads',
                        resource_type: 'auto',
                        public_id: publicId,
                    },
                    (error, result) => {
                        if (error) {
                            console.error('Cloudinary upload error:', error);
                            return reply.status(500).send({ error: 'Upload failed' });
                        }
                        if (!result) {
                            return reply.status(500).send({ error: 'Upload result empty' });
                        }
                        resolve(reply.send({ url: result.secure_url, type: result.resource_type, mediaType }));
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
