'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const LINKS = [
  { href: '/', label: 'Team Dashboard' },
  { href: '/compare', label: 'Compare' },
]

export default function NavBar({ error }: { error?: string | null }) {
  const pathname = usePathname()

  return (
    <div style={{borderBottom:'1px solid var(--an-border)',background:'var(--an-surface)',padding:'0 24px',display:'flex',alignItems:'center',height:52,gap:24}}>
      <span style={{color:'var(--an-green)',fontWeight:700,fontSize:15,letterSpacing:'0.02em'}}>CFB Analytics</span>
      <span style={{color:'var(--an-border)',fontSize:18}}>|</span>
      <div style={{display:'flex',alignItems:'center',gap:4}}>
        {LINKS.map(link => {
          const active = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              style={{
                padding:'5px 12px',
                borderRadius:6,
                fontSize:12,
                fontWeight: active ? 600 : 400,
                textDecoration:'none',
                color: active ? 'var(--an-green)' : 'var(--an-muted)',
                background: active ? 'rgba(0,163,71,0.08)' : 'transparent',
              }}
            >
              {link.label}
            </Link>
          )
        })}
      </div>
      <span style={{color:'var(--an-muted)',fontSize:12}}>Action Network Internal</span>
      {error && <span style={{color:'#dc2626',fontSize:12,marginLeft:'auto'}}>⚠ {error}</span>}
    </div>
  )
}
