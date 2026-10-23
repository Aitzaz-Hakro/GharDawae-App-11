import { useColorScheme } from 'react-native';

import { Colors } from './theme';

/**
 * Current-scheme palette. Use in screens:
 *   const c = useColors();
 *   const styles = makeStyles(c);
 * where `makeStyles` is `(c: ThemePalette) => StyleSheet.create({...})`.
 */
export type ThemePalette = { [K in keyof typeof Colors.light]: string };

export function useColors(): ThemePalette {
  const scheme = useColorScheme();
  return Colors[scheme === 'dark' ? 'dark' : 'light'];
}
