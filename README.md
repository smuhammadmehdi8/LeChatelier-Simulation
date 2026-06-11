# LeChatelier-Simulation

## Offical Link
  **You can view the simulation on lechateliersim.com.**

  
## Requirements

  Clone the repo and install dependencies:
    - nodejs must be previously downloaded

  ```bash 
  git clone https://github.com/smuhammadmehdi8/LeChatelier-Simulation.git
  cd LeChatelier-Simulation
  npm install
  ```

**⚠️ IMPORANT:** NodeJS must be downloaded previously.

**Note:** If npm install isn't working, make sure your in the Command prompt terminal profile



## Usage 

  ```bash 
  npm run dev
  ```

## Software Requirements Specification (SRS):

  - Equilibarium is defined as when no more reactants and products are being formed.

  - User selects one of the pre-defined reactions, and the system establishes equilibrium over a time frame, 1500 seconds for a regular timeframe, and 600 seconds for when        the cataylst checkbox has been checked.
  - Product and reactant concentrations and particle numbers change as equilibarium is reestablished.
  - The user can select some options to “disrupt” equilibrium:	
    - Change in:
      - Temp
      - Pressure
      - Concentration/moles
      - Volume
      - Adding of (which does nothing to equilibrium):
        - Inert gases (when volume is constant)
        - Catalysts 
  - IDEAL GAS LAW: PV = nRT
  - Text that indicates which way adding a "disrupter" will cause the system to shift in order to reestablish equilibrium.
  - Graph which shows the concentrations as they slowly increase/decrease into equilibrium (not added yet)
  - Temperature affects particle speeds.

  - Important aspects considered when building application:
    - The sliders for volume and pressure MUST be interlocked due to the nature of gas law

## Tech stack:

  - React with Typescript
  - CSS 
  - PixiJS
  - Vite as the build tool
