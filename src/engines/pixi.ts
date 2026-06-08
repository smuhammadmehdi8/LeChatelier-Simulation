import { Application, Graphics } from "pixi.js";

export const initSimulation = async (container : HTMLDivElement) => {
    const app = new Application();
    await app.init({
        width: 400,
        height: 500,
        backgroundColor: 0xffffff, 
        antialias: true,
    });

    const containerWalls = new Graphics();
    containerWalls.rect(0, 50, 20, 450).fill({color: 0xBDC3C7}); //;eft wall
    containerWalls.rect(380, 50, 20, 450).fill({color: 0xBDC3C7}); //right wall 
    containerWalls.rect(0, 480, 400, 20).fill({color: 0xBDC3C7}); //bottom wall
    app.stage.addChild(containerWalls);

    const pistonLid = new Graphics();

    pistonLid.rect(20, 0, 360, 20).fill({color: 0x2C3E50});
    pistonLid.rect(190, -100, 20, 100).fill({color: 0x7F8C8D}); 
    pistonLid.rect(150, -120, 100, 20).fill({color: 0x2C3E50}); 
    pistonLid.y = 50;
    app.stage.addChild(pistonLid);

    container.appendChild(app.canvas);
    

    return { app, pistonLid };
};

//function calculates piston position
export const updateSimulation = (volume: number, piston: Graphics) => {

    const minVol = 0.1; 
    const maxVol = 2.0;

    const topY = 50;
    const bottomY = 460;

    const volumePercentage = (volume - minVol) / (maxVol - minVol)
    piston.y = bottomY - (volumePercentage * (bottomY - topY));
};