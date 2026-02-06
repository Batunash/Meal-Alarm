import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Bildirim işleyicisi yapılandırması
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
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

        // Android için bildirim kanalı oluşturma (SDK 52/53 için gereklidir)
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        return finalStatus === 'granted';
    } catch (e) {
        console.warn("İzin Hatası:", e);
        return false;
    }
};

export const scheduleMealNotifications = async (wakeUpTimeStr) => {
    // Mevcut tüm bildirimleri temizle
    try {
        await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (e) {
        console.warn("Temizleme Hatası:", e);
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
            // Hatırlatıcı Planla
            if (mealTime > now) {
                const diffSeconds = Math.floor((mealTime.getTime() - now.getTime()) / 1000);
                if (diffSeconds > 0) {
                    reminderId = await Notifications.scheduleNotificationAsync({
                        content: {
                            title: `${meal.name} Vakti!`,
                            body: `Sağlıklı beslenmeyi unutma! 🌸`,
                            sound: true,
                        },
                        trigger: {
                            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                            seconds: diffSeconds,
                            repeats: false
                        },
                    });
                }
            }
        } catch (e) {
            console.warn("Planlama Hatası (Hatırlatıcı):", e);
        }

        try {
            // "Yemedin mi?" Bildirimi Planla
            if (sadTime > now) {
                const diffSeconds = Math.floor((sadTime.getTime() - now.getTime()) / 1000);
                if (diffSeconds > 0) {
                    sadId = await Notifications.scheduleNotificationAsync({
                        content: {
                            title: `Üzgünüm... 😢`,
                            body: `Sanırım ${meal.name} yemedin... Lütfen kendine iyi bak.`,
                            sound: true,
                        },
                        trigger: {
                            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                            seconds: diffSeconds,
                            repeats: false
                        },
                    });
                }
            }
        } catch (e) {
            console.warn("Planlama Hatası (Üzüntü):", e);
        }

        scheduleInfo[meal.id] = {
            name: meal.name,
            time: mealTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            sadNotificationId: sadId
        };
    }

    await scheduleWaterReminders(wakeUpDate);
    return scheduleInfo;
};

export const scheduleWaterReminders = async (wakeUpDate) => {
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
                            body: `Kendine bir bardak su ısmarla! 🌊`,
                            sound: true,
                        },
                        trigger: {
                            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                            seconds: diffSeconds,
                            repeats: false
                        },
                    });
                } catch (e) { /* yoksay */ }
            }
        }
    }
};

export const cancelSadNotification = async (sadNotificationId) => {
    if (sadNotificationId) {
        try {
            await Notifications.cancelScheduledNotificationAsync(sadNotificationId);
        } catch (e) {
            console.warn("Üzüntü Bildirimi İptal Hatası:", e);
        }
    }
};