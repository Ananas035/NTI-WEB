import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type Lang = 'ar' | 'en';

@Injectable({
  providedIn: 'root'
})
export class Language {
  private currentLangSubject = new BehaviorSubject<Lang>('ar');
  currentLang$ = this.currentLangSubject.asObservable();

  private translations: Record<Lang, Record<string, string>> = {
    ar: {
      // Header & Navigation
      'lang_switch_label': 'English',
      'brand_name': 'FactoryHub',
      'brand_sub': 'نظام إدارة المصنع',
      'logout': 'تسجيل الخروج',
      'nav_dashboard': 'الرئيسية',
      'nav_accounts': 'الحسابات',
      'nav_products': 'المنتجات / الموديلات',
      'nav_invoices': 'الفواتير',
      'nav_returns': 'المرتجعات',
      'nav_inventory': 'المخزون',
      // Header / Profile
      'header_toggle_sidebar': 'طي / فتح القائمة الجانبية',
      'profile_email': 'البريد الإلكتروني',
      'profile_phone': 'رقم الهاتف',
      'profile_role': 'الصلاحية',
      'role_admin': 'مدير النظام',
      'role_user': 'مستخدم',
      'default_user': 'المستخدم',

      // Dashboard Page
      'dashboard_loading': 'جاري تحميل بيانات لوحة التحكم...',
      'dash_welcome': 'مرحباً بك في FactoryHub 👋',
      'dash_subtitle': 'إليك ملخص نشاط المصنع والمبيعات ',
      'stat_customers': 'إجمالي العملاء',
      'stat_invoices': 'الفواتير',
      'stat_returns': 'المرتجعات',
      'stat_inventory': 'المخزون المتاح',
      'this_month': 'هذا الشهر',
      'pieces_available': 'قطعة متوفرة',
      'quick_actions': 'إجراءات سريعة',
      'action_new_invoice': '+ إنشاء فاتورة جديدة',
      'action_new_customer': '+ إضافة عميل جديد',
      'action_new_product': '+ إضافة موديل / منتج',
      'action_new_return': '+ تسجيل مرتجع جديد',
      'chart_title': 'مؤشر المبيعات والأداء',
      'recent_invoices': 'آخر الفواتير الصادرة',
      'recent_customers': 'أحدث العملاء',
      'view_all': 'عرض الكل',
      'chart_daily_sales': 'المبيعات اليومية خلال آخر 7 أيام',
      'day_saturday': 'السبت',
      'day_sunday': 'الأحد',
      'day_monday': 'الاثنين',
      'day_tuesday': 'الثلاثاء',
      'day_wednesday': 'الأربعاء',
      'day_thursday': 'الخميس',
      'day_friday': 'الجمعة',

      // Tables & Labels
      'col_invoice_id': 'رقم الفاتورة',
      'col_customer': 'العميل',
      'col_date': 'التاريخ',
      'col_amount': 'المبلغ الإجمالي',
      'col_status': 'الحالة',
      'status_paid': 'مدفوعة',
      'status_pending': 'معلقة',
      'status_partial': 'جزئية',
      'currency': 'ج.م',

      // ============================================================
      // Invoices Page
      // ============================================================

      'inv_title': 'سجل الفواتير والمبيعات',
      'inv_total_issued': 'إجمالي الفواتير الصادرة',
      'inv_create': '+ إنشاء فاتورة جديدة',
      'inv_loading_data': 'جاري تحميل البيانات...',
      'inv_loading_invoices': 'جاري تحميل الفواتير...',

      'inv_search_placeholder':
        'بحث برقم الفاتورة أو اسم العميل...',

      'inv_invoice_number': 'رقم الفاتورة',
      'inv_customer': 'العميل',
      'inv_date': 'التاريخ',
      'inv_total_amount': 'المبلغ الإجمالي',
      'inv_actions': 'الإجراءات',

      'inv_view_details': 'عرض التفاصيل',
      'inv_print_pdf': 'طباعة / تصدير PDF',

      'inv_no_matching':
        'لا توجد فواتير مطابقة لبحثك',

      'inv_create_title': 'إنشاء فاتورة جديدة',
      'inv_invoice_date': 'تاريخ الفاتورة',
      'inv_customer_receiver': 'العميل المستلم',
      'inv_select_customer': 'اختر العميل...',

      'inv_model_code': 'كود الموديل',
      'inv_model_name': 'اسم الموديل',
      'inv_quantity': 'الكمية',
      'inv_unit_price': 'سعر القطعة',
      'inv_total': 'الإجمالي',

      'inv_select_model': 'اختر الموديل...',
      'inv_name': 'الاسم',
      'inv_available': 'متاح',

      'inv_delete_item': 'حذف البند',
      'inv_add_model': '+ إضافة موديل جديد',

      'inv_required_total': 'إجمالي الفاتورة المطلوب:',
      'inv_saving': 'جاري الحفظ...',
      'inv_save': 'حفظ الفاتورة',
      'inv_save_print': 'حفظ وطباعة PDF',
      'inv_cancel': 'إلغاء',
      'inv_close': 'إغلاق',

      'inv_details_title': 'تفاصيل الفاتورة:',
      'inv_customer_label': 'العميل:',
      'inv_latest_loading': 'جاري تحميل أحدث بيانات الفاتورة...',
      'inv_total_value': 'إجمالي القيمة:',
      'inv_print_invoice': 'طباعة الفاتورة',

      'inv_item_number': 'م',
      'inv_unit': 'الوحدة',
      'inv_quantity_pieces': 'قطعة',
      'inv_egp': 'ج.م',

      'inv_print_sale': 'فاتورة بيع',
      'inv_invoice_no': 'رقم الفاتورة:',
      'inv_print_date': 'التاريخ:',
      'inv_bill_to': 'فاتورة موجهة إلى السيد /',
      'inv_model_code_print': 'كود الموديل',
      'inv_model_name_print': 'اسم الموديل',
      'inv_unit_price_print': 'سعر الوحدة',
      'inv_total_print': 'الإجمالي',
      'inv_required_amount': 'إجمالي المبلغ المطلوب:',
      'inv_receiver_signature': 'توقيع المستلم:',
      'inv_accounts_signature': 'توقيع الحسابات:',

      // Local validation / errors
      'inv_error_load': 'تعذر تحميل الفواتير',
      'inv_error_load_generic': 'حدث خطأ أثناء تحميل الفواتير',

      'inv_customer_name_fallback': 'بدون اسم',
      'inv_model_fallback': 'موديل',

      'inv_error_no_customers':'لا يوجد عملاء متاحون لإنشاء الفاتورة',

      'inv_error_no_products':
        'لا توجد موديلات متاحة لإنشاء الفاتورة',

      'inv_error_select_customer':
        'يرجى اختيار العميل أولاً',

      'inv_error_invalid_items':
        'يرجى اختيار موديل واحد على الأقل وتحديد الكمية بشكل صحيح',

      'inv_error_model_not_found':
        'الموديل غير موجود',

      'inv_error_insufficient_stock':
        'الكمية المطلوبة غير متوفرة. المتاح:',

      'inv_error_save':
        'تعذر حفظ الفاتورة',

      'inv_error_save_generic':
        'حدث خطأ أثناء حفظ الفاتورة',

      'inv_error_view':
        'تعذر تحميل تفاصيل الفاتورة',

      // ============================================================
      // Accounts Page
      // ============================================================

      'acc_title': 'حسابات العملاء وكشوف الحساب',
      'acc_total_customers': 'إجمالي العملاء',
      'acc_add_customer': '+ إضافة عميل جديد',

      'acc_loading': 'جاري تحميل بيانات العملاء والحسابات...',
      'acc_retry': 'إعادة المحاولة',

      'acc_search_placeholder':
        'بحث بالاسم أو اسم المعرض أو رقم الموبايل...',

      'acc_customer': 'العميل',
      'acc_store_name': 'اسم المعرض',
      'acc_mobile': 'رقم الموبايل',
      'acc_invoice_count': 'عدد الفواتير',
      'acc_net_pieces': 'صافي القطع المستلمة',
      'acc_amount_due': 'المبلغ المستحق',
      'acc_actions': 'الإجراءات',

      'acc_since': 'منذ',
      'acc_piece': 'قطعة',
      'acc_egp': 'ج.م',

      'acc_statement': 'كشف الحساب',
      'acc_edit': 'تعديل بيانات العميل',
      'acc_delete': 'حذف',

      'acc_no_matching_customers':
        'لا يوجد عملاء مطابقين لبحثك',

      'acc_edit_customer': 'تعديل بيانات العميل',
      'acc_add_customer_title': 'إضافة عميل جديد',

      'acc_customer_name': 'اسم العميل',
      'acc_customer_name_placeholder':
        'أدخل اسم العميل بالكامل',

      'acc_store_label': 'اسم المعرض أو المتجر',
      'acc_store_placeholder':
        'اسم المحل أو المعرض التجاري',

      'acc_mobile_label': 'رقم الموبايل',
      'acc_mobile_placeholder':
        '01xxxxxxxxx',

      'acc_address_label': 'العنوان التفصيلي',
      'acc_address_placeholder':
        'المدينة، الحي، الشارع',

      'acc_save_customer': 'حفظ العميل',
      'acc_cancel': 'إلغاء',

      'acc_statement_title': 'كشف حساب:',
      'acc_add_payment': '+ إضافة دفعة',
      'acc_add_check': '+ تسجيل شيك',

      'acc_statement_loading':
        'جاري تحميل كشف الحساب...',

      'acc_received_total': 'إجمالي المستلم',
      'acc_returned_total': 'إجمالي المرتجع',
      'acc_net_pieces_total': 'صافي القطع',
      'acc_invoice_value': 'قيمة الفواتير',
      'acc_return_value': 'قيمة المرتجعات',
      'acc_total_paid': 'إجمالي المدفوع',
      'acc_amount_to_pay': 'المبلغ المطلوب سداده',

      'acc_transactions_title':
        'سجل الحركات المالية والمستندية',

      'acc_last_5_transactions':
        'عرض آخر 5 حركات',

      'acc_view_all': 'عرض الكل',

      'acc_date': 'التاريخ',
      'acc_transaction_type': 'نوع الحركة',
      'acc_reference': 'رقم السند',
      'acc_quantity': 'الكمية',
      'acc_amount': 'المبلغ',
      'acc_remaining_balance': 'الرصيد المتبقي',

      'acc_invoice': 'فاتورة',
      'acc_return': 'مرتجع',
      'acc_cash_payment': 'دفعة نقدية',
      'acc_check': 'شيك',

      'acc_no_transactions':
        'لا توجد حركات مسجلة لهذا الحساب',

      'acc_checks_title':
        'سجل الشيكات البنكية',

      'acc_last_5_checks':
        'عرض آخر 5 شيكات',

      'acc_check_number': 'رقم الشيك',
      'acc_check_owner': 'صاحب الشيك',
      'acc_drawn_bank': 'البنك المسحوب عليه',
      'acc_due_date': 'تاريخ الاستحقاق',
      'acc_status_action': 'الحالة والإجراء',

      'acc_collecting': 'جاري التحصيل...',
      'acc_pending_check':
        'تحت التحصيل (اضغط للتحصيل)',

      'acc_processed_check':
        'تم التحصيل بالبنك ✓',

      'acc_view_all_checks': 'عرض الكل',

      'acc_no_checks':
        'لا توجد شيكات مسجلة لهذا العميل',

      'acc_payment_title':
        'إضافة دفعة نقدية جديدة',

      'acc_payment_amount':
        'مبلغ الدفعة (ج.م) *',

      'acc_payment_amount_placeholder':
        'أدخل المبلغ المدفوع',

      'acc_payment_notes':
        'ملاحظات السداد',

      'acc_payment_notes_placeholder':
        'ملاحظات توضيحية للدفعة',

      'acc_save_payment': 'حفظ الدفعة',

      'acc_check_title':
        'تسجيل شيك بنكي جديد',

      'acc_check_issuer':
        'اسم صاحب الشيك (المحرر) *',

      'acc_check_issuer_placeholder':
        'مثال: شركة النور أو اسم الشخص',

      'acc_check_bank':
        'البنك المسحوب عليه *',

      'acc_check_bank_placeholder':
        'مثال: البنك الأهلي المصري',

      'acc_check_date':
        'تاريخ الاستحقاق *',

      'acc_check_amount':
        'مبلغ الشيك (ج.م) *',

      'acc_check_amount_placeholder':
        'المبلغ المكتوب بالشيك',

      'acc_save_check': 'حفظ الشيك',

      'acc_delete_confirm_title':
        'تأكيد حذف العميل',

      'acc_delete_confirm_text':
        'هل أنت متأكد من حذف هذا العميل؟ سيتم مسح حسابه وسجلاته بالكامل.',

      'acc_confirm_delete': 'تأكيد الحذف',

      'acc_warning_title':
        'لا يمكن تحصيل الشيك الآن',

      'acc_warning_description':
        'موعد تحصيل هذا الشيك لم يحن بعد. يرجى الانتظار حتى تاريخ الاستحقاق.',

      'acc_check_number_label':
        'رقم الشيك',

      'acc_collection_date_label':
        'موعد التحصيل',

      'acc_warning_info':
        'سيتم السماح بتحصيل الشيك بدايةً من تاريخ الاستحقاق.',

      'acc_understood': 'فهمت',

      'acc_close': 'إغلاق',

      // Validation / Errors

      'acc_error_load_customers':
        'تعذر تحميل بيانات العملاء',

      'acc_error_server_customers':
        'تعذر الاتصال بالسيرفر وتحميل العملاء',

      'acc_validation_customer_name':
        'من فضلك أدخل اسم العميل',

      'acc_validation_store':
        'من فضلك أدخل اسم المحل / المعرض',

      'acc_validation_mobile':
        'من فضلك أدخل رقم الموبايل',

      'acc_validation_address':
        'من فضلك أدخل العنوان',

      'acc_error_add_customer':
        'تعذر إضافة العميل',

      'acc_error_customer_edit_target':
        'تعذر تحديد العميل المراد تعديله',

      'acc_error_customer_database_id':
        'تعذر تحديد هوية العميل في قاعدة البيانات',

      'acc_error_update_customer':
        'تعذر تعديل العميل',

      'acc_error_delete_customer':
        'تعذر حذف العميل',

      'acc_error_statement_load':
        'تعذر تحميل كشف حساب العميل',

      'acc_error_statement_refresh':
        'تعذر تحديث كشف الحساب',

      'acc_validation_select_customer':
        'من فضلك اختر العميل أولاً',

      'acc_error_customer_id':
        'تعذر تحديد العميل',

      'acc_validation_payment_amount':
        'من فضلك أدخل مبلغ دفعة صحيح',

      'acc_error_payment':
        'تعذر تسجيل الدفعة',

      'acc_validation_check_amount':
        'من فضلك أدخل مبلغ شيك صحيح',

      'acc_validation_bank':
        'من فضلك أدخل اسم البنك',

      'acc_validation_collection_date':
        'من فضلك اختر تاريخ التحصيل',

      'acc_validation_collection_date_invalid':
        'تاريخ التحصيل غير صحيح',

      'acc_error_add_check':
        'تعذر إضافة الشيك',

      'acc_error_check_id':
        'تعذر تحديد الشيك',

      'acc_error_check_processed':
        'هذا الشيك تم تحصيله بالفعل',

      'acc_error_collect_check':
        'تعذر تحصيل الشيك',

      'acc_error_collect_check_generic':
        'حدث خطأ أثناء تحصيل الشيك',
        'acc_error_check_date_read':
          'تعذر قراءة تاريخ تحصيل الشيك',

        'acc_error_check_date_invalid':
          'تاريخ تحصيل الشيك غير صحيح',

          // ============================================================
          // Products / Models Page
          // ============================================================

          'prd_title': 'الموديلات / المنتجات',
          'prd_total_models': 'إجمالي الموديلات',
          'prd_add': '+ إضافة موديل جديد',

          'prd_search_placeholder':
            'بحث باسم الموديل أو الكود...',

          'prd_image': 'الصورة',
          'prd_model_name': 'اسم الموديل',
          'prd_code': 'الكود',
          'prd_pieces': 'عدد القطع',
          'prd_price': 'السعر',
          'prd_colors': 'الألوان',
          'prd_actions': 'الإجراءات',

          'prd_no_image': 'لا توجد صورة',
          'prd_no_matching': 'لا توجد موديلات مطابقة لبحثك',

          'prd_edit': 'تعديل',
          'prd_delete': 'حذف',

          'prd_edit_title': 'تعديل الموديل',
          'prd_add_title': 'إضافة موديل جديد',

          'prd_model_image': 'صورة الموديل',
          'prd_choose_image': 'اضغط لاختيار صورة للموديل',
          'prd_remove_image': 'إزالة الصورة',
          'prd_image_preview': 'معاينة صورة الموديل',

          'prd_name_label': 'اسم الموديل',
          'prd_name_placeholder': 'مثال: بلوزة صيفي مشجرة',

          'prd_code_label': 'كود الموديل',
          'prd_code_placeholder': 'مثال: 1005',

          'prd_pieces_label': 'عدد القطع',
          'prd_pieces_placeholder': 'العدد',

          'prd_price_label': 'سعر القطعة (ج.م)',
          'prd_price_placeholder': 'السعر',

          'prd_num_colors_label': 'عدد الألوان المتوفرة',
          'prd_num_colors_placeholder':
            'أدخل عدد الألوان لتحديد الأسماء',

          'prd_colors_hint': 'أدخل أسماء الألوان:',
          'prd_color_placeholder': 'اللون رقم',

          'prd_save_changes': 'حفظ التعديلات',
          'prd_add_model': 'إضافة الموديل',
          'prd_cancel': 'إلغاء',
          'prd_close': 'إغلاق',

          'prd_confirm_delete_title': 'تأكيد حذف الموديل',
          'prd_confirm_delete_text':
            'هل أنت متأكد من رغبتك في حذف هذا الموديل نهائياً؟ لا يمكن التراجع عن هذا الإجراء.',
          'prd_confirm_delete': 'تأكيد الحذف',

          // Errors / Validation

          'prd_error_load': 'تعذر تحميل الموديلات',
          'prd_error_load_backend':
            'تعذر تحميل الموديلات من الباك إند',

          'prd_error_image_invalid':
            'يرجى اختيار ملف صورة صالح',

          'prd_error_image_size':
            'حجم الصورة يجب ألا يتجاوز 5 ميجابايت',

          'prd_error_image_read':
            'تعذر قراءة الصورة',

          'prd_error_name':
            'يرجى إدخال اسم الموديل',

          'prd_error_code_integer':
            'كود الموديل يجب أن يكون رقمًا صحيحًا',

          'prd_error_code_positive':
            'كود الموديل يجب أن يكون أكبر من 0',

          'prd_error_pieces':
            'عدد القطع يجب أن يكون أكبر من 0',

          'prd_error_price':
            'السعر يجب أن يكون 0 أو أكبر',

          'prd_error_save_changes':
            'تعذر حفظ التعديلات',

          'prd_error_update':
            'حدث خطأ أثناء تعديل الموديل',

          'prd_error_add':
            'تعذر إضافة الموديل',

          'prd_error_add_generic':
            'حدث خطأ أثناء إضافة الموديل',

          'prd_error_delete':
            'تعذر حذف الموديل',

          'prd_error_delete_generic':
            'حدث خطأ أثناء حذف الموديل',

          'prd_available': 'متاح',
          // ============================================================
          // Returns Page
          // ============================================================

          'ret_title': 'سجل المرتجعات',
          'ret_total_returns': 'إجمالي أذونات المرتجع',
          'ret_add': '+ إضافة مرتجع جديد',
          'ret_loading_data': 'جاري تحميل البيانات...',
          'ret_loading_returns': 'جاري تحميل المرتجعات...',

          'ret_search_placeholder':
            'بحث برقم المرتجع أو اسم العميل...',

          'ret_number': 'رقم المرتجع',
          'ret_customer': 'العميل',
          'ret_date': 'تاريخ المرتجع',
          'ret_pieces': 'عدد القطع',
          'ret_total_value': 'إجمالي القيمة',
          'ret_actions': 'الإجراءات',

          'ret_view_details': 'عرض التفاصيل',

          'ret_no_matching':
            'لا توجد سجلات مرتجع مطابقة للبحث',

          'ret_create_title': 'تسجيل إذن مرتجع جديد',
          'ret_return_number': 'رقم إذن المرتجع',
          'ret_return_date': 'تاريخ المرتجع',
          'ret_customer_from': 'العميل المسترجع منه',

          'ret_model_code': 'كود الموديل',
          'ret_model_name': 'اسم الموديل',
          'ret_quantity': 'الكمية',
          'ret_unit_price': 'سعر القطعة',
          'ret_total': 'الإجمالي',

          'ret_select_model': 'اختر الموديل...',
          'ret_name': 'الاسم',
          'ret_available': 'متاح',

          'ret_delete_model': 'حذف الموديل',
          'ret_add_model': '+ إضافة موديل جديد',

          'ret_total_return_value': 'إجمالي قيمة المرتجع:',

          'ret_saving': 'جاري الحفظ...',
          'ret_save': 'تسجيل المرتجع',
          'ret_cancel': 'إلغاء',
          'ret_close': 'إغلاق',

          'ret_details_title': 'تفاصيل المرتجع:',
          'ret_customer_label': 'العميل:',
          'ret_latest_loading':
            'جاري تحميل أحدث بيانات المرتجع...',
          'ret_total_return': 'إجمالي المرتجع:',

          'ret_piece': 'قطعة',
          'ret_egp': 'ج.م',

          // Fallbacks
          'ret_customer_name_fallback': 'بدون اسم',
          'ret_model_fallback': 'موديل',

          // Validation / Errors
          'ret_error_load': 'تعذر تحميل المرتجعات',
          'ret_error_load_generic':
            'حدث خطأ أثناء تحميل المرتجعات',

          'ret_error_no_customers':
            'لا يوجد عملاء متاحون لتسجيل المرتجع',

          'ret_error_no_products':
            'لا توجد موديلات متاحة لتسجيل المرتجع',

          'ret_validation_customer':
            'يرجى اختيار العميل',

          'ret_validation_items':
            'يرجى اختيار موديل واحد على الأقل وتحديد الكمية بشكل صحيح',

          'ret_error_model_not_found':
            'الموديل غير موجود',

          'ret_error_save':
            'تعذر تسجيل المرتجع',

          'ret_error_save_generic':
            'حدث خطأ أثناء تسجيل المرتجع',

          'ret_error_view':
            'تعذر تحميل تفاصيل المرتجع',

          'ret_error_customer_no_received':
  'العميل {name} لم يستلم أي قطع من الموديل {code} ولا يمكن تسجيل مرتجع منه',
      // ============================================================
      // Inventory Page
      // ============================================================
      'inventory_title': 'المخزون / الجرد العام',
      'inventory_registered_models': 'إجمالي الموديلات المسجلة:',
      'inventory_total_models': 'إجمالي الموديلات',
      'inventory_total_available': 'إجمالي القطع المتاحة',
      'inventory_total_sold': 'إجمالي القطع المباعة',
      'inventory_total_returned': 'إجمالي القطع المرتجعة',
      'inventory_low_stock_stat': 'مخزون منخفض (≤ 50)',
      'inventory_out_of_stock': 'نفد من المخزن',

      'inventory_search_placeholder': 'بحث باسم الموديل أو الكود...',
      'inventory_filter_all': 'الكل',
      'inventory_filter_in_stock': 'متوفر بالمخزن',
      'inventory_filter_low_stock': 'مخزون منخفض',
      'inventory_filter_out_of_stock': 'نفد المخزون',

      'inventory_col_image': 'الصورة',
      'inventory_col_model_name': 'اسم الموديل',
      'inventory_col_code': 'الكود',
      'inventory_col_total_added': 'إجمالي الداخل',
      'inventory_col_sold': 'المبيع',
      'inventory_col_returned': 'المرتجع',
      'inventory_col_current': 'الموجود حالياً',
      'inventory_col_price': 'سعر القطعة',
      'inventory_col_status': 'الحالة',
      'inventory_col_history': 'حركة الجرد',

      'inventory_loading': 'جاري تحميل بيانات المخزون...',
      'inventory_no_image': 'بلا صورة',
      'inventory_no_name': 'بدون اسم',
      'inventory_no_matching': 'لا توجد منتجات مطابقة لخيارات البحث أو الفلترة',

      'inventory_piece': 'قطعة',
      'inventory_currency': 'ج.م',

      'inventory_status_in_stock': 'متوفر',
      'inventory_status_low_stock': 'مخزون منخفض',
      'inventory_status_out_of_stock': 'نفد المخزون',

      'inventory_history_button': 'سجل حركة المخزون',
      'inventory_history_title': 'سجل حركة المخزون',
      'inventory_code_label': 'كود',
      'inventory_history_loading': 'جاري تحميل سجل الحركة...',
      'inventory_history_date': 'التاريخ',
      'inventory_history_type': 'نوع الحركة',
      'inventory_history_reference': 'رقم السند',
      'inventory_history_quantity': 'الكمية',
      'inventory_history_before': 'المخزون السابق',
      'inventory_history_after': 'المخزون بعد الحركة',

      'inventory_history_new_model': 'إضافة موديل',
      'inventory_history_restock': 'إعادة تخزين',
      'inventory_history_invoice': 'فاتورة بيع',
      'inventory_history_return': 'مرتجع',

      'inventory_no_history': 'لا توجد حركات مسجلة لهذا الموديل',
      'inventory_close': 'إغلاق',

      'inventory_error_load_products': 'حدث خطأ أثناء تحميل المنتجات',
      'inventory_error_load_transactions': 'حدث خطأ أثناء تحميل حركات المخزون',
      'inventory_error_load_history': 'تعذر تحميل سجل حركة المخزون',

      'login_brand_subtitle': 'نظام إدارة المصنع',

'login_title': 'تسجيل الدخول',

'login_email': 'البريد الإلكتروني',
'login_email_placeholder': 'أدخل بريدك الإلكتروني',
'login_email_required': 'البريد الإلكتروني مطلوب',

'login_password': 'كلمة المرور',
'login_password_placeholder': 'أدخل كلمة المرور',
'login_password_required': 'كلمة المرور مطلوبة',

'login_remember_me': 'تذكرني',
'login_forgot_password': 'نسيت كلمة المرور؟',

'login_submit': 'دخول ←',
'login_loading': 'جاري تسجيل الدخول...',

'login_no_account': 'ليس لديك حساب؟',
'login_create_account': 'إنشاء حساب جديد',

'login_footer': '© 2026 مصنع الأصالة للملابس — جميع الحقوق محفوظة',

'login_switch_to_english': 'تغيير اللغة إلى الإنجليزية',
'login_switch_to_arabic': 'تغيير اللغة إلى العربية',

'login_show_password': 'إظهار كلمة المرور',
'login_hide_password': 'إخفاء كلمة المرور',

'login_error_invalid_credentials':
  'البريد الإلكتروني أو كلمة المرور غير صحيحة',

'login_error_server_connection':
  'تعذر الاتصال بالسيرفر',

'login_error_route_not_found':
  'مسار تسجيل الدخول غير موجود',

'login_error_server':
  'حدث خطأ في السيرفر',

'login_error_generic':
  'حدث خطأ أثناء تسجيل الدخول',

  'signup_brand_subtitle': 'نظام إدارة المصنع',

'signup_title': 'إنشاء حساب مستخدم جديد',

'signup_username': 'اسم المستخدم',
'signup_username_placeholder': 'مثال: ahmed_ali',

'signup_email': 'البريد الإلكتروني',
'signup_email_placeholder': 'name@factory.com',

'signup_mobile': 'رقم الهاتف',
'signup_mobile_placeholder': '010xxxxxxxx',

'signup_password': 'كلمة المرور',
'signup_password_placeholder': 'أدخل كلمة المرور',

'signup_confirm_password': 'تأكيد كلمة المرور',
'signup_confirm_password_placeholder':
  'أعد إدخال كلمة المرور',

'signup_loading': 'جاري إنشاء الحساب...',
'signup_submit': 'إنشاء الحساب',

'signup_have_account': 'لديك حساب بالفعل؟',
'signup_login': 'تسجيل الدخول',

'signup_footer':
  '© 2026 مصنع الأصالة للملابس — جميع الحقوق محفوظة',

'signup_switch_to_english':
  'تغيير اللغة إلى الإنجليزية',

'signup_switch_to_arabic':
  'تغيير اللغة إلى العربية',

'signup_show_password':
  'إظهار كلمة المرور',

'signup_hide_password':
  'إخفاء كلمة المرور',

'signup_success':
  'تم إنشاء الحساب بنجاح',

'signup_error_required_fields':
  'يرجى ملء جميع الحقول المطلوبة',

'signup_error_password_length':
  'يجب ألا تقل كلمة المرور عن 6 أحرف أو أرقام',

'signup_error_password_match':
  'كلمتا المرور غير متطابقتين',

'signup_error_invalid_email':
  'يرجى إدخال بريد إلكتروني صحيح',

'signup_error_email_exists':
  'البريد الإلكتروني مستخدم بالفعل',

'signup_error_invalid_data':
  'يرجى التأكد من صحة البيانات',

'signup_error_server_connection':
  'تعذر الاتصال بالسيرفر',

'signup_error_server':
  'حدث خطأ في السيرفر',

'signup_error_generic':
  'حدث خطأ أثناء إنشاء الحساب',
    },
    en: {
      // Header & Navigation
      'lang_switch_label': 'العربية',
      'brand_name': 'FactoryHub',
      'brand_sub': 'Factory Management System',
      'logout': 'Logout',
      'nav_dashboard': 'Dashboard',
      'nav_accounts': 'Accounts',
      'nav_products': 'Products / Models',
      'nav_invoices': 'Invoices',
      'nav_returns': 'Returns',
      'nav_inventory': 'Inventory',
      // Header / Profile
      'header_toggle_sidebar': 'Collapse / Open Sidebar',
      'profile_email': 'Email',
      'profile_phone': 'Phone Number',
      'profile_role': 'Role',
      'role_admin': 'System Administrator',
      'role_user': 'User',
      'default_user': 'User',

      // Dashboard Page
      'dashboard_loading': 'Loading dashboard data...',
      'dash_welcome': 'Welcome to FactoryHub 👋',
      'dash_subtitle': "Here is factory activity and sales summary",
      'stat_customers': 'Total Customers',
      'stat_invoices': 'Invoices',
      'stat_returns': 'Returns',
      'stat_inventory': 'Available Stock',
      'this_month': 'this month',
      'pieces_available': 'pieces available',
      'quick_actions': 'Quick Actions',
      'action_new_invoice': '+ Create New Invoice',
      'action_new_customer': '+ Add New Customer',
      'action_new_product': '+ Add New Model',
      'action_new_return': '+ Record New Return',
      'chart_title': 'Sales & Performance Index',
      'recent_invoices': 'Recent Invoices',
      'recent_customers': 'Recent Customers',
      'view_all': 'View All',
      'chart_daily_sales': 'Daily sales over the last 7 days',
      'day_saturday': 'Saturday',
      'day_sunday': 'Sunday',
      'day_monday': 'Monday',
      'day_tuesday': 'Tuesday',
      'day_wednesday': 'Wednesday',
      'day_thursday': 'Thursday',
      'day_friday': 'Friday',

      // Tables & Labels
      'col_invoice_id': 'Invoice No.',
      'col_customer': 'Customer',
      'col_date': 'Date',
      'col_amount': 'Total Amount',
      'col_status': 'Status',
      'status_paid': 'Paid',
      'status_pending': 'Pending',
      'status_partial': 'Partial',
      'currency': 'EGP',
      // ============================================================
      // Invoices Page
      // ============================================================

      'inv_title': 'Invoice & Sales Records',
      'inv_total_issued': 'Total Issued Invoices',
      'inv_create': '+ Create New Invoice',
      'inv_loading_data': 'Loading data...',
      'inv_loading_invoices': 'Loading invoices...',

      'inv_search_placeholder':
        'Search by invoice number or customer name...',

      'inv_invoice_number': 'Invoice Number',
      'inv_customer': 'Customer',
      'inv_date': 'Date',
      'inv_total_amount': 'Total Amount',
      'inv_actions': 'Actions',

      'inv_view_details': 'View Details',
      'inv_print_pdf': 'Print / Export PDF',

      'inv_no_matching':
        'No invoices match your search',

      'inv_create_title': 'Create New Invoice',
      'inv_invoice_date': 'Invoice Date',
      'inv_customer_receiver': 'Receiving Customer',
      'inv_select_customer': 'Select customer...',

      'inv_model_code': 'Model Code',
      'inv_model_name': 'Model Name',
      'inv_quantity': 'Quantity',
      'inv_unit_price': 'Unit Price',
      'inv_total': 'Total',

      'inv_select_model': 'Select model...',
      'inv_name': 'Name',
      'inv_available': 'Available',

      'inv_delete_item': 'Delete Item',
      'inv_add_model': '+ Add New Model',

      'inv_required_total': 'Required Invoice Total:',
      'inv_saving': 'Saving...',
      'inv_save': 'Save Invoice',
      'inv_save_print': 'Save & Print PDF',
      'inv_cancel': 'Cancel',
      'inv_close': 'Close',

      'inv_details_title': 'Invoice Details:',
      'inv_customer_label': 'Customer:',
      'inv_latest_loading': 'Loading latest invoice data...',
      'inv_total_value': 'Total Value:',
      'inv_print_invoice': 'Print Invoice',

      'inv_item_number': '#',
      'inv_unit': 'Unit',
      'inv_quantity_pieces': 'pieces',
      'inv_egp': 'EGP',

      'inv_print_sale': 'Sales Invoice',
      'inv_invoice_no': 'Invoice Number:',
      'inv_print_date': 'Date:',
      'inv_bill_to': 'Invoice issued to Mr./Ms.',
      'inv_model_code_print': 'Model Code',
      'inv_model_name_print': 'Model Name',
      'inv_unit_price_print': 'Unit Price',
      'inv_total_print': 'Total',
      'inv_required_amount': 'Total Amount Due:',
      'inv_receiver_signature': 'Receiver Signature:',
      'inv_accounts_signature': 'Accounts Signature:',

      // Local validation / errors
      'inv_error_load': 'Unable to load invoices',
      'inv_error_load_generic': 'An error occurred while loading invoices',

      'inv_customer_name_fallback': 'Unnamed',
      'inv_model_fallback': 'Model',

      'inv_error_no_customers':
        'No customers are available to create an invoice',

      'inv_error_no_products':
        'No models are available to create an invoice',

      'inv_error_select_customer':
        'Please select a customer first',

      'inv_error_invalid_items':
        'Please select at least one model and enter a valid quantity',

      'inv_error_model_not_found':
        'Model not found',

      'inv_error_insufficient_stock':
        'The requested quantity is not available. Available:',

      'inv_error_save':
        'Unable to save invoice',

      'inv_error_save_generic':
        'An error occurred while saving the invoice',

      'inv_error_view':
        'Unable to load invoice details',
      // ============================================================
      // Accounts Page
      // ============================================================

      'acc_title': 'Customer Accounts & Statements',
      'acc_total_customers': 'Total Customers',
      'acc_add_customer': '+ Add New Customer',

      'acc_loading': 'Loading customer and account data...',
      'acc_retry': 'Retry',

      'acc_search_placeholder':
        'Search by name, showroom name, or mobile number...',

      'acc_customer': 'Customer',
      'acc_store_name': 'Showroom Name',
      'acc_mobile': 'Mobile Number',
      'acc_invoice_count': 'Invoice Count',
      'acc_net_pieces': 'Net Received Pieces',
      'acc_amount_due': 'Amount Due',
      'acc_actions': 'Actions',

      'acc_since': 'Since',
      'acc_piece': 'pieces',
      'acc_egp': 'EGP',

      'acc_statement': 'Statement',
      'acc_edit': 'Edit Customer',
      'acc_delete': 'Delete',

      'acc_no_matching_customers':
        'No customers match your search',

      'acc_edit_customer': 'Edit Customer',
      'acc_add_customer_title': 'Add New Customer',

      'acc_customer_name': 'Customer Name',
      'acc_customer_name_placeholder':
        'Enter the full customer name',

      'acc_store_label': 'Showroom / Store Name',
      'acc_store_placeholder':
        'Store or showroom name',

      'acc_mobile_label': 'Mobile Number',
      'acc_mobile_placeholder':
        '01xxxxxxxxx',

      'acc_address_label': 'Detailed Address',
      'acc_address_placeholder':
        'City, district, street',

      'acc_save_customer': 'Save Customer',
      'acc_cancel': 'Cancel',

      'acc_statement_title': 'Account Statement:',
      'acc_add_payment': '+ Add Payment',
      'acc_add_check': '+ Record Check',

      'acc_statement_loading':
        'Loading account statement...',

      'acc_received_total': 'Total Received',
      'acc_returned_total': 'Total Returned',
      'acc_net_pieces_total': 'Net Pieces',
      'acc_invoice_value': 'Invoice Value',
      'acc_return_value': 'Return Value',
      'acc_total_paid': 'Total Paid',
      'acc_amount_to_pay': 'Amount Due',

      'acc_transactions_title':
        'Financial & Document Transactions',

      'acc_last_5_transactions':
        'Show Last 5 Transactions',

      'acc_view_all': 'View All',

      'acc_date': 'Date',
      'acc_transaction_type': 'Transaction Type',
      'acc_reference': 'Reference',
      'acc_quantity': 'Quantity',
      'acc_amount': 'Amount',
      'acc_remaining_balance': 'Remaining Balance',

      'acc_invoice': 'Invoice',
      'acc_return': 'Return',
      'acc_cash_payment': 'Cash Payment',
      'acc_check': 'Check',

      'acc_no_transactions':
        'No transactions recorded for this account',

      'acc_checks_title':
        'Bank Checks Record',

      'acc_last_5_checks':
        'Show Last 5 Checks',

      'acc_check_number': 'Check Number',
      'acc_check_owner': 'Check Holder',
      'acc_drawn_bank': 'Drawn Bank',
      'acc_due_date': 'Due Date',
      'acc_status_action': 'Status & Action',

      'acc_collecting': 'Collecting...',
      'acc_pending_check':
        'Pending Collection (Click to Collect)',

      'acc_processed_check':
        'Collected by Bank ✓',

      'acc_view_all_checks': 'View All',

      'acc_no_checks':
        'No checks recorded for this customer',

      'acc_payment_title':
        'Add New Cash Payment',

      'acc_payment_amount':
        'Payment Amount (EGP) *',

      'acc_payment_amount_placeholder':
        'Enter the paid amount',

      'acc_payment_notes':
        'Payment Notes',

      'acc_payment_notes_placeholder':
        'Additional payment notes',

      'acc_save_payment': 'Save Payment',

      'acc_check_title':
        'Record New Bank Check',

      'acc_check_issuer':
        'Check Holder Name (Issuer) *',

      'acc_check_issuer_placeholder':
        'Example: Al Noor Company or person name',

      'acc_check_bank':
        'Drawn Bank *',

      'acc_check_bank_placeholder':
        'Example: National Bank of Egypt',

      'acc_check_date':
        'Due Date *',

      'acc_check_amount':
        'Check Amount (EGP) *',

      'acc_check_amount_placeholder':
        'Amount written on the check',

      'acc_save_check': 'Save Check',

      'acc_delete_confirm_title':
        'Confirm Customer Deletion',

      'acc_delete_confirm_text':
        'Are you sure you want to delete this customer? Their account and records will be deleted completely.',

      'acc_confirm_delete': 'Confirm Delete',

      'acc_warning_title':
        'The Check Cannot Be Collected Yet',

      'acc_warning_description':
        'The collection date for this check has not arrived yet. Please wait until the due date.',

      'acc_check_number_label':
        'Check Number',

      'acc_collection_date_label':
        'Collection Date',

      'acc_warning_info':
        'The check can be collected starting from the due date.',

      'acc_understood': 'Understood',

      'acc_close': 'Close',

      // Validation / Errors

      'acc_error_load_customers':
        'Unable to load customer data',

      'acc_error_server_customers':
        'Unable to connect to the server and load customers',

      'acc_validation_customer_name':
        'Please enter the customer name',

      'acc_validation_store':
        'Please enter the store / showroom name',

      'acc_validation_mobile':
        'Please enter the mobile number',

      'acc_validation_address':
        'Please enter the address',

      'acc_error_add_customer':
        'Unable to add customer',

      'acc_error_customer_edit_target':
        'Unable to identify the customer to edit',

      'acc_error_customer_database_id':
        'Unable to identify the customer in the database',

      'acc_error_update_customer':
        'Unable to update customer',

      'acc_error_delete_customer':
        'Unable to delete customer',

      'acc_error_statement_load':
        'Unable to load the customer statement',

      'acc_error_statement_refresh':
        'Unable to refresh the account statement',

      'acc_validation_select_customer':
        'Please select a customer first',

      'acc_error_customer_id':
        'Unable to identify the customer',

      'acc_validation_payment_amount':
        'Please enter a valid payment amount',

      'acc_error_payment':
        'Unable to record the payment',

      'acc_validation_check_amount':
        'Please enter a valid check amount',

      'acc_validation_bank':
        'Please enter the bank name',

      'acc_validation_collection_date':
        'Please select the collection date',

      'acc_validation_collection_date_invalid':
        'The collection date is invalid',

      'acc_error_add_check':
        'Unable to add the check',

      'acc_error_check_id':
        'Unable to identify the check',

      'acc_error_check_processed':
        'This check has already been collected',

      'acc_error_collect_check':
        'Unable to collect the check',

      'acc_error_collect_check_generic':
        'An error occurred while collecting the check',
        'acc_error_check_date_read':
          'Unable to read the collection date for check',

        'acc_error_check_date_invalid':
          'The collection date for check is invalid',

      // ============================================================
      // Products / Models Page
      // ============================================================

      'prd_title': 'Products / Models',
      'prd_total_models': 'Total Models',
      'prd_add': '+ Add New Model',

      'prd_search_placeholder':
        'Search by model name or code...',

      'prd_image': 'Image',
      'prd_model_name': 'Model Name',
      'prd_code': 'Code',
      'prd_pieces': 'Pieces',
      'prd_price': 'Price',
      'prd_colors': 'Colors',
      'prd_actions': 'Actions',

      'prd_no_image': 'No image',
      'prd_no_matching': 'No models match your search',

      'prd_edit': 'Edit',
      'prd_delete': 'Delete',

      'prd_edit_title': 'Edit Model',
      'prd_add_title': 'Add New Model',

      'prd_model_image': 'Model Image',
      'prd_choose_image': 'Click to choose a model image',
      'prd_remove_image': 'Remove Image',
      'prd_image_preview': 'Model Image Preview',

      'prd_name_label': 'Model Name',
      'prd_name_placeholder': 'Example: Summer Floral Blouse',

      'prd_code_label': 'Model Code',
      'prd_code_placeholder': 'Example: 1005',

      'prd_pieces_label': 'Pieces',
      'prd_pieces_placeholder': 'Quantity',

      'prd_price_label': 'Piece Price (EGP)',
      'prd_price_placeholder': 'Price',

      'prd_num_colors_label': 'Number of Available Colors',
      'prd_num_colors_placeholder':
        'Enter the number of colors to define their names',

      'prd_colors_hint': 'Enter color names:',
      'prd_color_placeholder': 'Color #',

      'prd_save_changes': 'Save Changes',
      'prd_add_model': 'Add Model',
      'prd_cancel': 'Cancel',
      'prd_close': 'Close',

      'prd_confirm_delete_title': 'Confirm Model Deletion',
      'prd_confirm_delete_text':
        'Are you sure you want to permanently delete this model? This action cannot be undone.',
      'prd_confirm_delete': 'Confirm Delete',

      // Errors / Validation

      'prd_error_load': 'Unable to load models',
      'prd_error_load_backend':
        'Unable to load models from the backend',

      'prd_error_image_invalid':
        'Please select a valid image file',

      'prd_error_image_size':
        'Image size must not exceed 5 MB',

      'prd_error_image_read':
        'Unable to read the image',

      'prd_error_name':
        'Please enter the model name',

      'prd_error_code_integer':
        'Model code must be a valid number',

      'prd_error_code_positive':
        'Model code must be greater than 0',

      'prd_error_pieces':
        'Number of pieces must be greater than 0',

      'prd_error_price':
        'Price must be 0 or greater',

      'prd_error_save_changes':
        'Unable to save changes',

      'prd_error_update':
        'An error occurred while updating the model',

      'prd_error_add':
        'Unable to add the model',

      'prd_error_add_generic':
        'An error occurred while adding the model',

      'prd_error_delete':
        'Unable to delete the model',

      'prd_error_delete_generic':
        'An error occurred while deleting the model',

      'prd_available': 'Available',

      // ============================================================
      // Returns Page
      // ============================================================

      'ret_title': 'Returns Record',
      'ret_total_returns': 'Total Return Vouchers',
      'ret_add': '+ Add New Return',
      'ret_loading_data': 'Loading data...',
      'ret_loading_returns': 'Loading returns...',

      'ret_search_placeholder':
        'Search by return number or customer name...',

      'ret_number': 'Return Number',
      'ret_customer': 'Customer',
      'ret_date': 'Return Date',
      'ret_pieces': 'Pieces',
      'ret_total_value': 'Total Value',
      'ret_actions': 'Actions',

      'ret_view_details': 'View Details',

      'ret_no_matching':
        'No return records match your search',

      'ret_create_title': 'Record New Return Voucher',
      'ret_return_number': 'Return Voucher Number',
      'ret_return_date': 'Return Date',
      'ret_customer_from': 'Customer Returning From',

      'ret_model_code': 'Model Code',
      'ret_model_name': 'Model Name',
      'ret_quantity': 'Quantity',
      'ret_unit_price': 'Piece Price',
      'ret_total': 'Total',

      'ret_select_model': 'Select model...',
      'ret_name': 'Name',
      'ret_available': 'Available',

      'ret_delete_model': 'Delete Model',
      'ret_add_model': '+ Add New Model',

      'ret_total_return_value': 'Total Return Value:',

      'ret_saving': 'Saving...',
      'ret_save': 'Record Return',
      'ret_cancel': 'Cancel',
      'ret_close': 'Close',

      'ret_details_title': 'Return Details:',
      'ret_customer_label': 'Customer:',
      'ret_latest_loading':
        'Loading latest return data...',
      'ret_total_return': 'Total Return:',

      'ret_piece': 'pieces',
      'ret_egp': 'EGP',

      // Fallbacks
      'ret_customer_name_fallback': 'Unnamed',
      'ret_model_fallback': 'Model',

      // Validation / Errors
      'ret_error_load': 'Unable to load returns',
      'ret_error_load_generic':
        'An error occurred while loading returns',

      'ret_error_no_customers':
        'No customers are available to record a return',

      'ret_error_no_products':
        'No models are available to record a return',

      'ret_validation_customer':
        'Please select a customer',

      'ret_validation_items':
        'Please select at least one model and enter a valid quantity',

      'ret_error_model_not_found':
        'Model not found',

      'ret_error_save':
        'Unable to record the return',

      'ret_error_save_generic':
        'An error occurred while recording the return',

      'ret_error_view':
        'Unable to load return details',
        
      'ret_error_customer_no_received':
  'Customer {name} has not received any pieces of model {code}, so a return cannot be recorded for it.',

      // ============================================================
      // Inventory Page
      // ============================================================
      'inventory_title': 'Inventory / General Stock',
      'inventory_registered_models': 'Total registered models:',
      'inventory_total_models': 'Total Models',
      'inventory_total_available': 'Total Available Pieces',
      'inventory_total_sold': 'Total Sold Pieces',
      'inventory_total_returned': 'Total Returned Pieces',
      'inventory_low_stock_stat': 'Low Stock (≤ 50)',
      'inventory_out_of_stock': 'Out of Stock',

      'inventory_search_placeholder': 'Search by model name or code...',
      'inventory_filter_all': 'All',
      'inventory_filter_in_stock': 'In Stock',
      'inventory_filter_low_stock': 'Low Stock',
      'inventory_filter_out_of_stock': 'Out of Stock',

      'inventory_col_image': 'Image',
      'inventory_col_model_name': 'Model Name',
      'inventory_col_code': 'Code',
      'inventory_col_total_added': 'Total Added',
      'inventory_col_sold': 'Sold',
      'inventory_col_returned': 'Returned',
      'inventory_col_current': 'Current Stock',
      'inventory_col_price': 'Unit Price',
      'inventory_col_status': 'Status',
      'inventory_col_history': 'Stock Movement',

      'inventory_loading': 'Loading inventory data...',
      'inventory_no_image': 'No Image',
      'inventory_no_name': 'No Name',
      'inventory_no_matching': 'No products match the current search or filter',

      'inventory_piece': 'pieces',
      'inventory_currency': 'EGP',

      'inventory_status_in_stock': 'In Stock',
      'inventory_status_low_stock': 'Low Stock',
      'inventory_status_out_of_stock': 'Out of Stock',

      'inventory_history_button': 'Inventory Movement History',
      'inventory_history_title': 'Inventory Movement History',
      'inventory_code_label': 'Code',
      'inventory_history_loading': 'Loading movement history...',
      'inventory_history_date': 'Date',
      'inventory_history_type': 'Movement Type',
      'inventory_history_reference': 'Reference Number',
      'inventory_history_quantity': 'Quantity',
      'inventory_history_before': 'Previous Stock',
      'inventory_history_after': 'Stock After Movement',

      'inventory_history_new_model': 'New Model',
      'inventory_history_restock': 'Restock',
      'inventory_history_invoice': 'Sales Invoice',
      'inventory_history_return': 'Return',

      'inventory_no_history': 'No movements recorded for this model',
      'inventory_close': 'Close',

      'inventory_error_load_products': 'An error occurred while loading products',
      'inventory_error_load_transactions': 'An error occurred while loading inventory movements',
      'inventory_error_load_history': 'Unable to load inventory movement history',

      'login_brand_subtitle': 'Factory Management System',

'login_title': 'Login',

'login_email': 'Email Address',
'login_email_placeholder': 'Enter your email address',
'login_email_required': 'Email address is required',

'login_password': 'Password',
'login_password_placeholder': 'Enter your password',
'login_password_required': 'Password is required',

'login_remember_me': 'Remember me',
'login_forgot_password': 'Forgot your password?',

'login_submit': 'Login →',
'login_loading': 'Signing in...',

'login_no_account': "Don't have an account?",
'login_create_account': 'Create a new account',

'login_footer':
  '© 2026 Al-Asala Clothing Factory — All Rights Reserved',

'login_switch_to_english':
  'Switch language to English',

'login_switch_to_arabic':
  'Switch language to Arabic',

'login_show_password':
  'Show password',

'login_hide_password':
  'Hide password',

'login_error_invalid_credentials':
  'The email or password is incorrect',

'login_error_server_connection':
  'Unable to connect to the server',

'login_error_route_not_found':
  'Login route was not found',

'login_error_server':
  'A server error occurred',

'login_error_generic':
  'An error occurred while signing in',

  'signup_brand_subtitle': 'Factory Management System',

'signup_title': 'Create a New User Account',

'signup_username': 'Username',
'signup_username_placeholder': 'Example: ahmed_ali',

'signup_email': 'Email Address',
'signup_email_placeholder': 'name@factory.com',

'signup_mobile': 'Phone Number',
'signup_mobile_placeholder': '010xxxxxxxx',

'signup_password': 'Password',
'signup_password_placeholder': 'Enter your password',

'signup_confirm_password': 'Confirm Password',
'signup_confirm_password_placeholder':
  'Re-enter your password',

'signup_loading': 'Creating account...',
'signup_submit': 'Create Account',

'signup_have_account': 'Already have an account?',
'signup_login': 'Login',

'signup_footer':
  '© 2026 Al-Asala Clothing Factory — All Rights Reserved',

'signup_switch_to_english':
  'Switch language to English',

'signup_switch_to_arabic':
  'Switch language to Arabic',

'signup_show_password':
  'Show password',

'signup_hide_password':
  'Hide password',

'signup_success':
  'Account created successfully',

'signup_error_required_fields':
  'Please fill in all required fields',

'signup_error_password_length':
  'Password must be at least 6 characters or numbers',

'signup_error_password_match':
  'Passwords do not match',

'signup_error_invalid_email':
  'Please enter a valid email address',

'signup_error_email_exists':
  'This email is already in use',

'signup_error_invalid_data':
  'Please make sure the entered data is correct',

'signup_error_server_connection':
  'Unable to connect to the server',

'signup_error_server':
  'A server error occurred',

'signup_error_generic':
  'An error occurred while creating the account',
          }
  };

  constructor() {
    const saved = (localStorage.getItem('app_lang') as Lang) || 'ar';
    this.setLanguage(saved);
  }

  get currentLang(): Lang {
    return this.currentLangSubject.value;
  }

  setLanguage(lang: Lang) {
    this.currentLangSubject.next(lang);
    localStorage.setItem('app_lang', lang);

    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }

  toggleLanguage() {
    const next = this.currentLang === 'ar' ? 'en' : 'ar';
    this.setLanguage(next);
  }

  translate(key: string): string {
    return this.translations[this.currentLang]?.[key] || key;
  }
}