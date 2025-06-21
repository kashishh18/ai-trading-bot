import React from 'react';
import './App.css';

function App() {
  return React.createElement('div', { className: 'App' },
    React.createElement('header', { className: 'App-header' },
      React.createElement('h1', null, '🤖 AI Trading Bot'),
      React.createElement('p', null, 'Your Smart Money Manager'),
      React.createElement('p', null, 'Backend and Frontend are connecting...')
    )
  );
}

export default App;
