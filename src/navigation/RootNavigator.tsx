import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { RootStackParamList } from "./types";
import HomeScreen from "../screens/HomeScreen";

const Tab = createBottomTabNavigator<RootStackParamList>();

const RootNavigator = () => {
    return (
        <NavigationContainer>
            <Tab.Navigator>
                <Tab.Screen name="Home" component={HomeScreen}/>
            </Tab.Navigator>
        </NavigationContainer>
    );
};

export default RootNavigator;