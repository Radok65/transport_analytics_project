package by.pavel.transportanalytics.aspect;

import by.pavel.transportanalytics.model.AnalyticsEvent;
import by.pavel.transportanalytics.repository.AnalyticsEventRepository;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.AfterReturning;
import org.aspectj.lang.annotation.AfterThrowing;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Aspect
@Component
@RequiredArgsConstructor
public class AnalyticsAspect {

    private final AnalyticsEventRepository eventRepository;

    @Pointcut("execution(* by.pavel.transportanalytics.controller.AuthController.registerUser(..))")
    public void authRegister() {}

    @Pointcut("execution(* by.pavel.transportanalytics.controller.VehicleController.getAllVehicles(..))")
    public void vehicleListView() {}

    @Pointcut("execution(* by.pavel.transportanalytics.controller.VehicleController.getVehicleById(..))")
    public void vehicleCardView() {}

    @Pointcut("execution(* by.pavel.transportanalytics.controller.VehicleController.createVehicle(..))")
    public void vehicleCreate() {}

    @Pointcut("execution(* by.pavel.transportanalytics.controller.VehicleController.addTripToVehicle(..))")
    public void waybillSave() {}

    @Pointcut("execution(* by.pavel.transportanalytics.controller.VehicleController.addRepairToVehicle(..))")
    public void repairSave() {}

    @Pointcut("execution(* by.pavel.transportanalytics.controller.DriverController.getAllDrivers(..))")
    public void driverListView() {}

    @Pointcut("execution(* by.pavel.transportanalytics.controller.DriverController.createDriver(..))")
    public void driverCreate() {}

    @Pointcut("execution(* by.pavel.transportanalytics.controller.TripController.deleteTrip(..))")
    public void tripDelete() {}

    @Pointcut("execution(* by.pavel.transportanalytics.controller.*.*(..))")
    public void anyControllerMethod() {}

    @AfterReturning("authRegister()")
    public void logAuthSuccess(JoinPoint joinPoint) {
        saveEvent("Конверсия", "auth_success", "NEW_USER", "Успешная регистрация в системе");
    }

    @AfterReturning("vehicleListView()")
    public void logVehicleList() {
        saveEvent("Просмотры экранов", "vehicle_list_view", "ALL", "Просмотр реестра транспорта");
    }

    @AfterReturning(pointcut = "vehicleCardView()", returning = "result")
    public void logVehicleCard(JoinPoint joinPoint, Object result) {
        Object id = joinPoint.getArgs()[0];
        saveEvent("Просмотры экранов", "vehicle_card_view", id.toString(), "Детальный просмотр ТС");
    }

    @AfterReturning("vehicleCreate()")
    public void logVehicleReg() {
        saveEvent("Конверсия", "vehicle_reg_success", "ADMIN_ACTION", "Новое ТС добавлено в справочник");
    }

    @AfterReturning("waybillSave()")
    public void logWaybillSave(JoinPoint joinPoint) {
        Object vehicleId = joinPoint.getArgs()[0];
        saveEvent("Конверсия", "waybill_save_done", vehicleId.toString(), "Регистрация оперативных данных о поездке");
    }

    @AfterReturning("repairSave()")
    public void logRepairSave(JoinPoint joinPoint) {
        Object vehicleId = joinPoint.getArgs()[0];
        saveEvent("Конверсия", "repair_record_done", vehicleId.toString(), "Фиксация затрат на обслуживание");
    }

    @AfterReturning("driverListView()")
    public void logDriverDir() {
        saveEvent("Просмотры экранов", "driver_dir_view", "STAFF", "Обращение к справочнику персонала");
    }

    @AfterReturning("driverCreate()")
    public void logDriverCreate() {
        saveEvent("Взаимодействие", "add_entity_click", "DRIVER", "Добавление нового сотрудника");
    }

    @AfterReturning("tripDelete()")
    public void logDataDeletion(JoinPoint joinPoint) {
        Object id = joinPoint.getArgs()[0];
        saveEvent("Системные события", "data_archive_click", id.toString(), "Удаление записи из базы данных");
    }

    @AfterThrowing(pointcut = "anyControllerMethod()", throwing = "ex")
    public void logApiFail(JoinPoint joinPoint, Exception ex) {
        saveEvent("Системные события", "api_request_fail", ex.getClass().getSimpleName(), joinPoint.getSignature().getName());
    }

    private void saveEvent(String category, String name, String param, String desc) {
        String currentUser = SecurityContextHolder.getContext().getAuthentication() != null
                ? SecurityContextHolder.getContext().getAuthentication().getName()
                : "ANONYMOUS";

        AnalyticsEvent event = AnalyticsEvent.builder()
                .category(category)
                .eventName(name)
                .parameter(param)
                .description(desc)
                .timestamp(LocalDateTime.now())
                .userLogin(currentUser)
                .build();
        eventRepository.save(event);
    }
}