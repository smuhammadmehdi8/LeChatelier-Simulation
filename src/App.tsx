import { useEffect, useRef, useState } from "react";
import { Application, Graphics } from "pixi.js";
import "./index.css";
import Slider from "./components/slider";
import Checkbox from "./components/checkbox";
import Dropdown from "./components/dropdown";
import {VOLUME_RANGE, PRESSURE_RANGE, calculatePressureFromVolume, calculateVolumeFromPressure, REACTIONS, getChangeDirection, type Disturbance, type SpeciesSide, type ShiftDirection,  getShiftDirection, getSpeciesResponseDirection, type ChangeDirection, calculateReestablishedConcentrations, calculateInitialEquilibriumConcentrations} from "./engines/chemistry-math";
import { initSimulation, updateSimulation } from "./engines/pixi";


  const DEFAULT_VOLUME = 1.0;
  const DEFAULT_TEMP = 298.15;
  const DEFAULT_VOLUME_UNIT = "(L)";
  const DEFAULT_TEMP_UNIT = "(K)";
  const DEFAULT_INERT_GAS = "none";
  const DEFAULT_CATALYST_ACTIVE = false;

  type ReactionKey = keyof typeof REACTIONS;
  type Reaction = (typeof REACTIONS)[ReactionKey]
  type Concentrations = Record<string, number>;

  const buildDefaultConcentrations = (reaction: Reaction): Concentrations => {
  const defaultConcentrations: Concentrations = {};

  reaction.reactants.forEach((reactant) => {
    defaultConcentrations[reactant] = 1.0;
  });

  reaction.products.forEach((product) => {
    defaultConcentrations[product] = 0.0;
  });

  return defaultConcentrations;
};


type SimulationStatus =
  | "establishing"
  | "equilibrium"
  | "disrupted"
  | "reestablished"
  | "noShift";


  const getShiftDisplayText = (shiftDirection: ShiftDirection): string => {
    if (shiftDirection === "reactants") {
      return "Shift: toward reactants";
    }

    if (shiftDirection === "products") {
      return "Shift: toward products";
    }

    return "Shift: no equilibrium shift";
  };

  const getResponseArrow = (direction: ChangeDirection): string => {
    if (direction === "increase") {
      return "↑";
    }

    if (direction === "decrease") {
      return "↓";
    }

    return "";
  };


function App() {
  const [volUnit, setVolUnit] = useState<string>(DEFAULT_VOLUME_UNIT);
  const [volume, setVolume] = useState<number>(DEFAULT_VOLUME);

  const [tempUnit, setTempUnit] = useState<string>(DEFAULT_TEMP_UNIT); 
  const [temp, setTemp] = useState<number>(DEFAULT_TEMP); 

  const [pressure, setPressure] = useState<number>(calculatePressureFromVolume(1.0));

  const [catalystActive, setCatalystActive] = useState<boolean>(DEFAULT_CATALYST_ACTIVE);
  const [inertGas, setInertGas] = useState<string>(DEFAULT_INERT_GAS);

  const [selectedReactionKey, setSelectedReactionKey] = useState<ReactionKey>("exo");
  const selectedReaction = REACTIONS[selectedReactionKey];

  const [concentrations, setConcentrations] = useState<Concentrations>(() => 
    buildDefaultConcentrations(selectedReaction)
  );

  const [lastDisturbance, setLastDisturbance] = useState<Disturbance | null>(null);
  const [simulationStatus, setSimulationStatus] = useState<SimulationStatus>("establishing");
  const shiftDirection = getShiftDirection(selectedReaction, lastDisturbance);


  
  const markDisturbed = (disturbance: Disturbance) => {
    setLastDisturbance(disturbance);

    if (disturbance.type === "catalyst" || disturbance.type === "inertGas") {
      setSimulationStatus("noShift");
      return;
    }

    if (disturbance.direction === "none") {
      setSimulationStatus("equilibrium");
      return;
    }

    const resultingShift = getShiftDirection(selectedReaction, disturbance);

    if (resultingShift === "none") {
      setSimulationStatus("noShift");
      return;
    }

    setSimulationStatus("disrupted");
  };

  const handleVolumeChange = (newVolume : number) => {
    const volumeInL = volUnit === DEFAULT_VOLUME_UNIT ? newVolume : newVolume / 1000;

    const direction = getChangeDirection(volumeInL, volume);

    markDisturbed({
      type: "volume",
      label: "Volume",
      direction,
    });

    setVolume(volumeInL);

    const newPressure = calculatePressureFromVolume(volumeInL);
    setPressure(newPressure);
  };

  const handlePressureChange = (newPressure : number) => {
    const direction = getChangeDirection(newPressure, pressure);

    markDisturbed({ 
      type: "pressure",
      label: "Pressure",
      direction,
    });
   
   
    setPressure(newPressure);

    const newVolume = calculateVolumeFromPressure(newPressure);
    setVolume(newVolume);
  };

  const handleTemperatureChange = (newValue: number) => {
    const tempInK = tempUnit === DEFAULT_TEMP_UNIT ? newValue : newValue + 273.15;

    const direction = getChangeDirection(tempInK, temp);

    markDisturbed({
      type: "temperature",
      label: "Temperature",
      direction,
    });

    setTemp(tempInK);
  };

  const handleReactionChange = (newReactionKey: ReactionKey) => {
    const newReaction = REACTIONS[newReactionKey];

    setSelectedReactionKey(newReactionKey);

    setVolUnit(DEFAULT_VOLUME_UNIT);
    setVolume(DEFAULT_VOLUME);

    setTempUnit(DEFAULT_TEMP_UNIT);
    setTemp(DEFAULT_TEMP);

    setPressure(calculatePressureFromVolume(DEFAULT_VOLUME));

    setInertGas(DEFAULT_INERT_GAS);
    setCatalystActive(DEFAULT_CATALYST_ACTIVE);
    setLastDisturbance(null);
    setSimulationStatus("establishing");

    setConcentrations(buildDefaultConcentrations(newReaction));
  };

  const handleInertGasChange = (newInertGas: string) => {
    setInertGas(newInertGas);

    markDisturbed({
      type: "inertGas",
      label:
        newInertGas === DEFAULT_INERT_GAS
          ? "Inert Gas Removed"
          : "Inert Gas Added",
      direction: "none",
    });
  };

  const handleConcentrationChange = (species: string, speciesSide: SpeciesSide, newValue: number) => {

    const oldValue = concentrations[species] ?? 0.0;
    const direction = getChangeDirection(newValue, oldValue);

    markDisturbed({
      type: "concentration",
      label: `[${species}]`,
      direction,
      species,
      speciesSide,
    });

    setConcentrations((currentConcentrations) => ({
      ...currentConcentrations,
      [species]: newValue,
    }));
  };

  const handleCatalystChange = (isChecked: boolean) => {
    setCatalystActive(isChecked);

    markDisturbed({
      type: "catalyst",
      label: isChecked ? "Catalyst Added" : "Catalyst Removed",
      direction: "none",
    });
  };

  const pixiContainerRef = useRef<HTMLDivElement>(null);

  const appRef = useRef<Application | null>(null);
  const pistonRef = useRef<Graphics | null>(null);

  useEffect(() => {
    let isMounted: boolean = true;
    
    if (pixiContainerRef.current) {
      initSimulation(pixiContainerRef.current).then(({app, pistonLid}) => {
        if (!isMounted) {
          app.destroy(true, { children: true, texture: true });
          return;
        }
        appRef.current = app;
        pistonRef.current = pistonLid;

        updateSimulation(volume, pistonLid);
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
    if (appRef.current && pistonRef.current) {
      updateSimulation(volume, pistonRef.current);
    }
  }, [volume]);


  useEffect(() => {
    if (simulationStatus !== "disrupted") {
      return;
    }

    if (shiftDirection === "none") {
      setSimulationStatus("noShift");
      return;
    }

    const reestablishmentTime = catalystActive ? 600 : 1500;

    const timer = window.setTimeout(() => {
      const newConcentrations = calculateReestablishedConcentrations(
        selectedReaction,
        concentrations,
        shiftDirection
      );

      setConcentrations(newConcentrations);
      setSimulationStatus("reestablished");
    }, reestablishmentTime);

    return () => {
      window.clearTimeout(timer);
    };
  }, [simulationStatus, lastDisturbance]);

  useEffect(() => {
    if (simulationStatus !== "establishing") {
      return;
    }

    const timer = window.setTimeout(() => {
      const equilibriumConcentrations =
        calculateInitialEquilibriumConcentrations(
          selectedReaction,
          concentrations
        );

      setConcentrations(equilibriumConcentrations);
      setSimulationStatus("equilibrium");
    }, 1500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [simulationStatus, selectedReaction, concentrations]);

  return (
    <div className="app-container">
      <h1> LeChatelier's Principle </h1>

      <div className="reaction-display">
        <select
          className="reaction-display-select"
          value={selectedReactionKey}
          onChange={(event) => {
            handleReactionChange(event.target.value as ReactionKey);
          }}
        >
          {Object.entries(REACTIONS).map(([key, reaction]) => (
            <option key={key} value={key}>
              {reaction.label}
            </option>
          ))}
        </select>
      </div>


      <div className={`disturbance-display ${simulationStatus}`}>
        <div className="disturbance-status-text">
          {simulationStatus === "establishing" && "Establishing Equilibrium"}
          {simulationStatus === "equilibrium" && "System at Equilibrium"}
          {simulationStatus === "disrupted" && "Equilibrium Disrupted"}
          {simulationStatus === "reestablished" && "Equilibrium Reestablished"}
          {simulationStatus === "noShift" && "No Shift: System at Equilibrium"}
        </div>

        <div className="disturbance-detail-text">
          {simulationStatus === "establishing"
            ? "Products are forming as the system moves toward equilibrium."
            : lastDisturbance === null
            ? "No disturbance has been applied."
            : `${lastDisturbance.label} ${
                lastDisturbance.direction === "increase"
                  ? "↑"
                  : lastDisturbance.direction === "decrease"
                  ? "↓"
                  : "—"
              }`}
        </div>
    

        {lastDisturbance !== null && (
          <div className="shift-result-text">
            {getShiftDisplayText(shiftDirection)}
          </div>
        )}  
      </div>


      <div className="layout">
        <div className="controlPanel-left">
          <hr id="line" />

          <div className="inert-catalyst">
            <Checkbox name={"Add Catalyst"} 
                      label={"Catalyst"}
                      checked={catalystActive}
                      onChange={handleCatalystChange}
            />
            <Dropdown
              label={"Inert Gas"}
              value={inertGas}
              options={[
                { value: "none", label: "None" },
                { value: "He", label: "Helium" },
                { value: "Ar", label: "Argon" },
              ]}
              onChange={handleInertGasChange}
            />
          </div>
          <hr id="line" />
          <div className="slider-card">
            <Slider
              title={"Temperature"}
              min={tempUnit === DEFAULT_TEMP_UNIT ? 273.15 : 0}
              max={tempUnit === DEFAULT_TEMP_UNIT ? 600.0 : 326.85}
              step={tempUnit === DEFAULT_TEMP_UNIT ? 0.05 : 1.0}
              value={tempUnit === DEFAULT_TEMP_UNIT ? temp : temp - 273.15}
              unitOptions={[DEFAULT_TEMP_UNIT, "(C)"]}
              currentUnit={tempUnit}
              onUnitChange={(newUnit) => {
                setTempUnit(newUnit);
              }}
              onValueChange={handleTemperatureChange}
            />
          </div>
          <hr id="line" />
          <div className="slider-card">
            <Slider
              title={"Volume"}
              min={
                volUnit === DEFAULT_VOLUME_UNIT ? VOLUME_RANGE.min : VOLUME_RANGE.min * 1000
              }
              max={
                volUnit === DEFAULT_VOLUME_UNIT ? VOLUME_RANGE.max : VOLUME_RANGE.max * 1000
              }
              step={volUnit === DEFAULT_VOLUME_UNIT ? 0.1 : 10.0}
              value={volUnit === DEFAULT_VOLUME_UNIT ? volume : volume * 1000}
              unitOptions={[DEFAULT_VOLUME_UNIT, "(mL)"]}
              currentUnit={volUnit}
              onUnitChange={(newUnit) => {
                setVolUnit(newUnit);
              }}
              onValueChange={handleVolumeChange}
            />
            <Slider
              title={"Pressure (atm)"}
              min={PRESSURE_RANGE.min}
              max={PRESSURE_RANGE.max}
              step={0.1}
              value={pressure}
              onValueChange={handlePressureChange}
            />
          </div>
        </div>

        <div className="canvas" ref={pixiContainerRef}></div>
        <div className="controlPanel-right">
          <div className="concentration-panel">
            <div className="concentration-group">
              <div className="concentration-heading">Reactants</div>

              <div className="concentration-slider-row">
                {selectedReaction.reactants.map((reactant) => (
                  <Slider
                    key={reactant}
                    title={`[${reactant}] ${getResponseArrow(
                      getSpeciesResponseDirection(shiftDirection, "reactant")
                    )}`}
                    min={0.0}
                    max={3}
                    step={0.1}
                    value={concentrations[reactant] ?? 1.0}
                    orientation="vertical"
                    onValueChange={(newValue) => {
                      handleConcentrationChange(reactant, "reactant", newValue);
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="equilibrium-arrow">⇌</div>

            <div className="concentration-group">
              <div className="concentration-heading">Products</div>

              <div className="concentration-slider-row">
                {selectedReaction.products.map((product) => (
                  <Slider
                    key={product}
                    title={`[${product}] ${getResponseArrow(
                      getSpeciesResponseDirection(shiftDirection, "product")
                    )}`}  
                    min={0.0}
                    max={3}
                    step={0.1}
                    value={concentrations[product] ?? 0.0}
                    orientation="vertical"
                    onValueChange={(newValue) => {
                      handleConcentrationChange(product, "product", newValue);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="graphs">{/* placeholder div for popout graphs */}</div>
      </div>
    </div>
  );
}

export default App;
