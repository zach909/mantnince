import { useSyncExternalStore } from 'react'

/**
 * A small hand-rolled stand-in for zustand's `create`, built on React's own
 * `useSyncExternalStore` (no extra dependency beyond react, which this
 * project already has). Supports the same shape we actually use here:
 * `create<T>((set, get) => initialState)`, an optional selector on the
 * returned hook, and a static `.getState()`/`.setState()` for reads/writes
 * outside a component (e.g. from an animation-frame callback).
 */

type Partial_<T> = { [K in keyof T]?: T[K] }
type SetState<T> = (partial: Partial_<T> | ((state: T) => Partial_<T>)) => void
type GetState<T> = () => T

export interface StoreHook<T> {
  (): T
  <U>(selector: (state: T) => U): U
  getState: GetState<T>
  setState: SetState<T>
  subscribe: (listener: () => void) => () => void
}

export function createStore<T>(initializer: (set: SetState<T>, get: GetState<T>) => T): StoreHook<T> {
  let state: T
  const listeners = new Set<() => void>()

  const setState: SetState<T> = (partial) => {
    const partialState = typeof partial === 'function' ? (partial as (s: T) => Partial_<T>)(state) : partial
    state = { ...state, ...partialState }
    listeners.forEach((listener) => listener())
  }

  const getState: GetState<T> = () => state

  const subscribe = (listener: () => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  }

  state = initializer(setState, getState)

  function useStore<U>(selector?: (state: T) => U): U {
    const select = selector ?? ((s: T) => s as unknown as U)
    return useSyncExternalStore(subscribe, () => select(state))
  }

  const hook = useStore as StoreHook<T>
  hook.getState = getState
  hook.setState = setState
  hook.subscribe = subscribe
  return hook
}
