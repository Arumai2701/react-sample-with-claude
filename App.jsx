import React from 'react'
import Header from './Header'
import ImageConverter from './ImageConverter'

export default function App(){
  return (
    <>
      <Header />
      <div className="app">
        <h1>Vite + React</h1>
        <p>Hello from your new React app scaffolded by Copilot.</p>
        <ImageConverter />
      </div>
    </>
  )
}
