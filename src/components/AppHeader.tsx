import { useProfile } from '@/src/context/ProfileContext';
import { useRouter } from 'expo-router';
import React from 'react';
import {
    Animated,
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

type AppHeaderProps = {
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
};

const SCREEN_WIDTH = Dimensions.get('window').width;
const DRAWER_WIDTH = SCREEN_WIDTH * 0.78;

export function AppHeader({ searchQuery, onSearchChange }: AppHeaderProps) {
  const router = useRouter();
  const { profile } = useProfile();
  const [internalSearch, setInternalSearch] = React.useState('');
  const [menuPanelVisible, setMenuPanelVisible] = React.useState(false);
  const slideAnim = React.useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: menuPanelVisible ? 0 : -DRAWER_WIDTH,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [menuPanelVisible]);

  const handleProfilePress = () => {
    router.push('/profile');
  };

  return (
    <>
      <View style={styles.header}>
        
        {/* Menu Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setMenuPanelVisible(!menuPanelVisible)}
        >
          {menuPanelVisible ? (
            <Text style={{ fontSize: 22 }}>✕</Text>
          ) : (
            <Svg width={22} height={22} viewBox="0 0 24 24">
              <Path
                d="M3 6H21M3 12H21M3 18H21"
                stroke="#333"
                strokeWidth={2}
                strokeLinecap="round"
              />
            </Svg>
          )}
        </TouchableOpacity>

        {/* Search Box */}
        <View style={styles.searchBox}>
          <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path
              d="M16.6725 16.6412L21 21M19 11C19 15.4183 15.4183 19 11 19C6.58172 19 3 15.4183 3 11C3 6.58172 6.58172 3 11 3C15.4183 3 19 6.58172 19 11Z"
              stroke="#000"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>

          <TextInput
            style={styles.searchInput}
            value={searchQuery ?? internalSearch}
            onChangeText={(text) => {
              if (onSearchChange) {
                onSearchChange(text);
              } else {
                setInternalSearch(text);
              }
            }}
          />
        </View>

        {/* Avatar */}
        <TouchableOpacity
          style={styles.avatarWrap}
          onPress={handleProfilePress}
          activeOpacity={0.8}
        >
          {profile ? (
            profile.profile_image ? (
              <Image
                source={{ uri: profile.profile_image }}
                style={styles.avatar}
              />
            ) : profile.name ? (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarLetter}>
                  {profile.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            ) : null
          ) : (
            // Profile load aagum varaikkum empty
            <View style={styles.avatarLoading} />
          )}
        </TouchableOpacity>

      </View>

      {menuPanelVisible && (
        <View style={styles.menuOverlay}>
          <TouchableOpacity
            style={styles.menuBackdrop}
            activeOpacity={1}
            onPress={() => setMenuPanelVisible(false)}
          />

          <Animated.View
            style={[
              styles.menuPanel,
              { transform: [{ translateX: slideAnim }] },
            ]}
          >
            <SafeAreaView style={styles.safeArea}>
              
              <Text style={styles.menuTitle}>Menu</Text>

              <View style={styles.divider} />

              <TouchableOpacity
                style={styles.menuItemRow}
                activeOpacity={0.8}
                onPress={() => {
                  setMenuPanelVisible(false);
                  router.push('/adddish');
                }}
              >
                <Svg width={20} height={20} viewBox="0 0 24 24">
                  <Path
                    d="M12 5V19M5 12H19"
                    stroke="#111827"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
                <Text style={styles.menuItemText}>உணவுகள் சேர்க்க</Text>
              </TouchableOpacity>

            </SafeAreaView>
          </Animated.View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#F3F3F3',
  },

  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAEAEA',
    marginHorizontal: 12,
    paddingHorizontal: 12,
    borderRadius: 25,
    height: 40,
  },

  searchInput: {
    flex: 1,
    marginLeft: 8,
  },

  avatarWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },

  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },

  avatarPlaceholder: {
    flex: 1,
    backgroundColor: '#8BA6B8',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },

  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  avatarLoading: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    borderRadius: 20,
  },

  menuOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    flexDirection: 'row',
  },

  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },

  menuPanel: {
    width: DRAWER_WIDTH,
    backgroundColor: '#FFFFFF',
    elevation: 8,
  },

  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
  },

  menuTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
  },

  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 10,
  },

  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },

  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
  },
});