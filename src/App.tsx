import React, { useState } from 'react';
import './App.css';
import StableSortVisualizer from './components/StableSortVisualizer';
import TreeVisualizer from './components/TreeVisualizer';

function App() {
  const [activeView, setActiveView] = useState<'sorting' | 'tree'>('sorting');

  return (
    <div className="App">
      <header className="App-header">
        <h1>CSE Algorithm Visualizations</h1>
        <p>Demonstrating concepts from COMP2521 tutorials</p>
        <nav className="App-nav">
          <button
            className={`px-4 py-2 mx-2 rounded ${activeView === 'sorting' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setActiveView('sorting')}
          >
            Sorting (Stability)
          </button>
          <button
            className={`px-4 py-2 mx-2 rounded ${activeView === 'tree' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            onClick={() => setActiveView('tree')}
          >
            Binary Tree Rotations
          </button>
        </nav>
      </header>
      <main>
        {activeView === 'sorting' ? <StableSortVisualizer /> : <TreeVisualizer />}
      </main>
    </div>
  );
}

export default App;
