export const VOLUME_RANGE = {
  min: 0.5,
  max: 2.0,
};

export const PRESSURE_RANGE = {
  min: 0.5,
  max: 5.0,
};


//if i forget in the future, the position is for how far the volume is between the volume min amd max so we can route that to the opposie of the pressure slider
export const calculatePressureFromVolume = (volumeL: number): number => {
  const volumePosition = (volumeL - VOLUME_RANGE.min) / (VOLUME_RANGE.max - VOLUME_RANGE.min); 

  const pressure = PRESSURE_RANGE.max - volumePosition * (PRESSURE_RANGE.max - PRESSURE_RANGE.min);

  return Math.round(pressure * 10) / 10;
};

//basically the same thing as the previous comment
export const calculateVolumeFromPressure = (pressureATM: number): number => {
  const pressurePosition = (pressureATM - PRESSURE_RANGE.min) / (PRESSURE_RANGE.max - PRESSURE_RANGE.min);

  const volume =
    VOLUME_RANGE.max -
    pressurePosition * (VOLUME_RANGE.max - VOLUME_RANGE.min);

  return Math.round(volume * 10) / 10;
};

export const REACTIONS = {
  exo: {
    label: "Exothermic: N₂ + 3H₂ ⇌ 2NH₃",
    reactants: ["N₂", "H₂"],
    products: ["NH₃"]
  },
  endo: {
    label: "Endothermic: N₂O₄ ⇌ 2NO₂",
    reactants: ["N₂O₄"],
    products: ["NO₂"]
  },
  equi: {
    label: "Equimolar: H₂ + I₂ ⇌ 2HI",
    reactants: ["H₂", "I₂"],
    products: ["2HI"]
  }
};

