/**
 * Guarded access to `expo-audio`.
 *
 * `expo-audio` is a native module. A JS-only reload on a development build
 * created before it was added throws "Cannot find native module 'ExpoAudio'"
 * while Expo Router validates the route tree — which means the whole app fails
 * to boot, not just the mic feature.
 *
 * Loading it inside a try/catch keeps the app usable: the assistant still reads
 * text and photos, and the mic reports that it is unavailable until the dev
 * build is regenerated.
 */
type AudioModuleType = typeof import("expo-audio");

let audio: AudioModuleType | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  audio = require("expo-audio") as AudioModuleType;
} catch {
  audio = null;
}

export const isAudioAvailable = audio != null;

export const RecordingPresets =
  audio?.RecordingPresets ?? ({ HIGH_QUALITY: {} } as any);

export const AudioModule =
  audio?.AudioModule ??
  ({
    requestRecordingPermissionsAsync: async () => ({ granted: false }),
  } as any);

export const setAudioModeAsync: (...args: any[]) => Promise<void> =
  audio?.setAudioModeAsync ?? (async () => {});

const dummyRecorder = {
  isRecording: false,
  uri: null as string | null,
  stop: async () => {},
  prepareToRecordAsync: async () => {},
  record: () => {},
};

const useRecorderImpl: (preset: any) => any =
  audio?.useAudioRecorder ?? (() => dummyRecorder);

const useRecorderStateImpl: (recorder: any) => any =
  audio?.useAudioRecorderState ?? (() => ({ isRecording: false }));

export function useAudioRecorder(preset: any): any {
  return useRecorderImpl(preset);
}

export function useAudioRecorderState(recorder: any): any {
  return useRecorderStateImpl(recorder);
}
