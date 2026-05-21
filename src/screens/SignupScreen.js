import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
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
import * as ImagePicker from 'expo-image-picker';
import { C } from '../config/theme';

const TABS = ['Personal Info', 'Address'];
const ALLOWED_PIN_CODES = new Set(['110014', '110003', '110048', '110019', '110065', '110017', '110049', '110029', '110024']);
const GENDER_OPTIONS = ['Male', 'Female', 'Other'];

function Field({ icon, placeholder, value, onChangeText, keyboardType, secureTextEntry, autoCapitalize, editable, right }) {
  return (
    <View style={s.inputRow}>
      <MaterialIcons name={icon} size={18} color="#66708a" />
      <TextInput
        style={s.input}
        placeholder={placeholder}
        placeholderTextColor="#a0a8c0"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        editable={editable}
      />
      {right}
    </View>
  );
}

export default function SignupScreen({ navigation, onRegister }) {
  const { width } = useWindowDimensions();
  const compact = width < 380;

  const [tab, setTab] = useState(0);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [genderMenuOpen, setGenderMenuOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [address, setAddress] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const showEmail = Boolean(fullName.trim());
  const showPhone = showEmail && Boolean(email.trim());
  const showGender = showPhone && Boolean(phone.trim());
  const showPinCode = showGender && Boolean(gender);
  const showPasswordField = showPinCode && Boolean(pincode.trim());
  const canContinuePersonal = showPasswordField && Boolean(password.trim());
  const showHouseNumber = Boolean(address.trim());
  const showLandmark = showHouseNumber && Boolean(houseNumber.trim());

  const pickProfileImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      setError('Permission to access photos is required.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8
    });

    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setProfileImage({
        uri: asset.uri,
        name: asset.fileName || 'profile-image.jpg',
        type: asset.mimeType || 'image/jpeg'
      });
      setError('');
    }
  };

  const validatePinCode = () => {
    const normalizedPinCode = pincode.trim();

    if (!/^\d{6}$/.test(normalizedPinCode)) {
      setError('Please enter a valid 6-digit pin code.');
      return false;
    }

    if (!ALLOWED_PIN_CODES.has(normalizedPinCode)) {
      setError('Service is not available in this area.');
      return false;
    }

    return true;
  };

  const validateTab0 = () => {
    if (!fullName.trim() || !email.trim() || !phone.trim() || !gender || !pincode.trim() || !password.trim()) {
      setError('Please fill all required fields.'); return false;
    }
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Please enter a valid phone number.'); return false;
    }
    if (!validatePinCode()) return false;
    return true;
  };

  const handleNext = () => {
    setError('');
    if (validateTab0()) setTab(1);
  };

  const handleRegister = async () => {
    setError('');
    if (!address.trim() || !houseNumber.trim()) {
      setError('Please fill address and house number.'); return;
    }
    setLoading(true);
    const result = await onRegister({
      name: fullName.trim(),
      email: email.trim(),
      phoneNumber: phone.trim(),
      gender,
      pinCode: pincode.trim(),
      password,
      address: address.trim(),
      houseNumber: houseNumber.trim(),
      landmark: landmark.trim(),
      role: 'patient',
      userProfileImageUrl: profileImage
    });
    setLoading(false);
    if (!result.ok) { setError(result.error); return; }
    navigation.navigate('OtpVerification', { authType: 'signup', contact: result.contact });
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={[s.inner, compact && s.innerCompact]} keyboardShouldPersistTaps="handled">
        <View style={[s.card, compact && s.cardCompact]}>
          <Text style={[s.title, compact && s.titleCompact]}>Create Account</Text>
          <Text style={s.subtitle}>Fill in your details to get started.</Text>

          {/* Tab bar */}
          <View style={s.tabBar}>
            {TABS.map((label, i) => (
              <TouchableOpacity
                key={label}
                style={[s.tabItem, tab === i && s.tabItemActive]}
                onPress={() => { setError(''); if (i === 1 && !validateTab0()) return; setTab(i); }}
              >
                <View style={[s.tabDot, tab >= i && s.tabDotActive]}>
                  <Text style={[s.tabDotText, tab >= i && s.tabDotTextActive]}>{i + 1}</Text>
                </View>
                <Text style={[s.tabLabel, tab === i && s.tabLabelActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
            <View style={s.tabLine} />
          </View>

          {/* Tab 0 — Personal Info */}
          {tab === 0 && (
            <View>
              <View style={s.profilePickerWrap}>
                <TouchableOpacity disabled={loading} style={s.profilePicker} onPress={pickProfileImage}>
                  {profileImage ? (
                    <Image source={{ uri: profileImage.uri }} style={s.profilePreview} />
                  ) : (
                    <View style={s.profilePlaceholder}>
                      <MaterialIcons name="add-a-photo" size={24} color="#1c35ff" />
                    </View>
                  )}
                </TouchableOpacity>
                <View style={s.profilePickerCopy}>
                  <Text style={s.label}>Profile Image</Text>
                  <Text style={s.helperText}>Upload patient photo for UserProfileImageUrl.</Text>
                  {profileImage ? (
                    <TouchableOpacity disabled={loading} onPress={() => setProfileImage(null)}>
                      <Text style={s.removeImageText}>Remove image</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>

              <View style={s.inputGroup}>
                <Text style={s.label}>Full Name *</Text>
                <Field icon="person" placeholder="Enter full name" value={fullName} onChangeText={setFullName} editable={!loading} />
              </View>
              {showEmail ? (
                <View style={s.inputGroup}>
                  <Text style={s.label}>Email *</Text>
                  <Field icon="email" placeholder="patient@demo.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" editable={!loading} />
                </View>
              ) : null}
              {showPhone ? (
                <View style={s.inputGroup}>
                  <Text style={s.label}>Phone *</Text>
                  <Field icon="phone" placeholder="+91 98765 43210" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoCapitalize="none" editable={!loading} />
                </View>
              ) : null}
              {showGender ? (
                <View style={s.inputGroup}>
                  <Text style={s.label}>Gender *</Text>
                  <TouchableOpacity
                    disabled={loading}
                    style={s.dropdownButton}
                    onPress={() => setGenderMenuOpen((current) => !current)}
                  >
                    <MaterialIcons name="person-outline" size={18} color="#66708a" />
                    <Text style={[s.dropdownText, !gender && s.dropdownPlaceholder]}>
                      {gender || 'Select gender'}
                    </Text>
                    <MaterialIcons name={genderMenuOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={20} color="#66708a" />
                  </TouchableOpacity>
                  {genderMenuOpen ? (
                    <View style={s.dropdownMenu}>
                      {GENDER_OPTIONS.map((option) => (
                        <TouchableOpacity
                          key={option}
                          disabled={loading}
                          style={s.dropdownItem}
                          onPress={() => {
                            setGender(option);
                            setGenderMenuOpen(false);
                            setError('');
                          }}
                        >
                          <Text style={[s.dropdownItemText, gender === option && s.dropdownItemTextActive]}>{option}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : null}
                </View>
              ) : null}
              {showPinCode ? (
                <View style={s.inputGroup}>
                  <Text style={s.label}>Pin Code *</Text>
                  <Field
                    icon="pin-drop"
                    placeholder="6-digit pin code"
                    value={pincode}
                    onChangeText={(value) => {
                      setPincode(value.replace(/\D/g, '').slice(0, 6));
                      setError('');
                    }}
                    keyboardType="numeric"
                    autoCapitalize="none"
                    editable={!loading}
                  />
                  <Text style={s.helperText}>Allowed pin codes: 110014, 110003, 110048, 110019, 110065, 110017, 110049, 110029, 110024.</Text>
                </View>
              ) : null}
              {showPasswordField ? (
                <View style={s.inputGroup}>
                  <Text style={s.label}>Password *</Text>
                  <Field
                    icon="lock"
                    placeholder="Create password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!passwordVisible}
                    autoCapitalize="none"
                    editable={!loading}
                    right={
                      <TouchableOpacity onPress={() => setPasswordVisible((p) => !p)} hitSlop={10}>
                        <MaterialIcons name={passwordVisible ? 'visibility-off' : 'visibility'} size={20} color="#66708a" />
                      </TouchableOpacity>
                    }
                  />
                </View>
              ) : null}

              {error ? <Text style={s.error}>{error}</Text> : null}

              <TouchableOpacity disabled={!canContinuePersonal} style={[s.primaryBtn, !canContinuePersonal && s.btnDisabled]} onPress={handleNext}>
                <Text style={s.primaryBtnText}>Next</Text>
                <MaterialIcons name="arrow-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {/* Tab 1 — Address */}
          {tab === 1 && (
            <View>
              <View style={s.inputGroup}>
                <Text style={s.label}>Address *</Text>
                <Field icon="location-on" placeholder="Enter full address" value={address} onChangeText={setAddress} editable={!loading} />
              </View>
              {showHouseNumber ? (
                <View style={s.inputGroup}>
                  <Text style={s.label}>House Number *</Text>
                  <Field icon="home" placeholder="Flat / house number" value={houseNumber} onChangeText={setHouseNumber} editable={!loading} />
                </View>
              ) : null}
              {showLandmark ? (
                <View style={s.inputGroup}>
                  <Text style={s.label}>Landmark</Text>
                  <Field icon="place" placeholder="Nearby landmark" value={landmark} onChangeText={setLandmark} editable={!loading} />
                </View>
              ) : null}
              {error ? <Text style={s.error}>{error}</Text> : null}

              <View style={s.btnRow}>
                <TouchableOpacity style={s.backBtn} onPress={() => { setError(''); setTab(0); }}>
                  <MaterialIcons name="arrow-back" size={18} color="#4f7cff" />
                  <Text style={s.backBtnText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity disabled={loading} style={[s.primaryBtn, s.primaryBtnFlex, loading && s.btnDisabled]} onPress={handleRegister}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryBtnText}>Register</Text>}
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={s.loginRow}>
            <Text style={s.loginText}>Already registered?</Text>
            <TouchableOpacity disabled={loading} onPress={() => navigation.navigate('Login')}>
              <Text style={s.loginLink}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.primary },
  inner: { padding: 18, flexGrow: 1, justifyContent: 'center' },
  innerCompact: { padding: 14 },
  card: { backgroundColor: C.bgCard, borderRadius: 26, padding: 22, shadowColor: C.primaryDark, shadowOpacity: 0.2, shadowRadius: 22, elevation: 10, borderWidth: 1, borderColor: C.border },
  cardCompact: { padding: 16, borderRadius: 18 },
  title: { fontSize: 24, fontWeight: '900', color: C.textPrimary, marginBottom: 4 },
  titleCompact: { fontSize: 21 },
  subtitle: { fontSize: 14, color: C.textSecondary, marginBottom: 20, lineHeight: 21 },

  tabBar: { flexDirection: 'row', marginBottom: 22, position: 'relative' },
  tabLine: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, backgroundColor: C.border, zIndex: 0 },
  tabItem: { flex: 1, alignItems: 'center', paddingBottom: 12, flexDirection: 'column', gap: 6 },
  tabItemActive: { borderBottomWidth: 2, borderBottomColor: C.primary },
  tabDot: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  tabDotActive: { backgroundColor: C.primary },
  tabDotText: { fontSize: 12, fontWeight: '700', color: C.textMuted },
  tabDotTextActive: { color: '#fff' },
  tabLabel: { fontSize: 12, color: C.textMuted, fontWeight: '600' },
  tabLabelActive: { color: C.primary },

  inputGroup: { marginBottom: 13 },
  label: { fontSize: 13, color: C.textSecondary, marginBottom: 7, fontWeight: '600' },
  helperText: { color: C.textMuted, fontSize: 12, marginTop: 6 },
  profilePickerWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bgMuted, borderRadius: 18, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: C.border },
  profilePicker: { width: 72, height: 72, borderRadius: 22, overflow: 'hidden', backgroundColor: C.primaryLight },
  profilePreview: { width: '100%', height: '100%' },
  profilePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  profilePickerCopy: { flex: 1, marginLeft: 12 },
  removeImageText: { color: C.danger, fontSize: 12, fontWeight: '800', marginTop: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bgMuted, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 11, borderWidth: 1, borderColor: C.border },
  input: { marginLeft: 10, fontSize: 15, flex: 1, color: C.textPrimary },
  dropdownButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bgMuted, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 11, borderWidth: 1, borderColor: C.border },
  dropdownText: { marginLeft: 10, fontSize: 15, flex: 1, color: C.textPrimary },
  dropdownPlaceholder: { color: C.textMuted },
  dropdownMenu: { backgroundColor: C.bgCard, borderRadius: 14, marginTop: 8, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  dropdownItemText: { color: C.textPrimary, fontSize: 14, fontWeight: '600' },
  dropdownItemTextActive: { color: C.primary },

  primaryBtn: { backgroundColor: C.primary, borderRadius: 16, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, marginTop: 4, shadowColor: C.primaryDark, shadowOpacity: 0.22, shadowRadius: 10, elevation: 4 },
  primaryBtnFlex: { flex: 1 },
  primaryBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  btnDisabled: { opacity: 0.8 },

  btnRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1.5, borderColor: C.primary, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 16 },
  backBtnText: { color: C.primary, fontWeight: '700', fontSize: 14 },

  loginRow: { marginTop: 18, flexDirection: 'row', justifyContent: 'center' },
  loginText: { color: C.textMuted, fontSize: 13 },
  loginLink: { color: C.primary, marginLeft: 8, fontWeight: '700', fontSize: 13 },
  error: { color: C.danger, marginTop: 2, marginBottom: 8, fontSize: 12 }
});
