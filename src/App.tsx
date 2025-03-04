import React from 'react';
import './App.css';
import StableSortVisualizer from './components/StableSortVisualizer';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>CSE Sorting Visualization</h1>
        <p>Demonstrating concepts from COMP2521 tutorials</p>
      </header>
      <main>
        <StableSortVisualizer />
      </main>
    </div>
  );
}

export default App;
