import AbortController from 'abort-controller'

export default async function fetchWithTimeout(url: string, {  timeout, abortController, customFetch = fetch, ...rest }: any = {}) {
  if (!timeout) {
    return customFetch(url, rest)
  }
  const controller = abortController || new AbortController()
  const timerId = setTimeout(() => {
    controller.abort()
  }, timeout)
  try {
    return await customFetch(url, { ...rest, signal: controller.signal })
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error(`Request timed out ${timeout}ms at ${url}`)
    } else {
      throw err
    }
  } finally {
    clearTimeout(timerId)
  }
}