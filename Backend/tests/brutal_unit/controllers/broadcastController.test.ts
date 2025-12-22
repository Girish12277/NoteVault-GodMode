import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { Request, Response } from 'express';

// ------------------------------------------------------------------
// MOCKS (Hoisted)
// ------------------------------------------------------------------

const mockBroadcastService = {
    sendCustomMessage: jest.fn() as any,
    createCampaign: jest.fn() as any,
    getCampaigns: jest.fn() as any,
    getCampaignStatus: jest.fn() as any,
    cancelCampaign: jest.fn() as any,
};

jest.mock('../../../src/services/broadcastService', () => ({
    __esModule: true,
    broadcastService: mockBroadcastService
}));

// Import Controller
import { broadcastController } from '../../../src/controllers/broadcastController';

// ------------------------------------------------------------------
// TEST SUITE
// ------------------------------------------------------------------

describe('BroadcastController - Brutal Unit Tests', () => {
    let req: Partial<Request> & { user?: any, body?: any, params?: any, query?: any };
    let res: Partial<Response>;
    let jsonMock: jest.Mock;
    let statusMock: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        jsonMock = jest.fn();
        statusMock = jest.fn().mockReturnValue({ json: jsonMock });

        req = { user: { id: 'admin_123' } as any, body: {}, params: {}, query: {} };
        res = { status: statusMock as any, json: jsonMock as any };
    });

    describe('sendCustomMessage', () => {
        it('should send custom message successfully', async () => {
            req.body = {
                userIds: ['user_1', 'user_2'],
                channels: ['email'],
                subject: 'Test Subject',
                message: 'Test message'
            };

            (mockBroadcastService.sendCustomMessage as any).mockResolvedValue({
                success: true,
                campaignId: 'campaign_123'
            });

            await broadcastController.sendCustomMessage(req as any, res as Response);

            expect(mockBroadcastService.sendCustomMessage).toHaveBeenCalledWith(
                expect.objectContaining({
                    userIds: ['user_1', 'user_2'],
                    channels: ['email'],
                    adminId: 'admin_123'
                })
            );

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                campaignId: 'campaign_123'
            }));
        });

        it('should return 400 if userIds empty', async () => {
            req.body = {
                userIds: [],
                channels: ['email'],
                message: 'Test'
            };

            await broadcastController.sendCustomMessage(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                error: 'Invalid request data'
            }));
        });

        it('should return 400 if channels invalid', async () => {
            req.body = {
                userIds: ['user_1'],
                channels: ['invalid_channel'],
                message: 'Test'
            };

            await broadcastController.sendCustomMessage(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('should validate max 1000 users', async () => {
            req.body = {
                userIds: new Array(1001).fill('user_1'),
                channels: ['email'],
                message: 'Test'
            };

            await broadcastController.sendCustomMessage(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('should return 500 if service fails', async () => {
            req.body = {
                userIds: ['user_1'],
                channels: ['email'],
                message: 'Test'
            };

            (mockBroadcastService.sendCustomMessage as any).mockResolvedValue({
                success: false,
                error: 'Send failed'
            });

            await broadcastController.sendCustomMessage(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });

    describe('createCampaign', () => {
        it('should create campaign successfully', async () => {
            req.body = {
                name: 'Test Campaign',
                channels: ['email', 'whatsapp'],
                message: 'Campaign message',
                segmentation: {
                    type: 'all'
                }
            };

            (mockBroadcastService.createCampaign as any).mockResolvedValue({
                success: true,
                campaignId: 'camp_456'
            });

            await broadcastController.createCampaign(req as any, res as Response);

            expect(mockBroadcastService.createCampaign).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'Test Campaign',
                    adminId: 'admin_123'
                })
            );

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                campaignId: 'camp_456'
            }));
        });

        it('should validate message length', async () => {
            req.body = {
                name: 'Test',
                channels: ['email'],
                message: 'a'.repeat(5001),
                segmentation: { type: 'all' }
            };

            await broadcastController.createCampaign(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(400);
        });

        it('should support userIds segmentation', async () => {
            req.body = {
                name: 'Test',
                channels: ['email'],
                message: 'Test',
                segmentation: {
                    type: 'userIds',
                    userIds: ['user_1', 'user_2']
                }
            };

            (mockBroadcastService.createCampaign as any).mockResolvedValue({
                success: true,
                campaignId: 'camp_1'
            });

            await broadcastController.createCampaign(req as any, res as Response);

            expect(mockBroadcastService.createCampaign).toHaveBeenCalled();
        });
    });

    describe('getCampaigns', () => {
        it('should list campaigns', async () => {
            (mockBroadcastService.getCampaigns as any).mockResolvedValue([
                { id: 'camp_1', name: 'Campaign 1' }
            ]);

            await broadcastController.getCampaigns(req as any, res as Response);

            expect(mockBroadcastService.getCampaigns).toHaveBeenCalledWith(
                expect.objectContaining({
                    adminId: 'admin_123'
                })
            );

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true
            }));
        });

        it('should filter by status', async () => {
            req.query = { status: 'COMPLETED' };

            (mockBroadcastService.getCampaigns as any).mockResolvedValue([]);

            await broadcastController.getCampaigns(req as any, res as Response);

            expect(mockBroadcastService.getCampaigns).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'COMPLETED'
                })
            );
        });
    });

    describe('getCampaignStatus', () => {
        it('should return campaign status', async () => {
            req.params = { id: 'camp_1' };

            (mockBroadcastService.getCampaignStatus as any).mockResolvedValue({
                id: 'camp_1',
                status: 'IN_PROGRESS',
                progress: 50
            });

            await broadcastController.getCampaignStatus(req as any, res as Response);

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                data: expect.objectContaining({
                    id: 'camp_1'
                })
            }));
        });

        it('should return 404 if campaign not found', async () => {
            req.params = { id: 'camp_999' };

            (mockBroadcastService.getCampaignStatus as any).mockResolvedValue(null);

            await broadcastController.getCampaignStatus(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(404);
        });
    });

    describe('cancelCampaign', () => {
        it('should cancel campaign', async () => {
            req.params = { id: 'camp_1' };

            (mockBroadcastService.cancelCampaign as any).mockResolvedValue(true);

            await broadcastController.cancelCampaign(req as any, res as Response);

            expect(jsonMock).toHaveBeenCalledWith(expect.objectContaining({
                success: true,
                message: expect.stringContaining('cancelled')
            }));
        });

        it('should return 500 if cancel fails', async () => {
            req.params = { id: 'camp_1' };

            (mockBroadcastService.cancelCampaign as any).mockResolvedValue(false);

            await broadcastController.cancelCampaign(req as any, res as Response);

            expect(statusMock).toHaveBeenCalledWith(500);
        });
    });
});
