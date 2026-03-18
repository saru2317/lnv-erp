/**
 * useApi — Generic hook for API calls with loading/error state
 * Usage: const { data, loading, error, execute } = useApi(fn, options)
 */
import { useState, useCallback, useEffect } from 'react'
import toast from 'react-hot-toast'

export function useApi(apiFn, { immediate = false, onSuccess, onError } = {}) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const execute = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    try {
      const result = await apiFn(...args)
      const payload = result?.data ?? result
      setData(payload)
      onSuccess?.(payload)
      return payload
    } catch (err) {
      setError(err)
      onError?.(err)
      return null
    } finally {
      setLoading(false)
    }
  }, [apiFn, onSuccess, onError])

  useEffect(() => {
    if (immediate) execute()
  }, []) // eslint-disable-line

  return { data, loading, error, execute, setData }
}

/**
 * usePagination — hook for paginated tables
 */
export function usePagination(initialPage = 1, initialLimit = 20) {
  const [page,  setPage]  = useState(initialPage)
  const [limit, setLimit] = useState(initialLimit)
  const [total, setTotal] = useState(0)

  const totalPages = Math.ceil(total / limit)
  const hasNext = page < totalPages
  const hasPrev = page > 1

  return { page, setPage, limit, setLimit, total, setTotal, totalPages, hasNext, hasPrev }
}
