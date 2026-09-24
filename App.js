import { useEffect, useState } from "react";
import { View, Text, Modal, Alert, Pressable, Platform, StyleSheet } from "react-native";
import * as Notifications from "expo-notifications";
import {
  scheduleTimeWindowNotifications,
  scheduleTestNotification,
  isBlackoutHour,
} from "./notification";

const SNOOZE_SECONDS = 600;
const MAX_SKIPS = 3;

export default function App() {
  const [count, setCount] = useState(0);
  const [lastDrink, setLastDrink] = useState(null);
  const [logs, setLogs] = useState([]);
  const [snoozeVisible, setSnoozeVisible] = useState(false);
  const [skipsUsed, setSkipsUsed] = useState(0);

  useEffect(() => {
    scheduleTimeWindowNotifications();
  }, []);

  const handleDrink = () => {
    const now = new Date();
    setCount((c) => c + 1);
    setLastDrink(now);
    setLogs((prev) => [...prev, now]);
  };

  const handleSkip = async () => {
    if (skipsUsed < MAX_SKIPS) {
      setSkipsUsed(skipsUsed + 1);
      if (Platform.OS !== "web") {
        await Notifications.dismissAllNotificationsAsync();
      }
      setSnoozeVisible(true);
    }
  };

  const confirmSnooze = async () => {
    setSnoozeVisible(false);

    const fireAt = new Date(Date.now() + SNOOZE_SECONDS * 1000);
    if (isBlackoutHour(new Date().getHours()) || isBlackoutHour(fireAt.getHours())) {
      if (Platform.OS === "web") window.alert("Reminders are paused between 4 AM and 8 AM.");
      else Alert.alert("Snooze skipped", "Reminders are paused between 4 AM and 8 AM.");
      return;
    }

    if (Platform.OS === "web") {
      setTimeout(
        () => window.alert("Your 10-minute snooze is up. Drink water!"),
        SNOOZE_SECONDS * 1000
      );
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: { title: "Drink water", body: "Your 10-minute snooze is up." },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: SNOOZE_SECONDS,
        repeats: false,
      },
    });
  };

  const skipsMaxed = skipsUsed === MAX_SKIPS;
  const today = new Date().toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });


  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.date}>{today.toUpperCase()}</Text>
      <Text style={styles.title}>Water Tracker</Text>

      {/* Counter card */}
      <View style={styles.card}>
        <Text style={styles.count}>{count}</Text>
        <Text style={styles.label}>glasses today</Text>
        <Text style={styles.last}>
          {lastDrink
            ? `Last drink at ${lastDrink.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
              })}`
            : "No drinks logged yet"}
        </Text>
      </View>

      <View style={{ flex: 1 }} />

      <View style={styles.buttonRow}>
        <Pressable
          onPress={handleSkip}
          disabled={skipsMaxed}
          style={({ pressed }) => [
            styles.btn,
            styles.skipBtn,
            skipsMaxed && styles.skipBtnDisabled,
            pressed && !skipsMaxed && styles.pressed,
          ]}
        >
          <Text style={[styles.skipText, skipsMaxed && styles.skipTextDisabled]}>Skip</Text>
        </Pressable>

        <Pressable
          onPress={handleDrink}
          style={({ pressed }) => [styles.btn, styles.drinkBtn, pressed && styles.pressed]}
        >
          <Text style={styles.drinkText}>Drink</Text>
        </Pressable>
      </View>
      <Text style={styles.skipInfo}>
        {skipsMaxed ? "No skips left today" : `${skipsUsed} of ${MAX_SKIPS} skips used`}
      </Text>

      <Modal
        visible={snoozeVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSnoozeVisible(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.alert}>
            <View style={styles.alertBody}>
              <Text style={styles.alertTitle}>Snooze reminder?</Text>
              <Text style={styles.alertMsg}>Remind you again in 10 minutes?</Text>
            </View>
            <View style={styles.alertActions}>
              <Pressable
                style={({ pressed }) => [styles.alertBtn, pressed && styles.alertBtnPressed]}
                onPress={() => setSnoozeVisible(false)}
              >
                <Text style={styles.alertBtnText}>No thanks</Text>
              </Pressable>
              <View style={styles.alertDivider} />
              <Pressable
                style={({ pressed }) => [styles.alertBtn, pressed && styles.alertBtnPressed]}
                onPress={confirmSnooze}
              >
                <Text style={[styles.alertBtnText, styles.alertBtnBold]}>Snooze</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const OLIVE = "#606C38";
const FOREST = "#283618";
const CREAM = "#FEFAE0";
const BURNT = "#BC6C25";
const FADED = "#C9C6B4";
const HAIRLINE = "rgba(40,54,24,0.12)";

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 72,
    paddingBottom: 40,
    backgroundColor: CREAM,
  },

  // header
  date: { fontSize: 13, fontWeight: "600", color: OLIVE, letterSpacing: 0.5 },
  title: { fontSize: 34, fontWeight: "700", color: FOREST, marginBottom: 20 },

  // counter card
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: HAIRLINE,
  },
  count: { fontSize: 64, fontWeight: "700", color: FOREST },
  label: { fontSize: 17, color: OLIVE },
  last: { fontSize: 14, color: OLIVE, marginTop: 12 },

  // btns
  buttonRow: { flexDirection: "row", gap: 12 },
  btn: {
    flex: 1,
    height: 72,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.7 },

  // skip
  skipBtn: { borderWidth: 1.5, borderColor: BURNT, backgroundColor: "transparent" },
  skipBtnDisabled: { borderColor: FADED },
  skipText: { color: BURNT, fontSize: 20, fontWeight: "600" },
  skipTextDisabled: { color: FADED },

  // drink
  drinkBtn: { backgroundColor: FOREST },
  drinkText: { color: "#FFFFFF", fontSize: 20, fontWeight: "600" },

  skipInfo: { marginTop: 10, fontSize: 13, color: OLIVE, textAlign: "center" },

  // alert
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  alert: { width: 270, backgroundColor: "#FFFFFF", borderRadius: 14, overflow: "hidden" },
  alertBody: { padding: 20, alignItems: "center" },
  alertTitle: { fontSize: 17, fontWeight: "600", color: "#000", marginBottom: 4 },
  alertMsg: { fontSize: 13, color: "#000", textAlign: "center" },
  alertActions: {
    flexDirection: "row",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(60,60,67,0.3)",
  },
  alertBtn: { flex: 1, paddingVertical: 12, alignItems: "center" },
  alertBtnPressed: { backgroundColor: "rgba(0,0,0,0.06)" },
  alertBtnText: { fontSize: 17, color: BURNT },
  alertBtnBold: { fontWeight: "600" },
  alertDivider: { width: StyleSheet.hairlineWidth, backgroundColor: "rgba(60,60,67,0.3)" },
});