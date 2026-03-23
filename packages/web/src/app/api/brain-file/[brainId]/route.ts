import { NextRequest, NextResponse } from 'next/server'
import { getBrain, getDemoBrainPath, readBrainFile, writeBrainFile } from '@/lib/local-data'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ brainId: string }> }
) {
  const { brainId } = await params
  const filePath = request.nextUrl.searchParams.get('path')

  if (!filePath) {
    return new NextResponse('Missing path parameter', { status: 400 })
  }

  let brainPath: string
  if (brainId === 'demo') {
    brainPath = getDemoBrainPath()
  } else {
    const brain = getBrain(brainId)
    if (!brain) {
      return new NextResponse('Brain not found', { status: 404 })
    }
    brainPath = brain.path
  }

  try {
    const content = readBrainFile(brainPath, filePath)
    return new NextResponse(content, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to read file'
    return new NextResponse(message, { status: 404 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ brainId: string }> }
) {
  const { brainId } = await params

  // Demo brain is read-only
  if (brainId === 'demo') {
    return new NextResponse('Demo brain is read-only', { status: 403 })
  }

  const brain = getBrain(brainId)
  if (!brain) {
    return new NextResponse('Brain not found', { status: 404 })
  }

  let body: { path?: string; content?: string }
  try {
    body = await request.json()
  } catch {
    return new NextResponse('Invalid JSON body', { status: 400 })
  }

  if (!body.path || typeof body.content !== 'string') {
    return new NextResponse('Missing path or content', { status: 400 })
  }

  try {
    writeBrainFile(brain.path, body.path, body.content)
    return new NextResponse('OK', { status: 200 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to write file'
    return new NextResponse(message, { status: 500 })
  }
}
