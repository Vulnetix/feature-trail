<template>
    <v-fade-transition>
        <v-btn
            v-show="showButton"
            class="scroll-to-top-button"
            icon
            fab
            size="large"
            color="primary"
            @click="scrollToTop"
            aria-label="Scroll to top"
        >
            <v-icon size="x-large">mdi-chevron-up</v-icon>
        </v-btn>
    </v-fade-transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const showButton = ref(false);

const scrollToTop = () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
};

const checkScroll = () => {
    // Show button when page is scrolled down 200px
    showButton.value = window.scrollY > 200;
};

onMounted(() => {
    window.addEventListener('scroll', checkScroll);
});

onUnmounted(() => {
    window.removeEventListener('scroll', checkScroll);
});
</script>

<style lang="scss" scoped>
.scroll-to-top-button {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 999;
}
</style>
