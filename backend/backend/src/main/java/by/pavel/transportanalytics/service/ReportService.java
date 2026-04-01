package by.pavel.transportanalytics.service;

import by.pavel.transportanalytics.dto.AnalyticsDto;
import by.pavel.transportanalytics.model.Repair;
import by.pavel.transportanalytics.model.Trip;
import by.pavel.transportanalytics.model.Vehicle;
import by.pavel.transportanalytics.repository.VehicleRepository;
import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.awt.*;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final AnalyticsService analyticsService;
    private final VehicleRepository vehicleRepository;

    public byte[] generateFleetSummaryReport() {
        // Убрали неиспользуемую переменную data
        List<Vehicle> vehicles = vehicleRepository.findAll();

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4);
            PdfWriter.getInstance(document, out);
            document.open();

            Font font = getRussianFont(18, Font.BOLD);
            Paragraph title = new Paragraph("Сводный отчет по автопарку", font);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            PdfPTable table = new PdfPTable(6);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{1, 2, 2, 1, 2, 2});

            addTableHeader(table, getRussianFont(10, Font.BOLD),
                    "ID", "Гос. номер", "Модель", "Год", "Пробег (км)", "Затраты (BYN)");

            for (Vehicle v : vehicles) {
                int mileage = v.getTrips().stream().mapToInt(Trip::getMileageEnd).max().orElse(0);

                // Исправлено: используем BigDecimal::add
                BigDecimal fuelCost = v.getTrips().stream()
                        .map(Trip::getFuelUsed)
                        .reduce(BigDecimal.ZERO, BigDecimal::add)
                        .multiply(new BigDecimal("2.57"));

                // Исправлено: используем BigDecimal::add
                BigDecimal repairCost = v.getRepairs().stream()
                        .map(Repair::getCost)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                table.addCell(String.valueOf(v.getId()));
                table.addCell(createRussianCell(v.getPlateNumber(), getRussianFont(10, Font.NORMAL)));
                table.addCell(createRussianCell(v.getModel(), getRussianFont(10, Font.NORMAL)));

                // Исправлено: предполагаем, что поле называется year (если нет - замени на нужное)
                table.addCell(String.valueOf(v.getYear()));

                table.addCell(String.format("%, d", mileage));
                table.addCell(String.format("%.2f", fuelCost.add(repairCost)));
            }

            document.add(table);
            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Ошибка при генерации PDF: " + e.getMessage());
        }
    }

    public byte[] generateDetailedVehicleReport(Long vehicleId) {
        AnalyticsDto analytics = analyticsService.getVehicleAnalytics(vehicleId);
        Vehicle vehicle = vehicleRepository.findById(vehicleId).orElseThrow();

        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4);
            PdfWriter.getInstance(document, out);
            document.open();

            Font headerFont = getRussianFont(16, Font.BOLD);
            Font normalFont = getRussianFont(11, Font.NORMAL);
            Font subHeaderFont = getRussianFont(13, Font.BOLD);

            // Исправлено: заменено getYearOfProduction на getYear
            document.add(new Paragraph("Детализированный отчет: " + vehicle.getPlateNumber(), headerFont));
            document.add(new Paragraph("Модель: " + vehicle.getModel() + " (" + vehicle.getYear() + " г.)", normalFont));
            document.add(new Paragraph(" ", normalFont));

            // Секция показателей
            document.add(new Paragraph("Ключевые показатели:", subHeaderFont));
            PdfPTable statsTable = new PdfPTable(2);
            statsTable.setSpacingBefore(10);
            statsTable.setWidthPercentage(60);
            statsTable.setHorizontalAlignment(Element.ALIGN_LEFT);

            addStatRow(statsTable, "Общий пробег", String.format("%, d км", analytics.getVehicleTotalMileage()));
            addStatRow(statsTable, "Стоимость 1 км", String.format("%.2f BYN", analytics.getVehicleCostPerKm()));
            addStatRow(statsTable, "Средний расход", String.format("%.1f л/100км", analytics.getVehicleAvgFuelConsumption()));
            addStatRow(statsTable, "Отклонение от нормы", String.format("%.1f%%", analytics.getVehicleFuelNormDeviation()));

            document.add(statsTable);
            document.add(new Paragraph(" ", normalFont));

            // История поездок
            if (!vehicle.getTrips().isEmpty()) {
                document.add(new Paragraph("Последние поездки:", subHeaderFont));
                PdfPTable tripTable = new PdfPTable(3);
                tripTable.setSpacingBefore(10);
                tripTable.setWidthPercentage(100);
                addTableHeader(tripTable, getRussianFont(10, Font.BOLD), "Дата", "Дистанция", "Расход (л)");

                vehicle.getTrips().stream()
                        .sorted((a, b) -> b.getDate().compareTo(a.getDate()))
                        .limit(10)
                        .forEach(t -> {
                            tripTable.addCell(t.getDate().format(DateTimeFormatter.ofPattern("dd.MM.yyyy")));
                            // Исправлено: убран лишний String.valueOf
                            tripTable.addCell((t.getMileageEnd() - t.getMileageStart()) + " км");
                            tripTable.addCell(String.format(java.util.Locale.US, "%.1f", t.getFuelUsed().doubleValue()));
                        });
                document.add(tripTable);
            }

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Ошибка генерации отчета по ТС: " + e.getMessage());
        }
    }

    private Font getRussianFont(int size, int style) throws Exception {
        BaseFont bf = BaseFont.createFont("fonts/Roboto-Regular.ttf", BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
        return new Font(bf, size, style);
    }

    private void addTableHeader(PdfPTable table, Font font, String... headers) {
        for (String header : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(header, font));
            cell.setBackgroundColor(new Color(230, 230, 230));
            cell.setPadding(5);
            table.addCell(cell);
        }
    }

    private PdfPCell createRussianCell(String text, Font font) {
        return new PdfPCell(new Phrase(text, font));
    }

    private void addStatRow(PdfPTable table, String label, String value) throws Exception {
        Font font = getRussianFont(10, Font.NORMAL);
        Font boldFont = getRussianFont(10, Font.BOLD);
        table.addCell(new PdfPCell(new Phrase(label, font)));
        table.addCell(new PdfPCell(new Phrase(value, boldFont)));
    }
}