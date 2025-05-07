<script lang="ts">
import { defineComponent, onMounted } from 'vue';
import { useRoadmapStore } from '../stores/roadmap';
import FeatureItem from '../components/FeatureItem.vue';

export default defineComponent({
    name: 'NeedFeedbackView',
    components: {
        FeatureItem
    },
    setup() {
        const roadmapStore = useRoadmapStore();
        
        // Fetch roadmap data on component mount
        onMounted(() => {
            loadRoadmapData();
        });
        
        // Function to fetch roadmap data
        const loadRoadmapData = async () => {
            await roadmapStore.fetchRoadmapData('needsFeedback');
        };
        
        // Function to refresh data
        const refreshData = () => {
            loadRoadmapData();
        };
        
        return {
            roadmapStore,
            refreshData
        };
    }
});
</script>

<template>
    <div class="roadmap-container">
        <v-container>
            <v-row>
                <v-col cols="12">
                    <h1 class="text-h3 mb-6">Product Roadmap | Needs Feedback</h1>
                    
                    <v-alert
                        v-if="roadmapStore.error"
                        type="error"
                        closable
                        variant="tonal"
                        class="mb-4"
                    >
                        {{ roadmapStore.error }}
                    </v-alert>
                    
                    <v-card v-if="roadmapStore.isLoading" flat>
                        <v-card-text class="text-center">
                            <v-progress-circular
                                indeterminate
                                color="primary"
                                size="64"
                            ></v-progress-circular>
                            <p class="mt-4">Loading roadmap data...</p>
                        </v-card-text>
                    </v-card>

                    <template v-else>
                        <!-- Features Needing Feedback -->
                        <section v-if="roadmapStore.getFeedbackFeatures.length > 0" class="mb-8">
                            <h2 class="text-h4 mb-4">Feedback Requested</h2>
                            <v-expansion-panels>
                                <FeatureItem 
                                    v-for="feature in roadmapStore.getFeedbackFeatures" 
                                    :key="feature.uuid" 
                                    :feature="feature"
                                />
                            </v-expansion-panels>
                        </section>
                        
                        <v-btn
                            color="primary"
                            @click="refreshData"
                            class="mt-4"
                        >
                            Refresh Data
                        </v-btn>
                    </template>
                </v-col>
            </v-row>
        </v-container>
    </div>
</template>

<style lang="scss" scoped>
.roadmap-container {
    padding: 24px 0;
    
    h1, h2 {
        font-weight: 500;
    }
}
</style>