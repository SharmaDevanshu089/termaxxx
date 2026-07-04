import { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { TitleBar } from "./components/titlebar";
import TargetCursor from "./components/TargetCursor";
import Particles from "./components/Particles";

interface LogItem {
  type: "command" | "response" | "error" | "system" | "system-fetch";
  text: string;
  cwd?: string;
  systemData?: any;
}

// Custom neofetch / fastfetch style welcome block rendering
const renderSystemFetch = (info: any) => {
  const badgeColors = [
    "#1e1e2e", // black
    "#f38ba8", // red
    "#a6e3a1", // green
    "#f9e2af", // yellow
    "#89b4fa", // blue
    "#cba6f7", // magenta
    "#89dceb", // cyan
    "#cdd6f4"  // white
  ];

  // Hyprland Symbol H in ASCII format
  const asciiLogo = 
`  ██╗  ██╗
  ██║  ██║
  ███████║
  ██╔══██║
  ██║  ██║
  ╚═╝  ╚═╝`;

  return (
    <div className="fetch-container">
      <div className="fetch-logo">{asciiLogo}</div>
      <div className="fetch-details">
        <div className="fetch-user-host">
          <span className="user">{info.username}</span>
          <span>@</span>
          <span className="host">{info.hostname}</span>
        </div>
        <div className="fetch-divider">-------------------------</div>
        <div className="fetch-row">
          <span className="fetch-label">OS</span>
          <span className="fetch-val">{info.os}</span>
        </div>
        <div className="fetch-row">
          <span className="fetch-label">Kernel</span>
          <span className="fetch-val">{info.kernel}</span>
        </div>
        <div className="fetch-row">
          <span className="fetch-label">Uptime</span>
          <span className="fetch-val">{info.uptime}</span>
        </div>
        <div className="fetch-row">
          <span className="fetch-label">Shell</span>
          <span className="fetch-val">PowerShell 7 (NoProfile)</span>
        </div>
        <div className="fetch-row">
          <span className="fetch-label">Terminal</span>
          <span className="fetch-val">Termaxxx Console v0.1.0</span>
        </div>
        <div className="fetch-row">
          <span className="fetch-label">WM/DE</span>
          <span className="fetch-val">Hyprland-Win (Glassmorphic)</span>
        </div>
        <div className="fetch-row">
          <span className="fetch-label">Memory</span>
          <span className="fetch-val">{info.memory}</span>
        </div>
        <div className="fetch-badges">
          {badgeColors.map((color, i) => (
            <div key={i} className="badge-block" style={{ backgroundColor: color }} />
          ))}
        </div>
      </div>
    </div>
  );
};

function App() {
  const [cwd, setCwd] = useState<string>("");
  const [inputVal, setInputVal] = useState<string>("");
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  // Autocomplete / Autosuggestion states
  const [suggestion, setSuggestion] = useState<string>("");
  const [suggestionRemaining, setSuggestionRemaining] = useState<string>("");

  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Common developer words and command predictions
  const commonWords = [
    "npm run dev", "npm install", "npm start", "npm run build", "npm test",
    "npm ls", "cd", "mkdir", "ls", "clear", "help",
    "git status", "git add", "git commit", "git push", "git pull",
    "cargo build", "cargo run", "cargo check"
  ];

  // Focus terminal input on load and when clicking anywhere on the window
  useEffect(() => {
    inputRef.current?.focus();
    
    const handleGlobalClick = () => {
      inputRef.current?.focus();
    };
    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

  // Fetch initial home directory and system info on mount
  useEffect(() => {
    invoke<string>("get_home_dir")
      .then((homePath) => {
        setCwd(homePath);
        return invoke<any>("get_system_info");
      })
      .then((sysInfo) => {
        setLogs([
          {
            type: "system-fetch",
            text: "",
            systemData: sysInfo
          },
          {
            type: "system",
            text: "Termaxxx PowerShell v0.1.0\nType commands to interact with the host system. Type 'help' for navigation details.\n",
          },
        ]);
      })
      .catch((err) => {
        // Fallback to initial current directory if home retrieval failed
        invoke<string>("get_initial_cwd")
          .then((initialCwd) => {
            setCwd(initialCwd);
            setLogs([
              {
                type: "system",
                text: `Warning: Failed to load home folder: ${err}\nStarting in: ${initialCwd}\n`,
              },
            ]);
          });
      });
  }, []);

  // Auto-scroll to bottom of terminal output whenever logs update
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [logs]);

  // Auto-calculate suggestions whenever inputVal or history changes
  useEffect(() => {
    const val = inputVal;
    if (!val) {
      setSuggestion("");
      setSuggestionRemaining("");
      return;
    }

    // 1. Check history matches (most recent matches first)
    const historyMatch = history
      .slice()
      .reverse()
      .find((cmd) => cmd.toLowerCase().startsWith(val.toLowerCase()));

    if (historyMatch) {
      setSuggestion(historyMatch);
      // Preserve the user's typed case, but append the match remaining characters
      setSuggestionRemaining(historyMatch.slice(val.length));
      return;
    }

    // 2. Check common predictions list
    const wordMatch = commonWords.find((word) =>
      word.toLowerCase().startsWith(val.toLowerCase())
    );

    if (wordMatch) {
      setSuggestion(wordMatch);
      setSuggestionRemaining(wordMatch.slice(val.length));
      return;
    }

    setSuggestion("");
    setSuggestionRemaining("");
  }, [inputVal, history]);

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
        // Just print cwd if target is empty
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

  // Keyboard navigation for terminal command history cycling and Tab completion
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Tab or Right Arrow accepts the active suggestion
    if (e.key === "Tab" || (e.key === "ArrowRight" && e.currentTarget.selectionStart === inputVal.length)) {
      if (suggestionRemaining) {
        e.preventDefault();
        setInputVal(suggestion);
        return;
      }
    }

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
        particleColors={["#3584e4", "#1c71d8", "#62a0ea", "#9141ac", "#99c1f1"]}
        moveParticlesOnHover={true}
        particleHoverFactor={1.2}
        alphaParticles={true}
        particleBaseSize={100}
        sizeRandomness={0.7}
        cameraDistance={22}
      />

      {/* 2D Simple Target Cursor overlay */}
      <TargetCursor
        targetSelector=".cursor-target"
      />

      {/* Stateful Monospace Terminal Window Container */}
      <div className="terminal-window">
        {/* Custom Titlebar (Integrated directly into the glassy console pane) */}
        <TitleBar data-tauri-drag-region />

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
              {log.type === "system-fetch" ? (
                renderSystemFetch(log.systemData)
              ) : (
                log.text
              )}
            </div>
          ))}
        </div>

        {/* Input prompt line */}
        <form onSubmit={handleSubmit} className="terminal-input-line">
          <span className="prompt-cwd">{getDisplayPath(cwd)}</span>
          <span className="prompt-symbol">&gt;</span>
          <div className="input-container">
            {/* Background suggestion overlay */}
            {suggestionRemaining && (
              <div className="suggestion-overlay">
                <span className="invisible-input-text">{inputVal}</span>
                <span className="visible-suggestion-text">{suggestionRemaining}</span>
              </div>
            )}
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
          </div>
        </form>
      </div>
    </main>
  );
}

export default App;
