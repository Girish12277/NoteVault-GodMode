import { Router } from 'express';
import { prisma } from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth';
import crypto from 'crypto';

const router = Router();

// Get all conversations (Lightweight - Strict Protocol)
router.get('/conversations', authenticate, async (req: AuthRequest, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        // Protocol: Fast, Cacheable, No Sensitive Data
        // Strategy: Get distinct partners from Sent and Received messages

        const [sent, received] = await Promise.all([
            prisma.messages.findMany({
                where: { sender_id: userId },
                distinct: ['receiver_id'],
                orderBy: { created_at: 'desc' },
                select: {
                    receiver: {
                        select: { id: true, full_name: true, profile_picture_url: true, is_seller: true }
                    },
                    content: true,
                    created_at: true
                }
            }),
            prisma.messages.findMany({
                where: { receiver_id: userId },
                distinct: ['sender_id'],
                orderBy: { created_at: 'desc' },
                select: {
                    sender: {
                        select: { id: true, full_name: true, profile_picture_url: true, is_seller: true }
                    },
                    content: true,
                    created_at: true
                }
            })
        ]);

        // Map to unique conversations, preferring the most recent message
        const conversationMap = new Map();

        // Process Sent
        sent.forEach(msg => {
            conversationMap.set(msg.receiver.id, {
                conversation_id: 'conv_' + msg.receiver.id, // Derived ID
                other_user: {
                    user_id: msg.receiver.id,
                    display_name: msg.receiver.full_name,
                    avatar_url: msg.receiver.profile_picture_url,
                    role: msg.receiver.is_seller ? 'seller' : 'buyer'
                },
                last_message_preview: msg.content,
                last_message_at: msg.created_at
            });
        });

        // Process Received (Merge/Overwrite if newer)
        received.forEach(msg => {
            const existing = conversationMap.get(msg.sender.id);
            if (!existing || new Date(msg.created_at) > new Date(existing.last_message_at)) {
                conversationMap.set(msg.sender.id, {
                    conversation_id: 'conv_' + msg.sender.id,
                    other_user: {
                        user_id: msg.sender.id,
                        display_name: msg.sender.full_name,
                        avatar_url: msg.sender.profile_picture_url,
                        role: msg.sender.is_seller ? 'seller' : 'buyer'
                    },
                    last_message_preview: msg.content,
                    last_message_at: msg.created_at
                });
            }
        });

        // Convert to array and sort by date
        const conversations = Array.from(conversationMap.values())
            .sort((a: any, b: any) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());

        return res.json({ success: true, data: conversations });
    } catch (error) {
        console.error('Get conversations error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch conversations' });
    }
});

// Get messages with a specific user
router.get('/:userId', authenticate, async (req: AuthRequest, res) => {
    try {
        const currentUserId = req.user?.id;
        const { userId: otherUserId } = req.params;

        if (!currentUserId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const messages = await prisma.messages.findMany({
            where: {
                OR: [
                    { sender_id: currentUserId, receiver_id: otherUserId },
                    { sender_id: otherUserId, receiver_id: currentUserId }
                ]
            },
            orderBy: { created_at: 'asc' },
            include: {
                sender: { select: { full_name: true, profile_picture_url: true } }
            }
        });

        return res.json({ success: true, data: messages });
    } catch (error) {
        console.error('Get messages error:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch messages' });
    }
});

// Send a message
router.post('/', authenticate, async (req: AuthRequest, res) => {
    try {
        const senderId = req.user?.id;
        const { receiverId, content } = req.body;

        if (!senderId) return res.status(401).json({ success: false, message: 'Unauthorized' });
        if (!content || !receiverId) return res.status(400).json({ success: false, message: 'Missing fields' });

        const message = await prisma.messages.create({
            data: {
                id: crypto.randomUUID(),
                sender_id: senderId,
                receiver_id: receiverId,
                content
            }
        });

        // Fetch sender details for the notification
        const sender = await prisma.users.findUnique({
            where: { id: senderId },
            select: { full_name: true }
        });

        // Create Notification for the receiver
        await prisma.notifications.create({
            data: {
                id: crypto.randomUUID(),
                user_id: receiverId,
                type: 'INFO',
                title: 'New Message',
                message: `You have a new message from ${sender?.full_name || 'a user'}: "${content.substring(0, 30)}${content.length > 30 ? '...' : ''}"`,
                is_read: false
            }
        });

        return res.json({ success: true, data: message });
    } catch (error) {
        console.error('Send message error:', error);
        return res.status(500).json({ success: false, message: 'Failed to send message' });
    }
});

export default router;
