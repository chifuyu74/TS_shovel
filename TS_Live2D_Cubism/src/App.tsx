import List from "@comp/List";
import logo from "./logo.svg";
import "./App.css";
import useLive2D from "@hooks/useLive2D";

function App() {
  useLive2D();

  return (
    <div className="App">
      <List />
      <canvas id="can"></canvas>
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;

