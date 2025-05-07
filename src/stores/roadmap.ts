import { defineStore } from 'pinia';
import type { FeatureRequest, Feature, Vote } from '../shared/interfaces';

export type { RoadmapState };

interface RoadmapState {
    features: Feature[];
    votes: Vote[];
    isLoading: boolean;
    error: string | null;
}

export const useRoadmapStore = defineStore('roadmap', {
    state: (): RoadmapState => ({
        features: [],
        votes: [],
        isLoading: false,
        error: null
    }),

    getters: {
        // Get all features
        getFeatures: (state) => state.features.filter((feature: Feature) => !feature.needsFeedback),

        // Get completed features
        getCompletedFeatures: (state) =>
            state.features.filter((feature: Feature) => !feature.needsFeedback && feature.isComplete),

        // Get features in progress
        getInProgressFeatures: (state) =>
            state.features.filter((feature: Feature) => !feature.needsFeedback && feature.inProgress),

        // Get features needing feedback
        getFeedbackFeatures: (state) =>
            state.features.filter((feature: Feature) => feature.needsFeedback),

        // Get votes for a specific feature
        getVotesForFeature: (state) => (featureUuid: string) =>
            state.votes.filter((vote: Vote) => vote.featureUuid === featureUuid),

        // Get vote count for a feature
        getVoteCountForFeature: (state) => (featureUuid: string) =>
            state.votes.filter((vote: Vote) => vote.featureUuid === featureUuid).length,

        // Get features sorted by most votes
        getMostVotedFeatures: (state) => {
            return [...state.features]
                .filter(feature => !feature.needsFeedback)
                .sort((a, b) => {
                    const votesForA = state.votes.filter((vote: Vote) => vote.featureUuid === a.uuid).length;
                    const votesForB = state.votes.filter((vote: Vote) => vote.featureUuid === b.uuid).length;
                    return votesForB - votesForA; // Sort in descending order
                });
        },

        hasUserVoted: (state) => (featureUuid: string): boolean => {
            // Check if user has already voted for this feature
            // This is a simplification - in a real app, you'd check user's ID
            const userIdentifier = localStorage.getItem('userIdentifier') || '';
            return state.votes.some((vote: Vote) =>
                vote.featureUuid === featureUuid &&
                vote.userIdentifier === userIdentifier
            );
        }
    },

    actions: {
        // Fetch all roadmap data from the API
        async fetchRoadmapData(filter: 'inProgress' | 'isComplete' | 'needsFeedback' | null = null) {
            // Check if data is already loaded for the given filter
            if (this.features.length > 0 && !filter) {
                return;
            }

            this.isLoading = true;
            this.error = null;

            try {
                const queryParam = filter ? `?filter=${filter}` : '';
                const response = await fetch(`/api/roadmap${queryParam}`);

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `HTTP error ${response.status}`);
                }

                const data = await response.json();

                this.features = data.features || [];
                this.votes = data.votes || [];
            } catch (error) {
                this.error = (error as any).message || 'Failed to fetch roadmap data';
                console.error('Error fetching roadmap data:', error);
            } finally {
                this.isLoading = false;
            }
        },

        // Vote for a feature
        async voteForFeature(featureUuid: string, comment: string = ''): Promise<void> {
            // Simple user identifier stored in localStorage (in a real app, use auth)
            let userIdentifier = localStorage.getItem('userIdentifier');
            if (!userIdentifier) {
                userIdentifier = `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                localStorage.setItem('userIdentifier', userIdentifier);
            }

            // Check if user has already voted
            if (this.hasUserVoted(featureUuid)) {
                console.error('User has already voted for this feature');
                this.error = 'You have already voted for this feature.';

                return;
            }

            try {
                const timestamp = Math.floor(Date.now() / 1000); // Unix timestamp in seconds

                const response = await fetch(`/api/feature/${featureUuid}/vote`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        featureUuid,
                        timestamp,
                        userIdentifier,
                        comment
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `HTTP error ${response.status}`);
                }

                // Get the response data which should contain the new vote
                const newVoteData = await response.json();

                // Add the new vote to the votes array in the store
                if (newVoteData && newVoteData.vote) {
                    this.votes.push(newVoteData.vote);
                }

            } catch (error) {
                this.error = (error as any).message || 'Failed to submit vote';
                console.error('Error submitting vote:', error);
            }
        }
    }
});