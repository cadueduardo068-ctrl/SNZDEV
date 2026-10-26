export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_CHUNK_BYTES = 256 * 1024;
export const IMAGE_ID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
export const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export class ImageInputError extends Error {
  status: number;
  constructor(message: string, status: number) { super(message); this.status=status; }
}

export function validateImage(bytes: Uint8Array, type: string) {
  if (!IMAGE_TYPES.has(type)) throw new ImageInputError('Use JPEG, PNG ou WebP.', 400);
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) throw new ImageInputError('Limite de 5 MB por imagem.', 413);
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  const valid = type === 'image/jpeg'
    ? bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
    : type === 'image/png'
      ? bytes.length >= 24 && [137,80,78,71,13,10,26,10].every((v,i) => bytes[i] === v) && ascii(12,16) === 'IHDR'
      : bytes.length >= 16 && ascii(0,4) === 'RIFF' && ascii(8,12) === 'WEBP' && ['VP8 ', 'VP8L', 'VP8X'].includes(ascii(12,16));
  if (!valid) throw new ImageInputError('O arquivo não corresponde ao formato informado.', 400);
}

// Stop reading oversized requests even when Content-Length is missing or forged.
export async function readImageBody(request: Request): Promise<Uint8Array> {
  const declared = Number(request.headers.get('content-length'));
  if (declared > MAX_IMAGE_BYTES) throw new ImageInputError('Limite de 5 MB por imagem.', 413);
  if (!request.body) throw new ImageInputError('Envie uma imagem.', 400);
  const reader = request.body.getReader();
  const parts: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_IMAGE_BYTES) {
        await reader.cancel();
        throw new ImageInputError('Limite de 5 MB por imagem.', 413);
      }
      parts.push(value);
    }
  } finally { reader.releaseLock(); }
  const result = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) { result.set(part, offset); offset += part.length; }
  return result;
}

export async function saveImage(db: D1Database, id: string, bytes: Uint8Array, contentType: string) {
  if (!IMAGE_ID.test(id)) throw new ImageInputError('Identificador inválido.', 400);
  validateImage(bytes, contentType);
  const chunks = Math.ceil(bytes.length / IMAGE_CHUNK_BYTES);
  const statements = [db.prepare('INSERT INTO media_files (id, content_type, byte_size, chunk_count, created_at) VALUES (?, ?, ?, ?, ?)')
    .bind(id, contentType, bytes.length, chunks, Date.now())];
  for (let index = 0; index < chunks; index++) {
    const data = bytes.slice(index * IMAGE_CHUNK_BYTES, (index + 1) * IMAGE_CHUNK_BYTES);
    statements.push(db.prepare('INSERT INTO media_chunks (file_id, chunk_index, data) VALUES (?, ?, ?)').bind(id, index, data.buffer));
  }
  // D1 batch is transactional: an incomplete image never becomes visible.
  await db.batch(statements);
}

export type StoredImage = { id: string; content_type: string; byte_size: number; chunk_count: number };
export async function findImage(db: D1Database, id: string) {
  return db.prepare('SELECT id, content_type, byte_size, chunk_count FROM media_files WHERE id = ?').bind(id).first<StoredImage>();
}

export function imageStream(db: D1Database, file: StoredImage) {
  let index = 0;
  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        if (index >= file.chunk_count) { controller.close(); return; }
        const row = await db.prepare('SELECT data FROM media_chunks WHERE file_id = ? AND chunk_index = ?').bind(file.id, index).first<{data: number[]}>();
        if (!row) throw new Error('Bloco de imagem ausente.');
        const chunk = new Uint8Array(row.data);
        const expected = Math.min(IMAGE_CHUNK_BYTES, file.byte_size - index * IMAGE_CHUNK_BYTES);
        if (chunk.length !== expected) throw new Error('Tamanho de imagem inconsistente.');
        index++;
        controller.enqueue(chunk);
      } catch (error) { controller.error(error); }
    },
  });
}
