import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true, // Deprecated but might be needed for older versions
        shouldShowBanner: true, // New standard
        shouldShowList: true,   // New standard
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

export const requestPermissions = async () => {
    try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        return finalStatus === 'granted';
    } catch (e) {
        console.warn("Permission Error:", e);
        return false;
    }
};

export const scheduleMealNotifications = async (wakeUpTimeStr) => {
    // Cancel all existing notifications first
    try {
        await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (e) {
        console.warn("Cancel Error:", e);
    }

    const [hours, minutes] = wakeUpTimeStr.split(':').map(Number);
    const now = new Date();
    const wakeUpDate = new Date();
    wakeUpDate.setHours(hours, minutes, 0, 0);

    const meals = [
        { id: 'breakfast', name: 'Kahvaltı 🥞', delayHours: 1 },
        { id: 'lunch', name: 'Öğle Yemeği 🥗', delayHours: 5 },
        { id: 'dinner', name: 'Akşam Yemeği 🍝', delayHours: 10 }
    ];

    const scheduleInfo = {};

    for (const meal of meals) {
        const mealTime = new Date(wakeUpDate.getTime() + meal.delayHours * 60 * 60 * 1000);
        const sadTime = new Date(mealTime.getTime() + 1 * 60 * 60 * 1000);

        let reminderId = null;
        let sadId = null;

        try {
            // Schedule Reminder
            if (mealTime > now) {
                const diffSeconds = Math.floor((mealTime.getTime() - now.getTime()) / 1000);
                if (diffSeconds > 0) {
                    reminderId = await Notifications.scheduleNotificationAsync({
                        content: {
                            title: `${meal.name} Vakti!`,
                            body: `Sağlıklı beslenmeyi unutma! 🌸`,
                            sound: true,
                        },
                        trigger: { seconds: diffSeconds },
                    });
                }
            }
        } catch (e) {
            console.warn("Schedule Error (Reminder):", e);
        }

        try {
            // Schedule Sad Follow-up
            if (sadTime > now) {
                const diffSeconds = Math.floor((sadTime.getTime() - now.getTime()) / 1000);
                if (diffSeconds > 0) {
                    sadId = await Notifications.scheduleNotificationAsync({
                        content: {
                            title: `Üzgünüm... 😢`,
                            body: `Sanırım ${meal.name} yemedin... Lütfen kendine iyi bak.`,
                            sound: true,
                        },
                        trigger: { seconds: diffSeconds },
                    });
                }
            }
        } catch (e) {
            console.warn("Schedule Error (Sad):", e);
        }

        // Always add to scheduleInfo so UI shows the item
        scheduleInfo[meal.id] = {
            name: meal.name,
            time: mealTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            sadNotificationId: sadId
        };
    }

    // Schedule simple water reminders (starting 1 hour after wake up, every 2 hours, for 8 hours)
    await scheduleWaterReminders(wakeUpDate);

    return scheduleInfo;
};

export const scheduleWaterReminders = async (wakeUpDate) => {
    // 4 reminders: Wake+2h, Wake+4h, Wake+6h, Wake+8h
    const intervals = [2, 4, 6, 8];
    const now = new Date();

    for (const h of intervals) {
        const waterTime = new Date(wakeUpDate.getTime() + h * 60 * 60 * 1000);
        if (waterTime > now) {
            const diffSeconds = Math.floor((waterTime.getTime() - now.getTime()) / 1000);
            if (diffSeconds > 0) {
                try {
                    await Notifications.scheduleNotificationAsync({
                        content: {
                            title: `Su Vakti! 💧`,
                            body: `Kendine bir bardak su sula! 🌊`,
                            sound: true,
                        },
                        trigger: { seconds: diffSeconds },
                    });
                } catch (e) { /* ignore */ }
            }
        }
    }
};

export const cancelSadNotification = async (sadNotificationId) => {
    if (sadNotificationId) {
        try {
            await Notifications.cancelScheduledNotificationAsync(sadNotificationId);
        } catch (e) {
            console.warn("Cancel Sad Error:", e);
        }
    }
};
