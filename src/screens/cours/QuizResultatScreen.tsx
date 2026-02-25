import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../config/theme';
import { QuizResultat, Correction } from '../../types';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

export default function QuizResultatScreen({ route, navigation }: any) {
  const { resultat, corrections, chapitreId } = route.params as {
    resultat: QuizResultat;
    corrections: Correction[];
    chapitreId: number;
  };

  const getScoreColor = () => {
    if (resultat.reussi) return theme.colors.success;
    if (resultat.note >= resultat.note_passage * 0.7) return theme.colors.warning;
    return theme.colors.error;
  };

  const getScoreIcon = () => {
    if (resultat.reussi) return 'trophy';
    if (resultat.note >= resultat.note_passage * 0.7) return 'warning';
    return 'close-circle';
  };

  const handleRetourChapitre = () => {
    navigation.navigate('CoursTheorique');
  };

  const handleRepasserQuiz = () => {
    navigation.goBack();
  };

  const handleRetourAccueil = () => {
  navigation.navigate('Dashboard');
};

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          {/* Carte de résultat principal */}
          <View style={[styles.resultCard, { borderColor: getScoreColor() }]}>
            <View style={[styles.iconContainer, { backgroundColor: getScoreColor() + '20' }]}>
              <Ionicons name={getScoreIcon()} size={64} color={getScoreColor()} />
            </View>
            <Text style={styles.resultTitle}>
              {resultat.reussi ? 'Félicitations !' : 'Non réussi'}
            </Text>
            <Text style={styles.resultSubtitle}>
              {resultat.reussi
                ? 'Vous avez réussi le quiz avec succès'
                : 'Continuez à apprendre, vous y arriverez !'}
            </Text>
            <View style={styles.scoreContainer}>
              <Text style={[styles.scoreValue, { color: getScoreColor() }]}>
                {resultat.note.toFixed(1)}
              </Text>
              <Text style={styles.scoreLabel}>/20</Text>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{resultat.bonnes_reponses}</Text>
                <Text style={styles.statLabel}>Bonnes réponses</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{resultat.total_questions}</Text>
                <Text style={styles.statLabel}>Questions</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{resultat.tentative}</Text>
                <Text style={styles.statLabel}>Tentative</Text>
              </View>
            </View>
            <View style={styles.passMarkContainer}>
              <Text style={styles.passMarkText}>
                Note de passage : {resultat.note_passage}/20
              </Text>
            </View>
          </View>

          {/* Corrections détaillées */}
          <View style={styles.correctionsContainer}>
            <Text style={styles.sectionsTitle}>Corrections détaillées</Text>
            {corrections.map((correction, index) => (
              <View
                key={correction.question_id}
                style={[
                  styles.correctionCard,
                  correction.est_correct
                    ? styles.correctionCardCorrect
                    : styles.correctionCardWrong,
                ]}
              >
                <View style={styles.correctionHeader}>
                  <View style={styles.correctionNumber}>
                    <Text style={styles.correctionNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.correctionStatus}>
                    <Ionicons
                      name={correction.est_correct ? 'checkmark-circle' : 'close-circle'}
                      size={24}
                      color={correction.est_correct ? theme.colors.success : theme.colors.error}
                    />
                    <Text
                      style={[
                        styles.correctionStatusText,
                        {
                          color: correction.est_correct
                            ? theme.colors.success
                            : theme.colors.error,
                        },
                      ]}
                    >
                      {correction.est_correct ? 'Correct' : 'Incorrect'}
                    </Text>
                    <View style={styles.pointsBadge}>
                      <Text style={styles.pointsText}>
                        {correction.est_correct ? correction.points : 0}/{correction.points} pts
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.correctionQuestion}>{correction.enonce}</Text>

                {/* ✅ Affichage de la réponse de l'utilisateur avec le texte */}
                {!correction.est_correct && (
                  <View style={styles.answerContainer}>
                    <View style={styles.answerRow}>
                      <Ionicons name="close" size={16} color={theme.colors.error} />
                      <Text style={styles.answerLabel}>Votre réponse :</Text>
                    </View>
                    <Text style={styles.wrongAnswer}>
                      {correction.reponse_utilisateur_texte ?? 'Aucune réponse donnée'}
                    </Text>
                  </View>
                )}

                <View style={styles.answerContainer}>
                  <View style={styles.answerRow}>
                    <Ionicons name="checkmark" size={16} color={theme.colors.success} />
                    <Text style={styles.answerLabel}>Bonne réponse :</Text>
                  </View>
                  <Text style={styles.correctAnswer}>
                    {correction.bonne_reponse_texte}
                  </Text>
                </View>

                {correction.explication && (
                  <View style={styles.explanationContainer}>
                    <View style={styles.explanationHeader}>
                      <Ionicons
                        name="information-circle"
                        size={16}
                        color={theme.colors.info}
                      />
                      <Text style={styles.explanationLabel}>Explication</Text>
                    </View>
                    <Text style={styles.explanationText}>
                      {correction.explication}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
  {!resultat.reussi && (
    <TouchableOpacity
      style={styles.secondaryButton}
      onPress={handleRepasserQuiz}
    >
      <Ionicons name="refresh" size={20} color={theme.colors.primary} />
      <Text style={styles.secondaryButtonText}>Repasser le quiz</Text>
    </TouchableOpacity>
  )}
  <TouchableOpacity
    style={[
      styles.primaryButton,
      !resultat.reussi && { flex: 1, marginLeft: theme.spacing.sm },
    ]}
    onPress={handleRetourChapitre}
  >
    <Text style={styles.primaryButtonText}>
      {resultat.reussi ? 'Continuer' : 'Retour au chapitre'}
    </Text>
    <Ionicons name="arrow-forward" size={20} color={theme.colors.textInverse} />
  </TouchableOpacity>

  {/* ✅ Bouton Retour à l'accueil affiché uniquement si quiz réussi */}
  {resultat.reussi && (
    <TouchableOpacity
      style={[styles.secondaryButton, { marginLeft: theme.spacing.sm }]}
      onPress={handleRetourAccueil}
    >
      <Ionicons name="home" size={20} color={theme.colors.primary} />
      <Text style={styles.secondaryButtonText}>Accueil</Text>
    </TouchableOpacity>
  )}
</View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  resultCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    borderWidth: 3,
    ...theme.shadows.lg,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  resultTitle: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  resultSubtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: theme.spacing.lg,
  },
  scoreValue: {
    fontSize: 56,
    fontWeight: '700',
  },
  scoreLabel: {
    ...theme.typography.h3,
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.border,
  },
  passMarkContainer: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  passMarkText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  correctionsContainer: {
    marginBottom: theme.spacing.lg,
  },
  sectionsTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  correctionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderLeftWidth: 4,
    ...theme.shadows.sm,
  },
  correctionCardCorrect: {
    borderLeftColor: theme.colors.success,
  },
  correctionCardWrong: {
    borderLeftColor: theme.colors.error,
  },
  correctionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  correctionNumber: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  correctionNumberText: {
    ...theme.typography.body,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  correctionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  correctionStatusText: {
    ...theme.typography.body,
    fontWeight: '600',
    marginLeft: theme.spacing.xs,
    marginRight: theme.spacing.sm,
  },
  pointsBadge: {
    backgroundColor: theme.colors.borderLight,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  pointsText: {
    ...theme.typography.caption,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  correctionQuestion: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    lineHeight: 24,
  },
  answerContainer: {
    marginBottom: theme.spacing.sm,
  },
  answerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  answerLabel: {
    ...theme.typography.bodySmall,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginLeft: theme.spacing.xs,
  },
  wrongAnswer: {
    ...theme.typography.body,
    color: theme.colors.error,
    paddingLeft: theme.spacing.lg,
  },
  correctAnswer: {
    ...theme.typography.body,
    color: theme.colors.success,
    fontWeight: '600',
    paddingLeft: theme.spacing.lg,
  },
  explanationContainer: {
    backgroundColor: theme.colors.infoLight + '10',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  explanationLabel: {
    ...theme.typography.bodySmall,
    fontWeight: '600',
    color: theme.colors.info,
    marginLeft: theme.spacing.xs,
  },
  explanationText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    ...theme.shadows.lg,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    flex: 1,
  },
  secondaryButtonText: {
    ...theme.typography.button,
    color: theme.colors.primary,
    marginLeft: theme.spacing.xs,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
  primaryButtonText: {
    ...theme.typography.button,
    color: theme.colors.textInverse,
    marginRight: theme.spacing.xs,
  },
});