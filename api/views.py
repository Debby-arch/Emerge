# views.py
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import get_object_or_404
from datetime import date
from .models import User, Doctor, Patient, DoctorAvailability, Appointment
from .serializers import (
    UserRegistrationSerializer,
    UserLoginSerializer,
    DoctorSerializer,
    DoctorAvailabilitySerializer,
    AppointmentSerializer,
    AppointmentCreateSerializer,
    PatientSerializer,
)


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        "refresh": str(refresh),
        "access": str(refresh.access_token),
    }


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def register_user(request):
    """Register a new user (patient or doctor)"""
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        tokens = get_tokens_for_user(user)
        return Response(
            {
                "message": "User registered successfully",
                "user_id": user.id,
                "user_type": user.user_type,
                "tokens": tokens,
            },
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def login_user(request):
    """Login user and return JWT tokens"""
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data["user"]
        tokens = get_tokens_for_user(user)
        return Response(
            {
                "message": "Login successful",
                "user_id": user.id,
                "user_type": user.user_type,
                "tokens": tokens,
            },
            status=status.HTTP_200_OK,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DoctorListView(generics.ListAPIView):
    """View all doctors"""

    queryset = Doctor.objects.filter(is_accepting_patients=True)
    serializer_class = DoctorSerializer
    permission_classes = [permissions.IsAuthenticated]


class DoctorAvailabilityView(generics.ListAPIView):
    """View doctor's available dates - accessible by both patients and doctors"""

    serializer_class = DoctorAvailabilitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        doctor_id = self.kwargs["doctor_id"]
        return DoctorAvailability.objects.filter(
            doctor_id=doctor_id, is_available=True, date__gte=date.today()
        ).order_by("date", "start_time")


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def create_availability(request):
    """Doctor creates their availability slots"""
    if request.user.user_type != "doctor":
        return Response(
            {"error": "Only doctors can set availability"},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        doctor = Doctor.objects.get(user=request.user)
    except Doctor.DoesNotExist:
        return Response(
            {"error": "Doctor profile not found"}, status=status.HTTP_404_NOT_FOUND
        )

    # Handle both single availability and bulk creation
    data = request.data
    if isinstance(data, list):
        # Bulk creation
        created_slots = []
        errors = []

        for slot_data in data:
            slot_data["doctor"] = doctor.id
            serializer = DoctorAvailabilitySerializer(data=slot_data)
            if serializer.is_valid():
                try:
                    availability = serializer.save(doctor=doctor)
                    created_slots.append(
                        {
                            "id": availability.id,
                            "date": availability.date,
                            "start_time": availability.start_time,
                            "end_time": availability.end_time,
                        }
                    )
                except Exception as e:
                    errors.append(
                        f"Error creating slot for {slot_data.get('date', 'unknown date')}: {str(e)}"
                    )
            else:
                errors.append(
                    f"Invalid data for {slot_data.get('date', 'unknown date')}: {serializer.errors}"
                )

        response_data = {"created_slots": created_slots}
        if errors:
            response_data["errors"] = errors

        return Response(response_data, status=status.HTTP_201_CREATED)

    else:
        # Single availability creation
        serializer = DoctorAvailabilitySerializer(data=data)
        if serializer.is_valid():
            try:
                availability = serializer.save(doctor=doctor)
                return Response(
                    {
                        "message": "Availability slot created successfully",
                        "availability": {
                            "id": availability.id,
                            "date": availability.date,
                            "start_time": availability.start_time,
                            "end_time": availability.end_time,
                            "is_available": availability.is_available,
                        },
                    },
                    status=status.HTTP_201_CREATED,
                )
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def doctor_own_availability(request):
    """Doctor views their own availability slots (including unavailable ones)"""
    if request.user.user_type != "doctor":
        return Response(
            {"error": "Only doctors can view their own complete availability"},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        doctor = Doctor.objects.get(user=request.user)
        availabilities = DoctorAvailability.objects.filter(
            doctor=doctor, date__gte=date.today()
        ).order_by("date", "start_time")

        serializer = DoctorAvailabilitySerializer(availabilities, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Doctor.DoesNotExist:
        return Response(
            {"error": "Doctor profile not found"}, status=status.HTTP_404_NOT_FOUND
        )


@api_view(["PUT"])
@permission_classes([permissions.IsAuthenticated])
def update_availability(request, availability_id):
    """Doctor updates their availability slot"""
    if request.user.user_type != "doctor":
        return Response(
            {"error": "Only doctors can update availability"},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        doctor = Doctor.objects.get(user=request.user)
        availability = get_object_or_404(
            DoctorAvailability, id=availability_id, doctor=doctor
        )

        serializer = DoctorAvailabilitySerializer(
            availability, data=request.data, partial=True
        )
        if serializer.is_valid():
            updated_availability = serializer.save()
            return Response(
                {
                    "message": "Availability updated successfully",
                    "availability": {
                        "id": updated_availability.id,
                        "date": updated_availability.date,
                        "start_time": updated_availability.start_time,
                        "end_time": updated_availability.end_time,
                        "is_available": updated_availability.is_available,
                    },
                },
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Doctor.DoesNotExist:
        return Response(
            {"error": "Doctor profile not found"}, status=status.HTTP_404_NOT_FOUND
        )


@api_view(["DELETE"])
@permission_classes([permissions.IsAuthenticated])
def delete_availability(request, availability_id):
    """Doctor deletes their availability slot"""
    if request.user.user_type != "doctor":
        return Response(
            {"error": "Only doctors can delete availability"},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        doctor = Doctor.objects.get(user=request.user)
        availability = get_object_or_404(
            DoctorAvailability, id=availability_id, doctor=doctor
        )

        # Check if there are any appointments booked for this slot
        existing_appointments = Appointment.objects.filter(
            doctor=doctor,
            appointment_date=availability.date,
            appointment_time__gte=availability.start_time,
            appointment_time__lt=availability.end_time,
            status__in=["pending", "confirmed"],
        )

        if existing_appointments.exists():
            return Response(
                {"error": "Cannot delete availability slot with existing appointments"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        availability.delete()
        return Response(
            {"message": "Availability slot deleted successfully"},
            status=status.HTTP_200_OK,
        )
    except Doctor.DoesNotExist:
        return Response(
            {"error": "Doctor profile not found"}, status=status.HTTP_404_NOT_FOUND
        )


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def create_appointment(request):
    """Patient creates an appointment"""
    if request.user.user_type != "patient":
        return Response(
            {"error": "Only patients can create appointments"},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        patient = Patient.objects.get(user=request.user)
    except Patient.DoesNotExist:
        return Response(
            {"error": "Patient profile not found"}, status=status.HTTP_404_NOT_FOUND
        )

    serializer = AppointmentCreateSerializer(data=request.data)
    if serializer.is_valid():
        appointment = serializer.save(patient=patient)
        return Response(
            {
                "message": "Appointment created successfully",
                "appointment_id": appointment.id,
            },
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def cancel_appointment(request, appointment_id):
    """Patient or doctor cancels an appointment"""
    appointment = get_object_or_404(Appointment, id=appointment_id)

    # Check if user has permission to cancel
    if request.user.user_type == "patient":
        if appointment.patient.user != request.user:
            return Response(
                {"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN
            )
    elif request.user.user_type == "doctor":
        if appointment.doctor.user != request.user:
            return Response(
                {"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN
            )
    else:
        return Response(
            {"error": "Invalid user type"}, status=status.HTTP_403_FORBIDDEN
        )

    if appointment.status in ["completed", "cancelled"]:
        return Response(
            {"error": "Cannot cancel this appointment"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    appointment.status = "cancelled"
    appointment.cancellation_reason = request.data.get("reason", "")
    appointment.save()

    return Response(
        {"message": "Appointment cancelled successfully"}, status=status.HTTP_200_OK
    )


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def confirm_appointment(request, appointment_id):
    """Doctor confirms an appointment"""
    if request.user.user_type != "doctor":
        return Response(
            {"error": "Only doctors can confirm appointments"},
            status=status.HTTP_403_FORBIDDEN,
        )

    appointment = get_object_or_404(Appointment, id=appointment_id)

    if appointment.doctor.user != request.user:
        return Response(
            {"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN
        )

    if appointment.status != "pending":
        return Response(
            {"error": "Appointment is not pending"}, status=status.HTTP_400_BAD_REQUEST
        )

    appointment.status = "confirmed"
    appointment.save()

    return Response(
        {"message": "Appointment confirmed successfully"}, status=status.HTTP_200_OK
    )


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def complete_appointment(request, appointment_id):
    """Doctor marks appointment as complete"""
    if request.user.user_type != "doctor":
        return Response(
            {"error": "Only doctors can complete appointments"},
            status=status.HTTP_403_FORBIDDEN,
        )

    appointment = get_object_or_404(Appointment, id=appointment_id)

    if appointment.doctor.user != request.user:
        return Response(
            {"error": "Permission denied"}, status=status.HTTP_403_FORBIDDEN
        )

    if appointment.status != "confirmed":
        return Response(
            {"error": "Appointment must be confirmed first"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    appointment.status = "completed"
    appointment.notes = request.data.get("notes", "")
    appointment.save()

    return Response(
        {"message": "Appointment marked as complete"}, status=status.HTTP_200_OK
    )


class DoctorAppointmentsView(generics.ListAPIView):
    """Doctor views all their appointments"""

    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.user_type != "doctor":
            return Appointment.objects.none()

        try:
            doctor = Doctor.objects.get(user=self.request.user)
            return Appointment.objects.filter(doctor=doctor)
        except Doctor.DoesNotExist:
            return Appointment.objects.none()


class DoctorPastPatientsView(generics.ListAPIView):
    """Doctor views all their past patients"""

    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.user_type != "doctor":
            return Patient.objects.none()

        try:
            doctor = Doctor.objects.get(user=self.request.user)
            # Get unique patients who have had completed appointments
            patient_ids = (
                Appointment.objects.filter(doctor=doctor, status="completed")
                .values_list("patient_id", flat=True)
                .distinct()
            )

            return Patient.objects.filter(id__in=patient_ids)
        except Doctor.DoesNotExist:
            return Patient.objects.none()


class PatientAppointmentsView(generics.ListAPIView):
    """Patient views all their appointments"""

    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request.user.user_type != "patient":
            return Appointment.objects.none()

        try:
            patient = Patient.objects.get(user=self.request.user)
            return Appointment.objects.filter(patient=patient)
        except Patient.DoesNotExist:
            return Appointment.objects.none()
