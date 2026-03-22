import { NextRequest, NextResponse } from 'next/server'

const PLUGIN_INSTALL: Record<string, { filename: string; url: string }> = {
  'gigmole-skill': {
    filename: 'labor.md',
    url: 'https://gigmole.org/api/plugins/gigmole-skill/download',
  },
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const plugin = PLUGIN_INSTALL[id]
  if (!plugin) {
    return new NextResponse('echo "Error: Plugin not found"\nexit 1\n', {
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  const script = `#!/bin/sh
# GigMole Plugin Installer
set -e

SKILL_DIR="$HOME/.claude/skills"
mkdir -p "$SKILL_DIR"

echo "Installing GigMole skill..."
curl -sL "${plugin.url}" -o "$SKILL_DIR/${plugin.filename}"
echo "Installed to $SKILL_DIR/${plugin.filename}"
echo ""
echo "Run /labor in Claude Code to get started."
`

  return new NextResponse(script, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
