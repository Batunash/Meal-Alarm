const STORAGE_KEY = 'meal_alarm_wakeup_time';

const StorageAdapter = {
    saveWakeUpTime(time) {
        try {
            localStorage.setItem(STORAGE_KEY, time);
        } catch (e) {
            console.error('Failed to save time', e);
        }
    },

    getWakeUpTime() {
        try {
            return localStorage.getItem(STORAGE_KEY);
        } catch (e) {
            console.error('Failed to get time', e);
            return null;
        }
    },

    clear() {
        localStorage.removeItem(STORAGE_KEY);
    }
};

window.StorageAdapter = StorageAdapter;
