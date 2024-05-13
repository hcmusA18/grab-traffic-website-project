import { combineReducers } from '@reduxjs/toolkit'
import { pageReducer } from './slicePages'
import { dataReducer } from './sliceData'

export const rootReducer = combineReducers({
  page: pageReducer,
  data: dataReducer
})
