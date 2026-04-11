import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function LoginScreen({ navigation, onPasswordLogin, onOtpLogin }) {
  const { width } = useWindowDimensions();
  const compact = width < 380;
  const [mode, setMode] = useState('password');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!identifier.trim()) {
      setError('Please enter your email or phone number.');
      return;
    }

    setLoading(true);
    await wait(450);

    if (mode === 'password') {
      if (!password) {
        setLoading(false);
        setError('Please enter your password.');
        return;
      }
      const result = onPasswordLogin(identifier.trim(), password);
      if (!result.ok) {
        setError(result.error);
      }
    } else {
      const result = onOtpLogin(identifier.trim());
      if (!result.ok) {
        setLoading(false);
        setError(result.error);
        return;
      }
      navigation.navigate('OtpVerification', {
        authType: 'login-otp',
        contact: result.contact
      });
    }

    setLoading(false);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scrollContent, compact && styles.scrollContentCompact]} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, compact && styles.cardCompact]}>
          <Text style={[styles.title, compact && styles.titleCompact]}>Patient Sign In</Text>
          <Text style={[styles.subtitle, compact && styles.subtitleCompact]}>
            Login with password or receive OTP on email and phone.
          </Text>

          <View style={styles.modeRow}>
            <TouchableOpacity disabled={loading} onPress={() => setMode('password')} style={[styles.modeButton, mode === 'password' && styles.modeActive]}>
              <Text style={[styles.modeText, mode === 'password' && styles.modeTextActive]}>Password</Text>
            </TouchableOpacity>
            <TouchableOpacity disabled={loading} onPress={() => setMode('otp')} style={[styles.modeButton, mode === 'otp' && styles.modeActive]}>
              <Text style={[styles.modeText, mode === 'otp' && styles.modeTextActive]}>OTP</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email or phone</Text>
            <View style={styles.inputRow}>
              <MaterialIcons name="email" size={18} color="#66708a" />
              <TextInput
                style={styles.input}
                placeholder="patient@demo.com"
                value={identifier}
                onChangeText={setIdentifier}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>
          </View>

          {mode === 'password' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputRow}>
                <MaterialIcons name="lock" size={18} color="#66708a" />
                <TextInput
                  style={styles.input}
                  placeholder="Enter password"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  editable={!loading}
                />
                <TouchableOpacity disabled={loading} onPress={() => setShowPassword((prev) => !prev)} hitSlop={10}>
                  <MaterialIcons name={showPassword ? 'visibility-off' : 'visibility'} size={20} color="#66708a" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity disabled={loading} style={[styles.loginButton, loading && styles.buttonDisabled]} onPress={handleSubmit}>
            {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.loginText}>{mode === 'password' ? 'Sign In' : 'Send OTP'}</Text>}
          </TouchableOpacity>

          <View style={styles.helpCard}>
            <Text style={styles.helpText}>Demo password login</Text>
            <Text style={styles.helpNote}>patient@demo.com / patient123</Text>
          </View>

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>Need a new account?</Text>
            <TouchableOpacity disabled={loading} onPress={() => navigation.navigate('Signup')}>
              <Text style={styles.signupLink}>Register now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8ff'
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 18
  },
  scrollContentCompact: {
    padding: 14
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 22,
    shadowColor: '#2f3a4a',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 8
  },
  cardCompact: {
    padding: 18,
    borderRadius: 18
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 6,
    color: '#242a40'
  },
  titleCompact: {
    fontSize: 21
  },
  subtitle: {
    fontSize: 14,
    color: '#6d7484',
    marginBottom: 18,
    lineHeight: 21
  },
  subtitleCompact: {
    fontSize: 13
  },
  modeRow: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 16,
    backgroundColor: '#eef3ff',
    padding: 4
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12
  },
  modeActive: {
    backgroundColor: '#4f7cff'
  },
  modeText: {
    color: '#5a5f6e',
    fontWeight: '700',
    fontSize: 13
  },
  modeTextActive: {
    color: '#ffffff'
  },
  inputGroup: {
    marginBottom: 14
  },
  label: {
    fontSize: 13,
    color: '#5a5f6e',
    marginBottom: 7
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f5ff',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11
  },
  input: {
    marginLeft: 10,
    fontSize: 15,
    flex: 1,
    color: '#1f2540'
  },
  loginButton: {
    marginTop: 6,
    backgroundColor: '#4f7cff',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonDisabled: {
    opacity: 0.8
  },
  loginText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700'
  },
  helpCard: {
    marginTop: 14,
    backgroundColor: '#f7f9ff',
    borderRadius: 14,
    padding: 12
  },
  helpText: {
    color: '#7d86a1',
    fontSize: 12
  },
  helpNote: {
    color: '#4f7cff',
    marginTop: 4,
    fontWeight: '600',
    fontSize: 13
  },
  signupRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  signupText: {
    color: '#7d86a1',
    fontSize: 13
  },
  signupLink: {
    color: '#4f7cff',
    marginLeft: 8,
    fontWeight: '700',
    fontSize: 13
  },
  error: {
    color: '#c94a59',
    marginTop: 2,
    marginBottom: 6,
    fontSize: 12
  }
});
