/**
 * @module pn532.js/utils
 * @example
 * import * as Pn532Utils from 'pn532.js/utils'
 */
import _ from 'lodash'

export const logTime = (...args) => console.log(`[${new Date().toTimeString().slice(0, 8)}]`, ...args)

export const sleep = t => new Promise(resolve => setTimeout(resolve, t))

export class RethrownError extends Error {
  constructor (err) {
    if (!(err instanceof Error)) throw new TypeError('invalid err type')
    super(err.message)
    this.name = this.constructor.name
    this.originalError = err
    this.stack = `${this.stack}\n${err.stack}`
  }
}

export const retry = async (fn, times = 3) => {
  if (times < 1) throw new TypeError('invalid times')
  let lastErr = null
  while (times--) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
    }
  }
  throw new RethrownError(lastErr)
}

export const middlewareCompose = middleware => {
  // 型態檢查
  if (!_.isArray(middleware)) throw new TypeError('Middleware stack must be an array!')
  if (_.some(middleware, fn => !_.isFunction(fn))) throw new TypeError('Middleware must be composed of functions!')

  return async (context = {}, next) => {
    const cloned = [...middleware, ...(_.isFunction(next) ? [next] : [])]
    if (!cloned.length) return
    const executed = _.times(cloned.length + 1, () => 0)
    const dispatch = async cur => {
      if (executed[cur] !== 0) throw new Error(`middleware[${cur}] called multiple times`)
      if (cur >= cloned.length) {
        executed[cur] = 2
        return
      }
      try {
        executed[cur] = 1
        const result = await cloned[cur](context, () => dispatch(cur + 1))
        if (executed[cur + 1] === 1) throw new Error(`next() in middleware[${cur}] should be awaited`)
        executed[cur] = 2
        return result
      } catch (err) {
        executed[cur] = 3
        if (err.stack) err.stack = err.stack.replace(/at async dispatch[^\n]+\n[^\n]+\n\s*/g, '')
        throw err
      }
    }
    return await dispatch(0)
  }
}

/**
 * Convert hex string to UTF-8 string
 * @param {string} hex Hex string (e.g., "48656C6C6F")
 * @returns {string} UTF-8 decoded string
 * @example
 * console.log(hexToUtf8('48656C6C6F')) // "Hello"
 */
export const hexToUtf8 = hex => {
  const bytes = new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)))
  return new TextDecoder().decode(bytes)
}

/**
 * Convert hex string to ASCII string (printable chars only)
 * @param {string} hex Hex string (e.g., "48656C6C6F")
 * @returns {string} ASCII string with non-printable chars as '.'
 * @example
 * console.log(hexToAscii('48656C6C6F')) // "Hello"
 */
export const hexToAscii = hex => {
  return hex.match(/.{1,2}/g)
    .map(byte => {
      const code = parseInt(byte, 16)
      return (code >= 0x20 && code <= 0x7E) ? String.fromCharCode(code) : '.'
    })
    .join('')
}

/**
 * Convert hex string to text (tries UTF-8, falls back to ASCII)
 * @param {string} hex Hex string
 * @returns {string} Decoded text string
 * @example
 * console.log(hexToText('48656C6C6F')) // "Hello"
 */
export const hexToText = hex => {
  try {
    return hexToUtf8(hex)
  } catch (err) {
    return hexToAscii(hex)
  }
}

