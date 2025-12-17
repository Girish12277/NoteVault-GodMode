
import { prisma } from '../src/config/database';
import { cloudinary } from '../src/config/cloudinary';
import { noteController } from '../src/controllers/noteController'; // We can't easily invoke controller directly without Mock Rect/Res.
// Instead, let's replicate the logic EXACTLY.

(async () => {
    try {
        // 1. Get Admin
        const admin = await prisma.users.findFirst({ where: { is_admin: true } });
        if (!admin) throw new Error("No admin found");
        console.log("Admin:", admin.email);

        // 2. Get Purchase
        const purchase = await prisma.purchases.findFirst({ where: { user_id: admin.id } });
        if (!purchase) throw new Error("No purchase found for admin");
        console.log("Purchase Found:", purchase.id, "for Note:", purchase.note_id);

        const noteId = purchase.note_id;
        const userId = admin.id;

        // 3. Replicate Controller Logic
        const note = await prisma.notes.findUnique({
            where: { id: noteId },
            select: { id: true, title: true, file_url: true, seller_id: true, is_active: true, is_deleted: true }
        });

        if (!note || note.is_deleted || !note.is_active) {
            console.error("Note 404/Unavailable");
            return;
        }

        const isSeller = note.seller_id === userId;
        let purchaseCheck = null;

        if (!isSeller) {
            purchaseCheck = await prisma.purchases.findFirst({ where: { user_id: userId, note_id: noteId, is_active: true } });
            if (!purchaseCheck) {
                console.error("Purchase Required (403)");
                return;
            } else {
                console.log("Purchase Verified!");
            }
        } else {
            console.log("User is Seller (Owner Access)");
        }

        // 4. URL Logic
        const fileUrl = note.file_url;
        console.log("File URL:", fileUrl);

        const urlPattern = /\/raw\/(upload|authenticated|download)\/(.+)$/;
        const match = fileUrl.match(urlPattern);

        if (!match) {
            console.error("Invalid URL Pattern");
            return;
        }

        let rawType = match[1];
        if (rawType === 'download') rawType = 'upload';

        const relativePath = match[2].replace(/^s--[^/]+--\//, '').replace(/^v\d+\//, '');
        const pidDecoded = decodeURIComponent(relativePath);

        console.log("PID:", pidDecoded);
        console.log("Type:", rawType);

        // 5. Signed URL
        const signedUrl = cloudinary.utils.private_download_url(pidDecoded, '', {
            resource_type: 'raw',
            type: rawType,
            attachment: true,
            expires_at: Math.floor(Date.now() / 1000) + 3600
        });

        if (!signedUrl) {
            console.error("Failed to generate signed URL");
        } else {
            console.log("SUCCESS! Signed URL generated:");
            console.log(signedUrl);
        }

    } catch (e) {
        console.error("Script Error:", e);
    }
})();
