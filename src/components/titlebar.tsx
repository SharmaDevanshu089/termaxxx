import { useState, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import "./titlebar.css";

const appWindow = getCurrentWindow();

export function TitleBar() {
    const [maximized, setMaximized] = useState(true);

    useEffect(() => {
        appWindow.isMaximized().then(isMax => {
            setMaximized(isMax);
        });
    }, []);

    function close_window() {
        appWindow.close();
    }

    function handleMinimize() {
        appWindow.minimize();
    }

    function handleMaximizeToggle(isMaximized: boolean) {
        const nextMaximized = !isMaximized;
        setMaximized(nextMaximized);

        if (isMaximized) {
            return appWindow.unmaximize();
        }
        return appWindow.maximize();
    }

    return (
        <div className="Titlebar-window" data-tauri-drag-region>
            <button className="cursor-target" onClick={handleMinimize}>
                <svg width="10" height="1" viewBox="0 0 10 1">
                    <rect width="10" height="1" fill="currentColor" />
                </svg>
            </button>

            <button className="cursor-target" onClick={() => handleMaximizeToggle(maximized)}>
                {maximized ? (
                    <svg width="10" height="10" viewBox="0 0 10 10">
                        <path
                            d="M3 1h6v6H8v1h2V0H2v2h1V1zm-2 2h6v6H1V3zm1 1v4h4V4H2z"
                            fill="currentColor"
                        />
                    </svg>
                ) : (
                    <svg width="10" height="10" viewBox="0 0 10 10">
                        <path d="M0 0v10h10V0H0zm9 9H1V1h8v8z" fill="currentColor" />
                    </svg>
                )}
            </button>

            <button className="cursor-target" onClick={close_window}>
                <svg width="10" height="10" viewBox="0 0 10 10">
                    <path
                        d="M10 .707L9.293 0 5 4.293.707 0 0 .707 4.293 5 0 9.293l.707.707L5 5.707 9.293 10l.707-.707L5.707 5z"
                        fill="currentColor"
                    />
                </svg>
            </button>
        </div>
    );
}