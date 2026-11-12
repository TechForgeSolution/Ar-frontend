import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import WebView from 'react-native-webview';
import { CreditCard, Smartphone, Zap } from 'lucide-react-native';
import { theme } from '../../config/theme';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../config/api';
import { formatCurrency} from '../../utils/formatters';
import { validateAmount } from '../../utils/validators';
import Toast from 'react-native-toast-message';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../../types';

type PaymentMethod = 'mobile' | 'code_caisse';
type NavigationProp = NativeStackNavigationProp<MainStackParamList>;

const QUICK_AMOUNTS = [2000, 5000, 10000, 25000];

export default function PaiementScreen() {
  const { token, refreshUser, user } = useAuth();
  const navigation = useNavigation<NavigationProp>();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('mobile');
  const [montant, setMontant] = useState('');
  const [numeroPayeur, setNumeroPayeur] = useState('');
  const [codeCaisse, setCodeCaisse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [selectedQuickAmount, setSelectedQuickAmount] = useState<number | null>(5000);

  const handleDepotMobile = async () => {
    const amount = parseInt(montant);
    const validation = validateAmount(amount);
    if (!validation.valid) {
      Toast.show({ type: 'error', text1: 'Montant invalide', text2: validation.message });
      return;
    }
    if (!numeroPayeur || numeroPayeur.length !== 9) {
      Toast.show({ type: 'error', text1: 'Numero invalide', text2: 'Veuillez entrer un numero valide' });
      return;
    }
    setIsLoading(true);
    try {
      const response = await apiRequest<{ success: boolean; message: string; nouveau_solde?: number; url?: string; }>(
        '/depot/mobile',
        { method: 'POST', body: JSON.stringify({ montant: amount, numero_payeur: numeroPayeur }) },
        token
      );
      if (response.success) {
        if (response.url) {
          setPaymentUrl(response.url);
          setShowWebView(true);
        } else {
          Toast.show({ type: 'success', text1: 'Depot reussi' });
          await refreshUser();
          setMontant('');
          setNumeroPayeur('');
        }
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: error.message || 'Impossible d\'effectuer le depot' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDepotCodeCaisse = async () => {
    if (!codeCaisse || codeCaisse.trim() === '') {
      Toast.show({ type: 'error', text1: 'Code requis', text2: 'Veuillez entrer le code caisse' });
      return;
    }
    setIsLoading(true);
    try {
      const response = await apiRequest<{ success: boolean; message: string; nouveau_solde: number; }>(
        '/depot/code-caisse',
        { method: 'POST', body: JSON.stringify({ code: codeCaisse }) },
        token
      );
      if (response.success) {
        Toast.show({ type: 'success', text1: 'Depot reussi', text2: `Nouveau solde: ${formatCurrency(response.nouveau_solde)}` });
        await refreshUser();
        setCodeCaisse('');
      }
    } catch (error: any) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: error.message || 'Code caisse invalide' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (selectedMethod === 'mobile') {
      handleDepotMobile();
    } else {
      handleDepotCodeCaisse();
    }
  };

  const handleWebViewClose = async () => {
    setShowWebView(false);
    Toast.show({ type: 'success', text1: 'Paiement effectué', text2: 'Votre paiement a été traité avec succès' });
    await refreshUser();
    navigation.navigate('Dashboard');
  };

  const handleQuickAmount = (amount: number) => {
    setSelectedQuickAmount(amount);
    setMontant(amount.toString());
  };

  return (
    <>
      <SafeAreaView style={styles.wrapper} edges={["top", "left", "right", "bottom"]}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* Balance Card */}
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>SOLDE ACTUEL</Text>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceAmount}>{formatCurrency(user?.solde ?? 0)}</Text>
              <View style={styles.balanceIconContainer}>
                <CreditCard size={22} color="#2563EB" />
              </View>
            </View>
          </View>

          {/* Recharge Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DÉTAILS DE LA RECHARGE</Text>

            <Text style={styles.inputLabel}>Montant à recharger (FCFA)</Text>
            <View style={styles.amountInputContainer}>
              <TextInput
                style={styles.amountInput}
                placeholder="Ex: 5 000"
                placeholderTextColor="#B0BFCE"
                keyboardType="numeric"
                value={montant}
                onChangeText={(v) => { setMontant(v); setSelectedQuickAmount(null); }}
                editable={!isLoading}
              />
              <Text style={styles.currencyLabel}>FCFA</Text>
            </View>

            {/* Quick amount buttons */}
            <View style={styles.quickAmounts}>
              {QUICK_AMOUNTS.map((amount) => (
                <TouchableOpacity
                  key={amount}
                  style={[
                    styles.quickAmountBtn,
                    selectedQuickAmount === amount && styles.quickAmountBtnActive,
                  ]}
                  onPress={() => handleQuickAmount(amount)}
                >
                  <Text
                    style={[
                      styles.quickAmountText,
                      selectedQuickAmount === amount && styles.quickAmountTextActive,
                    ]}
                  >
                    + {amount >= 1000 ? `${amount / 1000} 000` : amount}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Payment Method */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>MODE DE PAIEMENT</Text>

            {/* Mobile Money */}
            <TouchableOpacity
              style={[
                styles.methodCard,
                selectedMethod === 'mobile' && styles.methodCardActive,
              ]}
              onPress={() => setSelectedMethod('mobile')}
              activeOpacity={0.8}
            >
              <View style={[styles.methodIconBox, styles.methodIconBoxOrange]}>
                <Smartphone size={22} color="#EA580C" />
              </View>
              <View style={styles.methodContent}>
                <Text style={styles.methodTitle}>Mobile Money</Text>
                <Text style={styles.methodDescription}>Orange Money, MTN, Moov</Text>
              </View>
              <View style={[styles.radio, selectedMethod === 'mobile' && styles.radioActive]}>
                {selectedMethod === 'mobile' && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>

            {/* Mobile Money extra fields */}
            {selectedMethod === 'mobile' && (
              <View style={styles.extraFields}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Numéro du payeur</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="690123456"
                    placeholderTextColor="#B0BFCE"
                    keyboardType="phone-pad"
                    value={numeroPayeur}
                    onChangeText={setNumeroPayeur}
                    maxLength={9}
                    editable={!isLoading}
                  />
                </View>
              </View>
            )}

            {/* Code Caisse */}
            <TouchableOpacity
              style={[
                styles.methodCard,
                selectedMethod === 'code_caisse' && styles.methodCardActive,
              ]}
              onPress={() => setSelectedMethod('code_caisse')}
              activeOpacity={0.8}
            >
              <View style={[styles.methodIconBox, styles.methodIconBoxBlue]}>
                <CreditCard size={22} color="#2563EB" />
              </View>
              <View style={styles.methodContent}>
                <Text style={styles.methodTitle}>Code Caisse</Text>
                <Text style={styles.methodDescription}>Recharge en point de vente</Text>
              </View>
              <View style={[styles.radio, selectedMethod === 'code_caisse' && styles.radioActive]}>
                {selectedMethod === 'code_caisse' && <View style={styles.radioInner} />}
              </View>
            </TouchableOpacity>

            {/* Code Caisse extra fields */}
            {selectedMethod === 'code_caisse' && (
              <View style={styles.extraFields}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Code Caisse</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Entrez le code fourni"
                    placeholderTextColor="#B0BFCE"
                    value={codeCaisse}
                    onChangeText={setCodeCaisse}
                    autoCapitalize="characters"
                    editable={!isLoading}
                  />
                </View>
              </View>
            )}
          </View>

          {/* Submit Button */}
          <View style={styles.submitSection}>
            <TouchableOpacity
              style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Zap size={18} color="#FFFFFF" style={styles.zapIcon} />
                  <Text style={styles.submitButtonText}>Recharger maintenant</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.legalText}>
              En procédant au paiement, vous acceptez nos conditions générales d'utilisation. Les frais de transaction peuvent s'appliquer.
            </Text>
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>
      </SafeAreaView>

      {showWebView && (
        <Modal visible={showWebView} onRequestClose={handleWebViewClose} animationType="slide">
          <WebView
            source={{ uri: paymentUrl }}
            onNavigationStateChange={(navState) => {
              if (navState.url.includes('end_payment')) {
                handleWebViewClose();
              }
            }}
          />
        </Modal>
      )}
    </>
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

  // Amount Input
  inputLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 8,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
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

  // Quick amounts
  quickAmounts: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  quickAmountBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  quickAmountBtnActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  quickAmountText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  quickAmountTextActive: {
    color: '#2563EB',
  },

  // Method Cards
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 10,
  },
  methodCardActive: {
    borderColor: '#2563EB',
    backgroundColor: '#FAFCFF',
  },
  methodIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  methodIconBoxOrange: {
    backgroundColor: '#FFF7ED',
  },
  methodIconBoxBlue: {
    backgroundColor: '#EFF6FF',
  },
  methodContent: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  methodDescription: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '400',
  },

  // Radio Button
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive: {
    borderColor: '#2563EB',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2563EB',
  },

  // Extra fields
  extraFields: {
    marginBottom: 10,
    marginTop: -4,
  },
  inputGroup: {
    gap: 6,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    fontSize: 15,
    color: '#1E293B',
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
    opacity: 0.55,
  },
  zapIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  legalText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 16,
    marginTop: 12,
    paddingHorizontal: 8,
  },

  // Bottom Navigation
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingBottom: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  navItemCenter: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    marginTop: -20,
  },
  navCenterButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  navLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  navLabelActive: {
    color: '#2563EB',
    fontWeight: '700',
  },
});