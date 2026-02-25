// screens/cni/CniInscriptionScreen.tsx

import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { theme } from '../../config/theme';
import { getCniStatus, uploadCni, deleteCniFace } from '../../services/cniService';
import { CniInfo, CniStatut } from '../../types';

type Face = 'recto' | 'verso';

interface FaceState {
  uri: string | null;
  uploading: boolean;
}

const STATUS_CONFIG: Record<CniStatut, { label: string; color: string; icon: string }> = {
  non_soumis: { label: 'Non soumis',  color: theme.colors.textSecondary, icon: '📋' },
  en_attente: { label: 'En attente',  color: '#F59E0B',                  icon: '⏳' },
  valide:     { label: 'Validé ✓',    color: '#10B981',                  icon: '✅' },
  rejete:     { label: 'Rejeté',      color: '#EF4444',                  icon: '❌' },
};

const CniInscriptionScreen: React.FC = () => {
  const { token } = useAuth();
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [cni, setCni]         = useState<CniInfo | null>(null);
  const [statut, setStatut]   = useState<CniStatut>('non_soumis');

  const [recto, setRecto] = useState<FaceState>({ uri: null, uploading: false });
  const [verso, setVerso] = useState<FaceState>({ uri: null, uploading: false });

  // ─── Chargement initial ──────────────────────────────────────────────────

  const fetchCni = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getCniStatus(token!);
      setCni(res.cni);
      setStatut(res.statut ?? res.cni?.statut ?? 'non_soumis');
      // On stocke juste le fait qu'une image existe (true/false via uri non-null)
      if (res.cni?.cni_recto_url) setRecto(p => ({ ...p, uri: res.cni!.cni_recto_url! }));
      if (res.cni?.cni_verso_url) setVerso(p => ({ ...p, uri: res.cni!.cni_verso_url! }));
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de récupérer le statut CNI.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchCni(); }, [fetchCni]);

  // ─── Sélection d'image ───────────────────────────────────────────────────

  const askSource = (face: Face) => {
    Alert.alert(
      face === 'recto' ? 'CNI Recto' : 'CNI Verso',
      "Choisissez la source de l'image",
      [
        { text: 'Galerie', onPress: () => pickFromGallery(face) },
        { text: 'Caméra',  onPress: () => pickFromCamera(face)  },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  const pickFromGallery = async (face: Face) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Accès à la galerie requis.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [3, 2],
    });
    if (!result.canceled && result.assets[0]) handleImagePicked(face, result.assets[0].uri);
  };

  const pickFromCamera = async (face: Face) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', 'Accès à la caméra requis.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.85,
      allowsEditing: true,
      aspect: [3, 2],
    });
    if (!result.canceled && result.assets[0]) handleImagePicked(face, result.assets[0].uri);
  };

  // ─── Upload ──────────────────────────────────────────────────────────────

  const handleImagePicked = async (face: Face, uri: string) => {
    const setter = face === 'recto' ? setRecto : setVerso;
    setter(p => ({ ...p, uri, uploading: true }));

    try {
      const res = await uploadCni(token!, face, uri);
      // On garde l'URI locale pour l'affichage (évite le bug d'URL distante)
      setter(p => ({ ...p, uri: uri, uploading: false }));
      setStatut(res.statut);
      if (res.complet) {
        Alert.alert('✅ Complet', 'Vos deux faces CNI ont été soumises. Nous allons traiter votre dossier.');
      }
    } catch (e: any) {
      setter(p => ({ ...p, uploading: false }));
      Alert.alert('Erreur upload', e?.message ?? 'Une erreur est survenue.');
    }
  };

  const handleDelete = (face: Face) => {
    Alert.alert(
      'Confirmer la suppression',
      `Supprimer la face ${face} ?`,
      [
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCniFace(token!, face);
              if (face === 'recto') setRecto({ uri: null, uploading: false });
              else                  setVerso({ uri: null, uploading: false });
              setStatut('en_attente');
            } catch (e: any) {
              Alert.alert('Erreur', e?.message ?? 'Suppression impossible.');
            }
          },
        },
        { text: 'Annuler', style: 'cancel' },
      ]
    );
  };

  // ─── Rendu ───────────────────────────────────────────────────────────────

  const isReadonly = statut === 'valide';
  const statusCfg  = STATUS_CONFIG[statut];

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.title}>📄 Inscription à l'examen</Text>
        <Text style={styles.subtitle}>
          Importez les deux faces de votre CNI pour que nous puissions procéder à votre inscription officielle.
        </Text>
      </View>

      {/* Statut */}
      <View style={[styles.statusBadge, { borderColor: statusCfg.color }]}>
        <Text style={[styles.statusText, { color: statusCfg.color }]}>
          {statusCfg.icon}  Statut : {statusCfg.label}
        </Text>
      </View>

      {/* Motif rejet */}
      {statut === 'rejete' && cni?.motif_rejet && (
        <View style={styles.rejectBox}>
          <Text style={styles.rejectTitle}>Motif du rejet :</Text>
          <Text style={styles.rejectText}>{cni.motif_rejet}</Text>
        </View>
      )}

      {/* Cards CNI */}
      <CniCard
        label="CNI Recto"
        description="Face avant avec photo et informations"
        face="recto"
        state={recto}
        readonly={isReadonly}
        onPress={() => askSource('recto')}
        onDelete={() => handleDelete('recto')}
      />

      <CniCard
        label="CNI Verso"
        description="Face arrière avec empreintes et signature"
        face="verso"
        state={verso}
        readonly={isReadonly}
        onPress={() => askSource('verso')}
        onDelete={() => handleDelete('verso')}
      />

      {/* Note informative */}
      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          💡 Assurez-vous que les images sont nettes, bien éclairées et lisibles. Les formats acceptés sont JPG, PNG et WEBP (max 10 Mo).
        </Text>
      </View>

    </ScrollView>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Composant CniCard
// ─────────────────────────────────────────────────────────────────────────────

interface CniCardProps {
  label: string;
  description: string;
  face: Face;
  state: FaceState;
  readonly: boolean;
  onPress: () => void;
  onDelete: () => void;
}

const CniCard: React.FC<CniCardProps> = ({
  label, description, face, state, readonly, onPress, onDelete,
}) => {
  const hasImage = !!state.uri;

  return (
    <View style={cardStyles.card}>

      {/* Titre de la card */}
      <View style={cardStyles.cardHeader}>
        <View>
          <Text style={cardStyles.cardLabel}>{label}</Text>
          <Text style={cardStyles.cardDescription}>{description}</Text>
        </View>
        {hasImage && !readonly && (
          <Pressable onPress={onDelete} style={cardStyles.deleteBtn}>
            <Text style={cardStyles.deleteBtnText}>🗑️</Text>
          </Pressable>
        )}
      </View>

      {/* Zone image */}
      <Pressable
        onPress={readonly ? undefined : onPress}
        style={[cardStyles.imageZone, hasImage && cardStyles.imageZoneFilled]}
        disabled={readonly || state.uploading}
      >
        {state.uploading ? (
          // ── Chargement en cours ──
          <View style={cardStyles.uploadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
            <Text style={cardStyles.uploadingText}>Envoi en cours…</Text>
          </View>

        ) : hasImage ? (
          // ── Image déjà chargée → icône succès ──
          <View style={cardStyles.successContainer}>
            <Text style={cardStyles.successIcon}>✅</Text>
            <Text style={cardStyles.successTitle}>Image chargée</Text>
            {!readonly && (
              <Text style={cardStyles.successSub}>Appuyez pour remplacer</Text>
            )}
          </View>

        ) : (
          // ── Aucune image ──
          <View style={cardStyles.placeholder}>
            <Text style={cardStyles.placeholderIcon}>
              {face === 'recto' ? '🪪' : '📋'}
            </Text>
            <Text style={cardStyles.placeholderText}>Appuyez pour ajouter</Text>
            <Text style={cardStyles.placeholderSub}>Galerie ou Caméra</Text>
          </View>
        )}
      </Pressable>

    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: theme.colors.background },
  content:    { padding: 16, paddingBottom: 40 },
  centered:   { flex: 1, justifyContent: 'center', alignItems: 'center' },

  header:   { marginBottom: 20 },
  title:    { fontSize: 22, fontWeight: '700', color: theme.colors.text, marginBottom: 6 },
  subtitle: { fontSize: 14, color: theme.colors.textSecondary, lineHeight: 20 },

  statusBadge: {
    borderWidth: 1.5,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  statusText: { fontSize: 15, fontWeight: '600' },

  rejectBox: {
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  rejectTitle: { fontWeight: '700', color: '#B91C1C', marginBottom: 4 },
  rejectText:  { color: '#7F1D1D', fontSize: 13 },

  infoBox: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  infoText: { fontSize: 13, color: '#1D4ED8', lineHeight: 18 },
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardLabel:       { fontSize: 16, fontWeight: '700', color: theme.colors.text },
  cardDescription: { fontSize: 12, color: theme.colors.textSecondary, marginTop: 2 },

  deleteBtn:     { padding: 6 },
  deleteBtnText: { fontSize: 20 },

  imageZone: {
    height: 180,
    borderRadius: 10,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: theme.colors.primary,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFF',
  },
  imageZoneFilled: {
    borderStyle: 'solid',
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },

  // ── Succès ──
  successContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  successIcon:  { fontSize: 56, marginBottom: 10 },
  successTitle: { fontSize: 16, fontWeight: '700', color: '#10B981', marginBottom: 4 },
  successSub:   { fontSize: 12, color: '#6B7280', textAlign: 'center' },

  // ── Placeholder ──
  placeholder:     { alignItems: 'center' },
  placeholderIcon: { fontSize: 48, marginBottom: 8 },
  placeholderText: { fontSize: 15, fontWeight: '600', color: theme.colors.primary },
  placeholderSub:  { fontSize: 12, color: theme.colors.textSecondary, marginTop: 4 },

  // ── Upload en cours ──
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingText: { color: '#fff', marginTop: 10, fontWeight: '600' },
});

export default CniInscriptionScreen;