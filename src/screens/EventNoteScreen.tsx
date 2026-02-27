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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Polygon } from 'react-native-svg';

export function EventNoteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ eventId?: string }>();
  const eventId = params.eventId ? parseInt(params.eventId, 10) : null;

  const [note, setNote] = useState('');
  const [savedNote, setSavedNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState(false);

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
        setViewMode(true);
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
      Alert.alert('Validation', 'Note empty aa iruka koodathu');
      return;
    }

    setSaving(true);
    try {
      await saveNote(eventId, note);
      setSavedNote(note);
      setViewMode(true);
    } catch {
      Alert.alert('Error', 'Save panna mudiyala');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >

        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Event Notes</Text>

          <View style={{ width: 30 }} />
        </View>

        {/* CONTENT */}
        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator size="small" color="#888" />
          ) : viewMode ? (

            /* VIEW MODE */
            <View style={styles.noteCard}>
              <Text style={styles.noteText}>
                {savedNote}
              </Text>

              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setViewMode(false)}
              >
                <Svg width={28} height={28} viewBox="0 0 24 24">
                  <Path
                    d="M20 16v4a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2H8"
                    fill="none"
                    stroke="#5762ff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <Polygon
                    points="12.5 15.8 22 6.2 17.8 2 8.3 11.5 8 16 12.5 15.8"
                    fill="none"
                    stroke="#5762ff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </TouchableOpacity>
            </View>

          ) : (

            /* EDIT MODE */
            <View style={styles.editContainer}>
              <TextInput
                multiline
                value={note}
                onChangeText={setNote}
                placeholder="Ungaloda event note inga type pannunga..."
                placeholderTextColor="#999"
                style={styles.bigInput}
                textAlignVertical="top"
              />
            </View>

          )}
        </View>

        {/* SAVE BUTTON FIXED BOTTOM */}
        {!viewMode && (
          <View style={[styles.bottomArea, { paddingBottom: insets.bottom + 12 }]}>
            <GradientButton
              title={saving ? 'Saving...' : 'Save Note'}
              onPress={handleSave}
              loading={saving}
              style={styles.saveButton}
            />
          </View>
        )}

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#f4f6fa',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    elevation: 4,
  },

  backArrow: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },

  content: {
    flex: 1,
    padding: 20,
  },

  noteCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },

  noteText: {
    fontSize: 16,
    lineHeight: 26,
    color: '#222',
  },

  editButton: {
    alignSelf: 'flex-end',
    marginTop: 18,
  },

  editContainer: {
    flex: 1,
  },

  bigInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    fontSize: 16,
    lineHeight: 24,
    color: '#000',   // Tamil unicode correct aa show agum
  },

  bottomArea: {
    paddingHorizontal: 20,
    backgroundColor: '#f4f6fa',
  },

  saveButton: {
    height: 56,
    borderRadius: 18,
  },

});