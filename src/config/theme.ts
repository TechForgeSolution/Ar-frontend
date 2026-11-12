// Thème Auto École Ange Raphael
// Couleurs inspirées du monde automobile - Bleu professionnel et Orange dynamique

export const theme = {
  colors: {
    // Couleurs principales
    primary: '#2563EB', // Bleu foncé professionnel
    primaryLight: '#2563EB', // Bleu clair
    primaryDark: '#1E40AF', // Bleu très foncé
    
    // Couleurs secondaires
    secondary: '#F97316', // Orange dynamique
    secondaryLight: '#FB923C', // Orange clair
    secondaryDark: '#EA580C', // Orange foncé
    
    // Couleurs de statut
    success: '#10B981', // Vert
    successLight: '#34D399',
    warning: '#F59E0B', // Jaune/Orange
    warningLight: '#FBBF24',
    error: '#EF4444', // Rouge
    errorLight: '#F87171',
    info: '#3B82F6', // Bleu
    infoLight: '#60A5FA',
    
    // Couleurs neutres
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceVariant: '#F1F5F9',
    
    // Texte
    textPrimary: '#1E293B',
    textSecondary: '#64748B',
    textMuted: '#94A3B8',
    textInverse: '#FFFFFF',
    
    // Bordures
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    
    // Niveaux de parrainage
    niveau: {
      '-1': '#94A3B8', // Gris - Nouveau
      '0': '#10B981', // Vert - Niveau 0
      '1': '#3B82F6', // Bleu - Niveau 1
      '2': '#8B5CF6', // Violet - Niveau 2
      '3': '#F59E0B', // Or - Niveau 3
    },
    
    // Status frais
    frais: {
      paye: '#10B981',
      non_paye: '#EF4444',
      dispense: '#8B5CF6',
    },
  },
  
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  
  typography: {
    h1: {
      fontSize: 28,
      fontWeight: '700' as const,
      lineHeight: 36,
    },
    h2: {
      fontSize: 24,
      fontWeight: '700' as const,
      lineHeight: 32,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 28,
    },
    h4: {
      fontSize: 18,
      fontWeight: '600' as const,
      lineHeight: 24,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    bodySmall: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
    },
    button: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 24,
    },
  },
  
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 5,
    },
  },
};

export type Theme = typeof theme;
