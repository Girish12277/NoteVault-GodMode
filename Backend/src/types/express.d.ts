import { Request } from 'express';

declare global {
    namespace Express {
        interface User {
            id: string;
            email: string;
            fullName: string;
            isSeller: boolean;
            isAdmin: boolean;
        }

        interface Request {
            user?: User;
            session?: {
                id?: string;
                [key: string]: any;
            };
        }
    }
}

export { };
