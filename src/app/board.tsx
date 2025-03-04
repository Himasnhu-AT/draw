"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

// Import the types from Excalidraw
import type { ExcalidrawElement } from "@excalidraw/excalidraw/types/element/types";
import type { AppState, BinaryFiles } from "@excalidraw/excalidraw/types/types";
import { invoke } from "@tauri-apps/api/tauri";

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  { ssr: false },
);

// Debounce function to limit how often we save
const debounce = <F extends (...args: any[]) => any>(
  func: F,
  waitFor: number
) => {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<F>): Promise<ReturnType<F>> => {
    clearTimeout(timeout);
    return new Promise((resolve) => {
      timeout = setTimeout(() => resolve(func(...args)), waitFor);
    });
  };
};

// Diagnostic component for debugging
function DiagnosticPanel({ onClose }: { onClose: () => void }) {
  const [diagInfo, setDiagInfo] = useState<string>('Loading diagnostic information...');
  
  useEffect(() => {
    // Call the diagnostic function when the component mounts
    checkStoragePaths();
  }, []);
  
  const checkStoragePaths = async () => {
    try {
      const info = await invoke<string>("check_storage_paths");
      setDiagInfo(info);
    } catch (error) {
      setDiagInfo(`Error checking storage paths: ${error}`);
    }
  };
  
  return (
    <div style={{
      position: 'absolute',
      top: '10px',
      right: '10px',
      backgroundColor: 'white',
      color: 'black',
      border: '1px solid #ccc',
      borderRadius: '5px',
      padding: '10px',
      zIndex: 1000,
      maxWidth: '500px',
      maxHeight: '400px',
      overflow: 'auto'
    }}>
      <h3>Storage Diagnostics</h3>
      <pre style={{ whiteSpace: 'pre-wrap', fontSize: '12px' }}>{diagInfo}</pre>
      <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={checkStoragePaths}>Refresh</button>
        <button onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

export default function Home() {
  const [height, setHeight] = useState("100vh");
  const [excalidrawAPI, setExcalidrawAPI] = useState<any>(null);
  const [initialData, setInitialData] = useState<{
    elements: ExcalidrawElement[];
    appState: Partial<AppState>;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Save drawing data
  // const saveDrawing = debounce(async (elements: readonly ExcalidrawElement[], appState: AppState) => {
  //   try {
  //     console.log("Saving drawing with elements:", elements.length);
  //     const dataObject = { elements, appState };
  //     const data = JSON.stringify(dataObject);
  //     console.log(`Data size to save: ${data.length} characters`);
  //     await invoke("save_drawing", { args: data });
  //     console.log("Drawing saved successfully");
  //   } catch (error) {
  //     console.error("Failed to save drawing:", error);
  //   }
  // }, 1000); // Debounce for 1 second
  const saveDrawing = debounce(async (elements: readonly ExcalidrawElement[], appState: AppState) => {
    try {
      console.log("Saving drawing with elements:", elements.length);
      // Instead of sending JSON string, pass the object directly
      // const dataObject = { elements, appState };
      // const data = JSON.stringify(dataObject);
      // await invoke("save_drawing", { args: data });
      
      await invoke("save_drawing", {
        args: {
          elements: elements,
          app_state: appState,
        },
      });
      
      console.log("Drawing saved successfully");
    } catch (error) {
      console.error("Failed to save drawing:", error);
    }
  }, 1000);

  // Load drawing data
  const loadDrawing = async () => {
    try {
      setIsLoading(true);
      console.log("Loading drawing...");
      const data = await invoke<string>("load_drawing");
      
      console.log(`Received data from Rust: ${data ? data.substring(0, 100) + '...' : 'empty'}`);
      console.log(`Data length: ${data ? data.length : 0} characters`);
      
      if (data && data.length > 0) {
        try {
          const parsedData = JSON.parse(data);
          console.log(`Parsed data successfully, elements: ${parsedData.elements ? parsedData.elements.length : 0}`);
          setInitialData(parsedData);
        } catch (parseError) {
          console.error("Failed to parse drawing data:", parseError);
        }
      } else {
        console.log("No drawing data found to load");
      }
    } catch (error) {
      console.error("Failed to load drawing:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle diagnostics panel
  const toggleDiagnostics = () => {
    setShowDiagnostics(!showDiagnostics);
  };

  useEffect(() => {
    // Load drawing data when component mounts
    loadDrawing();
    
    // Update height on resize
    const updateHeight = () => {
      setHeight(`${window.innerHeight}px`);
    };
    // Set initial height
    updateHeight();
    // Add resize listener
    window.addEventListener("resize", updateHeight);
    
    // Add keyboard shortcut for diagnostics panel (Ctrl+Shift+D)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        toggleDiagnostics();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    // Clean up
    return () => {
      window.removeEventListener("resize", updateHeight);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const onExcalidrawChange = (elements: readonly ExcalidrawElement[], appState: AppState, files: BinaryFiles) => {
    // Only save when there are elements or we have a non-empty drawing
    if (elements.length > 0 || (initialData && initialData.elements.length > 0)) {
      console.log("Drawing changed, triggering save...");
      saveDrawing(elements, appState);
    }
  };

  if (isLoading) {
    return (
      <div style={{ height, display: "flex", justifyContent: "center", alignItems: "center" }}>
        Loading your drawing...
      </div>
    );
  }

  return (
    <>
      <div style={{ height, position: 'relative' }}>
        <Excalidraw 
          excalidrawAPI={(api) => setExcalidrawAPI(api)}
          initialData={initialData || undefined}
          onChange={onExcalidrawChange}
        />
        
        {/* Small diagnostic button */}
        <button 
          onClick={toggleDiagnostics} 
          style={{ 
            position: 'absolute', 
            top: '10px', 
            right: '10px', 
            zIndex: 999,
            padding: '5px',
            backgroundColor: '#f0f0f0',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          🔍 Debug
        </button>
        
        {/* Diagnostic panel */}
        {showDiagnostics && (
          <DiagnosticPanel onClose={() => setShowDiagnostics(false)} />
        )}
      </div>
    </>
  );
}
