<template>
  <div class="min-h-screen bg-base-100">
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useNavigationStore } from './stores/navigation'
import { setupWechatShare } from './utils/wechat'

const navigationStore = useNavigationStore()

onMounted(() => {
  // 初始化导航系统
  navigationStore.initialize()
  
  // 设置微信分享
  setupWechatShare()
})
</script>

<style>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>