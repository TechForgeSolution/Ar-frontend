import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

// Screens
import DashboardScreen from '../screens/main/DashboardScreen';
import CoursTheoriqueScreen from '../screens/cours/CoursTheoriqueScreen';
import CoursPratiqueScreen from '../screens/cours/CoursPratiqueScreen';
import ParrainageScreen from '../screens/parrainage/ParrainageScreen';

// ─── Constants ────────────────────────────────────────────────────────────────

const ACTIVE_COLOR = '#2D5BE3';
const INACTIVE_COLOR = '#A0A9B8';
const BG_COLOR = '#FFFFFF';

const TABS = [
  { name: 'Dashboard',  label: 'Accueil'    },
  { name: 'Theorique',  label: 'Théorique'  },
  { name: 'Pratique',   label: 'Pratique'   },
  { name: 'Parrainage', label: 'Parrainage' },
] as const;

// ─── Icons ────────────────────────────────────────────────────────────────────

const HomeIcon = ({ color }: { color: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"
      stroke={color} strokeWidth={1.8} strokeLinejoin="round"
    />
    <Path
      d="M9 21V12h6v9"
      stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"
    />
  </Svg>
);

const BookIcon = ({ color }: { color: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    <Path d="M8 7h8M8 11h5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const CarIcon = ({ color }: { color: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path d="M5 11l1.5-4.5h11L19 11" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Rect x={2} y={11} width={20} height={7} rx={1.5} stroke={color} strokeWidth={1.8} />
    <Circle cx={6.5} cy={18} r={2} stroke={color} strokeWidth={1.8} />
    <Circle cx={17.5} cy={18} r={2} stroke={color} strokeWidth={1.8} />
    <Path d="M8.5 18h7" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

const ParrainageIcon = ({ color }: { color: string }) => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Circle cx={12} cy={5} r={2.5} stroke={color} strokeWidth={1.8} />
    <Circle cx={5} cy={17} r={2.5} stroke={color} strokeWidth={1.8} />
    <Circle cx={19} cy={17} r={2.5} stroke={color} strokeWidth={1.8} />
    <Path d="M12 7.5v3M12 10.5l-5.5 4M12 10.5l5.5 4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

function TabIcon({ name, color }: { name: string; color: string }) {
  switch (name) {
    case 'Dashboard':  return <HomeIcon color={color} />;
    case 'Theorique':  return <BookIcon color={color} />;
    case 'Pratique':   return <CarIcon color={color} />;
    case 'Parrainage': return <ParrainageIcon color={color} />;
    default:           return null;
  }
}

// ─── Custom Bottom Tab Bar ────────────────────────────────────────────────────

interface TabBarProps {
  activeIndex: number;
  onTabPress: (index: number) => void;
}

function CustomTabBar({ activeIndex, onTabPress }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBarWrapper, { paddingBottom: insets.bottom }]}>
      <View style={styles.topBorder} />
      <View style={styles.tabBar}>
        {TABS.map((tab, index) => {
          const isFocused = activeIndex === index;
          const color = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;

          return (
            <TouchableOpacity
              key={tab.name}
              activeOpacity={0.7}
              onPress={() => onTabPress(index)}
              style={styles.tabItem}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
            >
              {/* Active dot indicator */}
              <View style={[styles.indicator, isFocused && styles.indicatorActive]} />

              <View style={styles.iconWrapper}>
                <TabIcon name={tab.name} color={color} />
              </View>

              <Text style={[styles.label, { color }]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

// ─── Main Navigator ───────────────────────────────────────────────────────────

const MainNavigator: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const pagerRef = useRef<PagerView>(null);

  // Tap sur un onglet → déplace le pager avec animation
  const handleTabPress = useCallback((index: number) => {
    pagerRef.current?.setPage(index);
    setActiveIndex(index);
  }, []);

  // Swipe → met à jour l'onglet actif dans la tab bar
  const handlePageSelected = useCallback(
    (e: { nativeEvent: { position: number } }) => {
      setActiveIndex(e.nativeEvent.position);
    },
    [],
  );

  return (
    <View style={styles.container}>
      {/*
       * PagerView gère le swipe horizontal natif.
       * Chaque enfant direct est une "page" identifiée par key.
       * overdrag=false évite le rebond excessif sur iOS.
       */}
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={handlePageSelected}
        overdrag={false}
      >
        <View key="0" style={styles.page}>
          <DashboardScreen />
        </View>

        <View key="1" style={styles.page}>
          <CoursTheoriqueScreen />
        </View>

        <View key="2" style={styles.page}>
          <CoursPratiqueScreen />
        </View>

        <View key="3" style={styles.page}>
          <ParrainageScreen />
        </View>
      </PagerView>

      <CustomTabBar activeIndex={activeIndex} onTabPress={handleTabPress} />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6FA',
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },

  // ── Tab bar
  tabBarWrapper: {
    backgroundColor: BG_COLOR,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  topBorder: {
    height: 1,
    backgroundColor: '#F0F2F5',
  },
  tabBar: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: BG_COLOR,
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  indicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'transparent',
    marginBottom: 4,
  },
  indicatorActive: {
    backgroundColor: ACTIVE_COLOR,
  },
  iconWrapper: {
    marginBottom: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
});

export default MainNavigator;