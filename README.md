# LeChatelier-Simulation

  
## Requirements

  Clone the repo and install dependencies:

  ```bash 
  git clone https://github.com/smuhammadmehdi8/LeChatelier-Simulation.git
  ```


  














## Software Requirements Specification (SRS):

  - User selects one of the pre-defined reactions, and the system establishes equilibrium over a time frame
  - The reaction rates are shown as speed (as particles jump back and forth) as they slowly settle into equilibrium
  - Maybe particles which bounce around until equilibrium is established (i.e 50 on one side and 30 on the other and both no longer change by more than 2-3 units)
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
  - Maybe an arrow that show which way adding something will cause the system to shift to reestablish equilibrium
  - Graph which shows the concentrations as they slowly increase/decrease into equilibrium
  - Different catalysts? 
  - Different sizes molecules– because chem teachers want to show students the effect of mass on equilibrium, for example how the temperature affects the velocities of those particles, thus affecting the overall reaction -(because of collision theory)

  - Important things:
    - The sliders for volume and pressure MUST be interlocked because of the gas law

## Tech stack:

  - React with Typescript
  - CSS
  - Vite as the build tool
