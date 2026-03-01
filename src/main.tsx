import 'reactflow/dist/style.css';  // ← MUST be here (top of file)

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';  // or your global styles

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);