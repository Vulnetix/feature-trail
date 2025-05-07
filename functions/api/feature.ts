import { v4 as uuidv4 } from 'uuid';
import type { PagesFunction, Feature, Vote, EventContext } from '../../src/shared/interfaces';
import { saveFeatureToSheet, saveVoteToSheet, getAccessToken } from '../../src/shared/gman';

export const onRequestPost: PagesFunction = async (context: EventContext) => {
    try {
        // Extract request data
        const request = context.request;
        const requestData = await request.json();
        
        const { title, description, comment, timestamp } = requestData;
        
        // Validate required fields
        if (!title || !description || !timestamp) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields' }),
                {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }
        
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
            
        // Generate a UUID for the feature
        const featureUuid = uuidv4();
        
        // Create feature with needsFeedback set to TRUE
        const feature: Feature = {
            uuid: featureUuid,
            title,
            description,
            timestamp,
            isComplete: false,
            needsFeedback: true,
            inProgress: false,
        };
        
        // Create initial vote with the optional comment
        const vote: Vote = {
            sha256,
            featureUuid,
            timestamp,
            comment: comment || '',
        };
        
        // save this data to the existing Google Sheet
        const clientId = context.env.GOOGLE_CLIENT_ID;
        const secretKey = context.env.GOOGLE_CLIENT_SECRET;
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
        // Get OAuth 2.0 Access Token
        const accessToken = await getAccessToken(clientId, secretKey, context.env.KV_STORE);
        return new Response(accessToken, {
            status: 200,
            headers: { 'Content-Type': 'text/html' }
        });
        if (!accessToken) {
            console.error('Failed to obtain access token.');
            return new Response(
                JSON.stringify({
                    error: 'Failed to Authenticate with Google Sheets API'
                }),
                {
                    status: 401,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }
        // Save feature and vote to Google Sheets
        await saveFeatureToSheet(feature, accessToken);
        await saveVoteToSheet(vote, accessToken);
        
        return new Response(
            JSON.stringify({ message: 'Feature request processed successfully' }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        );
        
    } catch (error) {
        console.error('Error processing feature request:', error);
        
        return new Response(
            JSON.stringify({
                error: 'Failed to process feature request',
                details: (error as Error).message
            }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
};