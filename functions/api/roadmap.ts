import { fetchFeatures } from '../../src/shared/gman';
import type { PagesFunction, Vote, Feature } from '../../src/shared/interfaces';

export const onRequestGet: PagesFunction = async (context: any) => {
    try {
        const features: Feature[] = await fetchFeatures()
        const votesCache = await context.env.KV_STORE.list({prefix: 'vote:'})
        const votes: Vote[] = []
        for (const key of votesCache.keys) {
            const voteData = await context.env.KV_STORE.get(key.name)
            if (voteData) {
                const vote: Vote = JSON.parse(voteData)
                votes.push(vote)
            }
        }
        return Response.json({ features, votes });

    } catch (error) {
        // Handle errors
        console.error('Error processing request:', error);
        return new Response(
            JSON.stringify({ error: (error as any).message || 'Internal server error' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
