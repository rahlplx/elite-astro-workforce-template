import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GoogleKnowledgeService } from '../services/google-knowledge.js';
import { googleAuth } from '../utils/google-auth.js';

// Mock dependencies
vi.mock('../orchestration/logger.js', () => ({
    logger: {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn()
    }
}));

vi.mock('../config/index.js', () => ({
    config: {
        google: {
            projectId: 'test-project',
            clientId: 'test-client-id',
            clientSecret: 'test-client-secret',
            redirectUri: 'http://localhost'
        }
    }
}));

vi.mock('../utils/google-auth.js', () => ({
    googleAuth: {
        getAccessToken: vi.fn()
    }
}));

describe('GoogleKnowledgeService', () => {
    let service: GoogleKnowledgeService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new GoogleKnowledgeService();
        global.fetch = vi.fn();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should search for documentation', async () => {
        // Mock auth token
        vi.spyOn(googleAuth, 'getAccessToken').mockResolvedValue('mock-token');

        // Mock fetch
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                results: [
                    {
                        document: {
                            title: 'Firebase Auth Guide',
                            url: 'https://firebase.google.com/docs/auth'
                        },
                        snippets: ['How to implement authentication...']
                    }
                ]
            })
        });

        const results = await service.search('firebase auth');

        expect(googleAuth.getAccessToken).toHaveBeenCalled();
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('knowledge:search'),
            expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    'Authorization': 'Bearer mock-token'
                })
            })
        );
        expect(results.results[0].document.title).toBe('Firebase Auth Guide');
    });

    it('should handle API errors', async () => {
        vi.spyOn(googleAuth, 'getAccessToken').mockResolvedValue('mock-token');
        
        global.fetch = vi.fn().mockResolvedValue({
            ok: false,
            text: async () => 'API Error'
        });

        await expect(service.search('query')).rejects.toThrow('Knowledge Search Failed: API Error');
    });
});
