# admin.py
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import User, Doctor, Patient, DoctorAvailability, Appointment


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = (
        "username",
        "email",
        "first_name",
        "last_name",
        "user_type",
        "is_active",
        "date_joined",
    )
    list_filter = ("user_type", "is_active", "is_staff", "date_joined")
    search_fields = ("username", "email", "first_name", "last_name", "phone_number")
    ordering = ("-date_joined",)

    fieldsets = BaseUserAdmin.fieldsets + (
        (
            "Additional Info",
            {
                "fields": ("user_type", "phone_number", "date_of_birth"),
            },
        ),
    )

    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        (
            "Additional Info",
            {
                "fields": (
                    "user_type",
                    "phone_number",
                    "date_of_birth",
                    "email",
                    "first_name",
                    "last_name",
                ),
            },
        ),
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related()


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = (
        "get_full_name",
        "specialization",
        "years_of_experience",
        "consultation_fee",
        "is_accepting_patients",
        "get_user_email",
        "created_at",
    )
    list_filter = (
        "specialization",
        "is_accepting_patients",
        "years_of_experience",
        "created_at",
    )
    search_fields = (
        "user__first_name",
        "user__last_name",
        "user__email",
        "specialization",
        "license_number",
    )
    readonly_fields = ("id", "created_at", "updated_at")
    ordering = ("-created_at",)

    fieldsets = (
        (
            "Doctor Information",
            {
                "fields": (
                    "user",
                    "specialization",
                    "license_number",
                    "years_of_experience",
                )
            },
        ),
        (
            "Professional Details",
            {"fields": ("consultation_fee", "bio", "is_accepting_patients")},
        ),
        (
            "Timestamps",
            {"fields": ("id", "created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def get_full_name(self, obj):
        return f"Dr. {obj.user.first_name} {obj.user.last_name}"

    get_full_name.short_description = "Full Name"
    get_full_name.admin_order_field = "user__first_name"

    def get_user_email(self, obj):
        return obj.user.email

    get_user_email.short_description = "Email"
    get_user_email.admin_order_field = "user__email"

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("user")


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = (
        "get_full_name",
        "get_user_email",
        "get_phone_number",
        "emergency_contact_name",
        "created_at",
    )
    list_filter = ("created_at", "user__date_of_birth")
    search_fields = (
        "user__first_name",
        "user__last_name",
        "user__email",
        "emergency_contact_name",
        "user__phone_number",
    )
    readonly_fields = ("id", "created_at", "updated_at")
    ordering = ("-created_at",)

    fieldsets = (
        ("Patient Information", {"fields": ("user",)}),
        (
            "Emergency Contact",
            {"fields": ("emergency_contact_name", "emergency_contact_phone")},
        ),
        ("Medical Information", {"fields": ("medical_history",), "classes": ("wide",)}),
        (
            "Timestamps",
            {"fields": ("id", "created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def get_full_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"

    get_full_name.short_description = "Full Name"
    get_full_name.admin_order_field = "user__first_name"

    def get_user_email(self, obj):
        return obj.user.email

    get_user_email.short_description = "Email"
    get_user_email.admin_order_field = "user__email"

    def get_phone_number(self, obj):
        return obj.user.phone_number

    get_phone_number.short_description = "Phone"
    get_phone_number.admin_order_field = "user__phone_number"

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("user")


@admin.register(DoctorAvailability)
class DoctorAvailabilityAdmin(admin.ModelAdmin):
    list_display = (
        "get_doctor_name",
        "date",
        "start_time",
        "end_time",
        "is_available",
        "created_at",
    )
    list_filter = ("is_available", "date", "doctor__specialization", "created_at")
    search_fields = ("doctor__user__first_name", "doctor__user__last_name", "date")
    readonly_fields = ("id", "created_at")
    ordering = ("-date", "start_time")
    date_hierarchy = "date"

    fieldsets = (
        (
            "Availability Details",
            {"fields": ("doctor", "date", "start_time", "end_time", "is_available")},
        ),
        ("Timestamps", {"fields": ("id", "created_at"), "classes": ("collapse",)}),
    )

    def get_doctor_name(self, obj):
        return f"Dr. {obj.doctor.user.first_name} {obj.doctor.user.last_name}"

    get_doctor_name.short_description = "Doctor"
    get_doctor_name.admin_order_field = "doctor__user__first_name"

    def get_queryset(self, request):
        return super().get_queryset(request).select_related("doctor__user")


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = (
        "get_patient_name",
        "get_doctor_name",
        "appointment_date",
        "appointment_time",
        "status_badge",
        "created_at",
    )
    list_filter = ("status", "appointment_date", "doctor__specialization", "created_at")
    search_fields = (
        "patient__user__first_name",
        "patient__user__last_name",
        "doctor__user__first_name",
        "doctor__user__last_name",
        "reason_for_visit",
    )
    readonly_fields = ("id", "created_at", "updated_at")
    ordering = ("-appointment_date", "-appointment_time")
    date_hierarchy = "appointment_date"

    fieldsets = (
        (
            "Appointment Details",
            {
                "fields": (
                    "patient",
                    "doctor",
                    "appointment_date",
                    "appointment_time",
                    "status",
                )
            },
        ),
        (
            "Visit Information",
            {"fields": ("reason_for_visit", "notes"), "classes": ("wide",)},
        ),
        (
            "Cancellation",
            {"fields": ("cancellation_reason",), "classes": ("collapse",)},
        ),
        (
            "Timestamps",
            {"fields": ("id", "created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )

    def get_patient_name(self, obj):
        return f"{obj.patient.user.first_name} {obj.patient.user.last_name}"

    get_patient_name.short_description = "Patient"
    get_patient_name.admin_order_field = "patient__user__first_name"

    def get_doctor_name(self, obj):
        return f"Dr. {obj.doctor.user.first_name} {obj.doctor.user.last_name}"

    get_doctor_name.short_description = "Doctor"
    get_doctor_name.admin_order_field = "doctor__user__first_name"

    def status_badge(self, obj):
        colors = {
            "pending": "#ffc107",
            "confirmed": "#17a2b8",
            "completed": "#28a745",
            "cancelled": "#dc3545",
        }
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 3px; font-size: 11px;">{}</span>',
            colors.get(obj.status, "#6c757d"),
            obj.get_status_display(),
        )

    status_badge.short_description = "Status"
    status_badge.admin_order_field = "status"

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .select_related("patient__user", "doctor__user")
        )

    actions = ["mark_as_confirmed", "mark_as_completed", "mark_as_cancelled"]

    def mark_as_confirmed(self, request, queryset):
        updated = queryset.update(status="confirmed")
        self.message_user(request, f"{updated} appointments marked as confirmed.")

    mark_as_confirmed.short_description = "Mark selected appointments as confirmed"

    def mark_as_completed(self, request, queryset):
        updated = queryset.update(status="completed")
        self.message_user(request, f"{updated} appointments marked as completed.")

    mark_as_completed.short_description = "Mark selected appointments as completed"

    def mark_as_cancelled(self, request, queryset):
        updated = queryset.update(status="cancelled")
        self.message_user(request, f"{updated} appointments marked as cancelled.")

    mark_as_cancelled.short_description = "Mark selected appointments as cancelled"


# Customize admin site headers
admin.site.site_header = "Emerge Healthcare Admin"
admin.site.site_title = "Emerge Admin Portal"
admin.site.index_title = "Welcome to Emerge Healthcare Administration"
