import React, { useState, useEffect } from "react";
import Tree from "react-d3-tree";

function App() {
  const [input, setInput] = useState("");
  const [treeData, setTreeData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchMindmap = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8080", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: input }),
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

  useEffect(() => {
    if (treeData) {
      // You can add any additional setup here if needed
    }
  }, [treeData]);

  return (
    <div style={{ width: "100%", height: "100vh" }}>
      <input
        type="text"
        placeholder="Describe your mindmap"
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />
      <button onClick={fetchMindmap} disabled={isLoading}>
        {isLoading ? "Generating..." : "Generate"}
      </button>
      {treeData && <Tree data={treeData} />}
    </div>
  );
}

export default App;
