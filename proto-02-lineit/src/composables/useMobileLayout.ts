import { onMounted, onUnmounted, ref } from 'vue'

export function useMobileLayout() {
  const isMobile = ref(false)
  const isCompact = ref(false)

  let mqMobile: MediaQueryList | null = null
  let mqCompact: MediaQueryList | null = null

  function sync(): void {
    isMobile.value = mqMobile?.matches ?? false
    isCompact.value = mqCompact?.matches ?? false
  }

  onMounted(() => {
    mqMobile = window.matchMedia('(max-width: 520px)')
    mqCompact = window.matchMedia('(max-height: 740px)')
    sync()
    mqMobile.addEventListener('change', sync)
    mqCompact.addEventListener('change', sync)
  })

  onUnmounted(() => {
    mqMobile?.removeEventListener('change', sync)
    mqCompact?.removeEventListener('change', sync)
  })

  return { isMobile, isCompact }
}
