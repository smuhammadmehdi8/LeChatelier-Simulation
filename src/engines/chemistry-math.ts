const R = 0.08206; //unit: L*atm / (mol*K)

export const calculatePressure = (volumeL: number, tempK: number, totalMoles: number) : number => {
    if (volumeL <= 0) {
        return 0;
    }
    const pressure = (totalMoles*R*tempK) / (volumeL);

    return Number(pressure.toFixed(2));
}

export const calculateVolume = (pressureATM: number, tempK: number, totalMoles: number) : number => {
    if (pressureATM <= 0) {
        return 0;
    }
    const volume = (totalMoles*R*tempK) / (pressureATM);
    
    return Number(volume.toFixed(2));
}

export const REACTIONS = {
  exo: {
    label: "Exothermic: N₂ + 3H₂ ⇌ 2NH₃",
    reactants: ["N2", "H2"],
    products: ["NH3"]
  },
  endo: {
    label: "Endothermic: N₂O₄ ⇌ 2NO₂",
    reactants: ["N2O4"],
    products: ["NO2"]
  },
  equi: {
    label: "Equimolar: H₂ + I₂ ⇌ 2HI",
    reactants: ["H2", "I2"],
    products: ["HI"]
  }
};

