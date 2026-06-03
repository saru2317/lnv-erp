const router  = require('express').Router()
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

// ── GET /price-book — list all price books ────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { priceListName, itemCode, isActive, search } = req.query
    const where = {}
    if (priceListName) where.priceListName = priceListName
    if (itemCode)      where.itemCode      = itemCode
    if (isActive !== undefined) where.isActive = isActive === 'true'
    if (search) where.OR = [
      { itemName: { contains: search, mode:'insensitive' } },
      { itemCode: { contains: search, mode:'insensitive' } },
    ]

    const data = await prisma.priceBook.findMany({
      where, orderBy: [{ priceListName:'asc' }, { itemName:'asc' }]
    })
    res.json({ data, total: data.length })
  } catch(e) { res.status(500).json({ error: e.message }) }
})

// ── GET /price-book/lists — distinct price list names ─────────────────────
router.get('/lists', async (req, res) => {
  try {
    const lists = await prisma.priceBook.findMany({
      distinct: ['priceListName'],
      select: { priceListName:true, priceListType:true, currency:true, validFrom:true, validTo:true },
      where: { isActive: true }
    })
    // Count items per list
    const withCount = await Promise.all(lists.map(async l => {
      const count = await prisma.priceBook.count({ where: { priceListName: l.priceListName } })
      return { ...l, itemCount: count }
    }))
    res.json({ data: withCount })
  } catch(e) { res.status(500).json({ error: e.message }) }
})

// ── GET /price-book/lookup — get item price for a customer ────────────────
// Priority: customer-specific list → general list → item std cost
router.get('/lookup', async (req, res) => {
  try {
    const { itemCode, customerId, priceListName } = req.query
    if (!itemCode) return res.status(400).json({ error: 'itemCode required' })

    let rate = null
    let source = 'item_master'
    let priceListUsed = null

    // 1. Check customer's assigned price list
    if (customerId || priceListName) {
      let listName = priceListName
      if (customerId && !listName) {
        const cust = await prisma.customer.findUnique({
          where: { id: parseInt(customerId) },
          select: { priceList: true }
        })
        listName = cust?.priceList
      }

      if (listName && listName !== 'Standard') {
        const pb = await prisma.priceBook.findFirst({
          where: { itemCode, priceListName: listName, isActive: true },
          orderBy: { updatedAt: 'desc' }
        })
        if (pb) {
          rate = pb.basePrice
          source = 'customer_price_list'
          priceListUsed = listName
        }
      }
    }

    // 2. Fallback: Standard Price List
    if (!rate) {
      const std = await prisma.priceBook.findFirst({
        where: { itemCode, priceListName: 'Standard Price List', isActive: true }
      })
      if (std) {
        rate = std.basePrice
        source = 'standard_price_list'
        priceListUsed = 'Standard Price List'
      }
    }

    // 3. Fallback: Item master stdCost / salePrice
    if (!rate) {
      const item = await prisma.item.findFirst({
        where: { OR: [{ code: itemCode }, { itemCode }] },
        select: { stdCost: true, salePrice: true, mrp: true }
      })
      rate = parseFloat(item?.salePrice || item?.stdCost || item?.mrp || 0)
      source = 'item_master'
    }

    res.json({ rate: parseFloat(rate || 0), source, priceListUsed })
  } catch(e) { res.status(500).json({ error: e.message }) }
})

// ── POST /price-book — create price book entry ────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { priceListName, priceListType, currency, validFrom, validTo,
            itemCode, itemName, basePrice, minQty, priceUomType, notes } = req.body
    if (!priceListName || !itemName || !basePrice)
      return res.status(400).json({ error: 'priceListName, itemName and basePrice required' })

    const data = await prisma.priceBook.create({
      data: {
        priceListName, priceListType: priceListType || 'standard',
        currency: currency || 'INR',
        validFrom: validFrom ? new Date(validFrom) : null,
        validTo:   validTo   ? new Date(validTo)   : null,
        itemCode: itemCode || null,
        itemName,
        basePrice: parseFloat(basePrice),
        minQty:    parseFloat(minQty || 1),
        priceUomType: priceUomType || 'per_piece',
        notes: notes || null,
        isActive: true,
      }
    })
    res.status(201).json({ data, message: `Price added to ${priceListName}` })
  } catch(e) { res.status(500).json({ error: e.message }) }
})

// ── PATCH /price-book/:id — update price ──────────────────────────────────
router.patch('/:id', async (req, res) => {
  try {
    const { basePrice, minQty, validFrom, validTo, isActive, notes } = req.body
    const data = await prisma.priceBook.update({
      where: { id: parseInt(req.params.id) },
      data: {
        ...(basePrice  !== undefined && { basePrice:  parseFloat(basePrice)  }),
        ...(minQty     !== undefined && { minQty:     parseFloat(minQty)     }),
        ...(isActive   !== undefined && { isActive                           }),
        ...(notes      !== undefined && { notes                              }),
        ...(validFrom  && { validFrom: new Date(validFrom) }),
        ...(validTo    && { validTo:   new Date(validTo)   }),
      }
    })
    res.json({ data, message: 'Price updated' })
  } catch(e) { res.status(500).json({ error: e.message }) }
})

// ── DELETE /price-book/:id ────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    await prisma.priceBook.delete({ where: { id: parseInt(req.params.id) } })
    res.json({ message: 'Deleted' })
  } catch(e) { res.status(500).json({ error: e.message }) }
})

// ── POST /price-book/bulk — bulk import from Excel ────────────────────────
router.post('/bulk', async (req, res) => {
  try {
    const { priceListName, priceListType, currency, validFrom, validTo, items } = req.body
    if (!items?.length) return res.status(400).json({ error: 'No items provided' })

    // Delete existing entries for this price list (replace)
    await prisma.priceBook.deleteMany({ where: { priceListName } })

    const created = await prisma.priceBook.createMany({
      data: items.map(it => ({
        priceListName, priceListType: priceListType || 'standard',
        currency: currency || 'INR',
        validFrom: validFrom ? new Date(validFrom) : null,
        validTo:   validTo   ? new Date(validTo)   : null,
        itemCode: it.itemCode || null,
        itemName: it.itemName || it.name,
        basePrice: parseFloat(it.basePrice || it.price || 0),
        minQty:    parseFloat(it.minQty || 1),
        isActive:  true,
      }))
    })
    res.json({ count: created.count, message: `${created.count} prices imported` })
  } catch(e) { res.status(500).json({ error: e.message }) }
})

module.exports = router
