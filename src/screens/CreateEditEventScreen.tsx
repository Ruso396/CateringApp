import { DesignPreview } from '@/src/components/DesignPreview';
import { GradientButton } from '@/src/components/GradientButton';
import { CalendarIcon } from '@/src/components/icons/CalendarIcon';
import { DownloadIcon } from '@/src/components/icons/DownloadIcon';
import { ExportIcon } from '@/src/components/icons/ExportIcon';
import { SuggestionIcon } from '@/src/components/icons/SuggestionIcon';
import { ShareIcon } from '@/src/components/icons/ShareIcon';
import { ThreeDotsIcon } from '@/src/components/icons/ThreeDotsIcon';
import { COLORS, FONTS, SPACING } from '@/src/constants/theme';
import { useDesign } from '@/src/context/DesignContext';
import { useProfile } from '@/src/context/ProfileContext';
import {
  createEvent,
  fetchEvent,
  fetchGroceryItems,
  fetchSuggestions,
  fetchVegetableItems,
  saveGroceryItems,
  saveVegetableItems,
  updateEvent,
} from '@/src/services/api';
import type { TableRow } from '@/src/types';
import { generateListPdf, type PdfTableRow } from '@/src/utils/pdfExport';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system';
import { StorageAccessFramework } from 'expo-file-system';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { shareAsync } from 'expo-sharing';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const HEADERS = ['எ', 'விபரம்', 'கி', 'கிரா', 'அ'] as const;
const FLEX_WIDTHS = [1, 6, 1.5, 1.5, 1.8];
// Header Component - displays title and date in preview format
function HeaderSection({
  title,
  date,
  isEdit,
  onEditPress,
}: {
  title: string;
  date: Date | null;
  isEdit: boolean;
  onEditPress: () => void;
}) {
  const router = useRouter();

  return (
<View style={headerSectionStyles.container}>
  <TouchableOpacity
    style={headerSectionStyles.backButton}
    onPress={() => router.back()}
    activeOpacity={0.6}
  >
    <Text style={headerSectionStyles.backArrow}>←</Text>
  </TouchableOpacity>

  <TouchableOpacity
    style={headerSectionStyles.content}
    activeOpacity={0.7}
    onPress={onEditPress}
  >
    <Text style={headerSectionStyles.title} numberOfLines={1}>
      {title || 'நிகழ்வின் பெயர்'}
    </Text>

    <Text style={headerSectionStyles.date}>
      {date
        ? date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : 'தேதி'}
    </Text>
  </TouchableOpacity>

  {/* balance space */}
  <View style={{ width: 40 }} />
</View>
  );
}

// Modal for editing title and date
function EditHeaderModal({
  visible,
  title,
  date,
  onTitleChange,
  onDateChange,
  onSave,
  onClose,
}: {
  visible: boolean;
  title: string;
  date: Date | null;
  onTitleChange: (text: string) => void;
  onDateChange: (date: Date) => void;
  onSave: (newTitle: string, newDate: Date | null) => Promise<void>;
  onClose: () => void;
}) {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const [tempDate, setTempDate] = useState<Date | null>(date);

  useEffect(() => {
    setTempTitle(title);
    setTempDate(date);
  }, [title, date, visible]);

  const handleSave = async () => {
    const t = tempTitle.trim();
    if (!t) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }
    console.log('[Modal] handleSave called with', { tempTitle, tempDate });

    // Pass fresh values directly to parent handler
    // This avoids async state update issues
    await onSave(t, tempDate || new Date());
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <SafeAreaView style={modalStyles.container} edges={['top', 'bottom']}>
        <View style={modalStyles.header}>
          <TouchableOpacity onPress={onClose} activeOpacity={0.6}>
            <Text style={modalStyles.closeButton}>✕</Text>
          </TouchableOpacity>
          <Text style={modalStyles.headerTitle}>தலைப்பு & தேதியை திருத்த</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={modalStyles.content} contentContainerStyle={modalStyles.contentInner}>
          <View style={modalStyles.field}>
            <Text style={modalStyles.label}>நிகழ்வின் பெயர்</Text>
            <TextInput
              style={modalStyles.input}
              value={tempTitle}
              onChangeText={setTempTitle}
              placeholder="நிகழ்வின் பெயர்"
              placeholderTextColor={COLORS.textSecondary}
            />
          </View>

          <View style={modalStyles.field}>
            <Text style={modalStyles.label}>தேதி</Text>
            <TouchableOpacity
              style={modalStyles.dateButton}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.7}
            >
              <CalendarIcon size={20} />
              <Text style={modalStyles.dateButtonText}>
                {tempDate ? tempDate.toLocaleDateString('en-IN', { dateStyle: 'medium' }) : 'தேதிை தேர்ந்தெடுக்க'}
              </Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={tempDate || new Date()}
              mode="date"
              display="default"
              onChange={(_, d) => {
                setShowDatePicker(false);
                if (d) setTempDate(d);
              }}
            />
          )}
        </ScrollView>

        <View style={modalStyles.footer}>
          <TouchableOpacity
            style={[modalStyles.button, modalStyles.cancelButton]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={modalStyles.cancelButtonText}>cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[modalStyles.button, modalStyles.saveButton, !tempTitle.trim() && modalStyles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!tempTitle.trim()}
            activeOpacity={0.7}
          >
            <Text style={modalStyles.saveButtonText}>சேமிக்க</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}


function EditableRow({
  row,
  index,
  onChange,
  onFocusNext,
  suggestions,
  showSuggestions,
  onNameFocus,
  onNameBlur,
  onNameTextChange,
  onSelectSuggestion,
}: {
  row: TableRow;
  index: number;
  onChange: (index: number, field: keyof TableRow, value: string | number) => void;
  onFocusNext: (index: number, addNew: boolean) => void;
  suggestions: string[];
  showSuggestions: boolean;
  onNameFocus: (index: number) => void;
  onNameBlur: () => void;
  onNameTextChange: (index: number, value: string) => void;
  onSelectSuggestion: (index: number, value: string) => void;
}) {
  return (
    <View style={tableStyles.row}>
      <View style={[tableStyles.cell, { flex: 1 }]}>
        <Text style={tableStyles.cellText}>{row.s_no}</Text>
      </View>
      <View style={[tableStyles.cellInput, { flex: 5 }]}>
        <View style={tableStyles.nameCell}>
          <TextInput
            value={row.name}
            onFocus={() => onNameFocus(index)}
            onBlur={onNameBlur}
            onChangeText={(v) => onNameTextChange(index, v)}
            placeholder="—"
            style={tableStyles.nameInput}
            onEndEditing={() => {
              if (row.name.trim()) onFocusNext(index, true);
            }}
          />

          {showSuggestions && suggestions.length > 0 && (
            <View style={tableStyles.suggestionDropdown}>
              {suggestions.map((item, i) => (
                <TouchableOpacity
                  key={`${item}-${i}`}
                  style={tableStyles.suggestionItem}
                  onPress={() => onSelectSuggestion(index, item)}
                  activeOpacity={0.7}
                >
                  <Text style={tableStyles.suggestionText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
      <View style={[tableStyles.cellInput, { flex: 1.5 }]}>
        <TextInput
          value={row.kg === 0 ? '' : String(row.kg)}
          onChangeText={(v) => onChange(index, 'kg', v.replace(/[^0-9.]/g, '') || '0')}
          keyboardType="decimal-pad"
          placeholder="0"
          style={tableStyles.input}
        />
      </View>
      <View style={[tableStyles.cellInput, { flex: 1.5 }]}>
        <TextInput
          value={row.gram === 0 ? '' : String(row.gram)}
          onChangeText={(v) => onChange(index, 'gram', v.replace(/[^0-9.]/g, '') || '0')}
          keyboardType="decimal-pad"
          placeholder="0"
          style={tableStyles.input}
        />
      </View>
      <View style={[tableStyles.cellInput, { flex: 1.8 }]}>
        <TextInput
          value={row.alavu}
          onChangeText={(v) => onChange(index, 'alavu', v)}
          placeholder="—"
          style={[tableStyles.input, { textAlign: 'left' }]}
        />
      </View>
    </View>
  );
}

const tableStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    minHeight: 40,
    alignItems: 'center',
  },
  cell: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 0,
    borderRightColor: 'transparent',
    minHeight: 40,
  },
  cellInput: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 0,
    borderRightColor: 'transparent',
    minHeight: 40,
  },
  cellText: {
    fontSize: FONTS.smallSize,
    color: COLORS.text,
    textAlign: 'center',
  },
  input: {
    fontSize: FONTS.smallSize,
    color: COLORS.text,
    paddingVertical: 6,
    paddingHorizontal: 4, // reduce padding
    textAlign: 'center',
    width: '100%',
    includeFontPadding: false,
  },
  nameInput: {
    fontSize: FONTS.smallSize,
    color: COLORS.text,
    paddingVertical: 6,
    paddingHorizontal: 8,
    textAlign: 'left',
    width: '100%',
  },
  nameCell: {
    width: '100%',
    position: 'relative',
    zIndex: 50,
  },
  suggestionDropdown: {
    position: 'absolute',
    top: 36,
    left: 0,
    right: 0,
    maxHeight: 160,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden',
    zIndex: 100,
    elevation: 8,
  },
  suggestionItem: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  suggestionText: {
    fontSize: FONTS.smallSize,
    color: COLORS.text,
  },
});

const headerSectionStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.lg,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  backArrow: {
    fontSize: 24,
    color: '#000000',
    fontWeight: '600',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
  },
  date: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  editButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  editIcon: {
    fontSize: 20,
  },
});

const modalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeButton: {
    fontSize: 24,
    color: COLORS.text,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: SPACING.lg,
  },
  field: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: FONTS.bodySize,
    color: COLORS.text,
    backgroundColor: '#FFFFFF',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  dateButtonText: {
    fontSize: FONTS.bodySize,
    color: COLORS.text,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    fontSize: FONTS.bodySize,
    fontWeight: '600',
    color: COLORS.text,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: FONTS.bodySize,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export function CreateEditEventScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>() ?? {};
  const isEdit = !!(params?.id);
  const eventId = params?.id ? parseInt(String(params.id), 10) : 0;
  const { profile } = useProfile();
  const { selectedDesign, customDesignUrl, refreshCustomDesign } = useDesign();

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [focusedNameRowIndex, setFocusedNameRowIndex] = useState<number | null>(null);
  const suggestionReqId = useRef(0);

  useFocusEffect(
    useCallback(() => {
      refreshCustomDesign();
    }, [refreshCustomDesign])
  );

  const [title, setTitle] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [currentEventId, setCurrentEventId] = useState<number>(eventId);
  const [activeTab, setActiveTab] = useState<'grocery' | 'vegetable'>('grocery');
  const [groceryRows, setGroceryRows] = useState<TableRow[]>([{ s_no: 1, name: '', kg: 0, gram: 0, alavu: '' }]);
  const [vegetableRows, setVegetableRows] = useState<TableRow[]>([
    { s_no: 1, name: '', kg: 0, gram: 0, alavu: '' },
  ]);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [loading, setLoading] = useState(isEdit);
  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalDate, setModalDate] = useState<Date | null>(null);
  const menuAnimValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(menuAnimValue, {
      toValue: showMenu ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [showMenu, menuAnimValue]);

  const handleOpenEditModal = useCallback(() => {
    setModalTitle(title);
    setModalDate(date);
    setShowEditModal(true);
  }, [title, date]);

  const handleSaveModal = useCallback(async (newTitle: string, newDate: Date | null) => {
    const t = newTitle.trim();
    if (!t) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }

    setSaving(true);
    try {
      const dateStr = newDate ? newDate.toISOString().slice(0, 10) : null;
      console.log('[Modal Save] title:', t, 'date:', dateStr, 'isEdit:', isEdit, 'eventId:', eventId, 'currentEventId:', currentEventId);

      if (isEdit) {
        // In edit mode always prefer the route param `eventId`.
        const idToUpdate = eventId && eventId > 0 ? eventId : currentEventId;
        console.log('Updating event ID:', idToUpdate);

        if (!idToUpdate || idToUpdate <= 0) {
          throw new Error('Invalid event ID for update');
        }

        const updated = await updateEvent(idToUpdate, { title: t, date: dateStr });
        console.log('[Modal Save] Event updated:', updated);

        if (updated && updated.id) {
          setTitle(updated.title);
          setDate(updated.date ? new Date(updated.date) : null);
          console.log('[Modal Save] State updated with new event data');
        } else {
          throw new Error('Update returned invalid event data');
        }
      } else {
        // Create new event
        console.log('[Modal Save] Creating new event');
        const created = await createEvent({ title: t, date: dateStr });
        console.log('[Modal Save] Event created:', created);

        if (created && created.id) {
          setCurrentEventId(created.id);
          setTitle(created.title);
          setDate(created.date ? new Date(created.date) : null);
          console.log('[Modal Save] New event ID:', created.id, 'State updated');
        } else {
          throw new Error('Create returned invalid event data');
        }
      }

      setShowEditModal(false);
      Alert.alert('Success', 'Event saved successfully');
    } catch (e) {
      console.error('[Modal Save] Error:', e);
      const errorMsg = e instanceof Error ? e.message : String(e);
      Alert.alert('Save Failed', errorMsg || 'An error occurred while saving');
    } finally {
      setSaving(false);
    }
  }, [isEdit, currentEventId, eventId]);

  useEffect(() => {
    if (!isEdit || !eventId) return;
    let cancelled = false;
    (async () => {
      try {
        const [event, grocery, vegetable] = await Promise.all([
          fetchEvent(eventId),
          fetchGroceryItems(eventId),
          fetchVegetableItems(eventId),
        ]);
        if (cancelled) return;
        setTitle(event?.title ?? '');
        setDate(event?.date ? new Date(event.date) : null);
        setGroceryRows(
          grocery.length
            ? grocery.map((r) => ({ ...r, s_no: r.s_no, name: r.name, kg: r.kg, gram: r.gram, alavu: r.alavu || '' }))
            : [{ s_no: 1, name: '', kg: 0, gram: 0, alavu: '' }]
        );
        setVegetableRows(
          vegetable.length
            ? vegetable.map((r) => ({ ...r, s_no: r.s_no, name: r.name, kg: r.kg, gram: r.gram, alavu: r.alavu || '' }))
            : [{ s_no: 1, name: '', kg: 0, gram: 0, alavu: '' }]
        );
      } catch {
        if (!cancelled) router.back();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEdit, eventId, router]);

  const ensureNextRow = useCallback(
    (setRows: React.Dispatch<React.SetStateAction<TableRow[]>>) => {
      setRows((prev) => {
        const last = prev[prev.length - 1];
        if (last && (last.name.trim() || last.kg > 0 || last.gram > 0)) {
          return [...prev, { s_no: prev.length + 1, name: '', kg: 0, gram: 0, alavu: '' }];
        }
        return prev;
      });
    },
    []
  );

  const updateRow = useCallback(
    (
      index: number,
      field: keyof TableRow,
      value: string | number,
      rows: TableRow[],
      setRows: React.Dispatch<React.SetStateAction<TableRow[]>>
    ) => {
      setRows((prev) => {
        const next = [...prev];
        if (!next[index]) return prev;
        if (field === 'name') next[index].name = String(value);
        else if (field === 'kg') next[index].kg = Number(value) || 0;
        else if (field === 'gram') next[index].gram = Number(value) || 0;
        else if (field === 'alavu') next[index].alavu = String(value);
        const isLast = index === prev.length - 1;
        const row = next[index];
        const filled = !!(row.name.trim() || row.kg > 0 || row.gram > 0);
        if (isLast && filled) {
          next.push({ s_no: next.length + 1, name: '', kg: 0, gram: 0, alavu: '' });
        }
        return next;
      });
    },
    []
  );

  const handleSave = useCallback(async () => {
    const t = title.trim();
    if (!t) return;

    setSaving(true);
    try {
      const dateStr = date ? date.toISOString().slice(0, 10) : null;
      const idToUse = currentEventId && currentEventId > 0 ? currentEventId : eventId;

      console.log('[Main Save] Starting save', {
        title: t,
        date: dateStr,
        idToUse,
        isEdit,
        currentEventId,
        eventId
      });

      if (idToUse && idToUse > 0) {
        // Update event (either from currentEventId or eventId)
        console.log('[Main Save] Updating event', idToUse);
        try {
          const updated = await updateEvent(idToUse, { title: t, date: dateStr });
          console.log('[Main Save] Event header updated:', updated);
        } catch (updateError) {
          console.error('[Main Save] Update event failed:', updateError);
          throw new Error(`Failed to update event: ${updateError instanceof Error ? updateError.message : String(updateError)}`);
        }

        // Save table items
        const groceryToSave = groceryRows
          .filter((r) => r.name.trim() || r.kg > 0 || r.gram > 0)
          .map((r, i) => ({ ...r, s_no: i + 1 }));
        const vegetableToSave = vegetableRows
          .filter((r) => r.name.trim() || r.kg > 0 || r.gram > 0)
          .map((r, i) => ({ ...r, s_no: i + 1 }));

        console.log('[Main Save] Saving table items', {
          groceryCount: groceryToSave.length,
          vegetableCount: vegetableToSave.length
        });

        try {
          await Promise.all([
            saveGroceryItems(idToUse, groceryToSave),
            saveVegetableItems(idToUse, vegetableToSave),
          ]);
          console.log('[Main Save] Table items saved successfully');
        } catch (tableError) {
          console.error('[Main Save] Save table items failed:', tableError);
          throw new Error(`Failed to save table items: ${tableError instanceof Error ? tableError.message : String(tableError)}`);
        }
      } else {
        // Create event
        console.log('[Main Save] Creating new event');
        let createdId: number = 0;
        try {
          const created = await createEvent({ title: t, date: dateStr });
          console.log('[Main Save] Event created:', created);
          if (!created || !created.id) {
            throw new Error('Create returned invalid event data');
          }
          createdId = created.id;
          setCurrentEventId(createdId);
        } catch (createError) {
          console.error('[Main Save] Create event failed:', createError);
          throw new Error(`Failed to create event: ${createError instanceof Error ? createError.message : String(createError)}`);
        }

        // Save table items to newly created event
        const groceryToSave = groceryRows
          .filter((r) => r.name.trim() || r.kg > 0 || r.gram > 0)
          .map((r, i) => ({ ...r, s_no: i + 1 }));
        const vegetableToSave = vegetableRows
          .filter((r) => r.name.trim() || r.kg > 0 || r.gram > 0)
          .map((r, i) => ({ ...r, s_no: i + 1 }));

        console.log('[Main Save] Saving table items for created event', createdId);

        try {
          await Promise.all([
            saveGroceryItems(createdId, groceryToSave),
            saveVegetableItems(createdId, vegetableToSave),
          ]);
          console.log('[Main Save] Table items saved for new event');
        } catch (tableError) {
          console.error('[Main Save] Save table items failed:', tableError);
          throw new Error(`Failed to save table items: ${tableError instanceof Error ? tableError.message : String(tableError)}`);
        }
      }

      console.log('[Main Save] All operations completed, navigating to home');
      Alert.alert('Success', 'Event saved successfully');
      router.replace('/');
    } catch (e) {
      console.error('[Main Save] Fatal error:', e);
      const errorMsg = e instanceof Error ? e.message : String(e);
      Alert.alert('Save Failed', errorMsg || 'An error occurred while saving');
    } finally {
      setSaving(false);
    }
  }, [
    title,
    date,
    isEdit,
    eventId,
    currentEventId,
    groceryRows,
    vegetableRows,
    router,
  ]);

  /**
   * STEP 3: DATA FLOW VALIDATION
   * 
   * Common PDF generation function used by Export, Download, and Share buttons.
   * All buttons use the SAME PDF generator (generateListPdf).
   * 
   * Data Flow:
   * 1. Read selected Event ID
   * 2. Read selected Tab Type (Grocery or Vegetable)
   * 3. Fetch table rows from API (edit mode) or use local state (create mode)
   * 4. Fetch Profile Data
   * 5. Pass data to PDF Template Generator
   * 6. Generate PDF
   * 
   * STRICT DATA RULE: PDF contains ONLY selected table.
   * - If Grocery selected → Export Grocery table only
   * - If Vegetable selected → Export Vegetable table only
   * - Never mix tables
   */
  const generatePdfForCurrentTab = useCallback(async (): Promise<string | null> => {
    // STEP 11: CREATE EVENT PAGE VALIDATION
    // Before PDF generation, confirm:
    // - Event title exists
    // - Selected tab exists
    // - Table data loaded
    // - Profile data loaded
    // - Data passed correctly to template

    // 1. Check Selected Event ID
    if (isEdit && (!eventId || eventId <= 0)) {
      Alert.alert('Error', 'Invalid event ID. Please save the event first.');
      return null;
    }

    // 2. Check Selected Tab Type
    if (activeTab !== 'grocery' && activeTab !== 'vegetable') {
      Alert.alert('Error', 'Invalid tab selection.');
      return null;
    }

    // 3. Validate Event Title exists
    const t = title.trim();
    if (!t) {
      Alert.alert('Error', 'Please enter an event name before exporting');
      return null;
    }

    // 4. Fetch Table Data from API (for edit mode) or use local state (for create mode)
    let currentRows: TableRow[];

    if (isEdit && eventId) {
      // Fetch fresh data from API to ensure we're using stored table values
      // This ensures we're using data from Event Tables, not UI state
      try {
        if (activeTab === 'grocery') {
          const fetchedItems = await fetchGroceryItems(eventId);
          currentRows = fetchedItems.length > 0
            ? fetchedItems
            : [{ s_no: 1, name: '', kg: 0, gram: 0, alavu: '' }];
        } else {
          const fetchedItems = await fetchVegetableItems(eventId);
          currentRows = fetchedItems.length > 0
            ? fetchedItems
            : [{ s_no: 1, name: '', kg: 0, gram: 0, alavu: '' }];
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch table data from server. Using current data.');
        // Fallback to local state
        currentRows = activeTab === 'grocery' ? groceryRows : vegetableRows;
      }
    } else {
      // Create mode: use local state (will be saved before export typically)
      currentRows = activeTab === 'grocery' ? groceryRows : vegetableRows;
    }

    // 5. Validate Table Data Loaded
    if (!currentRows || !Array.isArray(currentRows)) {
      Alert.alert('Error', 'Table data not loaded. Please try again.');
      return null;
    }

    // 6. Pass Data to PDF Template Generator
    // Filter out completely empty rows and prepare data for PDF
    // STEP 4: STRICT DATA RULE - Only selected table is exported
    const itemsToExport: PdfTableRow[] = currentRows
      .filter((r) => r.name.trim() || r.kg > 0 || r.gram > 0)
      .map((r, i) => ({
        s_no: i + 1,
        name: r.name.trim() || '',
        kg: r.kg || 0,
        gram: r.gram || 0,
        alavu: r.alavu || '',
      }));

    // If no items to export, show warning
    if (itemsToExport.length === 0) {
      Alert.alert('No Data', `No ${activeTab} items to export. Please add some items first.`);
      return null;
    }

    // 7. Validate Profile Data Loaded
    if (!profile) {
      Alert.alert('Error', 'Profile data not loaded. Please try again.');
      return null;
    }

    // Prepare profile data for PDF header
    const pdfProfile = {
      name: profile.name ?? '',
      mobile: profile.mobile ?? '',
      address: profile.address ?? '',
      profile_image: profile.profile_image ?? null,
    };

    // Prepare event data
    const eventData = {
      title: t,
      date: date ? date.toISOString().slice(0, 10) : null,
    };

    // 8. Generate PDF using structured HTML layout (NOT screenshots)
    // This calls pdfTemplateGenerator.ts which generates HTML from data only
    const uri = await generateListPdf(
      eventData,
      activeTab,
      itemsToExport,
      pdfProfile,
      selectedDesign,
      customDesignUrl
    );

    // 9. Validate PDF was generated successfully
    if (!uri || typeof uri !== 'string') {
      throw new Error('PDF generation failed: No file URI returned');
    }

    return uri;
  }, [isEdit, eventId, title, date, activeTab, groceryRows, vegetableRows, profile]);

  /**
   * STEP 10: BUTTON FUNCTION LOGIC
   * 
   * All buttons use the SAME PDF generator (generatePdfForCurrentTab).
   * 
   * Export Button:
   * → Generate PDF
   * → Open Print Preview
   * 
   * Download Button:
   * → Generate PDF
   * → Save PDF File
   * 
   * Share Button:
   * → Generate PDF
   * → Trigger Device Share
   */

  // Export handler: Generate PDF and share/save (table data only, no full page)
  const handleExport = useCallback(async () => {
    setShowMenu(false);
    setExporting(true);
    try {
      const uri = await generatePdfForCurrentTab();
      if (!uri) {
        setExporting(false);
        return;
      }

      // Share the PDF file (user can save, share, or open)
      // This generates PDF with ONLY table data, not full page screenshot
      await shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Export ${activeTab === 'grocery' ? 'Grocery' : 'Vegetable'} List PDF`,
        UTI: 'com.adobe.pdf',
      });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      Alert.alert('Export Failed', errorMessage);
      console.error('Export error:', e);
    } finally {
      setExporting(false);
    }
  }, [generatePdfForCurrentTab, activeTab]);

  // Download handler: Save PDF to device (Android: SAF to Downloads; iOS: share sheet → Save to Files)
  const handleDownload = useCallback(async () => {
    setShowMenu(false);
    setDownloading(true);
    try {
      const uri = await generatePdfForCurrentTab();
      if (!uri) {
        setDownloading(false);
        return;
      }

      // File name format: eventname_listtype_YYYYMMDD.pdf (e.g. kalyanam_maligai_20250205.pdf)
      const eventTitle = title.trim().replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const listType = activeTab === 'grocery' ? 'maligai' : 'kaykari';
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const fileName = `${eventTitle}_${listType}_${timestamp}.pdf`;

      if (Platform.OS === 'android') {
        let directoryUri = await AsyncStorage.getItem('downloadDirectoryUri');

        // First time only
        if (!directoryUri) {
          const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync();

          if (!permissions.granted) {
            Alert.alert('Permission required to access Downloads folder');
            return;
          }

          directoryUri = permissions.directoryUri;
          await AsyncStorage.setItem('downloadDirectoryUri', directoryUri);
        }

        // Copy to cache
        const tempPath = FileSystem.cacheDirectory + fileName;

        await FileSystem.copyAsync({
          from: uri,
          to: tempPath,
        });

        const base64 = await FileSystem.readAsStringAsync(tempPath, {
          encoding: FileSystem.EncodingType.Base64,
        });

        const newFileUri = await StorageAccessFramework.createFileAsync(
          directoryUri,
          fileName.replace('.pdf', ''),
          'application/pdf'
        );

        await StorageAccessFramework.writeAsStringAsync(
          newFileUri,
          base64,
          { encoding: FileSystem.EncodingType.Base64 }
        );

        Alert.alert('Success', 'PDF saved to Downloads folder');
      } else {
        // iOS: Use share sheet so user can tap "Save to Files" or save to Photos/other
        await shareAsync(uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Save PDF',
          UTI: 'com.adobe.pdf',
        });
        Alert.alert('Success', 'PDF ready to save to Files');
      }
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      Alert.alert('Download Failed', errorMessage);
      console.error('Download error:', e);
    } finally {
      setDownloading(false);
    }
  }, [generatePdfForCurrentTab, title, activeTab]);

  // Share handler: Generate PDF and trigger device share action
  const handleShare = useCallback(async () => {
    setShowMenu(false);
    setSharing(true);
    try {
      const uri = await generatePdfForCurrentTab();
      if (!uri) {
        setSharing(false);
        return;
      }

      // Share the generated PDF file
      await shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Share ${activeTab === 'grocery' ? 'Grocery' : 'Vegetable'} List PDF`,
        UTI: 'com.adobe.pdf',
      });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : String(e);
      Alert.alert('Share Failed', errorMessage);
      console.error('Share error:', e);
    } finally {
      setSharing(false);
    }
  }, [generatePdfForCurrentTab, activeTab]);

  const currentRows = activeTab === 'grocery' ? groceryRows : vegetableRows;
  const setCurrentRows = activeTab === 'grocery' ? setGroceryRows : setVegetableRows;

  const handleNameFocus = useCallback((index: number) => {
    setFocusedNameRowIndex(index);
  }, []);

  const handleNameBlur = useCallback(() => {
    // Small delay allows tapping a suggestion before dropdown disappears
    setTimeout(() => {
      setFocusedNameRowIndex(null);
      setSuggestions([]);
    }, 120);
  }, []);

  const handleNameTextChange = useCallback(
    async (index: number, value: string) => {
      updateRow(index, 'name', value, currentRows, setCurrentRows);

      const q = value.trim();
      if (q.length < 1) {
        setSuggestions([]);
        return;
      }

      const reqId = ++suggestionReqId.current;
      try {
        const results = await fetchSuggestions(q);
        if (reqId !== suggestionReqId.current) return; // ignore stale response
        setSuggestions(results);
      } catch (e) {
        if (reqId !== suggestionReqId.current) return;
        console.warn('[Suggestions] fetch failed:', e instanceof Error ? e.message : String(e));
        setSuggestions([]);
      }
    },
    [currentRows, setCurrentRows, updateRow]
  );

  const handleSelectSuggestion = useCallback(
    (index: number, value: string) => {
      updateRow(index, 'name', value, currentRows, setCurrentRows);
      setSuggestions([]);
      setFocusedNameRowIndex(null);
    },
    [currentRows, setCurrentRows, updateRow]
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <HeaderSection
          title={title}
          date={date}
          isEdit={isEdit}
          onEditPress={handleOpenEditModal}
        />
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <HeaderSection
        title={title}
        date={date}
        isEdit={isEdit}
        onEditPress={handleOpenEditModal}
      />

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { flexGrow: 1 }]}
          keyboardShouldPersistTaps="handled"
        >

          {/* ============== DESIGN PREVIEW SECTION ============== */}
          <View style={styles.designPreviewSection}>
            <View style={styles.designPreviewCardWrapper}>
              <View style={styles.designPreviewCard}>
                <DesignPreview
                  key={customDesignUrl || 'no-design'}
                  designType={selectedDesign}
                  profile={profile}
                  isPreview={true}
                  customDesignUrl={customDesignUrl}
                   hideReplaceButton={true} // 👈 THIS LINE IMPORTANT
                />
              </View>
              <TouchableOpacity
                style={styles.editHeaderBtn}
                onPress={() => router.push('/customdesign')}
                activeOpacity={0.7}
              >
                <Text style={styles.editHeaderBtnText}>Edit Header</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.tabsSection}>
            <View style={styles.segmentedControl}>
              <TouchableOpacity
                style={[
                  styles.segmentButton,
                  styles.segmentButtonLeft,
                  activeTab === 'grocery' && styles.segmentButtonActiveGrocery,
                ]}
                onPress={() => setActiveTab('grocery')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.segmentButtonText,
                    activeTab === 'grocery' && styles.segmentButtonTextActive,
                  ]}
                >
                  மளிகை
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.segmentButton,
                  styles.segmentButtonRight,
                  activeTab === 'vegetable' && styles.segmentButtonActiveVegetable,
                ]}
                onPress={() => setActiveTab('vegetable')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.segmentButtonText,
                    activeTab === 'vegetable' && styles.segmentButtonTextActive,
                  ]}
                >
                  காய்கறி
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.menuButtonWrapper}>
              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => setShowMenu(!showMenu)}
                activeOpacity={0.6}
              >
                <ThreeDotsIcon size={24} color="#4F378B" />
              </TouchableOpacity>

              {showMenu && (
                <Animated.View
                  style={[
                    styles.popupMenu,
                    {
                      opacity: menuAnimValue,
                      transform: [
                        {
                          scale: menuAnimValue.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={handleExport}
                    disabled={exporting || !title.trim()}
                    activeOpacity={0.6}
                  >
                    <ExportIcon size={18} color="black" />
                    <Text
                      style={[
                        styles.menuItemText,
                        !title.trim() && styles.menuItemTextDisabled,
                      ]}
                    >
                      {exporting ? 'ஏற்றுமதி நடைபெறுகிறது...' : 'ஏற்றுமதி'}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.menuDivider} />

                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={handleDownload}
                    disabled={downloading || !title.trim()}
                    activeOpacity={0.6}
                  >
                    <DownloadIcon
                      size={18}
                      color="black"
                    />
                    <Text
                      style={[
                        styles.menuItemText,
                        !title.trim() && styles.menuItemTextDisabled,
                      ]}
                    >
                      {downloading ? 'பதிவிறக்கம் நடைபெறுகிறது...' : 'பதிவிறக்கம்'}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.menuDivider} />

                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={handleShare}
                    disabled={sharing || !title.trim()}
                    activeOpacity={0.6}
                  >
                    <ShareIcon
                      size={18}
                      color="black"
                    />
                    <Text
                      style={[
                        styles.menuItemText,
                        !title.trim() && styles.menuItemTextDisabled,
                      ]}
                    >
                      {sharing ? 'பகிரப்படுகிறது...' : 'பகிர்வு'}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.menuDivider} />

                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => router.push('/suggestions')}
                    activeOpacity={0.6}
                  >
                    <SuggestionIcon size={18} color="#000000" />

                    <Text style={styles.menuItemText}>
                      பரிந்துரை
                    </Text>
                  </TouchableOpacity>            
                      </Animated.View>
              )}
            </View>
          </View>

          {showMenu && (
            <TouchableOpacity
              style={styles.backdrop}
              activeOpacity={1}
              onPress={() => setShowMenu(false)}
            />
          )}

          <View style={styles.tableWrap}>
            <View style={styles.headerRow}>
              {HEADERS.map((h, i) => (
                <View
                  key={h}
                  style={[
                    styles.headerCell,
                    { flex: FLEX_WIDTHS[i] },
                    i === 0 && { borderTopLeftRadius: 8 },
                    i === HEADERS.length - 1 && { borderTopRightRadius: 8 },
                  ]}
                >
                  <Text style={styles.headerText}>{h}</Text>
                </View>
              ))}
            </View>
            {currentRows.map((row, index) => (
              <EditableRow
                key={index}
                row={row}
                index={index}
                onChange={(idx, field, value) => updateRow(idx, field, value, currentRows, setCurrentRows)}
                onFocusNext={(_, addNew) => addNew && ensureNextRow(setCurrentRows)}
                suggestions={suggestions}
                showSuggestions={focusedNameRowIndex === index}
                onNameFocus={handleNameFocus}
                onNameBlur={handleNameBlur}
                onNameTextChange={handleNameTextChange}
                onSelectSuggestion={handleSelectSuggestion}
              />
            ))}
          </View>

          <View style={styles.footer}>
            <GradientButton
              title="சேமிக்க"
              onPress={handleSave}
              loading={saving}
              disabled={!title.trim()}
              style={styles.saveBtn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <EditHeaderModal
        visible={showEditModal}
        title={modalTitle}
        date={modalDate}
        onTitleChange={setModalTitle}
        onDateChange={setModalDate}
        onSave={handleSaveModal}
        onClose={() => setShowEditModal(false)}
      />
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
    paddingBottom: 120,
    paddingTop: 0,
  },
  // Enhanced Title Section
  titleSection: {
    marginBottom: SPACING.lg,
  },
  titleInput: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: SPACING.md,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },

  // Enhanced Date Card Section
  dateCardSection: {
    marginBottom: SPACING.lg,
  },
  dateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: 14,
    paddingHorizontal: SPACING.md,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  dateText: {
    fontSize: FONTS.bodySize,
    color: COLORS.text,
    fontWeight: '500',
  },

  // Pill-style Segmented Control Section
  tabsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  segmentedControl: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    borderRadius: 0,
    padding: 0,
    height: 44,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    elevation: 0,
  },
  segmentButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    paddingBottom: SPACING.sm,
  },
  segmentButtonLeft: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  segmentButtonRight: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  segmentButtonActiveGrocery: {
    backgroundColor: 'transparent',
    borderBottomColor: '#4F378B',
    borderRadius: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    elevation: 0,
  },
  segmentButtonActiveVegetable: {
    backgroundColor: 'transparent',
    borderBottomColor: '#4F378B',
    borderRadius: 0,
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    elevation: 0,
  },
  segmentButtonText: {
    fontSize: FONTS.bodySize,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  segmentButtonTextActive: {
    color: '#4F378B',
    fontWeight: '700',
  },

  // Menu Button and Popup Styles
  menuButtonWrapper: {
    position: 'relative',
    zIndex: 1000,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#4F378B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  popupMenu: {
    position: 'absolute',
    right: 0,
    top: 50,
    minWidth: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1001,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: SPACING.md,
  },
  menuItemText: {
    fontSize: FONTS.bodySize,
    fontWeight: '600',
    color: COLORS.text,
  },
  menuItemTextDisabled: {
    color: COLORS.textSecondary,
    opacity: 0.6,
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
    marginHorizontal: 8,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },

  // Clean Grocery-Style Table Section
  tableWrap: {
    borderWidth: 0,
    borderColor: 'transparent',
    borderRadius: 0,
    overflow: 'visible',
    marginBottom: SPACING.lg,
    backgroundColor: 'transparent',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    elevation: 0,
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#F3EDF7',
    minHeight: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerCell: {
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 0,
    borderRightColor: 'transparent',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  footer: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl + 16,
    backgroundColor: COLORS.background,
  },
  saveBtn: {
    width: '100%',
  },

  // Design Preview Section
  designPreviewSection: {
    marginBottom: SPACING.lg,
  },
  designPreviewCardWrapper: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  designPreviewCard: {
    padding: SPACING.md,
  },
  editHeaderBtn: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: SPACING.md,
    backgroundColor: '#D1E5F0',
    borderRadius: 0,
    borderWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editHeaderBtnText: {
    fontSize: FONTS.bodySize,
    fontWeight: '600',
    color: '#3B7DC4',
  },
});
