import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { RootStackParamList } from "./types";
import HomeScreen from "../screens/HomeScreen";
import WorldClockScreen from "../screens/WorldClockScreen";
import StopWatchScreen from "../screens/StopWatchScreen";
import TimerScreen from "../screens/TimerScreen";

import Alarm from "../assets/icons/Alarm";
import WorldClock from "../assets/icons/WorldClock";
import StopWatch from "../assets/icons/StopWatch";
import Timer from "../assets/icons/Timer";
import { TouchableOpacity } from "react-native";

const Tab = createBottomTabNavigator<RootStackParamList>();

const RootNavigator = () => {
    return (
        <NavigationContainer>
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    tabBarIcon: ({ color, size }) => {
                        if (route.name === "Home") {
                            return <Alarm width={size} height={size} color={color} />;
                        } else if (route.name === "WorldClockScreen") {
                            return <WorldClock width={size} height={size} color={color} />;
                        } else if (route.name === "StopWatchScreen") {
                            return <StopWatch width={size} height={size} color={color} />;
                        } else if (route.name === "TimerScreen") {
                            return <Timer width={size} height={size} color={color} />;
                        }
                        return null;
                    },
                    tabBarButton: (props) => (
                        <TouchableOpacity
                            {...props}
                            activeOpacity={1}
                        />
                    ),
                    tabBarStyle: {
                        backgroundColor: "#151515",
                        borderColor: "none"
                    },
                    tabBarActiveTintColor: "white",
                    tabBarInactiveTintColor: "gray",
                    tabBarActiveBackgroundColor: "transparent",
                })}
            >
                <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: "Alarm", headerShown: false }} />
                <Tab.Screen name="WorldClockScreen" component={WorldClockScreen} options={{ tabBarLabel: "World Clock", headerShown: false }} />
                <Tab.Screen name="StopWatchScreen" component={StopWatchScreen} options={{ tabBarLabel: "Stop Watch", headerShown: false }} />
                <Tab.Screen name="TimerScreen" component={TimerScreen} options={{ tabBarLabel: "Timer", headerShown: false }} />
            </Tab.Navigator>
        </NavigationContainer>
    );
};

export default RootNavigator;
