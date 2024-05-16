/* eslint-disable no-console */
// loggerMiddleware.ts
import { Middleware } from '@reduxjs/toolkit'
import { RootState } from './store'

const loggerMiddleware: Middleware<object, RootState> = (store) => (next) => (action) => {
  // Log the current state
  console.log('Current state:', store.getState())

  // Pass the action to the next middleware in the chain
  const result = next(action)

  // Return the result (usually the result of dispatching the action)
  return result
}

export default loggerMiddleware
