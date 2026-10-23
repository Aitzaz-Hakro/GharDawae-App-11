import { useEffect, useState } from "react";
import { Keyboard } from "react-native";

/**
 * Tracks keyboard visibility so a screen can offer an explicit way out (a Done
 * affordance) without measuring heights itself.
 */
export function useKeyboardVisible(): boolean {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => setVisible(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return visible;
}
