import { Requirement } from './database'

export async function exportToExcel(requirements: Requirement[], filePath: string): Promise<void> {
  const ExcelJS = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Requirements')

  sheet.columns = [
    { header: 'ID', key: 'req_id', width: 12 },
    { header: 'Название', key: 'title', width: 40 },
    { header: 'Описание', key: 'description', width: 60 },
    { header: 'Тип', key: 'type', width: 12 },
    { header: 'Приоритет', key: 'priority', width: 12 },
    { header: 'Статус', key: 'status', width: 14 },
    { header: 'Автор', key: 'author', width: 20 },
    { header: 'Создано', key: 'created_at', width: 20 },
  ]

  const headerRow = sheet.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E2A5E' } }

  const typeOrder = ['epic', 'feature', 'story']
  const sorted = [...requirements].sort((a, b) => typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type))

  sorted.forEach(req => {
    const row = sheet.addRow({
      req_id: req.req_id,
      title: req.title,
      description: req.description,
      type: typeLabel(req.type),
      priority: priorityLabel(req.priority),
      status: statusLabel(req.status),
      author: req.author,
      created_at: req.created_at.slice(0, 10),
    })

    const bgColor = req.type === 'epic' ? 'FFE8EAF6' : req.type === 'feature' ? 'FFF3F4F6' : 'FFFFFFFF'
    row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
    row.alignment = { wrapText: true, vertical: 'top' }
  })

  sheet.autoFilter = { from: 'A1', to: 'H1' }
  await workbook.xlsx.writeFile(filePath)
}

export async function exportToWord(requirements: Requirement[], filePath: string): Promise<void> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType } = await import('docx')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const children: any[] = [
    new Paragraph({
      text: 'Реестр требований',
      heading: HeadingLevel.TITLE,
      spacing: { after: 400 },
    }),
  ]

  const epics = requirements.filter(r => r.type === 'epic')
  const features = requirements.filter(r => r.type === 'feature')
  const stories = requirements.filter(r => r.type === 'story')

  function addSection(items: Requirement[], heading: string, level: typeof HeadingLevel[keyof typeof HeadingLevel]) {
    if (items.length === 0) return
    children.push(new Paragraph({ text: heading, heading: level, spacing: { before: 300, after: 200 } }))

    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          tableHeader: true,
          children: ['ID', 'Название', 'Приоритет', 'Статус', 'Автор'].map(h =>
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: h, bold: true })] })],
              shading: { fill: '1E2A5E', color: '1E2A5E' },
            })
          ),
        }),
        ...items.map(req =>
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(req.req_id)] }),
              new TableCell({ children: [new Paragraph(req.title), ...(req.description ? [new Paragraph({ children: [new TextRun({ text: req.description, italics: true, size: 18 })] })] : [])] }),
              new TableCell({ children: [new Paragraph(priorityLabel(req.priority))] }),
              new TableCell({ children: [new Paragraph(statusLabel(req.status))] }),
              new TableCell({ children: [new Paragraph(req.author)] }),
            ],
          })
        ),
      ],
    }))
  }

  addSection(epics, 'Эпики', HeadingLevel.HEADING_1)
  addSection(features, 'Фичи', HeadingLevel.HEADING_2)
  addSection(stories, 'Истории', HeadingLevel.HEADING_3)

  const doc = new Document({
    sections: [{ children }],
    styles: {
      paragraphStyles: [
        {
          id: 'Normal',
          name: 'Normal',
          run: { font: 'Arial', size: 22 },
        },
      ],
    },
  })

  const buffer = await Packer.toBuffer(doc)
  const fs = await import('fs/promises')
  await fs.writeFile(filePath, buffer)
}

export function exportToPdf(requirements: Requirement[], filePath: string): void {
  const { jsPDF } = require('jspdf')
  require('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'landscape' })
  doc.setFont('helvetica')
  doc.setFontSize(16)
  doc.text('Requirements Registry', 14, 16)
  doc.setFontSize(10)
  doc.text(`Generated: ${new Date().toLocaleDateString('ru-RU')}`, 14, 22)

  const typeOrder = ['epic', 'feature', 'story']
  const sorted = [...requirements].sort((a, b) => typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type))

  ;(doc as any).autoTable({
    startY: 28,
    head: [['ID', 'Название', 'Описание', 'Тип', 'Приоритет', 'Статус', 'Автор']],
    body: sorted.map(r => [
      r.req_id,
      r.title,
      r.description?.slice(0, 80) || '',
      typeLabel(r.type),
      priorityLabel(r.priority),
      statusLabel(r.status),
      r.author,
    ]),
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [30, 42, 94], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: {
      0: { cellWidth: 18 },
      1: { cellWidth: 50 },
      2: { cellWidth: 70 },
      3: { cellWidth: 18 },
      4: { cellWidth: 22 },
      5: { cellWidth: 22 },
      6: { cellWidth: 30 },
    },
  })

  doc.save(filePath)
}

function typeLabel(t: string) {
  return t === 'epic' ? 'Эпик' : t === 'feature' ? 'Фича' : 'История'
}
function priorityLabel(p: string) {
  return p === 'high' ? 'Высокий' : p === 'medium' ? 'Средний' : 'Низкий'
}
function statusLabel(s: string) {
  return s === 'draft' ? 'Черновик' : s === 'approved' ? 'Утверждено' : s === 'rejected' ? 'Отклонено' : 'На проверке'
}
