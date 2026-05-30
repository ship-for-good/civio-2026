import { getDailyDigestCategories, CLAIM_WINDOW_DAYS } from '../utils/urgency.js'
import { daysFromToday, TODAY, formatDate } from '../utils/dates.js'

export default function DigestSection({ requests, onHighlight, showToast }) {
  const { silencio, reclamadas, contencioso } = getDailyDigestCategories(requests)

  function copyDigest() {
    const dateStr = TODAY.toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })

    let text = `DIGEST DIARIO — ${dateStr.toUpperCase()}\n`
    text += '='.repeat(50) + '\n\n'

    text += `1. RECLAMAR POR SILENCIO ADMINISTRATIVO (${silencio.length})\n`
    text += '-'.repeat(40) + '\n'
    if (silencio.length === 0) {
      text += '   Sin solicitudes pendientes.\n'
    } else {
      silencio.forEach(r => {
        const days = daysFromToday(r['Vencimiento'])
        const claimDays = CLAIM_WINDOW_DAYS + days
        text += `   • [${r['Id']}] ${r['Asunto']} (${r['Autor']})\n`
        text += `     Venc: ${formatDate(r['Vencimiento'])} | ${claimDays}d para reclamar\n`
      })
    }

    text += `\n2. RECLAMADAS ANTE EL CTBG (${reclamadas.length})\n`
    text += '-'.repeat(40) + '\n'
    if (reclamadas.length === 0) {
      text += '   Sin solicitudes en seguimiento.\n'
    } else {
      reclamadas.forEach(r => {
        text += `   • [${r['Id']}] ${r['Asunto']} (${r['Autor']})\n`
        text += `     Reclamación: ${r['Reclamación'] || 'Sin nº'}\n`
      })
    }

    text += `\n3. CONTENCIOSO-ADMINISTRATIVO (${contencioso.length})\n`
    text += '-'.repeat(40) + '\n'
    if (contencioso.length === 0) {
      text += '   Sin expedientes judiciales activos.\n'
    } else {
      contencioso.forEach(r => {
        text += `   • [${r['Id']}] ${r['Asunto']} (${r['Autor']})\n`
      })
    }

    navigator.clipboard.writeText(text)
      .then(() => showToast('Digest copiado al portapapeles ✓'))
      .catch(() => showToast('No se pudo copiar (usa HTTPS o localhost)'))
  }

  return (
    <div className="digest-section">
      <div className="section-header">
        <h2>📬 Digest Diario — Acciones Pendientes</h2>
        <button className="copy-digest-btn" onClick={copyDigest}>Copiar digest</button>
      </div>
      <div className="digest-grid">
        <DigestCard
          cssClass="urgent"
          emoji="🔴"
          title="Reclamar por silencio administrativo"
          subtitle="Plazo de respuesta vencido — reclamar ante el CTBG"
          items={silencio}
          metaFn={r => {
            const days = daysFromToday(r['Vencimiento'])
            return `${CLAIM_WINDOW_DAYS + days}d para reclamar`
          }}
          badgeClass="critical"
          onHighlight={onHighlight}
        />
        <DigestCard
          cssClass="warning"
          emoji="🟠"
          title="Reclamadas ante el CTBG"
          subtitle="En proceso de reclamación — seguir el procedimiento"
          items={reclamadas}
          metaFn={r => r['Reclamación'] || 'Sin nº reclamación'}
          badgeClass="warning"
          onHighlight={onHighlight}
        />
        <DigestCard
          cssClass="resolved"
          emoji="🔵"
          title="Contencioso-administrativo"
          subtitle="En procedimiento judicial"
          items={contencioso}
          metaFn={r => r['Reclamación'] || 'Sin nº reclamación'}
          badgeClass="ok"
          onHighlight={onHighlight}
        />
      </div>
    </div>
  )
}

function DigestCard({ cssClass, emoji, title, subtitle, items, metaFn, badgeClass, onHighlight }) {
  return (
    <div className={`digest-card ${cssClass}`}>
      <div className="card-header">
        <span>{emoji}</span>
        <div>
          <div className="card-title">{title}</div>
          <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{subtitle}</div>
        </div>
        <div className="count">{items.length}</div>
      </div>
      <div className="digest-list">
        {items.length === 0 ? (
          <div className="empty-card">Sin solicitudes en esta categoría</div>
        ) : (
          items.map(r => (
            <div key={r['Id']} className="digest-item" onClick={() => onHighlight(r['Id'])}>
              <div className="item-id">{r['Id']}</div>
              <div className="item-asunto">{r['Asunto'] || '—'}</div>
              <div className="item-meta">
                <span>{r['Autor'] || '—'}</span>
                <span>{r['Ámbito'] || '—'}</span>
                <span className={`days-badge ${badgeClass}`}>{metaFn(r)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
