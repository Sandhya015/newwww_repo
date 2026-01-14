/* eslint-disable @typescript-eslint/no-explicit-any */
// import { configureStore } from '@reduxjs/toolkit';
// import miscReducer from './miscSlice';

// export const store = configureStore({
//   reducer: {
//     example: miscReducer,
//   },
// });

// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;
import { configureStore } from '@reduxjs/toolkit';
import miscReducer from './miscSlice';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER
} from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage

const persistConfig: any = {
  key: 'root',
  storage,
};

const persistedReducer: any = persistReducer(persistConfig, miscReducer);

export const store = configureStore({
  reducer: {
    misc: persistedReducer,
  },
  middleware: (getDefaultMiddleware: any) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        // Ignore Blob objects in state (capturedImageBlob) to prevent serialization warnings
        ignoredPaths: ['misc.capturedImageBlob'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
