import { Router } from 'express';
import { prisma } from '../config/database';

const router = Router();

router.get('/sitemap.xml', async (req, res) => {
    try {
        const notes = await prisma.notes.findMany({
            where: { is_active: true, is_approved: true },
            select: { id: true, updated_at: true },
            take: 5000 // Limit for performance
        });

        const categories = await prisma.categories.findMany({
            select: { slug: true, updated_at: true }
        });

        const baseUrl = 'https://frontend-blue-sigma-18.vercel.app';

        const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Homepage -->
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <lastmod>${new Date().toISOString()}</lastmod>
  </url>
  
  <!-- Static Pages -->
  <url>
    <loc>${baseUrl}/browse</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/how-it-works</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>${baseUrl}/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  
  <!-- Category Pages -->
  ${categories.map(cat => `
  <url>
    <loc>${baseUrl}/browse?category=${encodeURIComponent(cat.slug)}</loc>
    <lastmod>${cat.updated_at.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')}
  
  <!-- Note Pages -->
  ${notes.map(note => `
  <url>
    <loc>${baseUrl}/notes/${note.id}</loc>
    <lastmod>${note.updated_at.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`).join('')}
</urlset>`;

        res.header('Content-Type', 'application/xml');
        res.send(sitemap);
    } catch (error) {
        console.error('Sitemap generation error:', error);
        res.status(500).send('Error generating sitemap');
    }
});

export default router;
