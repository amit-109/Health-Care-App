import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AntDesign, Feather, MaterialIcons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import OtpVerificationScreen from './src/screens/OtpVerificationScreen';
import HomeScreen from './src/screens/HomeScreen';
import AppointmentsScreen from './src/screens/AppointmentsScreen';
import PrescriptionsScreen from './src/screens/PrescriptionsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { prescriptions } from './src/data/dummyData';
import {
  extractAuthToken,
  extractUser,
  loginWithPassword,
  registerUser,
  sendLoginOtp,
  verifyLoginOtp,
  verifySignupOtp
} from './src/api/auth';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const normalizePhone = (value = '') => value.replace(/\D/g, '');

const createUserProfile = (user = {}, fallback = {}) => ({
  id: user.id || user.userId || user.UserId || fallback.id || fallback.userId || 0,
  name: user.fullName || user.name || fallback.name || 'Patient',
  email: user.email || fallback.email || '',
  phone: user.phone || user.phoneNumber || fallback.phone || fallback.phoneNumber || '',
  age: user.age || fallback.age || 28,
  gender: user.gender || fallback.gender || 'Not specified',
  bloodGroup: user.bloodGroup || fallback.bloodGroup || 'O+',
  city: user.city || fallback.city || 'Unknown',
  address: user.address || fallback.address || 'Not available',
  landmark: user.landmark || fallback.landmark || '',
  houseNumber: user.houseNumber || fallback.houseNumber || '',
  role: user.role || fallback.role || 'patient',
  token: user.token || fallback.token || '',
  lastVisit: user.lastVisit || fallback.lastVisit || '2026-04-05',
  nextAppointment: user.nextAppointment || fallback.nextAppointment || '2026-04-26',
  message:
    user.message ||
    fallback.message ||
    'Your doctor is ready for follow-up and your health summary is updated.'
});

const getErrorMessage = (error, fallback) => error?.message || fallback;

function AppContent() {
  const insets = useSafeAreaInsets();
  const toastTimerRef = useRef(null);
  const [user, setUser] = useState(null);
  const [pendingAuth, setPendingAuth] = useState(null);
  const [toast, setToast] = useState(null);
  const [theme] = useState({ primary: '#4f7cff', background: '#f5f7ff' });

  const showToast = (message, type = 'info') => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    setToast({ message, type });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 2400);
  };

  const screenOptions = useMemo(
    () => ({
      headerShown: false,
      tabBarActiveTintColor: theme.primary,
      tabBarInactiveTintColor: '#7a7a7a',
      tabBarStyle: [
        styles.tabBar,
        {
          height: 58 + Math.max(insets.bottom, 8),
          paddingBottom: Math.max(insets.bottom, 8),
          paddingTop: 6
        }
      ],
      tabBarItemStyle: styles.tabBarItem,
      tabBarLabelStyle: styles.tabBarLabel
    }),
    [insets.bottom, theme.primary]
  );

  const handlePasswordLogin = async (identifier, password) => {
    try {
      const payload = await loginWithPassword({
        emailOrPhone: identifier.trim(),
        password
      });
      const apiUser = extractUser(payload) || {};
      const token = extractAuthToken(payload);
      const resolvedUser = createUserProfile(
        {
          ...apiUser,
          token
        },
        {
          email: identifier.includes('@') ? identifier.trim().toLowerCase() : '',
          phone: identifier.includes('@') ? '' : normalizePhone(identifier)
        }
      );

      setUser(resolvedUser);
      showToast(`Welcome back, ${resolvedUser.name.split(' ')[0]}.`, 'success');
      return { ok: true };
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to sign in. Please try again.');
      showToast(message, 'error');
      return { ok: false, error: message };
    }
  };

  const handleSendOtpLogin = async (identifier) => {
    const phoneNumber = normalizePhone(identifier.trim());

    if (phoneNumber.length < 10) {
      const message = 'Please enter a valid phone number for OTP login.';
      showToast(message, 'error');
      return { ok: false, error: message };
    }

    try {
      await sendLoginOtp({ phoneNumber });
      setPendingAuth({
        type: 'login-otp',
        phoneNumber,
        contact: phoneNumber
      });
      showToast('OTP sent successfully.', 'success');
      return { ok: true, contact: phoneNumber };
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to send OTP. Please try again.');
      showToast(message, 'error');
      return { ok: false, error: message };
    }
  };

  const handleRegister = async (registrationData) => {
    try {
      await registerUser(registrationData);
      setPendingAuth({
        type: 'signup',
        user: registrationData,
        phoneNumber: normalizePhone(registrationData.phoneNumber),
        contact: registrationData.phoneNumber
      });
      showToast('Registration OTP sent.', 'success');
      return { ok: true, contact: registrationData.phoneNumber };
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to register. Please try again.');
      showToast(message, 'error');
      return { ok: false, error: message };
    }
  };

  const handleVerifyOtp = async (inputOtp) => {
    if (!pendingAuth) {
      showToast('No OTP request is active.', 'error');
      return { ok: false, error: 'No OTP request is active. Please start again.' };
    }

    try {
      if (pendingAuth.type === 'signup') {
        const payload = await verifySignupOtp({
          phoneNumber: pendingAuth.phoneNumber,
          otp: inputOtp
        });
        const apiUser = extractUser(payload) || {};
        const token = extractAuthToken(payload);
        const resolvedUser = createUserProfile(
          {
            ...apiUser,
            token
          },
          pendingAuth.user
        );

        setUser(resolvedUser);
        showToast('Account created successfully.', 'success');
      } else {
        const payload = await verifyLoginOtp({
          phoneNumber: pendingAuth.phoneNumber,
          otp: inputOtp
        });
        const apiUser = extractUser(payload) || {};
        const token = extractAuthToken(payload);
        const resolvedUser = createUserProfile(
          {
            ...apiUser,
            token
          },
          {
            phone: pendingAuth.phoneNumber
          }
        );

        setUser(resolvedUser);
        showToast('OTP verified successfully.', 'success');
      }

      setPendingAuth(null);
      return { ok: true };
    } catch (error) {
      const message = getErrorMessage(error, 'Invalid or expired OTP. Please try again.');
      showToast(message, 'error');
      return { ok: false, error: message };
    }
  };

  const handleResendOtp = async () => {
    if (!pendingAuth) {
      showToast('No OTP request is active.', 'error');
      return { ok: false, error: 'No OTP request is active. Please start again.' };
    }

    try {
      if (pendingAuth.type === 'login-otp') {
        await sendLoginOtp({ phoneNumber: pendingAuth.phoneNumber });
      } else {
        await registerUser(pendingAuth.user);
      }

      showToast('OTP resent successfully.', 'success');
      return { ok: true };
    } catch (error) {
      const message = getErrorMessage(error, 'Unable to resend OTP. Please try again.');
      showToast(message, 'error');
      return { ok: false, error: message };
    }
  };

  const handleAppointmentCreated = () => {
    showToast('Appointment booked successfully.', 'success');
  };

  const handleLogout = () => {
    setUser(null);
    setPendingAuth(null);
    showToast('Logged out successfully.', 'info');
  };

  const toastTop = insets.top + (user ? 12 : 18);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <NavigationContainer>
        {!user ? (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login">
              {(props) => <LoginScreen {...props} onPasswordLogin={handlePasswordLogin} onOtpLogin={handleSendOtpLogin} />}
            </Stack.Screen>
            <Stack.Screen name="Signup">
              {(props) => <SignupScreen {...props} onRegister={handleRegister} />}
            </Stack.Screen>
            <Stack.Screen name="OtpVerification">
              {(props) => (
                <OtpVerificationScreen
                  {...props}
                  authType={pendingAuth?.type}
                  contact={pendingAuth?.contact}
                  onVerifyOtp={handleVerifyOtp}
                  onResendOtp={handleResendOtp}
                />
              )}
            </Stack.Screen>
          </Stack.Navigator>
        ) : (
          <Tab.Navigator screenOptions={screenOptions}>
            <Tab.Screen
              name="Home"
              children={() => <HomeScreen user={user} prescriptions={prescriptions} />}
              options={{
                tabBarIcon: ({ color }) => <AntDesign name="home" size={20} color={color} />
              }}
            />
            <Tab.Screen
              name="Appointments"
              children={() => <AppointmentsScreen user={user} onAppointmentCreated={handleAppointmentCreated} />}
              options={{
                tabBarIcon: ({ color }) => <MaterialIcons name="event-note" size={20} color={color} />
              }}
            />
            <Tab.Screen
              name="Prescriptions"
              children={() => <PrescriptionsScreen prescriptions={prescriptions} />}
              options={{
                tabBarIcon: ({ color }) => <Feather name="clipboard" size={20} color={color} />
              }}
            />
            <Tab.Screen
              name="Profile"
              children={() => <ProfileScreen user={user} onLogout={handleLogout} />}
              options={{
                tabBarIcon: ({ color }) => <AntDesign name="user" size={20} color={color} />
              }}
            />
          </Tab.Navigator>
        )}
      </NavigationContainer>

      {toast ? (
        <View
          pointerEvents="none"
          style={[
            styles.toast,
            styles[`toast${toast.type.charAt(0).toUpperCase()}${toast.type.slice(1)}`],
            { top: toastTop }
          ]}
        >
          <Text style={styles.toastText}>{toast.message}</Text>
        </View>
      ) : null}

      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  tabBar: {
    borderTopWidth: 0,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 10,
    backgroundColor: '#ffffff'
  },
  tabBarItem: {
    paddingVertical: 1
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2
  },
  toast: {
    position: 'absolute',
    left: 16,
    right: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 6
  },
  toastSuccess: {
    backgroundColor: '#2f9e62'
  },
  toastError: {
    backgroundColor: '#df5b5b'
  },
  toastInfo: {
    backgroundColor: '#395dff'
  },
  toastText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center'
  }
});
