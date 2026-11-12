// Types pour l'API Auto École Ange Raphael

export type CniStatut = 'non_soumis' | 'en_attente' | 'valide' | 'rejete';

export interface CniInfo {
  id: number;
  statut: CniStatut;
  motif_rejet?: string;
  cni_recto_url?: string;
  cni_verso_url?: string;
  soumis_at?: string;
  traite_at?: string;
  complet: boolean;
}

export interface CniResponse {
  success: boolean;
  cni: CniInfo | null;
  statut: CniStatut;
  cni_recto_url?: string;
  cni_verso_url?: string;
}

export interface CniUploadResponse {
  success: boolean;
  message: string;
  url?: string;
  complet: boolean;
  statut: CniStatut;
}

export interface User {
  id: number;
  nom: string;
  prenom: string;
  telephone: string;
  date_naissance?: string;
  quartier?: string;
  type_permis: 'permis_a' | 'permis_b' | 'permis_t';
  type_cours: 'en_ligne' | 'presentiel' | 'les_deux';
  vague: '1' | '2';
  session_id?: number;
  centre_examen_id?: number;
  code_parrainage: string;
  parrain_id?: number;
  niveau_parrainage: number;
  solde: number;
  validated: boolean;
  cours_debloques: boolean;
  status_frais_formation: FraisStatus;
  status_frais_inscription: FraisStatus;
  status_examen_blanc: FraisStatus;
  status_frais_examen: FraisStatus;
  premier_depot_at?: string;
  created_at: string;
  session?: Session;
  centreExamen?: CentreExamen;
  parrain?: ParrainInfo;
  lieuxPratique?: LieuPratique[];
  // Ajoutez dans l'interface User :
  auth_provider: 'telephone' | 'email' | 'google' | 'apple';
  email?: string;
  email_verified: boolean;
  telephone_verified: boolean;
  profil_complet: boolean;
  firebase_uid?: string;

}

export type FraisStatus = 'non_paye' | 'paye' | 'dispense';

export interface Session {
  id: number;
  nom: string;
  date_communication_enregistrement?: string;
  date_enregistrement_vague1?: string;
  date_enregistrement_vague2?: string;
  date_transfert_reconduction?: string;
  date_depot_departemental?: string;
  date_depot_regional?: string;
  date_examen_theorique?: string;
  date_examen_pratique?: string;
  active: boolean;
}

export interface CentreExamen {
  id: number;
  nom: string;
  adresse?: string;
  ville?: string;
  active: boolean;
}

export interface LieuPratique {
  id: number;
  nom: string;
  adresse?: string;
  ville?: string;
  active: boolean;
}

export interface JourPratique {
  id: number;
  lieu_pratique_id: number;
  jour: string;
  heure_debut: string;
  heure_fin: string;
  active: boolean;
  lieuPratique?: LieuPratique;
}

export interface ParrainInfo {
  id: number;
  nom: string;
  prenom: string;
}

export interface Filleul {
  id: number;
  nom: string;
  prenom: string;
  telephone?: string;
  niveau: number;
  niveau_label?: string;
  a_fait_depot: boolean;
  date_depot?: string;
  date_inscription: string;
  nombre_filleuls?: number;
}

export interface Dashboard {
  success: boolean;
  utilisateur: {
    id: number;
    nom: string;
    prenom: string;
    initiales: string;
    solde: number;
    type_permis: string;
    vague: string;
    niveau_parrainage: number;
    cours_debloques: boolean;
  };
  compte_a_rebours: {
    date_examen: string;
    passe: boolean;
    jours: number;
    heures: number;
    minutes: number;
    secondes: number;
    timestamp_cible: number;
  };
  session?: Session;
  frais: {
    formation: FraisInfo;
    inscription: FraisInfo;
    examen_blanc: FraisInfo;
    examen: FraisInfo;
  };
  pret_pour_examen: boolean;
  progression: {
    theorique: ProgressionType;
    pratique: ProgressionType;
  };
  parcours_formation: ParcourFormation[];
}

export interface FraisInfo {
  montant: number;
  status: FraisStatus;
  description?: string;
  label: string;
}

export interface ProgressionType {
  lecons: {
    total: number;
    completes: number;
    pourcentage: number;
  };
  quiz: {
    total: number;
    reussis: number;
    pourcentage: number;
  };
  global: {
    pourcentage: number;
    termine: boolean;
  };
}

export interface ParcourFormation {
  etape: number;
  titre: string;
  description: string;
  complete: boolean;
  date?: string;
  date_prevue?: string;
  sous_etapes?: SousEtape[];
}

export interface SousEtape {
  titre: string;
  complete: boolean;
  montant?: number;
  pourcentage?: number;
}

export interface Paiement {
  id: number;
  user_id: number;
  type: 'depot' | 'transfert_entrant' | 'transfert_sortant' | 'paiement_frais';
  methode: 'mobile_money' | 'code_caisse' | 'transfert' | 'systeme';
  montant: number;
  solde_avant: number;
  solde_apres: number;
  reference: string;
  description?: string;
  status: 'en_attente' | 'valide' | 'echoue' | 'annule';
  frais_type?: string;
  created_at: string;
}

export interface Module {
  id: number;
  nom: string;
  description?: string;
  type: 'theorique' | 'pratique';
  complete: boolean;
  accessible: boolean;
  chapitres: Chapitre[];
}


export interface Chapitre {
  id: number;
  nom: string;
  description?: string;
  complete: boolean;
  accessible: boolean;
  lecons: Lecon[];
  quiz?: QuizInfo;
}

export interface Lecon {
  id: number;
  titre: string;
  contenu_texte?: string;
  url_web?: string;
  url_video?: string;
  duree_minutes: number;
  completee: boolean;
  date_completion?: string;
  accessible: boolean;
}

export interface QuizInfo {
  id: number;
  titre: string;
  description?: string;
  note_passage: number;
  duree_minutes: number;
  disponible: boolean;
  reussi: boolean;
  meilleure_note?: number;
}

export interface Quiz {
  id: number;
  titre: string;
  description?: string;
  note_passage: number;
  duree_minutes: number;
  deja_reussi: boolean;
  meilleure_note?: number;
  questions: Question[];
}

export interface Question {
  id: number;
  enonce: string;
  image_url?: string;
  type: 'qcm' | 'vrai_faux';
  points: number;
  reponses: Reponse[];
}

export interface Reponse {
  id: number;
  texte: string;
}

export interface QuizResultat {
  note: number;
  note_passage: number;
  reussi: boolean;
  total_questions: number;
  bonnes_reponses: number;
  tentative: number;
}

export interface Correction {
  question_id: number;
  enonce: string;
  reponse_utilisateur: number;
  reponse_utilisateur_texte: string | null; // ✅ Ajout
  bonne_reponse: number;
  bonne_reponse_texte: string;
  est_correct: boolean;
  explication?: string;
  points: number;
}

export interface ParrainageInfo {
  success: boolean;
  niveau_actuel: number;
  code_parrainage: string;
  filleuls: Filleul[];
  nombre_filleuls: number;
  avantages_niveau_suivant?: {
    niveau_cible: number;
    condition: string;
    avantage: string;
  };
  explication_systeme: {
    intro: string;
    niveaux: NiveauExplication[];
    important: string[];
  };
}

export interface NiveauExplication {
  niveau: number;
  condition: string;
  avantage: string;
}

export interface ArbreParrainage {
  id: number;
  nom: string;
  prenom: string;
  niveau: number;
  enfants: ArbreParrainage[];
}

export interface Configuration {
  success: boolean;
  frais: {
    formation: number;
    inscription: number;
    examen_blanc: number;
    examen: number;
  };
  depot_minimum: number;
  whatsapp_support?: string;
  lien_telechargement?: string;
  sessions_disponibles: Session[];
  types_permis: TypePermis[];
  types_cours: TypeCours[];
}

export interface TypePermis {
  value: string;
  label: string;
  disponible: boolean;
}

export interface TypeCours {
  value: string;
  label: string;
}

// Types de navigation
export type RootStackParamList = {
  Loading: undefined;
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  OtpVerification: {
    mode: 'email_verification';
    email: string;
  } | {
    mode: 'telephone_registration';
    telephone: string;
    registrationData: {
      nom: string;
      prenom: string;
      telephone: string;
      password: string;
      password_confirmation: string;
      type_permis: string;
      centre_examen_id?: number;
      code_parrainage: string;
    };
  } | {
    mode: 'telephone_recovery';
    telephone: string;
  } | {
    mode?: undefined;
    telephone?: string;
    email?: undefined;
  };
  RegisterCompletion: undefined;
  ForgotPassword: undefined;
};

export type MainStackParamList = {
  Dashboard: undefined;
  Profile: undefined;
  EditProfile: undefined;
  Paiement: undefined;
  Transfert: undefined;
  Historique: undefined;
  PayerFrais: undefined;
  CoursTheorique: undefined;
  CoursPratique: undefined;
ModuleDetail: { moduleId: number; type: 'theorique' | 'pratique'; premierDepotEffectue?: boolean };  ChapitreDetail: { chapitreId: number; moduleId: number; type: 'theorique' | 'pratique' };
  LeconDetail: { leconId: number; chapitreId: number; moduleId: number; type: 'theorique' | 'pratique' };
  LeconWebView: { url: string; titre: string; leconId: number };
  LeconVideo: { url: string; titre: string; leconId: number; contenu?: string };
  Quiz: { chapitreId: number; quizId: number };
  QuizResultat: { resultat: QuizResultat; corrections: Correction[]; chapitreId: number };
   // ✅ Parrainage
  Parrainage: undefined;
  Filleuls: undefined;
  ArbreParrainage: undefined;
};

