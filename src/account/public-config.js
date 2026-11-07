// Public Firebase Web app identifiers, supplied by the project owner.
// These values are shipped to browsers; access to courses is enforced by firestore.rules.
export const publicFirebaseConfig = {
  apiKey: 'AIzaSyAnTp2zA1Xt3XsRvuVYDlzJHslMiN0LMMo',
  authDomain: 'declic-revision.firebaseapp.com',
  projectId: 'declic-revision',
  appId: '1:990279193178:web:d9e2730ece8d64d32bbe63',
};
export function selectFirebaseConfig(environment={}) {
  const hasOverrides=Object.values(environment).some(value=>typeof value==='string'&&value.trim());
  return hasOverrides?environment:{...publicFirebaseConfig};
}
