# urls.py
from django.urls import path
from . import views

urlpatterns = [
    # Authentication
    path("auth/register/", views.register_user, name="register"),
    path("auth/login/", views.login_user, name="login"),
    # Doctors
    path("doctors/", views.DoctorListView.as_view(), name="doctor-list"),
    path(
        "doctors/<uuid:doctor_id>/availability/",
        views.DoctorAvailabilityView.as_view(),
        name="doctor-availability",
    ),
    path(
        "doctors/appointments/",
        views.DoctorAppointmentsView.as_view(),
        name="doctor-appointments",
    ),
    path(
        "doctors/patients/",
        views.DoctorPastPatientsView.as_view(),
        name="doctor-patients",
    ),
    # Doctor Availability Management
    path("availability/create/", views.create_availability, name="create-availability"),
    path(
        "availability/", views.doctor_own_availability, name="doctor-own-availability"
    ),
    path(
        "availability/<uuid:availability_id>/update/",
        views.update_availability,
        name="update-availability",
    ),
    path(
        "availability/<uuid:availability_id>/delete/",
        views.delete_availability,
        name="delete-availability",
    ),
    # Appointments
    path("appointments/create/", views.create_appointment, name="create-appointment"),
    path(
        "appointments/<uuid:appointment_id>/cancel/",
        views.cancel_appointment,
        name="cancel-appointment",
    ),
    path(
        "appointments/<uuid:appointment_id>/confirm/",
        views.confirm_appointment,
        name="confirm-appointment",
    ),
    path(
        "appointments/<uuid:appointment_id>/complete/",
        views.complete_appointment,
        name="complete-appointment",
    ),
    path(
        "appointments/",
        views.PatientAppointmentsView.as_view(),
        name="patient-appointments",
    ),
]
