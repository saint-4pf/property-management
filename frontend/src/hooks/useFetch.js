import { useState, useEffect, useCallback } from 'react'

const useFetch = (fetchFn, deps = []) => {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetchFn()
      setData(response.data.data)
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.message ||
        'Something went wrong'
      )
    } finally {
      setLoading(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => { load() }, [load])

  return { data, loading, error, refetch: load }
}

export default useFetch