import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, User, Phone, AlertCircle, Search, X } from 'lucide-react-native';
import { theme } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../config/api';
import { validatePhone, validateAmount } from '../../utils/validators';
import { formatCurrency } from '../../utils/formatters';
import Toast from 'react-native-toast-message';

interface Destinataire {
  id: number;
  nom: string;
  prenom: string;
  telephone: string;
}

export default function TransfertScreen() {
  const { token, user, refreshUser } = useAuth();
  const [telephone, setTelephone] = useState('');
  const [montant, setMontant] = useState('');
  const [destinataire, setDestinataire] = useState<Destinataire | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);

  const handleSearchDestinataire = async () => {
    if (!validatePhone(telephone)) {
      Toast.show({ type: 'error', text1: 'Numero invalide', text2: 'Veuillez entrer un numero valide' });
      return;
    }
    setIsSearching(true);
    try {
      const response = await apiRequest<{ success: boolean; destinataire: Destinataire }>(
        `/transfert/rechercher?telephone=${telephone}`,
        { method: 'GET' },
        token
      );
      if (response.success) {
        setDestinataire(response.destinataire);
        Toast.show({ type: 'success', text1: 'Utilisateur trouve', text2: `${response.destinataire.prenom} ${response.destinataire.nom}` });
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Utilisateur non trouve', text2: error.message || 'Aucun utilisateur avec ce numero' });
      setDestinataire(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleTransfert = async () => {
    if (!destinataire) {
      Toast.show({ type: 'error', text1: 'Destinataire requis', text2: 'Veuillez rechercher un destinataire' });
      return;
    }
    const amount = parseInt(montant);
    const validation = validateAmount(amount, 1000);
    if (!validation.valid) {
      Toast.show({ type: 'error', text1: 'Montant invalide', text2: validation.message });
      return;
    }
    if (user && amount > user.solde) {
      Toast.show({ type: 'error', text1: 'Solde insuffisant', text2: `Votre solde: ${formatCurrency(user.solde)}` });
      return;
    }
    setIsTransferring(true);
    try {
      const response = await apiRequest<{ success: boolean; message: string; nouveau_solde: number; destinataire: { nom: string; prenom: string } }>(
        '/transfert',
        { method: 'POST', body: JSON.stringify({ telephone_destinataire: telephone, montant: amount }) },
        token
      );
      if (response.success) {
        Toast.show({ type: 'success', text1: 'Transfert reussi', text2: `Nouveau solde: ${formatCurrency(response.nouveau_solde)}` });
        await refreshUser();
        setTelephone('');
        setMontant('');
        setDestinataire(null);
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: error.message || 'Impossible d\'effectuer le transfert' });
    } finally {
      setIsTransferring(false);
    }
  };

  const handleReset = () => {
    setTelephone('');
    setMontant('');
    setDestinataire(null);
  };

  return (
    <SafeAreaView style={styles.wrapper} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* Balance Card */}
        {user && (
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>SOLDE ACTUEL</Text>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceAmount}>{formatCurrency(user.solde)}</Text>
              <View style={styles.balanceIconContainer}>
                <Send size={20} color="#2563EB" />
              </View>
            </View>
          </View>
        )}

        {/* Destinataire Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DESTINATAIRE</Text>

          <Text style={styles.inputLabel}>Numéro du destinataire</Text>
          <View style={styles.searchRow}>
            <View style={styles.searchInputContainer}>
              <Phone size={16} color="#94A3B8" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="690123456"
                placeholderTextColor="#B0BFCE"
                keyboardType="phone-pad"
                value={telephone}
                onChangeText={(text) => { setTelephone(text); setDestinataire(null); }}
                maxLength={9}
                editable={!isSearching && !isTransferring}
              />
            </View>
            <TouchableOpacity
              style={[styles.searchButton, (isSearching || isTransferring) && styles.searchButtonDisabled]}
              onPress={handleSearchDestinataire}
              disabled={isSearching || isTransferring}
              activeOpacity={0.8}
            >
              {isSearching ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Search size={18} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>

          {/* Destinataire Card */}
          {destinataire && (
            <View style={styles.destinataireCard}>
              <View style={styles.destinataireAvatar}>
                <User size={22} color="#2563EB" />
              </View>
              <View style={styles.destinataireInfo}>
                <Text style={styles.destinataireNom}>
                  {destinataire.prenom} {destinataire.nom}
                </Text>
                <Text style={styles.destinataireTel}>{destinataire.telephone}</Text>
              </View>
              <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
                <X size={16} color="#64748B" />
              </TouchableOpacity>
            </View>
          )}

          {/* Info banner when no destinataire */}
          {!destinataire && (
            <View style={styles.infoBanner}>
              <AlertCircle size={16} color="#2563EB" />
              <Text style={styles.infoBannerText}>
                Recherchez d'abord le destinataire avant de saisir le montant
              </Text>
            </View>
          )}
        </View>

        {/* Montant Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MONTANT</Text>

          <Text style={styles.inputLabel}>Montant à transférer (FCFA)</Text>
          <View style={[styles.amountInputContainer, !destinataire && styles.amountInputDisabled]}>
            <TextInput
              style={styles.amountInput}
              placeholder="Ex: 15 000"
              placeholderTextColor="#B0BFCE"
              keyboardType="numeric"
              value={montant}
              onChangeText={setMontant}
              editable={!isTransferring && !!destinataire}
            />
            <Text style={styles.currencyLabel}>FCFA</Text>
          </View>
          <Text style={styles.hintText}>Aucun frais de transfert appliqué</Text>
        </View>

        {/* Submit */}
        <View style={styles.submitSection}>
          <TouchableOpacity
            style={[styles.submitButton, (!destinataire || isTransferring) && styles.submitButtonDisabled]}
            onPress={handleTransfert}
            disabled={!destinataire || isTransferring}
            activeOpacity={0.85}
          >
            {isTransferring ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Send size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.submitButtonText}>Effectuer le transfert</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Warning banner */}
        <View style={styles.warningBanner}>
          <AlertCircle size={16} color="#D97706" />
          <Text style={styles.warningText}>
            Vérifiez bien les informations du destinataire avant de valider. Cette opération est irréversible.
          </Text>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },

  // Balance Card
  balanceCard: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#DBEAFE',
    borderRadius: 16,
    padding: 20,
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

  // Sections
  section: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1.1,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 8,
  },

  // Search row
  searchRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1E293B',
    fontWeight: '500',
    padding: 0,
  },
  searchButton: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  searchButtonDisabled: {
    opacity: 0.55,
  },

  // Destinataire card
  destinataireCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    padding: 14,
    marginBottom: 4,
  },
  destinataireAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  destinataireInfo: {
    flex: 1,
  },
  destinataireNom: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  destinataireTel: {
    fontSize: 12,
    color: '#64748B',
  },
  resetButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Info banner
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '500',
    lineHeight: 17,
  },

  // Amount input
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 6,
  },
  amountInputDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
    padding: 0,
  },
  currencyLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  hintText: {
    fontSize: 11,
    color: '#22C55E',
    fontWeight: '500',
    marginTop: 2,
  },

  // Submit
  submitSection: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  submitButton: {
    backgroundColor: '#2563EB',
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  submitButtonDisabled: {
    opacity: 0.45,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // Warning
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#D97706',
    fontWeight: '500',
    lineHeight: 17,
  },
});