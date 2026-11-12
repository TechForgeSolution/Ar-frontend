import * as Updates from "expo-updates";
import { useEffect, useState } from "react";
import { Alert } from "react-native";

export function useOTAUpdate() {
  const [isChecking, setIsChecking] = useState(false);

  const checkForUpdate = async () => {
    if (__DEV__) return; // Pas d'OTA en dev

    try {
      setIsChecking(true);
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
        Alert.alert(
          "Mise à jour disponible",
          "Une nouvelle version a été téléchargée. L'app va redémarrer.",
          [
            {
              text: "Redémarrer",
              onPress: async () => await Updates.reloadAsync(),
            },
          ]
        );
      }
    } catch (error) {
      console.error("Erreur OTA:", error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkForUpdate();
  }, []);

  return { isChecking, checkForUpdate };
}