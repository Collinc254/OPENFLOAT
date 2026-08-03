package com.openfloat.middleware.service;

// 1. Explicit OpenPDF Imports
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;

// 2. Explicit Apache POI Imports (excluding Font to prevent clash)
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

import com.openfloat.middleware.model.MpesaTransaction;
import com.openfloat.middleware.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportService {

    private final TransactionRepository transactionRepository;

    // ==========================================
    // 1. EXCEL GENERATION (Apache POI)
    // ==========================================
    public ByteArrayInputStream generateTransactionExcel() {
        List<MpesaTransaction> transactions = transactionRepository.findAll();
        
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Transactions");

            // Create Header Row
            Row headerRow = sheet.createRow(0);
            String[] columns = {"Invoice Ref", "Phone Number", "Amount", "Status", "Mpesa Receipt", "Date"};
            
            CellStyle headerStyle = workbook.createCellStyle();
            
            // 3. Fully qualified POI Font to avoid clashing with OpenPDF Font
            org.apache.poi.ss.usermodel.Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerStyle.setFont(headerFont);

            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }

            // Populate Data Rows
            int rowIdx = 1;
            for (MpesaTransaction trx : transactions) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(trx.getId());
                row.createCell(1).setCellValue(trx.getPhone() != null ? trx.getPhone() : "N/A");
                row.createCell(2).setCellValue(trx.getAmount() != null ? trx.getAmount().doubleValue() : 0.0);
                row.createCell(3).setCellValue(trx.getStatus());
                row.createCell(4).setCellValue(trx.getMpesaRef() != null ? trx.getMpesaRef() : "N/A");
                row.createCell(5).setCellValue(trx.getDate() != null ? trx.getDate().toString() : "N/A");
            }

            // Auto-size columns
            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return new ByteArrayInputStream(out.toByteArray());
            
        } catch (Exception e) {
            log.error("Failed to generate Excel report", e);
            throw new RuntimeException("Failed to generate Excel file: " + e.getMessage());
        }
    }

    // ==========================================
    // 2. PDF GENERATION (OpenPDF)
    // ==========================================
    public ByteArrayInputStream generateTransactionPdf() {
        List<MpesaTransaction> transactions = transactionRepository.findAll();
        ByteArrayOutputStream out = new ByteArrayOutputStream();

        Document document = new Document(PageSize.A4.rotate()); // Landscape for wider tables
        
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            // Add Report Title
            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18);
            Paragraph title = new Paragraph("OpenFloat Transaction Report", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            // Create Table with 6 columns
            PdfPTable table = new PdfPTable(6);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{2f, 2f, 1.5f, 1.5f, 2f, 2.5f});
            
            // Add Table Headers
            String[] headers = {"Invoice Ref", "Phone Number", "Amount", "Status", "Receipt", "Date"};
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
            
            for (String header : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(header, headerFont));
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setPadding(8);
                table.addCell(cell);
            }

            // Add Table Data
            Font dataFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
            for (MpesaTransaction trx : transactions) {
                table.addCell(new PdfPCell(new Phrase(trx.getId(), dataFont)));
                table.addCell(new PdfPCell(new Phrase(trx.getPhone() != null ? trx.getPhone() : "N/A", dataFont)));
                table.addCell(new PdfPCell(new Phrase(trx.getAmount() != null ? trx.getAmount().toString() : "0", dataFont)));
                table.addCell(new PdfPCell(new Phrase(trx.getStatus(), dataFont)));
                table.addCell(new PdfPCell(new Phrase(trx.getMpesaRef() != null ? trx.getMpesaRef() : "N/A", dataFont)));
                table.addCell(new PdfPCell(new Phrase(trx.getDate() != null ? trx.getDate().toString() : "N/A", dataFont)));
            }

            document.add(table);
            document.close();
            
        } catch (DocumentException e) {
            log.error("Failed to generate PDF report", e);
            throw new RuntimeException("Failed to generate PDF file: " + e.getMessage());
        }

        return new ByteArrayInputStream(out.toByteArray());
    }
}