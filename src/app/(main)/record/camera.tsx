import { useRouter, useLocalSearchParams } from "expo-router";

import { CameraCapture } from "@/components/CameraCapture";

/**
 * Camera-first entry point. Kept as a route so the member screen's FAB can go
 * straight to the camera. The photo is handed to the form via a param.
 */
export default function CameraScreen() {
  const router = useRouter();
  const { memberId } = useLocalSearchParams<{ memberId: string }>();

  return (
    <CameraCapture
      visible
      title="Take photo"
      onClose={() =>
        router.replace({
          pathname: "/(main)/record/new",
          params: { memberId: memberId ?? "" },
        })
      }
      onCaptured={(uri) =>
        router.replace({
          pathname: "/(main)/record/new",
          params: { memberId: memberId ?? "", photoUri: uri },
        })
      }
    />
  );
}
