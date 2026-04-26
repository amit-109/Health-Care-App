import { useMemo, useState } from 'react';
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

export default function OtpVerificationScreen({ navigation, authType, contact, onVerifyOtp, onResendOtp }) {
  const { width } = useWindowDimensions();
  const compact = width < 380;
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const info = useMemo(() => `OTP sent to ${contact}. Please enter the code to continue.`, [contact]);

  const handleVerify = async () => {
    setError('');
    if (!code.trim()) {
      setError('Please enter the OTP code.');
      return;
    }

    setLoading(true);
    const result = await onVerifyOtp(code.trim());
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
    }
  };

  const handleResend = async () => {
    setError('');
    setResending(true);
    const result = await onResendOtp();
    setResending(false);
    if (!result.ok) {
      setError(result.error);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scrollContent, compact && styles.scrollContentCompact]} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, compact && styles.cardCompact]}>
          <Text style={[styles.title, compact && styles.titleCompact]}>{authType === 'signup' ? 'Verify registration' : 'Verify login'}</Text>
          <Text style={styles.subtitle}>
            {authType === 'signup'
              ? 'We sent a temporary code to your registered phone number. Enter it below to finish registration.'
              : 'We sent a temporary code to your phone number. Enter it below to continue.'}
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>One-time password</Text>
            <View style={styles.inputRow}>
              <MaterialIcons name="security" size={18} color="#66708a" />
              <TextInput
                style={styles.input}
                placeholder="123456"
                value={code}
                onChangeText={setCode}
                keyboardType="numeric"
                editable={!loading && !resending}
              />
            </View>
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoText}>{info}</Text>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity disabled={loading || resending} style={[styles.verifyButton, (loading || resending) && styles.buttonDisabled]} onPress={handleVerify}>
            {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.verifyText}>Verify OTP</Text>}
          </TouchableOpacity>

          <TouchableOpacity disabled={loading || resending} style={styles.resendButton} onPress={handleResend}>
            {resending ? <ActivityIndicator color="#4f7cff" /> : <Text style={styles.resendText}>Resend OTP</Text>}
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Change method?</Text>
            <TouchableOpacity disabled={loading || resending} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Back to login</Text>
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
  inputGroup: {
    marginBottom: 12
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
  infoCard: {
    backgroundColor: '#f7f9ff',
    borderRadius: 14,
    padding: 12,
    marginTop: 6
  },
  infoText: {
    color: '#5f6583',
    fontSize: 13,
    lineHeight: 19
  },
  verifyButton: {
    marginTop: 16,
    backgroundColor: '#4f7cff',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center'
  },
  verifyText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700'
  },
  resendButton: {
    marginTop: 12,
    alignItems: 'center',
    minHeight: 24,
    justifyContent: 'center'
  },
  resendText: {
    color: '#4f7cff',
    fontWeight: '700',
    fontSize: 13
  },
  loginRow: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'center'
  },
  loginText: {
    color: '#7d86a1',
    fontSize: 13
  },
  loginLink: {
    color: '#4f7cff',
    marginLeft: 8,
    fontWeight: '700',
    fontSize: 13
  },
  buttonDisabled: {
    opacity: 0.8
  },
  error: {
    color: '#c94a59',
    marginTop: 10,
    fontSize: 12
  }
});
