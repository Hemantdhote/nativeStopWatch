import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Platform,
    LayoutAnimation,
    UIManager
} from "react-native";
import Svg, { Circle, Path, Defs, LinearGradient, Stop } from "react-native-svg";
import { useRoute, useNavigation } from "@react-navigation/native";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface LapRecord {
    id: string;
    lapNum: string;
    lapTime: string;
    totalTime: string;
}

const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const hundredths = Math.floor((ms % 1000) / 10);

    const pad = (num: number) => String(num).padStart(2, "0");

    return {
        minutes: pad(minutes),
        seconds: pad(seconds),
        hundredths: pad(hundredths),
        formattedTotal: `${pad(minutes)}:${pad(seconds)}.${pad(hundredths)}`,
        formattedLap: `+${pad(minutes)}:${pad(seconds)}.${pad(hundredths)}`
    };
};

const formatTimerTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    const hundredths = Math.floor((ms % 1000) / 10);

    const pad = (num: number) => String(num).padStart(2, "0");

    return {
        hours: pad(hours),
        minutes: pad(minutes),
        seconds: pad(seconds),
        hundredths: pad(hundredths)
    };
};

function StopWatchScreen() {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const params = route.params;

    const [time, setTime] = useState<number>(0);
    const [isRunning, setIsRunning] = useState<boolean>(false);
    const [hasStarted, setHasStarted] = useState<boolean>(false);
    const [laps, setLaps] = useState<LapRecord[]>([]);

    const [isTimerMode, setIsTimerMode] = useState<boolean>(false);
    const [timerDuration, setTimerDuration] = useState<number>(0);

    const isTimerModeRef = useRef<boolean>(false);
    const timerDurationRef = useRef<number>(0);

    // Sync refs
    isTimerModeRef.current = isTimerMode;
    timerDurationRef.current = timerDuration;

    const requestRef = useRef<number | null>(null);
    const startTimeRef = useRef<number>(0);
    const accumulatedTimeRef = useRef<number>(0);
    const lastLapTimeRef = useRef<number>(0);

    // Keep track of the current lap's running time
    const currentLapTime = time - lastLapTimeRef.current;

    const updateTimer = useCallback(() => {
        const now = Date.now();
        const elapsed = now - startTimeRef.current + accumulatedTimeRef.current;
        
        if (isTimerModeRef.current) {
            const remaining = Math.max(0, timerDurationRef.current - elapsed);
            setTime(remaining);
            if (remaining <= 0) {
                setIsRunning(false);
                if (requestRef.current) {
                    cancelAnimationFrame(requestRef.current);
                    requestRef.current = null;
                }
            } else {
                requestRef.current = requestAnimationFrame(updateTimer);
            }
        } else {
            setTime(elapsed);
            requestRef.current = requestAnimationFrame(updateTimer);
        }
    }, []);

    const handleStartPause = () => {
        if (isRunning) {
            // Pause
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
                requestRef.current = null;
            }
            if (isTimerMode) {
                accumulatedTimeRef.current = timerDuration - time;
            } else {
                accumulatedTimeRef.current = time;
            }
            setIsRunning(false);
        } else {
            // Start
            if (!hasStarted) {
                LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                setHasStarted(true);
            }
            startTimeRef.current = Date.now();
            setIsRunning(true);
            requestRef.current = requestAnimationFrame(updateTimer);
        }
    };

    const handleReset = () => {
        // Reset
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
            requestRef.current = null;
        }
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setTime(0);
        setIsRunning(false);
        setHasStarted(false);
        setLaps([]);
        accumulatedTimeRef.current = 0;
        lastLapTimeRef.current = 0;
    };

    const handleLap = () => {
        if (!isRunning) return;

        const currentTotal = time;
        const lapDuration = currentTotal - lastLapTimeRef.current;

        const nextLapNum = String(laps.length + 1).padStart(2, "0");
        const newLap: LapRecord = {
            id: String(Date.now()),
            lapNum: nextLapNum,
            lapTime: formatTime(lapDuration).formattedLap,
            totalTime: formatTime(currentTotal).formattedTotal
        };

        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setLaps(prevLaps => [newLap, ...prevLaps]);
        lastLapTimeRef.current = currentTotal;
    };

    const handleCancel = () => {
        if (requestRef.current) {
            cancelAnimationFrame(requestRef.current);
            requestRef.current = null;
        }
        setIsTimerMode(false);
        isTimerModeRef.current = false;
        setTime(0);
        setIsRunning(false);
        setHasStarted(false);
        setLaps([]);
        accumulatedTimeRef.current = 0;
        lastLapTimeRef.current = 0;
        
        navigation.navigate("TimerScreen");
    };

    useEffect(() => {
        if (params?.mode === 'timer' && params?.duration) {
            const duration = params.duration;
            setIsTimerMode(true);
            setTimerDuration(duration);
            
            isTimerModeRef.current = true;
            timerDurationRef.current = duration;
            
            setTime(duration);
            setIsRunning(true);
            setHasStarted(true);
            
            startTimeRef.current = Date.now();
            accumulatedTimeRef.current = 0;
            
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
            requestRef.current = requestAnimationFrame(updateTimer);
            
            navigation.setParams({ mode: undefined, duration: undefined });
        }
    }, [params, updateTimer, navigation]);

    useEffect(() => {
        return () => {
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
        };
    }, []);

    // Formatted time components for main display
    const formatted = formatTime(time);
    const formattedCurrentLap = formatTime(currentLapTime);
    const formattedTimer = formatTimerTime(time);

    // Dotted circle tick coordinates
    const dots = Array.from({ length: 60 }).map((_, i) => {
        const angle = (i * 6 * Math.PI) / 180;
        const radius = 94;
        const cx = 120;
        const cy = 120;
        return {
            x: cx + radius * Math.cos(angle),
            y: cy + radius * Math.sin(angle)
        };
    });

    const elapsed = isTimerMode ? (timerDuration - time) : time;
    const indicatorAngle = (elapsed / 60000) * 2 * Math.PI - Math.PI / 2;
    const indicatorRadius = 94;
    const indicatorX = 120 + indicatorRadius * Math.cos(indicatorAngle);
    const indicatorY = 120 + indicatorRadius * Math.sin(indicatorAngle);

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

            <View style={styles.dialContainer}>
                <Svg width={240} height={240} viewBox="0 0 240 240">
                    <Defs>
                        <LinearGradient id="ringGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                            <Stop offset="0%" stopColor="#222222" stopOpacity="0.2" />
                            <Stop offset="60%" stopColor="#333333" stopOpacity="0.4" />
                            <Stop offset="100%" stopColor="#E53935" stopOpacity="0.8" />
                        </LinearGradient>
                    </Defs>

                    <Circle cx="120" cy="120" r="108" stroke="url(#ringGlow)" strokeWidth="6" fill="none" />

                    {dots.map((dot, index) => (
                        <Circle
                            key={index}
                            cx={dot.x}
                            cy={dot.y}
                            r={index % 5 === 0 ? 1.5 : 1}
                            fill={index % 5 === 0 ? "#777777" : "#444444"}
                        />
                    ))}

                    <Circle cx={indicatorX} cy={indicatorY} r={4.5} fill="#E53935" />
                </Svg>

                <View style={styles.timeTextContainer}>
                    <View style={styles.mainTimeRow}>
                        {isTimerMode ? (
                            <>
                                {parseInt(formattedTimer.hours) > 0 && (
                                    <Text style={[styles.mainTimeText, styles.whiteText]}>
                                        {formattedTimer.hours}:
                                    </Text>
                                )}
                                <Text style={[styles.mainTimeText, styles.whiteText]}>
                                    {formattedTimer.minutes}:
                                </Text>
                                <Text style={[styles.mainTimeText, styles.redText]}>
                                    {formattedTimer.seconds}
                                </Text>
                            </>
                        ) : (
                            <>
                                <Text style={[styles.mainTimeText, styles.whiteText]}>
                                    {formatted.minutes}:
                                </Text>
                                <Text style={[styles.mainTimeText, styles.redText]}>
                                    {formatted.seconds}.{formatted.hundredths}
                                </Text>
                            </>
                        )}
                    </View>
                    {isTimerMode ? (
                        <Text style={styles.lapTimeText}>
                            Timer
                        </Text>
                    ) : (
                        <Text style={styles.lapTimeText}>
                            {formattedCurrentLap.formattedTotal}
                        </Text>
                    )}
                </View>
            </View>

            <View style={styles.listContainer}>
                {!isTimerMode && laps.length > 0 && (
                    <>
                        <View style={styles.tableHeader}>
                            <Text style={[styles.headerCol, styles.colLeft]}>Lap</Text>
                            <Text style={[styles.headerCol, styles.colCenter]}>Lap time</Text>
                            <Text style={[styles.headerCol, styles.colRight]}>Total</Text>
                        </View>

                        <FlatList
                            data={laps}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <View style={styles.tableRow}>
                                    <Text style={[styles.rowText, styles.colLeft]}>{item.lapNum}</Text>
                                    <Text style={[styles.rowText, styles.colCenter]}>{item.lapTime}</Text>
                                    <Text style={[styles.rowText, styles.colRight]}>{item.totalTime}</Text>
                                </View>
                            )}
                            contentContainerStyle={styles.listContent}
                            showsVerticalScrollIndicator={false}
                        />
                    </>
                )}
            </View>

            {/* Controls Bar */}
            <View style={styles.controlsBar}>
                {isTimerMode ? (
                    <>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={handleCancel}
                        >
                            <Text style={{ color: "#FFFFFF", fontSize: 15, fontWeight: "600" }}>Cancel</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.controlButton, styles.centerButton]}
                            onPress={handleStartPause}
                        >
                            {isRunning ? (
                                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                                    <Path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="#FFFFFF" />
                                </Svg>
                            ) : (
                                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                                    <Path d="M8 5v14l11-7z" fill="#FFFFFF" />
                                </Svg>
                            )}
                        </TouchableOpacity>

                        <View style={{ width: 76 }} />
                    </>
                ) : (
                    <>
                        {hasStarted ? (
                            <TouchableOpacity
                                style={[
                                    styles.controlButton,
                                    styles.sideButton,
                                    isRunning && styles.disabledButton
                                ]}
                                onPress={handleReset}
                                disabled={isRunning}
                            >
                                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                                    <Path
                                        d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"
                                        fill="#FFFFFF"
                                    />
                                </Svg>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.placeholderButton} />
                        )}

                        {/* Start / Pause Button */}
                        <TouchableOpacity
                            style={[styles.controlButton, styles.centerButton]}
                            onPress={handleStartPause}
                        >
                            {isRunning ? (
                                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                                    <Path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="#FFFFFF" />
                                </Svg>
                            ) : (
                                // Play Icon
                                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                                    <Path d="M8 5v14l11-7z" fill="#FFFFFF" />
                                </Svg>
                            )}
                        </TouchableOpacity>

                        {/* Flag (Lap) Button */}
                        {hasStarted ? (
                            <TouchableOpacity
                                style={[
                                    styles.controlButton,
                                    styles.sideButton,
                                    !isRunning && styles.disabledButton
                                ]}
                                onPress={handleLap}
                                disabled={!isRunning}
                            >
                                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                                    <Path
                                        d="M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6z"
                                        fill="#FFFFFF"
                                    />
                                </Svg>
                            </TouchableOpacity>
                        ) : (
                            <View style={styles.placeholderButton} />
                        )}
                    </>
                )}
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
    listContainer: {
        flex: 1,
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
    dialContainer: {
        height: 250,
        justifyContent: "center",
        alignItems: "center",
        marginVertical: 10
    },
    timeTextContainer: {
        position: "absolute",
        alignItems: "center"
    },
    mainTimeRow: {
        flexDirection: "row",
        alignItems: "baseline"
    },
    mainTimeText: {
        fontSize: 42,
        fontWeight: "700",
        ...Platform.select({
            ios: {
                fontVariant: ["tabular-nums"]
            },
            android: {
                fontStyle: "normal"
            }
        })
    },
    whiteText: {
        color: "#FFFFFF"
    },
    redText: {
        color: "#E53935"
    },
    lapTimeText: {
        fontSize: 15,
        color: "#8E8E93",
        marginTop: 4,
        ...Platform.select({
            ios: {
                fontVariant: ["tabular-nums"]
            },
            android: {
                fontStyle: "normal"
            }
        })
    },
    tableHeader: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#1C1C1E",
        paddingBottom: 10,
        marginTop: 20,
        marginHorizontal: 10
    },
    headerCol: {
        fontSize: 14,
        color: "#8E8E93",
        fontWeight: "500"
    },
    colLeft: {
        flex: 1,
        textAlign: "left"
    },
    colCenter: {
        flex: 2,
        textAlign: "center"
    },
    colRight: {
        flex: 2,
        textAlign: "right"
    },
    listContent: {
        paddingHorizontal: 10,
        paddingTop: 10
    },
    tableRow: {
        flexDirection: "row",
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: "#1C1C1E"
    },
    rowText: {
        fontSize: 16,
        color: "#FFFFFF",
        ...Platform.select({
            ios: {
                fontVariant: ["tabular-nums"]
            },
            android: {
                fontStyle: "normal"
            }
        })
    },
    controlsBar: {
        flexDirection: "row",
        justifyContent: "space-evenly",
        alignItems: "center",
        paddingBottom: Platform.OS === "ios" ? 34 : 24,
        bottom:0,        
        
    },
    controlButton: {
        justifyContent: "center",
        alignItems:"center"
    },
    sideButton: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: "#1C1C1E"
    },
    centerButton: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: "#E53935"
    },
    cancelButton: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: "#1C1C1E",
        justifyContent: "center",
        alignItems: "center"
    },
    disabledButton: {
        opacity: 0.3
    },
    placeholderButton: {
        width: 54
    }
});

export default StopWatchScreen;