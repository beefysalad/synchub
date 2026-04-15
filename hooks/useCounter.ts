import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getCounter, incrementCounter } from '@/lib/api/counter'

export const useCounter = () => {
  return useQuery({
    queryKey: ['counter'],
    queryFn: getCounter,
    refetchInterval: 5000, //evry 5 seconds
  })
}

export const useIncrementCounter = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: incrementCounter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['counter'] })
    },
  })
}
