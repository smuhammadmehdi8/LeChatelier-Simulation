# LeChatelier-Simulation

  
## Requirements

  Clone the repo and install dependencies:

  ```bash 
  git clone https://github.com/smuhammadmehdi8/LeChatelier-Simulation.git
  cd LeChatelier-Simulation
  npm install
  ```

## Usage 

  ```bash 
  npm run dev
  ```

## Software Requirements Specification (SRS):

  - Equilibarium is defined as when the rates of the forward and reverse reactions are equal

  - User selects one of the pre-defined reactions, and the system establishes equilibrium over a time frame
  - The reaction rates are shown as speed (as particles jump back and forth) as they slowly settle into equilibrium
  - Molecules bounce around until equilibrium is established (i.e 50 molecules on one side and 30 molecues on the other until both no longer change by more than 2-3 units (implying equilibrium))
  - The user can select some options to “disrupt” equilibrium:	
    - Change in:
      - Temp
      - Pressure
      - Concentration/moles
      - Volume
    - Adding of (which does nothing to equilibrium):
        - Inert gases
        - Catalysts 
  - IDEAL GAS LAW: PV = nRT
  - An arrow that shows which way adding a "disrupter" will cause the system to shift in order to reestablish equilibrium
  - Graph which shows the concentrations as they slowly increase/decrease into equilibrium
  - Different catalysts that speed up the reaction in different ways
  - Different molecule sizes to display effect of mass on molecule speed, thus affecting equilibrium; for example, how the temperature affects the velocities of those particles, thus affecting the overall reaction (collision theory) --> effects if activaiton energy has been reached
    - At a constant temperature, heavier molecules move slower than lighter ones.

  - Important aspects considered when building application:
    - The sliders for volume and pressure MUST be interlocked due to the nature of gas law

## Tech stack:

  - React with Typescript
  - CSS 
  - PixiJS
  - Vite as the build tool
