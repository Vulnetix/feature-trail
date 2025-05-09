import { defineStore } from 'pinia';

interface ThemeState {
  currentTheme: 'light' | 'dark';
}

export const useThemeStore = defineStore('theme', {
  state: (): ThemeState => ({
    currentTheme: 'dark', // Default theme
  }),
  actions: {
    initializeTheme() {
      const storedTheme = localStorage.getItem('theme');
      if (storedTheme && (storedTheme === 'light' || storedTheme === 'dark')) {
        this.currentTheme = storedTheme;
      } else {
        // If no theme is stored, check prefers-color-scheme
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        this.currentTheme = prefersDark ? 'dark' : 'light';
        localStorage.setItem('theme', this.currentTheme);
      }
    },
    toggleTheme() {
      this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', this.currentTheme);
    },
    setTheme(theme: 'light' | 'dark') {
      this.currentTheme = theme;
      localStorage.setItem('theme', this.currentTheme);
    }
  },
});
