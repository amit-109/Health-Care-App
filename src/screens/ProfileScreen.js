import {
  ActivityIndicator, Image, ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity, View, useWindowDimensions
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { C } from '../config/theme';
import { updateUserProfile } from '../api/auth';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const getInitials = (name = 'P') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join('') || 'P';

const display = (v, fallback = 'Not provided') => (v === 0 ? '0' : v ? String(v) : fallback);

const GENDER_OPTIONS = ['Male', 'Female', 'Other'];

/* ── Read-only detail row ── */
function DetailRow({ icon, label, value }) {
  return (
    <View style={s.detailRow}>
      <View style={s.detailIcon}>
        <MaterialIcons name={icon} size={18} color={C.primary} />
      </View>
      <View style={s.detailCopy}>
        <Text style={s.detailLabel}>{label}</Text>
        <Text style={s.detailValue} numberOfLines={2}>{display(value)}</Text>
      </View>
    </View>
  );
}

/* ── Edit field ── */
function EditField({ icon, label, value, onChangeText, keyboardType, placeholder, editable = true }) {
  return (
    <View style={s.editGroup}>
      <Text style={s.editLabel}>{label}</Text>
      <View style={s.editRow}>
        <MaterialIcons name={icon} size={17} color={C.primary} />
        <TextInput
          style={s.editInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || label}
          placeholderTextColor={C.textMuted}
          keyboardType={keyboardType || 'default'}
          editable={editable}
        />
      </View>
    </View>
  );
}

export default function ProfileScreen({ user, onLogout, onProfileUpdated }) {
  const { width } = useWindowDimensions();
  const compact = width < 380;

  const [mode, setMode] = useState('view'); // 'view' | 'edit'
  const [loggingOut, setLoggingOut] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [genderOpen, setGenderOpen] = useState(false);

  /* edit form state — pre-filled from user */
  const [name, setName]             = useState(user.name || '');
  const [email, setEmail]           = useState(user.email || '');
  const [phone, setPhone]           = useState(user.phone || '');
  const [address, setAddress]       = useState(user.address || '');
  const [houseNumber, setHouseNumber] = useState(user.houseNumber || '');
  const [landmark, setLandmark]     = useState(user.landmark || '');
  const [pinCode, setPinCode]       = useState(user.pinCode || user.pincode || '');
  const [gender, setGender]         = useState(user.gender || '');
  const [profileImage, setProfileImage] = useState(null); // new image picked

  const address_display = useMemo(
    () => [user.houseNumber, user.address, user.landmark, user.city].filter(Boolean).join(', '),
    [user.address, user.city, user.houseNumber, user.landmark]
  );

  const handleLogout = async () => {
    setLoggingOut(true);
    await wait(250);
    onLogout();
    setLoggingOut(false);
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { setSaveError('Photo permission is required.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      setProfileImage({ uri: asset.uri, name: asset.fileName || 'profile.jpg', type: asset.mimeType || 'image/jpeg' });
    }
  };

  const handleSave = async () => {
    setSaveError('');
    if (!name.trim()) { setSaveError('Name is required.'); return; }
    setSaving(true);
    try {
      await updateUserProfile(user.id, {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        address: address.trim(),
        houseNumber: houseNumber.trim(),
        landmark: landmark.trim(),
        pinCode: pinCode.trim(),
        gender,
        userProfileImageUrl: profileImage
      });
      if (onProfileUpdated) {
        onProfileUpdated({ name: name.trim(), email: email.trim(), phone: phone.trim(), address: address.trim(), houseNumber: houseNumber.trim(), landmark: landmark.trim(), gender, pinCode: pinCode.trim(), profileImage: profileImage ? profileImage.uri : user.profileImage });
      }
      setMode('view');
    } catch (e) {
      setSaveError(e.message || 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    /* reset to current user values */
    setName(user.name || '');
    setEmail(user.email || '');
    setPhone(user.phone || '');
    setAddress(user.address || '');
    setHouseNumber(user.houseNumber || '');
    setLandmark(user.landmark || '');
    setPinCode(user.pinCode || user.pincode || '');
    setGender(user.gender || '');
    setProfileImage(null);
    setSaveError('');
    setGenderOpen(false);
    setMode('view');
  };

  /* ── VIEW MODE ── */
  if (mode === 'view') {
    return (
      <ScrollView style={s.page} contentContainerStyle={[s.content, compact && s.contentCompact]} showsVerticalScrollIndicator={false}>

        {/* Banner */}
        <View style={s.banner}>
          <View style={s.bannerTop}>
            <View style={s.avatarWrap}>
              {user.profileImage
                ? <Image source={{ uri: user.profileImage }} style={s.avatarImg} />
                : <Text style={s.avatarText}>{getInitials(user.name)}</Text>
              }
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={s.bannerName} numberOfLines={1}>{display(user.name, 'Patient')}</Text>
              <Text style={s.bannerPhone} numberOfLines={1}>{display(user.phone, 'Phone not added')}</Text>
              <View style={s.activePill}>
                <View style={s.activeDot} />
                <Text style={s.activeText}>Active Patient</Text>
              </View>
            </View>
            <TouchableOpacity style={s.editBtn} onPress={() => setMode('edit')}>
              <MaterialIcons name="edit" size={16} color={C.primary} />
              <Text style={s.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>

          <View style={s.vitalsRow}>
            {[
              { label: 'Age',    value: display(user.age, '--') },
              { label: 'Gender', value: display(user.gender, '--') },
              { label: 'Blood',  value: display(user.bloodGroup, '--') },
              { label: 'City',   value: display(user.city, '--') },
            ].map((v, i, arr) => (
              <View key={v.label} style={{ flexDirection: 'row', flex: 1 }}>
                <View style={s.vitalItem}>
                  <Text style={s.vitalValue}>{v.value}</Text>
                  <Text style={s.vitalLabel}>{v.label}</Text>
                </View>
                {i < arr.length - 1 && <View style={s.vitalDivider} />}
              </View>
            ))}
          </View>
        </View>

        {/* Contact */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <View style={s.cardHeaderIcon}><MaterialIcons name="contact-phone" size={18} color={C.primary} /></View>
            <Text style={s.cardTitle}>Contact Information</Text>
          </View>
          <DetailRow icon="phone"       label="Phone Number"  value={user.phone} />
          <DetailRow icon="email"       label="Email Address" value={user.email} />
          <DetailRow icon="location-on" label="Full Address"  value={address_display} />
          <DetailRow icon="pin-drop"    label="Pin Code"      value={user.pinCode || user.pincode} />
        </View>

        {/* Account */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <View style={s.cardHeaderIcon}><MaterialIcons name="manage-accounts" size={18} color={C.primary} /></View>
            <Text style={s.cardTitle}>Account Details</Text>
          </View>
          <DetailRow icon="badge"           label="Role"             value={user.role} />
          <DetailRow icon="event-note"      label="Last Visit"       value={user.lastVisit} />
          <DetailRow icon="event-available" label="Next Appointment" value={user.nextAppointment} />
        </View>

        {/* Health message */}
        {user.message ? (
          <View style={s.messageCard}>
            <MaterialIcons name="health-and-safety" size={20} color={C.accent} />
            <Text style={s.messageText}>{user.message}</Text>
          </View>
        ) : null}

        {/* Logout */}
        <TouchableOpacity disabled={loggingOut} style={[s.logoutBtn, loggingOut && s.btnDisabled]} onPress={handleLogout}>
          {loggingOut
            ? <ActivityIndicator color={C.danger} />
            : <><MaterialIcons name="logout" size={18} color={C.danger} /><Text style={s.logoutText}>Sign Out</Text></>
          }
        </TouchableOpacity>

        <Text style={s.version}>HealthCare Patient App · v1.0</Text>
      </ScrollView>
    );
  }

  /* ── EDIT MODE ── */
  return (
    <ScrollView style={s.page} contentContainerStyle={[s.content, compact && s.contentCompact]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

      {/* Edit header */}
      <View style={s.editHeader}>
        <TouchableOpacity style={s.editHeaderBack} onPress={cancelEdit}>
          <MaterialIcons name="arrow-back" size={20} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.editHeaderTitle}>Edit Profile</Text>
          <Text style={s.editHeaderSub}>Update your personal information</Text>
        </View>
      </View>

      {/* Avatar picker */}
      <View style={s.avatarPickerCard}>
        <TouchableOpacity style={s.avatarPickerWrap} onPress={pickImage}>
          {profileImage
            ? <Image source={{ uri: profileImage.uri }} style={s.avatarPickerImg} />
            : user.profileImage
              ? <Image source={{ uri: user.profileImage }} style={s.avatarPickerImg} />
              : <View style={s.avatarPickerFallback}>
                  <Text style={s.avatarPickerInitials}>{getInitials(name || user.name)}</Text>
                </View>
          }
          <View style={s.avatarPickerBadge}>
            <MaterialIcons name="photo-camera" size={14} color="#fff" />
          </View>
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={s.avatarPickerTitle}>Profile Photo</Text>
          <Text style={s.avatarPickerHint}>Tap the photo to upload a new image</Text>
          {profileImage && (
            <TouchableOpacity onPress={() => setProfileImage(null)}>
              <Text style={s.removePhotoText}>Remove new photo</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Form card */}
      <View style={s.formCard}>
        <Text style={s.formSection}>Personal Info</Text>
        <EditField icon="person"    label="Full Name *"    value={name}    onChangeText={setName}    placeholder="Enter full name" />
        <EditField icon="email"     label="Email"          value={email}   onChangeText={setEmail}   keyboardType="email-address" placeholder="patient@demo.com" />
        <EditField icon="phone"     label="Phone Number"   value={phone}   onChangeText={setPhone}   keyboardType="phone-pad" placeholder="+91 98765 43210" />

        {/* Gender dropdown */}
        <View style={s.editGroup}>
          <Text style={s.editLabel}>Gender</Text>
          <TouchableOpacity style={s.editRow} onPress={() => setGenderOpen((p) => !p)}>
            <MaterialIcons name="person-outline" size={17} color={C.primary} />
            <Text style={[s.editInput, !gender && { color: C.textMuted }]}>{gender || 'Select gender'}</Text>
            <MaterialIcons name={genderOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} size={20} color={C.textMuted} />
          </TouchableOpacity>
          {genderOpen && (
            <View style={s.genderMenu}>
              {GENDER_OPTIONS.map((opt) => (
                <TouchableOpacity key={opt} style={s.genderItem} onPress={() => { setGender(opt); setGenderOpen(false); }}>
                  <MaterialIcons name={gender === opt ? 'radio-button-checked' : 'radio-button-unchecked'} size={18} color={gender === opt ? C.primary : C.textMuted} />
                  <Text style={[s.genderItemText, gender === opt && { color: C.primary, fontWeight: '700' }]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <Text style={[s.formSection, { marginTop: 8 }]}>Address</Text>
        <EditField icon="location-on" label="Address"      value={address}     onChangeText={setAddress}     placeholder="Enter full address" />
        <EditField icon="home"        label="House Number" value={houseNumber}  onChangeText={setHouseNumber} placeholder="Flat / house number" />
        <EditField icon="place"       label="Landmark"     value={landmark}     onChangeText={setLandmark}    placeholder="Nearby landmark" />
        <EditField icon="pin-drop"    label="Pin Code"     value={pinCode}      onChangeText={(v) => setPinCode(v.replace(/\D/g, '').slice(0, 6))} keyboardType="numeric" placeholder="6-digit pin code" />

        {saveError ? (
          <View style={s.errorBox}>
            <MaterialIcons name="error-outline" size={16} color={C.danger} />
            <Text style={s.errorText}>{saveError}</Text>
          </View>
        ) : null}

        <View style={s.actionRow}>
          <TouchableOpacity style={s.cancelBtn} onPress={cancelEdit} disabled={saving}>
            <Text style={s.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.saveBtn, saving && s.btnDisabled]} onPress={handleSave} disabled={saving}>
            {saving
              ? <ActivityIndicator color="#fff" size="small" />
              : <><MaterialIcons name="check" size={18} color="#fff" /><Text style={s.saveBtnText}>Save Changes</Text></>
            }
          </TouchableOpacity>
        </View>
      </View>

      <Text style={s.version}>HealthCare Patient App · v1.0</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  page:           { flex: 1, backgroundColor: C.bg },
  content:        { padding: 16, paddingBottom: 110 },
  contentCompact: { padding: 12, paddingBottom: 100 },

  /* ── view: banner ── */
  banner:      { backgroundColor: C.primary, borderRadius: 24, padding: 20, marginBottom: 14, shadowColor: C.primaryDark, shadowOpacity: 0.22, shadowRadius: 16, elevation: 7 },
  bannerTop:   { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  avatarWrap:  { width: 64, height: 64, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  avatarImg:   { width: 64, height: 64 },
  avatarText:  { color: C.primary, fontSize: 22, fontWeight: '900' },
  bannerName:  { color: '#fff', fontSize: 18, fontWeight: '800' },
  bannerPhone: { color: '#bae6fd', fontSize: 13, fontWeight: '600', marginTop: 3 },
  activePill:  { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8, backgroundColor: '#ffffff22', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start' },
  activeDot:   { width: 7, height: 7, borderRadius: 4, backgroundColor: '#6ee7b7' },
  activeText:  { color: '#fff', fontSize: 11, fontWeight: '700' },
  editBtn:     { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  editBtnText: { color: C.primary, fontSize: 12, fontWeight: '800' },

  vitalsRow:    { flexDirection: 'row', backgroundColor: '#ffffff18', borderRadius: 16, padding: 14 },
  vitalItem:    { flex: 1, alignItems: 'center' },
  vitalDivider: { width: 1, backgroundColor: '#ffffff30', marginVertical: 2 },
  vitalValue:   { color: '#fff', fontSize: 14, fontWeight: '900' },
  vitalLabel:   { color: '#bae6fd', fontSize: 11, fontWeight: '600', marginTop: 4 },

  /* ── view: cards ── */
  card:           { backgroundColor: C.bgCard, borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: C.border, shadowColor: C.shadow, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  cardHeader:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  cardHeaderIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  cardTitle:      { color: C.textPrimary, fontSize: 15, fontWeight: '800' },
  detailRow:      { flexDirection: 'row', alignItems: 'center', paddingTop: 13 },
  detailIcon:     { width: 36, height: 36, borderRadius: 12, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  detailCopy:     { flex: 1, marginLeft: 12 },
  detailLabel:    { color: C.textMuted, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  detailValue:    { color: C.textPrimary, fontSize: 14, fontWeight: '700', marginTop: 3, lineHeight: 20 },

  messageCard: { backgroundColor: C.accentLight, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12, borderWidth: 1, borderColor: '#a7f3d0' },
  messageText: { flex: 1, color: '#065f46', fontSize: 13, fontWeight: '600', lineHeight: 20 },

  logoutBtn:   { backgroundColor: C.dangerLight, borderRadius: 16, paddingVertical: 14, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#fecaca', marginBottom: 16 },
  logoutText:  { color: C.danger, fontSize: 15, fontWeight: '800' },
  btnDisabled: { opacity: 0.75 },
  version:     { textAlign: 'center', color: C.textMuted, fontSize: 11, fontWeight: '600' },

  /* ── edit: header ── */
  editHeader:     { backgroundColor: C.primary, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14, shadowColor: C.primaryDark, shadowOpacity: 0.22, shadowRadius: 16, elevation: 7 },
  editHeaderBack: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ffffff22', alignItems: 'center', justifyContent: 'center' },
  editHeaderTitle:{ color: '#fff', fontSize: 18, fontWeight: '800' },
  editHeaderSub:  { color: '#bae6fd', fontSize: 12, fontWeight: '600', marginTop: 2 },

  /* ── edit: avatar picker ── */
  avatarPickerCard:     { backgroundColor: C.bgCard, borderRadius: 20, padding: 16, marginBottom: 14, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: C.border },
  avatarPickerWrap:     { width: 76, height: 76, borderRadius: 22, overflow: 'hidden', position: 'relative' },
  avatarPickerImg:      { width: 76, height: 76 },
  avatarPickerFallback: { width: 76, height: 76, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarPickerInitials: { color: C.primary, fontSize: 24, fontWeight: '900' },
  avatarPickerBadge:    { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  avatarPickerTitle:    { color: C.textPrimary, fontSize: 14, fontWeight: '800' },
  avatarPickerHint:     { color: C.textMuted, fontSize: 12, fontWeight: '500', marginTop: 4, lineHeight: 17 },
  removePhotoText:      { color: C.danger, fontSize: 12, fontWeight: '700', marginTop: 8 },

  /* ── edit: form ── */
  formCard:    { backgroundColor: C.bgCard, borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: C.border, shadowColor: C.shadow, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  formSection: { color: C.textPrimary, fontSize: 14, fontWeight: '800', marginBottom: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  editGroup:   { marginBottom: 13 },
  editLabel:   { color: C.textSecondary, fontSize: 12, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.4 },
  editRow:     { flexDirection: 'row', alignItems: 'center', backgroundColor: C.bgMuted, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 11, borderWidth: 1, borderColor: C.border, gap: 8 },
  editInput:   { flex: 1, fontSize: 15, color: C.textPrimary },

  genderMenu:     { backgroundColor: C.bgCard, borderRadius: 14, marginTop: 6, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  genderItem:     { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.borderLight },
  genderItemText: { color: C.textSecondary, fontSize: 14, fontWeight: '600' },

  errorBox:  { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.dangerLight, borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#fecaca' },
  errorText: { flex: 1, color: C.danger, fontSize: 12, fontWeight: '600' },

  actionRow:    { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn:    { flex: 1, borderWidth: 1.5, borderColor: C.border, borderRadius: 14, paddingVertical: 13, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText:{ color: C.textSecondary, fontSize: 14, fontWeight: '700' },
  saveBtn:      { flex: 2, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, shadowColor: C.primaryDark, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  saveBtnText:  { color: '#fff', fontSize: 15, fontWeight: '700' },
});
