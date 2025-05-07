import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createVuetify } from 'vuetify';
import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css'; // Import Material Design Icons

import App from './App.vue'
import router from './router'

const app = createApp(App)

const vuetify = createVuetify({
    theme: {
        defaultTheme: 'dark',
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
        },
    },
    icons: {
        defaultSet: 'mdi', // Set the icon set to Material Design Icons
    },
});

app.use(createPinia())
app.use(router)
app.use(vuetify);

app.mount('#app')
