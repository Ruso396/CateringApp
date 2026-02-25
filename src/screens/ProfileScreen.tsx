import { AppHeader } from '@/src/components/AppHeader';
import { GradientButton } from '@/src/components/GradientButton';
import { CameraIcon } from '@/src/components/icons/CameraIcon';
import { COLORS, FONTS, SPACING } from '@/src/constants/theme';
import { useProfile } from '@/src/context/ProfileContext';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const IMAGE_PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.8,
  base64: true,
};

export function ProfileScreen() {
  const router = useRouter();
  const { profile, updateProfile: saveProfile, loading } = useProfile();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setMobile(profile.mobile || '');
      setAddress(profile.address || '');
    }
  }, [profile]);

  const displayUri = localImageUri ?? profile?.profile_image ?? null;

  // =========================
  // IMAGE PICK DISABLED TEMP
  // =========================

  /*
  const handlePickedAsset = useCallback(
    async (asset: ImagePicker.ImagePickerAsset) => {
      ...
    },
    [profile, name, mobile, address, saveProfile]
  );
  */

  /*
  const pickImageFromLibrary = useCallback(async () => {
    ...
  }, [handlePickedAsset]);
  */

  /*
  const pickImageFromCamera = useCallback(async () => {
    ...
  }, [handlePickedAsset]);
  */

  /*
  const handlePickImage = useCallback(() => {
    ...
  }, [pickImageFromCamera, pickImageFromLibrary]);
  */

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveProfile({ name, mobile, address });
      router.back();
    } catch (err: any) {
      console.warn('[Profile] Save failed', err);
      const backendMessage =
        err?.response?.data?.error || err?.message || 'Could not save profile. Please try again.';
      Alert.alert('Error', backendMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !profile) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <AppHeader />
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader />
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { flexGrow: 1 }]}
          keyboardShouldPersistTaps="handled"
        >
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarTouchable}
            // onPress={handlePickImage}
            disabled={true}   // TEMP DISABLED
            activeOpacity={1}
          >
            {displayUri ? (
              <Image source={{ uri: displayUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarLetter}>
                  {(name || 'U').charAt(0).toUpperCase()}
                </Text>
              </View>
            )}

            {/* CAMERA ICON TEMP COMMENT */}
            {/*
            {uploadingImage ? (
              <View style={styles.cameraOverlay}>
                <ActivityIndicator color="#FFFFFF" size="small" />
              </View>
            ) : (
              <View style={styles.cameraIconWrap}>
                <CameraIcon size={22} color="#FFFFFF" />
              </View>
            )}
            */}
          </TouchableOpacity>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>பெயர்</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            editable={false}   // TEMP DISABLED
            placeholder="உங்கள் பெயர்"
            placeholderTextColor={COLORS.textSecondary}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>கைபேசி எண்</Text>
          <TextInput
            style={styles.input}
            value={mobile}
            onChangeText={setMobile}
            editable={false}   // TEMP DISABLED
            placeholder="கைபேசி எண் உள்ளிடவும்"
            placeholderTextColor={COLORS.textSecondary}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>முகவரி</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={address}
            onChangeText={setAddress}
            editable={false}   // TEMP DISABLED
            placeholder="முகவரி உள்ளிடவும்"
            placeholderTextColor={COLORS.textSecondary}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* SAVE BUTTON TEMP COMMENT */}
        {/*
        <GradientButton
          title="சேமிக்க"
          onPress={handleSave}
          loading={saving}
          style={styles.saveBtn}
        />
        */}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: FONTS.bodySize,
    color: COLORS.textSecondary,
  },
  keyboardAvoid: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl * 2,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  avatarTouchable: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '700',
  },
  cameraIconWrap: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  cameraOverlay: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  field: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: FONTS.smallSize,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
    fontSize: FONTS.bodySize,
    color: COLORS.text,
  },
  inputMultiline: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  saveBtn: {
    marginTop: SPACING.md,
  },
});