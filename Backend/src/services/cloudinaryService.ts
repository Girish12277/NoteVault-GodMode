import cloudinary from 'cloudinary';
import fetch from 'node-fetch';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import crypto from 'crypto';

cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Generate a signed, time-limited download URL for Cloudinary assets
 * 
 * @param publicId - Cloudinary public_id of the asset
 * @param ttlSeconds - Time-to-live in seconds (default: 1 hour)
 * @returns Signed URL with expiration
 */
export function getSignedDownloadUrl(publicId: string, ttlSeconds: number = 3600): string {
    const url = cloudinary.v2.url(publicId, {
        resource_type: 'raw',
        type: 'authenticated',
        sign_url: true,
        secure: true,
        expires_at: Math.floor(Date.now() / 1000) + ttlSeconds
    });

    return url;
}

/**
 * Watermark a PDF and upload to Cloudinary
 * 
 * @param originalUrl - URL of original PDF
 * @param watermarkText - Text to embed (e.g., "Licensed to: user@example.com")
 * @param publicIdPrefix - Prefix for watermarked file public_id
 * @returns Cloudinary upload result with public_id and secure_url
 */
export async function watermarkAndUploadPdf(
    originalUrl: string,
    watermarkText: string,
    publicIdPrefix: string = 'watermarked'
): Promise<{ public_id: string; secure_url: string; sha256: string }> {
    // Fetch original PDF
    const resp = await fetch(originalUrl);
    if (!resp.ok) {
        throw new Error(`Failed to fetch PDF: ${resp.statusText}`);
    }

    const arrayBuffer = await resp.arrayBuffer();

    // Load PDF document
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Apply watermark to all pages
    const pages = pdfDoc.getPages();
    for (const page of pages) {
        const { width, height } = page.getSize();

        // Diagonal watermark across page
        page.drawText(watermarkText, {
            x: 50,
            y: height / 2,
            size: 14,
            font,
            color: rgb(0.5, 0.5, 0.5),
            rotate: degrees(-45),
            opacity: 0.25
        });

        // Small watermark in corner (harder to crop)
        page.drawText(watermarkText, {
            x: width - 200,
            y: 20,
            size: 8,
            font,
            color: rgb(0.6, 0.6, 0.6),
            opacity: 0.3
        });
    }

    // Save watermarked PDF
    const pdfBytes = await pdfDoc.save();

    // Calculate SHA-256 checksum
    const sha256 = crypto.createHash('sha256').update(Buffer.from(pdfBytes)).digest('hex');

    // Upload to Cloudinary
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.v2.uploader.upload_stream(
            {
                resource_type: 'raw',
                public_id: `${publicIdPrefix}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
                type: 'authenticated', // CRITICAL: Make watermarked PDFs private
                overwrite: false
            },
            (err, result) => {
                if (err) {
                    reject(err);
                } else if (result) {
                    resolve({
                        public_id: result.public_id,
                        secure_url: result.secure_url,
                        sha256
                    });
                } else {
                    reject(new Error('Upload failed with no error or result'));
                }
            }
        );

        uploadStream.end(Buffer.from(pdfBytes));
    });
}

/**
 * Validate file integrity using SHA-256 checksum
 */
export function calculateFileChecksum(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}
