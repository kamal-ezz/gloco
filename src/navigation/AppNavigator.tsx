import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuthStore } from '../stores/authStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useAppColorScheme } from '../lib/useAppColorScheme';
import { AppSplashScreen } from '../components/AppSplashScreen';
import { SignInScreen } from '../screens/SignInScreen';
import { SignUpScreen } from '../screens/SignUpScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { AddEntryScreen } from '../screens/AddEntryScreen';
import { EntryDetailsScreen } from '../screens/EntryDetailsScreen';
import { ContactsScreen } from '../screens/ContactsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import type { AppTabParamList, AuthStackParamList, RootStackParamList } from '../types/navigation';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<AppTabParamList>();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerTitleAlign: 'center',
        tabBarActiveTintColor: '#2563eb',
        tabBarInactiveTintColor: '#64748b',
        tabBarIcon: ({ color, size, focused }) => {
          const iconName =
            route.name === 'HomeTab'
              ? focused
                ? 'home'
                : 'home-outline'
              : route.name === 'AddEntryTab'
                ? focused
                  ? 'add-circle'
                  : 'add-circle-outline'
                : focused
                  ? 'settings'
                  : 'settings-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        }
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="AddEntryTab"
        component={AddEntryScreen}
        options={{ title: 'Add Entry' }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator>
      <AuthStack.Screen name="SignIn" component={SignInScreen} options={{ title: 'Sign In' }} />
      <AuthStack.Screen name="SignUp" component={SignUpScreen} options={{ title: 'Sign Up' }} />
    </AuthStack.Navigator>
  );
}

function AppStackNavigator() {
  return (
    <RootStack.Navigator>
      <RootStack.Screen name="MainTabs" component={Tabs} options={{ headerShown: false }} />
      <RootStack.Screen
        name="EntryDetails"
        component={EntryDetailsScreen}
        options={{
          title: 'Entry Details',
          presentation: 'modal',
          animation: 'slide_from_bottom'
        }}
      />
      <RootStack.Screen
        name="Contacts"
        component={ContactsScreen}
        options={{ title: 'Emergency Contacts' }}
      />
    </RootStack.Navigator>
  );
}

export function AppNavigator() {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  const hasCompletedOnboarding = useSettingsStore((s) => s.hasCompletedOnboarding);
  const colorScheme = useAppColorScheme();

  if (loading) return <AppSplashScreen />;

  return (
    <NavigationContainer theme={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      {!hasCompletedOnboarding ? (
        <OnboardingScreen />
      ) : user ? (
        <AppStackNavigator />
      ) : (
        <AuthNavigator />
      )}
    </NavigationContainer>
  );
}
