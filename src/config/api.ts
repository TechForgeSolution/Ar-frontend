// ============================================
// Configuration API - Auto École Ange Raphael
// ============================================
export const API_BASE_URL = 'https://ange-raphael.tfs237.com/api';

//export const API_BASE_URL = 'http://192.168.1.166:8000/api';

// Headers par défaut pour les requêtes
export const getHeaders = (token?: string | null) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Fonction helper pour les requêtes API
export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    ...options,
    headers: {
      ...getHeaders(token),
      ...options.headers,
    },
  };
  
  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw {
        status: response.status,
        message: data.message || 'Une erreur est survenue',
        errors: data.errors || null,
        data,
      };
    }
    
    return data;
  } catch (error: any) {
    if (error.status) {
      throw error;
    }
    throw {
      status: 0,
      message: 'Erreur de connexion au serveur',
      errors: null,
      data: null,
    };
  }
};
