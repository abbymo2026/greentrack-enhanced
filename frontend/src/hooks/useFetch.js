
import { useEffect, useState } from 'react'

export function useFetch(asyncFn, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError(null)
    asyncFn()
      .then((d) => mounted && setData(d))
      .catch((e) => mounted && setError(e))
      .finally(() => mounted && setLoading(false))
    return () => { mounted = false }
  }, deps)

  return { data, loading, error, reload: () => asyncFn().then(setData) }
}
