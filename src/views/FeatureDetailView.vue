<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useRoadmapStore } from '@/stores/roadmap';
import type { Feature, Vote } from '@/shared/interfaces';

interface Comment {
    id: string;
    text: string;
    timestamp: number;
}

export default defineComponent({
    name: 'FeatureDetailView',
    setup() {
        const route = useRoute();
        const router = useRouter();
        const roadmapStore = useRoadmapStore();
        const feature = ref<Feature | null>(null);
        const votes = ref<Vote[]>([]);
        const comments = ref<Comment[]>([]);
        const featureUuid = route.params.uuid as string;

        onMounted(async () => {
            if (roadmapStore.features.length === 0) {
                await roadmapStore.fetchRoadmapData();
            }
            const existingFeature = roadmapStore.features.find(f => f.uuid === featureUuid);
            if (existingFeature) {
                feature.value = existingFeature;
            } else {
                
            }
            votes.value = roadmapStore.votes.filter(v => v.featureUuid === featureUuid)
            comments.value = votes.value.filter(v => !!v.comment).map(v => ({
                id: v.sha256,
                text: v.comment,
                timestamp: v.timestamp,
            } as Comment));
        });

        const formatDate = (timestamp: number) => {
            return new Date(timestamp).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        };

        const goBack = () => {
            router.back();
        };

        return {
            feature,
            votes,
            comments,
            formatDate,
            goBack,
        };
    },
});
</script>

<template>
    <v-container>
        <v-row align="start">
            <v-col cols="auto" class="pa-0 pr-md-4 pr-2">
                <v-btn icon="mdi-arrow-left" variant="text" @click="goBack" />
            </v-col>
            <v-col>
                <v-card>
                    <v-card-title>
                        {{ feature?.title }}
                        <v-chip class="ml-2" color="primary" variant="elevated">
                            Votes: {{ votes.length }}
                        </v-chip>
                    </v-card-title>
                    <v-card-subtitle>{{ feature?.description }}</v-card-subtitle>
                    <v-card-text>
                        <h3>Comments</h3>
                        <v-container fluid>
                            <v-timeline side="end" size="large" density="compact">
                                <v-timeline-item
                                    v-for="comment in comments"
                                    :key="comment.id"
                                    dot-color="primary"
                                    fill-dot
                                    icon="mdi-comment-text-outline"
                                >
                                    <template v-slot:default>
                                        <div class="d-flex">
                                            {{ formatDate(comment.timestamp) }}
                                        </div>
                                        <h3>{{ comment.text }}</h3>
                                    </template>
                                </v-timeline-item>
                            </v-timeline>
                        </v-container>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </v-container>
</template>
