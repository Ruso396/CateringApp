import { GradientButton } from '@/src/components/GradientButton';
import { COLORS, FONTS, SPACING } from '@/src/constants/theme';
import { createDish, deleteDish, fetchDishes, updateDish } from '@/src/services/api';
import type { Dish } from '@/src/types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

export function AddDishScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ eventId?: string }>();
  const eventId = params.eventId ? parseInt(params.eventId, 10) : null;
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [dishName, setDishName] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');
  const [savingEditId, setSavingEditId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadDishes = useCallback(async () => {
    if (!eventId) {
      Alert.alert('Error', 'Event ID is required');
      router.back();
      return;
    }
    setLoading(true);
    try {
      const list = await fetchDishes(eventId);
      setDishes(list);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('Error', msg || 'Failed to load dishes');
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  }, [eventId, router]);

  useEffect(() => {
    loadDishes();
  }, [loadDishes]);

  const handleAddOrUpdate = useCallback(async () => {
    if (!eventId) return;
    const name = dishName.trim();
    if (!name) {
      Alert.alert('Validation', 'Please enter a dish name');
      return;
    }

    if (editingId !== null) {
      setSavingEditId(editingId);
      try {
        const updated = await updateDish(eventId, editingId, name);
        setDishes((prev) =>
          prev.map((d) => (d.id === editingId ? updated : d))
        );
        setEditingId(null);
        setEditingName('');
        setDishName('');
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        Alert.alert('Error', msg || 'Failed to update dish');
      } finally {
        setSavingEditId(null);
      }
      return;
    }

    setCreating(true);
    try {
      const created = await createDish(eventId, name);
      setDishes((prev) => [created, ...prev]);
      setDishName('');
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('Error', msg || 'Failed to add dish');
    } finally {
      setCreating(false);
    }
  }, [dishName, editingId, eventId]);

  const startEdit = useCallback((item: Dish) => {
    setEditingId(item.id);
    setEditingName(item.dish_name);
    setDishName(item.dish_name);
  }, []);

  const handleDelete = useCallback((id: number) => {
    if (!eventId) return;
    Alert.alert('Delete Dish', 'Are you sure you want to delete this dish?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeletingId(id);
          try {
            await deleteDish(eventId, id);
            setDishes((prev) => prev.filter((d) => d.id !== id));
            if (editingId === id) {
              setEditingId(null);
              setEditingName('');
              setDishName('');
            }
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            Alert.alert('Error', msg || 'Failed to delete dish');
          } finally {
            setDeletingId(null);
          }
        },
      },
    ]);
  }, [editingId, eventId]);

  const isSavingAny = creating || savingEditId !== null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>உணவுகளைச் சேர்க்கவும்</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.inputCard}>
          <TextInput
            style={styles.inputField}
            placeholder="Enter Dish Name"
            placeholderTextColor={COLORS.textSecondary}
            value={dishName}
            onChangeText={setDishName}
            returnKeyType="done"
          />
          <GradientButton
            title={
              editingId !== null
                ? savingEditId === editingId
                  ? 'Updating...'
                  : 'Update'
                : creating
                ? 'Adding...'
                : 'Add'
            }
            onPress={handleAddOrUpdate}
            loading={isSavingAny}
            style={styles.addButton}
          />
        </View>

        <View style={styles.listHeaderRow}>
          <Text style={styles.listHeaderText}>உணவுகள்</Text>
          {loading && !initialLoading && (
            <ActivityIndicator size="small" color={COLORS.textSecondary} />
          )}
        </View>

        <View style={styles.listCard}>
          {initialLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="small" color={COLORS.textSecondary} />
            </View>
          ) : (
            <FlatList
              data={dishes}
              keyExtractor={(item) => String(item.id)}
              keyboardShouldPersistTaps="handled"
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => {
                const isDeleting = deletingId === item.id;
                return (
                  <View style={styles.row}>
                    <Text style={styles.rowText} numberOfLines={1}>
                      {item.dish_name}
                    </Text>
                    <View style={styles.rowActions}>
                      <TouchableOpacity
                        onPress={() => startEdit(item)}
                        disabled={isSavingAny || isDeleting}
                        style={styles.circleIconButton}
                      >
                        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
  <Path
    fillRule="evenodd"
    clipRule="evenodd"
    d="M20.8477 1.87868C19.6761 0.707109 17.7766 0.707105 16.605 1.87868L2.44744 16.0363C2.02864 16.4551 1.74317 16.9885 1.62702 17.5692L1.03995 20.5046C0.760062 21.904 1.9939 23.1379 3.39334 22.858L6.32868 22.2709C6.90945 22.1548 7.44285 21.8693 7.86165 21.4505L22.0192 7.29289C23.1908 6.12132 23.1908 4.22183 22.0192 3.05025L20.8477 1.87868ZM18.0192 3.29289C18.4098 2.90237 19.0429 2.90237 19.4335 3.29289L20.605 4.46447C20.9956 4.85499 20.9956 5.48815 20.605 5.87868L17.9334 8.55027L15.3477 5.96448L18.0192 3.29289ZM13.9334 7.3787L3.86165 17.4505C3.72205 17.5901 3.6269 17.7679 3.58818 17.9615L3.00111 20.8968L5.93645 20.3097C6.13004 20.271 6.30784 20.1759 6.44744 20.0363L16.5192 9.96448L13.9334 7.3787Z"
    fill="#5762ff"
  />
</Svg>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDelete(item.id)}
                        disabled={isSavingAny || isDeleting}
                        style={styles.circleIconButton}
                      >
                       {isDeleting ? (
  <ActivityIndicator size="small" color="#f00000" />
) : (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <Path
      d="M10 12V17"
      stroke="#f00000"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14 12V17"
      stroke="#f00000"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M4 7H20"
      stroke="#f00000"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M6 10V18C6 19.6569 7.34315 21 9 21H15C16.6569 21 18 19.6569 18 18V10"
      stroke="#f00000"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V7H9V5Z"
      stroke="#f00000"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
)}
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyStateWrap}>
                  <Text style={styles.emptyText}>எந்த உணவுகளும் சேர்க்கப்படவில்லை.</Text>
                </View>
              }
            />
          )}
        </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
  headerRightSpacer: {
    width: 40,
    height: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  
  listHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  listHeaderText: {
    fontSize: FONTS.bodySize,
    fontWeight: '600',
    color: COLORS.text,
  },
  
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: SPACING.md,
    borderBottomWidth: 0,
  },
  rowText: {
    flex: 1,
    fontSize: FONTS.bodySize,
    color: COLORS.text,
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  circleIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FBFBFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyText: {
    fontSize: FONTS.smallSize,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: SPACING.lg,
  },
  emptyStateWrap: {
    paddingVertical: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* New card and input styles */
  inputCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  inputField: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    fontSize: FONTS.bodySize,
    color: COLORS.text,
    backgroundColor: '#FCFCFD',
    marginRight: SPACING.md,
  },
  addButton: {
    height: 52,
    minWidth: 96,
    borderRadius: 14,
    justifyContent: 'center',
  },

  /* List card */
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 0,
  },
  listContent: {
    paddingVertical: SPACING.sm,
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: SPACING.md,
  },
});

