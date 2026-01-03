import { jsPDF } from 'jspdf'

interface PurchaseData {
  item_name: string
  merchant: string | null
  purchase_date: string
  warranty_months: number
  warranty_expires_at: string | null
}

interface ReceiptData {
  imageDataUrl: string | null
  file_type: string
  file_name: string
  isPdf: boolean
}

export async function generateClaimPacket(
  purchase: PurchaseData,
  receipt: ReceiptData | null
): Promise<Uint8Array> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  const contentWidth = pageWidth - margin * 2
  let yPos = margin

  // Helper functions
  const addText = (text: string, size: number, style: 'normal' | 'bold' = 'normal', color = '#171717') => {
    doc.setFontSize(size)
    doc.setFont('helvetica', style)
    doc.setTextColor(color)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  // ========== HEADER ==========
  // Logo/Brand
  doc.setFillColor(37, 99, 235) // Primary blue
  doc.rect(margin, yPos, 10, 10, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('C', margin + 3.5, yPos + 7)

  doc.setTextColor(23, 23, 23)
  doc.setFontSize(20)
  doc.text('Cyncro', margin + 14, yPos + 7)

  // Title
  yPos += 20
  addText('WARRANTY CLAIM PACKET', 16, 'bold')
  doc.text('WARRANTY CLAIM PACKET', margin, yPos)

  // Generated date
  yPos += 8
  addText(`Generated: ${new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, 10, 'normal', '#737373')
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })}`, margin, yPos)

  // Divider
  yPos += 8
  doc.setDrawColor(229, 229, 229)
  doc.setLineWidth(0.5)
  doc.line(margin, yPos, pageWidth - margin, yPos)

  // ========== PURCHASE DETAILS ==========
  yPos += 15
  addText('PURCHASE DETAILS', 12, 'bold')
  doc.text('PURCHASE DETAILS', margin, yPos)

  yPos += 10

  // Item Name
  addText('Item', 9, 'normal', '#737373')
  doc.text('Item', margin, yPos)
  yPos += 5
  addText(purchase.item_name, 12, 'bold')
  doc.text(purchase.item_name, margin, yPos)
  yPos += 10

  // Merchant
  if (purchase.merchant) {
    addText('Merchant', 9, 'normal', '#737373')
    doc.text('Merchant', margin, yPos)
    yPos += 5
    addText(purchase.merchant, 11, 'normal')
    doc.text(purchase.merchant, margin, yPos)
    yPos += 10
  }

  // Purchase Date
  addText('Purchase Date', 9, 'normal', '#737373')
  doc.text('Purchase Date', margin, yPos)
  yPos += 5
  addText(formatDate(purchase.purchase_date), 11, 'normal')
  doc.text(formatDate(purchase.purchase_date), margin, yPos)
  yPos += 10

  // Warranty Info
  addText('Warranty Period', 9, 'normal', '#737373')
  doc.text('Warranty Period', margin, yPos)
  yPos += 5
  if (purchase.warranty_months > 0) {
    addText(`${purchase.warranty_months} months`, 11, 'normal')
    doc.text(`${purchase.warranty_months} months`, margin, yPos)
    yPos += 7

    if (purchase.warranty_expires_at) {
      const expiryDate = new Date(purchase.warranty_expires_at)
      const now = new Date()
      const isExpired = expiryDate < now

      addText('Warranty Expiry', 9, 'normal', '#737373')
      doc.text('Warranty Expiry', margin, yPos)
      yPos += 5

      const expiryText = formatDate(purchase.warranty_expires_at)
      const statusText = isExpired ? ' (EXPIRED)' : ' (ACTIVE)'
      const statusColor = isExpired ? '#dc2626' : '#16a34a'

      addText(expiryText, 11, 'normal')
      doc.text(expiryText, margin, yPos)
      
      addText(statusText, 11, 'bold', statusColor)
      doc.text(statusText, margin + doc.getTextWidth(expiryText), yPos)
    }
  } else {
    addText('No warranty specified', 11, 'normal', '#737373')
    doc.text('No warranty specified', margin, yPos)
  }

  yPos += 15

  // Divider
  doc.setDrawColor(229, 229, 229)
  doc.line(margin, yPos, pageWidth - margin, yPos)

  // ========== RECEIPT ==========
  yPos += 10
  addText('RECEIPT', 12, 'bold')
  doc.text('RECEIPT', margin, yPos)
  yPos += 8

  if (!receipt) {
    addText('No receipt attached to this purchase.', 10, 'normal', '#737373')
    doc.text('No receipt attached to this purchase.', margin, yPos)
  } else if (receipt.isPdf) {
    // PDF receipt - can't embed, provide notice
    addText('Receipt Type: PDF Document', 10, 'normal', '#737373')
    doc.text('Receipt Type: PDF Document', margin, yPos)
    yPos += 6
    addText(`File: ${receipt.file_name}`, 10, 'normal')
    doc.text(`File: ${receipt.file_name}`, margin, yPos)
    yPos += 8

    // Info box
    doc.setFillColor(254, 243, 199) // Yellow-100
    doc.roundedRect(margin, yPos, contentWidth, 20, 2, 2, 'F')
    yPos += 6
    addText('ℹ️  PDF receipts cannot be embedded in claim packets.', 9, 'normal', '#92400e')
    doc.text('PDF receipts cannot be embedded in claim packets.', margin + 5, yPos)
    yPos += 5
    addText('Please download the receipt separately from the purchase details page.', 9, 'normal', '#92400e')
    doc.text('Please download the receipt separately from the purchase details page.', margin + 5, yPos)
  } else if (receipt.imageDataUrl) {
    // Image receipt - embed it
    addText(`File: ${receipt.file_name}`, 9, 'normal', '#737373')
    doc.text(`File: ${receipt.file_name}`, margin, yPos)
    yPos += 8

    try {
      // Calculate image dimensions to fit page
      const maxWidth = contentWidth
      const maxHeight = 180 // Leave room for footer

      // Add image
      doc.addImage(
        receipt.imageDataUrl,
        receipt.file_type.includes('png') ? 'PNG' : 'JPEG',
        margin,
        yPos,
        maxWidth,
        maxHeight,
        undefined,
        'MEDIUM'
      )
      yPos += maxHeight + 5
    } catch (error) {
      console.error('Failed to embed image:', error)
      addText('Failed to embed receipt image.', 10, 'normal', '#dc2626')
      doc.text('Failed to embed receipt image.', margin, yPos)
    }
  }

  // ========== FOOTER ==========
  const footerY = doc.internal.pageSize.getHeight() - 15
  doc.setDrawColor(229, 229, 229)
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5)

  addText('Generated by Cyncro - Warranty & Receipt Management', 8, 'normal', '#737373')
  doc.text('Generated by Cyncro - Warranty & Receipt Management', margin, footerY)

  addText(`Packet ID: ${Date.now().toString(36).toUpperCase()}`, 8, 'normal', '#737373')
  const packetIdText = `Packet ID: ${Date.now().toString(36).toUpperCase()}`
  doc.text(packetIdText, pageWidth - margin - doc.getTextWidth(packetIdText), footerY)

  return doc.output('arraybuffer') as unknown as Uint8Array
}

