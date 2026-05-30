// Thin Supabase I/O — no business logic, fail fast (throws on error).
import { supabase } from './supabase.js'
import { slugifyFilename } from '../utils/expediente.js'

const BUCKET = 'expediente-adjuntos'

export async function uploadAttachments(files, expedienteId) {
  const paths = []
  for (const file of files) {
    const safeName = slugifyFilename(file.name)
    const path = `${expedienteId}/${safeName}`
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: true })
    if (error) throw error
    paths.push(path)
  }
  return paths
}

export async function insertExpediente(record) {
  const { data, error } = await supabase
    .from('expedientes')
    .insert(record)
    .select()
    .single()
  if (error) throw error
  return data
}
