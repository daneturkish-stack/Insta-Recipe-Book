import { useEffect, useRef, useCallback } from "react";
import { Platform } from "react-native";
import { Accelerometer } from "expo-sensors";
import * as Haptics from "expo-haptics";

const SHAKE_THRESHOLD = 2.5;
const SHAKE_TIMEOUT = 800;
const MIN_SHAKES_REQUIRED = 3;
const COOLDOWN_MS = 2000;

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
  const lastTriggerTime = useRef(0);

  const handleShake = useCallback(() => {
    const now = Date.now();
    if (now - lastTriggerTime.current < COOLDOWN_MS) return;
    lastTriggerTime.current = now;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onShake();
  }, [onShake]);

  useEffect(() => {
    if (!enabled) return;
    
    if (Platform.OS === "web") return;

    let subscription: ReturnType<typeof Accelerometer.addListener> | null = null;

    const setupAccelerometer = async () => {
      try {
        const isAvailable = await Accelerometer.isAvailableAsync();
        if (!isAvailable) return;

        const { status } = await Accelerometer.requestPermissionsAsync();
        if (status !== "granted") return;

        Accelerometer.setUpdateInterval(80);

        subscription = Accelerometer.addListener((data) => {
          const { x, y, z } = data;
          const currentTime = Date.now();

          if (currentTime - lastUpdate.current > 80) {
            lastUpdate.current = currentTime;

            const deltaX = Math.abs(x - lastX.current);
            const deltaY = Math.abs(y - lastY.current);
            const deltaZ = Math.abs(z - lastZ.current);

            const totalDelta = deltaX + deltaY + deltaZ;

            if (totalDelta > SHAKE_THRESHOLD) {
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
        console.log("Shake detection not available on this platform");
      }
    };

    setupAccelerometer();

    return () => {
      subscription?.remove();
    };
  }, [enabled, handleShake]);
}
