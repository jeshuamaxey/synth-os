PROMPTING

Please use the following libraries when building out UI code:
- shadcn/ui: this is installed. Please use the docs (https://ui.shadcn.com/docs/components) to identify which `npx shadcn@latest add COMPONENT_NAME` commands to run
- tailwindcss v4: (this is already setup in the project)
- lucide icons: https://lucide.dev/icons/



Main UI

A row of inputs: 4x pads (left aligned) and 4x vertical sliders (right aligned)
Below, a keyboard spanning 2 octaves


Functional requirements:

User can select a vibe from a drop down of options or enter free text
When vibe is changed, [generate instrument] is presented. Hitting generate instrument generates a new SFX from 11labs which becomes the keyboard base audio (middle C)
Hitting the keys of the keyboard plays the base audio, pitched shifted by the appropriate number of tones

VibeShifterAudio class

methods:

play key