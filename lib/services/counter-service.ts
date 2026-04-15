import { counterRepository } from '@/lib/repositories/counter-repository'

export const counterService = {
  async GetGlobalCounter() {
    const counter = await counterRepository.findGlobal()

    if (counter) {
      return counter
    }

    return counterRepository.createGlobal(0)
  },

  incrementGlobalCounter() {
    return counterRepository.incrementGlobal()
  },
}
