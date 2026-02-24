import { GradientButton } from '@/src/components/GradientButton';
import { COLORS, FONTS, SPACING } from '@/src/constants/theme';
import type { ExportType } from '@/src/types';
import React, { useState } from 'react';
import {
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export type ExportShareMode = 'export' | 'share';

interface ExportModalProps {
  visible: boolean;
  onClose: () => void;
  onExport: (type: ExportType) => void;
  mode: ExportShareMode;
  eventTitle: string;
  groceryCount: number;
  vegetableCount: number;
}

export function ExportModal({
  visible,
  onClose,
  onExport,
  mode,
  eventTitle,
  groceryCount,
  vegetableCount,
}: ExportModalProps) {
  const [selected, setSelected] = useState<ExportType>('grocery');

  const isShare = mode === 'share';
  const title = isShare ? 'Share' : 'Export';
  const subtitle = isShare ? 'Which list do you want to share?' : eventTitle;
  const actionLabel = isShare ? 'Share' : 'Export';

  const handleAction = () => {
    onExport(selected);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>

          <TouchableOpacity
            style={styles.option}
            onPress={() => setSelected('grocery')}
            activeOpacity={0.7}
          >
            <View style={[styles.radio, selected === 'grocery' && styles.radioSelected]}>
              {selected === 'grocery' && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.optionLabel}>Grocery</Text>
            <Text style={styles.optionCount}>({groceryCount} items)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.option}
            onPress={() => setSelected('vegetable')}
            activeOpacity={0.7}
          >
            <View style={[styles.radio, selected === 'vegetable' && styles.radioSelected]}>
              {selected === 'vegetable' && <View style={styles.radioInner} />}
            </View>
            <Text style={styles.optionLabel}>Vegetable</Text>
            <Text style={styles.optionCount}>({vegetableCount} items)</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <GradientButton title={actionLabel} onPress={handleAction} style={styles.exportBtn} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl + 24,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: FONTS.titleSize,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FONTS.smallSize,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  radioSelected: {
    borderColor: COLORS.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  optionLabel: {
    fontSize: FONTS.bodySize,
    color: COLORS.text,
    fontWeight: '500',
  },
  optionCount: {
    fontSize: FONTS.smallSize,
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  footer: {
    marginTop: SPACING.lg,
  },
  exportBtn: {
    width: '100%',
  },
});
