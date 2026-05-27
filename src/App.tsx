import { useEffect, useRef } from "react";
//import * as pixi from "pixi.js";
import { Application } from "pixi.js";
import "./index.css";
import Slider from "./components/slider";
import Checkbox from "./components/checkbox";

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

        <div className="controlPanel-left">
          <hr id="line" />

          <div className="inert-catalyst">
            <Checkbox name={"Add Catalyst"} label={"Catalyst"}/>
          </div>
          <hr id="line" />
          <div className="slider-card">
            <Slider title={"Temperature"} min={273.15} max={600} />
          </div>
          <hr id="line" />
          <div className="slider-card">
            <Slider title={"Volume"} min={273.15} max={600} />
            <Slider title={"Pressure"} min={273.15} max={600} />
          </div>

        </div>

        <div className="canvas" ref={pixiContainerRef}></div>

        <div className="controlPanel-right">

          <div className="slider-card">
            <Slider title={"[Reactant A]"} min={1} max={10} />
            <Slider title={"[Reactant B]"} min={1} max={10} />
          </div>

          <div className="slider-card">
            <Slider title={"[Product A]"} min={1} max={10} />
            <Slider title={"[Product B]"} min={1} max={10} />
          </div>

        </div>

        <div className="graphs">{/* placeholder div for popout graphs */}</div>
      </div>
    </div>
  );
}

export default App;
