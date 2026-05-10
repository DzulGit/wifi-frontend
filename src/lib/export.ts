import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

export function exportToExcel(data: any[], filename: string, sheetName = 'Data') {
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  
  // Auto column width
  const cols = Object.keys(data[0] || {}).map(key => ({
    wch: Math.max(key.length, ...data.map(row => String(row[key] ?? '').length))
  }))
  worksheet['!cols'] = cols

  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' })
  saveAs(blob, `${filename}_${new Date().toLocaleDateString('id-ID').replace(/\//g, '-')}.xlsx`)
}

// Export khusus pelanggan
export async function exportPelanggan(users: any[]) {
  const data = users.map((u, i) => ({
    'No': i + 1,
    'Kode Pelanggan': u.customerCode,
    'Nama Lengkap': u.fullName,
    'No HP': u.phone,
    'Email': u.email ?? '-',
    'Alamat': u.address,
    'Kota': u.city ?? '-',
    'Paket': u.package?.name ?? '-',
    'Status': u.status,
    'Tanggal Daftar': new Date(u.createdAt).toLocaleDateString('id-ID'),
  }))
  exportToExcel(data, 'Data_Pelanggan_CAKRANA', 'Pelanggan')
}

// Export khusus laporan bulanan
export async function exportLaporanBulanan(invoices: any[], month: string, year: string) {
  const data = invoices.map((inv, i) => ({
    'No': i + 1,
    'No Invoice': inv.invoiceNumber,
    'Pelanggan': inv.user?.fullName ?? '-',
    'Kode': inv.user?.customerCode ?? '-',
    'Paket': inv.package?.name ?? '-',
    'Tagihan': inv.amount,
    'Denda': inv.penaltyAmount,
    'Total': inv.totalAmount,
    'Status': inv.status,
    'Jatuh Tempo': new Date(inv.dueDate).toLocaleDateString('id-ID'),
    'Dibayar': inv.paidAt ? new Date(inv.paidAt).toLocaleDateString('id-ID') : '-',
  }))
  exportToExcel(data, `Laporan_${month}_${year}_CAKRANA`, `Laporan ${month} ${year}`)
}