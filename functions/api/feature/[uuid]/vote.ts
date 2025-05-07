import type { PagesFunction, Vote, Env } from '../../../../src/shared/interfaces';

const HASH_NAMESPACE = '7a37826f-0628-4fcd-a084-3990c8427745'

export const onRequestPost: PagesFunction = async (context) => {
    try {
        // Extract feature UUID from URL
        const featureUuid = context.params.uuid as string;
        
        // Extract request data (optional comment)
        const request = context.request;
        const requestData = await request.json();
        const { comment } = requestData;
        
        // Get timestamp as number (using Date.now() for milliseconds since epoch)
        const timestamp = new Date().getTime();
        
        // Get IP address and User Agent for SHA256 hash
        const ip = request.headers.get('CF-Connecting-IP') || 
                   request.headers.get('X-Forwarded-For') || 
                   'unknown-ip';
        const userAgent = request.headers.get('User-Agent') || 'unknown-user-agent';
        
        // Generate SHA256 hash from IP + User Agent using SubtleCrypto
        const hashInput = `${HASH_NAMESPACE}:${ip}:${userAgent}`;
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
        // Save vote to KVM
        const kvKey = `vote:${vote.sha256}`;
        const kvValue = JSON.stringify(vote);
        await (context.env as Env).KV_STORE.put(kvKey, kvValue);            

        return Response.json({ vote });
        
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
