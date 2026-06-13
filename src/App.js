import './App.css';
import React from "react";
import Photobooth from "./components/Photobooth";
import "./styles/global.css";

const logoSrc = "/assets/logo/jiggleduo-logo.png";

function App() {
  return (
    <div
      className="App"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 1200,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "20px 32px",
          boxSizing: "border-box",
        }}
      >
        <img
          src={logoSrc}
          alt="JiggleDuo Logo"
          style={{ width: 50 }}
          onError={(e) => { e.target.style.display = "none"; }}
        />
        <h1
          style={{
            fontFamily: "CantikaCute",
            color: "#8c5b4a",
            margin: 0,
          }}
        >
          JiggleDuo Photobooth
        </h1>
      </div>

      <div
        style={{
          flex: 1,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          paddingBottom: 40,
        }}
      >
        <Photobooth />
      </div>
    </div>
  );
}

export default App;