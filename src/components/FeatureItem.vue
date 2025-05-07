<script lang="ts">
import { defineComponent, computed, ref } from 'vue';
import { useRoadmapStore } from '../stores/roadmap';
import type { Feature } from '../shared/interfaces';
import { useRouter } from 'vue-router';

export default defineComponent({
    name: 'FeatureItem',
    props: {
        feature: {
            type: Object as () => Feature,
            required: true
        },
        showActionButtons: {
            type: Boolean,
            default: true
        }
    },
    setup(props) {
        const roadmapStore = useRoadmapStore();
        const showVoteDialog = ref(false);
        const voteComment = ref('');
        const router = useRouter();

        const votes = computed(() => {
            return roadmapStore.getVotesForFeature(props.feature.uuid);
        });

        const voteCount = computed(() => {
            return votes.value.length;
        });

        const handleVoteClick = () => {
            showVoteDialog.value = true;
        };

        const submitVote = async () => {
            await roadmapStore.voteForFeature(props.feature.uuid, voteComment.value);
            showVoteDialog.value = false;
            voteComment.value = '';
        };

        const cancelVote = () => {
            showVoteDialog.value = false;
            voteComment.value = '';
        };

        const clickFeature = (featureUuid: string) => {
            router.push(`/feature/${featureUuid}`);
        }

        // Format date string
        const formatDate = (dateString: string): string | null => {
            if (!dateString) return null;

            try {
                const date = new Date(dateString);
                const formattedDate = new Intl.DateTimeFormat('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                }).format(date);
                return formattedDate;
            } catch (e) {
                return null;
            }
        };

        // Format timestamp as "time ago"
        const formatTimeAgo = (timestamp: number): string => {
            if (!timestamp) return '';
            
            const now = new Date();
            const date = new Date(timestamp);
            const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
            
            let interval = Math.floor(seconds / 31536000); // years
            if (interval >= 1) return `${interval} ${interval === 1 ? 'year' : 'years'} ago`;
            
            interval = Math.floor(seconds / 2592000); // months
            if (interval >= 1) return `${interval} ${interval === 1 ? 'month' : 'months'} ago`;
            
            interval = Math.floor(seconds / 86400); // days
            if (interval >= 1) return `${interval} ${interval === 1 ? 'day' : 'days'} ago`;
            
            interval = Math.floor(seconds / 3600); // hours
            if (interval >= 1) return `${interval} ${interval === 1 ? 'hour' : 'hours'} ago`;
            
            interval = Math.floor(seconds / 60); // minutes
            if (interval >= 1) return `${interval} ${interval === 1 ? 'minute' : 'minutes'} ago`;
            
            return `${Math.floor(seconds)} ${Math.floor(seconds) === 1 ? 'second' : 'seconds'} ago`;
        };

        return {
            votes,
            voteCount,
            formatDate,
            formatTimeAgo,
            showVoteDialog,
            voteComment,
            handleVoteClick,
            submitVote,
            cancelVote,
            clickFeature
        };
    }
});
</script>

<template>
    <div class="feature-item">
        <div class="d-flex">
            <div class="vote-column mr-4">
                <v-tooltip location="left" theme="light">
                    <template v-slot:activator="{ props }">
                        <v-btn
                            :style="{ visibility: !feature.inProgress && !feature.isComplete ? 'visible' : 'hidden' }"
                            v-bind="props"
                            icon
                            variant="text"
                            color="green-lighten-1"
                            @click="handleVoteClick"
                            class="vote-button"
                        >
                            <v-icon>mdi-chevron-up</v-icon>
                        </v-btn>
                    </template>
                    <span>Vote Up</span>
                </v-tooltip>
                <v-tooltip location="left" theme="light">
                    <template v-slot:activator="{ props }">
                        <div
                            v-bind="props"
                            class="vote-count text-center"
                            :class="{ 'text-primary': voteCount > 0, 'text-info': voteCount === 0 }"
                            :style="{ cursor: 'pointer' }"
                        >
                            {{ voteCount > 0 ? '+' : '' }}
                            {{ Math.abs(voteCount) }}
                        </div>
                    </template>
                    <span>{{ voteCount > 0 ? 'Votes' : 'No Votes Yet' }}</span>
                </v-tooltip>
            </div>
            <div
                class="feature-content flex-grow-1"
                @click="() => clickFeature(feature.uuid)"
                :style="{ cursor: 'pointer' }"
            >
                <div class="d-flex align-center justify-space-between mb-1">
                    <div class="d-flex align-center">
                        <v-chip 
                            v-if="feature.inProgress" 
                            color="primary" 
                            class="text-caption mr-2" 
                            size="x-small"
                        >
                            In Progress
                        </v-chip>
                        <v-chip 
                            v-else-if="feature.isComplete" 
                            color="success" 
                            class="text-caption mr-2" 
                            size="x-small"
                        >
                            Complete
                        </v-chip>
                        <span class="feature-title font-weight-medium">{{ feature.title }}</span>
                    </div>
                    <time 
                        :datetime="new Date(feature.timestamp).toLocaleString()" 
                        class="timestamp text-caption text-grey"
                    >
                        <v-tooltip location="right" theme="light">
                            <template v-slot:activator="{ props }">
                                <span v-bind="props">{{ formatTimeAgo(feature.timestamp) }}</span>
                            </template>
                            <span>{{ new Date(feature.timestamp).toLocaleString() }}</span>
                        </v-tooltip>
                    </time>
                </div>
                <div class="feature-description text-caption text-grey mb-1">
                    {{ feature.description }}
                </div>
                <div v-if="feature.targetRelease" class="text-caption mt-1">
                    Target Release: {{ feature.targetRelease }}
                </div>
                <div class="d-flex align-center mt-2">
                    <div class="pa-0 mr-4">
                        <v-icon size="small" class="mr-1">mdi-comment-outline</v-icon>
                        <span class="text-caption">{{ votes.length }} Comment{{ votes.length === 1 ? '' : 's' }}</span>
                    </div>
                </div>

            </div>
        </div>

        <!-- Vote Dialog -->
        <v-dialog v-model="showVoteDialog" max-width="500">
            <v-card>
                <v-card-title class="text-h5">
                    Vote for Feature
                </v-card-title>
                
                <v-card-text>
                    <p class="mb-4">You are voting for: <strong>{{ feature.title }}</strong></p>
                    
                    <v-textarea
                        v-model="voteComment"
                        label="Optional Comment"
                        hint="Add a comment to explain why you're voting for this feature"
                        auto-grow
                        rows="3"
                    />
                </v-card-text>
                
                <v-card-actions>
                    <v-spacer />
                    <v-btn
                        color="grey-darken-1"
                        variant="text"
                        @click="cancelVote"
                    >
                        Cancel
                    </v-btn>
                    <v-btn
                        color="primary"
                        variant="text"
                        @click="submitVote"
                    >
                        Submit Vote
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<style lang="scss" scoped>
.feature-item {
    padding: 16px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 8px;
    margin-bottom: 16px;
    transition: all 0.2s ease;
    
    &:hover {
        background-color: rgba(255, 255, 255, 0.05);
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    }
    
    .vote-column {
        display: flex;
        flex-direction: column;
        align-items: center;
        
        .vote-button {
            margin-bottom: 4px;
            
            &:hover {
                color: rgb(var(--v-theme-primary));
            }
        }
        
        .vote-count {
            font-size: 14px;
            font-weight: 600;
        }
    }
    
    .feature-title {
        font-size: 16px;
    }
    
    .feature-description {
        line-height: 1.4;
    }
    
    .timestamp {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.6);
        white-space: nowrap;
        
        &:hover {
            text-decoration: underline;
            cursor: help;
        }
    }
}
</style>