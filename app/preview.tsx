import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { WebView } from 'react-native-webview';
import { useDesign } from '@/src/context/DesignContext';
import { useProfile } from '@/src/context/ProfileContext';
import {
  generatePdfHtmlTemplate,
  type PdfProfile,
  type PdfTableRow,
} from '@/src/utils/pdfTemplateGenerator';

const { width } = Dimensions.get('window');

export default function PreviewScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    title?: string;
    date?: string;
    type?: 'grocery' | 'vegetable';
    items?: string;
  }>();

  const { profile } = useProfile();
  const { selectedDesign, customDesignUrl } = useDesign();

  const title = params?.title ?? '';
  const date = params?.date ?? '';
  const type = params?.type === 'vegetable' ? 'vegetable' : 'grocery';
  const itemsJson = params?.items ?? '[]';

  let parsedItems: PdfTableRow[] = [];
  try {
    parsedItems = JSON.parse(itemsJson) as PdfTableRow[];
  } catch {
    parsedItems = [];
  }

  const html = useMemo(() => {
    const pdfProfile: PdfProfile = {
      name: profile?.name ?? '',
      mobile: profile?.mobile ?? '',
      address: profile?.address ?? '',
      profile_image: profile?.profile_image ?? null,
    };

    return generatePdfHtmlTemplate(
      { title, date: date || null },
      type,
      parsedItems,
      pdfProfile,
      selectedDesign,
      customDesignUrl
    );
  }, [title, date, type, parsedItems, profile, selectedDesign, customDesignUrl]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>

      {/* HEADER */}
      <View style={styles.headerContainer}>
        
        <View style={styles.backWrapper}>
          <TouchableOpacity onPress={() => router.back()}>
            <BackArrowSvg />
          </TouchableOpacity>
        </View>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title || 'Preview'}
          </Text>

          <Text style={styles.headerDate}>
            {date
              ? new Date(date).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : ''}
          </Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      {/* PREVIEW CONTENT */}
      <View style={styles.previewWrapper}>
        <WebView
          originWhitelist={['*']}
          source={{ html }}
          style={styles.webview}
          showsVerticalScrollIndicator={false}
        />
      </View>

    </SafeAreaView>
  );
}

/* SVG BACK ICON */

function BackArrowSvg() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 18L9 12L15 6"
        stroke="#000"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/* STYLES */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },

  backWrapper: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },

  headerDate: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },

  previewWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // grey removed
  },

  webview: {
    width: width,
    flex: 1,
    backgroundColor: 'transparent',
    marginLeft: 60, // compensate for WebView's default horizontal padding
  },
});