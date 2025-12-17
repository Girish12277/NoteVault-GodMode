import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getContent = async (req: Request, res: Response) => {
    try {
        const { section } = req.params;
        const content = await prisma.siteContent.findUnique({
            where: { section },
        });

        if (!content) {
            return res.status(404).json({ message: 'Content not found', code: 'CONTENT_NOT_FOUND' });
        }

        res.json(content);
    } catch (error) {
        console.error('Get content error:', error);
        res.status(500).json({ message: 'Failed to fetch content' });
    }
};

export const updateContent = async (req: Request, res: Response) => {
    try {
        const { section } = req.params;
        const { content } = req.body;

        const updated = await prisma.siteContent.upsert({
            where: { section },
            update: { content },
            create: { section, content },
        });

        res.json(updated);
    } catch (error) {
        console.error('Update content error:', error);
        res.status(500).json({ message: 'Failed to update content' });
    }
};
