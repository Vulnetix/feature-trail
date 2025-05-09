<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router';
import { ref, computed, watch } from 'vue';
import FeatureRequestDialog from './components/FeatureRequestDialog.vue';
import { useThemeStore } from './stores/theme';
import { useTheme } from 'vuetify';

const site_name = ref(import.meta.env.VITE_SITE_TITLE || 'FeatureTrail');
const themeStore = useThemeStore();
const vuetifyTheme = useTheme();

// Set up a computed property to determine the current theme
const isDarkTheme = computed(() => themeStore.currentTheme === 'dark');

// Watch for theme changes and update Vuetify's theme accordingly
watch(() => themeStore.currentTheme, (newTheme) => {
    vuetifyTheme.global.name.value = newTheme;
});

const toggleTheme = () => {
    themeStore.toggleTheme();
};

const showFeatureRequestDialog = ref<boolean>(false);

const openFeatureRequestDialog = () => {
    showFeatureRequestDialog.value = true;
};

const handleRequestSuccess = () => {
    // Could add additional handling here if needed
};
</script>

<template>
    <v-app :theme="themeStore.currentTheme">
        <v-app-bar app>
            <v-toolbar-title>
                <RouterLink to="/" class="logo">
                    <img src="./assets/logo.png" alt="Logo" class="logo-img"/>
                    <div class="logo-text" :class="{ 'text-light': isDarkTheme, 'text-dark': !isDarkTheme }">
                        {{ site_name }}
                    </div>
                </RouterLink>
            </v-toolbar-title>
            <v-spacer></v-spacer>
            <v-btn-group>
                <v-tooltip
                    :text="isDarkTheme ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
                    location="bottom"
                >
                    <template v-slot:activator="{ props }">
                        <v-btn
                            icon
                            @click="toggleTheme"
                            class="me-2"
                            aria-label="Toggle theme"
                            v-bind="props"
                        >
                            <v-icon>
                                {{ isDarkTheme ? 'mdi-weather-sunny' : 'mdi-moon-waning-crescent' }}
                            </v-icon>
                        </v-btn>
                    </template>
                </v-tooltip>
                <v-btn
                    color="primary"
                    variant="tonal"
                    @click="openFeatureRequestDialog"
                >
                    Request Feature
                </v-btn>
            </v-btn-group>
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