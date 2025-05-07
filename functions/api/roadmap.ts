import { fetchRoadmapData } from '../../src/shared/gman';
import type { PagesFunction } from '../../src/shared/interfaces';

export const onRequest: PagesFunction = async (context: any) => {
    // CORS headers to allow requests from your frontend
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    // Handle preflight requests
    if (context.request.method === 'OPTIONS') {
        return new Response(null, { headers });
    }

    try {
        // Fetch roadmap data (features and votes)
        const data = await fetchRoadmapData();
        return new Response(JSON.stringify(data), { headers });

    } catch (error) {
        // Handle errors
        console.error('Error processing request:', error);
        return new Response(
            JSON.stringify({ error: (error as any).message || 'Internal server error' }),
            { status: 500, headers }
        );
    }
};
