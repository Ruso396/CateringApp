import { AppHeader } from '@/src/components/AppHeader';
import { SPACING } from '@/src/constants/theme';
import { fetchEvents, permanentlyDeleteEvent } from '@/src/services/api';
import type { Event } from '@/src/types';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import vector from '../assets/Vector.png';

const POPUP_MENU_WIDTH = 140;
const POPUP_GAP = 4;

export function HomeScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [menuOpenEventId, setMenuOpenEventId] = useState<number | null>(null);
  const [popupAnchor, setPopupAnchor] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const menuAnchorRef = useRef<View>(null);

  const loadEvents = useCallback(async () => {
    try {
      const list = await fetchEvents();
      setEvents(list ?? []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('Error', msg);
      setEvents([]);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadEvents();
    }, [loadEvents])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  useEffect(() => {
    if (menuOpenEventId === null) {
      setPopupAnchor(null);
      return;
    }
    const t = setTimeout(() => {
      (menuAnchorRef.current as any)?.measureInWindow?.((x: number, y: number, width: number, height: number) => {
        setPopupAnchor({ x, y, width, height });
      });
    }, 0);
    return () => clearTimeout(t);
  }, [menuOpenEventId]);

  const formatDate = (d: string | null) => {
    if (!d) return '';
    const date = new Date(d);
    return date.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleDeletePress = (eventId: number) => {
    setMenuOpenEventId(null);

    Alert.alert(
      'Confirm Delete',
      'Are you sure you want to delete this event?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: async () => {
            try {
              await permanentlyDeleteEvent(eventId);
              await loadEvents();
            } catch (e) {
              const msg = e instanceof Error ? e.message : String(e);
              Alert.alert('Error', msg);
            }
          },
        },
      ]
    );
  };

  const filteredEvents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return events;
    }
    return events.filter((event) =>
      event.title?.toLowerCase().startsWith(query)
    );
  }, [events, searchQuery]);

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <FlatList
        data={filteredEvents}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <TouchableOpacity
              style={styles.listItemMain}
              onPress={() => router.push(`/edit/${item.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.fileBox}>
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M9 17H15M9 13H15M9 9H10M13 3H8.2C7.0799 3 6.51984 3 6.09202 3.21799C5.71569 3.40973 5.40973 3.71569 5.21799 4.09202C5 4.51984 5 5.0799 5 6.2V17.8C5 18.9201 5 19.4802 5.21799 19.908C5.40973 20.2843 5.71569 20.5903 6.09202 20.782C6.51984 21 7.0799 21 8.2 21H15.8C16.9201 21 17.4802 21 17.908 20.782C18.2843 20.5903 18.5903 20.2843 18.782 19.908C19 19.4802 19 18.9201 19 17.8V9M13 3L19 9M13 3V7.4C13 7.96005 13 8.24008 13.109 8.45399C13.2049 8.64215 13.3578 8.79513 13.546 8.89101C13.7599 9 14.0399 9 14.6 9H19"
                    stroke="#000"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.date}>{formatDate(item.date)}</Text>
              </View>
            </TouchableOpacity>

            <View
              ref={menuOpenEventId === item.id ? menuAnchorRef : undefined}
              collapsable={false}
            >
              <TouchableOpacity
                onPress={() => setMenuOpenEventId((prev) => (prev === item.id ? null : item.id))}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Svg width={18} height={18} viewBox="0 0 24 24">
                  <Path
                    d="M12 5A1.5 1.5 0 1 0 12 8A1.5 1.5 0 1 0 12 5ZM12 10.5A1.5 1.5 0 1 0 12 13.5A1.5 1.5 0 1 0 12 10.5ZM12 16A1.5 1.5 0 1 0 12 19A1.5 1.5 0 1 0 12 16Z"
                    fill="#555"
                  />
                </Svg>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal
        transparent
        visible={menuOpenEventId !== null}
        animationType="fade"
        onRequestClose={() => setMenuOpenEventId(null)}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuOpenEventId(null)}>
          {popupAnchor !== null && (
            <View
              style={[
                styles.popupMenu,
                {
                  position: 'absolute',
                  left: popupAnchor.x + popupAnchor.width - POPUP_MENU_WIDTH,
                  top: popupAnchor.y + popupAnchor.height + POPUP_GAP,
                },
              ]}
              onStartShouldSetResponder={() => true}
            >
              <TouchableOpacity
                style={styles.popupMenuItem}
                onPress={() => {
                  if (menuOpenEventId !== null) handleDeletePress(menuOpenEventId);
                }}
                activeOpacity={0.7}
              >
                <Svg width={18} height={18} viewBox="0 0 24 24" style={styles.popupMenuIcon}>
                  <Path
                    d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6"
                    stroke="#DC2626"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <Text style={styles.popupMenuDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          )}
        </Pressable>
      </Modal>

      <TouchableOpacity
        style={styles.createButton}
        onPress={() => router.push('/create')}
        activeOpacity={0.8}
      >
        <Image source={vector} style={styles.createIcon} />
        <Text style={styles.createText}>Create List</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F7F7' },
  listContainer: { padding: 16, paddingBottom: 100 },

  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },

  listItemMain: { flex: 1, flexDirection: 'row', alignItems: 'center' },

  popupMenu: {
    width: POPUP_MENU_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },

  popupMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },

  popupMenuIcon: {
    marginRight: 10,
  },

  popupMenuDeleteText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#DC2626',
  },

  fileBox: {
    width: 50,
    height: 50,
    backgroundColor: '#EAEAEA',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  title: { fontSize: 16, fontWeight: '600', color: '#222' },
  date: { fontSize: 13, color: '#777', marginTop: 4 },

  createButton: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e1e1e1',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 30,
  },

  createIcon: { width: 20, height: 20, resizeMode: 'contain' },
  createText: { marginLeft: 8, fontSize: 15, fontWeight: '700', color: '#000' },
});