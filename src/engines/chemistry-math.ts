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
    thermalType: "exothermic",
    reactants: ["N₂", "H₂"],
    products: ["NH₃"],
    reactantGasMoles: 4,
    productGasMoles: 2,
  },
  endo: {
    label: "Endothermic: N₂O₄ ⇌ 2NO₂",
    thermalType: "endothermic",
    reactants: ["N₂O₄"],
    products: ["NO₂"],
    reactantGasMoles: 1,
    productGasMoles: 2,
  },
  equi: {
    label: "Equimolar / No Heat Effect: H₂ + I₂ ⇌ 2HI",
    thermalType: "thermoneutral",
    reactants: ["H₂", "I₂"],
    products: ["HI"],
    reactantGasMoles: 2,
    productGasMoles: 2,
  },
} as const;

export type ChangeDirection = "increase" | "decrease" | "none";

export type DisturbanceType =
  | "temperature"
  | "volume"
  | "pressure"
  | "concentration"
  | "inertGas"
  | "catalyst";

export type ShiftDirection = "reactants" | "products" | "none";

export type SpeciesSide = "reactant" | "product";

export type Disturbance = {
  type: DisturbanceType;
  label: string;
  direction: ChangeDirection;
  species?: string;
  speciesSide?: SpeciesSide;
};

export const getChangeDirection = (newValue: number, oldValue: number): ChangeDirection => {
  
  if (newValue > oldValue) {
    return "increase";
  }

  if (newValue < oldValue) {
    return "decrease";
  }

  return "none";
};

export const getShiftDirection = (reaction: (typeof REACTIONS)[keyof typeof REACTIONS], disturbance: Disturbance | null): ShiftDirection => {
  if (disturbance === null) {
    return "none";
  }

  if (disturbance.direction === "none") {
    return "none";
  }

  if (disturbance.type === "catalyst") {
    return "none";
  }

  if (disturbance.type === "inertGas") {
    return "none";
  }

  if (disturbance.type === "temperature") {
    if (reaction.thermalType === "thermoneutral") {
      return "none";
    }

    if (reaction.thermalType === "exothermic") {
      return disturbance.direction === "increase" ? "reactants" : "products";
    }

    if (reaction.thermalType === "endothermic") {
      return disturbance.direction === "increase" ? "products" : "reactants";
    }
  }

  if (disturbance.type === "pressure") {
    if (reaction.reactantGasMoles === reaction.productGasMoles) {
      return "none";
    }

    const fewerGasMolesSide = reaction.reactantGasMoles < reaction.productGasMoles ? "reactants" : "products";
    const moreGasMolesSide = reaction.reactantGasMoles > reaction.productGasMoles ? "reactants" : "products";

    return disturbance.direction === "increase" ? fewerGasMolesSide : moreGasMolesSide;
  }

  if (disturbance.type === "volume") {
    if (reaction.reactantGasMoles === reaction.productGasMoles) {
      return "none";
    }

    const fewerGasMolesSide = reaction.reactantGasMoles < reaction.productGasMoles ? "reactants" : "products";
    const moreGasMolesSide = reaction.reactantGasMoles > reaction.productGasMoles ? "reactants" : "products";

    return disturbance.direction === "increase" ? moreGasMolesSide : fewerGasMolesSide;
  }

  if (disturbance.type === "concentration") {
    if (disturbance.speciesSide === "reactant") {
      return disturbance.direction === "increase" ? "products" : "reactants";
    }

    if (disturbance.speciesSide === "product") {
      return disturbance.direction === "increase" ? "reactants" : "products";
    }
  }

  return "none";
};

export const getSpeciesResponseDirection = (shiftDirection: ShiftDirection, speciesSide: SpeciesSide): ChangeDirection => {
  if (shiftDirection === "none") {
    return "none";
  }

  if (shiftDirection === "products") {
    return speciesSide === "product" ? "increase" : "decrease";
  }

  if (shiftDirection === "reactants") {
    return speciesSide === "reactant" ? "increase" : "decrease";
  }

  return "none";
}; 


const CONCENTRATION_RESPONSE_DELTA = 0.3;

const clampConcentration = (value: number): number => {
  const clampedValue = Math.max(0, Math.min(3, value));

  return Math.round(clampedValue * 10) / 10;
};

export const calculateReestablishedConcentrations = (reaction: (typeof REACTIONS)[keyof typeof REACTIONS], currentConcentrations: Record<string, number>, shiftDirection: ShiftDirection): Record<string, number> => {
  const nextConcentrations: Record<string, number> = {
    ...currentConcentrations,
  };

  if (shiftDirection === "none") {
    return nextConcentrations;
  }

  const reactantChange = shiftDirection === "reactants" ? CONCENTRATION_RESPONSE_DELTA : -CONCENTRATION_RESPONSE_DELTA;

  const productChange = shiftDirection === "products" ? CONCENTRATION_RESPONSE_DELTA : -CONCENTRATION_RESPONSE_DELTA;

  reaction.reactants.forEach((reactant) => {
    const currentValue = currentConcentrations[reactant] ?? 0;

    nextConcentrations[reactant] = clampConcentration(
      currentValue + reactantChange
    );
  });

  reaction.products.forEach((product) => {
    const currentValue = currentConcentrations[product] ?? 0;

    nextConcentrations[product] = clampConcentration(
      currentValue + productChange
    );
  });

  return nextConcentrations;
};

const INITIAL_EQUILIBRIUM_REACTANT_DROP = 0.3;
const INITIAL_EQUILIBRIUM_PRODUCT_GAIN = 0.6;

export const calculateInitialEquilibriumConcentrations = (reaction: (typeof REACTIONS)[keyof typeof REACTIONS], startingConcentrations: Record<string, number>): Record<string, number> => {
  const equilibriumConcentrations: Record<string, number> = {
    ...startingConcentrations,
  };

  reaction.reactants.forEach((reactant) => {
    const currentValue = startingConcentrations[reactant] ?? 0;

    equilibriumConcentrations[reactant] = clampConcentration(
      currentValue - INITIAL_EQUILIBRIUM_REACTANT_DROP
    );
  });

  reaction.products.forEach((product) => {
    const currentValue = startingConcentrations[product] ?? 0;

    equilibriumConcentrations[product] = clampConcentration(
      currentValue + INITIAL_EQUILIBRIUM_PRODUCT_GAIN
    );
  });

  return equilibriumConcentrations;
};


