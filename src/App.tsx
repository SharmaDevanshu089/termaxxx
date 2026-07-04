import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { TitleBar } from "./components/titlebar";
import TargetCursor from "./components/TargetCursor";
import Particles from "./components/Particles";

interface LogItem {
  type: "command" | "response" | "error" | "system";
  text: string;
  cwd?: string;
}

function App() {
  const [cwd, setCwd] = useState<string>("");
  const [inputVal, setInputVal] = useState<string>("");
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus terminal input on load and when clicking anywhere on the window
  useEffect(() => {
    inputRef.current?.focus();
    
    const handleGlobalClick = () => {
      inputRef.current?.focus();
    };
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

  // Fetch initial working directory from the Tauri backend on mount
  useEffect(() => {
    invoke<string>("get_initial_cwd")
      .then((initialCwd) => {
        setCwd(initialCwd);
        setLogs([
          {
            type: "system",
            text: "Termaxxx Terminal v0.1.0\nType commands to interact with the host system.\nType 'clear' to empty logs, 'help' for quick commands.\n",
          },
        ]);
      })
      .catch((err) => {
        setLogs([
          {
            type: "error",
            text: `Failed to load initial directory: ${err}`,
          },
        ]);
      });
  }, []);

  // Auto-scroll to bottom of terminal output whenever logs update
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [logs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const command = inputVal.trim();
    if (!command) return;

    // Append user command to history logs
    const newLogs: LogItem[] = [...logs, { type: "command", text: command, cwd }];
    setLogs(newLogs);
    setInputVal("");

    // Cycle through commands history list
    const updatedHistory = [...history, command];
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length);

    // 1. Check for 'clear'
    if (command.toLowerCase() === "clear") {
      setLogs([]);
      return;
    }

    // 2. Check for 'help'
    if (command.toLowerCase() === "help") {
      setLogs([
        ...newLogs,
        {
          type: "system",
          text: "Supported Navigation & Control:\n  cd <dir>  - Navigate directory path statefully\n  clear     - Reset output log logs\n  help      - Print this guide\n  [command] - Execute general shell commands on host machine\n",
        },
      ]);
      return;
    }

    // 3. Check for 'cd' (matches optional target path)
    const cdRegex = /^cd(?:\s+(.+))?$/i;
    const cdMatch = command.match(cdRegex);
    if (cdMatch) {
      const targetDir = cdMatch[1] || "";
      if (!targetDir) {
        // Just print cwd if target is empty, or print instructions
        setLogs([
          ...newLogs,
          {
            type: "response",
            text: cwd,
          },
        ]);
        return;
      }

      try {
        const resolvedPath = await invoke<string>("resolve_directory", {
          cwd,
          target: targetDir,
        });
        setCwd(resolvedPath);
      } catch (err) {
        setLogs([
          ...newLogs,
          {
            type: "error",
            text: `cd: ${err}`,
          },
        ]);
      }
      return;
    }

    // 4. General shell command execution
    try {
      const result = await invoke<string>("execute_command", {
        command,
        cwd,
      });
      setLogs([
        ...newLogs,
        {
          type: "response",
          text: result || "\n", // render space if output is empty
        },
      ]);
    } catch (err) {
      setLogs([
        ...newLogs,
        {
          type: "error",
          text: String(err),
        },
      ]);
    }
  };

  // Keyboard navigation for terminal command history cycling
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length > 0 && historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInputVal(history[nextIdx]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex < history.length - 1) {
        const nextIdx = historyIndex + 1;
        setHistoryIndex(nextIdx);
        setInputVal(history[nextIdx]);
      } else if (historyIndex === history.length - 1) {
        setHistoryIndex(history.length);
        setInputVal("");
      }
    }
  };

  // Shorten paths on prompt to make it clean
  const getDisplayPath = (fullPath: string) => {
    if (!fullPath) return "";
    return fullPath;
  };

  return (
    <main className="container">
      {/* Background Particles field */}
      <Particles
        particleCount={180}
        particleSpread={12}
        speed={0.12}
        particleColors={["#10b981", "#34d399", "#059669", "#a7f3d0", "#fef08a"]}
        moveParticlesOnHover={true}
        particleHoverFactor={1.2}
        alphaParticles={true}
        particleBaseSize={100}
        sizeRandomness={0.7}
        cameraDistance={22}
      />

      {/* 3D WebGL Fluid Glass Custom Cursor overlay */}
      <TargetCursor
        targetSelector=".cursor-target"
        cursorColor="#ffffff"
        cursorColorOnTarget="hsl(150, 80%, 55%)"
      />

      {/* Custom Titlebar */}
      <TitleBar data-tauri-drag-region />

      {/* Stateful Monospace Terminal Window Container */}
      <div className="terminal-window">
        {/* Output logs stream */}
        <div ref={outputRef} className="terminal-output">
          {logs.map((log, index) => (
            <div key={index} className={`log-row ${log.type}`}>
              {log.type === "command" && (
                <>
                  <span className="prompt-cwd">{getDisplayPath(log.cwd || "")}</span>
                  <span className="prompt-symbol">&gt;</span>
                </>
              )}
              {log.text}
            </div>
          ))}
        </div>

        {/* Input prompt line */}
        <form onSubmit={handleSubmit} className="terminal-input-line">
          <span className="prompt-cwd">{getDisplayPath(cwd)}</span>
          <span className="prompt-symbol">&gt;</span>
          <input
            ref={inputRef}
            type="text"
            className="terminal-input"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
        </form>
      </div>
    </main>
  );
}

export default App;
