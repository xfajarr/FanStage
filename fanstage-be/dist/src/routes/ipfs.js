import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { privyAuthMiddleware } from '../middleware/privyAuth.js';
import { PinataSDK } from 'pinata';
const ipfsRouter = new Hono();
// Initialize Pinata SDK
const pinata = new PinataSDK({
    pinataJwt: process.env.PINATA_JWT,
    pinataGateway: process.env.PINATA_GATEWAY_URL
});
// Validation schemas
const presignedUrlSchema = z.object({
    expires: z.number().min(1).max(3600).optional().default(60), // 1 second to 1 hour
});
const fileUploadSchema = z.object({
    name: z.string().min(1).max(255),
    description: z.string().max(1000).optional(),
});
// Get presigned URL for client-side upload
ipfsRouter.get('/presigned-url', privyAuthMiddleware, zValidator('query', presignedUrlSchema), async (c) => {
    try {
        const { expires } = c.req.valid('query');
        // Create presigned URL for secure client-side upload
        const url = await pinata.upload.public.createSignedURL({
            expires: expires
        });
        return c.json({
            url,
            expires_in: expires,
            gateway_url: `https://${process.env.PINATA_GATEWAY_URL}`
        }, { status: 200 });
    }
    catch (error) {
        console.error('Error creating presigned URL:', error);
        return c.json({ error: 'Failed to create presigned URL' }, 500);
    }
});
// Upload file directly to Pinata (server-side)
ipfsRouter.post('/upload', privyAuthMiddleware, async (c) => {
    try {
        const user = c.get('user');
        // Get file from form data
        const formData = await c.req.formData();
        const file = formData.get('file');
        const name = formData.get('name');
        const description = formData.get('description');
        if (!file) {
            return c.json({ error: 'No file provided' }, 400);
        }
        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            return c.json({ error: 'File size too large. Maximum size is 10MB' }, 400);
        }
        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain'];
        if (!allowedTypes.includes(file.type)) {
            return c.json({ error: 'Invalid file type. Allowed types: JPEG, PNG, GIF, WebP, PDF, TXT' }, 400);
        }
        // Upload to Pinata with metadata
        const result = await pinata.upload.public.file(file);
        // Add metadata to the uploaded file
        const metadata = {
            name: name || file.name,
            description: description || `Uploaded by ${user.walletAddress}`,
            keyvalues: {
                uploadedBy: user.walletAddress,
                uploadedAt: new Date().toISOString(),
                fileType: file.type,
                fileSize: file.size.toString()
            }
        };
        return c.json({
            cid: result.cid,
            name: result.name,
            size: file.size,
            type: file.type,
            metadata: metadata,
            url: `https://${process.env.PINATA_GATEWAY_URL}/files/${result.cid}`,
            ipfs_url: `ipfs://${result.cid}`
        }, { status: 201 });
    }
    catch (error) {
        console.error('Error uploading file to Pinata:', error);
        return c.json({ error: 'Failed to upload file' }, 500);
    }
});
// Upload JSON metadata to Pinata
ipfsRouter.post('/upload-json', privyAuthMiddleware, async (c) => {
    try {
        const user = c.get('user');
        const jsonData = await c.req.json();
        // Add metadata to JSON
        const metadata = {
            ...jsonData,
            uploadedBy: user.walletAddress,
            uploadedAt: new Date().toISOString()
        };
        // Upload JSON to Pinata
        const result = await pinata.upload.public.json(metadata);
        return c.json({
            cid: result.cid,
            url: `https://${process.env.PINATA_GATEWAY_URL}/files/${result.cid}`,
            ipfs_url: `ipfs://${result.cid}`
        }, { status: 201 });
    }
    catch (error) {
        console.error('Error uploading JSON to Pinata:', error);
        return c.json({ error: 'Failed to upload JSON' }, 500);
    }
});
// Get file metadata
ipfsRouter.get('/file/:cid', async (c) => {
    try {
        const cid = c.req.param('cid');
        // Get file metadata from Pinata gateway
        const url = `https://${process.env.PINATA_GATEWAY_URL}/files/${cid}`;
        return c.json({
            cid: cid,
            url: url,
            ipfs_url: `ipfs://${cid}`
        }, { status: 200 });
    }
    catch (error) {
        console.error('Error getting file metadata:', error);
        return c.json({ error: 'File not found or failed to get metadata' }, 404);
    }
});
// List user's files (simplified version)
ipfsRouter.get('/user-files', privyAuthMiddleware, async (c) => {
    try {
        const user = c.get('user');
        // For now, return a placeholder response
        // In a real implementation, you would need to maintain a database
        // of uploaded files with their metadata
        return c.json({
            files: [],
            total: 0,
            message: 'File listing not implemented yet. Please use a database to track uploaded files.'
        }, { status: 200 });
    }
    catch (error) {
        console.error('Error listing user files:', error);
        return c.json({ error: 'Failed to list files' }, 500);
    }
});
// Delete file (placeholder)
ipfsRouter.delete('/file/:cid', privyAuthMiddleware, async (c) => {
    try {
        const cid = c.req.param('cid');
        const user = c.get('user');
        // For now, return a placeholder response
        // In a real implementation, you would check if user owns the file
        // and then unpin it from Pinata
        return c.json({
            message: 'File deletion not implemented yet. Please implement unpinning functionality.',
            cid: cid
        }, { status: 200 });
    }
    catch (error) {
        console.error('Error deleting file:', error);
        return c.json({ error: 'Failed to delete file' }, 500);
    }
});
// Health check for IPFS service
ipfsRouter.get('/health', async (c) => {
    try {
        // Test Pinata connection by creating a test signed URL
        const testUrl = await pinata.upload.public.createSignedURL({
            expires: 60
        });
        return c.json({
            status: 'healthy',
            pinata_connected: true,
            gateway_url: `https://${process.env.PINATA_GATEWAY_URL}`,
            test_presigned_url_created: !!testUrl,
            timestamp: new Date().toISOString()
        }, { status: 200 });
    }
    catch (error) {
        console.error('IPFS health check failed:', error);
        return c.json({
            status: 'unhealthy',
            pinata_connected: false,
            error: 'Failed to connect to Pinata',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 503 });
    }
});
export default ipfsRouter;
