import { supabase } from './supabase.js'
import { slugifyFilename } from '../utils/expediente.js'

const BUCKET = 'expediente-adjuntos'

export async function uploadAttachments(files: File[], expedienteId: string): Promise<string[]> {
  const paths: string[] = []
  for (const file of files) {
    const safeName = slugifyFilename(file.name)
    const path = `${expedienteId}/${safeName}`
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true })
    if (error) throw error
    paths.push(path)
  }
  return paths
}

export interface ExpedienteRecord {
  id: string
  asunto: string
  estado: string
  fecha: string
  vencimiento: string | null
  autor: string
  attachments: string[]
}

export async function insertExpediente(record: ExpedienteRecord): Promise<ExpedienteRecord> {
  const { data, error } = await supabase
    .from('expedientes')
    .insert(record)
    .select()
    .single()
  if (error) throw error
  return data as ExpedienteRecord
}
