// frontend/src/lib/analyticsService.ts

const ANALYTICS_API_URL = 'http://localhost:4000/api/track'; // Порт 4000 для микросервиса

// Типы для автокомплита и строгой типизации всех 19 событий
export type EventCategory = 'Просмотры экранов' | 'Взаимодействие' | 'Конверсия' | 'Системные события';

export type EventName = 
    // Просмотры
    | 'login_page_view' | 'dashboard_view' | 'vehicle_card_view' | 'waybill_form_view' | 'report_page_view'
    // Взаимодействия
    | 'add_entity_click' | 'filter_apply_click' | 'chart_drilldown' | 'export_initiate' | 'search_input'
    // Конверсии
    | 'auth_success' | 'waybill_save_done' | 'repair_record_done' | 'report_download' | 'vehicle_reg_success'
    // Системные
    | 'validation_error' | 'search_results' | 'threshold_alert' | 'api_request_fail';

export interface AnalyticsPayload {
    event_category: EventCategory;
    event_name: EventName;
    user_id?: string | null;
    
    // Параметры просмотров
    source_url?: string;
    browser_name?: string;
    user_role?: string;
    refresh_type?: string;
    vehicle_id?: string;
    entry_point?: string;
    is_edit_mode?: boolean;
    last_report_type?: string;
    
    // Параметры взаимодействий
    entity_type?: string;
    button_location?: string;
    field_name?: string;
    filter_value?: string;
    chart_id?: string;
    metric_name?: string;
    file_format?: string;
    page_orientation?: string;
    query_length?: number;
    
    // Параметры конверсий
    auth_duration?: number;
    mileage_total?: number;
    total_cost?: number;
    currency_unit?: string;
    range_days?: number;
    file_size_kb?: number;
    brand_model?: string;
    
    // Параметры системных событий
    field_id?: string;
    error_code?: string;
    query_text?: string;
    found_count?: number;
    alert_type?: string;
    deviation_val?: number;
    status_code?: number;
    endpoint_path?: string;
}

class AnalyticsService {
    // Вспомогательный метод для получения ID текущего пользователя (если есть)
    private getCurrentUserId(): string | null {
        if (typeof window !== 'undefined') {
            const user = localStorage.getItem('user');
            if (user) {
                try {
                    const parsedUser = JSON.parse(user);
                    // Предполагаем, что у пользователя есть id или username
                    return parsedUser.id?.toString() || parsedUser.username || 'unknown';
                } catch (e) {
                    return null;
                }
            }
        }
        return null;
    }

    // Метод для получения названия браузера
    private getBrowserName(): string {
        if (typeof window === 'undefined') return 'Unknown';
        const ua = navigator.userAgent;
        if (ua.includes('Chrome')) return 'Chrome';
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Safari')) return 'Safari';
        if (ua.includes('Edge')) return 'Edge';
        return 'Other';
    }

    // Главный метод отправки
    public async trackEvent(category: EventCategory, eventName: EventName, params: Partial<AnalyticsPayload> = {}) {
        const payload: AnalyticsPayload = {
            event_category: category,
            event_name: eventName,
            user_id: params.user_id || this.getCurrentUserId(),
            ...params
        };

        // Автоматически добавляем browser_name для просмотров экранов, если его нет
        if (category === 'Просмотры экранов' && !payload.browser_name) {
            payload.browser_name = this.getBrowserName();
        }

        try {
            // Отправляем запрос в фоновом режиме, не блокируя UI (не ждем await, просто ловим ошибки)
            fetch(ANALYTICS_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            }).catch(err => console.error('Analytics tracking failed (Network):', err));
            
            console.log(`[Analytics Sent]: ${eventName}`, payload); // Оставляем для отладки
        } catch (error) {
            console.error('Analytics tracking failed:', error);
        }
    }
}

export const analytics = new AnalyticsService();