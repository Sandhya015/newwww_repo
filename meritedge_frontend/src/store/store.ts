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
import adminReducer from './adminSlice';
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

const adminPersistConfig: any = {
  key: 'admin',
  storage,
};

const persistedMiscReducer: any = persistReducer(persistConfig, miscReducer);
const persistedAdminReducer: any = persistReducer(adminPersistConfig, adminReducer);

export const store = configureStore({
  reducer: {
    misc: persistedMiscReducer,
    admin: persistedAdminReducer,
  },
  middleware: (getDefaultMiddleware: any) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
