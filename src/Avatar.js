import React, { useEffect, useRef } from 'react';
import { View, Image, StyleSheet, Animated } from 'react-native';
import { theme } from './theme';

const IMAGES = {
    neutral: require('../assets/avatar_neutral.png'),
    happy: require('../assets/avatar_happy.png'),
    sad: require('../assets/avatar_sad.png'),
    eating: require('../assets/avatar_eating.png'),
    drinking: require('../assets/avatar_drinking.png'),
    sleeping: require('../assets/avatar_sleeping.png')
};

export default function Avatar({ emotion = 'neutral' }) {
    const bounceAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Simple bounce animation on change
        Animated.sequence([
            Animated.timing(bounceAnim, {
                toValue: -10,
                duration: 150,
                useNativeDriver: true
            }),
            Animated.timing(bounceAnim, {
                toValue: 0,
                duration: 150,
                useNativeDriver: true
            })
        ]).start();
    }, [emotion]);

    return (
        <View style={styles.container}>
            <Animated.View style={{ transform: [{ translateY: bounceAnim }] }}>
                <Image
                    source={IMAGES[emotion]}
                    style={styles.avatar}
                    resizeMode="contain"
                />
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginVertical: 10,
    },
    avatar: {
        width: 120,
        height: 120,
        // Optional: Add pixel art styling if needed
        // overlayColor: 'transparent'
    }
});
