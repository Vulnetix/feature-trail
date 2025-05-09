import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createVuetify } from 'vuetify';
import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css'; // Import Material Design Icons

import App from './App.vue'
import router from './router'
import { useThemeStore } from './stores/theme';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);

// Initialize the theme store
const themeStore = useThemeStore();
themeStore.initializeTheme();

const vuetify = createVuetify({
    theme: {
        defaultTheme: themeStore.currentTheme, // Use the theme from the store
        themes: {
            dark: {
                dark: true,
                colors: {
                    primary: '#1E88E5',
                    secondary: '#424242',
                    accent: '#82B1FF',
                    error: '#FF5252',
                    info: '#2196F3',
                    success: '#4CAF50',
                    warning: '#FFC107',
                },
            },
            light: {
                dark: false,
                colors: {
                    primary: '#1976D2',
                    secondary: '#E0E0E0',
                    accent: '#64B5F6',
                    error: '#F44336',
                    info: '#2196F3',
                    success: '#4CAF50',
                    warning: '#FFC107',
                },
            },
        },
    },
    icons: {
        defaultSet: 'mdi', // Set the icon set to Material Design Icons
    },
});

app.use(router);
app.use(vuetify);

app.mount('#app');
