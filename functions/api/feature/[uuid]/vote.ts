import type { PagesFunction, Vote, Feature, Env } from '../../../../src/shared/interfaces';
import { saveVoteToSheet, getAccessToken } from '../../../../src/shared/gman';

// Handle POST requests to /api/feature/[uuid]/vote
export const onRequestPost: PagesFunction = async (context) => {
    try {
        // Extract feature UUID from URL
        const featureUuid = context.params.uuid as string;
        
        // Extract request data (optional comment)
        const request = context.request;
        const requestData = await request.json();
        const { comment } = requestData;
        
        // Get timestamp as number (using Date.now() for milliseconds since epoch)
        const timestamp = Date.now();
        
        // Get IP address and User Agent for SHA256 hash
        const ip = request.headers.get('CF-Connecting-IP') || 
                   request.headers.get('X-Forwarded-For') || 
                   'unknown-ip';
        const userAgent = request.headers.get('User-Agent') || 'unknown-user-agent';
        
        // Generate SHA256 hash from IP + User Agent using SubtleCrypto
        const hashInput = `${ip}:${userAgent}`;
        const encoder = new TextEncoder();
        const data = encoder.encode(hashInput);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        
        // Convert hash buffer to hex string
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const sha256 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            
        // Create vote object
        const vote: Vote = {
            sha256,
            featureUuid,
            timestamp,
            comment: comment || '',
        };
        
        // Get OAuth 2.0 Access Token
        const clientId = (context.env as Env).GOOGLE_CLIENT_ID;
        const secretKey = (context.env as Env).GOOGLE_CLIENT_SECRET;
        if (!secretKey || !clientId) {
            console.error('GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET is not defined in environment variables.');
            return new Response(
                JSON.stringify({
                    error: 'Server configuration error: API key not found'
                }),
                {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }
        
        const accessToken = await getAccessToken(clientId, secretKey, (context.env as Env).KV_STORE);

        if (!accessToken) {
            return new Response(`Unable to retrieve access token.`, { status: 401 });
        }

        let featuresString = await (context.env as Env).KV_STORE.get("features");
        let features: Feature[] = featuresString ? JSON.parse(featuresString) : [];
        
        // Save vote to Google Sheets
        await saveVoteToSheet(vote, accessToken);
        
        await (context.env as Env).KV_STORE.put("features", JSON.stringify(features));

        return new Response(
            JSON.stringify({ message: 'Vote recorded successfully' }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );
        
    } catch (error) {
        console.error('Error processing vote:', error);
        
        return new Response(
            JSON.stringify({
                error: 'Failed to process vote',
                details: (error as Error).message
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
};
