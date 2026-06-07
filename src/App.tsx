import { useEffect, useRef, useState } from "react";
import { Application, Graphics, Text } from "pixi.js";
import "./index.css";
import Slider from "./components/slider";
import Checkbox from "./components/checkbox";
import Dropdown from "./components/dropdown";
import {VOLUME_RANGE, PRESSURE_RANGE, calculatePressureFromVolume, calculateVolumeFromPressure} from "./engines/chemistry-math";
import { initSimulation, updateSimulation } from "./engines/pixi";

function App() {
  const [volUnit, setVolUnit] = useState<string>("(L)");
  const [volume, setVolume] = useState<number>(1.0);

  const [tempUnit, setTempUnit] = useState<string>("(K)"); 
  const [temp, setTemp] = useState<number>(298.15); 

  const [pressure, setPressure] = useState<number>(1.0);


  const handleVolumeChange = (newVolume : number) => {
    const volumeInL = volUnit === "(L)" ? newVolume : newVolume / 1000;

    setVolume(volumeInL);
    const newPressure = calculatePressureFromVolume(volumeInL);
    setPressure(newPressure);
  };

  const handlePressureChange = (newPressure : number) => {
    setPressure(newPressure);

    const newVolume = calculateVolumeFromPressure(newPressure);
    setVolume(newVolume);
  }


  const pixiContainerRef = useRef<HTMLDivElement>(null);

  const appRef = useRef<Application | null>(null);
  const pistonRef = useRef<Graphics | null>(null);
  const warningTextRef = useRef<Text | null>(null);

  useEffect(() => {
    let isMounted: boolean = true;
    
    if (pixiContainerRef.current) {
      initSimulation(pixiContainerRef.current).then(({app, pistonLid, warningText}) => {
        if (!isMounted) {
          app.destroy(true, { children: true, texture: true });
          return;
        }
        appRef.current = app;
        pistonRef.current = pistonLid;
        warningTextRef.current = warningText;

        updateSimulation(app, volume, pressure, pistonLid, warningText);
      });
    }

    return () => {
      isMounted = false;
      if (appRef.current) {
        appRef.current.destroy(true, {children: true, texture: true});
      }
    };
    

  }, []);

  useEffect(() => {
    if (appRef.current && pistonRef.current && warningTextRef.current) {
      updateSimulation(appRef.current, volume, pressure, pistonRef.current, warningTextRef.current);
    }
  }, [volume, pressure]);

  return (
    <div>
      <h1>LeChatelier's Principle</h1>

      <div className="layout">

        <div className="controlPanel-left">
          <hr id="line" />

          <div className="inert-catalyst">
            <Checkbox name={"Add Catalyst"} label={"Catalyst"}/>
            <Dropdown label={"Inert Gas"} value1={"none"} name1={"None"} value2={"He"} name2={"Helium"} value3={"Ar"} name3="Argon" />

          </div>
          <hr id="line" />
          <div className="slider-card">
            <Slider title={"Temperature"} min={tempUnit === "(K)" ? 273.15 : 0} max={tempUnit === "(K)" ? 600.0 : 326.85} step={tempUnit === "(K)" ? 0.05 : 1.0} 
                    value={tempUnit === "(K)" ? temp : temp - 273.15}
                    unitOptions={["(K)", "(C)"]}
                    currentUnit={tempUnit}
                    onUnitChange={(newUnit) => {
                      setTempUnit(newUnit);
                    }}
                    onValueChange={(newValue) => {
                      setTemp(tempUnit === "(K)" ? newValue : newValue + 273.15)
                    }}       
            />
          </div>
          <hr id="line" />
          <div className="slider-card">
            <Slider title={"Volume"} 
                    min={volUnit === "(L)" ? (VOLUME_RANGE.min) : (VOLUME_RANGE.min * 1000)} max={volUnit === "(L)" ? (VOLUME_RANGE.max) : (VOLUME_RANGE.max * 1000)} 
                    step={volUnit === "(L)" ? 0.1 : 10.0} 
                    value={volUnit === "(L)" ? volume : volume * 1000} 
                    unitOptions={["(L)", "(mL)"]}
                    currentUnit={volUnit}
                    onUnitChange={(newUnit) => {
                      setVolUnit(newUnit);
                    }}
                    onValueChange={handleVolumeChange}
            />
            <Slider title={"Pressure (atm)"} 
                    min={PRESSURE_RANGE.min} max={PRESSURE_RANGE.max} step={0.1} value={pressure}
                    onValueChange={handlePressureChange} 
            />
          </div>

        </div>

        <div 
          className="canvas" ref={pixiContainerRef}>
        </div>

        <div className="controlPanel-right">
          <div className="vertical-card"> 
            <div className="slider-card">
              <Slider title={"[Reactant A]"} min={0.0} max={3} step={0.1} value={1.0} orientation="vertical" />
              <Slider title={"[Reactant B]"} min={0.0} max={3} step={0.1} value={1.0} orientation="vertical" />
            </div>

            <div className="slider-card">
              <Slider title={"[Product A]"} min={0.0} max={3} step={0.1} value={0.0} orientation="vertical" />
              <Slider title={"[Product B]"} min={0.0} max={3} step={0.1} value={0.0} orientation="vertical" />
            </div>

          </div>
        </div>
        <div className="graphs">{/* placeholder div for popout graphs */}</div>
      </div>
    </div>
  );
}

export default App;
