import { COLORS, FONTS, SPACING } from '@/src/constants/theme';
import {
  createSuggestion,
  deleteSuggestion,
  getSuggestions,
  updateSuggestion,
  type SuggestionItem,
} from '@/src/services/api';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SuggestionsScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingSuggestion, setEditingSuggestion] = useState<SuggestionItem | null>(null);
  const [editName, setEditName] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const loadSuggestions = useCallback(async () => {
    try {
      const list = await getSuggestions();
      setSuggestions(list);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  const onSave = async () => {
    const n = name.trim();
    if (!n) {
      Alert.alert('Error', 'Enter vibaram');
      return;
    }
    setSaving(true);
    try {
      await createSuggestion(n);
      setName('');
      await loadSuggestions();
      Alert.alert('Success', 'Suggestion saved');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('Failed', msg);
    } finally {
      setSaving(false);
    }
  };

  const onEditPress = (item: SuggestionItem) => {
    setEditingSuggestion(item);
    setEditName(item.name);
    setEditModalVisible(true);
  };

  const onEditSave = async () => {
    if (!editingSuggestion) return;
    const n = editName.trim();
    if (!n) {
      Alert.alert('Error', 'Enter vibaram');
      return;
    }
    setSavingEdit(true);
    try {
      await updateSuggestion(editingSuggestion.id, n);
      setEditModalVisible(false);
      setEditingSuggestion(null);
      setEditName('');
      await loadSuggestions();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('Failed', msg);
    } finally {
      setSavingEdit(false);
    }
  };

  const onEditCancel = () => {
    setEditModalVisible(false);
    setEditingSuggestion(null);
    setEditName('');
  };

  const onDeletePress = (item: SuggestionItem) => {
    Alert.alert(
      'Delete suggestion',
      `Delete "${item.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSuggestion(item.id);
              await loadSuggestions();
            } catch (e) {
              const msg = e instanceof Error ? e.message : String(e);
              Alert.alert('Failed', msg);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: SuggestionItem }) => (
    <View style={styles.row}>
      <Text style={styles.rowName} numberOfLines={1}>
        {item.name}
      </Text>
      <View style={styles.rowActions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.editBtn]}
          onPress={() => onEditPress(item)}
          activeOpacity={0.7}
        >
          <Text style={styles.editBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, styles.deleteBtn]}
          onPress={() => onDeletePress(item)}
          activeOpacity={0.7}
        >
          <Text style={styles.deleteBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Suggestions</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.label}>விபரம் உள்ளிடவும்</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="விபரம் உள்ளிடவும்"
          placeholderTextColor={COLORS.textSecondary}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity style={[styles.button, saving && styles.buttonDisabled]} onPress={onSave} disabled={saving}>
          <Text style={styles.buttonText}>{saving ? 'Saving…' : 'Save'}</Text>
        </TouchableOpacity>

        <Text style={[styles.label, { marginTop: SPACING.xl }]}>அனைத்து பரிந்துரைகள்</Text>
        {loading ? (
          <Text style={styles.loadingText}>Loading…</Text>
        ) : (
          <FlatList
            data={suggestions}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderItem}
            style={styles.list}
            contentContainerStyle={suggestions.length === 0 ? styles.listEmpty : undefined}
            ListEmptyComponent={<Text style={styles.emptyText}>இதுவரை பரிந்துரைகள் இல்லை</Text>}
          />
        )}
      </View>

      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={onEditCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Edit suggestion</Text>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              placeholder="Name"
              placeholderTextColor={COLORS.textSecondary}
              style={styles.input}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={onEditCancel} activeOpacity={0.7}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, savingEdit && styles.buttonDisabled]}
                onPress={onEditSave}
                disabled={savingEdit}
                activeOpacity={0.7}
              >
                <Text style={styles.modalSaveText}>{savingEdit ? 'Saving…' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: '#FFFFFF',
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 22, color: COLORS.text, fontWeight: '600' },
  title: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  content: { flex: 1, padding: SPACING.lg },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.text, marginBottom: SPACING.sm },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: FONTS.bodySize,
    backgroundColor: '#FFFFFF',
    color: COLORS.text,
  },
  button: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: FONTS.bodySize, fontWeight: '700' },
  loadingText: { fontSize: FONTS.smallSize, color: COLORS.textSecondary, marginTop: SPACING.sm },
  list: { flex: 1, marginTop: SPACING.sm },
  listEmpty: { flexGrow: 1 },
  emptyText: { fontSize: FONTS.smallSize, color: COLORS.textSecondary, marginTop: SPACING.md },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: SPACING.sm,
  },
  rowName: { flex: 1, fontSize: FONTS.bodySize, color: COLORS.text },
  rowActions: { flexDirection: 'row', gap: SPACING.sm },
  actionBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  editBtn: { backgroundColor: COLORS.primary },
  editBtnText: { color: '#FFFFFF', fontSize: FONTS.smallSize, fontWeight: '600' },
  deleteBtn: { backgroundColor: '#DC2626' },
  deleteBtnText: { color: '#FFFFFF', fontSize: FONTS.smallSize, fontWeight: '600' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalBox: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: SPACING.lg,
  },
  modalTitle: { fontSize: FONTS.titleSize, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.md },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: SPACING.sm, marginTop: SPACING.lg },
  modalCancelBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  modalCancelText: { fontSize: FONTS.bodySize, color: COLORS.textSecondary, fontWeight: '600' },
  modalSaveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  modalSaveText: { color: '#FFFFFF', fontSize: FONTS.bodySize, fontWeight: '700' },
});
