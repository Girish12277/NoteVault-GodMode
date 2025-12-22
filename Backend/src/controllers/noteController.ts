import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../config/database';
import crypto from 'crypto';
import { cloudinary } from '../config/cloudinary';
import { cacheService, cacheKeys, cacheTTL } from '../services/cacheService';

const prismaAny = prisma as any;

const sanitizeInput = async (content: string) => {
    if (!content) return content;
    const { JSDOM } = await import('jsdom');
    const { default: createDOMPurify } = await import('dompurify');
    const window = new JSDOM('').window;
    const DOMPurify = createDOMPurify(window as any);
    return DOMPurify.sanitize(content, {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'li', 'ol'],
        ALLOWED_ATTR: ['href', 'target']
    });
};

export const noteController = {
    list: async (req: Request, res: Response) => {
        try {
            const { page = '1', limit = '20', degree, semester, universityId, categoryId, search, sort } = req.query;

            // God-Level Caching: Generate cache key from query params
            const cacheKey = cacheKeys.notesList(
                JSON.stringify({ page, limit, degree, semester, universityId, categoryId, search, sort })
            );

            // Try cache first (optimization only - DB is source of truth)
            const cached = await cacheService.get<any>(cacheKey);
            if (cached) {
                return res.json(cached);
            }

            const skip = (Number(page) - 1) * Number(limit);
            const where: any = { is_active: true, is_approved: true, is_deleted: false };
            if (degree) where.degree = degree;
            if (semester) where.semester = parseInt(semester as string);
            if (universityId) where.university_id = universityId;
            if (categoryId) where.category_id = categoryId;
            if (search) {
                const searchQuery = search as string;
                where.OR = [
                    { title: { contains: searchQuery, mode: 'insensitive' } },
                    { description: { contains: searchQuery, mode: 'insensitive' } },
                    { subject: { contains: searchQuery, mode: 'insensitive' } },
                    { tags: { has: searchQuery } }
                ];
            }
            const [notes, total] = await Promise.all([
                prismaAny.notes.findMany({
                    where, skip, take: Number(limit),
                    include: {
                        users: { select: { id: true, full_name: true, profile_picture_url: true } },
                        categories: { select: { name: true, name_hi: true, slug: true, icon: true } },
                        universities: { select: { name: true, short_name: true } }
                    },
                    orderBy: (() => {
                        switch (sort) {
                            case 'oldest': return { created_at: 'asc' };
                            case 'popular': return { purchase_count: 'desc' };
                            case 'price_low': return { price_inr: 'asc' };
                            case 'price_high': return { price_inr: 'desc' };
                            case 'rating': return { average_rating: 'desc' };
                            default: return { created_at: 'desc' };
                        }
                    })()
                }),
                prismaAny.notes.count({ where })
            ]);
            const formattedNotes = notes.map((note: any) => ({
                id: note.id, title: note.title, description: note.description, subject: note.subject,
                degree: note.degree, specialization: note.specialization, university: note.universities?.name || '',
                collegeName: note.college_name, semester: note.semester, language: note.language,
                price: parseFloat(note.price_inr.toString()), pages: note.total_pages,
                format: note.file_type.includes('pdf') ? 'pdf' : 'docx',
                coverImage: note.cover_image || (note.preview_pages && note.preview_pages.length > 0 ? note.preview_pages[0] : ''),
                previewPages: note.preview_pages || [], tableOfContents: Array.isArray(note.table_of_contents) ? note.table_of_contents : [],
                viewCount: note.view_count, sellerId: note.seller_id, sellerName: note.users?.full_name,
                rating: note.average_rating, reviewCount: note.total_reviews, downloadCount: note.download_count,
                createdAt: note.created_at, updatedAt: note.updated_at, isActive: note.is_active
            }));

            const response = {
                success: true,
                data: {
                    notes: formattedNotes,
                    pagination: {
                        total,
                        page: Number(page),
                        limit: Number(limit),
                        totalPages: Math.ceil(total / Number(limit))
                    }
                }
            };

            // Cache result (5 minutes TTL)
            await cacheService.set(cacheKey, response, cacheTTL.notesList);

            return res.json(response);
        } catch (error: any) {
            return res.status(500).json({ success: false, message: 'Failed to fetch notes', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
        }
    },
    getById: async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const user = (req as any).user;

            // God-Level Caching: Cache per note + user (since isPurchased/isWishlisted varies)
            const cacheKey = cacheKeys.noteDetail(`${id}:${user?.id || 'anon'}`);

            // Try cache first
            const cached = await cacheService.get<any>(cacheKey);
            if (cached) {
                return res.json(cached);
            }

            const note = await prismaAny.notes.findUnique({
                where: { id },
                include: {
                    users: { select: { id: true, full_name: true, profile_picture_url: true } },
                    categories: { select: { name: true, name_hi: true, slug: true, icon: true } },
                    universities: { select: { name: true, short_name: true } },
                    reviews: { where: { is_approved: true }, take: 5, orderBy: { created_at: 'desc' }, include: { users: { select: { full_name: true, profile_picture_url: true } } } }
                }
            });
            if (!note || note.is_deleted || !note.is_active) return res.status(404).json({ success: false, message: 'Note not found' });

            // Increment view count
            await prismaAny.notes.update({ where: { id }, data: { view_count: { increment: 1 } } });

            // 🧠 PHASE 2: Track view event for recommendations (non-blocking)
            if (user) {
                try {
                    const { kafkaEventService } = await import('../services/kafkaEventService');
                    const { gorseService } = await import('../services/gorseRecommendationService');

                    // Track in Kafka (async, fire-and-forget)
                    kafkaEventService.trackEvent({
                        userId: user.id,
                        sessionId: req.session?.id || 'unknown',
                        eventType: 'view',
                        entityType: 'note',
                        entityId: id,
                        timestamp: new Date()
                    }).catch(err => console.warn('Kafka tracking failed:', err));

                    // Track in Gorse (async, fire-and-forget)
                    gorseService.trackInteraction(user.id, id, 'view')
                        .catch(err => console.warn('Gorse tracking failed:', err));
                } catch (error) {
                    // Silent fail - don't break the request
                }
            }

            let isPurchased = false, isWishlisted = false;
            if (user) {
                const [purchase, wishlist] = await Promise.all([
                    prismaAny.purchases.findFirst({ where: { user_id: user.id, note_id: id, is_active: true } }),
                    prismaAny.Wishlist.findUnique({ where: { userId_noteId: { userId: user.id, noteId: id } } })
                ]);
                isPurchased = !!purchase;
                isWishlisted = !!wishlist;
            }
            const formattedNote = {
                id: note.id, title: note.title, description: note.description, subject: note.subject,
                degree: note.degree, specialization: note.specialization, university: note.universities?.name,
                universityId: note.university_id, collegeName: note.college_name, semester: note.semester,
                language: note.language, price: parseFloat(note.price_inr.toString()), pages: note.total_pages,
                format: note.file_type.includes('pdf') ? 'pdf' : 'docx',
                coverImage: note.cover_image || (note.preview_pages && note.preview_pages.length > 0 ? note.preview_pages[0] : ''),
                previewPages: note.preview_pages || [], tableOfContents: Array.isArray(note.table_of_contents) ? note.table_of_contents : [],
                sellerId: note.seller_id, sellerName: note.users?.full_name, sellerImage: note.users?.profile_picture_url,
                rating: note.average_rating, reviewCount: note.total_reviews, downloadCount: note.download_count,
                createdAt: note.created_at, updatedAt: note.updated_at, isActive: note.is_active,
                isPurchased, isWishlisted, isOwner: user?.id === note.seller_id,
                fileUrl: isPurchased || (user?.id === note.seller_id) ? note.file_url : undefined,
                reviews: (note.reviews || []).map((r: any) => ({ id: r.id, rating: r.rating, comment: r.comment, userName: r.users?.full_name, userImage: r.users?.profile_picture_url, createdAt: r.created_at }))
            };

            const response = { success: true, data: formattedNote };

            // Cache result (10 minutes TTL)
            await cacheService.set(cacheKey, response, cacheTTL.noteDetail);

            return res.json(response);
        } catch (error: any) {
            return res.status(500).json({ success: false, message: 'Failed to fetch note', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
        }
    },
    create: async (req: AuthRequest, res: Response) => {
        try {
            const userId = req.user!.id;
            const user = await prismaAny.users.findUnique({ where: { id: userId } });
            if (!user?.is_seller) return res.status(403).json({ success: false, message: 'Only sellers can upload notes' });

            // Files from multer
            const files = req.files as { [fieldname: string]: Express.Multer.File[] } || {};
            const noteFile = files.file?.[0];
            const coverImageFile = files.coverImage?.[0];
            const previewImageFiles = files.previewImages || [];

            if (!noteFile && !req.body.fileUrl) {
                return res.status(400).json({ success: false, message: 'Note PDF file is required' });
            }

            const { title, description, subject, degree, specialization, universityId, collegeName, semester, year, language, totalPages, priceInr, tableOfContents, tags, categoryId, fileUrl: providedFileUrl, fileType: providedFileType, fileSizeBytes: providedFileSizeBytes, previewPages: providedPreviewPages } = req.body;

            // Import services ONLY when needed to avoid circular deps
            const { uploadService } = await import('../services/uploadService');

            let fileUrl = providedFileUrl;
            let fileSizeBytes = providedFileSizeBytes;
            let fileType = providedFileType;

            if (noteFile) {
                // Upload Note PDF
                const noteUploadResult = await uploadService.uploadNotePdf(noteFile.buffer, userId, noteFile.originalname);
                fileUrl = noteUploadResult.secureUrl;
                fileSizeBytes = noteFile.size;
                fileType = noteFile.mimetype;
            }

            // Defaults for optional fields (Database Constraints)
            const finalDegree = degree || 'Other';

            let finalUniversityId = universityId;
            if (!finalUniversityId) {
                // Fallback to any university if not provided (e.g. 'Other' or first available)
                // In a real app, we should have a specific 'Other' entry. 
                // Here we pick the first one to ensure success.
                const fallbackUni = await prismaAny.universities.findFirst({ select: { id: true } });
                if (fallbackUni) {
                    finalUniversityId = fallbackUni.id;
                } else {
                    // Critical fallback if DB is empty - unlikely but safe
                    return res.status(500).json({ success: false, message: 'System Error: No universities available' });
                }
            }

            const finalSemester = semester ? parseInt(semester) : 1;


            // Upload Cover Image (Optional)
            let coverImageUrl = null;
            if (coverImageFile) {
                const coverUploadResult = await uploadService.uploadPreviewImage(coverImageFile.buffer, userId);
                coverImageUrl = coverUploadResult.secureUrl;
            } else if (req.body.coverImage) {
                coverImageUrl = req.body.coverImage;
            }

            // GOD-LEVEL LOGGING START
            console.log('--- NOTE CREATION DEBUG ---');
            console.log('Payload previewPages:', providedPreviewPages);
            console.log('Payload Type:', typeof providedPreviewPages);
            console.log('Is Array?', Array.isArray(providedPreviewPages));

            // Upload Preview Images (Optional)
            // Handle both existing URLs (from body) and new files (from multer)
            const previewPages: string[] = Array.isArray(providedPreviewPages) ? providedPreviewPages : (providedPreviewPages ? [providedPreviewPages] : []);

            console.log('Processed previewPages (Pre-File-Merge):', previewPages);
            // GOD-LEVEL LOGGING END            
            if (previewImageFiles.length > 0) {
                for (const file of previewImageFiles) {
                    const result = await uploadService.uploadPreviewImage(file.buffer, userId);
                    if (result.secureUrl) {
                        previewPages.push(result.secureUrl);
                    }
                }
            }

            const calculateCommission = (price: number, pages: number) => {
                let commissionPct = 15;
                if (pages > 50 && pages <= 150) commissionPct = 12;
                else if (pages > 150) commissionPct = 10;
                const commissionAmt = (price * commissionPct) / 100;
                return { commissionPercentage: commissionPct, commissionAmountInr: commissionAmt, sellerEarningInr: price - commissionAmt };
            };
            const commissionData = calculateCommission(parseFloat(priceInr), parseInt(totalPages));
            const note = await prismaAny.notes.create({
                data: {
                    id: crypto.randomUUID(), title: await sanitizeInput(title), description: await sanitizeInput(description), subject: await sanitizeInput(subject),
                    degree: finalDegree, specialization, university_id: finalUniversityId, college_name: await sanitizeInput(collegeName),
                    semester: finalSemester, year: year ? parseInt(year) : null, language, file_url: fileUrl,
                    file_type: fileType, file_size_bytes: fileSizeBytes, total_pages: parseInt(totalPages), cover_image: coverImageUrl,
                    preview_pages: previewPages, table_of_contents: tableOfContents, tags, price_inr: parseFloat(priceInr),
                    commission_percentage: commissionData.commissionPercentage, commission_amount_inr: commissionData.commissionAmountInr,
                    seller_earning_inr: commissionData.sellerEarningInr, is_active: false, is_approved: false, average_rating: 0,
                    total_reviews: 0, seller_id: userId, category_id: categoryId || null, is_deleted: false, view_count: 0,
                    download_count: 0, purchase_count: 0, created_at: new Date(), updated_at: new Date()
                }
            });

            // 🧠 PHASE 2: Sync new note to Gorse (non-blocking)
            setImmediate(async () => {
                try {
                    const { gorseService } = await import('../services/gorseRecommendationService');

                    // Build categories and labels for Gorse
                    const categories = [note.degree];
                    if (note.specialization) categories.push(note.specialization);

                    const labels = [note.subject, `semester-${note.semester}`];
                    if (note.tags && Array.isArray(note.tags)) {
                        labels.push(...note.tags);
                    }

                    // Sync to Gorse (fire-and-forget)
                    gorseService.upsertNote(
                        note.id,
                        categories,
                        labels,
                        !note.is_active || !note.is_approved  // Hidden if not active/approved
                    ).catch(err => console.warn('[Gorse] Note sync failed:', err));
                } catch (error) {
                    // Silent fail
                }
            });

            await cacheService.delPattern('notes:list:*');
            return res.status(201).json({ success: true, message: 'Note uploaded successfully (pending approval)', data: { noteId: note.id, title: note.title } });
        } catch (error: any) {
            console.error('Note creation error:', error);
            return res.status(500).json({ success: false, message: 'Failed to create note', error: process.env.NODE_ENV === 'development' ? error.message : undefined });
        }
    },
    update: async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;
            const userId = req.user!.id;
            const note = await prismaAny.notes.findUnique({ where: { id } });
            if (!note || note.seller_id !== userId) return res.status(403).json({ success: false, message: 'Unauthorized' });
            const { title, description, priceInr, tableOfContents, isActive, coverImage, previewPages } = req.body;

            // GOD-LEVEL LOGGING START (Update)
            console.log('--- NOTE UPDATE REQUEST RECEIVED ---');
            console.log('Update Note ID:', id);
            console.log('Body Keys:', Object.keys(req.body));
            if (previewPages) {
                console.log('Preview Pages Payload:', previewPages);
                console.log('Preview Pages Type:', typeof previewPages);
                console.log('Is Array?', Array.isArray(previewPages));
            }
            // GOD-LEVEL LOGGING END

            const updated = await prismaAny.notes.update({
                where: { id },
                data: {
                    title: title ? await sanitizeInput(title) : undefined,
                    description: description ? await sanitizeInput(description) : undefined,
                    price_inr: priceInr ? parseFloat(priceInr) : undefined,
                    table_of_contents: tableOfContents || undefined,
                    is_active: isActive !== undefined ? isActive : undefined,
                    cover_image: coverImage,
                    preview_pages: previewPages as any // Force cast to ANY to bypass Prisma/Json strictness
                }
            });

            // God-Level Cache Invalidation: Clear this note's cache + listings
            await Promise.all([
                cacheService.delPattern(`notes:detail:${id}:*`),
                cacheService.delPattern('notes:list:*')
            ]);

            return res.json({ success: true, data: updated, message: 'Note updated successfully' });
        } catch (error: any) {
            console.error('Update error:', error);
            return res.status(500).json({ success: false, message: 'Failed to update note' });
        }
    },
    delete: async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;
            const userId = req.user!.id;
            const note = await prismaAny.notes.findUnique({ where: { id } });
            if (!note || note.seller_id !== userId) return res.status(403).json({ success: false, message: 'Unauthorized' });
            await prismaAny.notes.update({ where: { id }, data: { is_deleted: true, is_active: false } });

            // God-Level Cache Invalidation: Clear this note's cache + listings
            await Promise.all([
                cacheService.delPattern(`notes:detail:${id}:*`),
                cacheService.delPattern('notes:list:*')
            ]);

            return res.json({ success: true, message: 'Note deleted successfully' });
        } catch (error: any) {
            return res.status(500).json({ success: false, message: 'Failed to delete note' });
        }
    },
    download: async (req: AuthRequest, res: Response) => {
        try {
            const { id } = req.params;
            const userId = req.user!.id;
            const note = await prismaAny.notes.findUnique({
                where: { id },
                select: { id: true, title: true, file_url: true, seller_id: true, is_active: true, is_deleted: true }
            });
            if (!note || note.is_deleted || !note.is_active) return res.status(404).json({ success: false, message: 'Note not found/unavailable' });
            const isSeller = note.seller_id === userId;
            let purchase = null;
            if (!isSeller) {
                purchase = await prismaAny.purchases.findFirst({ where: { user_id: userId, note_id: id, is_active: true } });
                if (!purchase) return res.status(403).json({ success: false, message: 'Purchase required' });
            }
            // Extract public_id (excluding optional version) from Cloudinary URL
            // Format: https://res.cloudinary.com/{cloud}/raw/{type}/{optionalVersion}/{public_id}.{extension}
            const fileUrl = note.file_url;

            // 0. Safety Check
            if (!fileUrl) {
                console.error('[Download] Error: Note has no file_url', note.id);
                return res.status(500).json({ success: false, message: 'Note file URL definition missing' });
            }

            console.log(`[Download] Processing URL for Note ${id}: ${fileUrl}`);

            // 1. Precise ID Extraction (Robust)
            // Support: upload, authenticated, and 'download' (which is sometimes seen in generated links)
            const urlPattern = /\/raw\/(upload|authenticated|download)\/(.+)$/;
            const match = fileUrl.match(urlPattern);

            if (!match) {
                console.error(`[Download] URL Match Failed for: ${fileUrl}`);
                return res.status(500).json({ success: false, message: 'Invalid file URL format', debug_url: fileUrl });
            }

            let rawType = match[1];
            // Normalize 'download' to 'upload' for signature generation, as 'download' isn't a valid storage access mode
            if (rawType === 'download') rawType = 'upload';

            // CLEANER EXTRACTION: Use Regex to strip 's--' and 'v' segments
            let relativePath = match[2];

            // 1. Strip signature first if present (starts with s--)
            relativePath = relativePath.replace(/^s--[^/]+--\//, '');

            // 2. Extract and strip version if present (starts with v + digits)
            const versionMatch = relativePath.match(/^v(\d+)\//);
            if (versionMatch) {
                relativePath = relativePath.replace(/^v\d+\//, '');
            }

            // Do NOT separate extension for raw files - it is part of the public_id
            let pidDecoded: string;

            // CRITICAL CRASH GUARD: decodeURIComponent can throw
            try {
                pidDecoded = decodeURIComponent(relativePath);
            } catch (uriError) {
                console.error('[Download] URI Decode Malformed:', uriError);
                // Fallback to raw path if decode fails
                pidDecoded = relativePath;
            }

            // Import Configured Cloudinary Instance directly to ensure credentials are active
            const { default: cloudinary } = await import('../config/cloudinary');

            console.log(`[Download] Generating Signed URL. ID: "${pidDecoded}" | Type: "${rawType}"`);


            // 3. Stats Update (Non-Blocking / Safe)
            // We prioritize delivering the file. If stats fail, we log it and move on.
            try {
                const updatePromises = [];
                if (purchase) {
                    updatePromises.push(prismaAny.purchases.update({
                        where: { id: purchase.id },
                        data: { download_count: { increment: 1 } }
                    }));
                }
                updatePromises.push(prismaAny.notes.update({
                    where: { id },
                    data: { download_count: { increment: 1 } }
                }));
                // Use allSettled to ensure neither promise failure throws
                await Promise.allSettled(updatePromises);
                console.log('[Download] Stats updated successfully');
            } catch (dbError) {
                console.error('[Download] Stats update failed (non-fatal):', dbError);
                // Continue to download generation
            }

            // 4. Generate Private Download URL
            // FIX: Use 'rawType' (authenticated/upload) instead of hardcoded 'upload'.
            const signedUrl = cloudinary.utils.private_download_url(pidDecoded, '', {
                resource_type: 'raw',
                type: rawType, // Crucial: Must match storage mode
                attachment: true,
                expires_at: Math.floor(Date.now() / 1000) + 3600
            });

            if (!signedUrl) {
                console.error('[Download] Cloudinary returned empty signedUrl');
                return res.status(500).json({ success: false, message: 'Failed to generate download link' });
            }

            // 3. Return immediately
            return res.json({
                success: true,
                data: {
                    downloadUrl: signedUrl
                }
            });
            // return res.json({ success: true, data: { downloadUrl: signedUrl, noteId: note.id, title: note.title } }); // Replaced by proxy
        } catch (error: any) {
            console.error('[Download] CRITICAL UNCAUGHT ERROR:', error);
            return res.status(500).json({ success: false, message: 'Download failed', error: error.message });
        }
    }
};
