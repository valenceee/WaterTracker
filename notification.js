import * as Notifications from "expo-notifications";
export const isBlackoutHour = (hour) => hour >= BLACKOUT_START && hour < BLACKOUT_END;

const BLACKOUT_START = 4; // 4:00 AM
const BLACKOUT_END = 8;   // 8:00 AM 

const isBlackoutHour = (hour) => hour >= BLACKOUT_START && hour < BLACKOUT_END;


Notifications.setNotificationHandler({
  handleNotification: async () => {
    const blocked = isBlackoutHour(new Date().getHours());
    return {
      shouldShowAlert: !blocked,
      shouldShowBanner: !blocked,
      shouldShowList: !blocked,
      shouldPlaySound: !blocked,
      shouldSetBadge: false,
    };
  },
});

export async function scheduleTimeWindowNotifications() {
  if (isBlackoutHour(new Date().getHours())) {
    console.log("Blackout hours (4-8 AM): scheduling skipped");
    return;
  }

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") {
    alert("Notification permission not granted");
    return;
  }

  await Notifications.cancelAllScheduledNotificationsAsync();

  const START = 8 * 60;
  const END = 24 * 60 + 3 * 60 + 30;
  const STEP = 90;

  for (let t = START; t <= END; t += STEP) {
    const minutesInDay = t % (24 * 60);
    const hour = Math.floor(minutesInDay / 60);
    const minute = minutesInDay % 60;

    if (isBlackoutHour(hour)) continue;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Reminder",
        body: `It's ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour,
        minute,
      },
    });
  }
}

