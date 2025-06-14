import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('./views/HomePro.vue'), // 使用专业版UI
  },
  {
    path: '/v1',
    name: 'HomeV1',
    component: () => import('./views/Home.vue'), // 懒加载
  },
  {
    path: '/v2',
    name: 'HomeV2',
    component: () => import('./views/HomeV2.vue'), // 懒加载
  },
  {
    path: '/player',
    name: 'Player',
    component: () => import('./views/Player.vue'), // 懒加载
  },
  {
    path: '/iframe-player',
    name: 'IframePlayer',
    component: () => import('./views/IframePlayer.vue'), // 懒加载
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router