import { ThreeDotsIcon } from '@/src/components/icons/ThreeDotsIcon';
import { TrashIcon } from '@/src/components/icons/TrashIcon';
import { COLORS, FONTS, SPACING } from '@/src/constants/theme';
import {
    clearTrash,
    fetchTrashEvents,
    permanentlyDeleteEvent,
} from '@/src/services/api';
import type { Event } from '@/src/types';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Alert,
    Animated,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function TrashScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [menuShowing, setMenuShowing] = useState<number | null>(null);
  const [menuAnimValue] = useState(new Animated.Value(0));

  const loadEvents = useCallback(async () => {
    try {
      const list = await fetchTrashEvents();
      setEvents(list);
    } catch (error) {
      console.error(error);
      setEvents([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [loadEvents])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  }, [loadEvents]);

  const formatDate = (d: string | null) => {
    if (!d) return 'No date';
    const date = new Date(d);
    return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handlePermanentlyDeleteEvent = useCallback(
    (eventId: number, eventTitle: string) => {
      Alert.alert(
        'நிரந்தரமாக நீக்குக',
        `"${eventTitle}" ஐ நிரந்தரமாக நீக்க விரும்புகிறீர்களா? இந்த செயல் மீளமுடியாதது.`,
        [
          { text: 'இல்லை', onPress: () => {}, style: 'cancel' },
          {
            text: 'ஆம், நீக்குக',
            onPress: async () => {
              try {
                await permanentlyDeleteEvent(eventId);
                setMenuShowing(null);
                await loadEvents();
              } catch (error) {
                Alert.alert('Error', 'Failed to delete event');
                console.error(error);
              }
            },
            style: 'destructive',
          },
        ]
      );
    },
    [loadEvents]
  );

  const handleClearTrash = useCallback(() => {
    if (events.length === 0) {
      Alert.alert('குப்பையகம் காலியாக உள்ளது', 'நீக்க வேண்டிய உருப்படிகள் இல்லை.');
      return;
    }
    Alert.alert(
      'அனைத்து குப்பையகத்தையும் நீக்குக',
      `${events.length} உருப்படி(களை) நிரந்தரமாக நீக்க விரும்புகிறீர்களா? இந்த செயல் மீளமுடியாதது.`,
      [
        { text: 'இல்லை', onPress: () => {}, style: 'cancel' },
        {
          text: 'ஆம், அனைத்தையும் நீக்குக',
          onPress: async () => {
            try {
              await clearTrash();
              setMenuShowing(null);
              await loadEvents();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear trash');
              console.error(error);
            }
          },
          style: 'destructive',
        },
      ]
    );
  }, [events.length, loadEvents]);

  const toggleMenu = useCallback((eventId: number) => {
    setMenuShowing((prev) => (prev === eventId ? null : eventId));
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.headerWrapper}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.6}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trash</Text>
        <TouchableOpacity
          style={styles.clearButton}
          onPress={handleClearTrash}
          activeOpacity={0.6}
        >
          <Text style={styles.clearButtonText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={events}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.cardWrapper}>
            <View style={styles.card}>
              <TrashIcon size={20} color={COLORS.textSecondary} />
              <View style={styles.cardMain}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={styles.cardDate}>{formatDate(item.date)}</Text>
              </View>

              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => toggleMenu(item.id)}
                activeOpacity={0.6}
              >
                <ThreeDotsIcon size={24} color={COLORS.primary} />
              </TouchableOpacity>
            </View>

            {menuShowing === item.id && (
              <Animated.View style={[styles.popupMenu]}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => handlePermanentlyDeleteEvent(item.id, item.title)}
                  activeOpacity={0.6}
                >
                  <Text style={styles.menuItemText}>Delete Permanently</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <TrashIcon size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>Trash is empty</Text>
            <Text style={styles.emptySubtext}>Deleted items will appear here</Text>
          </View>
        }
      />

      {menuShowing !== null && (
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setMenuShowing(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    fontSize: FONTS.bodySize,
    color: COLORS.primary,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: FONTS.bodySize,
    fontWeight: '700',
    color: COLORS.text,
  },
  clearButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  clearButtonText: {
    fontSize: FONTS.smallSize,
    color: '#DC2626',
    fontWeight: '600',
  },
  listContent: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  cardWrapper: {
    marginBottom: SPACING.md,
    position: 'relative',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: SPACING.md,
  },
  cardMain: {
    flex: 1,
  },
  cardTitle: {
    fontSize: FONTS.bodySize,
    fontWeight: '600',
    color: COLORS.text,
  },
  cardDate: {
    fontSize: FONTS.smallSize,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  menuButton: {
    padding: SPACING.sm,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99,
  },
  popupMenu: {
    position: 'absolute',
    right: SPACING.md,
    top: 44,
    minWidth: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 100,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: FONTS.bodySize,
    color: '#DC2626',
    fontWeight: '600',
  },
  empty: {
    paddingVertical: SPACING.xl * 2,
    alignItems: 'center',
    gap: SPACING.md,
  },
  emptyText: {
    fontSize: FONTS.bodySize,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: FONTS.smallSize,
    color: COLORS.textSecondary,
  },
});
