import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export async function GET() {
  try {
    const filePath = path.join(
      process.cwd(),
      'documentation',
      'bikeshed_app_design_specification.md'
    )
    const content = await fs.readFile(filePath, 'utf-8')
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to read design document' },
      { status: 500 }
    )
  }
}
