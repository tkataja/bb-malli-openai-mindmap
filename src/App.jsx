import React, { useCallback, useState, useEffect } from "react";
import Tree from "react-d3-tree";

const getPathToRoot = (treeData, targetNodeId) => {
  const traverse = (node, path = []) => {
    if (node.name === targetNodeId) {
      return [...path, node.name];
    }
    for (const child of node.children || []) {
      const result = traverse(child, [...path, node.name]);
      if (result) return result;
    }
    return null;
  };
  return traverse(treeData);
};

const pulse = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
`;

const PulsatingSpinner = styled.span`
  display: inline-block;
  animation: ${pulse} 1s ease-in-out infinite;
`;

const SpinnerEmoji = () => {
  const emojis = ["🧠", "💡", "🌳", "🔄"];
  const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
  return <PulsatingSpinner>{randomEmoji}</PulsatingSpinner>;
};
import styled, { keyframes } from "styled-components";

function App() {
  const [input, setInput] = useState("");
  const [treeData, setTreeData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMindmap = async (content) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: content }),
      });
      const data = await response.json();
      setTreeData(transformData(data.root));
    } catch (error) {
      console.error("Error fetching mindmap:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const transformData = (node) => {
    return {
      name: node.content,
      children: node.children.map(transformData),
    };
  };

  const handleNodeClick = useCallback((nodeData, evt) => {
    if (evt.detail === 2) {
      // Check for double-click
      const path = getPathToRoot(treeData, nodeData.data.name);
      if (path) {
        const context = path.join(" > ");
        setInput(context);
        fetchMindmap(context);
      } else {
        setInput(nodeData.data.name);
        fetchMindmap(nodeData.data.name);
      }
      evt.stopPropagation();
    }
  }, [treeData]);

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Describe your mindmap"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{
            width: '70%',
            padding: '10px',
            fontSize: '16px',
            borderRadius: '5px 0 0 5px',
            border: '1px solid #ccc',
          }}
        />
        <button 
          onClick={() => fetchMindmap(input)} 
          disabled={isLoading}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: isLoading ? '#cccccc' : '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '0 5px 5px 0',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'background-color 0.3s',
          }}
        >
          {isLoading ? (
            <>
              Generating... <SpinnerEmoji key={Date.now()} />
            </>
          ) : (
            "Generate"
          )}
        </button>
      </div>
      {treeData && (
        <Tree
          data={treeData}
          collapsible={false}
          enableLegacyTransitions
          orientation={"vertical"}
          pathFunc={"step"}
          separation={{ siblings: 2, nonSiblings: 2 }}
          translate={{ x: window.innerWidth / 2, y: 50 }}
          onNodeClick={handleNodeClick}
        />
      )}
    </div>
  );
}

export default App;
