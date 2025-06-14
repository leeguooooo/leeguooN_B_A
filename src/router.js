import { createRouter, createWebHistory } from 'vue-router'
import Home from './views/Home.vue'
import HomeV2 from './views/HomeV2.vue'
import Player from './views/Player.vue'
import IframePlayer from './views/IframePlayer.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('./views/HomePro.vue'), // 使用专业版UI
  },
  {
    path: '/v1',
    name: 'HomeV1',
    component: Home, // 保留旧版
  },
  {
    path: '/v2',
    name: 'HomeV2',
    component: HomeV2, // V2版本
  },
  {
    path: '/player',
    name: 'Player',
    component: Player,
  },
  {
    path: '/iframe-player',
    name: 'IframePlayer',
    component: IframePlayer,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router