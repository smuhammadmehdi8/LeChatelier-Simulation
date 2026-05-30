import { useEffect, useRef } from "react";
//import * as pixi from "pixi.js";
import { Application } from "pixi.js";
import "./index.css";
import Slider from "./components/slider";
import Checkbox from "./components/checkbox";
import Dropdown from "./components/dropdown";

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
            <Dropdown value1={"none"} name1={"None"} value2={"He"} name2={"Helium"} value3={"Ar"} name3="Argon" />

          </div>
          <hr id="line" />
          <div className="slider-card">
            <Slider title={"Temperature (K)"} min={273.15} max={600} step={1.0} value={298.15} />
          </div>
          <hr id="line" />
          <div className="slider-card">
            <Slider title={"Volume (mL)"} min={100.0} max={2000.0} step={10.0} value={1000.0} />
            <Slider title={"Pressure (atm)"} min={0.1} max={10.0} step={0.1} value={1.0} />
          </div>

        </div>

        <div 
          className="canvas" ref={pixiContainerRef}>
        </div>

        <div className="controlPanel-right">

          <div className="slider-card">
            <Slider title={"[Reactant A]"} min={0.0} max={3} step={0.1} value={1.0} />
            <Slider title={"[Reactant B]"} min={0.0} max={3} step={0.1} value={1.0} />
          </div>

          <div className="slider-card">
            <Slider title={"[Product A]"} min={0.0} max={3} step={0.1} value={0.0} />
            <Slider title={"[Product B]"} min={0.0} max={3} step={0.1} value={0.0} />
          </div>

        </div>

        <div className="graphs">{/* placeholder div for popout graphs */}</div>
      </div>
    </div>
  );
}

export default App;
