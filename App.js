import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import DateTimePicker from '@react-native-community/datetimepicker';
import { theme } from './src/theme';
import * as Storage from './src/storage';
import * as NotifManager from './src/notifications';
import Avatar from './src/Avatar';

// Helper for "Sad" notification handling
async function handleEatAction(mealId, sadId, currentStatus, setStatus, allMeals, setStreak) {
    const newStatus = { ...currentStatus, [mealId]: true };
    setStatus(newStatus);
    await Storage.saveEatenStatus(newStatus);

    if (sadId) {
        await NotifManager.cancelSadNotification(sadId);
    }

    // Check Streak (If all 3 meals are eaten)
    if (newStatus['breakfast'] && newStatus['lunch'] && newStatus['dinner']) {
        const streak = await Storage.getStreak();
        const todayStr = new Date().toDateString();

        if (streak.lastDate !== todayStr) {
            const newCount = streak.count + 1;
            const newStreak = { count: newCount, lastDate: todayStr };
            setStreak(newStreak);
            await Storage.saveStreak(newStreak);
            Alert.alert("Tebrikler! 🔥", `Seri yaptın! ${newCount} gündür sağlıklısın!`);
        }
    } else if (sadId) {
        Alert.alert("Afiyet Olsun! 🌸", "Üzgün bildirimi iptal ettim. Harikasın!");
    }
}

export default function App() {
    const [wakeUpDate, setWakeUpDate] = useState(new Date());
    const [showPicker, setShowPicker] = useState(false);
    const [schedule, setSchedule] = useState(null);
    const [eatenStatus, setEatenStatus] = useState({});
    const [waterCount, setWaterCount] = useState(0);
    const [streak, setStreak] = useState({ count: 0, lastDate: null });

    // Tabs: 'meals' | 'water'
    const [activeTab, setActiveTab] = useState('meals');
    // Emotion: 'neutral', 'happy', 'sad', 'eating', 'drinking', 'sleeping'
    const [emotion, setEmotion] = useState('neutral');

    // Weekly History
    const [history, setHistory] = useState([]);

    useEffect(() => {
        if (activeTab === 'profile') {
            Storage.getHistory().then(setHistory);
        }
    }, [activeTab]);

    useEffect(() => {
        async function init() {
            const timeStr = await Storage.getWakeUpTime();
            const sched = await Storage.getSchedule();
            const status = await Storage.getEatenStatus();
            const water = await Storage.getWaterCount();
            const strk = await Storage.getStreak();

            if (timeStr) {
                const [h, m] = timeStr.split(':').map(Number);
                const d = new Date();
                d.setHours(h, m, 0, 0);
                setWakeUpDate(d);
            }

            if (sched) setSchedule(sched);
            if (status) setEatenStatus(status);
            setWaterCount(water);
            setStreak(strk);

            await NotifManager.requestPermissions();
        }
        init();
    }, []);

    // Emotion Logic
    useEffect(() => {
        // If no schedule, maybe sleeping?
        if (!schedule) {
            setEmotion('sleeping');
            return;
        }

        // Default calculation based on stats
        let calculatedEmotion = 'neutral';
        if (streak.count >= 3 || waterCount >= 5) {
            calculatedEmotion = 'happy';
        }

        // We don't force it here to allow temporary animations
        // But we could set it if current emotion is 'neutral' or 'sleeping'
        if (emotion === 'neutral' || emotion === 'sleeping') {
            setEmotion(calculatedEmotion);
        }

    }, [streak, waterCount, schedule]);

    const triggerReaction = (reaction, duration = 3000) => {
        setEmotion(reaction);
        setTimeout(() => {
            const isDoingWell = streak.count >= 3 || waterCount >= 5;
            setEmotion(isDoingWell ? 'happy' : 'neutral');
        }, duration);
    };

    const handleWater = async () => {
        const newCount = waterCount + 1;
        setWaterCount(newCount);
        await Storage.saveWaterCount(newCount);
        triggerReaction('drinking', 4000);
    };

    const handleTimeChange = (event, selectedDate) => {
        setShowPicker(false);
        if (selectedDate) {
            setWakeUpDate(selectedDate);
        }
    };

    const handleSave = async () => {
        // Save History (Yesterday's or previous session's stats) before reset
        const mealsEatenCount = Object.values(eatenStatus).filter(Boolean).length;
        if (mealsEatenCount > 0 || waterCount > 0) {
            await Storage.addToHistory({
                date: new Date().toISOString().split('T')[0],
                water: waterCount,
                meals: mealsEatenCount
            });
        }

        const hours = wakeUpDate.getHours().toString().padStart(2, '0');
        const minutes = wakeUpDate.getMinutes().toString().padStart(2, '0');
        const wakeUpTimeStr = `${hours}:${minutes}`;

        await Storage.saveWakeUpTime(wakeUpTimeStr);

        // Reset day logic
        const newEaten = {};
        setEatenStatus(newEaten);
        await Storage.saveEatenStatus(newEaten);

        setWaterCount(0);
        await Storage.saveWaterCount(0);

        const newSchedule = await NotifManager.scheduleMealNotifications(wakeUpTimeStr);
        setSchedule(newSchedule);
        await Storage.saveSchedule(newSchedule);

        Alert.alert("Harika! 💖", "Planın oluşturuldu ve bildirimler ayarlandı.");
        triggerReaction('happy');
    };

    return (
        <View style={styles.container}>
            <StatusBar style="auto" />
            <View style={styles.header}>
                <Text style={styles.title}>Günaydın! ☀️</Text>
                <View style={styles.headerRow}>
                    <View style={styles.streakBadge}>
                        <Text style={styles.streakText}>🔥 {streak.count}</Text>
                    </View>
                    <Avatar emotion={emotion} />
                </View>
            </View>

            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'meals' && styles.activeTab]}
                    onPress={() => setActiveTab('meals')}
                >
                    <Text style={[styles.tabText, activeTab === 'meals' && styles.activeTabText]}>🍽️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'water' && styles.activeTab]}
                    onPress={() => setActiveTab('water')}
                >
                    <Text style={[styles.tabText, activeTab === 'water' && styles.activeTabText]}>💧</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
                    onPress={() => setActiveTab('profile')}
                >
                    <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>👤</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {activeTab === 'profile' && (
                    <View style={styles.profileSection}>
                        <Text style={styles.sectionTitle}>Haftalık Özet 📊</Text>

                        {history.length === 0 ? (
                            <Text style={styles.emptyText}>Henüz veri yok. Yarın gel!</Text>
                        ) : (
                            history.map((day, index) => (
                                <View key={index} style={styles.historyRow}>
                                    <Text style={styles.historyDate}>{day.date}</Text>
                                    <View style={styles.historyStats}>
                                        <Text>🍽️ {day.meals}</Text>
                                        <Text>💧 {day.water}</Text>
                                    </View>
                                </View>
                            ))
                        )}

                        <View style={styles.statCard}>
                            <Text style={styles.statTitle}>Toplam Seri</Text>
                            <Text style={styles.statValue}>🔥 {streak.count} Gün</Text>
                        </View>
                    </View>
                )}

                {activeTab === 'meals' && (
                    <View>
                        <View style={styles.card}>
                            <TouchableOpacity
                                style={styles.timeDisplayButton}
                                onPress={() => setShowPicker(true)}
                            >
                                <Text style={styles.timeDisplayText}>
                                    {wakeUpDate.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                </Text>
                            </TouchableOpacity>

                            {showPicker && (
                                <DateTimePicker
                                    value={wakeUpDate}
                                    mode="time"
                                    is24Hour={true}
                                    display="spinner"
                                    onChange={handleTimeChange}
                                    textColor={theme.colors.darkPink}
                                />
                            )}

                            <TouchableOpacity style={styles.button} onPress={handleSave}>
                                <Text style={styles.buttonText}>Planla 💖</Text>
                            </TouchableOpacity>
                        </View>

                        {schedule ? (
                            <View style={styles.scheduleSection}>
                                {['breakfast', 'lunch', 'dinner'].map((mealKey) => {
                                    const meal = schedule[mealKey];
                                    if (!meal) return null;
                                    const isEaten = eatenStatus[mealKey];

                                    return (
                                        <View key={mealKey} style={[styles.mealCard, isEaten && styles.mealCardEaten]}>
                                            <View>
                                                <Text style={styles.mealName}>{meal.name}</Text>
                                                <Text style={styles.mealTime}>{meal.time}</Text>
                                            </View>

                                            {!isEaten ? (
                                                <TouchableOpacity
                                                    style={styles.eatButton}
                                                    onPress={() => {
                                                        handleEatAction(mealKey, meal.sadNotificationId, eatenStatus, setEatenStatus, schedule, setStreak);
                                                        triggerReaction('eating', 4000);
                                                    }}
                                                >
                                                    <Text style={styles.eatButtonText}>Yedim! 😋</Text>
                                                </TouchableOpacity>
                                            ) : (
                                                <Text style={styles.eatenText}>Afiyet olsun! ✅</Text>
                                            )}
                                        </View>
                                    );
                                })}
                            </View>
                        ) : (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyStateText}>Plan Yok 😴</Text>
                                <Text style={styles.emptyStateSubtext}>Saati ayarla!</Text>
                            </View>
                        )}
                    </View>
                )}

                {activeTab === 'water' && (
                    <View style={styles.waterSection}>
                        <Text style={styles.waterTitle}>Su Takibi ({waterCount}/8)</Text>

                        <View style={styles.waterGrid}>
                            {[...Array(8)].map((_, i) => (
                                <TouchableOpacity
                                    key={i}
                                    style={[styles.waterGlass, i < waterCount && styles.waterGlassFull]}
                                    onPress={handleWater}
                                    disabled={i < waterCount}
                                >
                                    <Text style={{ fontSize: 24 }}>{i < waterCount ? '💧' : '⚪'}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity style={styles.resetButton} onPress={() => { setWaterCount(0); Storage.saveWaterCount(0); }}>
                            <Text style={styles.resetText}>Sıfırla 🔄</Text>
                        </TouchableOpacity>
                    </View>
                )}

            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContent: {
        padding: theme.spacing.large,
        paddingBottom: 50
    },
    header: {
        alignItems: 'center',
        paddingTop: 50,
        backgroundColor: '#FFF',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        ...theme.shadow,
        zIndex: 10
    },
    headerRow: {
        flexDirection: 'column',
        alignItems: 'center'
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.colors.darkPink,
        marginBottom: 5,
    },
    tabs: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
        gap: 20
    },
    tab: {
        paddingVertical: 10,
        paddingHorizontal: 25,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.5)'
    },
    activeTab: {
        backgroundColor: theme.colors.primaryPink,
        ...theme.shadow
    },
    tabText: {
        fontSize: 18,
        color: '#888',
        fontWeight: 'bold'
    },
    activeTabText: {
        color: '#FFF'
    },
    card: {
        backgroundColor: theme.colors.white,
        padding: theme.spacing.medium,
        borderRadius: theme.borderRadius.large,
        ...theme.shadow,
        marginBottom: theme.spacing.large,
        marginTop: 20
    },
    timeDisplayButton: {
        borderWidth: 2,
        borderColor: theme.colors.primaryPink,
        borderRadius: theme.borderRadius.medium,
        padding: theme.spacing.medium,
        marginBottom: theme.spacing.medium,
        alignItems: 'center',
        backgroundColor: '#FFF0F5'
    },
    timeDisplayText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: theme.colors.darkPink,
    },
    button: {
        backgroundColor: theme.colors.darkPink,
        padding: theme.spacing.medium,
        borderRadius: theme.borderRadius.medium,
        alignItems: 'center',
    },
    buttonText: {
        color: theme.colors.white,
        fontSize: 18,
        fontWeight: 'bold',
    },
    scheduleSection: {
        gap: 15
    },
    mealCard: {
        backgroundColor: theme.colors.white,
        padding: theme.spacing.medium,
        borderRadius: theme.borderRadius.medium,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...theme.shadow,
    },
    mealCardEaten: {
        opacity: 0.7,
        backgroundColor: '#F0F0F0'
    },
    mealName: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
    },
    mealTime: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.darkPink,
    },
    eatButton: {
        backgroundColor: theme.colors.mint,
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
    },
    eatButtonText: {
        color: '#446644',
        fontWeight: 'bold',
    },
    eatenText: {
        color: theme.colors.mint,
        fontWeight: 'bold',
        fontSize: 16
    },
    streakBadge: {
        backgroundColor: '#FFECB3',
        paddingHorizontal: 15,
        paddingVertical: 5,
        borderRadius: 20,
        marginBottom: 5,
        position: 'absolute',
        right: -140,
        top: -40
    },
    streakText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FF6F00'
    },
    waterSection: {
        backgroundColor: theme.colors.white,
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        marginTop: 20,
        ...theme.shadow
    },
    waterTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#2196F3',
        marginBottom: 20
    },
    waterGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 15,
        marginBottom: 20
    },
    waterGlass: {
        width: 60,
        height: 60,
        backgroundColor: '#FAFAFA',
        borderRadius: 15,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E3F2FD'
    },
    waterGlassFull: {
        backgroundColor: '#E3F2FD',
        borderColor: '#2196F3'
    },
    resetButton: {
        padding: 10
    },
    resetText: {
        color: '#999'
    },
    emptyState: {
        alignItems: 'center',
        marginTop: 40,
        opacity: 0.6
    },
    emptyStateText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
        marginBottom: 5
    },
    emptyStateSubtext: {
        fontSize: 16,
        color: theme.colors.text
    },
    // Profile Styles
    profileSection: {
        padding: 10
    },
    historyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#FFF',
        padding: 15,
        borderRadius: 15,
        marginBottom: 10,
        ...theme.shadow
    },
    historyDate: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#555'
    },
    historyStats: {
        flexDirection: 'row',
        gap: 15
    },
    emptyText: {
        textAlign: 'center',
        padding: 20,
        color: '#999',
        fontSize: 16
    },
    statCard: {
        backgroundColor: '#E1F5FE',
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        marginTop: 20
    },
    statTitle: {
        color: '#0288D1',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5
    },
    statValue: {
        color: '#2196F3',
        fontSize: 32,
        fontWeight: 'bold'
    }
});
