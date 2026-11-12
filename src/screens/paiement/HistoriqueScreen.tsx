import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  CreditCard,
  Wallet,
  Calendar,
} from 'lucide-react-native';
import { theme } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../config/api';
import { Paiement } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import Toast from 'react-native-toast-message';

export default function HistoriqueScreen() {
  const { token, user } = useAuth();
  const [paiements, setPaiements] = useState<Paiement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadHistorique();
  }, []);

  const loadHistorique = async () => {
    try {
      const response = await apiRequest<{ success: boolean; paiements: Paiement[]; solde_actuel: number }>(
        '/historique?limit=50', { method: 'GET' }, token
      );
      if (response.success) setPaiements(response.paiements);
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: error.message || 'Impossible de charger l\'historique' });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => { setIsRefreshing(true); loadHistorique(); };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'depot':
      case 'transfert_entrant':
        return <ArrowDownCircle size={22} color="#22C55E" />;
      case 'transfert_sortant':
        return <ArrowUpCircle size={22} color="#D97706" />;
      case 'paiement_frais':
        return <CreditCard size={22} color="#EF4444" />;
      default:
        return <Wallet size={22} color="#94A3B8" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'depot':
      case 'transfert_entrant': return '#22C55E';
      case 'transfert_sortant': return '#D97706';
      case 'paiement_frais': return '#EF4444';
      default: return '#94A3B8';
    }
  };

  const getTransactionIconBg = (type: string) => {
    switch (type) {
      case 'depot':
      case 'transfert_entrant': return '#F0FDF4';
      case 'transfert_sortant': return '#FFFBEB';
      case 'paiement_frais': return '#FEF2F2';
      default: return '#F8FAFC';
    }
  };

  const getTransactionLabel = (type: string) => {
    switch (type) {
      case 'depot': return 'Dépôt';
      case 'transfert_entrant': return 'Transfert reçu';
      case 'transfert_sortant': return 'Transfert envoyé';
      case 'paiement_frais': return 'Paiement de frais';
      default: return 'Transaction';
    }
  };

  const getMethodeLabel = (methode: string) => {
    switch (methode) {
      case 'mobile_money': return 'Mobile Money';
      case 'code_caisse': return 'Code Caisse';
      case 'transfert': return 'Transfert';
      case 'systeme': return 'Système';
      default: return methode;
    }
  };

  const renderPaiement = ({ item }: { item: Paiement }) => {
    const isPositive = item.type === 'depot' || item.type === 'transfert_entrant';
    const color = getTransactionColor(item.type);
    const bgColor = getTransactionIconBg(item.type);

    return (
      <View style={styles.transactionCard}>
        {/* Icon */}
        <View style={[styles.transactionIconBox, { backgroundColor: bgColor }]}>
          {getTransactionIcon(item.type)}
        </View>

        {/* Content */}
        <View style={styles.transactionContent}>
          <View style={styles.transactionTopRow}>
            <Text style={styles.transactionLabel}>{getTransactionLabel(item.type)}</Text>
            <Text style={[styles.transactionMontant, { color }]}>
              {isPositive ? '+' : '-'}{formatCurrency(item.montant)}
            </Text>
          </View>

          {item.description && (
            <Text style={styles.transactionDescription} numberOfLines={2}>
              {item.description}
            </Text>
          )}

          <View style={styles.transactionMeta}>
            <View style={styles.metaLeft}>
              <Calendar size={11} color="#94A3B8" />
              <Text style={styles.metaText}>{formatDateTime(item.created_at)}</Text>
            </View>
            <Text style={styles.methodeLabel}>{getMethodeLabel(item.methode)}</Text>
          </View>

          {/* Solde before/after */}
          <View style={styles.soldeLine}>
            <Text style={styles.soldeText}>{formatCurrency(item.solde_avant)}</Text>
            <View style={styles.soldeArrowLine} />
            <Text style={styles.soldeText}>{formatCurrency(item.solde_apres)}</Text>
          </View>

          {/* Status badge (only if not 'valide') */}
          {item.status && item.status !== 'valide' && (
            <View style={[
              styles.statusBadge,
              { backgroundColor: item.status === 'en_attente' ? '#FEF9C3' : '#FEF2F2' }
            ]}>
              <Text style={[
                styles.statusText,
                { color: item.status === 'en_attente' ? '#D97706' : '#EF4444' }
              ]}>
                {item.status === 'en_attente' ? 'En attente' : item.status}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.wrapper} edges={['top', 'left', 'right', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>HISTORIQUE</Text>
        {user && (
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>SOLDE ACTUEL</Text>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceAmount}>{formatCurrency(user.solde)}</Text>
              <View style={styles.balanceIconContainer}>
                <Wallet size={20} color="#2563EB" />
              </View>
            </View>
          </View>
        )}
      </View>

      {paiements.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBox}>
            <Wallet size={40} color="#94A3B8" />
          </View>
          <Text style={styles.emptyTitle}>Aucune transaction</Text>
          <Text style={styles.emptyText}>Votre historique de transactions apparaîtra ici</Text>
        </View>
      ) : (
        <FlatList
          data={paiements}
          renderItem={renderPaiement}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#2563EB" />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#64748B',
  },

  // Header
  header: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1.2,
    marginBottom: 10,
  },

  // Balance Card
  balanceCard: {
    backgroundColor: '#DBEAFE',
    borderRadius: 16,
    padding: 20,
    marginBottom: 8,
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2563EB',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceAmount: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: 0.5,
  },
  balanceIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // List
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 10,
  },

  // Transaction card
  transactionCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 14,
    gap: 12,
  },
  transactionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  transactionContent: {
    flex: 1,
    gap: 5,
  },
  transactionTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  transactionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
  },
  transactionMontant: {
    fontSize: 15,
    fontWeight: '800',
  },
  transactionDescription: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  transactionMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  methodeLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontStyle: 'italic',
  },

  // Solde before/after
  soldeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 6,
    marginTop: 2,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 8,
  },
  soldeText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  soldeArrowLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },

  // Status badge
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    marginTop: 2,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 12,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  emptyText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 19,
  },
});