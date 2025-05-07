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
        const router = useRouter();
        const showVoteDialog = ref(false);
        const voteComment = ref('');

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

        return {
            votes,
            voteCount,
            formatDate,
            showVoteDialog,
            voteComment,
            handleVoteClick,
            submitVote,
            cancelVote
        };
    }
});
</script>

<template>
    <div class="feature-item">
        <div class="d-flex">
            <div class="vote-column mr-4">
                <v-btn
                    icon
                    variant="text"
                    size="small"
                    color="grey-lighten-1"
                    @click="handleVoteClick"
                    class="vote-button"
                >
                    <v-icon>mdi-chevron-up</v-icon>
                </v-btn>
                <div class="vote-count text-center">
                    +{{ voteCount }}
                </div>
            </div>
            
            <div class="feature-content flex-grow-1">
                <div class="d-flex align-center mb-1">
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
                <div class="feature-description text-caption text-grey mb-1">
                    {{ feature.description }}
                </div>
                <div v-if="feature.targetRelease" class="text-caption mt-1">
                    Target Release: {{ feature.targetRelease }}
                </div>
                <div class="d-flex align-center mt-2">
                    <v-btn 
                        variant="text"
                        density="compact"
                        class="pa-0 mr-4"
                        :to="`/feature/${feature.uuid}`"
                    >
                        <v-icon size="small" class="mr-1">mdi-comment-outline</v-icon>
                        <span class="text-caption">{{ votes.length }} Comment{{ votes.length === 1 ? '' : 's' }}</span>
                    </v-btn>
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
            color: rgb(var(--v-theme-primary));
        }
    }
    
    .feature-title {
        font-size: 16px;
    }
    
    .feature-description {
        line-height: 1.4;
    }
}
</style>