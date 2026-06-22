import React from 'react'

function parseInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = []
  // Bold before italic so ** doesn't get split into two *
  const re = /(\*\*(.+?)\*\*|~~(.+?)~~|\*(.+?)\*|`([^`]+)`)/gs
  let last = 0
  let key = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index))
    if (m[0].startsWith('**'))      parts.push(<strong key={key++}>{m[2]}</strong>)
    else if (m[0].startsWith('~~')) parts.push(<s key={key++}>{m[3]}</s>)
    else if (m[0].startsWith('*'))  parts.push(<em key={key++}>{m[4]}</em>)
    else                            parts.push(<code key={key++} className="bg-gray-100 text-sm font-mono px-1 rounded">{m[5]}</code>)
    last = m.index + m[0].length
  }
  if (last < text.length) parts.push(text.slice(last))
  return <>{parts}</>
}

interface Segment {
  type: 'dice' | 'quote' | 'ul' | 'ol' | 'blank' | 'p'
  lines: string[]
}

function segmentBody(body: string): Segment[] {
  const raw = body.split('\n')
  const segs: Segment[] = []
  let i = 0
  while (i < raw.length) {
    const line = raw[i]
    if (line === ':::dice') {
      const content: string[] = []
      i++
      while (i < raw.length && raw[i] !== ':::') { content.push(raw[i]); i++ }
      segs.push({ type: 'dice', lines: content })
    } else if (line.startsWith('> ') || line === '>') {
      const content = [line.replace(/^> ?/, '')]
      i++
      while (i < raw.length && (raw[i].startsWith('> ') || raw[i] === '>')) {
        content.push(raw[i].replace(/^> ?/, '')); i++
      }
      segs.push({ type: 'quote', lines: content })
      continue
    } else if (line.startsWith('- ')) {
      const content = [line.slice(2)]
      i++
      while (i < raw.length && raw[i].startsWith('- ')) { content.push(raw[i].slice(2)); i++ }
      segs.push({ type: 'ul', lines: content })
      continue
    } else if (/^\d+\.\s/.test(line)) {
      const content = [line.replace(/^\d+\.\s/, '')]
      i++
      while (i < raw.length && /^\d+\.\s/.test(raw[i])) {
        content.push(raw[i].replace(/^\d+\.\s/, '')); i++
      }
      segs.push({ type: 'ol', lines: content })
      continue
    } else if (line.trim() === '') {
      segs.push({ type: 'blank', lines: [''] })
    } else {
      const content = [line]
      i++
      while (
        i < raw.length &&
        raw[i].trim() !== '' &&
        !raw[i].startsWith('> ') &&
        !raw[i].startsWith('- ') &&
        !/^\d+\.\s/.test(raw[i]) &&
        raw[i] !== ':::dice'
      ) { content.push(raw[i]); i++ }
      segs.push({ type: 'p', lines: content })
      continue
    }
    i++
  }
  return segs
}

export default function BodyRenderer({ body }: { body: string }) {
  const segs = segmentBody(body)
  return (
    <div className="prose-entry text-sm text-ink leading-relaxed space-y-2">
      {segs.map((seg, idx) => {
        if (seg.type === 'blank') return <div key={idx} className="h-2" />
        if (seg.type === 'dice') return (
          <div key={idx} className="my-3 rounded border border-border bg-gray-50 font-mono text-sm overflow-x-auto">
            <div className="px-3 py-1 text-xs text-muted border-b border-border select-none">🎲 Roll the dice…</div>
            <pre className="px-3 py-2 whitespace-pre-wrap">{seg.lines.join('\n')}</pre>
          </div>
        )
        if (seg.type === 'quote') return (
          <blockquote key={idx} className="border-l-4 border-border pl-3 text-muted italic">
            {seg.lines.map((l, i) => <p key={i}>{parseInline(l)}</p>)}
          </blockquote>
        )
        if (seg.type === 'ul') return (
          <ul key={idx} className="list-disc list-inside space-y-0.5">
            {seg.lines.map((l, i) => <li key={i}>{parseInline(l)}</li>)}
          </ul>
        )
        if (seg.type === 'ol') return (
          <ol key={idx} className="list-decimal list-inside space-y-0.5">
            {seg.lines.map((l, i) => <li key={i}>{parseInline(l)}</li>)}
          </ol>
        )
        // paragraph
        return (
          <p key={idx}>
            {seg.lines.map((l, i) => (
              <React.Fragment key={i}>{i > 0 && <br />}{parseInline(l)}</React.Fragment>
            ))}
          </p>
        )
      })}
    </div>
  )
}
