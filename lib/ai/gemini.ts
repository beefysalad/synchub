import { createExternalApi, getAxiosErrorMessage } from '@/lib/axios'

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
}

function getGeminiApiKey() {
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.')
  }

  return apiKey
}

function getGeminiModel() {
  return process.env.GEMINI_MODEL || 'gemini-2.0-flash'
}

export async function generateGeminiJson<T>({
  prompt,
  schemaDescription,
  temperature = 0.2,
}: GeminiGenerateJsonOptions): Promise<T> {
  const apiKey = getGeminiApiKey()
  const model = getGeminiModel()

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
