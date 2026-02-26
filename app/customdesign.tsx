import { DesignPreview } from '@/src/components/DesignPreview';
import { COLORS, FONTS, SPACING } from '@/src/constants/theme';
import { useDesign } from '@/src/context/DesignContext';
import { useProfile } from '@/src/context/ProfileContext';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

/* ================= CUSTOM HEADER ================= */

const CustomHeader = ({ title }: { title: string }) => {
  const router = useRouter();

  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        activeOpacity={0.6}
      >
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>

      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>

      {/* Right spacer for balance */}
      <View style={{ width: 40 }} />
    </View>
  );
};

/* ================= MAIN SCREEN ================= */

export default function CustomDesignScreen() {
  const { profile } = useProfile();
  const {
    selectedDesign,
    setSelectedDesign,
    customDesignUrl,
    setCustomDesignUrl,
    refreshCustomDesign,
    footerText,
    setFooterText,
    saveFooterText,
    refreshFooter,
  } = useDesign();

  const [isSavingFooter, setIsSavingFooter] = useState(false);

  useFocusEffect(
    useCallback(() => {
      refreshCustomDesign();
      refreshFooter();
    }, [refreshCustomDesign, refreshFooter])
  );

  const handleSelectDesign = (design: 'default' | 'custom') => {
    setSelectedDesign(design);
  };

  const handleCustomDesignUploaded = (url: string) => {
    setCustomDesignUrl(url);
    setSelectedDesign('custom');
  };

  const handleSaveFooter = async () => {
    if (footerText.trim().length === 0) {
      Alert.alert('Empty Footer', 'Please enter some text or leave it as is.');
      return;
    }

    setIsSavingFooter(true);
    try {
      await saveFooterText(footerText);
      Alert.alert('Success', 'Footer saved successfully!');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Failed to save footer: ${errorMsg}`);
    } finally {
      setIsSavingFooter(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      <CustomHeader title="Header" />

      <ScrollView contentContainerStyle={{ padding: SPACING.lg }}>

        {/* DEFAULT DESIGN */}
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.radioRow}
            activeOpacity={0.8}
            onPress={() => handleSelectDesign('default')}
          >
            <View style={styles.radioOuter}>
              {selectedDesign === 'default' && (
                <View style={styles.radioInner} />
              )}
            </View>
            <Text style={styles.title}>Default</Text>
          </TouchableOpacity>

          <DesignPreview
            designType="default"
            profile={profile}
            isPreview={false}
          />
        </View>

        {/* CUSTOM DESIGN */}
        <View style={[styles.card, { marginTop: 20 }]}>
          <TouchableOpacity
            style={styles.radioRow}
            activeOpacity={0.8}
            onPress={() => handleSelectDesign('custom')}
          >
            <View style={styles.radioOuter}>
              {selectedDesign === 'custom' && (
                <View style={styles.radioInner} />
              )}
            </View>
            <Text style={styles.title}>Custom Design</Text>
          </TouchableOpacity>

          {selectedDesign === 'custom' && (
            <DesignPreview
              key={customDesignUrl || 'no-design'}
              designType="custom"
              profile={profile}
              isPreview={false}
              customDesignUrl={customDesignUrl}
              onCustomDesignUploaded={handleCustomDesignUploaded}
            />
          )}
        </View>

        {/* FOOTER SECTION */}
        <View style={[styles.card, { marginTop: 20 }]}>
          <Text style={[styles.title, { marginBottom: 14 }]}>Footer</Text>

          <View style={styles.footerInputWrapper}>
            <TextInput
              style={styles.footerInput}
              placeholder="Type any thoughts"
              value={footerText}
              onChangeText={setFooterText}
              multiline
              maxLength={180}
              placeholderTextColor="#999999"
              textAlignVertical="top"
            />
            <Text style={styles.charCounter}>{footerText.length}/180</Text>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, isSavingFooter && styles.saveButtonDisabled]}
            onPress={handleSaveFooter}
            activeOpacity={0.7}
            disabled={isSavingFooter}
          >
            <Text style={styles.saveButtonText}>
              {isSavingFooter ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  /* HEADER */
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },

  /* CARD */
  card: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: SPACING.md,
    backgroundColor: '#FFFFFF',
  },

  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#000000',
  },

  title: {
    fontSize: FONTS.bodySize,
    fontWeight: '600',
    color: COLORS.text,
  },

  /* FOOTER INPUT */
  footerInputWrapper: {
    position: 'relative',
    marginBottom: 12,
  },

  footerInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 12,
    minHeight: 100,
    maxHeight: 150,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: '#F9FAFB',
    fontFamily: 'System',
  },

  charCounter: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    fontSize: 12,
    color: '#999999',
    fontWeight: '500',
  },

  /* SAVE BUTTON */
  saveButton: {
    backgroundColor: '#1B319F',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});