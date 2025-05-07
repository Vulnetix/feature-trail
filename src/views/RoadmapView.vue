<script lang="ts">
import { defineComponent, onMounted, ref } from 'vue';
import { useRoadmapStore } from '../stores/roadmap';
import FeatureItem from '../components/FeatureItem.vue';

export default defineComponent({
    name: 'RoadmapView',
    components: {
        FeatureItem
    },
    setup() {
        const roadmapStore = useRoadmapStore();
        const activeTab = ref('all');
        const alert = ref({
            show: false,
            message: '',
            type: 'info' as 'info' | 'success' | 'error' | 'warning',
            timeout: 5000
        });
        const previousFeatureCount = ref(0);
        const isInitialLoad = ref(true);
        
        // Fetch roadmap data on component mount
        onMounted(() => {
            if (roadmapStore.features.length === 0) {
                loadRoadmapData(true);
            } else {
                previousFeatureCount.value = roadmapStore.features.length;
                isInitialLoad.value = false;
            }
        });
        
        // Function to fetch roadmap data
        const loadRoadmapData = async (initialLoad = false) => {
            const oldCount = roadmapStore.features.length;
            previousFeatureCount.value = oldCount;
            
            await roadmapStore.fetchRoadmapData();
            
            // Only show alerts if not the initial page load
            if (!initialLoad && !isInitialLoad.value) {
                const newCount = roadmapStore.features.length;
                const newFeaturesCount = newCount - oldCount;
                
                if (newFeaturesCount > 0) {
                    showAlert(`${newFeaturesCount} new feature${newFeaturesCount > 1 ? 's' : ''} loaded`, 'success');
                } else {
                    showAlert(`No new features available`, 'info');
                }
            }
            
            // After the first load is complete, set isInitialLoad to false
            isInitialLoad.value = false;
        };
        
        // Show alert message
        const showAlert = (message: string, type: 'info' | 'success' | 'error' | 'warning' = 'info') => {
            alert.value = {
                show: true,
                message,
                type,
                timeout: type === 'info' ? 3000 : 5000
            };
        };
        
        // Function to refresh data
        const refreshData = () => {
            loadRoadmapData(false);
        };

        // Function to handle tab changes
        const handleTabChange = (tab: string) => {
            activeTab.value = tab;
        };
        
        // Close alert
        const closeAlert = () => {
            alert.value.show = false;
        };
        
        return {
            roadmapStore,
            refreshData,
            activeTab,
            handleTabChange,
            alert,
            closeAlert
        };
    }
});
</script>

<template>
    <div class="roadmap-container">
        <v-container fluid class="pa-0">
            <!-- Alert for feature updates -->
            <v-alert
                v-if="alert.show"
                :type="alert.type"
                :timeout="alert.timeout"
                closable
                variant="tonal"
                class="mb-4"
                @click:close="closeAlert"
            >
                {{ alert.message }}
            </v-alert>
            
            <!-- Tab navigation -->
            <div class="navigation-tabs py-2 d-flex justify-center">
                <v-btn 
                    variant="text" 
                    :class="{ active: activeTab === 'all' }"
                    @click="handleTabChange('all')"
                >
                    All
                </v-btn>
                <v-btn 
                    variant="text" 
                    :class="{ active: activeTab === 'needFeedback' }"
                    @click="handleTabChange('needFeedback')"
                >
                    Need feedback
                </v-btn>
                <v-btn 
                    variant="text" 
                    :class="{ active: activeTab === 'inProgress' }"
                    @click="handleTabChange('inProgress')"
                >
                    In Progress
                </v-btn>
                <v-btn 
                    variant="text" 
                    :class="{ active: activeTab === 'complete' }"
                    @click="handleTabChange('complete')"
                >
                    Complete
                </v-btn>
            </div>

            <v-alert
                v-if="roadmapStore.error"
                type="error"
                closable
                variant="tonal"
                class="mb-4"
            >
                {{ roadmapStore.error }}
            </v-alert>
            
            <v-row justify="center">
                <v-col cols="12" sm="10" md="8" lg="6">
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

                    <div v-else class="feature-list">
                        <!-- All features -->
                        <div v-if="activeTab === 'all'">
                            <div v-for="feature in roadmapStore.getMostVotedFeatures" :key="feature.uuid">
                                <FeatureItem :feature="feature" />
                            </div>
                        </div>

                        <!-- Need feedback features -->
                        <div v-if="activeTab === 'needFeedback'">
                            <div v-for="feature in roadmapStore.getFeedbackFeatures" :key="feature.uuid">
                                <FeatureItem :feature="feature" />
                            </div>
                        </div>

                        <!-- In Progress features -->
                        <div v-if="activeTab === 'inProgress'">
                            <div v-for="feature in roadmapStore.getInProgressFeatures" :key="feature.uuid">
                                <FeatureItem :feature="feature" />
                            </div>
                        </div>

                        <!-- Completed features -->
                        <div v-if="activeTab === 'complete'">
                            <div v-for="feature in roadmapStore.getCompletedFeatures" :key="feature.uuid">
                                <FeatureItem :feature="feature" />
                            </div>
                        </div>

                        <div class="text-center mt-6">
                            <v-btn
                                color="primary"
                                @click="refreshData"
                                prepend-icon="mdi-refresh"
                                rounded="pill"
                                elevation="2"
                            >
                                Refresh
                            </v-btn>
                        </div>
                    </div>
                </v-col>
            </v-row>
        </v-container>
    </div>
</template>

<style lang="scss" scoped>
.roadmap-container {
    height: 100%;
    
    .navigation-tabs {
        border-bottom: 1px solid rgba(255, 255, 255, 0.12);
        
        .v-btn {
            font-weight: 400;
            margin-right: 16px;
            
            &.active {
                font-weight: 600;
                color: rgb(var(--v-theme-primary));
                position: relative;
                
                &::after {
                    content: '';
                    position: absolute;
                    bottom: -2px;
                    left: 0;
                    right: 0;
                    height: 2px;
                    background-color: rgb(var(--v-theme-primary));
                }
            }
        }
    }
    
    .feature-list {
        padding: 16px 0;
    }
}
</style>