import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AntDesign, Feather, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import OtpVerificationScreen from './src/screens/OtpVerificationScreen';
import HomeScreen from './src/screens/HomeScreen';
import AppointmentsScreen from './src/screens/AppointmentsScreen';
import PrescriptionsScreen from './src/screens/PrescriptionsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { defaultUser, appointments, prescriptions } from './src/data/dummyData';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const createUserProfile = (user) => ({
  name: user.fullName || user.name,
  email: user.email,
  phone: user.phone,
  age: user.age || 28,
  gender: user.gender || 'Not specified',
  bloodGroup: user.bloodGroup || 'O+',
  city: user.city || 'Unknown',
  address: user.address || user.pinCode ? `Pin code ${user.pinCode}` : 'Not available',
  lastVisit: '2026-04-05',
  nextAppointment: '2026-04-26',
  message: 'Your doctor is ready for follow-up and your health summary is updated.'
});

const normalizePhone = (value) => value.replace(/\D/g, '');

function AppContent() {
  const insets = useSafeAreaInsets();
  const toastTimerRef = useRef(null);
  const [user, setUser] = useState(null);
  const [registeredUsers, setRegisteredUsers] = useState([defaultUser]);
  const [pendingAuth, setPendingAuth] = useState(null);
  const [pendingOtp, setPendingOtp] = useState('');
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

  const screenOptions = useMemo(() => ({
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
  }), [insets.bottom, theme.primary]);

  const findUser = (identifier) =>
    registeredUsers.find(
      (item) =>
        item.email.toLowerCase() === identifier.toLowerCase() ||
        normalizePhone(item.phone) === normalizePhone(identifier)
    );

  const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

  const handlePasswordLogin = (identifier, password) => {
    const existingUser = findUser(identifier.trim());
    if (!existingUser) {
      showToast('No user found with this email or phone.', 'error');
      return { ok: false, error: 'No user found with this email or phone.' };
    }
    if (existingUser.password !== password) {
      showToast('Incorrect password. Please try again.', 'error');
      return { ok: false, error: 'Incorrect password. Please try again.' };
    }
    setUser(createUserProfile(existingUser));
    showToast(`Welcome back, ${existingUser.name.split(' ')[0]}.`, 'success');
    return { ok: true };
  };

  const handleSendOtpLogin = (identifier) => {
    const trimmedIdentifier = identifier.trim();
    const phoneDigits = normalizePhone(trimmedIdentifier);
    const existingUser = findUser(trimmedIdentifier);

    if (!existingUser && phoneDigits.length !== 10) {
      showToast('No user found with this email or phone.', 'error');
      return { ok: false, error: 'No user found with this email or phone.' };
    }

    const otpUser =
      existingUser ||
      {
        ...defaultUser,
        name: 'Demo Patient',
        fullName: 'Demo Patient',
        phone: phoneDigits,
        email: `demo${phoneDigits}@patient.local`
      };

    const otp = generateOtp();
    setPendingAuth({ type: 'login-otp', user: otpUser, contact: otpUser.phone });
    setPendingOtp(otp);
    showToast('OTP sent successfully.', 'success');
    return { ok: true, otp, contact: otpUser.phone };
  };

  const handleRegister = (registrationData) => {
    const existingEmail = registeredUsers.some((item) => item.email.toLowerCase() === registrationData.email.toLowerCase());
    const existingPhone = registeredUsers.some((item) => item.phone === registrationData.phone);
    if (existingEmail || existingPhone) {
      showToast('User already exists with this email or phone.', 'error');
      return { ok: false, error: 'A user already exists with this email or phone number.' };
    }

    const otp = generateOtp();
    setPendingAuth({ type: 'signup', user: registrationData, contact: `${registrationData.email} and ${registrationData.phone}` });
    setPendingOtp(otp);
    showToast('Registration OTP sent.', 'success');
    return { ok: true, otp, contact: `${registrationData.email} and ${registrationData.phone}` };
  };

  const handleVerifyOtp = (inputOtp) => {
    if (!pendingAuth) {
      showToast('No OTP request is active.', 'error');
      return { ok: false, error: 'No OTP request is active. Please start again.' };
    }
    if (inputOtp.trim() !== pendingOtp) {
      showToast('Invalid or expired OTP.', 'error');
      return { ok: false, error: 'Invalid or expired OTP. Please try again.' };
    }

    if (pendingAuth.type === 'signup') {
      const newUser = {
        ...pendingAuth.user,
        name: pendingAuth.user.fullName,
        address: `Pin code ${pendingAuth.user.pinCode}`
      };
      setRegisteredUsers((prev) => [...prev, newUser]);
      setUser(createUserProfile(newUser));
      showToast('Account created successfully.', 'success');
    } else {
      setUser(createUserProfile(pendingAuth.user));
      showToast('OTP verified successfully.', 'success');
    }

    setPendingAuth(null);
    setPendingOtp('');
    return { ok: true };
  };

  const handleResendOtp = () => {
    if (!pendingAuth) {
      showToast('No OTP request is active.', 'error');
      return { ok: false, error: 'No OTP request is active. Please start again.' };
    }
    const otp = generateOtp();
    setPendingOtp(otp);
    showToast('OTP resent successfully.', 'success');
    return { ok: true, otp };
  };

  const handleLogout = () => {
    setUser(null);
    setPendingAuth(null);
    setPendingOtp('');
    showToast('Logged out successfully.', 'info');
  };

  const toastTop = insets.top + (user ? 12 : 18);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <NavigationContainer>
        {!user ? (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login">
              {(props) => (
                <LoginScreen
                  {...props}
                  onPasswordLogin={handlePasswordLogin}
                  onOtpLogin={handleSendOtpLogin}
                />
              )}
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
                  otp={pendingOtp}
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
              children={() => <HomeScreen user={user} appointments={appointments} prescriptions={prescriptions} />}
              options={{
                tabBarIcon: ({ color }) => <AntDesign name="home" size={20} color={color} />
              }}
            />
            <Tab.Screen
              name="Appointments"
              children={() => <AppointmentsScreen appointments={appointments} />}
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
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
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
