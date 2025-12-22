import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as fs from 'fs/promises';
import { S3Client } from '@aws-sdk/client-s3';

const mockExec = jest.fn() as any;
jest.mock('child_process', () => ({
    exec: (cmd: string, opts: any, cb: any) => {
        if (!cb) { cb = opts; opts = {}; }
        mockExec(cmd, opts, (err: any, stdout: any, stderr: any) => {
            cb(err, stdout, stderr);
        });
    }
}));

const mockS3Client = {
    send: jest.fn() as any,
};

jest.mock('@aws-sdk/client-s3', () => ({
    S3Client: jest.fn(() => mockS3Client),
    PutObjectCommand: jest.fn(),
    ListObjectsV2Command: jest.fn(),
    GetObjectCommand: jest.fn(),
}));

const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
};

jest.mock('../../../src/services/logger', () => ({
    logger: mockLogger
}));

const mockAlertService = {
    sendAlert: jest.fn(),
};

jest.mock('../../../src/services/alertService', () => ({
    alertService: mockAlertService
}));

// Mock fs
jest.mock('fs/promises', () => ({
    mkdir: jest.fn(),
    stat: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    unlink: jest.fn(),
    readdir: jest.fn(),
}));

import { DatabaseBackupService } from '../../../src/services/databaseBackupService';

describe('DatabaseBackupService - Brutal Unit Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
        process.env.AWS_ACCESS_KEY_ID = 'key';
        process.env.AWS_SECRET_ACCESS_KEY = 'secret';
    });

    describe('initialize', () => {
        it('should initialize successfully', async () => {
            await DatabaseBackupService.initialize();
            expect(S3Client).toHaveBeenCalled();
            expect(fs.mkdir).toHaveBeenCalled();
        });

        it('should throw if no DATABASE_URL', async () => {
            delete process.env.DATABASE_URL;
            await expect(DatabaseBackupService.initialize()).rejects.toThrow('DATABASE_URL');
        });
    });

    describe('createFullBackup', () => {
        beforeEach(async () => {
            process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';
            await DatabaseBackupService.initialize();
        });

        it('should create backup successfully', async () => {
            mockExec.mockImplementation((cmd: string, opts: any, cb: any) => cb(null, '', ''));
            (fs.stat as any).mockResolvedValue({ size: 1024, mtime: new Date() });
            (fs.readdir as any).mockResolvedValue([]);
            (fs.readFile as any).mockResolvedValue(Buffer.from('data'));
            mockS3Client.send.mockResolvedValue({});

            const result = await DatabaseBackupService.createFullBackup();

            expect(result.success).toBe(true);
            expect(mockExec).toHaveBeenCalled(); // pg_dump
            expect(mockS3Client.send).toHaveBeenCalled(); // Upload
            expect(fs.unlink).not.toHaveBeenCalled(); // No cleanup if empty readdir
        });

        it('should handle backup failure', async () => {
            mockExec.mockImplementation((cmd: string, opts: any, cb: any) => cb(new Error('Dump failed'), '', ''));

            const result = await DatabaseBackupService.createFullBackup();

            expect(result.success).toBe(false);
            expect(mockAlertService.sendAlert).toHaveBeenCalled();
        });
    });

    describe('restoreFromBackup', () => {
        beforeEach(async () => {
            await DatabaseBackupService.initialize();
        });

        it('should restore successfully', async () => {
            mockS3Client.send.mockResolvedValue({ Body: [Buffer.from('data')] });
            mockExec.mockImplementation((cmd: string, opts: any, cb: any) => cb(null, '', ''));

            const result = await DatabaseBackupService.restoreFromBackup('key');

            expect(result).toBe(true);
            expect(mockS3Client.send).toHaveBeenCalled(); // Download
            expect(mockExec).toHaveBeenCalled(); // Restore
        });
    });
});
