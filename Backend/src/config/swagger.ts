import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Express } from 'express';

/**
 * Swagger API Documentation Configuration
 */

const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'StudyVault API',
        version: '1.0.0',
        description: `
# StudyVault Notes Marketplace API

A comprehensive API for the StudyVault digital notes marketplace platform.

## Features
- 🔐 **Authentication** - JWT-based auth with refresh tokens
- 📚 **Notes** - CRUD operations for digital notes
- 🔍 **Search** - Full-text search with filters
- 💳 **Payments** - Razorpay integration
- 👤 **User Management** - Buyer, Seller, Admin roles
- ☁️ **File Upload** - Cloudinary integration

## Authentication
Most endpoints require a Bearer token. Get one from \`/api/auth/login\`.

\`\`\`
Authorization: Bearer <your-access-token>
\`\`\`

## Security
All endpoints are rate-limited and secured.
        `,
        contact: {
            name: 'StudyVault Team',
            email: 'support@studyvault.com'
        },
        license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT'
        }
    },
    servers: [
        {
            url: 'http://localhost:5000',
            description: 'Development server'
        }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Enter your JWT token'
            }
        },
        schemas: {
            Error: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: false },
                    message: { type: 'string', example: 'Error message' },
                    code: { type: 'string', example: 'ERROR_CODE' }
                }
            },
            Success: {
                type: 'object',
                properties: {
                    success: { type: 'boolean', example: true },
                    data: { type: 'object' }
                }
            },
            User: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    email: { type: 'string', format: 'email' },
                    fullName: { type: 'string' },
                    isSeller: { type: 'boolean' },
                    isAdmin: { type: 'boolean' },
                    degree: { type: 'string' },
                    currentSemester: { type: 'integer' }
                }
            },
            Note: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    title: { type: 'string' },
                    description: { type: 'string' },
                    subject: { type: 'string' },
                    degree: { type: 'string' },
                    semester: { type: 'integer' },
                    priceInr: { type: 'number' },
                    averageRating: { type: 'number' },
                    totalReviews: { type: 'integer' },
                    seller: { $ref: '#/components/schemas/User' }
                }
            },
            Category: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    nameHi: { type: 'string' },
                    slug: { type: 'string' },
                    icon: { type: 'string' }
                }
            },
            University: {
                type: 'object',
                properties: {
                    id: { type: 'string', format: 'uuid' },
                    name: { type: 'string' },
                    shortName: { type: 'string' },
                    state: { type: 'string' },
                    city: { type: 'string' }
                }
            },
            LoginRequest: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                    email: { type: 'string', format: 'email', example: 'seller@studyvault.com' },
                    password: { type: 'string', example: 'Test@123' }
                }
            },
            RegisterRequest: {
                type: 'object',
                required: ['email', 'password', 'name'],
                properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 8 },
                    name: { type: 'string' },
                    degree: { type: 'string' },
                    universityId: { type: 'string', format: 'uuid' },
                    currentSemester: { type: 'integer', minimum: 1, maximum: 10 }
                }
            },
            Pagination: {
                type: 'object',
                properties: {
                    total: { type: 'integer' },
                    page: { type: 'integer' },
                    limit: { type: 'integer' },
                    totalPages: { type: 'integer' }
                }
            }
        }
    },
    tags: [
        { name: 'Health', description: 'Health check endpoints' },
        { name: 'Auth', description: 'Authentication endpoints' },
        { name: 'Categories', description: 'Category management' },
        { name: 'Universities', description: 'University data' },
        { name: 'Notes', description: 'Notes CRUD operations' },
        { name: 'Search', description: 'Search functionality' },
        { name: 'Reviews', description: 'Note reviews' },
        { name: 'Payments', description: 'Payment processing' },
        { name: 'Upload', description: 'File uploads' },
        { name: 'Seller', description: 'Seller dashboard' },
        { name: 'Admin', description: 'Admin operations' },
        { name: 'Cart', description: 'Shopping cart' },
        { name: 'Orders', description: 'Order history' }
    ]
};

const options = {
    swaggerDefinition,
    apis: [
        './src/routes/*.ts',
        './src/config/swagger-docs.ts' // Additional docs
    ]
};

const swaggerSpec = swaggerJsdoc(options);

/**
 * Setup Swagger documentation
 */
export const setupSwagger = (app: Express) => {
    // SECURITY: Disable API Docs in Production to prevent Reconnaissance
    if (process.env.NODE_ENV !== 'development') {
        return;
    }

    // Swagger UI
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'StudyVault API Docs',
        swaggerOptions: {
            persistAuthorization: true,
            displayRequestDuration: true,
            filter: true,
            showExtensions: true
        }
    }));

    // JSON spec endpoint
    app.get('/api-docs.json', (_req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });

    console.log('📚 API Documentation available at /api-docs');
};

export default swaggerSpec;
