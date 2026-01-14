import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import 'antd/dist/reset.css'; // for v5+
import { Provider } from 'react-redux';
import { store ,persistor} from './store/store';
import { PersistGate } from 'redux-persist/integration/react';

// Contexts Provider
import { AppContextsProvider } from './context/AppContextsProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppContextsProvider>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <App /> 
        </PersistGate>
      </Provider>
    </AppContextsProvider>
  </StrictMode>,
)
