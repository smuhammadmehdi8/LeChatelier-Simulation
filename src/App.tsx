import {useEffect, useRef} from 'react';
import * as pixi from 'pixi.js';
import {Application} from 'pixi.js';
import "./index.css"




function App() {

  const pixiContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async() => {
  
    const app = new Application();
    await app.init(
      {
        //resizeTo: window,
        width: 1000,
        height: 500,
        backgroundColor: 0x1e2a38,
        backgroundAlpha: 0.5,
        antialias: true
      }

    ); 

    pixiContainerRef.current?.appendChild(app.canvas);

    /*
    if (pixiContainerRef.current) {
      pixiContainerRef.current.appendChild(app.canvas);
    } */

})();




    console.log("div ready for pixijs");
  }, []); 


  return (



    <div> 
      <h1>LeChatelier Simulation</h1>

      <div ref={pixiContainerRef}></div>
      
    </div>



      
  )


}

export default App
