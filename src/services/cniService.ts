// services/cniService.ts
// À créer dans utils/ ou services/

import { API_BASE_URL } from '../config/api';
import { CniResponse, CniUploadResponse } from '../types';

/**
 * Récupère le statut CNI de l'utilisateur connecté.
 */
export const getCniStatus = async (token: string): Promise<CniResponse> => {
  const response = await fetch(`${API_BASE_URL}/cni`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok) throw data;
  return data;
};

/**
 * Upload d'une image CNI (recto ou verso).
 * @param token   - Token d'authentification
 * @param face    - 'recto' | 'verso'
 * @param uri     - URI locale de l'image (depuis la galerie ou la caméra)
 * @param mimeType - Type MIME (par défaut image/jpeg)
 */
export const uploadCni = async (
  token: string,
  face: 'recto' | 'verso',
  uri: string,
  mimeType: string = 'image/jpeg'
): Promise<CniUploadResponse> => {
  const formData = new FormData();
  formData.append('face', face);

  const filename = uri.split('/').pop() ?? `cni_${face}.jpg`;
  // @ts-ignore – React Native FormData accepte les objets { uri, name, type }
  formData.append('image', { uri, name: filename, type: mimeType });

  const response = await fetch(`${API_BASE_URL}/cni/upload`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
      // Ne pas mettre Content-Type ici : React Native le définit automatiquement
      // avec la boundary pour le multipart/form-data
    },
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) throw data;
  return data;
};

/**
 * Supprime la face CNI (recto ou verso).
 */
export const deleteCniFace = async (
  token: string,
  face: 'recto' | 'verso'
): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(`${API_BASE_URL}/cni/${face}`, {
    method: 'DELETE',
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });
  const data = await response.json();
  if (!response.ok) throw data;
  return data;
};