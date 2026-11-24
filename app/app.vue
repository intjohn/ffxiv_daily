<template>
  <main>
    <h1>MongoDB Atlas 連線測試</h1>
    <p>
      伺服器會讀取 <code>.env</code> 的 <code>MONGODB_URI</code>，對 Atlas cluster 送出 ping。
      連線字串不會回到瀏覽器。
    </p>
    <button type="button" :disabled="pending" @click="runPing">
      {{ pending ? '測試中…' : '重新測試' }}
    </button>

    <p v-if="pending">正在連線…</p>
    <p v-else-if="error" class="error">{{ error }}</p>
    <p v-else-if="result" class="ok">
      已連上 {{ result.host }}，延遲 {{ result.latencyMs }} ms。
    </p>
  </main>
</template>

<script setup lang="ts">
interface PingResult {
  ok: true
  host: string
  latencyMs: number
}

const pending = ref(false)
const error = ref('')
const result = ref<PingResult | null>(null)

async function runPing() {
  pending.value = true
  error.value = ''
  result.value = null

  try {
    result.value = await $fetch<PingResult>('/api/db/ping')
  }
  catch (err: unknown) {
    const fetchError = err as { data?: { statusMessage?: string, message?: string }, statusMessage?: string, message?: string }
    error.value = fetchError.data?.message
      || fetchError.data?.statusMessage
      || fetchError.message
      || '連線失敗'
  }
  finally {
    pending.value = false
  }
}

onMounted(runPing)
</script>

<style scoped>
main {
  max-width: 40rem;
  margin: 4rem auto;
  padding: 0 1.25rem;
  font-family: ui-sans-serif, system-ui, sans-serif;
  line-height: 1.5;
}

button {
  font: inherit;
  padding: 0.45rem 0.9rem;
  cursor: pointer;
}

button:disabled {
  cursor: progress;
}

.ok {
  color: #0b6b3a;
}

.error {
  color: #9b1c1c;
  white-space: pre-wrap;
}
</style>
