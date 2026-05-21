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
import { C } from '../config/theme';

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

    if (mode === 'password') {
      if (!password) {
        setLoading(false);
        setError('Please enter your password.');
        return;
      }

      const result = await onPasswordLogin(identifier.trim(), password);
      if (!result.ok) {
        setError(result.error);
      }
    } else {
      const result = await onOtpLogin(identifier.trim());
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
          <Text style={[styles.subtitle, compact && styles.subtitleCompact]}>Login with password or receive OTP on your phone.</Text>

          <TouchableOpacity disabled={loading} style={styles.aboutButton} onPress={() => navigation.navigate('About')}>
            <View style={styles.aboutIcon}>
              <MaterialIcons name="info-outline" size={18} color="#1c35ff" />
            </View>
            <View style={styles.aboutCopy}>
              <Text style={styles.aboutTitle}>About this app</Text>
              <Text style={styles.aboutText}>Care services, appointment flow, and patient support.</Text>
            </View>
            <MaterialIcons name="arrow-forward" size={18} color="#1c35ff" />
          </TouchableOpacity>

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
              <MaterialIcons name={mode === 'password' ? 'email' : 'phone'} size={18} color="#66708a" />
              <TextInput
                style={styles.input}
                placeholder={mode === 'password' ? 'patient@demo.com' : '+91 98765 43210'}
                value={identifier}
                onChangeText={setIdentifier}
                keyboardType={mode === 'password' ? 'email-address' : 'phone-pad'}
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
  container:            { flex: 1, backgroundColor: C.primary },
  scrollContent:        { flexGrow: 1, justifyContent: 'center', padding: 18 },
  scrollContentCompact: { padding: 14 },
  card:        { backgroundColor: C.bgCard, borderRadius: 26, padding: 22, shadowColor: C.primaryDark, shadowOpacity: 0.2, shadowRadius: 22, elevation: 10, borderWidth: 1, borderColor: C.border },
  cardCompact: { padding: 18, borderRadius: 20 },
  title:        { fontSize: 24, fontWeight: '800', marginBottom: 6, color: C.textPrimary },
  titleCompact: { fontSize: 21 },
  subtitle:        { fontSize: 14, color: C.textSecondary, marginBottom: 18, lineHeight: 21 },
  subtitleCompact: { fontSize: 13 },
  modeRow:    { flexDirection: 'row', marginBottom: 16, borderRadius: 16, backgroundColor: C.primaryLight, padding: 4 },
  aboutButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bgMuted, borderRadius: 18, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: C.border, gap: 10 },
  aboutIcon:  { width: 38, height: 38, borderRadius: 14, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  aboutCopy:  { flex: 1 },
  aboutTitle: { color: C.textPrimary, fontSize: 13, fontWeight: '800' },
  aboutText:  { color: C.textSecondary, fontSize: 12, fontWeight: '500', marginTop: 2, lineHeight: 17 },
  modeButton:     { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  modeActive:     { backgroundColor: C.primary },
  modeText:       { color: C.textSecondary, fontWeight: '700', fontSize: 13 },
  modeTextActive: { color: '#fff' },
  inputGroup: { marginBottom: 14 },
  label:      { fontSize: 13, color: C.textSecondary, marginBottom: 7, fontWeight: '600' },
  inputRow:   { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bgMuted, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 11, borderWidth: 1, borderColor: C.border },
  input:      { marginLeft: 10, fontSize: 15, flex: 1, color: C.textPrimary },
  loginButton:    { marginTop: 6, backgroundColor: C.primary, borderRadius: 16, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', shadowColor: C.primaryDark, shadowOpacity: 0.22, shadowRadius: 10, elevation: 4 },
  buttonDisabled: { opacity: 0.8 },
  loginText:  { color: '#fff', fontSize: 15, fontWeight: '700' },
  signupRow:  { marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  signupText: { color: C.textMuted, fontSize: 13 },
  signupLink: { color: C.primary, marginLeft: 8, fontWeight: '700', fontSize: 13 },
  error:      { color: C.danger, marginTop: 2, marginBottom: 6, fontSize: 12 }
});
