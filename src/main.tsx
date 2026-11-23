import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { ProvedorAuth } from './contextos/AuthContexto'
import { ProvedorAviso } from './contextos/AvisoContexto'
import { ProvedorTema } from './contextos/TemaContexto'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ProvedorTema>
        <ProvedorAviso>
          <ProvedorAuth>
            <App />
          </ProvedorAuth>
        </ProvedorAviso>
      </ProvedorTema>
    </BrowserRouter>
  </React.StrictMode>,
)
