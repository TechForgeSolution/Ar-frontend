import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../../config/theme';
import { apiRequest } from '../../config/api';
import { Module, ProgressionType, MainStackParamList } from '../../types';
import { useAuth } from '../../context/AuthContext';
import Toast from 'react-native-toast-message';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

type NavProp = NativeStackNavigationProp<MainStackParamList>;

export default function CoursTheoriqueScreen() {
  const navigation = useNavigation<NavProp>();
  const [modules, setModules] = useState<Module[]>([]);
  const [progression, setProgression] = useState<ProgressionType | null>(null);
  const [premierDepotEffectue, setPremierDepotEffectue] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { token, user } = useAuth();
  const isMoto = user?.type_permis === 'permis_a';

  useEffect(() => {
    loadCoursTheorique();
  }, []);

  const loadCoursTheorique = async () => {
    try {
      const response = await apiRequest<any>('/cours/theorique', {}, token);
      if (response.success) {
        setModules(response.modules);
        setProgression(response.progression);
        setPremierDepotEffectue(response.premier_depot_effectue || false);
      }
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: error.message || 'Impossible de charger les cours',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCoursTheorique();
  };

  const renderProgressCard = () => {
    if (!progression || !premierDepotEffectue) return null;
    return (
      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>Votre progression</Text>
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Ionicons name="book" size={20} color={theme.colors.primary} />
            <Text style={styles.progressLabel}>Leçons</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progression.lecons.pourcentage}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {progression.lecons.completes}/{progression.lecons.total} complétées ({progression.lecons.pourcentage.toFixed(0)}%)
          </Text>
        </View>
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Ionicons name="help-circle" size={20} color={theme.colors.secondary} />
            <Text style={styles.progressLabel}>Quiz</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progression.quiz.pourcentage}%`, backgroundColor: theme.colors.secondary }]} />
          </View>
          <Text style={styles.progressText}>
            {progression.quiz.reussis}/{progression.quiz.total} réussis ({progression.quiz.pourcentage.toFixed(0)}%)
          </Text>
        </View>
        <View style={styles.globalProgress}>
          <Text style={styles.globalLabel}>Progression globale</Text>
          <Text style={styles.globalValue}>{progression.global.pourcentage.toFixed(1)}%</Text>
        </View>
      </View>
    );
  };

  const renderDepotInfoCard = () => {
    if (premierDepotEffectue) return null;
    return (
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={32} color={theme.colors.warning} />
        <Text style={styles.infoTitle}>Accès limité</Text>
        <Text style={styles.infoText}>
          Vous pouvez consulter la structure des cours (modules, chapitres, leçons),
          mais pour accéder au contenu complet des leçons, veuillez effectuer votre premier dépôt.
        </Text>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Paiement')}
        >
          <Text style={styles.buttonText}>Faire un dépôt</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderModuleItem = ({ item }: { item: Module }) => (
    <TouchableOpacity
      style={styles.moduleCard}
      onPress={() => {
        navigation.navigate('ModuleDetail', {
          moduleId: item.id,
          type: 'theorique',
          premierDepotEffectue,
        });
      }}
    >
      <View style={styles.moduleHeader}>
        <View style={styles.moduleIcon}>
          <Ionicons
            name={item.complete ? 'checkmark-circle' : 'book'}
            size={32}
            color={item.complete ? theme.colors.success : theme.colors.primary}
          />
        </View>
        <View style={styles.moduleInfo}>
          <Text style={styles.moduleName}>{item.nom}</Text>
          {item.description && (
            <Text style={styles.moduleDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.moduleFooter}>
        <View style={styles.moduleStats}>
          <Ionicons name="book-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.statText}>{item.chapitres.length} chapitres</Text>
        </View>
        <View style={styles.moduleAction}>
          {!premierDepotEffectue && (
            <Ionicons name="lock-closed-outline" size={16} color={theme.colors.warning} style={{ marginRight: 4 }} />
          )}
          <Text style={[styles.actionText, !premierDepotEffectue && { color: theme.colors.warning }]}>
            {premierDepotEffectue ? (item.complete ? 'Revoir' : 'Commencer') : 'Aperçu'}
          </Text>
          <Ionicons name="chevron-forward" size={20} color={premierDepotEffectue ? theme.colors.primary : theme.colors.warning} />
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Chargement des cours...</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <FlatList
          data={modules}
          renderItem={renderModuleItem}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={
            <>
              {renderDepotInfoCard()}
              {renderProgressCard()}
            </>
          }
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="book-outline" size={64} color={theme.colors.textMuted} />
              <Text style={styles.emptyTitle}>Aucun module disponible</Text>
              <Text style={styles.emptyText}>
                Les cours théoriques {isMoto ? 'du permis moto' : ''} seront bientôt disponibles
              </Text>
            </View>
          }
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  listContent: {
    padding: theme.spacing.md,
  },
  loadingText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  infoCard: {
    backgroundColor: theme.colors.warningLight || '#FFF3CD',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.warning,
  },
  infoTitle: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  infoText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  progressCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  progressTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  progressSection: {
    marginBottom: theme.spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  progressLabel: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.borderLight,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
    marginBottom: theme.spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
  },
  progressText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  globalProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  globalLabel: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  globalValue: {
    ...theme.typography.h3,
    color: theme.colors.primary,
  },
  moduleCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    ...theme.shadows.md,
  },
  moduleHeader: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
  },
  moduleIcon: {
    marginRight: theme.spacing.md,
  },
  moduleInfo: {
    flex: 1,
  },
  moduleName: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  moduleDescription: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  moduleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moduleStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  moduleAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    ...theme.typography.body,
    fontWeight: '600',
    color: theme.colors.primary,
    marginRight: theme.spacing.xs,
  },
  emptyTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.md,
  },
  buttonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
  },
});