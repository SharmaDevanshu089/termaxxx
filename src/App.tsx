import "./App.css";
import { TitleBar } from "./components/titlebar";
import TargetCursor from "./components/TargetCursor";

function App() {
  return (
    <main className="container">
      <TargetCursor
        targetSelector=".cursor-target"
        cursorColor="#ffffff"
        cursorColorOnTarget="hsl(38, 85%, 55%)"
      />
      <TitleBar data-tauri-drag-region />
    </main>
  );
}

export default App;

