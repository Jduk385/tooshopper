const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

const RESERVATION_MINUTES = 90;
const isValidObjectId = (id) => mongoose.isValidObjectId(id || '');

// ---------- Crear ORDEN (con Lógica de Combos) ----------
router.post('/', async (req, res) => {
  const { items, shipping, customer, paymentMethod } = req.body || {};

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Items requeridos' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + RESERVATION_MINUTES * 60 * 1000);

    const normalizedItems = [];
    const reservations = [];
    let subtotal = 0;

    for (let i = 0; i < items.length; i++) {
      const it = items[i] || {};
      const qty = Math.max(1, Number(it.qty || 1));

      let prod = null;
      if (isValidObjectId(it.productId)) {
        prod = await Product.findById(it.productId).session(session);
      }
      if (!prod && it.sku) {
        const query = { sku: it.sku };
        if (typeof it.variant === 'string' && it.variant.trim()) {
          query.variant = it.variant.trim();
        }
        prod = await Product.findOne(query).session(session);
      }

      if (!prod) throw new Error(`Producto no encontrado (item #${i + 1})`);
      if (prod.isActive === false) throw new Error(`Producto inactivo: ${prod.name}`);

      prod.reserve(qty);
      await prod.save({ session });

      await StockMovement.create([{
        productId: prod._id,
        type: 'reserve',
        qty: -qty,
        notes: 'Reserva por nueva orden',
      }], { session });

      reservations.push({ productId: prod._id, qty, expiresAt });
      
      normalizedItems.push({
        productId: prod._id,
        sku: prod.sku || null,
        variant: it.variant || it.size || null,
        qty,
        unitPrice: prod.price || 0,
      });

      subtotal += (prod.price || 0) * qty;
    }

    let finalTotal = subtotal;
    const totalQty = items.reduce((acc, curr) => acc + Number(curr.qty || 1), 0);

    if (totalQty === 2) {
      finalTotal = Math.round(subtotal * 0.88);
    } else if (totalQty >= 3) {
      finalTotal = Math.round(subtotal * 0.82);
    }

    const pm = String(paymentMethod || '').toLowerCase();
    const initialStatus = pm === 'contraentrega' ? 'pending_delivery' : 'pending_payment';

    const [order] = await Order.create([{
      status: initialStatus,
      items: normalizedItems,
      reservations,
      total: finalTotal,
      shipping: shipping || {},
      customer: customer || {},
      payment: { method: pm || null },
    }], { session });

    await session.commitTransaction();
    return res.status(201).json({ id: order._id, total: finalTotal });
  } catch (err) {
    await session.abortTransaction();
    return res.status(400).json({ message: err.message || 'Error' });
  } finally {
    session.endSession();
  }
});

// ---------- Listado admin ----------
router.get('/list', requireAuth, requireAdmin, async (req, res) => {
  try {
    const {
      status, method, q, from, to,
      page = '1', limit = '20',
      sortBy = 'createdAt', order = 'desc'
    } = req.query;

    const filters = {};
    if (status) filters.status = { $in: String(status).split(',').map(s => s.trim()).filter(Boolean) };
    if (method) filters['payment.method'] = { $in: String(method).split(',').map(s => s.trim()).filter(Boolean) };
    if (from || to) {
      filters.createdAt = {};
      if (from) filters.createdAt.$gte = new Date(from);
      if (to) filters.createdAt.$lte = new Date(to);
    }
    if (q && String(q).trim()) {
      const text = String(q).trim();
      const or = [
        { 'shipping.nombre': new RegExp(text, 'i') },
        { 'customer.nombre': new RegExp(text, 'i') },
        { 'customer.telefono': new RegExp(text, 'i') },
        { 'payment.txnId': new RegExp(text, 'i') },
      ];
      if (isValidObjectId(text)) or.push({ _id: new mongoose.Types.ObjectId(text) });
      filters.$or = or;
    }

    const pg = Math.max(1, parseInt(page, 10) || 1);
    const lim = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const sortDir = String(order).toLowerCase() === 'asc' ? 1 : -1;

    const projection = [
      '_id','status','total','createdAt',
      'payment.method','payment.receiptUrl','payment.txnId',
      'shipping.nombre','shipping.ciudad',
      'customer.nombre','customer.telefono'
    ].join(' ');

    const [itemsList, totalCount] = await Promise.all([
      Order.find(filters, projection).sort({ [sortBy]: sortDir }).skip((pg - 1) * lim).limit(lim),
      Order.countDocuments(filters),
    ]);

    res.json({ items: itemsList, page: pg, limit: lim, total: totalCount, hasMore: pg * lim < totalCount });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Error interno' });
  }
});

// ---------- Mark paid (CORREGIDO) ----------
router.patch('/:id/mark-paid', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { txnId, receiptUrl, method } = req.body || {};
  if (!isValidObjectId(id)) return res.status(400).json({ message: 'orderId inválido' });

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const order = await Order.findById(id).session(session);
    if (!order) return res.status(404).json({ message: 'Orden no encontrada' });
    
    // CORRECCIÓN: Permitir pagar si está en pendiente o en verificación
    const allowed = ['pending_payment', 'awaiting_verification'];
    if (!allowed.includes(order.status)) {
      return res.status(400).json({ message: `No se puede pagar desde "${order.status}"` });
    }

    for (const it of order.items || []) {
      const prod = await Product.findById(it.productId).session(session);
      if (!prod) throw new Error(`Producto no encontrado: ${it.productId}`);
      prod.confirm(it.qty);
      await prod.save({ session });

      await StockMovement.create([{
        productId: prod._id, type: 'commit', qty: 0,
        notes: `Orden ${order._id} confirmada (pago)`,
      }], { session });
    }

    order.status = 'paid';
    order.payment = {
      ...(order.payment || {}),
      method: method || order?.payment?.method || 'manual',
      txnId: txnId || order?.payment?.txnId || null,
      receiptUrl: receiptUrl || order?.payment?.receiptUrl || null,
      paidAt: new Date(),
    };
    order.reservations = [];
    await order.save({ session });

    await session.commitTransaction();
    res.json({ id: order._id, status: order.status, total: order.total });
  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ message: err.message || 'No se pudo marcar como pagada' });
  } finally {
    session.endSession();
  }
});

// ---------- Mark delivered (COD) ----------
router.patch('/:id/mark-delivered', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { txnId, receiptUrl } = req.body || {};
  if (!isValidObjectId(id)) return res.status(400).json({ message: 'orderId inválido' });

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const order = await Order.findById(id).session(session);
    if (!order) return res.status(404).json({ message: 'Orden no encontrada' });

    const pm = String(order?.payment?.method || '').toLowerCase();
    const isCOD = pm === 'contraentrega';
    const canDeliver = order.status === 'pending_delivery' || (order.status === 'pending_payment' && isCOD);
    if (!canDeliver) return res.status(400).json({ message: `No se puede marcar como entregada desde "${order.status}"` });

    for (const it of order.items || []) {
      const prod = await Product.findById(it.productId).session(session);
      if (!prod) throw new Error(`Producto no encontrado: ${it.productId}`);
      prod.confirm(it.qty);
      await prod.save({ session });

      await StockMovement.create([{
        productId: prod._id, type: 'commit', qty: 0,
        notes: `Orden ${order._id} entregada (COD)`,
      }], { session });
    }

    order.status = 'paid';
    order.payment = {
      ...(order.payment || {}),
      method: 'contraentrega',
      txnId: txnId || order?.payment?.txnId || null,
      receiptUrl: receiptUrl || order?.payment?.receiptUrl || null,
      paidAt: new Date(),
    };
    order.reservations = [];
    await order.save({ session });

    await session.commitTransaction();
    res.json({ id: order._id, status: order.status });
  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ message: err.message || 'No se pudo marcar como entregada' });
  } finally {
    session.endSession();
  }
});

// ---------- Not delivered ----------
router.patch('/:id/not-delivered', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body || {};
  if (!isValidObjectId(id)) return res.status(400).json({ message: 'orderId inválido' });

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const order = await Order.findById(id).session(session);
    if (!order) return res.status(404).json({ message: 'Orden no encontrada' });
    if (order.status !== 'pending_delivery') {
      return res.status(400).json({ message: `Solo aplica desde 'pending_delivery'` });
    }

    for (const it of order.items || []) {
      const prod = await Product.findById(it.productId).session(session);
      if (!prod) throw new Error(`Producto no encontrado: ${it.productId}`);
      prod.release(it.qty);
      await prod.save({ session });

      await StockMovement.create([{
        productId: prod._id, type: 'unreserve', qty: it.qty,
        notes: `No entregada - devolución (orden ${order._id})`,
      }], { session });
    }

    order.status = 'cancelled';
    order.reservations = [];
    order.cancelledAt = new Date();
    await order.save({ session });

    await session.commitTransaction();
    res.json({ id: order._id, status: order.status });
  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ message: err.message || 'Error' });
  } finally {
    session.endSession();
  }
});

// ---------- Cancel (CORREGIDO) ----------
router.patch('/:id/cancel', requireAuth, requireAdmin, async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) return res.status(400).json({ message: 'orderId inválido' });

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const order = await Order.findById(id).session(session);
    if (!order) return res.status(404).json({ message: 'Orden no encontrada' });

    // CORRECCIÓN: Permitir cancelar desde cualquiera de estos 3 estados
    const allowed = ['pending_payment', 'pending_delivery', 'awaiting_verification'];
    if (!allowed.includes(order.status)) {
      return res.status(400).json({ message: `No se puede cancelar desde "${order.status}"` });
    }

    for (const it of order.items || []) {
      const prod = await Product.findById(it.productId).session(session);
      if (!prod) throw new Error(`Producto no encontrado: ${it.productId}`);
      prod.release(it.qty);
      await prod.save({ session });

      await StockMovement.create([{
        productId: prod._id, type: 'unreserve', qty: it.qty,
        notes: `Cancelación manual de orden ${order._id}`,
      }], { session });
    }

    order.status = 'cancelled';
    order.reservations = [];
    order.cancelledAt = new Date();
    await order.save({ session });

    await session.commitTransaction();
    res.json({ id: order._id, status: order.status });
  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ message: err.message || 'No se pudo cancelar' });
  } finally {
    session.endSession();
  }
});

// ---------- Summary público ----------
router.get('/:id/summary', async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) return res.status(400).json({ message: 'orderId inválido' });
  try {
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Orden no encontrada' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Error interno' });
  }
});

// ---------- Get completo ----------
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) return res.status(400).json({ message: 'orderId inválido' });
  try {
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ message: 'Orden no encontrada' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: 'Error interno' });
  }
});

module.exports = router;