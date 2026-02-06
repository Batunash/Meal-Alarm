// Pure functions for meal logic

function calculateMealTimes(wakeUpTimeStr) {
    if (!wakeUpTimeStr) return null;

    const [hours, minutes] = wakeUpTimeStr.split(':').map(Number);
    const wakeUpDate = new Date();
    wakeUpDate.setHours(hours, minutes, 0, 0);

    // Rule:
    // Breakfast: +1 hour
    // Lunch: +5 hours
    // Dinner: +9 hours (User asked for "dinner" typically around evening, let's say 5h gap)
    
    // Adjusting for a typical healthy schedule:
    // Breakfast: 1 hour after waking
    // Lunch: 5 hours after waking
    // Dinner: 10 hours after waking
    
    const breakfast = new Date(wakeUpDate.getTime() + 1 * 60 * 60 * 1000);
    const lunch = new Date(wakeUpDate.getTime() + 5 * 60 * 60 * 1000);
    const dinner = new Date(wakeUpDate.getTime() + 10 * 60 * 60 * 1000);

    return {
        breakfast: formatTime(breakfast),
        lunch: formatTime(lunch),
        dinner: formatTime(dinner),
        raw: {
            breakfast: breakfast,
            lunch: lunch,
            dinner: dinner
        }
    };
}

function formatTime(dateObj) {
    return dateObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// Export for global usage (since we are using vanilla script tags without modules for simplicity)
window.MealLogic = {
    calculateMealTimes
};
