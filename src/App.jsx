import React, { useCallback, useState } from "react";
import Tree from "react-d3-tree";
import "./App.css";

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

const SpinnerEmoji = () => {
  const emojis = ["🧠", "💡", "🔄"];
  const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
  return <span className="pulsating-spinner">{randomEmoji}</span>;
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
      const response = await fetch("/api/mindmap", {
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

  const fetchPrompt = async (path) => {
    try {
      const response = await fetch("/api/prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: path }),
      });
      const data = await response.text();
      return data.trim();
    } catch (error) {
      console.error("Error fetching prompt:", error);
      return null;
    }
  };

  const goBack = () => {
    if (currentTreeIndex > 0) {
      setCurrentTreeIndex((prevIndex) => prevIndex - 1);
      const previousTree = treeHistory[currentTreeIndex - 1];
      setTreeData(previousTree);
      setInput(previousTree.description || previousTree.name);
    }
  };

  const goForward = () => {
    if (currentTreeIndex < treeHistory.length - 1) {
      setCurrentTreeIndex((prevIndex) => prevIndex + 1);
      const nextTree = treeHistory[currentTreeIndex + 1];
      setTreeData(nextTree);
      setInput(nextTree.description || nextTree.name);
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
    async (nodeData, evt) => {
      if (evt.detail === 2) {
        // Check for double-click
        const path = getPathToRoot(treeData, nodeData.data.name);
        if (path) {
          const context = path.join(" > ");
          const newPrompt = await fetchPrompt(context);
          if (newPrompt) {
            setInput(newPrompt);
            fetchMindmap(newPrompt);
          } else {
            console.error("Failed to fetch new prompt");
          }
        } else {
          console.error("Failed to get path to root");
        }
        evt.stopPropagation();
      }
    },
    [treeData]
  );

  return (
    <div className="main-container">
      <div className="input-container">
        <input
          type="text"
          placeholder="Describe your mindmap"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="input-field"
        />
        <button
          onClick={() => fetchMindmap(input)}
          disabled={isLoading}
          className="generate-button"
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
      <div className="button-container">
        <button
          className="navigation-button"
          onClick={goBack}
          disabled={currentTreeIndex <= 0}
        >
          Back
        </button>
        <button
          className="navigation-button"
          onClick={goForward}
          disabled={currentTreeIndex >= treeHistory.length - 1}
        >
          Forward
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
