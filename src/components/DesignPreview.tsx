import { COLORS, SPACING } from '@/src/constants/theme';
import { uploadCustomDesign } from '@/src/services/api';
import { pickAndCropImage } from '@/src/utils/imagePickerUtils';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface Profile {
  name?: string | null;
  mobile?: string | null;
  address?: string | null;
  profile_image?: string | null;
}

interface DesignPreviewProps {
  designType: 'default' | 'custom';
  profile?: Profile | null;
  isPreview?: boolean;
  customDesignUrl?: string | null;
  onCustomDesignUploaded?: (url: string) => void;
  hideReplaceButton?: boolean; // 👈 IMPORTANT
}

export function DesignPreview({
  designType,
  profile,
  isPreview = false,
  customDesignUrl,
  onCustomDesignUploaded,
  hideReplaceButton = false, // 👈 default false
}: DesignPreviewProps) {
  const [uploading, setUploading] = useState(false);

  if (designType === 'default') {
    return (
      <View style={isPreview ? previewStyles.container : fullStyles.container}>
        <View style={isPreview ? previewStyles.profileBox : fullStyles.profileBox}>
          <View style={isPreview ? previewStyles.profileRow : fullStyles.profileRow}>
            {profile?.profile_image ? (
              <Image
                source={{ uri: profile.profile_image }}
                style={isPreview ? previewStyles.avatar : fullStyles.avatar}
              />
            ) : (
              <View style={isPreview ? previewStyles.avatarPlaceholder : fullStyles.avatarPlaceholder}>
                <Text style={isPreview ? previewStyles.avatarLetter : fullStyles.avatarLetter}>
                  {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </View>
            )}

            <View style={isPreview ? previewStyles.textContainer : fullStyles.textContainer}>
              <Text style={isPreview ? previewStyles.name : fullStyles.name}>
                {profile?.name || 'Name'}
              </Text>
              <Text style={isPreview ? previewStyles.mobile : fullStyles.mobile}>
                {profile?.mobile || 'Mobile'}
              </Text>
              <Text
                style={isPreview ? previewStyles.address : fullStyles.address}
                numberOfLines={isPreview ? 1 : 2}
              >
                {profile?.address || 'Address'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={isPreview ? previewStyles.container : fullStyles.container}>
      {designType === 'custom' && customDesignUrl ? (
        <CustomDesignPreview
          imageUrl={customDesignUrl}
          isPreview={isPreview}
          uploading={uploading}
          hideReplaceButton={hideReplaceButton} // 👈 pass prop
          onUploadNewDesign={() =>
            handleUploadCustomDesign(setUploading, onCustomDesignUploaded)
          }
        />
      ) : (
        <UploadDesignUI
          isPreview={isPreview}
          uploading={uploading}
          onPress={() =>
            handleUploadCustomDesign(setUploading, onCustomDesignUploaded)
          }
        />
      )}
    </View>
  );
}/**
 * Component to show uploaded custom design image with option to replace
 */
function CustomDesignPreview({
  imageUrl,
  isPreview,
  uploading,
  onUploadNewDesign,
  hideReplaceButton,
}: {
  imageUrl: string;
  isPreview: boolean;
  uploading: boolean;
  onUploadNewDesign: () => Promise<void>;
  hideReplaceButton?: boolean;
}) {
  return (
    <View style={isPreview ? previewStyles.customDesignBox : fullStyles.customDesignBox}>
      <Image
        source={{ uri: imageUrl }}
        style={isPreview ? previewStyles.customDesignImage : fullStyles.customDesignImage}
        resizeMode="contain"
      />

      {/* 👇 Button hidden when hideReplaceButton true */}
      {/*
      {!hideReplaceButton && (
        <TouchableOpacity
          style={isPreview ? previewStyles.replaceButton : fullStyles.replaceButton}
          onPress={onUploadNewDesign}
          disabled={uploading}
          activeOpacity={0.7}
        >
          {uploading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={isPreview ? previewStyles.replaceButtonText : fullStyles.replaceButtonText}>
              Replace Design
            </Text>
          )}
        </TouchableOpacity>
      )}
      */}
    </View>
  );
}
/**
 * Component to show upload UI when no custom design exists
 */
function UploadDesignUI({
  isPreview,
  uploading,
  onPress,
}: {
  isPreview: boolean;
  uploading: boolean;
  onPress: () => Promise<void>;
}) {
  return (
    <TouchableOpacity
      style={isPreview ? previewStyles.uploadBox : fullStyles.uploadBox}
      onPress={onPress}
      disabled={uploading}
      activeOpacity={0.7}
    >
      {uploading ? (
        <ActivityIndicator color="#3276c3" size={isPreview ? 'small' : 'large'} />
      ) : (
        <>
          <Svg width={isPreview ? 24 : 32} height={isPreview ? 24 : 32} viewBox="0 0 24 24" fill="none">
            <Path
              d="M13.5 3H12H7C5.89543 3 5 3.89543 5 5V19C5 20.1046 5.89543 21 7 21H7.5M13.5 3L19 8.625M13.5 3V7.625C13.5 8.17728 13.9477 8.625 14.5 8.625H19M19 8.625V9.75V12V19C19 20.1046 18.1046 21 17 21H16.5"
              stroke="#3276c3"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path
              d="M12 21L12 13M12 13L14.5 15.5M12 13L9.5 15.5"
              stroke="#3276c3"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>

          <Text style={isPreview ? previewStyles.uploadText : fullStyles.uploadText}>
            Upload your design
          </Text>
          <Text style={isPreview ? previewStyles.uploadSub : fullStyles.uploadSub}>
            JPG, PNG (max. 1024px X 768px)
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

/**
 * Handle custom design upload with image picker, crop, and API call
 */
async function handleUploadCustomDesign(
  setUploading: (loading: boolean) => void,
  onCustomDesignUploaded?: (url: string) => void
) {
  try {
    setUploading(true);

    // Step 1: Pick and crop image
    console.log('[DesignPreview] Opening image picker...');
    const croppedUri = await pickAndCropImage();

    if (!croppedUri) {
      console.log('[DesignPreview] Image selection cancelled');
      setUploading(false);
      return;
    }

    console.log('[DesignPreview] Image cropped, uploading...');

    // Step 2: Upload to backend
    const uploadedUrl = await uploadCustomDesign(croppedUri);

    console.log('[DesignPreview] Upload successful:', uploadedUrl);

    // Step 3: Notify parent component
    if (onCustomDesignUploaded) {
      onCustomDesignUploaded(uploadedUrl);
    }

    Alert.alert('Success', 'Custom design uploaded successfully');
  } catch (error) {
    console.error('[DesignPreview] Error uploading design:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    Alert.alert('Upload Failed', errorMsg || 'Failed to upload custom design');
  } finally {
    setUploading(false);
  }
}

// Preview Styles (small, used in CreateEditEventScreen)
// Preview Styles (small, used in CreateEditEventScreen)
const previewStyles = StyleSheet.create({
 container: {
  backgroundColor: 'transparent', // 👈 remove gray
  borderRadius: 8,
  padding: 0, // 👈 padding remove
},
  profileBox: {
    flex: 1,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  mobile: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  address: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 2,
  },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  uploadText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3276c3',
  },
  uploadSub: {
    fontSize: 11,
    color: '#9CA3AF',
  },
customDesignBox: {
  gap: 6,
},
 customDesignImage: {
  width: '100%',
  height: 100, // 👈 height reduce
  borderRadius: 8,
},
  replaceButton: {
    backgroundColor: '#3276c3',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  replaceButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

// Full Styles (used in customdesign.tsx)
const fullStyles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
  },
  profileBox: {
    flex: 1,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  mobile: {
    fontSize: 14,
    color: '#374151',
    marginTop: 2,
  },
  address: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  uploadBox: {
    marginTop: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  uploadText: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: '600',
    color: '#3276c3',
  },
  uploadSub: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
 customDesignBox: {
  gap: 8, // 👈 reduce spacing
},

customDesignImage: {
  width: '100%',
  height: 120, // 👈 height reduced
  borderRadius: 12,
},
  replaceButton: {
    backgroundColor: '#3276c3',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  replaceButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});