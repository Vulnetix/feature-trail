<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
import { ref } from 'vue';
import FeatureRequestDialog from './components/FeatureRequestDialog.vue';

const showFeatureRequestDialog = ref<boolean>(false);

const openFeatureRequestDialog = () => {
    showFeatureRequestDialog.value = true;
};

const handleRequestSuccess = () => {
    // Could add additional handling here if needed
};
</script>

<template>
    <v-app>
        <v-app-bar app dark>
            <v-toolbar-title>
                <RouterLink to="/" class="logo">
                    <img src="./assets/logo.png" alt="Logo" class="logo-img"/>
                    <div class="logo-text">
                        Vulnetix Roadmap
                    </div>
                </RouterLink>
            </v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn
                color="primary"
                variant="outlined"
                @click="openFeatureRequestDialog"
            >
                Request Feature
            </v-btn>
        </v-app-bar>
        <v-main>
            <RouterView />
        </v-main>
        
        <FeatureRequestDialog
            v-model="showFeatureRequestDialog"
            @success="handleRequestSuccess"
        />
    </v-app>
</template>

<style lang="scss" scoped>
.logo {
    display: flex;
    align-items: center;
    text-decoration: none;
    color: inherit;

    .logo-img {
        width: 40px; // Adjusted for better proportion
        height: 40px; // Ensure aspect ratio is maintained if logo is not square
        margin-right: 12px; // Increased spacing
    }

    .logo-text {
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; // Modern, clean font
        font-size: 1.25rem; // Responsive font size
        font-weight: 600; // Slightly bolder
        line-height: 1.2; // Adjust line height for better vertical alignment
        color: #FFFFFF; // Ensure high contrast
    }
}

// Responsive adjustments
@media (max-width: 600px) {
    .logo {
        .logo-img {
            width: 35px;
            height: 35px;
            margin-right: 8px;
        }
        .logo-text {
            font-size: 1rem;
        }
    }
    .v-btn { // Make button smaller on small screens
        font-size: 0.75rem;
        padding: 0 8px;
    }
}
</style>