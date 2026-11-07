export function accountError(error) {
  const messages={
    'auth/popup-closed-by-user':'La fenêtre Google a été fermée avant la fin de la connexion. Réessaie depuis Chrome ou Safari.',
    'auth/cancelled-popup-request':'Une fenêtre de connexion est déjà ouverte. Termine cette connexion avant de réessayer.',
    'auth/popup-blocked':'Le navigateur bloque la fenêtre Google. Ouvre Déclic directement dans Chrome ou Safari et autorise les fenêtres de connexion.',
    'auth/unauthorized-domain':'Cette adresse du site doit être ajoutée aux domaines autorisés dans Firebase Authentication : nicoquinart-cmd.github.io.',
    'auth/configuration-not-found':'La connexion Google n’est pas encore activée dans Firebase. Dans Authentication, clique sur Commencer puis active Google.',
    'auth/operation-not-allowed':'Le fournisseur Google doit être activé dans Firebase Authentication → Méthode de connexion.',
    'auth/operation-not-supported-in-this-environment':'Ce navigateur intégré ne permet pas cette connexion. Ouvre Déclic directement dans Chrome ou Safari.',
    'auth/web-storage-unsupported':'Ce navigateur bloque le stockage nécessaire à la connexion. Autorise les données du site ou essaie un autre navigateur.',
    'auth/network-request-failed':'La connexion à Google a échoué. Vérifie ton accès Internet puis réessaie.',
    'permission-denied':'L’accès à ce cours est refusé. Reconnecte-toi ; si le problème persiste, les règles de sauvegarde doivent être vérifiées.',
    'unavailable':'La sauvegarde en ligne est indisponible. Réessaie lorsque la connexion est rétablie.',
  };
  return messages[error?.code]||error?.message||'Cette opération n’a pas abouti. Réessaie.';
}
