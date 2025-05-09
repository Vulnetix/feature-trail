import { createRouter, createWebHistory } from 'vue-router'
import RoadmapView from '../views/RoadmapView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: RoadmapView,
    },
    {
      path: '/feature/:uuid',
      name: 'feature-detail',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/FeatureDetailView.vue'),
    },
  ],
})

export default router
