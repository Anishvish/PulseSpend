import { createContext, PropsWithChildren, useCallback, useContext, useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { GlassCard } from "@/components/GlassCard";
import { useAppTheme } from "@/theme/ThemeProvider";

type DialogAction = {
  label: string;
  onPress?: () => void | Promise<void>;
  variant?: "primary" | "secondary" | "danger";
};

type DialogState = {
  visible: boolean;
  title: string;
  message: string;
  actions: DialogAction[];
};

type DialogContextValue = {
  showDialog: (title: string, message: string, actions?: DialogAction[]) => void;
  hideDialog: () => void;
};

const DialogContext = createContext<DialogContextValue | null>(null);

const defaultAction: DialogAction = {
  label: "OK",
  variant: "primary",
};

export function DialogProvider({ children }: PropsWithChildren) {
  const theme = useAppTheme();
  const [dialog, setDialog] = useState<DialogState>({
    visible: false,
    title: "",
    message: "",
    actions: [],
  });

  const hideDialog = useCallback(() => {
    setDialog((current) => ({ ...current, visible: false }));
  }, []);

  const showDialog = useCallback((title: string, message: string, actions?: DialogAction[]) => {
    setDialog({
      visible: true,
      title,
      message,
      actions: actions?.length ? actions : [defaultAction],
    });
  }, []);

  const value = useMemo(
    () => ({
      showDialog,
      hideDialog,
    }),
    [showDialog, hideDialog]
  );

  return (
    <DialogContext.Provider value={value}>
      {children}
      <Modal transparent visible={dialog.visible} animationType="fade" onRequestClose={hideDialog}>
        <View style={styles.backdrop}>
          <GlassCard style={styles.card}>
            <Text style={[styles.title, { color: theme.colors.text }]}>{dialog.title}</Text>
            <Text style={[styles.message, { color: theme.colors.textMuted }]}>{dialog.message}</Text>
            <View style={styles.actions}>
              {dialog.actions.map((action) => {
                const isPrimary = action.variant !== "secondary";
                const backgroundColor =
                  action.variant === "danger"
                    ? theme.colors.danger
                    : isPrimary
                      ? theme.colors.accent
                      : "rgba(255,255,255,0.06)";
                const color = action.variant === "secondary" ? theme.colors.text : "#08111E";

                return (
                  <Pressable
                    key={action.label}
                    style={[styles.button, { backgroundColor }]}
                    onPress={async () => {
                      hideDialog();
                      await action.onPress?.();
                    }}
                  >
                    <Text style={[styles.buttonText, { color }]}>{action.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </GlassCard>
        </View>
      </Modal>
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error("useDialog must be used inside DialogProvider");
  }

  return context;
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(4, 10, 18, 0.72)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
  },
  message: {
    fontSize: 15,
    lineHeight: 23,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
  },
  button: {
    minWidth: 92,
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: {
    fontSize: 14,
    fontWeight: "800",
  },
});
