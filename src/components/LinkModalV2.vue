<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop with blur -->
        <div 
          class="absolute inset-0 bg-black/60 backdrop-blur-md"
          @click="$emit('update:show', false)"
        ></div>
        
        <!-- Modal -->
        <div class="relative card bg-base-100 shadow-2xl max-w-2xl w-full animate-fade-in-up">
          <!-- Header -->
          <div class="card-body pb-0">
            <div class="flex items-center justify-between mb-6">
              <div>
                <h3 class="text-2xl font-bold">选择直播源</h3>
                <p class="text-base-content/60 text-sm mt-1">
                  选择画质最佳的直播源观看
                </p>
              </div>
              <button 
                @click="$emit('update:show', false)" 
                class="btn btn-ghost btn-circle"
              >
                <XMarkIcon class="w-6 h-6" />
              </button>
            </div>
          </div>
          
          <!-- Loading -->
          <div v-if="loading" class="card-body">
            <div class="flex flex-col items-center py-12">
              <div class="loading loading-dots loading-lg"></div>
              <p class="mt-4 text-base-content/60">正在获取直播源...</p>
            </div>
          </div>
          
          <!-- Links Grid -->
          <div v-else-if="links.length > 0" class="card-body pt-0">
            <div class="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
              <div
                v-for="(link, index) in links"
                :key="index"
                @click="selectLink(link)"
                class="group relative cursor-pointer"
              >
                <div 
                  class="card bg-base-200 hover:bg-base-300 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                  :class="getCardClass(link.name)"
                >
                  <div class="card-body p-4">
                    <div class="flex items-center justify-between">
                      <!-- Left: Icon and Name -->
                      <div class="flex items-center gap-3">
                        <div class="text-2xl">{{ getIcon(link.name) }}</div>
                        <div>
                          <h4 class="font-bold text-lg">{{ link.name }}</h4>
                          <p class="text-xs text-base-content/60">
                            {{ getDescription(link.name) }}
                          </p>
                        </div>
                      </div>
                      
                      <!-- Right: Badges and Arrow -->
                      <div class="flex items-center gap-2">
                        <span v-if="isRecommended(link.name)" class="badge badge-success badge-sm">
                          推荐
                        </span>
                        <span v-if="needsNewTab(link.name)" class="badge badge-info badge-sm">
                          新标签页
                        </span>
                        <span v-if="isIframeOnly(link.name)" class="badge badge-warning badge-sm">
                          网页播放
                        </span>
                        <ChevronRightIcon class="w-5 h-5 text-base-content/40 group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Tips -->
            <div class="alert alert-info mt-4">
              <InformationCircleIcon class="w-5 h-5" />
              <div class="text-sm">
                <p>⭐ 中文蓝光画质最佳，推荐优先选择</p>
                <p>🎯 高清直播稳定性好，适合长时间观看</p>
              </div>
            </div>
          </div>
          
          <!-- No Links -->
          <div v-else class="card-body">
            <div class="text-center py-12">
              <ExclamationCircleIcon class="w-16 h-16 text-base-content/20 mx-auto mb-4" />
              <p class="text-lg text-base-content/60">暂无可用直播源</p>
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
import {
  XMarkIcon,
  ChevronRightIcon,
  InformationCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/vue/24/outline'

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

function getCardClass(name) {
  if (name.includes('中文蓝光') || name.includes('中文高清')) {
    return 'ring-2 ring-accent ring-offset-2 ring-offset-base-100'
  }
  return ''
}

function getIcon(name) {
  if (name.includes('中文蓝光') || name.includes('中文高清')) return '⭐'
  if (name.includes('高清') || name.includes('超清')) return '🎯'
  if (name.includes('主播')) return '🎤'
  if (name.includes('备用')) return '🔄'
  return '📺'
}

function getDescription(name) {
  if (name.includes('中文蓝光')) return '最高画质，推荐使用'
  if (name.includes('中文高清')) return '高清画质，中文解说'
  if (name.includes('高清')) return '高清画质，流畅稳定'
  if (name.includes('主播')) return '专业解说，互动体验'
  if (name.includes('纬来')) return '台湾体育频道'
  return '标准画质'
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
  transform: scale(0.9) translateY(20px);
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.3s ease-out;
}

.custom-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: rgba(156, 163, 175, 0.3) transparent;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.3);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.5);
}
</style>