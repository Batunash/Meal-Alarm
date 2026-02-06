import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
    WAKE_UP: 'user_wake_up_time',
    SCHEDULE: 'meal_schedule_info',
    EATEN_STATUS: 'meal_eaten_status',
    WATER_COUNT: 'user_water_count',
    STREAK: 'user_streak_data' // { count: 0, lastDate: '2023-XX-XX' }
};

export const saveWakeUpTime = async (time) => {
    try {
        await AsyncStorage.setItem(KEYS.WAKE_UP, time);
    } catch (e) {
        console.error(e);
    }
};

export const getWakeUpTime = async () => {
    try {
        return await AsyncStorage.getItem(KEYS.WAKE_UP);
    } catch (e) {
        return null;
    }
};

export const saveSchedule = async (schedule) => {
    try {
        await AsyncStorage.setItem(KEYS.SCHEDULE, JSON.stringify(schedule));
    } catch (e) {
        console.error(e);
    }
};

export const getSchedule = async () => {
    try {
        const json = await AsyncStorage.getItem(KEYS.SCHEDULE);
        return json != null ? JSON.parse(json) : null;
    } catch (e) {
        return null;
    }
};

export const saveEatenStatus = async (statusMap) => {
    try {
        await AsyncStorage.setItem(KEYS.EATEN_STATUS, JSON.stringify(statusMap));
    } catch (e) {
        console.error(e);
    }
};

export const getEatenStatus = async () => {
    try {
        const json = await AsyncStorage.getItem(KEYS.EATEN_STATUS);
        return json != null ? JSON.parse(json) : {}; // { breakfast: true, lunch: false }
    } catch (e) {
        return {};
    }
};

export const saveWaterCount = async (count) => {
    try {
        // We add a date check usually, but for simplicity just store current count. 
        // App.js should handle resetting it daily.
        await AsyncStorage.setItem(KEYS.WATER_COUNT, count.toString());
    } catch (e) {
        console.error(e);
    }
};

export const getWaterCount = async () => {
    try {
        const val = await AsyncStorage.getItem(KEYS.WATER_COUNT);
        return val ? parseInt(val, 10) : 0;
    } catch (e) {
        return 0;
    }
};

export const saveStreak = async (streakData) => { // { count, lastDate }
    try {
        await AsyncStorage.setItem(KEYS.STREAK, JSON.stringify(streakData));
    } catch (e) {
        console.error(e);
    }
};

export const getStreak = async () => {
    try {
        const json = await AsyncStorage.getItem(KEYS.STREAK);
        return json ? JSON.parse(json) : { count: 0, lastDate: null };
    } catch (e) {
        return { count: 0, lastDate: null };
    }
};

const HISTORY_KEY = 'user_weekly_history';

export const getHistory = async () => {
    try {
        const json = await AsyncStorage.getItem(HISTORY_KEY);
        return json ? JSON.parse(json) : [];
    } catch (e) {
        return [];
    }
};

export const addToHistory = async (dayStats) => {
    // dayStats: { date: 'YYYY-MM-DD', water: 5, meals: 3 }
    try {
        const currentCheck = await getHistory();
        // Remove entry if same date exists to avoid dupes (update instead)
        const filtered = currentCheck.filter(item => item.date !== dayStats.date);

        // Add new, sort by date desc, slice 7
        const newHistory = [dayStats, ...filtered]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 7);

        await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(newHistory));
    } catch (e) {
        console.error(e);
    }
};
