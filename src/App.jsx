import React, { useCallback, useState } from "react";
import Tree from "react-d3-tree";
import styled, { keyframes } from "styled-components";

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

function App() {
  const [input, setInput] = useState("");
  const [treeData, setTreeData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [treeHistory, setTreeHistory] = useState([]);
  const [currentTreeIndex, setCurrentTreeIndex] = useState(-1);

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
      const newTreeData = transformData(data.root);
      setTreeData(newTreeData);
      setTreeHistory((prevHistory) => [
        ...prevHistory.slice(0, currentTreeIndex + 1),
        newTreeData,
      ]);
      setCurrentTreeIndex((prevIndex) => prevIndex + 1);
    } catch (error) {
      console.error("Error fetching mindmap:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    if (currentTreeIndex > 0) {
      setCurrentTreeIndex((prevIndex) => prevIndex - 1);
      const previousTree = treeHistory[currentTreeIndex - 1];
      setTreeData(previousTree);
      setInput(previousTree.name);
    }
  };

  const goForward = () => {
    if (currentTreeIndex < treeHistory.length - 1) {
      setCurrentTreeIndex((prevIndex) => prevIndex + 1);
      const nextTree = treeHistory[currentTreeIndex + 1];
      setTreeData(nextTree);
      setInput(nextTree.name);
    }
  };

  const transformData = (node) => {
    return {
      name: node.content,
      description: node.description,
      children: node.children.map(transformData),
    };
  };

  const handleNodeClick = useCallback(
    (nodeData, evt) => {
      if (evt.detail === 2) {
        // Check for double-click
        const path = getPathToRoot(treeData, nodeData.data.name);
        if (path) {
          const context = path.join(" > ");
          setInput(context);
          fetchMindmap(context);
        } else {
          const nodeContent = nodeData.data.description || nodeData.data.name;
          setInput(nodeContent);
          fetchMindmap(nodeContent);
        }
        evt.stopPropagation();
      }
    },
    [treeData]
  );

  const NavigationButton = styled.button`
    padding: 10px 20px;
    font-size: 16px;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.3s;
    margin: 0 10px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);

    &:hover {
      background-color: #2980b9;
    }

    &:disabled {
      background-color: #95a5a6;
      cursor: not-allowed;
    }
  `;

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          margin: "20px 0",
          padding: "10px",
          backgroundColor: "#f0f0f0",
          borderRadius: "5px",
        }}
      >
        <input
          type="text"
          placeholder="Describe your mindmap"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          style={{
            width: "70%",
            padding: "10px",
            fontSize: "16px",
            borderRadius: "5px 0 0 5px",
            border: "1px solid #ccc",
          }}
        />
        <button
          onClick={() => fetchMindmap(input)}
          disabled={isLoading}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            backgroundColor: isLoading ? "#cccccc" : "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "0 5px 5px 0",
            cursor: isLoading ? "not-allowed" : "pointer",
            transition: "background-color 0.3s",
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
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "20px",
        }}
      >
        <NavigationButton onClick={goBack} disabled={currentTreeIndex <= 0}>
          Back
        </NavigationButton>
        <NavigationButton
          onClick={goForward}
          disabled={currentTreeIndex >= treeHistory.length - 1}
        >
          Forward
        </NavigationButton>
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
