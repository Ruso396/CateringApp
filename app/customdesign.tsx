import { DesignPreview } from '@/src/components/DesignPreview';
import { COLORS, FONTS, SPACING } from '@/src/constants/theme';
import { useDesign } from '@/src/context/DesignContext';
import { useProfile } from '@/src/context/ProfileContext';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
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
  } = useDesign();

  useFocusEffect(
    useCallback(() => {
      refreshCustomDesign();
    }, [refreshCustomDesign])
  );

  const handleSelectDesign = (design: 'default' | 'custom') => {
    setSelectedDesign(design);
  };

  const handleCustomDesignUploaded = (url: string) => {
    setCustomDesignUrl(url);
    setSelectedDesign('custom');
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
});