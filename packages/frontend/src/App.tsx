/**
 * 应用主组件
 *
 * 这是前端应用的根组件，定义了应用的基本结构。
 */

import React from 'react';

const App: React.FC = () => {
  return (
    <div className="App">
      <header className="bg-gray-800 text-white p-4">
        <h1 className="text-2xl font-bold">Node Switch Dashboard</h1>
      </header>
      <main className="p-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold mb-4">Welcome to Node Switch</h2>
          <p className="text-gray-600">
            This is the frontend for the node-switch project.
          </p>
        </div>
      </main>
    </div>
  );
};

export default App;