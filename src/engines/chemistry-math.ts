export type ThermalType = "exothermic" | "endothermic" | "thermoneutral";

export type ReactionInfo = {
  label: string;
  thermalType: ThermalType;
  reactants: readonly string[];
  products: readonly string[];
  reactantCoefficients: Record<string, number>;
  productCoefficients: Record<string, number>;
  reactantGasMoles: number;
  productGasMoles: number;
};


export const REACTIONS = {
  exo: {
    label: "Exothermic: N₂ + 3H₂ ⇌ 2NH₃",
    thermalType: "exothermic",
    reactants: ["N₂", "H₂"],
    products: ["NH₃"],
    reactantCoefficients: {
      "N₂": 1,
      "H₂": 3,
    },
    productCoefficients: {
      "NH₃": 2,
    },
    reactantGasMoles: 4,
    productGasMoles: 2,
  },
  endo: {
    label: "Endothermic: N₂O₄ ⇌ 2NO₂",
    thermalType: "endothermic",
    reactants: ["N₂O₄"],
    products: ["NO₂"],
    reactantCoefficients: {
      "N₂O₄": 1,
    },
    productCoefficients: {
      "NO₂": 2,
    },
    reactantGasMoles: 1,
    productGasMoles: 2,
  },
  equi: {
    label: "Equimolar / No Heat Effect: H₂ + I₂ ⇌ 2HI",
    thermalType: "thermoneutral",
    reactants: ["H₂", "I₂"],
    products: ["HI"],
    reactantCoefficients: {
      "H₂": 1,
      "I₂": 1,
    },
    productCoefficients: {
      "HI": 2,
    },
    reactantGasMoles: 2,
    productGasMoles: 2,
  },
} as const satisfies Record<string, ReactionInfo>;




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

export const getShiftDirection = (reaction: ReactionInfo, disturbance: Disturbance | null): ShiftDirection => {
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


const CONCENTRATION_MIN = 0;
const CONCENTRATION_MAX = 3;

const INITIAL_REACTION_EXTENT = 0.2;
const REESTABLISHMENT_REACTION_EXTENT = 0.1;

const clampConcentration = (value: number): number => {
  const clampedValue = Math.max(
    CONCENTRATION_MIN,
    Math.min(CONCENTRATION_MAX, value)
  );

  return Math.round(clampedValue * 10) / 10;
};

const applyReactionExtent = (reaction: ReactionInfo, currentConcentrations: Record<string, number>, shiftDirection: ShiftDirection, reactionExtent: number): Record<string, number> => {
  const nextConcentrations: Record<string, number> = {
    ...currentConcentrations,
  };

  if (shiftDirection === "none") {
    return nextConcentrations;
  }

  const shiftingTowardProducts = shiftDirection === "products";

  reaction.reactants.forEach((reactant) => {
    const currentValue = currentConcentrations[reactant] ?? 0;
    const coefficient = reaction.reactantCoefficients[reactant] ?? 1;

    const changeAmount = coefficient * reactionExtent;

    nextConcentrations[reactant] = clampConcentration(shiftingTowardProducts ? currentValue - changeAmount : currentValue + changeAmount);
  });

  reaction.products.forEach((product) => {
    const currentValue = currentConcentrations[product] ?? 0;
    const coefficient = reaction.productCoefficients[product] ?? 1;

    const changeAmount = coefficient * reactionExtent;

    nextConcentrations[product] = clampConcentration(shiftingTowardProducts ? currentValue + changeAmount : currentValue - changeAmount);
  });

  return nextConcentrations;
};

export const calculateInitialEquilibriumConcentrations = (reaction: ReactionInfo, startingConcentrations: Record<string, number>): Record<string, number> => {
  return applyReactionExtent(
    reaction,
    startingConcentrations,
    "products",
    INITIAL_REACTION_EXTENT
  );
};

export const calculateReestablishedConcentrations = (reaction: ReactionInfo, currentConcentrations: Record<string, number>, shiftDirection: ShiftDirection): Record<string, number> => {
  return applyReactionExtent(
    reaction,
    currentConcentrations,
    shiftDirection,
    REESTABLISHMENT_REACTION_EXTENT
  );
};


