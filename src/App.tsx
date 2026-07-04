import "./App.css";
import { TitleBar } from "./components/titlebar";

function App() {


  return (
    <main className="container">
      <TitleBar data-tauri-drag-region />
    </main>
  );
}

export default App;
