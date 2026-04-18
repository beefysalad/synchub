import { createExternalApi, getAxiosErrorMessage } from '@/lib/axios'
import prisma from '@/lib/prisma'
import type { GeminiModelOption } from '@/lib/github/types'

type GeminiPart = {
  text: string
}

type GeminiContent = {
  role?: 'user' | 'model'
  parts: GeminiPart[]
}

type GeminiGenerateJsonOptions = {
  prompt: string
  schemaDescription: string
  temperature?: number
  userId?: string
}

function getGeminiApiKey() {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.')
  }

  return apiKey
}

const DEFAULT_GEMINI_MODEL: GeminiModelOption = 'gemini-2.5-flash-lite'

async function getGeminiModel(userId?: string) {
  if (userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { aiModel: true },
    })

    if (
      user?.aiModel === 'gemini-2.5-flash' ||
      user?.aiModel === 'gemini-2.5-flash-lite'
    ) {
      return user.aiModel
    }
  }

  if (
    process.env.GEMINI_MODEL === 'gemini-2.5-flash' ||
    process.env.GEMINI_MODEL === 'gemini-2.5-flash-lite'
  ) {
    return process.env.GEMINI_MODEL
  }

  return DEFAULT_GEMINI_MODEL
}

export async function generateGeminiJson<T>({
  prompt,
  schemaDescription,
  temperature = 0.2,
  userId,
}: GeminiGenerateJsonOptions): Promise<T> {
  const apiKey = getGeminiApiKey()
  const model = await getGeminiModel(userId)

  try {
    const response = await createExternalApi({
      baseURL: 'https://generativelanguage.googleapis.com',
    }).post<{
      candidates?: Array<{
        content?: {
          parts?: Array<{
            text?: string
          }>
        }
      }>
    }>(`/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${prompt}\n\nReturn strictly valid JSON that matches this shape:\n${schemaDescription}`,
            },
          ],
        } satisfies GeminiContent,
      ],
      generationConfig: {
        temperature,
        responseMimeType: 'application/json',
      },
    })

    const data = response.data
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      throw new Error('Gemini returned an empty response.')
    }

    return JSON.parse(text) as T
  } catch (error) {
    throw new Error(getAxiosErrorMessage(error, 'Gemini request failed'))
  }
}
