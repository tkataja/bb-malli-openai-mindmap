import React, { useCallback, useState, useEffect } from "react";
import Tree from "react-d3-tree";

const rotate = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const RotatingSpinner = styled.span`
  display: inline-block;
  animation: ${rotate} 2s linear infinite;
`;

const SpinnerEmoji = () => {
  const [emoji, setEmoji] = useState("🧠");
  const emojis = ["🧠", "💡", "🌳", "🔄"];

  useEffect(() => {
    const interval = setInterval(() => {
      setEmoji((prevEmoji) => {
        const currentIndex = emojis.indexOf(prevEmoji);
        return emojis[(currentIndex + 1) % emojis.length];
      });
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return <RotatingSpinner>{emoji}</RotatingSpinner>;
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
      fetchMindmap(nodeData.data.name);
      evt.stopPropagation();
    }
  }, []);

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <input
        type="text"
        placeholder="Describe your mindmap"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button onClick={() => fetchMindmap(input)} disabled={isLoading}>
        {isLoading ? (
          <>
            Generating... <SpinnerEmoji />
          </>
        ) : (
          "Generate"
        )}
      </button>
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
