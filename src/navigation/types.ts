export type RootStackParamList = {
    Home : undefined,
    WorldClockScreen:undefined,
    StopWatchScreen: { mode?: 'timer'; duration?: number; timestamp?: number } | undefined,
    TimerScreen:undefined
}

