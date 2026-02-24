import { COLORS, FONTS, SPACING } from '@/src/constants/theme';
import { useProfile } from '@/src/context/ProfileContext';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface HeaderProps {
  title: string;
  onBackPress?: () => void;
  backLabel?: string;
}

export function Header({
  title,
  onBackPress,
  backLabel = '← Back',
}: HeaderProps) {
  const insets = useSafeAreaInsets();
  const { profile } = useProfile();

  // ✅ Safe optional chaining
  const imageUri = profile?.profile_image ?? null;
  const firstLetter =
    profile?.name?.charAt(0)?.toUpperCase() ?? 'U';

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top }]}>
      <View style={styles.inner}>

        {/* LEFT */}
        {onBackPress ? (
          <TouchableOpacity
            onPress={onBackPress}
            style={styles.backBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.backText}>{backLabel}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.backPlaceholder} />
        )}

        {/* CENTER TITLE */}
        <View style={styles.titleWrap}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>

        {/* RIGHT PROFILE IMAGE */}
        <View style={styles.profileWrap}>
          {imageUri ? (
            <Image
              source={{ uri: imageUri + '?v=' + Date.now() }}
              style={styles.avatar}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarLetter}>
                {firstLetter}
              </Text>
            </View>
          )}
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: COLORS.headerBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    minHeight: 56,
  },
  backBtn: {
    minWidth: 64,
  },
  backPlaceholder: {
    minWidth: 64,
  },
  backText: {
    fontSize: FONTS.bodySize,
    color: COLORS.primary,
    fontWeight: FONTS.weightSemiBold,
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: FONTS.bodySize,
    fontWeight: FONTS.weightSemiBold,
    color: COLORS.text,
  },
  profileWrap: {
    width: 40,
    height: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
