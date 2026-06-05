//PV = nRT
// P = (nRT)/V
// V = (nRT) / P




const R = 0.08206; //unit: L*atm / (mol*K)

export const calculatePressure = (volumeL: number, tempK: number, totalMoles: number) : number => {
    if (volumeL <= 0) {
        return 0;
    }
    const pressure = (totalMoles*R*tempK) / (volumeL);
    
    return Math.round(pressure * 100) / 100;
}

export const calculateVolume = (pressureATM: number, tempK: number, totalMoles: number) : number => {
    if (pressureATM <= 0) {
        return 0;
    }
    const volume = (totalMoles*R*tempK) / (pressureATM);
    
    return Math.round(volume * 100) / 100;
}
