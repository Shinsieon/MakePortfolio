import "./App.css";
import React, { useEffect, useState } from "react";
import { Route, Routes } from "react-router";
import Home from "./Components/Home";

function App() {
  const [apiResult, setApiResult] = useState("");

  return (
    <div
      className="App"
      style={{
        position: "absolute",
        left: 0,
        backgroundSize: "cover",
        width: "100vw",
        height: "100vh",
        backgroundColor: "#aab6b8",
        fontSize: "20px",
        overflow: "hidden",
      }}
    >
      <Routes>
        <Route path="/" Component={Home} />
      </Routes>
    </div>
  );
}

export default App;
