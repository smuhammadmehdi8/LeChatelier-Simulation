import { useEffect, useRef } from 'react';
import { Application } from 'pixi.js';
import "./index.css"

function App() {
  const pixiContainerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<Application | null>(null);

  useEffect(() => {
    if (appRef.current) return;  // ← already initialized, bail out

    (async () => {
      const app = new Application();
      await app.init({
        width: 1000,
        height: 500,
        backgroundColor: 0x1e2a38,
        antialias: true,
      });

      appRef.current = app;
      pixiContainerRef.current?.appendChild(app.canvas);
      console.log("div ready for pixijs");
    })();

    return () => {
      appRef.current?.destroy(true, { children: true });
      appRef.current = null;
    };
  }, []);

  return (
    <div>
      <h1>LeChatelier Simulation</h1>
      <div ref={pixiContainerRef}></div>
    </div>
  );
}

export default App