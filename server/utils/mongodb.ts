import { MongoClient } from 'mongodb'

const globalForMongo = globalThis as typeof globalThis & {
  mongoUri?: string
  mongoClient?: MongoClient
  mongoClientPromise?: Promise<MongoClient>
}

export function getMongoHost(uri: string) {
  const match = uri.match(/^mongodb(?:\+srv)?:\/\/(?:[^@/]+@)?([^/?]+)/i)
  return match?.[1] ?? 'unknown'
}

function redactConnectionString(message: string) {
  return message.replace(/mongodb(?:\+srv)?:\/\/\S+/gi, 'mongodb://***')
}

export function getMongoUri() {
  const uri = useRuntimeConfig().mongodbUri
  if (!uri) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Missing MONGODB_URI',
      message: '尚未設定 MONGODB_URI。請把 Atlas 連線字串寫進專案根目錄的 .env，然後重新啟動 dev server。',
    })
  }
  return uri
}

export async function getMongoClient() {
  const uri = getMongoUri()

  if (globalForMongo.mongoUri && globalForMongo.mongoUri !== uri) {
    await globalForMongo.mongoClient?.close()
    globalForMongo.mongoClient = undefined
    globalForMongo.mongoClientPromise = undefined
  }

  globalForMongo.mongoUri = uri

  if (globalForMongo.mongoClient) return globalForMongo.mongoClient

  if (!globalForMongo.mongoClientPromise) {
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 })
    globalForMongo.mongoClientPromise = client.connect()
      .then((connected) => {
        globalForMongo.mongoClient = connected
        return connected
      })
      .catch((error) => {
        globalForMongo.mongoClientPromise = undefined
        throw error
      })
  }

  return globalForMongo.mongoClientPromise
}

export async function pingMongo() {
  const uri = getMongoUri()
  const client = await getMongoClient()
  const result = await client.db().command({ ping: 1 })

  if (result.ok !== 1) {
    throw new Error('MongoDB ping 沒有回傳 ok: 1')
  }

  return { host: getMongoHost(uri) }
}

export function toMongoErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : '無法連線到 MongoDB'
  return redactConnectionString(message)
}
