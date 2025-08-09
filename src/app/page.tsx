import VibeShifterTerminal from "@/components/vibe-shifter/terminal";
import { VibeShifterProvider } from "@/providers/vibe-shifter-provider";

const VibeShifterPage = () => {
  return (
    <VibeShifterProvider>
      <VibeShifterTerminal />
    </VibeShifterProvider>
  );
};

export default VibeShifterPage;