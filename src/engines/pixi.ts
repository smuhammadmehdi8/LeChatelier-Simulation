import { Application, Graphics, Text, Ticker } from "pixi.js";

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

    const warningText = new Text({
        text: "WARNING: CONTAINER RUPTURED",
        style: {
            fontFamily: 'Trebuchet MS',
            fontSize: 22,
            fill: 0xFF0000,
            fontWeight: 'bold',
            align: 'center'
        }
    });
    warningText.x = 200 - warningText.width / 2; 
    warningText.y = 250;
    warningText.visible = false;
    app.stage.addChild(warningText);

    container.appendChild(app.canvas);
    

    return { app, pistonLid, warningText };
};


let isExploded: boolean = false;
let explodeTicker: (ticker: Ticker) => void;

export const updateSimulation = (app:Application, volume: number, pressure: number, piston: Graphics, warning: Text) => {
    if (pressure > 50) {
        if (!isExploded) {
            isExploded = true;
            warning.visible = true;

            explodeTicker = (ticker) => {
                piston.y -= 4 * ticker.deltaTime;

                if (piston.y < -300) {
                    app.ticker.remove(explodeTicker);
                }
            };
            app.ticker.add(explodeTicker);
        }
        return;
    }

    warning.visible = false;

    const minVol = 0.1; const maxVol = 2.0;
    const topY = 50;
    const bottomY = 460;

    const volumePercentage = (volume - minVol) / (maxVol - minVol)
    piston.y = bottomY - (volumePercentage * (bottomY - topY));
};