import { useEffect, useRef, useState } from "react";
import { Application, Graphics, Container } from "pixi.js";
import "./index.css";
import Slider from "./components/slider";
import Checkbox from "./components/checkbox";
import Dropdown from "./components/dropdown";
import {VOLUME_RANGE, PRESSURE_RANGE, calculatePressureFromVolume, calculateVolumeFromPressure, REACTIONS, getChangeDirection, type Disturbance, type SpeciesSide, type ShiftDirection,  getShiftDirection, getSpeciesResponseDirection, type ChangeDirection, calculateReestablishedConcentrations, calculateInitialEquilibriumConcentrations} from "./engines/chemistry-math";
import { initSimulation, updateSimulation, updateParticleVisuals, getSpeciesCssColor, updateParticleMotion } from "./engines/pixi";


  const DEFAULT_VOLUME = 1.0;
  const DEFAULT_TEMP = 298.15;
  const DEFAULT_VOLUME_UNIT = "(L)";
  const DEFAULT_TEMP_UNIT = "(K)";
  const DEFAULT_INERT_GAS = "none";
  const DEFAULT_CATALYST_ACTIVE = false;

  type ReactionKey = keyof typeof REACTIONS;
  type Reaction = (typeof REACTIONS)[ReactionKey];
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

  const CONCENTRATION_ANIMATION_FRAME_MS = 50;

const roundAnimatedConcentration = (value: number): number => {
  return Math.round(value * 10) / 10;
};

const interpolateConcentrations = (startConcentrations: Concentrations, targetConcentrations: Concentrations, progress: number): Concentrations => {
  const nextConcentrations: Concentrations = {};

  Object.keys(targetConcentrations).forEach((species) => {
    const startValue = startConcentrations[species] ?? 0;
    const targetValue = targetConcentrations[species] ?? 0;

    const animatedValue =
      startValue + (targetValue - startValue) * progress;

    nextConcentrations[species] =
      roundAnimatedConcentration(animatedValue);
  });

  return nextConcentrations;
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
  const controlIsLocked = simulationStatus === "establishing" || simulationStatus === "disrupted";

  const inertGasIsActive = inertGas !== DEFAULT_INERT_GAS;
  const volumePressureLocked = controlIsLocked || inertGasIsActive;
  

  const visibleSpecies = Array.from(
    new Set([
      ...selectedReaction.reactants,
      ...selectedReaction.products,
      ...(inertGas === DEFAULT_INERT_GAS ? [] : [inertGas]),
    ])
  );

  const visualParticleAmounts: Concentrations = {
    ...concentrations,
    ...(inertGas === DEFAULT_INERT_GAS ? {} : { [inertGas]: 1.0 }),
  };

  const concentrationsRef = useRef<Concentrations>(concentrations);


  
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

  //HANDLES VOLUME STUFF, TWO FUNCTIONS BECASUE THEN IT ALSO TAKES THE DISRUPTION INPUTS AS THE USER DRAGS THE SLIDER
  const previewVolumeChange = (newVolume: number) => {
    const volumeInL =
      volUnit === DEFAULT_VOLUME_UNIT ? newVolume : newVolume / 1000;

    setVolume(volumeInL);

    const newPressure = calculatePressureFromVolume(volumeInL);
    setPressure(newPressure);
  };
  const commitVolumeChange = (newVolume: number, startVolume: number) => {
    const finalVolumeInL =
      volUnit === DEFAULT_VOLUME_UNIT ? newVolume : newVolume / 1000;

    const startVolumeInL =
      volUnit === DEFAULT_VOLUME_UNIT ? startVolume : startVolume / 1000;

    const direction = getChangeDirection(finalVolumeInL, startVolumeInL);

    markDisturbed({
      type: "volume",
      label: "Volume",
      direction,
    });
  };

  //HANDLES PRESSURE STUFF
  const previewPressureChange = (newPressure: number) => {
    setPressure(newPressure);

    const newVolume = calculateVolumeFromPressure(newPressure);
    setVolume(newVolume);
  };
  const commitPressureChange = (newPressure: number, startPressure: number) => {
    const direction = getChangeDirection(newPressure, startPressure);

    markDisturbed({
      type: "pressure",
      label: "Pressure",
      direction,
    });
  };

  //HANDLES TEMP STUFF
  const previewTemperatureChange = (newValue: number) => {
    const tempInK =
      tempUnit === DEFAULT_TEMP_UNIT ? newValue : newValue + 273.15;

    setTemp(tempInK);
  };
  const commitTemperatureChange = (newValue: number, startValue: number) => {
    const finalTempInK =
      tempUnit === DEFAULT_TEMP_UNIT ? newValue : newValue + 273.15;

    const startTempInK =
      tempUnit === DEFAULT_TEMP_UNIT ? startValue : startValue + 273.15;

    const direction = getChangeDirection(finalTempInK, startTempInK);

    markDisturbed({
      type: "temperature",
      label: "Temperature",
      direction,
    });
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

  const resetSimulation = () => {
    setVolUnit(DEFAULT_VOLUME_UNIT);
    setVolume(DEFAULT_VOLUME);

    setTempUnit(DEFAULT_TEMP_UNIT);
    setTemp(DEFAULT_TEMP);

    setPressure(calculatePressureFromVolume(DEFAULT_VOLUME));

    setInertGas(DEFAULT_INERT_GAS);
    setCatalystActive(DEFAULT_CATALYST_ACTIVE);
    setLastDisturbance(null);
    setSimulationStatus("establishing");

    setConcentrations(buildDefaultConcentrations(selectedReaction));
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

  //HANDLES CONCENTRATION STUFF
  const previewConcentrationChange = (species: string, newValue: number) => {
    setConcentrations((currentConcentrations) => ({
      ...currentConcentrations,
      [species]: newValue,
    }));
  };
  const commitConcentrationChange = (
    species: string,
    speciesSide: SpeciesSide,
    newValue: number,
    startValue: number
  ) => {
    const direction = getChangeDirection(newValue, startValue);

    markDisturbed({
      type: "concentration",
      label: `[${species}]`,
      direction,
      species,
      speciesSide,
    });
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
  const particleLayerRef = useRef<Container | null>(null);

  useEffect(() => {
    let isMounted: boolean = true;
    
    if (pixiContainerRef.current) {
      initSimulation(pixiContainerRef.current).then(({ app, pistonLid, particleLayer }) => {
        if (!isMounted) {
          app.destroy(true, { children: true, texture: true });
          return;
        }
        appRef.current = app;
        pistonRef.current = pistonLid;
        particleLayerRef.current = particleLayer;

        updateSimulation(volume, pistonLid);
        updateParticleVisuals(particleLayer, visualParticleAmounts, volume);
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
    if (particleLayerRef.current) {
      updateParticleVisuals(
        particleLayerRef.current,
        visualParticleAmounts,
        volume
      );
    }
  }, [visualParticleAmounts, volume, selectedReactionKey, inertGas]);

  useEffect(() => {
    let animationFrameId: number;

    const animateParticles = () => {
      if (particleLayerRef.current) {
        updateParticleMotion(
          particleLayerRef.current,
          volume,
          temp
        );
      }

      animationFrameId = window.requestAnimationFrame(animateParticles);
    };

    animationFrameId = window.requestAnimationFrame(animateParticles);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [volume, temp, selectedReactionKey]);

  useEffect(() => {
    concentrationsRef.current = concentrations;
  }, [concentrations]);


  useEffect(() => {
    if (simulationStatus !== "disrupted") {
      return;
    }

    if (shiftDirection === "none") {
      setSimulationStatus("noShift");
      return;
    }

    const startConcentrations = concentrationsRef.current;

    const targetConcentrations =
      calculateReestablishedConcentrations(
        selectedReaction,
        startConcentrations,
        shiftDirection
      );

    const animationDuration = catalystActive ? 600 : 1500;
    const animationStartTime = Date.now();

    const animationTimer = window.setInterval(() => {
      const elapsedTime = Date.now() - animationStartTime;
      const progress = Math.min(elapsedTime / animationDuration, 1);

      setConcentrations(
        interpolateConcentrations(
          startConcentrations,
          targetConcentrations,
          progress
        )
      );

      if (progress >= 1) {
        window.clearInterval(animationTimer);
        setSimulationStatus("reestablished");
      }
    }, CONCENTRATION_ANIMATION_FRAME_MS);

    return () => {
      window.clearInterval(animationTimer);
    };
  }, [
    simulationStatus,
    shiftDirection,
    selectedReaction,
    catalystActive,
    lastDisturbance,
  ]);

  useEffect(() => {
    if (simulationStatus !== "establishing") {
      return;
    }

    const startConcentrations = concentrationsRef.current;

    const targetConcentrations =
      calculateInitialEquilibriumConcentrations(
        selectedReaction,
        startConcentrations
      );

    const animationDuration = 1500;
    const animationStartTime = Date.now();

    const animationTimer = window.setInterval(() => {
      const elapsedTime = Date.now() - animationStartTime;
      const progress = Math.min(elapsedTime / animationDuration, 1);

      setConcentrations(
        interpolateConcentrations(
          startConcentrations,
          targetConcentrations,
          progress
        )
      );

      if (progress >= 1) {
        window.clearInterval(animationTimer);
        setSimulationStatus("equilibrium");
      }
    }, CONCENTRATION_ANIMATION_FRAME_MS);

    return () => {
      window.clearInterval(animationTimer);
    };
  }, [simulationStatus, selectedReaction]);

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
            : inertGasIsActive
            ? `Inert gas added at constant volume. Volume and pressure controls are locked until reset.`
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
                      disabled={controlIsLocked}
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
              disabled={controlIsLocked || inertGasIsActive}
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
              onValueChange={previewTemperatureChange}
              onValueCommit={commitTemperatureChange}
              disabled={controlIsLocked}
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
              onValueChange={previewVolumeChange}
              onValueCommit={commitVolumeChange}
              disabled={volumePressureLocked}
            />
            <Slider
              title={"Pressure (atm)"}
              min={PRESSURE_RANGE.min}
              max={PRESSURE_RANGE.max}
              step={0.1}
              value={pressure}
              onValueChange={previewPressureChange}
              onValueCommit={commitPressureChange}
              disabled={volumePressureLocked}
            />
          </div>
        </div>

        <div className="canvas" ref={pixiContainerRef}></div>
        <div className="controlPanel-right">
          <div   className={`concentration-panel ${controlIsLocked ? "concentration-panel-responding" : ""}`}>
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
                      previewConcentrationChange(reactant, newValue);
                    }}
                    onValueCommit={(newValue, startValue) => {
                      commitConcentrationChange(reactant, "reactant", newValue, startValue);
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
                      previewConcentrationChange(product, newValue);
                    }}
                    onValueCommit={(newValue, startValue) => {
                      commitConcentrationChange(product, "product", newValue, startValue);
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
                
          <div className="particle-key">
            <div className="particle-key-title">Particle Key</div>

            {visibleSpecies.map((species) => (
              <div className="particle-key-row" key={species}>
                <span
                  className="particle-key-dot"
                  style={{ backgroundColor: getSpeciesCssColor(species) }}
                />
                <span className="particle-key-label">{species}</span>
              </div>
            ))}
          </div>

          <button
            className="reset-button"
            type="button"
            onClick={resetSimulation}
          >
            ↻ Reset Simulation
          </button>

        </div>
        <div className="graphs">{/* placeholder div for popout graphs */}</div>
      </div>
    </div>
  );
}

export default App;
