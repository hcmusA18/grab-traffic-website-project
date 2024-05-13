import { configureStore } from '@reduxjs/toolkit'
import { rootReducer } from './reducer'
import loggerMiddleware from './loggerMiddleware'

// Create the store
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(loggerMiddleware)
})

// Export the store type
export type RootState = ReturnType<typeof rootReducer>
export type AppDispatch = typeof store.dispatch
