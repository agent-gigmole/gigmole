import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

const PLUGIN_FILES: Record<string, string> = {
  'gigmole-skill': 'skill/labor.md',
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const filePath = PLUGIN_FILES[id]
  if (!filePath) {
    return NextResponse.json({ error: 'Plugin not found' }, { status: 404 })
  }

  const fullPath = path.join(process.cwd(), filePath)
  const content = await readFile(fullPath, 'utf-8')

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': `attachment; filename="${path.basename(filePath)}"`,
    },
  })
}
