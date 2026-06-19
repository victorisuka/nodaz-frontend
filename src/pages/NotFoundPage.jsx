import { Link } from 'react-router-dom'

import { EmptyState } from '../components/ui/EmptyState.jsx'

export function NotFoundPage() {
  return (
    <EmptyState
      eyebrow="404"
      title="Cette page n existe pas"
      description="Le lien demande est introuvable. Revenez a l accueil pour continuer."
      action={<Link to="/" className="button-primary">Retour a l accueil</Link>}
    />
  )
}