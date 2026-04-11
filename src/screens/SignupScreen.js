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

export default function SignupScreen({ navigation, onRegister }) {
  const { width } = useWindowDimensions();
  const compact = width < 380;
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError('');
    if (!fullName.trim() || !email.trim() || !phone.trim() || !pinCode.trim() || !password.trim()) {
      setError('Please fill all required fields.');
      return;
    }
    if (pinCode.length < 5) {
      setError('Please enter a valid pin code.');
      return;
    }

    setLoading(true);
    await wait(450);

    const result = onRegister({ fullName, email, phone, pinCode, password });
    if (!result.ok) {
      setLoading(false);
      setError(result.error);
      return;
    }

    setLoading(false);
    navigation.navigate('OtpVerification', {
      authType: 'signup',
      contact: result.contact
    });
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={[styles.inner, compact && styles.innerCompact]} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, compact && styles.cardCompact]}>
          <Text style={[styles.title, compact && styles.titleCompact]}>Create your account</Text>
          <Text style={styles.subtitle}>Register with email, phone, pin code, and password.</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputRow}>
              <MaterialIcons name="person" size={18} color="#66708a" />
              <TextInput style={styles.input} placeholder="Enter full name" value={fullName} onChangeText={setFullName} editable={!loading} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputRow}>
              <MaterialIcons name="email" size={18} color="#66708a" />
              <TextInput style={styles.input} placeholder="patient@demo.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" editable={!loading} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone</Text>
            <View style={styles.inputRow}>
              <MaterialIcons name="phone" size={18} color="#66708a" />
              <TextInput style={styles.input} placeholder="+91 98765 43210" value={phone} onChangeText={setPhone} keyboardType="phone-pad" editable={!loading} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pin Code</Text>
            <View style={styles.inputRow}>
              <MaterialIcons name="location-on" size={18} color="#66708a" />
              <TextInput style={styles.input} placeholder="800001" value={pinCode} onChangeText={setPinCode} keyboardType="numeric" editable={!loading} />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputRow}>
              <MaterialIcons name="lock" size={18} color="#66708a" />
              <TextInput
                style={styles.input}
                placeholder="Create password"
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

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity disabled={loading} style={[styles.registerButton, loading && styles.buttonDisabled]} onPress={handleRegister}>
            {loading ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.registerText}>Register</Text>}
          </TouchableOpacity>

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already registered?</Text>
            <TouchableOpacity disabled={loading} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign in</Text>
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
  inner: {
    padding: 18,
    flexGrow: 1,
    justifyContent: 'center'
  },
  innerCompact: {
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
    marginBottom: 13
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
  registerButton: {
    marginTop: 6,
    backgroundColor: '#4f7cff',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center'
  },
  registerText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700'
  },
  loginRow: {
    marginTop: 16,
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
    marginTop: 2,
    marginBottom: 6,
    fontSize: 12
  }
});
