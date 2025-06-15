<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div 
          class="absolute inset-0 bg-black/50 backdrop-blur-sm"
          @click="$emit('update:show', false)"
        ></div>
        
        <!-- Modal -->
        <div class="relative card bg-base-100 shadow-2xl max-w-md w-full">
          <div class="card-body">
            <h3 class="card-title mb-4">选择直播源</h3>
            
            <!-- Loading -->
            <div v-if="loading" class="flex justify-center py-8">
              <div class="loading loading-spinner loading-lg"></div>
            </div>
            
            <!-- Links -->
            <div v-else-if="links.length > 0" class="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
              <button
                v-for="(link, index) in links"
                :key="index"
                @click="selectLink(link)"
                class="btn btn-block justify-start focusable"
                :class="getButtonClass(link.name)"
              >
                <span class="mr-2">{{ getIcon(link.name) }}</span>
                {{ link.name }}
                <span v-if="isRecommended(link.name)" class="ml-auto badge badge-success">
                  推荐
                </span>
                <span v-if="isIframeOnly(link.name)" class="ml-auto badge badge-warning">
                  网页播放
                </span>
                <span v-if="needsNewTab(link.name)" class="ml-auto badge badge-info">
                  新标签页
                </span>
              </button>
            </div>
            
            <!-- No Links -->
            <div v-else class="text-center py-8 text-base-content/60">
              暂无可用直播源
            </div>
            
            <!-- Close Button -->
            <div class="card-actions justify-end mt-4">
              <button 
                @click="$emit('update:show', false)" 
                class="btn btn-ghost focusable"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { watch, nextTick } from 'vue'
import { useNavigationStore } from '../stores/navigation'

const props = defineProps({
  show: Boolean,
  links: {
    type: Array,
    default: () => []
  },
  loading: Boolean
})

const emit = defineEmits(['update:show', 'select'])

const navigationStore = useNavigationStore()

function selectLink(link) {
  emit('select', link)
}

function getButtonClass(name) {
  if (name.includes('中文蓝光') || name.includes('中文高清')) {
    return 'btn-accent'  // 使用强调色，表示最高优先级
  }
  if (name.includes('高清') || name.includes('超清')) {
    return 'btn-primary'
  }
  if (name.includes('主播')) {
    return 'btn-secondary'
  }
  if (name.includes('纬来') || name.includes('kbs') || name.includes('pao')) {
    return 'btn-warning'
  }
  return 'btn-ghost'
}

function getIcon(name) {
  if (name.includes('中文蓝光') || name.includes('中文高清')) return '⭐'
  if (name.includes('高清') || name.includes('超清')) return '🎯'
  if (name.includes('主播')) return '🎤'
  if (name.includes('备用')) return '🔄'
  return '📺'
}

function isRecommended(name) {
  return name.includes('中文蓝光') || name.includes('高清') || name.includes('主播')
}

function isIframeOnly(name) {
  return name.includes('pao')
}

function needsNewTab(name) {
  return name.includes('纬来') || name.includes('中文蓝光') || name.includes('中文高清') || name.includes('kbs')
}

// 当模态框显示时，更新可聚焦元素
watch(() => props.show, (newVal) => {
  if (newVal) {
    nextTick(() => {
      navigationStore.updateFocusableElements()
      // 聚焦到第一个链接按钮
      const firstButton = document.querySelector('.modal button.btn-block')
      if (firstButton) {
        firstButton.focus()
      }
    })
  }
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .card,
.modal-leave-to .card {
  transform: scale(0.9);
}
</style>