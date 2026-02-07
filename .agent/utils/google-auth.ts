import { config } from '../config/index.js';
import { logger } from '../orchestration/logger.js';
import { createServer } from 'node:http';
import { URL } from 'node:url';

/**
 * Manages Google OAuth 2.0 Authentication
 */
export class GoogleAuthManager {
    private static instance: GoogleAuthManager;
    private token: string | null = null;
    private tokenExpiry: number = 0;

    private constructor() {}

    static getInstance(): GoogleAuthManager {
        if (!GoogleAuthManager.instance) {
            GoogleAuthManager.instance = new GoogleAuthManager();
        }
        return GoogleAuthManager.instance;
    }

    /**
     * Get a valid access token, initiating auth flow if needed
     */
    async getAccessToken(): Promise<string> {
        if (this.token && Date.now() < this.tokenExpiry) {
            return this.token;
        }

        // If no valid token, start auth flow
        const code = await this.performAuthFlow();
        await this.exchangeCodeForToken(code);

        if (!this.token) {
            throw new Error('Failed to obtain access token');
        }

        return this.token;
    }

    /**
     * Start the local server and open browser for auth
     */
    private async performAuthFlow(): Promise<string> {
        const redirectUri = config.google.redirectUri;
        const port = 8082;

        const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
        authUrl.searchParams.append('client_id', config.google.clientId || '');
        authUrl.searchParams.append('redirect_uri', redirectUri);
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('scope', 'https://www.googleapis.com/auth/cloud-platform'); // Wide scope for now, refine later
        authUrl.searchParams.append('access_type', 'offline');

        console.log('\n🔑 Google Authentication Required');
        console.log('Please visit this URL to authorize the agent:');
        console.log(authUrl.toString());
        console.log('\nWaiting for authorization...');

        return new Promise((resolve, reject) => {
            const server = createServer(async (req, res) => {
                try {
                    const url = new URL(req.url || '/', `http://localhost:${port}`);
                    const code = url.searchParams.get('code');
                    const error = url.searchParams.get('error');

                    if (code) {
                        res.writeHead(200, { 'Content-Type': 'text/html' });
                        res.end('<h1>Authentication Successful!</h1><p>You can close this window and return to the agent.</p>');
                        server.close();
                        resolve(code);
                    } else if (error) {
                        res.writeHead(400, { 'Content-Type': 'text/html' });
                        res.end(`<h1>Authentication Failed</h1><p>${error}</p>`);
                        server.close();
                        reject(new Error(`Auth failed: ${error}`));
                    } else {
                         // Ignore favicon etc
                         res.writeHead(404);
                         res.end();
                    }
                } catch (e) {
                    reject(e);
                }
            });

            server.listen(port, () => {
                // We rely on the user manually clicking the link, can't easily open browser in this environment without specific tools
                // If the user already authorized, verify it listens correctly
            });
            
            // Timeout after 5 minutes
            setTimeout(() => {
                server.close();
                reject(new Error('Authentication timed out after 5 minutes'));
            }, 300000);
        });
    }

    /**
     * Exchange auth code for access token
     */
    private async exchangeCodeForToken(code: string): Promise<void> {
         const tokenUrl = 'https://oauth2.googleapis.com/token';
         const params = new URLSearchParams();
         params.append('code', code);
         params.append('client_id', config.google.clientId || '');
         params.append('client_secret', config.google.clientSecret || '');
         params.append('redirect_uri', config.google.redirectUri);
         params.append('grant_type', 'authorization_code');

         const response = await fetch(tokenUrl, {
             method: 'POST',
             headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
             body: params
         });

         if (!response.ok) {
             const error = await response.text();
             throw new Error(`Token exchange failed: ${error}`);
         }

         const data = await response.json() as { access_token: string; expires_in: number };
         this.token = data.access_token;
         // Set expiry slightly earlier than actual to be safe
         this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; 
         
         logger.info('Successfully authenticated with Google');
    }
}

export const googleAuth = GoogleAuthManager.getInstance();
