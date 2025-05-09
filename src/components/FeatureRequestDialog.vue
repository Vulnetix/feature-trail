<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { v4 as uuidv4 } from 'uuid';

const supportEmail = ref(import.meta.env.VITE_SUPPORT_EMAIL)
const supportOtherName = ref(import.meta.env.VITE_SUPPORT_OTHER_NAME)
const supportOtherUrl = ref(import.meta.env.VITE_SUPPORT_OTHER_URL)

const props = defineProps<{
    modelValue: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: boolean): void;
}>();

const snackbar = ref<boolean>(false);
const snackbarText = ref<string>(``);
const generatedId = ref<string>(``);

const closeDialog = () => {
    emit('update:modelValue', false);
};

const copyToClipboard = async () => {
    try {
        await navigator.clipboard.writeText(generatedId.value);
        snackbarText.value = `ID copied to clipboard!`;
        snackbar.value = true;
    } catch (err) {
        snackbarText.value = `Failed to copy ID.`;
        snackbar.value = true;
        console.error(`Failed to copy text: `, err);
    }
};

onMounted(() => {
    generatedId.value = uuidv4();
});
</script>

<template>
    <v-dialog :model-value="modelValue" max-width="600px" @update:model-value="closeDialog">
        <v-card>
            <v-card-title class="text-h5">Request a Feature</v-card-title>
            
            <v-card-text>
                <p>To request a new feature, please contact us via one of the following methods. Please provide a brief description of the feature and quote the ID below.</p>
                
                <v-divider class="my-4"></v-divider>
                
                <p v-if="supportEmail"><strong>Email:</strong> <a :href="`mailto:${supportEmail}`">{{ supportEmail }}</a></p>
                <p v-if="supportOtherUrl && supportOtherName"><strong>{{ supportOtherName }}:</strong> <a :href="supportOtherUrl" target="_blank" rel="noopener noreferrer">{{ supportOtherUrl }}</a></p>
                
                <v-divider class="my-4"></v-divider>
                
                <p><strong>Your Feature Request ID:</strong></p>
                <v-sheet 
                    elevation="1" 
                    class="pa-2 d-flex align-center justify-space-between"
                    rounded
                >
                    <code>{{ generatedId }}</code>
                    <v-btn icon variant="text" size="small" @click="copyToClipboard">
                        <v-icon>mdi-content-copy</v-icon>
                        <v-tooltip activator="parent" location="top">Copy ID</v-tooltip>
                    </v-btn>
                </v-sheet>
            </v-card-text>
            
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="primary" text @click="closeDialog">Close</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
    
    <v-snackbar v-model="snackbar" :timeout="3000">
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
code {
  background-color: rgba(var(--v-theme-on-surface), 0.05);
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: monospace;
}
</style>