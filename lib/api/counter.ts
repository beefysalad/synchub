import axios from 'axios'

export interface Counter {
  id: number
  key: string
  value: number
  modifiedAt: string
}

export const getCounter = async (): Promise<Counter> => {
  const response = await axios.get('/api/counter')
  return response.data
}

export const incrementCounter = async (): Promise<Counter> => {
  const response = await axios.post('/api/counter')
  return response.data
}
