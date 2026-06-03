import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';

const itemHeight = 60;

const hoursArray = ['', ...Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')), ''];
const minutesArray = ['', ...Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')), ''];
const secondsArray = ['', ...Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')), ''];

interface FrequentTimer {
    id: string;
    h: number;
    m: number;
    s: number;
}

function TimerScreen() {
    const navigation = useNavigation<any>();
    
    const [selectedHours, setSelectedHours] = useState<number>(0);
    const [selectedMinutes, setSelectedMinutes] = useState<number>(15);
    const [selectedSeconds, setSelectedSeconds] = useState<number>(0);

    const [frequentTimers, setFrequentTimers] = useState<FrequentTimer[]>([
        { id: '1', h: 0, m: 1, s: 0 },
        { id: '2', h: 0, m: 5, s: 0 },
        { id: '3', h: 0, m: 10, s: 0 },
        { id: '4', h: 0, m: 30, s: 0 },
    ]);

    const hoursRef = useRef<FlatList>(null);
    const minutesRef = useRef<FlatList>(null);
    const secondsRef = useRef<FlatList>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            hoursRef.current?.scrollToOffset({ offset: selectedHours * itemHeight, animated: false });
            minutesRef.current?.scrollToOffset({ offset: selectedMinutes * itemHeight, animated: false });
            secondsRef.current?.scrollToOffset({ offset: selectedSeconds * itemHeight, animated: false });
        }, 150);
        return () => clearTimeout(timer);
    }, []);

    const handleScrollEnd = (type: 'hours' | 'minutes' | 'seconds') => (event: any) => {
        const y = event.nativeEvent.contentOffset.y;
        const val = Math.min(
            type === 'hours' ? 23 : 59,
            Math.max(0, Math.round(y / itemHeight))
        );
        if (type === 'hours') {
            setSelectedHours(val);
        } else if (type === 'minutes') {
            setSelectedMinutes(val);
        } else {
            setSelectedSeconds(val);
        }
    };

    const selectTimer = (h: number, m: number, s: number) => {
        setSelectedHours(h);
        setSelectedMinutes(m);
        setSelectedSeconds(s);
        hoursRef.current?.scrollToOffset({ offset: h * itemHeight, animated: true });
        minutesRef.current?.scrollToOffset({ offset: m * itemHeight, animated: true });
        secondsRef.current?.scrollToOffset({ offset: s * itemHeight, animated: true });
    };

    const handleAddTimer = () => {
        if (selectedHours === 0 && selectedMinutes === 0 && selectedSeconds === 0) return;
        
        const exists = frequentTimers.some(
            t => t.h === selectedHours && t.m === selectedMinutes && t.s === selectedSeconds
        );
        if (exists) return;

        const newTimer: FrequentTimer = {
            id: String(Date.now()),
            h: selectedHours,
            m: selectedMinutes,
            s: selectedSeconds,
        };
        setFrequentTimers(prev => [...prev, newTimer]);
    };

    const handleLongPressTimer = (id: string) => {
        setFrequentTimers(prev => prev.filter(t => t.id !== id));
    };

    const handlePlay = () => {
        const durationMs = (selectedHours * 3600 + selectedMinutes * 60 + selectedSeconds) * 1000;
        if (durationMs === 0) return;
        
        navigation.navigate("StopWatchScreen", {
            mode: 'timer',
            duration: durationMs
        });
    };

    const getItemLayout = (data: any, index: number) => ({
        length: itemHeight,
        offset: itemHeight * index,
        index,
    });

    const renderPickerItem = (selectedValue: number) => ({ item, index }: { item: string; index: number }) => {
        if (item === '') {
            return <View style={{ height: itemHeight }} />;
        }
        const isSelected = (index - 1) === selectedValue;
        return (
            <View style={styles.pickerItem}>
                <Text style={[
                    styles.pickerItemText,
                    isSelected ? styles.pickerItemTextActive : styles.pickerItemTextInactive
                ]}>
                    {item}
                </Text>
            </View>
        );
    };

    const totalDuration = selectedHours * 3600 + selectedMinutes * 60 + selectedSeconds;
    const isPlayDisabled = totalDuration === 0;

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.menuButton}>
                    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                        <Path
                            d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
                            fill="#FFFFFF"
                        />
                    </Svg>
                </TouchableOpacity>
            </View>

            <View style={styles.pickerContainer}>
                <View style={styles.wheelContainer}>
                    <FlatList
                        ref={hoursRef}
                        data={hoursArray}
                        keyExtractor={(item, index) => `h-${index}`}
                        renderItem={renderPickerItem(selectedHours)}
                        snapToInterval={itemHeight}
                        snapToAlignment="center"
                        decelerationRate="fast"
                        showsVerticalScrollIndicator={false}
                        getItemLayout={getItemLayout}
                        onMomentumScrollEnd={handleScrollEnd('hours')}
                        onScrollEndDrag={handleScrollEnd('hours')}
                        scrollEventThrottle={16}
                    />
                </View>

                <Text style={styles.colon}>:</Text>

                <View style={styles.wheelContainer}>
                    <FlatList
                        ref={minutesRef}
                        data={minutesArray}
                        keyExtractor={(item, index) => `m-${index}`}
                        renderItem={renderPickerItem(selectedMinutes)}
                        snapToInterval={itemHeight}
                        snapToAlignment="center"
                        decelerationRate="fast"
                        showsVerticalScrollIndicator={false}
                        getItemLayout={getItemLayout}
                        onMomentumScrollEnd={handleScrollEnd('minutes')}
                        onScrollEndDrag={handleScrollEnd('minutes')}
                        scrollEventThrottle={16}
                    />
                </View>

                <Text style={styles.colon}>:</Text>

                <View style={styles.wheelContainer}>
                    <FlatList
                        ref={secondsRef}
                        data={secondsArray}
                        keyExtractor={(item, index) => `s-${index}`}
                        renderItem={renderPickerItem(selectedSeconds)}
                        snapToInterval={itemHeight}
                        snapToAlignment="center"
                        decelerationRate="fast"
                        showsVerticalScrollIndicator={false}
                        getItemLayout={getItemLayout}
                        onMomentumScrollEnd={handleScrollEnd('seconds')}
                        onScrollEndDrag={handleScrollEnd('seconds')}
                        scrollEventThrottle={16}
                    />
                </View>
            </View>

            <View style={styles.frequentSection}>
                <View style={styles.frequentHeader}>
                    <Text style={styles.frequentTitle}>Frequently used timers</Text>
                    <TouchableOpacity onPress={handleAddTimer}>
                        <Text style={styles.addButtonText}>Add</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.frequentList}>
                    {frequentTimers.map((timer) => {
                        const label = timer.h > 0
                            ? `${String(timer.h).padStart(2, '0')}:${String(timer.m).padStart(2, '0')}:${String(timer.s).padStart(2, '0')}`
                            : `${String(timer.m).padStart(2, '0')}:${String(timer.s).padStart(2, '0')}`;
                        return (
                            <TouchableOpacity
                                key={timer.id}
                                style={styles.frequentItem}
                                onPress={() => selectTimer(timer.h, timer.m, timer.s)}
                                onLongPress={() => handleLongPressTimer(timer.id)}
                            >
                                <Text style={styles.frequentItemText}>{label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.playButton, isPlayDisabled && styles.disabledButton]}
                    onPress={handlePlay}
                    disabled={isPlayDisabled}
                >
                    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                        <Path d="M8 5v14l11-7z" fill="#FFFFFF" />
                    </Svg>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#000000",
        paddingHorizontal: 20
    },
    header: {
        height: 50,
        flexDirection: "row",
        justifyContent: "flex-end",
        alignItems: "center",
        marginTop: Platform.OS === "ios" ? 10 : 20
    },
    menuButton: {
        padding: 4,
    },
    pickerContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        height: 180,
        marginVertical: 20,
    },
    wheelContainer: {
        height: 180,
        width: 80,
    },
    colon: {
        fontSize: 32,
        color: "#FFFFFF",
        marginHorizontal: 10,
        paddingBottom: 8,
    },
    pickerItem: {
        height: itemHeight,
        justifyContent: "center",
        alignItems: "center",
    },
    pickerItemText: {
        fontWeight: "600",
        ...Platform.select({
            ios: {
                fontVariant: ["tabular-nums"]
            },
            android: {
                fontStyle: "normal"
            }
        })
    },
    pickerItemTextActive: {
        fontSize: 42,
        color: "#FFFFFF",
    },
    pickerItemTextInactive: {
        fontSize: 28,
        color: "#444444",
    },
    frequentSection: {
        flex: 1,
        marginTop: 20,
    },
    frequentHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 10,
    },
    frequentTitle: {
        color: "#8E8E93",
        fontSize: 16,
        fontWeight: "500",
    },
    addButtonText: {
        color: "#E53935",
        fontSize: 16,
        fontWeight: "600",
    },
    frequentList: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginTop: 15,
        paddingHorizontal: 10,
    },
    frequentItem: {
        backgroundColor: "#1C1C1E",
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    frequentItemText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "500",
    },
    footer: {
        justifyContent: "center",
        alignItems: "center",
        paddingBottom: Platform.OS === "ios" ? 34 : 24,
    },
    playButton: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: "#E53935",
        justifyContent: "center",
        alignItems: "center"
    },
    disabledButton: {
        opacity: 0.3
    }
});

export default TimerScreen;