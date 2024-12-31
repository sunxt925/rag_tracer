import { createRouter, createWebHistory } from 'vue-router'
import TraceQuery from '../views/TraceQuery.vue'
import Bak from '../views/bak.vue'
const routes = [
  {
    path: '/',
    name: 'home',
    component: TraceQuery
  },
  {
    path: '/trace',
    name: 'trace',
    component: TraceQuery
  },
  {
    path: '/bak',
    name: 'bak',
    component: Bak
  },
  {
    path: '/llm_agg',
    name: 'LlmAgg',
    component: () => import('@/views/LlmAgg.vue')
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router