import { useState, useEffect, useCallback } from "react";
import { Platform } from "react-native";
import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  PurchasesOffering,
  LOG_LEVEL,
} from "react-native-purchases";
import { getApiUrl } from "@/lib/query-client";
import { getAuthToken } from "@/lib/auth-token";

const REVENUECAT_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY || "";
const ENTITLEMENT_ID = "premium";
const isTestKey = REVENUECAT_API_KEY.startsWith("test_");

let isConfigured = false;
let configFailed = false;

export async function configureRevenueCat(userId?: string) {
  if (isConfigured || configFailed) return;
  if (!REVENUECAT_API_KEY) {
    console.warn("RevenueCat API key not configured");
    configFailed = true;
    return;
  }

  try {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    Purchases.configure({
      apiKey: REVENUECAT_API_KEY,
      appUserID: userId || undefined,
    });
    isConfigured = true;
  } catch (err) {
    console.warn("RevenueCat: Configuration issue (non-blocking):", err);
    configFailed = true;
  }
}

export async function identifyRevenueCatUser(userId: string) {
  if (configFailed) return;
  if (!isConfigured) {
    await configureRevenueCat(userId);
    return;
  }
  try {
    await Purchases.logIn(userId);
  } catch (err: any) {
    console.warn("RevenueCat: User identification issue (non-blocking):", err?.message || err);
  }
}

export function useRevenueCat() {
  const [offerings, setOfferings] = useState<PurchasesOffering | null>(null);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSubscribed = customerInfo
    ? typeof customerInfo.entitlements?.active?.[ENTITLEMENT_ID] !== "undefined"
    : false;

  const loadOfferings = useCallback(async () => {
    if (!isConfigured) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const offeringsResult = await Purchases.getOfferings();
      if (offeringsResult.current) {
        setOfferings(offeringsResult.current);
      }

      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
    } catch (err: any) {
      console.warn("RevenueCat: Could not load offerings (non-blocking):", err?.message || err);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOfferings();
  }, [loadOfferings]);

  const purchasePackage = useCallback(
    async (pkg: PurchasesPackage): Promise<boolean> => {
      try {
        setIsPurchasing(true);
        setError(null);

        const { customerInfo: updatedInfo } =
          await Purchases.purchasePackage(pkg);
        setCustomerInfo(updatedInfo);

        const nowSubscribed =
          typeof updatedInfo.entitlements?.active?.[ENTITLEMENT_ID] !==
          "undefined";

        if (nowSubscribed) {
          await syncSubscriptionToBackend("active");
        }

        return nowSubscribed;
      } catch (err: any) {
        if (err.userCancelled) {
          return false;
        }
        console.warn("RevenueCat: Purchase issue:", err?.message || err);
        setError(err.message || "Purchase failed. Please try again.");
        return false;
      } finally {
        setIsPurchasing(false);
      }
    },
    [],
  );

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    try {
      setIsPurchasing(true);
      setError(null);

      const info = await Purchases.restorePurchases();
      setCustomerInfo(info);

      const nowSubscribed =
        typeof info.entitlements?.active?.[ENTITLEMENT_ID] !== "undefined";

      if (nowSubscribed) {
        await syncSubscriptionToBackend("active");
      }

      return nowSubscribed;
    } catch (err: any) {
      console.warn("RevenueCat: Restore issue:", err?.message || err);
      setError(err.message || "Failed to restore purchases. Please try again.");
      return false;
    } finally {
      setIsPurchasing(false);
    }
  }, []);

  return {
    offerings,
    customerInfo,
    isSubscribed,
    isLoading,
    isPurchasing,
    error,
    purchasePackage,
    restorePurchases,
    refresh: loadOfferings,
  };
}

async function syncSubscriptionToBackend(status: string) {
  try {
    const token = await getAuthToken();
    if (!token) return;

    const baseUrl = getApiUrl();
    const url = new URL("/api/auth/subscription", baseUrl);
    await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ subscriptionStatus: status }),
    });
  } catch (err) {
    console.warn("RevenueCat: Could not sync subscription to backend");
  }
}
