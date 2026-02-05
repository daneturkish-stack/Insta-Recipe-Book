import { useEffect, useRef, useCallback } from "react";
import { Platform } from "react-native";
import { Accelerometer } from "expo-sensors";
import * as Haptics from "expo-haptics";

const SHAKE_THRESHOLD = 1.8;
const SHAKE_TIMEOUT = 1000;
const MIN_SHAKES_REQUIRED = 2;

interface UseShakeDetectorOptions {
  onShake: () => void;
  enabled?: boolean;
}

export function useShakeDetector({ onShake, enabled = true }: UseShakeDetectorOptions) {
  const lastShakeTime = useRef(0);
  const shakeCount = useRef(0);
  const lastUpdate = useRef(0);
  const lastX = useRef(0);
  const lastY = useRef(0);
  const lastZ = useRef(0);

  const handleShake = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onShake();
  }, [onShake]);

  useEffect(() => {
    if (!enabled) return;
    
    // Accelerometer is not fully supported on web platform
    if (Platform.OS === "web") return;

    let subscription: ReturnType<typeof Accelerometer.addListener> | null = null;

    const setupAccelerometer = async () => {
      try {
        const isAvailable = await Accelerometer.isAvailableAsync();
        if (!isAvailable) return;

        const { status } = await Accelerometer.requestPermissionsAsync();
        if (status !== "granted") return;

        Accelerometer.setUpdateInterval(100);

        subscription = Accelerometer.addListener((data) => {
          const { x, y, z } = data;
          const currentTime = Date.now();

          if (currentTime - lastUpdate.current > 100) {
            const diffTime = currentTime - lastUpdate.current;
            lastUpdate.current = currentTime;

            const deltaX = Math.abs(x - lastX.current);
            const deltaY = Math.abs(y - lastY.current);
            const deltaZ = Math.abs(z - lastZ.current);

            const acceleration = (deltaX + deltaY + deltaZ) / diffTime * 10000;

            if (acceleration > SHAKE_THRESHOLD) {
              if (currentTime - lastShakeTime.current > SHAKE_TIMEOUT) {
                shakeCount.current = 0;
              }
              
              shakeCount.current += 1;
              lastShakeTime.current = currentTime;

              if (shakeCount.current >= MIN_SHAKES_REQUIRED) {
                shakeCount.current = 0;
                handleShake();
              }
            }

            lastX.current = x;
            lastY.current = y;
            lastZ.current = z;
          }
        });
      } catch (error) {
        // Silently fail if accelerometer is not available (e.g., web platform)
        console.log("Shake detection not available on this platform");
      }
    };

    setupAccelerometer();

    return () => {
      subscription?.remove();
    };
  }, [enabled, handleShake]);
}
