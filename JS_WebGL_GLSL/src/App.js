import Three from "./loader/Three";
import "./App.css";
import { createGlobalStyle } from "styled-components";

const Block = createGlobalStyle`
  * { 
    margin: 0;
    padding: 0;
  }

  html, body, #root {
    width: 100%;
    height: 100%;
  }
`;

function App() {
  return (
    <>
      <Block />
      <Three />
    </>
  );
}

export default App;
