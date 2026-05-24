import { useEffect, useRef } from "react";
//import * as pixi from "pixi.js";
import { Application } from "pixi.js";
import "./index.css";
import Slider from "./components/slider"

function App() {
  const pixiContainerRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    let isMounted: boolean = true;
    let app: Application | null = null;

    (async () => {
      const newApp = new Application();
      await newApp.init({
        width: 400,
        height: 500,
        backgroundColor: 0x000000,
        backgroundAlpha: 1, //background transperncy
        antialias: true,
      });

      if (!isMounted) {
        newApp.destroy(true, { children: true, texture: true });
        return;
      }

      app = newApp;
      pixiContainerRef.current?.appendChild(app.canvas);

      console.log("div ready for pixijs");
    })();

    return () => {
      isMounted = false;
      if (app) {
        app.destroy(true, { children: true, texture: true });
      }
    };
  }, []);

  return (
    <div>
      <h1>LeChatelier Simulation</h1>

      <div className="layout"> 
        <Slider title={"Temperature"} min={273.15} max={600} />

        <div className="canvas" ref={pixiContainerRef}></div>

      </div>
    </div>
   
  );
}

export default App;
