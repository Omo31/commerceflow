import { useRemoteConfig } from "@/firebase/provider";
import { getValue } from "firebase/remote-config";

export function useRemoteConfigValue(key: string) {
  const remoteConfig = useRemoteConfig();

  if (!remoteConfig) {
    return null;
  }

  return getValue(remoteConfig, key);
}
