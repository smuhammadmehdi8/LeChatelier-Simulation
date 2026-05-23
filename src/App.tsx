import { useEffect, useRef } from "react";
import * as pixi from "pixi.js";
import { Application } from "pixi.js";
import "./index.css";

function App() {
  const pixiContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted:boolean = true;
    let app:Application | null = null;
    

    (async () => {
      const newApp = new Application();
      await newApp.init({
        width: 1000,
        height: 500,
        backgroundColor: 0x1e2a38,
        backgroundAlpha: 0.5,
        antialias: true,
      });


      if (!isMounted) {
        newApp.destroy(true, {children:true, texture:true});
        return;
      }

      app = newApp;
      pixiContainerRef.current?.appendChild(app.canvas);

      console.log("div ready for pixijs");
      


    })();


    return () => {
      isMounted = false;
      if (app) {
        app.destroy(true, {children:true, texture:true});
      }
    }
  }, []);

  return (
    <div>
      <h1>LeChatelier Simulation</h1>

      <div ref={pixiContainerRef}></div>
    </div>
  );
}

export default App;
