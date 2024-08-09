import React from 'react';
import Tree from 'react-d3-tree';

const treeData = [
  {
    name: 'Root',
    children: [
      {
        name: 'Child 1',
      },
      {
        name: 'Child 2',
      },
    ],
  },
];

function App() {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <h1>Hello, React with Vite!</h1>
      <Tree data={treeData} />
    </div>
  );
}

export default App;
