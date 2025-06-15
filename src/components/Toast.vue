<template>
  <Teleport to="body">
    <Transition name="toast">
      <div
        v-if="show"
        class="fixed top-4 right-4 z-50"
      >
        <div
          class="alert shadow-lg max-w-sm"
          :class="{
            'alert-success': type === 'success',
            'alert-error': type === 'error',
            'alert-warning': type === 'warning',
            'alert-info': type === 'info'
          }"
        >
          <div>
            <component :is="iconComponent" class="w-6 h-6" />
            <span>{{ message }}</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, watch } from 'vue'
import {
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/vue/24/outline'

const props = defineProps({
  show: Boolean,
  message: String,
  type: {
    type: String,
    default: 'info',
    validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
  },
  duration: {
    type: Number,
    default: 3000
  }
})

const emit = defineEmits(['update:show'])

const iconComponent = computed(() => {
  const icons = {
    success: CheckCircleIcon,
    error: XCircleIcon,
    warning: ExclamationTriangleIcon,
    info: InformationCircleIcon
  }
  return icons[props.type]
})

let timer = null

watch(() => props.show, (newVal) => {
  if (newVal && props.duration > 0) {
    clearTimeout(timer)
    timer = setTimeout(() => {
      emit('update:show', false)
    }, props.duration)
  }
})
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.toast-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>