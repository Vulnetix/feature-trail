<script setup lang="ts">
import { ref } from 'vue';
import { useRoadmapStore } from '../stores/roadmap';
import type { FeatureRequest } from '../shared/interfaces';

const props = defineProps<{
    modelValue: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
    (e: 'success'): void;
}>();

const roadmapStore = useRoadmapStore();

const title = ref<string>(``);
const description = ref<string>(``);
const comment = ref<string>(``);
const loading = ref<boolean>(false);
const snackbar = ref<boolean>(false);
const snackbarText = ref<string>(``);
const formValid = ref<boolean>(false);

const titleRules = [
    (v: string) => !!v || `Title is required`,
    (v: string) => (v && v.length >= 3) || `Title must be at least 3 characters`,
];

const descriptionRules = [
    (v: string) => !!v || `Description is required`,
    (v: string) => (v && v.length >= 10) || `Description must be at least 10 characters`,
];

const resetForm = () => {
    title.value = ``;
    description.value = ``;
    comment.value = ``;
    formValid.value = false;
};

const closeDialog = () => {
    emit('update:modelValue', false);
    resetForm();
};

const submitRequest = async () => {
    if (!formValid.value) return;
    
    loading.value = true;
    
    const featureRequest: FeatureRequest = {
        title: title.value,
        description: description.value,
        comment: comment.value,
    };
    
    try {
        await roadmapStore.submitFeatureRequest(featureRequest);
        snackbarText.value = `Your feature request was submitted and awaits review.`;
        snackbar.value = true;
        closeDialog();
        emit('success');
    } catch (error) {
        snackbarText.value = `Error submitting feature request: ${(error as Error).message}`;
        snackbar.value = true;
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <v-dialog v-model="modelValue" max-width="600px">
        <v-card>
            <v-card-title class="text-h5">Request a Feature</v-card-title>
            
            <v-card-text>
                <v-form v-model="formValid" @submit.prevent="submitRequest">
                    <v-text-field
                        v-model="title"
                        label="Feature Title"
                        :rules="titleRules"
                        required
                    ></v-text-field>
                    
                    <v-textarea
                        v-model="description"
                        label="Feature Description"
                        :rules="descriptionRules"
                        required
                        hint="Describe the feature you'd like to see implemented"
                    ></v-textarea>
                    
                    <v-textarea
                        v-model="comment"
                        label="Comments (Optional)"
                        hint="Add any additional comments or context for your initial vote"
                        rows="3"
                    ></v-textarea>
                </v-form>
            </v-card-text>
            
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="grey" text @click="closeDialog">Cancel</v-btn>
                <v-btn 
                    color="primary" 
                    @click="submitRequest" 
                    :loading="loading"
                    :disabled="!formValid"
                >
                    Submit Request
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
    
    <v-snackbar v-model="snackbar" :timeout="5000">
        {{ snackbarText }}
        <template v-slot:actions>
            <v-btn color="primary" variant="text" @click="snackbar = false">
                Close
            </v-btn>
        </template>
    </v-snackbar>
</template>

<style lang="scss" scoped>
// Scoped styling if needed
</style>