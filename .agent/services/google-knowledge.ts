import { googleAuth } from '../utils/google-auth.js';
import { logger } from '../orchestration/logger.js';
import { config } from '../config/index.js';

interface KnowledgeDocument {
    name: string;
    title: string;
    markdownContent?: string;
    url: string;
}

interface SearchResponse {
    results: {
        document: KnowledgeDocument;
        snippets: string[];
    }[];
}

export class GoogleKnowledgeService {
    private static baseUrl = 'https://developerknowledge.googleapis.com/v1alpha';

    /**
     * Search for developer documentation
     */
    async search(query: string): Promise<SearchResponse> {
        const token = await googleAuth.getAccessToken();
        const projectId = config.google.projectId;

        if (!projectId) {
            throw new Error('Google Project ID is not configured');
        }
        
        // The API endpoint for searching knowledge
        const url = `${GoogleKnowledgeService.baseUrl}/projects/${projectId}/knowledge:search`;
        
        logger.info(`Searching Google Knowledge: ${query}`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: query,
                pageSize: 5 // Limit results for readability
            })
        });

        if (!response.ok) {
            const error = await response.text();
            logger.error('Google Knowledge Search Failed', new Error(error));
            throw new Error(`Knowledge Search Failed: ${error}`);
        }

        return await response.json() as SearchResponse;
    }

    /**
     * Get a specific document by resource name
     */
    async getDocument(resourceName: string): Promise<KnowledgeDocument> {
        const token = await googleAuth.getAccessToken();
        
        // Resource name includes project/location/etc, so append to base? 
        // Actually, resourceName is usually just passed to the get endpoint.
        // Assuming GetDocument endpoint exists or we rely on search results.
        // Based on research, we might just search. 
        // But let's try a direct get if the resource name is known.
        
        const url = `https://developerknowledge.googleapis.com/${resourceName}`;
        
        const response = await fetch(url, {
             headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
             throw new Error(`Failed to get document: ${response.statusText}`);
        }

        return await response.json() as KnowledgeDocument;
    }
}

export const googleKnowledge = new GoogleKnowledgeService();
