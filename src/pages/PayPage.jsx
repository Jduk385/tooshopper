import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

const getApiUrl = () => {
  const apiUrl = import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_URL;
  const defaultUrl = import.meta.env.DEV ? 'http://localhost:5000' : '';
  return (apiUrl || defaultUrl).replace(/\/+$/, '');
};

const API = getApiUrl();

function uniquePesosFromId(id) {
  if (!id) return 0;
  const hex = id.toString().slice(-2);
  return parseInt(hex, 16) % 100;
}

export default function PayPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [method, setMethod] = useState('nequi');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [sending, setSending] = useState(false);

  const CELULAR_PAGO = "301 700 1227";

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API}/api/orders/${orderId}/summary`);
        const data = await res.json();
        if (!res.ok) throw new Error('Error');
        setOrder(data);
      } catch (e) { setOrder(null); } finally { setLoading(false); }
    }
    load();
  }, [orderId]);

  async function confirmarPago() {
    try {
      setSending(true);
      const res = await fetch(`${API}/api/payments/manual/mark-awaiting`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, method, receiptUrl: receiptUrl || null }),
      });
      if (!res.ok) throw new Error('Error');
      alert(method === 'contraentrega' ? '🚚 Pedido registrado.' : '✅ Pago en revisión.');
      navigate(`/pago/estado/${orderId}`);
    } catch (e) { alert('⚠️ Error: ' + e.message); } finally { setSending(false); }
  }

  if (loading) return <div style={{padding:40, color:'#fff', textAlign:'center'}}>Cargando...</div>;
  if (!order) return <div style={{padding:40, color:'#fff', textAlign:'center'}}>Orden no encontrada.</div>;

  const extraPesos = uniquePesosFromId(orderId);
  const totalFinal = (order.total ?? 0) + extraPesos;
  const totalFormateado = Math.floor(totalFinal).toLocaleString('es-CO');

  return (
    <div style={{ maxWidth: 500, margin: '20px auto', padding: '0 16px', color: '#fff', fontFamily: 'sans-serif' }}>
      
      <header style={{textAlign:'center', marginBottom: 20}}>
        <h1 style={{fontSize: '1.6rem', margin: 0}}>Finalizar Pago</h1>
        <p style={{opacity: 0.5, fontSize: '0.8rem'}}>Orden: #{orderId.slice(-6).toUpperCase()}</p>
      </header>

      {/* TARJETA DE TOTAL */}
      <div style={{ background: '#0f172a', padding: '20px', borderRadius: 20, textAlign: 'center', marginBottom: 20, border: '1px solid #334155' }}>
        <p style={{margin:0, fontSize:'0.85rem', opacity: 0.7}}>Total a transferir:</p>
        <h2 style={{fontSize: '2.2rem', margin: '8px 0'}}>${totalFormateado}</h2>
      </div>

      {/* SELECTOR DE MÉTODO (BOTONES SIMPLES Y SEGUROS) */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['nequi', 'daviplata', 'contraentrega'].map((m) => {
          const isActive = method === m;
          let bgColor = '#1e293b';
          let borderColor = '#334155';
          
          if (isActive) {
            borderColor = m === 'nequi' ? '#7000FF' : m === 'daviplata' ? '#ED1C24' : '#fff';
            bgColor = borderColor;
          }

          return (
            <button
              key={m}
              onClick={() => setMethod(m)}
              style={{
                flex: 1, padding: '12px 5px', borderRadius: 12, cursor: 'pointer',
                border: `2px solid ${borderColor}`, 
                background: isActive ? bgColor : 'transparent',
                color: (isActive && m === 'contraentrega') ? '#000' : '#fff',
                fontWeight: 'bold', fontSize: '0.7rem', transition: '0.2s'
              }}
            >
              <div style={{fontSize: '1.2rem', marginBottom: 4}}>
                {m === 'nequi' && '📱'}
                {m === 'daviplata' && '💳'}
                {m === 'contraentrega' && '🚚'}
              </div>
              {m.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* INSTRUCCIONES */}
      <div style={{ background: '#1e293b', padding: 25, borderRadius: 20, border: '1px solid #334155' }}>
        {method !== 'contraentrega' ? (
          <>
            <h3 style={{marginTop:0, fontSize: '1.1rem', color: method === 'nequi' ? '#a855f7' : '#f87171'}}>
              Pagar con {method.toUpperCase()}
            </h3>
            <div style={{display:'grid', gap: 15, fontSize: '0.95rem'}}>
               <div>
                  <span style={{color: '#94a3b8', fontSize: '0.8rem', display:'block'}}>Celular de la cuenta:</span>
                  <b style={{fontSize: '1.3rem'}}>{CELULAR_PAGO}</b>
               </div>
               <div>
                  <span style={{color: '#94a3b8', fontSize: '0.8rem', display:'block'}}>Valor exacto:</span>
                  <b>${totalFormateado}</b>
               </div>
               <div>
                  <span style={{color: '#94a3b8', fontSize: '0.8rem', display:'block'}}>Pega el link del comprobante:</span>
                  <input
                    value={receiptUrl}
                    onChange={e => setReceiptUrl(e.target.value)}
                    placeholder="Enlace oficial aquí"
                    style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #334155', background: '#0f172a', color: '#fff', boxSizing: 'border-box', marginTop: 8 }}
                  />
               </div>
            </div>
          </>
        ) : (
          <div style={{textAlign: 'center', padding: '10px 0'}}>
            <div style={{fontSize: '2.5rem'}}>🚚</div>
            <h3>Contraentrega</h3>
            <p style={{opacity: 0.7, fontSize: '0.9rem'}}>Pagas en efectivo al recibir.</p>
          </div>
        )}

        <button
          onClick={confirmarPago}
          disabled={sending}
          style={{ 
            width: '100%', marginTop: 25, padding: 16, borderRadius: 12, border: 'none', 
            background: '#22c55e', color: '#fff', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer'
          }}
        >
          {sending ? 'Procesando...' : 'Confirmar Registro'}
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: 30 }}>
        <Link to="/" style={{color: '#94a3b8', textDecoration:'none', fontSize: '0.85rem'}}>← Volver a Too Shopper</Link>
      </div>
    </div>
  );
}