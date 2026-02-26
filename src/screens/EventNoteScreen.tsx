import { GradientButton } from '@/src/components/GradientButton';
import { COLORS, FONTS, SPACING } from '@/src/constants/theme';
import { fetchNote, saveNote } from '@/src/services/api';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

export function EventNoteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ eventId?: string }>();
  const eventId = params.eventId ? parseInt(params.eventId, 10) : null;

  const [note, setNote] = useState('');
  const [savedNote, setSavedNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState(false); // 🔥 New logic

  const loadNote = useCallback(async () => {
    if (!eventId) {
      Alert.alert('Error', 'Event ID missing');
      router.back();
      return;
    }

    try {
      const data = await fetchNote(eventId);
      if (data) {
        setNote(data.note);
        setSavedNote(data.note);
        setViewMode(true); // if already saved → paragraph mode
      }
    } catch {
      Alert.alert('Error', 'Failed to load note');
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadNote();
  }, [loadNote]);

  const handleSave = async () => {
    if (!eventId) return;

    if (!note.trim()) {
      Alert.alert('Validation', 'Note cannot be empty');
      return;
    }

    setSaving(true);
    try {
      await saveNote(eventId, note);
      setSavedNote(note);
      setViewMode(true); // 🔥 After save go to view mode
    } catch {
      Alert.alert('Error', 'Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Event Notes</Text>

        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>

        {loading ? (
          <ActivityIndicator size="small" color={COLORS.textSecondary} />
        ) : viewMode ? (

          // ✅ Paragraph Mode
          <View style={styles.noteCard}>
            <Text style={styles.noteText}>{savedNote}</Text>

            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setViewMode(false)}
            >
              <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                <Path
                  d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25Z"
                  fill="#5762ff"
                />
              </Svg>
            </TouchableOpacity>
          </View>

        ) : (

          // ✅ Edit Mode (Default first time)
          <View style={styles.editContainer}>
            <TextInput
              multiline
              value={note}
              onChangeText={setNote}
              placeholder="Type your event notes here..."
              placeholderTextColor={COLORS.textSecondary}
              style={styles.bigInput}
              textAlignVertical="top"
            />

            <GradientButton
              title={saving ? 'Saving...' : 'Save'}
              onPress={handleSave}
              loading={saving}
              style={styles.saveButton}
            />
          </View>

        )}

      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: '#fff',
  },

  backArrow: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.text,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },

  content: {
    flex: 1,
    padding: SPACING.lg,
  },

  noteCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: SPACING.lg,
    elevation: 2,
  },

  noteText: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.text,
  },

  editButton: {
    alignSelf: 'flex-end',
    marginTop: SPACING.md,
  },

  editContainer: {
    flex: 1,
  },

  bigInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: SPACING.lg,
    fontSize: 16,
    marginBottom: SPACING.lg,
  },

  saveButton: {
    height: 52,
    borderRadius: 14,
  },
});