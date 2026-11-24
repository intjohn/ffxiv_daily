export default defineEventHandler(async () => {
  const started = Date.now()

  try {
    const { host } = await pingMongo()
    return {
      ok: true as const,
      host,
      latencyMs: Date.now() - started,
    }
  }
  catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error

    throw createError({
      statusCode: 503,
      statusMessage: 'MongoDB connection failed',
      message: toMongoErrorMessage(error),
    })
  }
})
