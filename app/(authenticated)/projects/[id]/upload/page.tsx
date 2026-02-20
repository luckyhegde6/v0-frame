import { UploadComponent } from '@/components/upload/upload-component'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ albumId?: string }>
}

export default async function ProjectUploadPage({ params, searchParams }: PageProps) {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([params, searchParams])
  const projectId = resolvedParams.id
  const albumId = resolvedSearchParams.albumId
  
  return (
    <UploadComponent 
      mode={albumId ? 'album' : 'project'}
      initialProjectId={projectId}
      initialAlbumId={albumId}
      userRole="PRO"
      backLinkHref={albumId ? `/projects/${projectId}/albums/${albumId}` : `/projects/${projectId}`}
      backLinkText="Back to Project"
      title="Upload to Project"
    />
  )
}
