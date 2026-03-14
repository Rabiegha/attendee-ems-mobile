/**
 * PrintStatusBanner
 *
 * Indicateur flottant persistant du statut d'impression.
 * Remplace les toasts pour offrir une transition fluide :
 *   📤 Envoi... → 🖨️ Impression en cours → ✅ Terminé / ❌ Échec
 *
 * Apparaît en bas de l'écran, s'auto-masque après succès.
 */

import React, { useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../theme/ThemeProvider";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import {
  selectPrintStatus,
  clearPrintStatus,
  PrintJobStatusType,
} from "../../store/printStatus.slice";

const AUTO_DISMISS_DELAY = 3000; // ms après COMPLETED
const PROGRESS_TIMEOUT_DELAY = 20000; // P3: timeout de sécurité pour SENDING/PENDING/PRINTING

interface StatusConfig {
  iconName: keyof typeof Ionicons.glyphMap;
  label: string;
  showSpinner: boolean;
}

const getStatusConfig = (
  status: PrintJobStatusType,
  attendeeName: string,
): StatusConfig => {
  switch (status) {
    case "SENDING":
    case "PENDING":
      return {
        iconName: "send-outline",
        label: attendeeName
          ? `Envoi du badge de ${attendeeName}...`
          : "Envoi...",
        showSpinner: true,
      };
    case "PRINTING":
      return {
        iconName: "print-outline",
        label: attendeeName
          ? `Impression : ${attendeeName}`
          : "Impression en cours...",
        showSpinner: true,
      };
    case "COMPLETED":
      return {
        iconName: "checkmark-circle",
        label: attendeeName
          ? `Badge imprimé : ${attendeeName}`
          : "Impression terminée",
        showSpinner: false,
      };
    case "FAILED":
      return {
        iconName: "alert-circle",
        label: attendeeName ? `Échec : ${attendeeName}` : "Échec d'impression",
        showSpinner: false,
      };
    case "CLIENT_OFFLINE":
      return {
        iconName: "cloud-offline-outline",
        label: attendeeName
          ? `EMS Client hors ligne — badge de ${attendeeName} en attente`
          : "EMS Client hors ligne — impression en attente",
        showSpinner: false,
      };
  }
};

export const PrintStatusBanner: React.FC = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const dispatch = useAppDispatch();
  const currentJob = useAppSelector(selectPrintStatus);

  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const isVisible = useRef(false);
  const autoDismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (autoDismissTimer.current) {
      clearTimeout(autoDismissTimer.current);
      autoDismissTimer.current = null;
    }
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      isVisible.current = false;
      dispatch(clearPrintStatus());
    });
  }, [dispatch, translateY, opacity]);

  const show = useCallback(() => {
    if (isVisible.current) return;
    isVisible.current = true;
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 60,
        friction: 8,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [translateY, opacity]);

  // Gérer l'affichage/masquage en fonction du statut
  useEffect(() => {
    if (autoDismissTimer.current) {
      clearTimeout(autoDismissTimer.current);
      autoDismissTimer.current = null;
    }

    if (currentJob) {
      show();

      // Auto-dismiss après COMPLETED ou CLIENT_OFFLINE (délai plus long pour offline)
      if (currentJob.status === "COMPLETED") {
        autoDismissTimer.current = setTimeout(() => {
          dismiss();
        }, AUTO_DISMISS_DELAY);
      } else if (currentJob.status === "CLIENT_OFFLINE") {
        autoDismissTimer.current = setTimeout(() => {
          dismiss();
        }, 6000);
      } else if (
        currentJob.status === "SENDING" ||
        currentJob.status === "PENDING" ||
        currentJob.status === "PRINTING"
      ) {
        // P3: Timeout de sécurité — si le WebSocket ne donne jamais de mise à jour,
        // on dismiss la bannière après 20s pour ne pas rester bloqué infiniment
        autoDismissTimer.current = setTimeout(() => {
          console.warn(
            "[PrintStatusBanner] ⚠️ Progress timeout for status:",
            currentJob.status,
          );
          dismiss();
        }, PROGRESS_TIMEOUT_DELAY);
      }
    } else if (isVisible.current) {
      dismiss();
    }

    return () => {
      if (autoDismissTimer.current) {
        clearTimeout(autoDismissTimer.current);
      }
    };
  }, [currentJob, show, dismiss]);

  if (!currentJob) return null;

  const config = getStatusConfig(currentJob.status, currentJob.attendeeName);

  const getBannerColors = () => {
    switch (currentJob.status) {
      case "SENDING":
      case "PENDING":
        return {
          bg: theme.colors.info[50],
          border: theme.colors.info[500],
          text: theme.colors.info[600],
          spinner: theme.colors.info[600],
        };
      case "PRINTING":
        return {
          bg: theme.colors.warning[50],
          border: theme.colors.warning[500],
          text: theme.colors.warning[700],
          spinner: theme.colors.warning[600],
        };
      case "COMPLETED":
        return {
          bg: theme.colors.success[50],
          border: theme.colors.success[500],
          text: theme.colors.success[700],
          spinner: theme.colors.success[600],
        };
      case "FAILED":
        return {
          bg: theme.colors.error[50],
          border: theme.colors.error[500],
          text: theme.colors.error[700],
          spinner: theme.colors.error[600],
        };
      case "CLIENT_OFFLINE":
        return {
          bg: theme.colors.warning[50],
          border: theme.colors.warning[500],
          text: theme.colors.warning[700],
          spinner: theme.colors.warning[600],
        };
    }
  };

  const colors = getBannerColors();

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          bottom: insets.bottom + 16,
          opacity,
          transform: [{ translateY }],
        },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        style={[
          styles.banner,
          {
            backgroundColor: colors.bg,
            borderColor: colors.border,
            borderRadius: theme.radius.xl,
          },
        ]}
        onPress={
          currentJob.status === "FAILED" ||
          currentJob.status === "COMPLETED" ||
          currentJob.status === "CLIENT_OFFLINE"
            ? dismiss
            : undefined
        }
        activeOpacity={0.9}
      >
        {/* Icône / Spinner */}
        <View style={styles.iconArea}>
          {config.showSpinner ? (
            <ActivityIndicator size="small" color={colors.spinner} />
          ) : (
            <Ionicons name={config.iconName} size={22} color={colors.text} />
          )}
        </View>

        {/* Texte principal */}
        <View style={styles.textArea}>
          <Text
            style={[
              styles.label,
              {
                color: colors.text,
                fontSize: theme.fontSize.sm,
                fontWeight: theme.fontWeight.semibold,
              },
            ]}
            numberOfLines={1}
          >
            {config.label}
          </Text>
          {currentJob.printerName && (
            <Text
              style={[
                styles.sublabel,
                {
                  color: colors.text,
                  fontSize: theme.fontSize.xs,
                  opacity: 0.7,
                },
              ]}
              numberOfLines={1}
            >
              {currentJob.printerName}
            </Text>
          )}
          {currentJob.status === "FAILED" && currentJob.error && (
            <Text
              style={[
                styles.sublabel,
                {
                  color: colors.text,
                  fontSize: theme.fontSize.xs,
                },
              ]}
              numberOfLines={2}
            >
              {currentJob.error}
            </Text>
          )}
        </View>

        {/* Bouton fermer pour FAILED */}
        {(currentJob.status === "FAILED" ||
          currentJob.status === "COMPLETED" ||
          currentJob.status === "CLIENT_OFFLINE") && (
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={dismiss}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[styles.closeIcon, { color: colors.text }]}>✕</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 20,
    right: 20,
    zIndex: 9998,
    alignItems: "center",
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
    minWidth: "100%",
  },
  iconArea: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  textArea: {
    flex: 1,
  },
  label: {
    lineHeight: 20,
  },
  sublabel: {
    lineHeight: 16,
    marginTop: 2,
  },
  closeBtn: {
    marginLeft: 12,
    padding: 4,
  },
  closeIcon: {
    fontSize: 14,
    fontWeight: "600",
  },
});
