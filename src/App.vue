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
            <v-toolbar-title>Vulnetix Roadmap</v-toolbar-title>
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
    display: block;
    margin: 0 auto 2rem;
}
</style>
