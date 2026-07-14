from decimal import Decimal
import logging

from django.shortcuts import get_object_or_404, render

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db import models
from django.db.models import F, Count, Q, Exists, OuterRef, Subquery, Sum, Value
from datetime import date, datetime, timedelta
from django.db import transaction
from django.utils import timezone
from django.db.models import Max
from django.core.files.base import ContentFile
from PIL import Image, ImageDraw, ImageFont, ImageOps
import io
import os
from django.conf import settings
from django.core.mail import EmailMessage


from accounts.models import Role, User
from accounts.utils import generate_password, send_credentials_email
from lead_registration.serializers import PaymentDetailSerializer, UserDetailSerializer, UserProgramPackageDetailSerializer
from report.models import Report
from counselling_slot.serializers import CounsellorStudentBookingSerializer
from event.tasks import send_event_reminder_by_id
from event.utils import generate_handholding_reminder, get_font_path
from counselling_slot.models import Booking, BookingCounsellor, Counsellor, Slot
from event.serializers import AdvertisementSerializer, CertificateSerializer, CertificateTemplateSerializer, HandHoldingParticipantSerializer, HandHoldingParticipantSessionSerializer, HandHoldingSessionSerializer
from program_package.models import Package, Program, UserProgramPackage
from event.models import Advertisement, Certificate, CertificateTemplate, Event, HandHoldingParticipant, HandHoldingParticipantSession, HandHoldingSession
from payment.models import Payment
from lead_registration.models import Lead, StudentProfile
from rest_framework.parsers import MultiPartParser, FormParser

logger = logging.getLogger(__name__)

# ===================== HandHolding Registration API =====================


# class HandHoldingRegisterAPIView(APIView):

#     def post(self, request):
#         data = request.data

#         # =========================
#         # ✅ Get Hand Holding Program
#         # =========================
#         try:
#             program = Program.objects.get(name__iexact="Hand Holding Program")
#         except Program.DoesNotExist:
#             return Response(
#                 {"error": "Hand Holding program not found"},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         # =========================
#         # ✅ Get Role (HANDHOLDING)
#         # =========================
#         try:
#             role = Role.objects.get(name__iexact="handholding")
#         except Role.DoesNotExist:
#             return Response(
#                 {"error": "Handholding role not found"},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         # =========================
#         # ✅ CREATE USER
#         # =========================
#         user = User.objects.create(
#             first_name=data.get("first_name"),
#             last_name=data.get("last_name"),
#             email=data.get("email"),
#             phone=data.get("mobile"),
#             role=role
#         )

#         # Optional: set password
#         if data.get("password"):
#             user.set_password(data.get("password"))
#             user.save()

#         # =========================
#         # ✅ Create Lead
#         # =========================
#         lead = Lead.objects.create(
#             first_name=data.get("first_name"),
#             last_name=data.get("last_name"),
#             email=data.get("email"),
#             phone=data.get("mobile"),
#             date =timezone.now().date(),
#             source="website",
#             status="enquiry",
#             program=program
#         )

#         # =========================
#         # ✅ Create Payment
#         # =========================
#         payment = None
#         if request.FILES.get("payment"):
#             payment = Payment.objects.create(
#                 proof_file=request.FILES.get("payment"),
#                 user=user   # ✅ IMPORTANT (link user)
#             )

#         # =========================
#         # ✅ Create Participant
#         # =========================
#         participant = HandHoldingParticipant.objects.create(
#             user=user,  # ✅ LINK USER HERE
#             payment=payment,
#             email=data.get("email"),
#             mobile=data.get("mobile"),
#             full_address=data.get("full_address"),
#             city=data.get("city"),
#             preferred_counselling_mode=data.get("preferred_counselling_mode"),
#             photo=request.FILES.get("photo"),
#             resume_file=request.FILES.get("resume"),
#         )

#         return Response({
#             "message": "Registration successful",
#             "lead_id": lead.id,
#             "user_id": user.id,
#             "participant_id": participant.id
#         }, status=status.HTTP_201_CREATED)


class HandHoldingRegisterAPIView(APIView):

    @transaction.atomic
    def post(self, request):
        try:
            data = request.data

            # =========================
            # ✅ Get Hand Holding Program
            # =========================
            try:
                program = Program.objects.get(
                    name__icontains="hand holding"
                )
            except Program.DoesNotExist:
                return Response(
                    {"error": "Hand Holding program not found"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # =========================
            # ✅ Get Role
            # =========================
            try:
                role = Role.objects.get(
                    name__iexact="handholding"
                )
            except Role.DoesNotExist:
                return Response(
                    {"error": "Handholding role not found"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # =========================
            # ✅ VALIDATE REQUIRED FIELDS
            # =========================
            required_fields = [
                "first_name",
                "email",
                "mobile"
            ]

            for field in required_fields:
                if not data.get(field):
                    return Response(
                        {"error": f"{field} is required"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # =========================
            # ✅ PASSWORD VALIDATION
            # =========================
            password = data.get("password")
            confirm_password = data.get("confirm_password")
            
            print("================================")
            print("REGISTER DEBUG")
            print("Password Received:", repr(password))
            print("Confirm Password:", repr(confirm_password))
            print("================================")

            if password or confirm_password:
                if password != confirm_password:
                    return Response(
                        {"error": "Passwords do not match"},
                        status=status.HTTP_400_BAD_REQUEST
                    )

            # =========================
            # ✅ CHECK EXISTING USER
            # =========================
            user, created = User.objects.get_or_create(
                email=data.get("email"),
                defaults={
                    "first_name": data.get("first_name"),
                    "last_name": data.get("last_name", ""),
                    "phone": data.get("mobile"),
                    "role": role,
                    "is_active": True
                }
            )
            print("User Created =", created)
            print("User ID =", user.id)

            if created:
                user_password = password 
                print("Password Before Hash:", repr(user_password))
                user.set_password(user_password)
                user.save()
                user.refresh_from_db()
                print(
                    "Password Check After Save:",
                    user.check_password(user_password)
                )   
            else:
                user.first_name = data.get("first_name")
                user.last_name = data.get("last_name", "")
                user.phone = data.get("mobile")
                user.role = role
                
                if password:
                    user.set_password(password)
                    print("Password set for existing user")
                user.save()

            # =========================
            # ✅ CREATE LEAD
            # =========================
            lead = Lead.objects.create(
                first_name=data.get("first_name"),
                last_name=data.get("last_name", ""),
                email=data.get("email"),
                phone=data.get("mobile"),
                date=timezone.now().date(),
                source="website",
                status="enquiry",
                # program=program,

                # OPTIONAL FIELDS FOR HAND HOLDING
                study_class=None,
                specialization=None
            )
            lead.program.add(program)

            # =========================
            # ✅ ASSIGN PROGRAM
            # =========================
            UserProgramPackage.objects.get_or_create(
                user=user,
                program=program,
                defaults={
                    "assigned_by": "system"
                }
            )

            # =========================
            # ✅ CREATE PAYMENT
            # =========================
            # payment = None

            # if request.FILES.get("payment"):
            #     payment = Payment.objects.create(
            #         user=user,
            #         proof_file=request.FILES.get("payment"),
            #         payment_type=data.get("payment_type"),
            #         method=data.get("payment_method"),
            #         transaction_id=data.get("transaction_id"),
            #         amount=data.get("amount") or 0,
            #         status="verification_pending",
            #         payment_date=timezone.now().date()
            #     )

            # # =========================
            # # ✅ CREATE / UPDATE PARTICIPANT
            # # =========================
            # participant, _ = HandHoldingParticipant.objects.update_or_create(
            #     user=user,
            #     defaults={
            #         "payment": payment,
            #         "email": data.get("email"),
            #         "mobile": data.get("mobile"),
            #         "full_address": data.get("full_address"),
            #         "city": data.get("city"),
            #         "preferred_counselling_mode": data.get(
            #             "preferred_counselling_mode"
            #         ),
            #         "photo": request.FILES.get("photo"),
            #         "resume_file": request.FILES.get("resume"),
            #     }
            # )

            # =========================
            # ✅ SUCCESS RESPONSE
            # =========================
            return Response({
                "message": "Hand Holding registration successful",
                "lead_id": lead.id,
                "user_id": user.id,
                # "participant_id": participant.id,
                "program_id": program.id,
                "program_name": program.name,
                # "payment_id": payment.id if payment else None
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            import traceback
            print(traceback.format_exc())

            return Response({
                "message": "Registration failed",
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR) 
            


class AddHandHoldingRegisterAPIView(APIView):
    parser_classes = [MultiPartParser, FormParser]

    @transaction.atomic
    def post(self, request):

        try:
            email = request.data.get("email")

            if not email:
                return Response(
                    {"message": "Email is required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # =================================
            # CHECK EXISTING USER
            # =================================
            if User.objects.filter(email=email).exists():
                return Response(
                    {"message": "User already exists with this email"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # =================================
            # ROLE
            # =================================
            role = Role.objects.get(name="handholding")

            # =================================
            # GENERATE PASSWORD
            # =================================
            password = generate_password()

            # =================================
            # PROGRAM
            # =================================
            program = Program.objects.filter(
                name__iexact="Hand Holding Program"
            ).first()

            if not program:
                return Response(
                    {"message": "Hand Holding program not found"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # =================================
            # PACKAGE
            # =================================
            package_id = request.data.get("package")

            package = get_object_or_404(
                Package,
                id=package_id,
                program=program
            )

            # =================================
            # CREATE USER
            # =================================
            user = User.objects.create(
                first_name=request.data.get("first_name"),
                last_name=request.data.get("last_name"),
                email=email,
                phone=request.data.get("phone"),
                role=role,
                is_active=True,
                is_converted_lead=True
            )

            user.set_password(password)
            user.save()

            # =================================
            # HANDHOLDING PARTICIPANT
            # =================================
            participant = HandHoldingParticipant.objects.create(
                user=user,
                email=email,
                mobile=request.data.get("phone"),
                full_address=request.data.get("full_address"),
                city=request.data.get("city"),
                preferred_counselling_mode=request.data.get(
                    "preferred_counselling_mode"
                ),
                resume_file=request.FILES.get("resume_file"),
                photo=request.FILES.get("photo"),
                show_profile=request.data.get(
                    "show_profile",
                    False
                )
            )

            # =================================
            # USER PROGRAM PACKAGE
            # =================================
            upp = UserProgramPackage.objects.create(
                user=user,
                program=program,
                package=package,
                assigned_by="handholding-registration"
            )

            # =================================
            # HANDHOLDING SESSIONS
            # =================================
            sessions = HandHoldingSession.objects.all().order_by(
                "ordering"
            )

            session_objects = []

            for i, session in enumerate(sessions, start=1):

                session_objects.append(
                    HandHoldingParticipantSession(
                        handholding_participant=participant,
                        handholding_session=session,
                        session_no=i,
                        session_date=timezone.now(),
                        status="not_booked",
                        notes="",
                        conducted_by=(
                            request.user
                            if request.user.is_authenticated
                            else None
                        )
                    )
                )

            HandHoldingParticipantSession.objects.bulk_create(
                session_objects
            )

            # =================================
            # CERTIFICATE
            # =================================
            Certificate.objects.get_or_create(
                user=user,
                program_type="handholding",
                defaults={
                    "certificate_status": "pending"
                }
            )

            # # =================================
            # # PAYMENT
            # # =================================
            # amount = Decimal(
            #     request.data.get(
            #         "amount",
            #         package.price
            #     )
            # )

            # if amount == 0:
            #     payment_status = "not_paid"
            # elif amount < package.price:
            #     payment_status = "partial_paid"
            # else:
            #     payment_status = "fully_paid"

            # payment = Payment.objects.create(
            #     user=user,
            #     amount=amount,
            #     payment_type=request.data.get(
            #         "payment_type"
            #     ),
            #     method=request.data.get("method"),
            #     transaction_id=request.data.get(
            #         "transaction_id"
            #     ),
            #     proof_file=request.FILES.get(
            #         "proof_file"
            #     ),
            #     status=payment_status
            # )

            # payment.package.set([package])
            
            # =================================
            # PAYMENT (OPTIONAL)
            # =================================

            amount = request.data.get("amount")

            if amount:
                amount = Decimal(str(amount))
            else:
                amount = Decimal("0")

            if amount == 0:
                payment_status = "not_paid"
            elif amount < package.price:
                payment_status = "partial_paid"
            else:
                payment_status = "fully_paid"

            payment = Payment.objects.create(
                user=user,
                amount=amount,
                payment_type=request.data.get("payment_type") or None,
                method=request.data.get("method") or None,
                transaction_id=request.data.get("transaction_id") or None,
                proof_file=request.FILES.get("proof_file"),
                status=payment_status
            )

            payment.package.set([package])

            # =================================
            # SEND EMAIL
            # =================================
            try:
                send_credentials_email(
                    email=user.email,
                    password=password,
                    program_name=program.name,
                    package_name=package.name,
                    preferred_counselling_mode=request.data.get(
                        "preferred_counselling_mode",
                        "online"
                    )
                )

            except Exception as email_error:
                logger.error(
                    f"Email sending failed: {str(email_error)}"
                )

            # =================================
            # RESPONSE
            # =================================
            return Response(
                {
                    "message": "HandHolding participant created successfully",
                    "data": {
                        "user": UserDetailSerializer(user).data,
                        "participant_id": participant.id,
                        "program_package": UserProgramPackageDetailSerializer(
                            upp
                        ).data,
                        "payment": (
                            PaymentDetailSerializer(
                                payment,
                                context={
                                    "request": request
                                }
                            ).data
                            if payment else None
                        ),
                        "generated_password": password
                    }
                },
                status=status.HTTP_201_CREATED
            )

        except Role.DoesNotExist:
            return Response(
                {
                    "message": "Handholding role not found"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        except Exception as e:
            return Response(
                {
                    "message": "Registration failed",
                    "error": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    def put(self, request, user_id):

        try:

            # =================================
            # GET USER
            # =================================
            user = get_object_or_404(
                User.objects.select_related("role"),
                id=user_id,
                role__name="handholding"
            )

            participant = HandHoldingParticipant.objects.filter(
                user=user
            ).first()

            # =================================
            # UPDATE USER
            # =================================
            user.first_name = request.data.get(
                "first_name",
                user.first_name
            )

            user.last_name = request.data.get(
                "last_name",
                user.last_name
            )

            user.phone = request.data.get(
                "phone",
                user.phone
            )

            user.save()

            # =================================
            # UPDATE PARTICIPANT
            # =================================
            if participant:

                participant.mobile = request.data.get(
                    "phone",
                    participant.mobile
                )

                participant.full_address = request.data.get(
                    "full_address",
                    participant.full_address
                )

                participant.city = request.data.get(
                    "city",
                    participant.city
                )

                participant.preferred_counselling_mode = request.data.get(
                    "preferred_counselling_mode",
                    participant.preferred_counselling_mode
                )

                show_profile = request.data.get("show_profile")

                if show_profile is not None:
                    participant.show_profile = show_profile

                if request.FILES.get("resume_file"):
                    participant.resume_file = request.FILES.get(
                        "resume_file"
                    )

                if request.FILES.get("photo"):
                    participant.photo = request.FILES.get(
                        "photo"
                    )

                participant.save()

            # =================================
            # UPDATE PACKAGE (OPTIONAL)
            # =================================
            package_id = request.data.get("package")

            if package_id:

                package = get_object_or_404(
                    Package,
                    id=package_id
                )

                upp = UserProgramPackage.objects.filter(
                    user=user
                ).first()

                if upp:
                    upp.package = package
                    upp.save()

            return Response(
                {
                    "message": "HandHolding participant updated successfully",
                    "user": UserDetailSerializer(user).data,
                    "participant_id": (
                        participant.id if participant else None
                    )
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {
                    "message": "Update failed",
                    "error": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    def delete(self, request, user_id):

        try:

            # =================================
            # GET USER
            # =================================
            user = get_object_or_404(
                User.objects.select_related("role"),
                id=user_id,
                role__name="handholding"
            )

            participant = HandHoldingParticipant.objects.filter(
                user=user
            ).first()

            # =================================
            # DELETE PARTICIPANT SESSIONS
            # =================================
            if participant:
                HandHoldingParticipantSession.objects.filter(
                    handholding_participant=participant
                ).delete()

            # =================================
            # DELETE PARTICIPANT
            # =================================
            HandHoldingParticipant.objects.filter(
                user=user
            ).delete()

            # =================================
            # DELETE USER PROGRAM PACKAGE
            # =================================
            UserProgramPackage.objects.filter(
                user=user
            ).delete()

            # =================================
            # DELETE CERTIFICATE
            # =================================
            Certificate.objects.filter(
                user=user,
                program_type="handholding"
            ).delete()

            # =================================
            # DELETE PAYMENTS
            # =================================
            Payment.objects.filter(
                user=user
            ).delete()

            # =================================
            # DELETE USER
            # =================================
            user.delete()

            return Response(
                {
                    "message": "HandHolding participant deleted successfully"
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {
                    "message": "Delete failed",
                    "error": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        
class CreateHandHoldingSessionAPIView(APIView):
    permission_classes = [AllowAny]  # Allow any user (can be restricted to admin later)
    
    def get(self, request):
        sessions = HandHoldingSession.objects.all().order_by("ordering")

        serializer = HandHoldingSessionSerializer(sessions, many=True)

        return Response({
            "message": "Sessions fetched successfully",
            "count": len(serializer.data),
            "data": serializer.data
        }, status=status.HTTP_200_OK)

    def post(self, request):
        last_order = HandHoldingSession.objects.aggregate(
            max_order=models.Max("ordering")
        )["max_order"] or 0

        data = request.data.copy()
        data["ordering"] = last_order + 1

        serializer = HandHoldingSessionSerializer(data=data)

        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Session created successfully",
                "data": serializer.data
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def put(self, request, session_id):
        session = get_object_or_404(HandHoldingSession, id=session_id)

        serializer = HandHoldingSessionSerializer(
            session,
            data=request.data,
            partial=True  # ✅ allows updating only title/description
        )

        if serializer.is_valid():
            serializer.save()
            return Response({
                "message": "Session updated successfully",
                "data": serializer.data
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, session_id):
        session = get_object_or_404(HandHoldingSession, id=session_id)

        session.delete()

        return Response({
            "message": "Session deleted successfully"
        }, status=status.HTTP_200_OK)
        
class HandHoldingParticipantListAPIView(APIView):
    permission_classes = [IsAuthenticated]  # Only authenticated users can access
    
    def get(self, request):
        
        # participants = HandHoldingParticipant.objects.annotate(
        #     total_sessions_count=Count(
        #         "sessions",
        #         filter=~Q(sessions__status="cancelled")   # ✅ exclude cancelled
        #     ),
        #     completed_sessions_count=Count(
        #         "sessions",
        #         filter=Q(sessions__status="completed")
        #     )
        # )
        participants = HandHoldingParticipant.objects.annotate(
            total_sessions_count=Count(
                "sessions",
                filter=~Q(sessions__status="cancelled")
            ),
            completed_sessions_count=Count(
                "sessions",
                filter=Q(sessions__status="completed")
            ),
            booked_sessions_count=Count(
                "sessions",
                filter=Q(sessions__status="booked")
            ),
            pending_sessions_count=Count(
                "sessions",
                filter=Q(sessions__status="pending")
            ),
            cancelled_sessions_count=Count(
                "sessions",
                filter=Q(sessions__status="cancelled")
            ),
            in_progress_sessions_count=Count(
                "sessions",
                filter=Q(sessions__status="in_progress")
            )
            
        )
        serializer = HandHoldingParticipantSerializer(participants, many=True, context={"request": request})
        return Response(serializer.data)
    
    # =====================================
    # ✅ PUT API (UPDATE PARTICIPANT)
    # =====================================
    def put(self, request, participant_id=None):

        if not participant_id:
            return Response({
                "message": "participant_id is required"
            }, status=400)

        try:
            participant = HandHoldingParticipant.objects.get(id=participant_id)
        except HandHoldingParticipant.DoesNotExist:
            return Response({
                "message": "Participant not found"
            }, status=404)

        data = request.data

        # =========================
        # 🔹 UPDATE PARTICIPANT
        # =========================
        participant.mobile = data.get("mobile", participant.mobile)
        participant.city = data.get("city", participant.city)
        participant.state = data.get("state", participant.state)
        participant.pincode = data.get("pincode", participant.pincode)
        participant.full_address = data.get("full_address", participant.full_address)

        participant.preferred_counselling_mode = data.get(
            "preferred_counselling_mode",
            participant.preferred_counselling_mode
        )

        participant.show_profile = data.get("show_profile", participant.show_profile)
        participant.status = data.get("status", participant.status)

        # =========================
        # 🔹 FILE UPDATES (Participant)
        # =========================
        if "photo" in request.FILES:
            participant.photo = request.FILES["photo"]

        if "resume_file" in request.FILES:
            participant.resume_file = request.FILES["resume_file"]

        participant.save()

        # =========================
        # 🔹 UPDATE PAYMENT PROOF FILE
        # =========================
        if "proof_file" in request.FILES:

            # Get latest payment of this user
            payment = Payment.objects.filter(
                user=participant.user
            ).order_by("-created_at").first()

            if payment:
                payment.proof_file = request.FILES["proof_file"]
                payment.save()

        # =========================
        # 🔹 RESPONSE
        # =========================
        return Response({
            "message": "Participant updated successfully",
            "data": HandHoldingParticipantSerializer(
                participant,
                context={"request": request}
            ).data
        }, status=200)
        
    
# class BookedRescheduledSlotsByDateAPIView(APIView):
#     permission_classes = [IsAuthenticated]

#     def get(self, request, date):

#         response_data = []
#         used_slot_ids = set()  # ✅ prevent duplicates

#         # ============================================
#         # 🔹 NORMAL BOOKINGS
#         # ============================================
#         bookings = Booking.objects.select_related("slot", "student__user", "slot__counsellor").filter(
#             slot__date=date,
#             status__in=["booked", "rescheduled"],
#             slot__is_deleted=False
#         )

#         for booking in bookings:
#             slot = booking.slot
#             if not slot:
#                 continue

#             used_slot_ids.add(slot.id)  # ✅ mark used

#             response_data.append({
#                 "type": "normal",
#                 "slot_id": slot.id,
#                 "date": slot.date,
#                 "start_time": slot.start_time,
#                 "end_time": slot.end_time,
#                 "is_handholding_session_available": slot.is_handholding_session_available,
#                 "status": booking.status,
#                 "student_id": booking.student.id,
#                 "student_name": f"{booking.student.user.first_name} {booking.student.user.last_name}",
#                 "email": booking.student.user.email,
#                 "phone": booking.student.user.phone,
#                 "meeting_link": booking.meeting_link,
#                 "counsellor_id": slot.counsellor.id if slot.counsellor else None,
#                 "counsellor_name": (
#                     f"{slot.counsellor.first_name} {slot.counsellor.last_name}"
#                     if slot.counsellor else None
#                 ),
#             })

#         # ============================================
#         # 🔹 HANDHOLDING BOOKINGS
#         # ============================================
#         hh_sessions = HandHoldingParticipantSession.objects.select_related(
#             "handholding_participant__user",
#             "conducted_by",
#             "slot"
#         ).filter(
#             session_date__date=date,
#             status__in=["booked", "rescheduled"]
#         )

#         for session in hh_sessions:

#             session_slot = session.slot

#             if not session_slot:
#                 continue

#             # ❌ Skip duplicate slot
#             if session_slot.id in used_slot_ids:
#                 continue

#             used_slot_ids.add(session_slot.id)

#             participant = session.handholding_participant
#             user = participant.user if participant else None

#             response_data.append({
#                 "type": "handholding",
#                 "slot_id": session_slot.id,
#                 "date": session_slot.date,
#                 "start_time": session_slot.start_time,
#                 "end_time": session_slot.end_time,
#                 "is_handholding_session_available": session_slot.is_handholding_session_available,
#                 "status": session.status,
#                 "participant_id": participant.id if participant else None,
#                 "session_no": session.session_no,
#                 "student_id": user.id if user else None,
#                 "student_name": f"{user.first_name} {user.last_name}" if user else None,
#                 "email": user.email if user else None,
#                 "phone": user.phone if user else None,
#                 "counsellor_id": session.conducted_by.id if session.conducted_by else None,
#                 "counsellor_name": (
#                     f"{session.conducted_by.first_name} {session.conducted_by.last_name}"
#                     if session.conducted_by else None
#                 ),
#             })

#         # ============================================
#         # 🔹 SORT
#         # ============================================
#         def parse_time(t):
#             try:
#                 return datetime.strptime(str(t), "%I:%M %p")
#             except:
#                 return datetime.strptime(str(t), "%H:%M:%S")

#         response_data = sorted(
#             response_data,
#             key=lambda x: parse_time(x["start_time"])
#         )

#         return Response({
#             "success": True,
#             "date": date,
#             "count": len(response_data),
#             "data": response_data
#         }, status=status.HTTP_200_OK) 

class BookedRescheduledSlotsByDateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, date):

        response_data = []
        used_slot_ids = set()  # ✅ prevent duplicates

        # ============================================
        # 🔹 NORMAL BOOKINGS
        # ============================================
        bookings = Booking.objects.select_related(
            "slot", "student__user", "slot__counsellor"
        ).filter(
            slot__date=date,
            status__in=["booked", "rescheduled"],
            slot__is_deleted=False
        )

        for booking in bookings:
            slot = booking.slot
            if not slot:
                continue

            used_slot_ids.add(slot.id)

            response_data.append({
                "type": "normal",
                "slot_id": slot.id,
                "date": slot.date,
                "start_time": slot.start_time,
                "end_time": slot.end_time,
                "mode": slot.mode,  # ✅ added for clarity
                "is_handholding_session_available": slot.is_handholding_session_available,
                "status": booking.status,
                "student_id": booking.student.id,
                "student_name": f"{booking.student.user.first_name} {booking.student.user.last_name}",
                "email": booking.student.user.email,
                "phone": booking.student.user.phone,
                "meeting_link": booking.meeting_link,
                # "counsellor_id": slot.counsellor.id if slot.counsellor else None,
                # "counsellor_name": (
                #     f"{slot.counsellor.first_name} {slot.counsellor.last_name}"
                #     if slot.counsellor else None
                # ),
                "counsellors": [
                    {
                        "counsellor_id": bc.counsellor.id,
                        "counsellor_name": f"{bc.counsellor.user.first_name} {bc.counsellor.user.last_name}",
                        "role": bc.role
                    }
                    for bc in BookingCounsellor.objects.select_related(
                        "counsellor__user"
                    ).filter(
                        booking=booking
                    )
                ],
            })

        # ============================================
        # 🔹 HANDHOLDING BOOKINGS
        # ============================================
        hh_sessions = HandHoldingParticipantSession.objects.select_related(
            "handholding_participant__user",
            "conducted_by",
            "slot"
        ).filter(
            session_date__date=date,
            status__in=["booked", "rescheduled"]
        )

        for session in hh_sessions:

            session_slot = session.slot

            if not session_slot:
                continue

            # ❌ Skip duplicate slot
            if session_slot.id in used_slot_ids:
                continue

            used_slot_ids.add(session_slot.id)

            participant = session.handholding_participant
            user = participant.user if participant else None

            # ============================================
            # 🔒 MODE FILTER (MAIN LOGIC)
            # ============================================
            preferred_mode = (
                participant.preferred_counselling_mode
                if participant else None
            )
            slot_mode = session_slot.mode

            # 👉 If user is ONLINE → allow only online slots
            if preferred_mode == "online" and slot_mode != "online":
                continue
            # 👉 If OFFLINE → allow both (no restriction)

            response_data.append({
                "type": "handholding",
                "slot_id": session_slot.id,
                "date": session_slot.date,
                "start_time": session_slot.start_time,
                "end_time": session_slot.end_time,
                "mode": session_slot.mode,  # ✅ added
                "is_handholding_session_available": session_slot.is_handholding_session_available,
                "status": session.status,
                "participant_id": participant.id if participant else None,
                "session_no": session.session_no,
                "student_id": user.id if user else None,
                "student_name": f"{user.first_name} {user.last_name}" if user else None,
                "email": user.email if user else None,
                "phone": user.phone if user else None,
                # "counsellor_id": session.conducted_by.id if session.conducted_by else None,
                # "counsellor_name": (
                #     f"{session.conducted_by.first_name} {session.conducted_by.last_name}"
                #     if session.conducted_by else None
                # ),
                "counsellors": [
                    {
                        "counsellor_id": session.conducted_by.id,
                        "counsellor_name": f"{session.conducted_by.first_name} {session.conducted_by.last_name}",
                        "role": "lead"
                    }
                ] if session.conducted_by else [],
            })

        # ============================================
        # 🔹 SORT
        # ============================================
        def parse_time(t):
            try:
                return datetime.strptime(str(t), "%I:%M %p")
            except:
                return datetime.strptime(str(t), "%H:%M:%S")

        response_data = sorted(
            response_data,
            key=lambda x: parse_time(x["start_time"])
        )

        return Response({
            "success": True,
            "date": date,
            "count": len(response_data),
            "data": response_data
        }, status=200)
       
              
# class BookHandHoldingSessionAPIView(APIView):
#     permission_classes = [IsAuthenticated]

#     def post(self, request):

#         participant_id = request.data.get("participant_id")
#         session_no = request.data.get("session_no")
#         slot_id = request.data.get("slot_id")
#         date = request.data.get("date")

#         # =========================
#         # 🔹 VALIDATION
#         # =========================
#         if not participant_id or not session_no or not slot_id or not date:
#             return Response({
#                 "message": "participant_id, session_no, slot_id and date are required"
#             }, status=400)

#         # ✅ Convert date string → date object
#         try:
#             selected_date = datetime.strptime(date, "%Y-%m-%d").date()
#         except ValueError:
#             return Response({
#                 "message": "Invalid date format. Use YYYY-MM-DD"
#             }, status=400)

#         try:
#             with transaction.atomic():

#                 participant = HandHoldingParticipant.objects.select_related("user").get(id=participant_id)

#                 # session = HandHoldingParticipantSession.objects.get(
#                 #     handholding_participant=participant,
#                 #     session_no=session_no
#                 # )
#                 session, created = HandHoldingParticipantSession.objects.get_or_create(
#                     handholding_participant=participant,
#                     session_no=session_no,
#                     defaults={
#                         "status": "not_booked"
#                     }
#                 )

#                 slot = Slot.objects.select_related("counsellor").get(
#                     id=slot_id,
#                     is_available=True,
#                     is_deleted=False
#                 )

#                 # =========================
#                 # 🔒 PREVENT DOUBLE BOOKING
#                 # =========================
#                 if session.status in ["booked", "completed"]:
#                     return Response({
#                         "message": "Session already booked/completed"
#                     }, status=400)

#                 # Check if slot already used
#                 slot_used = HandHoldingParticipantSession.objects.filter(
#                     slot=slot
#                 ).exclude(id=session.id).exists()

#                 if slot_used:
#                     return Response({
#                         "message": "This slot is already booked"
#                     }, status=400)

#                 # =========================
#                 # 🔒 DATE VALIDATION
#                 # =========================
#                 if slot.date != selected_date:
#                     return Response({
#                         "message": "Selected date does not match slot date"
#                     }, status=400)

#                 # =========================
#                 # 🔹 SET SESSION DATETIME
#                 # =========================
#                 session_datetime = datetime.combine(
#                     selected_date,
#                     datetime.strptime(slot.start_time, "%I:%M %p").time()
#                 )

#                 # =========================
#                 # 🔹 UPDATE SESSION
#                 # =========================
#                 session.slot = slot
#                 session.session_date = session_datetime
#                 session.status = "booked"
#                 session.conducted_by = slot.counsellor
#                 session.save()

#                 # =========================
#                 # 🔹 BLOCK SLOT
#                 # =========================
#                 slot.is_available = False
#                 slot.save(update_fields=["is_available"])

#                 # =========================
#                 # 🔹 RESPONSE
#                 # =========================
#                 return Response({
#                     "message": "Session booked successfully",
#                     "data": {
#                         "participant_id": participant.id,
#                         "session_no": session.session_no,
#                         "slot_id": slot.id,
#                         "date": selected_date,
#                         "start_time": slot.start_time,
#                         "end_time": slot.end_time,
#                         "counsellor_id": slot.counsellor.id,
#                         "counsellor_name": f"{slot.counsellor.first_name} {slot.counsellor.last_name}"
#                     }
#                 }, status=200)

#         except HandHoldingParticipant.DoesNotExist:
#             return Response({"message": "Participant not found"}, status=404)

#         except HandHoldingParticipantSession.DoesNotExist:
#             return Response({"message": "Session not found"}, status=404)

#         except Slot.DoesNotExist:
#             return Response({"message": "Slot not available"}, status=400)

#         except Exception as e:
#             return Response({
#                 "message": "Something went wrong",
#                 "error": str(e)
#             }, status=500)

class BookHandHoldingSessionAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):

        participant_id = request.data.get("participant_id")
        session_no = request.data.get("session_no")
        slot_id = request.data.get("slot_id")
        date = request.data.get("date")

        # =========================
        # 🔹 VALIDATION
        # =========================
        if not participant_id or not session_no or not slot_id or not date:
            return Response({
                "message": "participant_id, session_no, slot_id and date are required"
            }, status=400)

        # ✅ Convert date string → date object
        try:
            selected_date = datetime.strptime(date, "%Y-%m-%d").date()
        except ValueError:
            return Response({
                "message": "Invalid date format. Use YYYY-MM-DD"
            }, status=400)

        try:
            with transaction.atomic():

                # =========================
                # 🔹 GET PARTICIPANT
                # =========================
                participant = HandHoldingParticipant.objects.select_related("user").get(id=participant_id)

                # =========================
                # 🔹 GET OR CREATE SESSION (FIXED)
                # =========================
                sessions = HandHoldingParticipantSession.objects.filter(
                    handholding_participant=participant,
                    session_no=session_no
                ).order_by("id")

                if sessions.exists():
                    session = sessions.first()
                else:
                    session = HandHoldingParticipantSession.objects.create(
                        handholding_participant=participant,
                        session_no=session_no,
                        status="not_booked"
                    )

                # =========================
                # 🔹 GET SLOT
                # =========================
                print("Fetching slot with ID:", slot_id)
                print(
                    Slot.objects.filter(id=slot_id).values(
                        "id",
                        "is_available",
                        "is_deleted",
                        "is_handholding_session_available"
                    )
                )
                slot = Slot.objects.select_related("counsellor").get(
                    id=slot_id,
                    # is_available=True,
                    is_deleted=False
                )

                # =========================
                # 🔒 PREVENT DOUBLE BOOKING
                # =========================
                if session.status in ["booked", "completed"]:
                    return Response({
                        "message": "Session already booked or completed"
                    }, status=400)

                # Slot already used check
                slot_used = HandHoldingParticipantSession.objects.filter(
                    slot=slot
                ).exclude(id=session.id).exists()

                if slot_used:
                    return Response({
                        "message": "This slot is already booked"
                    }, status=400)

                # =========================
                # 🔒 DATE VALIDATION
                # =========================
                if slot.date != selected_date:
                    return Response({
                        "message": "Selected date does not match slot date"
                    }, status=400)

                # =========================
                # 🔹 SET SESSION DATETIME
                # =========================
                session_datetime = datetime.combine(
                    selected_date,
                    datetime.strptime(slot.start_time, "%I:%M %p").time()
                )

                # =========================
                # 🔹 UPDATE SESSION
                # =========================
                # session.slot = slot
                # session.session_date = session_datetime
                # session.status = "booked"
                # session.conducted_by = slot.counsellor
                # session.save()
                
                # =========================
                # 🔥 CHECK IF PARTICIPANT ALREADY FULLY COMPLETED
                # =========================
                total = HandHoldingParticipantSession.objects.filter(
                    handholding_participant=participant
                ).exclude(status="cancelled").count()

                completed = HandHoldingParticipantSession.objects.filter(
                    handholding_participant=participant,
                    status="completed"
                ).count()

                # =========================
                # 🔹 DETERMINE STATUS
                # =========================
                if total > 0 and completed >= total:
                    session_status = "completed"
                else:
                    session_status = "booked"

                # =========================
                # 🔹 UPDATE SESSION
                # =========================
                session.slot = slot
                session.session_date = session_datetime
                session.status = session_status   # ✅ HERE IS THE FIX
                session.conducted_by = slot.counsellor
                session.save()

                # =========================
                # 🔹 BLOCK SLOT
                # =========================
                # slot.is_available = False
                # slot.is_handholding_session_available = False
                # slot.save(update_fields=["is_handholding_session_available"])
                updated=Slot.objects.filter(id=slot.id).update(
                    is_handholding_session_available=False
                )
                
                print("Rows Updated:", updated)
                slot.refresh_from_db()

                print(
                    "is_handholding_session_available:",
                    slot.is_handholding_session_available
                )

                # =========================
                # 🔹 RESPONSE
                # =========================
                return Response({
                    "message": "Session booked successfully",
                    "data": {
                        "participant_id": participant.id,
                        "session_no": session.session_no,
                        "slot_id": slot.id,
                        "date": selected_date,
                        "start_time": slot.start_time,
                        "end_time": slot.end_time,
                        "counsellor_id": slot.counsellor.id,
                        "counsellor_name": f"{slot.counsellor.first_name} {slot.counsellor.last_name}"
                    }
                }, status=200)

        except HandHoldingParticipant.DoesNotExist:
            return Response({"message": "Participant not found"}, status=404)

        except Slot.DoesNotExist:
            return Response({"message": "Slot not available"}, status=400)

        except Exception as e:
            return Response({
                "message": "Something went wrong",
                "error": str(e)
            }, status=500)
            
                       
class MarkSessionCompletedAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):

        participant_id = request.data.get("participant_id")
        session_no = request.data.get("session_no")

        # =========================
        # 🔹 VALIDATION
        # =========================
        if not participant_id or not session_no:
            return Response({
                "message": "participant_id and session_no are required"
            }, status=400)

        try:
            with transaction.atomic():

                # =========================
                # 🔹 GET PARTICIPANT
                # =========================
                participant = HandHoldingParticipant.objects.get(id=participant_id)

                # =========================
                # 🔥 GET LATEST SESSION (IMPORTANT FIX)
                # =========================
                session = HandHoldingParticipantSession.objects.select_related(
                    "slot", "conducted_by"
                ).filter(
                    handholding_participant=participant,
                    session_no=session_no
                ).exclude(
                    status="cancelled"
                ).order_by('-id').first()

                if not session:
                    return Response({
                        "message": "Session not found"
                    }, status=404)

                # =========================
                # 🔒 VALID STATUS CHECK
                # =========================
                if session.status == "completed":
                    return Response({
                        "message": "Session already completed"
                    }, status=400)

                if session.status not in ["booked", "rescheduled", "in_progress"]:
                    return Response({
                        "message": f"Cannot complete session with status '{session.status}'"
                    }, status=400)

                # =========================
                # 🔹 UPDATE STATUS
                # =========================
                session.status = "completed"
                session.completed_at = timezone.now()
                session.save(update_fields=["status", "completed_at"])
                
                # =========================
                # 🔥 AUTO CHECK ALL COMPLETED  (ADD HERE ✅)
                # =========================
                participant = session.handholding_participant

                total_sessions = HandHoldingParticipantSession.objects.filter(
                    handholding_participant=participant
                ).exclude(status="cancelled").count()

                completed_sessions = HandHoldingParticipantSession.objects.filter(
                    handholding_participant=participant,
                    status="completed"
                ).count()

                # =========================
                # 🔥 IF ALL COMPLETED → UPDATE PARTICIPANT
                # =========================
                if total_sessions > 0 and total_sessions == completed_sessions:
                    participant.status = "completed"
                    participant.certificate_issued = True   # (optional but usually needed)
                    participant.save(update_fields=["status", "certificate_issued"])
#  ==============================================================================================
                # =========================
                # 🔹 RESPONSE
                # =========================
                return Response({
                    "message": "Session marked as completed successfully",
                    "data": {
                        "session_id": session.id,
                        "participant_id": participant.id,
                        "session_no": session.session_no,
                        "status": session.status,
                        "completed_at": session.completed_at,
                        "slot_id": session.slot.id if session.slot else None,
                        "counsellor": (
                            f"{session.conducted_by.first_name} {session.conducted_by.last_name}"
                            if session.conducted_by else None
                        )
                    }
                }, status=200)

        except HandHoldingParticipant.DoesNotExist:
            return Response({"message": "Participant not found"}, status=404)

        except Exception as e:
            return Response({
                "message": "Something went wrong",
                "error": str(e)
            }, status=500)
            
class RescheduleSessionAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):

        participant_id = request.data.get("participant_id")
        session_no = request.data.get("session_no")
        new_slot_id = request.data.get("slot_id")
        new_date = request.data.get("date")

        # =========================
        # 🔹 VALIDATION
        # =========================
        if not participant_id or not session_no or not new_slot_id or not new_date:
            return Response({
                "message": "participant_id, session_no, slot_id and date are required"
            }, status=400)

        try:
            with transaction.atomic():

                # =========================
                # 🔹 GET PARTICIPANT
                # =========================
                participant = HandHoldingParticipant.objects.get(id=participant_id)

                # =========================
                # 🔹 GET CURRENT SESSION (LATEST NON-CANCELLED)
                # =========================
                current_session = HandHoldingParticipantSession.objects.select_related(
                    "slot", "handholding_session"
                ).filter(
                    handholding_participant=participant,
                    session_no=session_no
                ).exclude(
                    status="cancelled"
                ).order_by('-id').first()

                if not current_session:
                    return Response({"message": "Session not found"}, status=404)

                # =========================
                # 🔹 GET SLOT
                # =========================
                new_slot = Slot.objects.select_related("counsellor").filter(
                    id=new_slot_id,
                    is_deleted=False
                ).first()

                if not new_slot:
                    return Response({"message": "Slot not found"}, status=404)

                # =========================
                # 🔒 SLOT CONFLICT CHECK
                # =========================
                slot_used = HandHoldingParticipantSession.objects.filter(
                    slot=new_slot,
                    status__in=["booked", "rescheduled", "in_progress"]
                ).exclude(id=current_session.id).exists()

                if slot_used:
                    return Response({
                        "message": "This slot is already booked"
                    }, status=400)

                # =========================
                # 🔹 PARSE DATE
                # =========================
                try:
                    parsed_date = datetime.strptime(new_date, "%Y-%m-%d").date()
                except ValueError:
                    return Response({
                        "message": "Invalid date format. Use YYYY-MM-DD"
                    }, status=400)

                # =========================
                # 🔒 PREVENT PAST DATE
                # =========================
                if parsed_date < timezone.now().date():
                    return Response({
                        "message": "Cannot select past date"
                    }, status=400)

                # =========================
                # 🔹 COMBINE DATE + TIME
                # =========================
                session_datetime = datetime.combine(
                    parsed_date,
                    datetime.strptime(new_slot.start_time, "%I:%M %p").time()
                )

                # =========================
                # 🔥 CASE 1: PENDING → UPDATE SAME ROW
                # =========================
                if current_session.status == "pending":

                    current_session.slot = new_slot
                    current_session.session_date = session_datetime
                    current_session.status = "rescheduled"
                    current_session.conducted_by = new_slot.counsellor
                    current_session.notes = "Updated from pending to rescheduled"
                    current_session.save()

                    # new_slot.is_available = False
                    new_slot.is_handholding_session_available = False
                    new_slot.save(update_fields=[ "is_handholding_session_available"])

                    return Response({
                        "message": "Pending session updated successfully",
                        "data": {
                            "session_id": current_session.id,
                            "participant_id": participant.id,
                            "session_no": session_no,
                            "status": current_session.status,
                            "date": parsed_date,
                            "start_time": new_slot.start_time,
                            "end_time": new_slot.end_time,
                            "slot_id": new_slot.id,
                        }
                    }, status=200)

                # =========================
                # 🔥 CASE 2: OTHER STATUS → CANCEL + CREATE NEW
                # =========================
                if current_session.status in ["booked", "in_progress", "completed", "rescheduled"]:

                    # Free old slot
                    if current_session.slot:
                        # current_session.slot.is_available = True
                        current_session.slot.is_handholding_session_available = True
                        current_session.slot.save(update_fields=[ "is_handholding_session_available"])

                    # Cancel old session
                    current_session.status = "cancelled"
                    current_session.save(update_fields=["status"])

                    # Create new session
                    new_session = HandHoldingParticipantSession.objects.create(
                        handholding_participant=participant,
                        handholding_session=current_session.handholding_session,
                        session_no=session_no,
                        slot=new_slot,
                        session_date=session_datetime,
                        status="rescheduled",
                        conducted_by=new_slot.counsellor,
                        notes=f"Rescheduled from session ID {current_session.id}"
                    )

                    # Block new slot
                    new_slot.is_available = False
                    new_slot.is_handholding_session_available = False
                    new_slot.save(update_fields=["is_available", "is_handholding_session_available"])

                    return Response({
                        "message": "Session rescheduled successfully",
                        "data": {
                            "old_session_id": current_session.id,
                            "new_session_id": new_session.id,
                            "participant_id": participant.id,
                            "session_no": session_no,
                            "status": new_session.status,
                            "date": parsed_date,
                            "start_time": new_slot.start_time,
                            "end_time": new_slot.end_time,
                            "slot_id": new_slot.id,
                        }
                    }, status=200)

                # =========================
                # ❌ INVALID STATUS
                # =========================
                return Response({
                    "message": f"Cannot reschedule session with status '{current_session.status}'"
                }, status=400)

        except HandHoldingParticipant.DoesNotExist:
            return Response({"message": "Participant not found"}, status=404)

        except Exception as e:
            return Response({
                "message": "Something went wrong",
                "error": str(e)
            }, status=500)
            
            
            
class CancelSessionAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):

        participant_id = request.data.get("participant_id")
        session_no = request.data.get("session_no")

        # =========================
        # 🔹 VALIDATION
        # =========================
        if not participant_id or not session_no:
            return Response({
                "message": "participant_id and session_no are required"
            }, status=400)

        try:
            with transaction.atomic():

                # =========================
                # 🔹 GET PARTICIPANT
                # =========================
                participant = HandHoldingParticipant.objects.select_related("user").get(id=participant_id)

                # =========================
                # 🔹 GET CURRENT SESSION
                # =========================
                current_session = HandHoldingParticipantSession.objects.filter(
                    handholding_participant=participant,
                    session_no=session_no
                ).order_by('-id').first()

                # =========================
                # 🔒 STATUS CHECK
                # =========================
                if current_session.status not in ["booked", "in_progress", "rescheduled", "completed"]:
                    return Response({
                        "message": f"Cannot cancel session with status '{current_session.status}'"
                    }, status=400)

                # =========================
                # 🔹 FREE SLOT (IF EXISTS)
                # =========================
                if current_session.slot:
                    # current_session.slot.is_available = True
                    current_session.slot.is_handholding_session_available = True
                    current_session.slot.save(update_fields=[ "is_handholding_session_available"])

                # =========================
                # 🔹 CANCEL OLD SESSION
                # =========================
                current_session.status = "cancelled"
                current_session.save(update_fields=["status"])

                # =========================
                # 🔹 CREATE NEW PENDING SESSION
                # =========================
                new_session = HandHoldingParticipantSession.objects.create(
                    handholding_participant=participant,
                    handholding_session=current_session.handholding_session,
                    session_no=session_no,
                    status="pending",
                    notes=f"Created after cancellation of session ID {current_session.id}"
                    # ❗ No slot
                    # ❗ No session_date
                    # ❗ No conducted_by
                )

                # =========================
                # 🔹 RESPONSE
                # =========================
                return Response({
                    "message": "Session cancelled and new pending session created",
                    "data": {
                        "old_session_id": current_session.id,
                        "new_session_id": new_session.id,
                        "participant_id": participant.id,
                        "name": f"{participant.user.first_name} {participant.user.last_name}",
                        "email": participant.user.email,
                        "session_no": session_no,
                        "new_status": new_session.status
                    }
                }, status=200)

        except HandHoldingParticipant.DoesNotExist:
            return Response({"message": "Participant not found"}, status=404)

        except HandHoldingParticipantSession.DoesNotExist:
            return Response({"message": "Session not found"}, status=404)

        except Exception as e:
            return Response({
                "message": "Something went wrong",
                "error": str(e)
            }, status=500)
            
# class ParticipantSessionListAPIView(APIView):
#     permission_classes = [IsAuthenticated]

#     def get(self, request, participant_id):

#         try:
#             participant = HandHoldingParticipant.objects.select_related("user").get(id=participant_id)

#             # =========================
#             # 🔥 STEP 1: Get latest session IDs per session_no
#             # =========================
#             latest_sessions_ids = (
#                 HandHoldingParticipantSession.objects.filter(
#                     handholding_participant=participant
#                 )
#                 .exclude(status="cancelled")
#                 .values("session_no")
#                 .annotate(latest_id=Max("id"))
#                 .values_list("latest_id", flat=True)
#             )

#             # =========================
#             # 🔥 STEP 2: Fetch those sessions
#             # =========================
#             sessions = HandHoldingParticipantSession.objects.select_related(
#                 "slot", "conducted_by"
#             ).filter(
#                 id__in=latest_sessions_ids
#             ).order_by("session_no")   # ✅ sequence wise

#             # =========================
#             # 🔹 FORMAT RESPONSE
#             # =========================
#             data = []
#             for session in sessions:
#                 data.append({
#                     "session_id": session.id,
#                     "session_no": session.session_no,
#                     "status": session.status,
#                     "date": session.session_date,
#                     "completed_at": session.completed_at,
#                     "slot_id": session.slot.id if session.slot else None,
#                     "start_time": session.slot.start_time if session.slot else None,
#                     "end_time": session.slot.end_time if session.slot else None,
#                     "counsellor": (
#                         f"{session.conducted_by.first_name} {session.conducted_by.last_name}"
#                         if session.conducted_by else None
#                     ),
#                     "notes": session.notes
#                 })

#             return Response({
#                 "message": "Sessions fetched successfully",
#                 "participant_id": participant.id,
#                 "name": f"{participant.user.first_name} {participant.user.last_name}",
#                 "total_sessions": len(data),
#                 "data": data
#             }, status=200)

#         except HandHoldingParticipant.DoesNotExist:
#             return Response({
#                 "message": "Participant not found"
#             }, status=404)

#         except Exception as e:
#             return Response({
#                 "message": "Something went wrong",
#                 "error": str(e)
#             }, status=500)


from collections import defaultdict

class ParticipantSessionListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, participant_id):

        try:
            participant = HandHoldingParticipant.objects.select_related("user").get(id=participant_id)

            # =========================
            # 🔥 GET LATEST NON-CANCELLED SESSION PER SESSION_NO
            # =========================
            latest_sessions_ids = (
                HandHoldingParticipantSession.objects.filter(
                    handholding_participant=participant
                )
                .exclude(status="cancelled")
                .values("session_no")
                .annotate(latest_id=Max("id"))
                .values_list("latest_id", flat=True)
            )

            latest_sessions = HandHoldingParticipantSession.objects.select_related(
                "slot", "conducted_by"
            ).filter(
                id__in=latest_sessions_ids
            ).order_by("session_no")

            # =========================
            # 🔹 MAIN DATA (LATEST VIEW)
            # =========================
            data = []
            for session in latest_sessions:
                data.append({
                    "session_id": session.id,
                    "session_no": session.session_no,
                    "status": session.status,
                    "date": session.session_date,
                    "completed_at": session.completed_at,
                    "slot_id": session.slot.id if session.slot else None,
                    "start_time": session.slot.start_time if session.slot else None,
                    "end_time": session.slot.end_time if session.slot else None,
                    "counsellor": (
                        f"{session.conducted_by.first_name} {session.conducted_by.last_name}"
                        if session.conducted_by else None
                    ),
                    "notes": session.notes
                })

            # =========================
            # 🔥 HISTORY (LATEST ONLY)
            # =========================
            history = []
            for session in latest_sessions:
                history.append({
                    "session_id": session.id,
                    "session_no": session.session_no,
                    "status": session.status,
                    "date": session.session_date,
                    "slot_id": session.slot.id if session.slot else None,
                    "start_time": session.slot.start_time if session.slot else None,
                    "end_time": session.slot.end_time if session.slot else None,
                    "counsellor": (
                        f"{session.conducted_by.first_name} {session.conducted_by.last_name}"
                        if session.conducted_by else None
                    ),
                    "details": f"Session {session.session_no} is {session.status}" +
                        (f" on {session.session_date}" if session.session_date else "") 
                })

            # =========================
            # 🔥 JOURNEY (LATEST ONLY)
            # =========================
            journey = []
            for session in latest_sessions:
                journey.append({
                    "session_no": session.session_no,
                    "status": session.status,
                    "date": session.session_date,
                    "slot_id": session.slot.id if session.slot else None,
                })

            # =========================
            # 🔹 FINAL RESPONSE
            # =========================
            return Response({
                "message": "Sessions fetched successfully",
                "participant_id": participant.id,
                "name": f"{participant.user.first_name} {participant.user.last_name}",
                "total_sessions": len(data),

                # ✅ SAME RESPONSE
                "data": data,

                # ✅ ADDITIONAL DATA
                "history": history,
                "journey": journey

            }, status=200)

        except HandHoldingParticipant.DoesNotExist:
            return Response({
                "message": "Participant not found"
            }, status=404)

        except Exception as e:
            return Response({
                "message": "Something went wrong",
                "error": str(e)
            }, status=500)




            
class HandHoldingSessionListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        status_filter = request.GET.get("status")
        
        # =========================
        # 🔥 AUTO COMPLETE LOGIC (FINAL FIX)
        # =========================

        now = timezone.now()   # ✅ ALWAYS use this (safe)

        today_sessions = HandHoldingParticipantSession.objects.select_related("slot").filter(
            session_date__date=now.date(),
            status__in=["booked", "rescheduled", "in_progress"]
        )

        for session in today_sessions:
            if session.slot and session.slot.start_time:

                # ✅ convert string → time
                start_time_obj = datetime.strptime(
                    session.slot.start_time,
                    "%I:%M %p"
                ).time()

                # ✅ combine date + start time
                session_start_datetime = datetime.combine(
                    session.session_date.date(),
                    start_time_obj
                )

                # ✅ auto complete after 1 hour 30 minutes
                auto_complete_time = session_start_datetime + timedelta(
                    hours=1,
                    minutes=30
                )

                # ✅ compare safely
                now_naive = now.replace(tzinfo=None)

                if now_naive >= auto_complete_time:
                    session.status = "completed"
                    session.completed_at = now
                    session.save(update_fields=["status", "completed_at"])
                    
        sessions = HandHoldingParticipantSession.objects.select_related(
            "handholding_participant__user", "slot"
        )

        if status_filter == "not_booked":
            sessions = sessions.filter(status="not_booked")

        elif status_filter == "booked_rescheduled":
            sessions = sessions.filter(
                Q(status="booked") | Q(status="rescheduled")
            )

        elif status_filter == "pending":
            sessions = sessions.filter(status="pending")

        elif status_filter == "completed":
            sessions = sessions.filter(status="completed")

        elif status_filter == "cancelled":
            sessions = sessions.filter(status="cancelled")

        serializer = HandHoldingParticipantSessionSerializer(sessions, many=True)
        return Response(serializer.data)

class ParticipantSessionListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, participant_id):

        try:
            participant = HandHoldingParticipant.objects.select_related("user").get(id=participant_id)
            
            # =========================
            # 🔥 GET LATEST NON-CANCELLED SESSION PER SESSION_NO
            # =========================
            latest_sessions_ids = (
                HandHoldingParticipantSession.objects.filter(
                    handholding_participant=participant
                )
                .exclude(status="cancelled")
                .values("session_no")
                .annotate(latest_id=Max("id"))
                .values_list("latest_id", flat=True)
            )

            latest_sessions = HandHoldingParticipantSession.objects.select_related(
                "slot", "conducted_by"
            ).filter(
                id__in=latest_sessions_ids
            ).order_by("session_no")

            # =========================
            # 🔹 MAIN DATA (LATEST VIEW)
            # =========================
            data = []

            for session in latest_sessions:
                
                report_file = None
                report_file_name = None

                student = None
                booking = None

                if session.status in ["booked", "rescheduled", "completed"]:

                    # 🔹 FIXED BOOKING MATCH
                    if session.slot and session.session_date:

                        booking = Booking.objects.select_related("student__user").filter(
                            slot__date=session.session_date.date(),
                            slot__start_time=session.slot.start_time,
                            slot__end_time=session.slot.end_time,
                            slot__mode=session.slot.mode,
                            status__in=["booked", "rescheduled", "completed"]
                        ).first()

                        if booking:
                            student = booking.student

                    # 🔹 fallback (only if booking not found)
                    if not student:
                        participant_obj = session.handholding_participant
                        user = participant_obj.user if participant_obj else None

                        if user:
                            student = StudentProfile.objects.filter(user=user).first()
                            
                # ==========================================
                # 🔹 REPORT FILE LOGIC (ADD HERE)
                # ==========================================
                if student and student.user:

                    report = (
                        Report.objects
                        .filter(user=student.user)
                        .order_by("-uploaded_at")
                        .first()
                    )

                    if report and report.file_path:
                        try:
                            report_file_name = os.path.basename(report.file_path.name)

                            file_extension = os.path.splitext(report_file_name)[1].lower()

                            # PDF → preview API
                            # if file_extension == ".pdf":
                            #     report_file = request.build_absolute_uri(
                            #         f"/api/report/report/pdf/{report.id}/"
                            #     )

                            # # Other files → direct media URL
                            # else:
                            #     report_file = request.build_absolute_uri(
                            #         report.file_path.url
                            #     )
                            if report and report.file_path:
                                try:
                                    report_file_name = os.path.basename(report.file_path.name)

                                    # ✅ ALL files use same API
                                    report_file = request.build_absolute_uri(
                                        f"/api/report/report/pdf/{report.id}/"
                                    )

                                except Exception:
                                    report_file = None
                                    report_file_name = None

                        except Exception:
                            report_file = None
                            report_file_name = None

                # 🔹 counsellor mapping
                counsellor_obj = None
                if session.conducted_by:
                    counsellor_obj = Counsellor.objects.filter(
                        user=session.conducted_by
                    ).first()

                data.append({
                    "session_id": session.id,
                    "session_no": session.session_no,
                    "status": session.status,
                    "completed_at": session.completed_at,
                    "date": session.session_date,

                    # ✅ FIXED
                    "booking_id": booking.id if booking else None,
                    
                    "program": {
                        "id": booking.program.id,
                        "name": booking.program.name
                    } if booking and booking.program else None,

                    "package": {
                        "id": booking.package.id,
                        "name": booking.package.name
                    } if booking and booking.package else None,

                    "student_id": student.id if student else None,
                    "student_name": (
                        f"{student.user.first_name} {student.user.last_name}"
                        if student else None
                    ),
                    "student_email": student.user.email if student else None,
                    "student_phone": student.user.phone if student else None,

                    "slot_id": session.slot.id if session.slot else None,
                    "start_time": session.slot.start_time if session.slot else None,
                    "end_time": session.slot.end_time if session.slot else None,
                    "mode": session.slot.mode if session.slot else None,
                    "report_file": report_file,
                    "report_file_name": report_file_name,

                    # "counsellor_id": counsellor_obj.id if counsellor_obj else None,
                    # "counsellor": (
                    #     f"{counsellor_obj.user.first_name} {counsellor_obj.user.last_name}"
                    #     if counsellor_obj else None
                    # ),
                    "counsellors": [
                        {
                            "counsellor_id": bc.counsellor.id,
                            "counsellor_name": f"{bc.counsellor.user.first_name} {bc.counsellor.user.last_name}",
                            "role": bc.role
                        }
                        for bc in BookingCounsellor.objects.select_related(
                            "counsellor__user"
                        ).filter(
                            booking=booking
                        )
                    ] if booking else [],

                    "notes": session.notes
                })

            # =========================
            # 🔥 HISTORY (LATEST ONLY) + DETAILS ADDED
            # =========================
            history = []
            for session in latest_sessions:
                history.append({
                    "session_id": session.id,
                    "session_no": session.session_no,
                    "status": session.status,
                    "date": session.session_date,
                    "slot_id": session.slot.id if session.slot else None,
                    "program": {
                        "id": booking.program.id,
                        "name": booking.program.name
                    } if booking and booking.program else None,

                    "package": {
                        "id": booking.package.id,
                        "name": booking.package.name
                    } if booking and booking.package else None,
                    "start_time": session.slot.start_time if session.slot else None,
                    "end_time": session.slot.end_time if session.slot else None,
                    "counsellor": (
                        f"{session.conducted_by.first_name} {session.conducted_by.last_name}"
                        if session.conducted_by else None
                    ),

                    # ✅ ONLY ADDITION
                    "details": (
                        f"Session {session.session_no} is {session.status}" 
                        # (f" on {session.session_date}" if session.session_date else "") +
                        # (f" with slot {session.slot.id}" if session.slot else "")
                    )
                })

            # =========================
            # 🔥 JOURNEY (FULL FLOW)
            # =========================
            journey = []

            user = participant.user

            # =========================
            # 1️⃣ REGISTRATION
            # =========================
            journey.append({
                "step": "Registration",
                "status": "completed",
                "date": participant.created_at,
                "details": f"{user.email} registered successfully"
            })

            # =========================
            # 2️⃣ COUNSELLING (PROGRAM + PACKAGE)
            # =========================
            upp = UserProgramPackage.objects.filter(
                user=user,
                package__isnull=False
            ).select_related("program", "package").order_by("-id").first()

            if upp and upp.program and upp.package:
                journey.append({
                    "step": "Counselling Service",
                    "status": "completed",
                    "date": upp.id,  # you can replace with created_at if available
                    "details": f"{upp.package.name} selected under {upp.program.name}"
                })
            else:
                journey.append({
                    "step": "Counselling Service",
                    "status": "pending",
                    "date": None,
                    "details": "Program/package not selected"
                })

            # =========================
            # 3️⃣ PAYMENT
            # =========================
            payments = Payment.objects.filter(user=user).order_by("created_at")

            total_paid = payments.aggregate(total=Sum("amount"))["total"] or 0
            last_payment = payments.last()

            package_price = (
                upp.package.price if upp and upp.package else 0
            )

            if total_paid == 0:
                payment_status = "not_paid"
            elif total_paid < package_price:
                payment_status = "partial_paid"
            else:
                payment_status = "fully_paid"

            journey.append({
                "step": "Payment",
                "status": payment_status,
                "date": last_payment.created_at if last_payment else None,
                "details": f"Paid ₹{total_paid} out of ₹{package_price}"
            })

            # =========================
            # 4️⃣ SESSIONS (YOUR EXISTING)
            # =========================
            for session in latest_sessions:
                journey.append({
                    "step": f"Session {session.session_no}",
                    "status": session.status,
                    "date": session.session_date,
                    "slot_id": session.slot.id if session.slot else None,
                })

            # =========================
            # 🔹 FINAL RESPONSE
            # =========================
            return Response({
                "message": "Sessions fetched successfully",
                "participant_id": participant.id,
                "name": f"{participant.user.first_name} {participant.user.last_name}",
                "total_sessions": len(data),

                # ✅ SAME RESPONSE
                "data": data,
                "history": history,
                "journey": journey

            }, status=200)

        except HandHoldingParticipant.DoesNotExist:
            return Response({
                "message": "Participant not found"
            }, status=404)

        except Exception as e:
            return Response({
                "message": "Something went wrong",
                "error": str(e)
            }, status=500)
            
class ParticipantSessionProgressAPIView(APIView):

    def get(self, request, participant_id):
        try:
            participant = HandHoldingParticipant.objects.get(id=participant_id)

            # =========================
            # 🔹 TOTAL SESSIONS (from DB)
            # =========================
            total_sessions = HandHoldingParticipantSession.objects.filter(
                handholding_participant=participant
            ).exclude(status="cancelled").count()

            # =========================
            # 🔹 COMPLETED SESSIONS
            # =========================
            completed_count = HandHoldingParticipantSession.objects.filter(
                handholding_participant=participant,
                status="completed"
            ).count()

            # =========================
            # 🔹 PENDING SESSIONS
            # =========================
            pending_count = max(total_sessions - completed_count, 0)

            # =========================
            # 🔹 NEXT SESSION NUMBER
            # =========================
            if completed_count < total_sessions:
                next_session = completed_count + 1
            else:
                next_session = None

            # =========================
            # 🔹 PROGRESS (%)
            # =========================
            if total_sessions > 0:
                progress = round((completed_count / total_sessions) * 100, 2)
            else:
                progress = 0

            return Response({
                "success": True,
                "data": {
                    "participant_id": participant.id,
                    "total_sessions": total_sessions,
                    "completed_sessions": completed_count,
                    "pending_sessions": pending_count,
                    "next_session_no": next_session,
                    "progress_percentage": progress
                }
            }, status=status.HTTP_200_OK)

        except HandHoldingParticipant.DoesNotExist:
            return Response({
                "success": False,
                "message": "Participant not found"
            }, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            return Response({
                "success": False,
                "message": "Something went wrong",
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
class CounsellorStudentBookingByIdAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, counsellor_id):
        try:
            bookings = Booking.objects.filter(
                bookingcounsellor__counsellor_id=counsellor_id,
                status__in=["booked", "completed", "rescheduled"]
            ).select_related(
                "student__user",
                "slot"
            ).prefetch_related(
                "bookingcounsellor_set__counsellor__user"
            ).distinct().order_by("-date")

            serializer = CounsellorStudentBookingSerializer(
                bookings,
                many=True,
                context={"request": request}
            )

            return Response({
                "message": "Counsellor student bookings fetched successfully",
                "count": len(serializer.data),
                "data": serializer.data
            })

        except Exception as e:
            return Response({
                "message": "Something went wrong",
                "error": str(e)
            }, status=500)
            
            
class SendHandHoldingReminderAPIView(APIView):
    """
    Send reminder email using:
    - participant_id
    - session_no

    Only sends for:
    - booked
    - rescheduled
    - not_booked
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, participant_id, session_no):

        # ==========================================
        # 🔹 GET PARTICIPANT
        # ==========================================
        participant = get_object_or_404(
            HandHoldingParticipant,
            id=participant_id
        )

        # ==========================================
        # 🔹 EMAIL CHECK
        # ==========================================
        if not participant.email:
            return Response(
                {
                    "message": "Participant email not found"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ==========================================
        # 🔹 GET SPECIFIC SESSION BY SESSION NO
        # ==========================================
        participant_session = (
            HandHoldingParticipantSession.objects
            .filter(
                handholding_participant=participant,
                session_no=session_no
            )
            .select_related("handholding_session")
            .first()
        )

        if not participant_session:
            return Response(
                {
                    "message": f"Session no {session_no} not found for this participant"
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # ==========================================
        # 🔹 STATUS VALIDATION
        # ==========================================
        allowed_statuses = [
            "booked",
            "rescheduled",
            "not_booked"
        ]

        if participant_session.status not in allowed_statuses:
            return Response(
                {
                    "message": f"Reminder not allowed for session status '{participant_session.status}'"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ==========================================
        # 🔹 SESSION DATE CHECK
        # ==========================================
        if (
            participant_session.status in ["booked", "rescheduled"]
            and not participant_session.session_date
        ):
            return Response(
                {
                    "message": "Session date not scheduled yet"
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # ==========================================
        # 🔹 GENERATE REMINDER
        # ==========================================
        reminder_data = generate_handholding_reminder(
            participant_session,
            participant
        )

        # ==========================================
        # 🔹 SEND EMAIL
        # ==========================================
        try:
            email = EmailMessage(
                subject=reminder_data["subject"],
                body=reminder_data["message"],
                from_email=settings.DEFAULT_FROM_EMAIL,
                to=[participant.email],
            )

            email.send(fail_silently=False)

            print("========== HANDHOLDING REMINDER SENT ==========")
            print("Participant ID:", participant.id)
            print("Session ID:", participant_session.id)
            print("Session No:", participant_session.session_no)
            print("Session Status:", participant_session.status)
            print("Recipient:", participant.email)
            print("===============================================")

        except Exception as e:
            print("EMAIL ERROR:", str(e))

            return Response(
                {
                    "message": "Failed to send reminder email",
                    "error": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # ==========================================
        # 🔹 RESPONSE
        # ==========================================
        return Response(
            {
                "message": "Handholding reminder sent successfully",
                "participant_id": participant.id,
                "participant_name": (
                    f"{participant.user.first_name} {participant.user.last_name}"
                    if participant.user else None
                ),
                "email": participant.email,
                "mobile": participant.mobile,
                "preferred_counselling_mode": (
                    participant.preferred_counselling_mode
                ),
                "session_id": participant_session.id,
                "session_no": participant_session.session_no,
                "session_date": participant_session.session_date,
                "session_status": participant_session.status,
                "subject": reminder_data["subject"],
                "reminder_text": reminder_data["message"]
            },
            status=status.HTTP_200_OK
        )


            
# ============================ Advertisement Views ============================
# def get_ad_status(data):
#     today = timezone.now().date()
#     now_time = datetime.now().time()

#     start_date = data.get("ad_start_date")
#     end_date = data.get("ad_end_date")

#     # ✅ Convert string → date
#     try:
#         if isinstance(start_date, str):
#             start_date = datetime.strptime(start_date, "%Y-%m-%d").date()
#         if isinstance(end_date, str):
#             end_date = datetime.strptime(end_date, "%Y-%m-%d").date()
#     except:
#         start_date = None
#         end_date = None

#     start_time = data.get("ad_start_time")
#     end_time = data.get("ad_end_time")

#     # ✅ Convert string → time
#     def parse_time(t):
#         try:
#             return datetime.strptime(t.strip(), "%I:%M %p").time() if t else None
#         except:
#             return None

#     start_time = parse_time(start_time)
#     end_time = parse_time(end_time)

#     # =========================
#     # 🔥 STATUS LOGIC
#     # =========================
#     if start_date and today < start_date:
#         return "scheduled"

#     if end_date and today > end_date:
#         return "completed"

#     if start_date and end_date:
#         if start_date <= today <= end_date:

#             # Same day → check time
#             if start_date == today:
#                 if start_time and now_time < start_time:
#                     return "scheduled"

#             if end_date == today:
#                 if end_time and now_time > end_time:
#                     return "completed"

#             return "live"

#     return "scheduled"
def get_ad_status(data):
    """
    Rules:
    ✅ Today OR future date → live
    ✅ Previous date → scheduled
    """

    ad_date = data.get("ad_date")

    if not ad_date:
        return "scheduled"

    # Convert string date if needed
    if isinstance(ad_date, str):
        ad_date = date.fromisoformat(ad_date)

    today = date.today()

    # ✅ Today or future
    if ad_date >= today:
        return "live"

    # ✅ Past date
    return "scheduled"

class AdvertisementCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]
 
    # =========================
    # 🔹 CREATE (POST)
    # =========================
    def post(self, request):
        data = request.data.copy()

        # 🔥 Auto set status
        data["ad_status"] = get_ad_status(data)

        serializer = AdvertisementSerializer(data=data)

        if serializer.is_valid():
            serializer.save(created_by=request.user)

            return Response(
                {
                    "message": "Advertisement created successfully",
                    "data": serializer.data
                },
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    # =========================
    # 🔹 UPDATE (PUT)
    # =========================
    def put(self, request, ad_id):
        ad = get_object_or_404(Advertisement, id=ad_id)

        data = request.data.copy()

        # 🔥 Recalculate status on update
        data["ad_status"] = get_ad_status(data)

        serializer = AdvertisementSerializer(
            ad,
            data=data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()

            return Response(
                {
                    "message": "Advertisement updated successfully",
                    "data": serializer.data
                },
                status=status.HTTP_200_OK
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

    # =========================
    # 🔹 GET (LIST + SINGLE)
    # =========================
    def get(self, request, ad_id=None):
        try:
            # =========================
            # 🔹 SINGLE
            # =========================
            if ad_id:
                ad = get_object_or_404(Advertisement, id=ad_id)

                # 🔥 Recalculate status
                data = {
                    "ad_date": ad.ad_date,
                    # "ad_end_date": ad.ad_end_date,
                    # "ad_start_time": ad.ad_start_time,
                    # "ad_end_time": ad.ad_end_time,
                }

                new_status = get_ad_status(data)

                # ✅ Update only if changed
                if ad.ad_status != new_status:
                    ad.ad_status = new_status
                    ad.save(update_fields=["ad_status"])

                serializer = AdvertisementSerializer(ad)

                return Response({
                    "message": "Advertisement fetched successfully",
                    "data": serializer.data
                })

            # =========================
            # 🔹 LIST ALL
            # =========================
            ads = Advertisement.objects.all().order_by("created_at")

            updated_ads = []
            for ad in ads:

                # 🔥 Recalculate status
                data = {
                    "ad_date": ad.ad_date,
                    # "ad_end_date": ad.ad_end_date,
                    # "ad_start_time": ad.ad_start_time,
                    # "ad_end_time": ad.ad_end_time,
                }

                new_status = get_ad_status(data)

                # ✅ Update only if changed
                if ad.ad_status != new_status:
                    ad.ad_status = new_status
                    ad.save(update_fields=["ad_status"])

                updated_ads.append(ad)

            serializer = AdvertisementSerializer(updated_ads, many=True)

            return Response({
                "message": "Advertisements fetched successfully",
                "count": len(serializer.data),
                "data": serializer.data
            })

        except Exception as e:
            return Response({
                "message": "Something went wrong",
                "error": str(e)
            }, status=500)
            
class AdvertisementDashboardCountAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            counts = Advertisement.objects.aggregate(

                # 🔹 Total Ads
                total_ads=Count("id"),

                # 🔹 Live (Active)
                live_ads=Count(
                    "id",
                    filter=Q(ad_status="live")
                ),

                # 🔹 Scheduled
                scheduled_ads=Count(
                    "id",
                    filter=Q(ad_status="scheduled")
                ),

                # 🔹 Completed
                completed_ads=Count(
                    "id",
                    filter=Q(ad_status="completed")
                ),
            )

            return Response({
                "message": "Advertisement counts fetched successfully",
                "data": {
                    "total_ads": counts["total_ads"],
                    "live_ads": counts["live_ads"],
                    "scheduled_ads": counts["scheduled_ads"],
                    "completed_ads": counts["completed_ads"],
                }
            })

        except Exception as e:
            return Response({
                "message": "Something went wrong",
                "error": str(e)
            }, status=500)
            
              
# ============================ Certificate Views ============================


# class GenerateCertificateAPIView(APIView):

#     @staticmethod
#     def trim_whitespace(im):
#         # Convert to RGBA to preserve transparency
#         if im.mode != 'RGBA':
#             im = im.convert('RGBA')

#         # Get bounding box of non-empty pixels
#         bbox = im.getbbox()
#         if bbox:
#             im = im.crop(bbox)
#         return im

#     def post(self, request):
#         participant_ids = request.data.get("participant_ids", [])

#         if not participant_ids:
#             return Response({
#                 "success": False,
#                 "error": "participant_ids is required"
#             }, status=400)

#         certificates = []

#         for pid in participant_ids:
#             participant = HandHoldingParticipant.objects.filter(
#                 id=pid
#             ).select_related("user").first()

#             if not participant or not participant.user:
#                 continue

#             user = participant.user

#             # =========================
#             # 🎯 LOAD TEMPLATE
#             # =========================
#             template_path = os.path.join(settings.MEDIA_ROOT, "certificate-template.jpeg")
#             if not os.path.exists(template_path):
#                 return Response({
#                     "success": False,
#                     "error": f"Template not found at {template_path}"
#                 }, status=400)

#             image = Image.open(template_path)

#             # Always use RGB for certificates
#             if image.mode != 'RGB':
#                 image = image.convert('RGB')

#             draw = ImageDraw.Draw(image)
            
#             # =========================
#             # 📍 COLORS
#             # =========================
#             text_color = (252, 252, 200)  # Black text for name and date

#             # =========================
#             # 🔤 FONT - ARIAL BOLD FOR NAME
#             # =========================
#             try:
#                 # Use Arial Bold for the name (professional look)
#                 name_font = ImageFont.truetype("C:/Windows/Fonts/times.ttf", 80)
#             except:
#                 try:
#                     # Fallback to regular Arial if Bold not available
#                     name_font = ImageFont.truetype("C:/Windows/Fonts/times.ttf", 80)
#                 except:
#                     try:
#                         # Fallback for Linux/Mac
#                         name_font = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf", 80)
#                     except:
#                         name_font = ImageFont.load_default()

#             # =========================
#             # 🔤 DATE FONT
#             # =========================
#             try:
#                 date_font = ImageFont.truetype("C:/Windows/Fonts/timesbd.ttf", 45)
#             except:
#                 try:
#                     date_font = ImageFont.truetype("/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf", 45)
#                 except:
#                     date_font = ImageFont.load_default()

#             # =========================
#             # 🧑 DATA
#             # =========================
#             full_name = f"{user.first_name} {user.last_name}".strip()
#             if not full_name:
#                 full_name = user.email.split('@')[0] if user.email else f"Participant_{pid}"
            
#             today_date = timezone.now().strftime("%d %B %Y")

#             # =========================
#             # 📍 POSITIONS
#             # =========================
#             img_width, img_height = image.size
#             center_x = img_width // 2
            
#             # Name position - adjust this value to move name up/down
#             name_y = 805  # Increase to move down, decrease to move up
#             date_y = 960  # Date position
            
#             # Draw name (single draw to avoid duplication)
#             draw.text(
#                 (center_x, name_y), 
#                 full_name, 
#                 font=name_font, 
#                 fill=text_color,
#                 anchor="mm"
#             )

#             # Draw date
#             draw.text(
#                 (center_x, date_y), 
#                 today_date, 
#                 font=date_font, 
#                 fill=text_color,
#                 anchor="mm"
#             )

#             # =========================
#             # ✂️ TRIM WHITE/TRANSPARENT BORDERS
#             # =========================
#             image = self.trim_whitespace(image)

#             # Convert RGBA → RGB before saving as JPEG
#             if image.mode == "RGBA":
#                 image = image.convert("RGB")

#             # =========================
#             # 💾 SAVE IMAGE
#             # =========================
#             buffer = io.BytesIO()
#             image.save(buffer, format="JPEG", quality=95)
#             buffer.seek(0)

#             file_name = f"certificate_participant_{pid}_{int(timezone.now().timestamp())}.jpeg"

#             certificate, _ = Certificate.objects.get_or_create(
#                 user=user,
#                 program_type="handholding"
#             )

#             certificate.certificate_file.save(
#                 file_name,
#                 ContentFile(buffer.read()),
#                 save=False
#             )

#             certificate.certificate_status = "issued"
#             certificate.issued_at = timezone.now()
#             certificate.save()

#             certificates.append({
#                 "participant_id": pid,
#                 "user": user.id,
#                 "name": full_name,
#                 "certificate_file": request.build_absolute_uri(
#                     certificate.certificate_file.url
#                 )
#             })

#         return Response({
#             "success": True,
#             "message": "Certificates generated successfully",
#             "data": certificates
#         }, status=201)

class CertificateTemplateAPIView(APIView):
    
    def get(self, request):
        try:
            templates = CertificateTemplate.objects.all().order_by("created_at")

            serializer = CertificateTemplateSerializer(
                templates,
                many=True,
                context={"request": request}
            )

            return Response({
                "success": True,
                "count": len(serializer.data),
                "data": serializer.data
            }, status=200)

        except Exception as e:
            return Response({
                "success": False,
                "message": "Failed to fetch templates",
                "error": str(e)
            }, status=500)

    def post(self, request):
        serializer = CertificateTemplateSerializer(data=request.data, context={"request": request})

        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "data": serializer.data
            }, status=201)

        return Response({
            "success": False,
            "errors": serializer.errors
        }, status=400)
        
    def put(self, request, pk):
        try:
            template = CertificateTemplate.objects.get(id=pk)
        except CertificateTemplate.DoesNotExist:
            return Response({
                "success": False,
                "message": "Template not found"
            }, status=404)

        try:
            serializer = CertificateTemplateSerializer(
                template,
                data=request.data,
                partial=True,  # ✅ allows partial update
                context={"request": request}
            )

            if serializer.is_valid():
                serializer.save()
                return Response({
                    "success": True,
                    "message": "Template updated successfully",
                    "data": serializer.data
                }, status=200)

            return Response({
                "success": False,
                "errors": serializer.errors
            }, status=400)

        except Exception as e:
            return Response({
                "success": False,
                "message": "Something went wrong",
                "error": str(e)
            }, status=500)


class GenerateCertificateAPIView(APIView):

    def post(self, request):

        template_id = request.data.get("template_id")
        participant_ids = request.data.get("participant_ids", [])

        if not template_id:
            return Response({"error": "template_id is required"}, status=400)

        if not participant_ids:
            return Response({"error": "participant_ids is required"}, status=400)

        # =========================
        # 🎯 GET TEMPLATE
        # =========================
        template = get_object_or_404(CertificateTemplate, id=template_id)

        template_path = template.template_file.path

        if not os.path.exists(template_path):
            return Response({"error": "Template file not found"}, status=400)

        # parse color
        text_color = tuple(map(int, template.text_color.split(",")))

        certificates = []

        for pid in participant_ids:

            participant = HandHoldingParticipant.objects.filter(
                id=pid
            ).select_related("user").first()

            if not participant or not participant.user:
                continue

            user = participant.user
            
            # =========================
            # 💰 CHECK PAYMENT STATUS
            # =========================
            is_fully_paid = Payment.objects.filter(
                user=user,
                status="fully_paid"
            ).exists()

            if not is_fully_paid:
                certificates.append({
                    "participant_id": pid,
                    "error": "Payment not completed (must be fully paid)"
                })
                continue

            # =========================
            # 🖼 LOAD TEMPLATE
            # =========================
            image = Image.open(template_path)

            if image.mode != 'RGB':
                image = image.convert('RGB')

            draw = ImageDraw.Draw(image)

            # =========================
            # 🔤 FONT
            # =========================
            try:
                name_font = ImageFont.truetype("C:/Windows/Fonts/times.ttf", template.name_font_size)
                date_font = ImageFont.truetype("C:/Windows/Fonts/timesbd.ttf", template.date_font_size)
            except:
                name_font = ImageFont.load_default()
                date_font = ImageFont.load_default()

            # =========================
            # 🧑 DATA (REMOVE PREFIX)
            # =========================
            first_name = user.first_name or ""
            last_name = user.last_name or ""

            # ✅ Remove prefix like "HH - ", "ABC - "
            if " - " in first_name:
                first_name = first_name.split(" - ", 1)[1]

            full_name = f"{first_name} {last_name}".strip()

            # fallback
            if not full_name:
                full_name = user.email.split("@")[0]

            today_date = timezone.now().strftime("%d %B %Y")

            # =========================
            # 📍 POSITIONS
            # =========================
            img_width, _ = image.size

            name_x = template.name_x or img_width // 2
            date_x = template.date_x or img_width // 2

            # =========================
            # ✍️ DRAW TEXT
            # =========================
            draw.text(
                (name_x, template.name_y),
                full_name,
                font=name_font,
                fill=text_color,
                anchor="mm"
            )

            draw.text(
                (date_x, template.date_y),
                today_date,
                font=date_font,
                fill=text_color,
                anchor="mm"
            )

            # =========================
            # 💾 SAVE
            # =========================
            buffer = io.BytesIO()
            image.save(buffer, format="JPEG", quality=95)
            buffer.seek(0)

            file_name = f"certificate_{pid}_{int(timezone.now().timestamp())}.jpeg"

            certificate, _ = Certificate.objects.get_or_create(
                user=user,
                program_type="handholding"
            )

            certificate.certificate_file.save(
                file_name,
                ContentFile(buffer.read()),
                save=False
            )

            certificate.certificate_status = "issued"
            certificate.issued_at = timezone.now()
            certificate.save()
            
            # ✅ UPDATE PARTICIPANT CERTIFICATE STATUS
            participant.certificate_issued = True
            participant.save(update_fields=["certificate_issued"])

            certificates.append({
                "participant_id": pid,
                "user": user.id,
                "name": full_name,
                "certificate_file": request.build_absolute_uri(
                    certificate.certificate_file.url
                )
            })

        # return Response({
        #     "success": True,
        #     "message": "Certificates generated successfully",
        #     "data": certificates
        # }, status=201)
        success_count = len([c for c in certificates if "certificate_file" in c])
        error_count = len([c for c in certificates if "error" in c])

        # 🎯 Decide message + status
        if success_count == 0 and error_count > 0:
            return Response({
                "success": False,
                "message": "Payment not completed for selected participants",
                "data": certificates
            }, status=400)

        elif success_count > 0 and error_count > 0:
            return Response({
                "success": True,
                "message": "Some certificates generated, some failed due to payment issues",
                "data": certificates
            }, status=201)

        else:
            return Response({
                "success": True,
                "message": "Certificates generated successfully",
                "data": certificates
            }, status=201)
        
class IssuedCertificateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            certificates = (
                Certificate.objects
                .select_related("user", "template")
                .filter(
                    program_type="handholding",
                    certificate_status="issued"
                )
                .order_by("-issued_at")
            )

            data = []

            for cert in certificates:
                user = cert.user

                # Get participant
                participant = HandHoldingParticipant.objects.filter(
                    user=user
                ).first()

                # ✅ Session counts
                total_sessions = 0
                completed_sessions = 0

                if participant:
                    sessions_qs = HandHoldingParticipantSession.objects.filter(
                        handholding_participant=participant
                    )

                    total_sessions = sessions_qs.count()

                    completed_sessions = sessions_qs.filter(
                        status="completed"
                    ).count()

                data.append({
                    "certificate_id": cert.id,
                    "user_id": user.id if user else None,
                    "name": f"{user.first_name} {user.last_name}" if user else None,
                    "email": user.email if user else None,
                    "phone": getattr(user, "phone", None),

                    "participant_id": participant.id if participant else None,

                    # ✅ Sessions info added
                    "total_sessions": total_sessions,
                    "completed_sessions": completed_sessions,

                    "template_id": cert.template.id if cert.template else None,
                    "template_name": cert.template.name if cert.template else None,

                    "certificate_status": cert.certificate_status,
                    "issued_at": cert.issued_at,

                    "certificate_file": request.build_absolute_uri(
                        cert.certificate_file.url
                    ) if cert.certificate_file else None
                })

            return Response({
                "success": True,
                "count": len(data),
                "data": data
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                "success": False,
                "message": "Failed to fetch issued certificates",
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)     
        
class DashboardStatsAPIView(APIView):

    def get(self, request):

        # 1️⃣ Total Sessions Count
        total_sessions = HandHoldingSession.objects.count()

        # 2️⃣ Active Users (Certificate Pending)
        # active_users_count = HandHoldingParticipant.objects.filter(
        #     total_sessions__isnull=False,
        #     completed_sessions__isnull=False,
        #     total_sessions=F('completed_sessions'),   # ✅ sessions completed
        #     user__certificate__certificate_status="pending",
        #     user__certificate__program_type="handholding"
        # ).values("user").distinct().count()
        active_users_count = HandHoldingParticipant.objects.values("user").distinct().count()

        # 3️⃣ Completed Users (All Sessions Completed)
        completed_users_count = HandHoldingParticipant.objects.filter(
            total_sessions=F('completed_sessions')
        ).count()

        # 4️⃣ Certificate Issued Count
        certificate_issued_count = Certificate.objects.filter(
            certificate_status="issued",
            program_type="handholding"
        ).values("user").distinct().count()

        return Response({
            "total_sessions": total_sessions,
            "active_users_count": active_users_count,
            "completed_users_count": completed_users_count,
            "certificate_issued_count": certificate_issued_count
        })
        
# class PendingCertificateParticipantsAPIView(APIView):
#     permission_classes = [IsAuthenticated]

#     def get(self, request):
#         try:

#             participants = HandHoldingParticipant.objects.annotate(
#                 total_count=Count('sessions', distinct=True),
#                 completed_count=Count(
#                     'sessions',
#                     filter=Q(sessions__status__iexact='completed'),
#                     distinct=True
#                 )
#             ).filter(
#                 total_count__gt=0,                 # must have sessions
#                 total_count=F('completed_count'),  # ALL sessions completed
#                 # certificate_issued=False
#             ).filter(
#                 Q(certificate_issued=False) | Q(certificate_issued__isnull=True)
#             ).select_related("user")

#             data = []

#             for p in participants:
#                 user = p.user

#                 data.append({
#                     "participant_id": p.id,
#                     "user_id": user.id if user else None,
#                     "name": f"{user.first_name} {user.last_name}" if user else None,
#                     "email": user.email if user else None,
#                     "mobile": getattr(p, "mobile", None),

#                     "total_sessions": p.total_count,
#                     "completed_sessions": p.completed_count,

#                     "certificate_issued": p.certificate_issued,
#                     "status": p.status,
#                     "created_at": p.created_at
#                 })

#             return Response({
#                 "success": True,
#                 "count": len(data),
#                 "data": data
#             }, status=status.HTTP_200_OK)

#         except Exception as e:
#             return Response({
#                 "success": False,
#                 "message": "Failed to fetch participants",
#                 "error": str(e)
#             }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PendingCertificateParticipantsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            participants = HandHoldingParticipant.objects.annotate(
                total_sessions_count=Count(
                    'sessions__session_no',
                    distinct=True
                ),
                completed_sessions_count=Count(
                    'sessions__session_no',
                    filter=Q(sessions__status__iexact='completed'),
                    distinct=True
                )
            ).filter(
                total_sessions_count__gt=0,
                total_sessions_count=F('completed_sessions_count'),
                certificate_issued=False
            ).select_related("user")

            data = []

            for p in participants:
                user = p.user

                data.append({
                    "participant_id": p.id,
                    "user_id": user.id if user else None,
                    "name": f"{user.first_name} {user.last_name}" if user else None,
                    "email": user.email if user else None,
                    "mobile": p.mobile,

                    "total_sessions": p.total_sessions_count,
                    "completed_sessions": p.completed_sessions_count,

                    "certificate_issued": p.certificate_issued,
                    "created_at": p.created_at
                })

            return Response({
                "success": True,
                "count": len(data),
                "data": data
            })

        except Exception as e:
            return Response({
                "success": False,
                "error": str(e)
            }, status=500)









class ParticipantCertificateAPIView(APIView):

    def get(self, request, participant_id):

        try:
            # 🔹 Get participant
            participant = get_object_or_404(
                HandHoldingParticipant.objects.select_related("user"),
                id=participant_id
            )
            user = participant.user

            # 🔹 Get certificates
            certificates = Certificate.objects.filter(
                user=user
            ).order_by("-issued_at")

            serializer = CertificateSerializer(
                certificates,
                many=True,
                context={"request": request}
            )

            return Response({
                "message": "Certificates fetched successfully",
                "participant_id": participant_id,
                "total_certificates": len(serializer.data),
                "data": serializer.data
            })

        except Exception as e:
            return Response({
                "message": "Something went wrong",
                "error": str(e)
            }, status=500)
            
class CertificateDashboardCountAPIView(APIView):

    def get(self, request):
        try:

            # =========================
            # 1️⃣ Pending Certificate Users
            # (All sessions completed + certificate not issued)
            # =========================
            pending_count = HandHoldingParticipant.objects.annotate(

                total_sessions_count=Count(
                    'sessions__session_no',
                    distinct=True
                ),

                completed_sessions_count=Count(
                    'sessions__session_no',
                    filter=Q(sessions__status__iexact='completed'),
                    distinct=True
                )

            ).filter(
                total_sessions_count__gt=0,
                total_sessions_count=F('completed_sessions_count')   # ✅ ALL session_no completed
            ).filter(
                certificate_issued=False
            ).count()

            # =========================
            # 2️⃣ Certificate Template Count
            # =========================
            template_count = CertificateTemplate.objects.count()

            # =========================
            # 3️⃣ Issued Certificate Users
            # =========================
            issued_count = Certificate.objects.filter(
                certificate_status="issued",
                program_type="handholding"
            ).values("user").distinct().count()

            return Response({
                "success": True,
                "data": {
                    "pending_certificate_users": pending_count,
                    "certificate_templates": template_count,
                    "issued_certificate_users": issued_count
                }
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                "success": False,
                "message": "Failed to fetch dashboard counts",
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
            
# ============================== Event Models (for reference) ==============================

class EventCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def update_event_status(self, event):
        try:
            # ✅ Get today's date (safe)
            today = timezone.now().date()

            # ✅ Get current time (no timezone issues)
            now_time = datetime.now().time()

            # ✅ Pick correct date
            event_date = event.event_end_date if event.event_end_date else event.event_start_date

            # ✅ Pick correct time
            event_time_str = event.event_end_time if event.event_end_time else event.event_start_time

            # =========================
            # 🔹 Convert string → time
            # =========================
            event_time = None
            if event_time_str:
                try:
                    event_time = datetime.strptime(event_time_str.strip(), "%I:%M %p").time()
                except Exception:
                    event_time = None  # fallback safe

            # =========================
            # 🔥 STATUS LOGIC
            # =========================
            if not event_date:
                return  # no date → skip

            # ✅ Past date → completed
            if event_date < today:
                if event.session_status != "completed":
                    event.session_status = "completed"
                    event.save(update_fields=["session_status"])
                return

            # ✅ Same day → check time
            if event_date == today:
                if event_time:
                    if event_time < now_time:
                        if event.session_status != "completed":
                            event.session_status = "completed"
                            event.save(update_fields=["session_status"])
                else:
                    # No time → assume completed
                    if event.session_status != "completed":
                        event.session_status = "completed"
                        event.save(update_fields=["session_status"])

        except Exception as e:
            print("Event status update error:", str(e))

    # =========================
    # 🔹 COMMON VALIDATION METHOD
    # =========================
    def validate_slot_and_booking(self, data, exclude_event_id=None):

        event_start_date = data.get("event_start_date")
        start_time = data.get("event_start_time")
        end_time = data.get("event_end_time")
        name = data.get("concerned_person_name")
        email = data.get("concerned_person_email")

        event_date = datetime.fromisoformat(event_start_date).date()

        slot = Slot.objects.select_related("counsellor").filter(
            date=event_date,
            start_time=start_time,
            # end_time=end_time,
            is_deleted=False
        ).first()

        if not slot:
            return None, None

        # =========================
        # 🔥 BOOKING CHECK (STRICT)
        # =========================
        existing_booking = Booking.objects.select_related("slot__counsellor").filter(
            slot__date=event_date,
            slot__start_time=start_time,
            # slot__end_time=end_time,
            status__in=["booked", "pending", "rescheduled"]
        ).first()

        if existing_booking:
            counsellor = existing_booking.slot.counsellor

            if counsellor:
                full_name = f"{counsellor.first_name} {counsellor.last_name}".strip().lower()

                input_name = (name or "").strip().lower()
                input_email = (email or "").strip().lower()
                counsellor_email = (counsellor.email or "").strip().lower()

                is_same_person = (
                    (input_email and input_email == counsellor_email) or
                    (input_name and (
                        input_name == counsellor.first_name.lower() or
                        input_name == counsellor.last_name.lower() or
                        input_name == full_name
                    ))
                )

                if is_same_person:
                    return None, Response(
                        {
                            "message": "This counsellor already has a booking for the selected date and time.",
                            "details": {
                                "counsellor_name": full_name,
                                "email": counsellor.email,
                                "date": event_date,
                                # "time": f"{start_time} - {end_time}"
                                "time": f"{start_time} "
                            },
                            "error": "If you want to proceed with this event, please cancel the existing booking for this slot first."
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

        # =========================
        # 🔥 EVENT DUPLICATE CHECK
        # =========================
        existing_event = Event.objects.filter(
            event_start_date=event_date,
            event_start_time=start_time
        ).filter(
            Q(concerned_person_name=name) |
            Q(concerned_person_email=email)
        )

        if exclude_event_id:
            existing_event = existing_event.exclude(id=exclude_event_id)

        if existing_event.first():
            return None, Response(
                {
                    "message": "This person already has an event at the selected time.",
                    "details": {
                        "name": name,
                        "email": email,
                        "date": event_date,
                        "time": f"{start_time} - {end_time}"
                    }
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        return slot, None


    # =========================
    # 🔹 POST (CREATE)
    # =========================
    def post(self, request):
        data = request.data

        if not data.get("event_start_date") or not data.get("event_start_time") or not data.get("event_end_time"):
            return Response(
                {"message": "Date, start time and end time are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        slot, error = self.validate_slot_and_booking(data)
        if error:
            return error

        with transaction.atomic():
            event = Event.objects.create(
                event_type=data.get("event_type"),
                seminar_webinar_name=data.get("seminar_webinar_name"),
                concerned_person_name=data.get("concerned_person_name"),
                concerned_person_mobile=data.get("concerned_person_mobile"),
                concerned_person_email=data.get("concerned_person_email"),
                event_start_date=data.get("event_start_date"),
                event_end_date=data.get("event_end_date"),
                event_start_time=data.get("event_start_time"),
                event_end_time=data.get("event_end_time"),
                venue_type=data.get("venue_type"),
                event_mode=data.get("event_mode"),
                address=data.get("address"),
                is_paid=data.get("is_paid", False),
                amount=data.get("amount"),
                payment_type=data.get("payment_type"),
                payment_method=data.get("payment_method"),
                transaction_id=data.get("transaction_id"),
                registration_link=data.get("registration_link"),
                session_status="upcoming",
                conducted_by=request.user
            )

            # slot.is_available = False
            # slot.save(update_fields=["is_available"])

        return Response(
            {"message": "Event created successfully", "event_id": event.id},
            status=status.HTTP_201_CREATED
        )


    # =========================
    # 🔹 PUT (UPDATE)
    # =========================
    def put(self, request, event_id):
        try:
            event = get_object_or_404(Event, id=event_id)
            data = request.data

            if not data.get("event_start_date") or not data.get("event_start_time") or not data.get("event_end_time"):
                return Response(
                    {"message": "Date, start time and end time are required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # ✅ VALIDATE (exclude current event)
            slot, error = self.validate_slot_and_booking(data, exclude_event_id=event.id)
            if error:
                return error

            with transaction.atomic():

                # 🔹 UPDATE FIELDS
                event.event_type = data.get("event_type")
                event.seminar_webinar_name = data.get("seminar_webinar_name")
                event.concerned_person_name = data.get("concerned_person_name")
                event.concerned_person_mobile = data.get("concerned_person_mobile")
                event.concerned_person_email = data.get("concerned_person_email")
                event.event_start_date = data.get("event_start_date")
                event.event_end_date = data.get("event_end_date")
                event.event_start_time = data.get("event_start_time")
                event.event_end_time = data.get("event_end_time")
                event.venue_type = data.get("venue_type")
                event.event_mode = data.get("event_mode")
                event.address = data.get("address")
                event.is_paid = data.get("is_paid", False)
                event.amount = data.get("amount")
                event.payment_type = data.get("payment_type")
                event.payment_method = data.get("payment_method")
                event.transaction_id = data.get("transaction_id")
                event.registration_link = data.get("registration_link")

                event.save()

                # 🔹 Update slot availability
                # slot.is_available = False
                # slot.save(update_fields=["is_available"])

            return Response(
                {"message": "Event updated successfully", "event_id": event.id},
                status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {
                    "message": "Something went wrong",
                    "error": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            ) 
            
    def get(self, request, event_id=None):
        try:

            # =========================
            # 🔹 SINGLE EVENT
            # =========================
            if event_id:
                event = get_object_or_404(Event, id=event_id)
                
                self.update_event_status(event)

                return Response(
                    {
                        "message": "Event fetched successfully",
                        "data": {
                            "id": event.id,
                            "event_type": event.event_type,
                            "seminar_webinar_name": event.seminar_webinar_name,
                            "concerned_person_name": event.concerned_person_name,
                            "concerned_person_mobile": event.concerned_person_mobile,
                            "concerned_person_email": event.concerned_person_email,
                            "event_start_date": event.event_start_date,
                            "event_end_date": event.event_end_date,
                            "event_start_time": event.event_start_time,
                            "event_end_time": event.event_end_time,
                            "venue_type": event.venue_type,
                            "event_mode": event.event_mode,
                            "address": event.address,
                            "is_paid": event.is_paid,
                            "amount": event.amount,
                            "payment_type": event.payment_type,
                            "payment_method": event.payment_method,
                            "transaction_id": event.transaction_id,
                            "session_status": event.session_status,
                            "registration_link": event.registration_link,
                            "conducted_by": event.conducted_by.id if event.conducted_by else None,
                            "created_at": event.created_at,
                        }
                    },
                    status=status.HTTP_200_OK
                )

            # =========================
            # 🔹 LIST ALL EVENTS
            # =========================
            events = Event.objects.all().order_by("created_at")

            data = []
            for event in events:
                
                self.update_event_status(event)
                
                data.append({
                    "id": event.id,
                    "event_type": event.event_type,
                    "seminar_webinar_name": event.seminar_webinar_name,
                    "concerned_person_name": event.concerned_person_name,
                    "concerned_person_mobile": event.concerned_person_mobile,
                    "concerned_person_email": event.concerned_person_email,
                    "event_start_date": event.event_start_date,
                    "event_end_date": event.event_end_date,
                    "event_start_time": event.event_start_time,
                    "event_end_time": event.event_end_time,
                    "event_mode": event.event_mode,
                    "venue_type": event.venue_type,
                    "event_mode": event.event_mode,
                    "address": event.address,
                    "is_paid": event.is_paid,
                    "amount": event.amount,
                    "payment_type": event.payment_type,
                    "payment_method": event.payment_method,
                    "transaction_id": event.transaction_id,
                    "session_status": event.session_status,
                    "registration_link": event.registration_link,
                })

            return Response(
                {
                    "message": "Events fetched successfully",
                    "count": len(data),
                    "data": data
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {
                    "message": "Something went wrong",
                    "error": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )         
                
class SendReminderByEventAPIView(APIView):

    def post(self, request, event_id):
        try:
            if not Event.objects.filter(id=event_id).exists():
                return Response(
                    {"error": "Invalid event_id"},
                    status=status.HTTP_404_NOT_FOUND
                )

            send_event_reminder_by_id.delay(event_id)

            return Response({
                "message": f"Reminder triggered for event {event_id}"
            })

        except Exception as e:
            return Response({
                "error": str(e)
            }, status=500)
        
from django.db.models.functions import Coalesce, Lower, Trim
class EventDashboardCountAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # =========================
            # 🔹 MAIN COUNTS
            # =========================
            counts = Event.objects.aggregate(
                total_events=Count("id"),
                upcoming_events=Count("id", filter=Q(session_status="upcoming")),
                completed_events=Count("id", filter=Q(session_status="completed")),
                paid_events=Count("id", filter=Q(is_paid=True)),
                free_events=Count("id", filter=Q(is_paid=False)),
            )

            # =========================
            # 🔹 UPCOMING EVENT TYPE COUNT
            # =========================
            upcoming_qs = Event.objects.filter(session_status="upcoming").annotate(
                clean_type=Lower(Trim("event_type"))
            )

            grouped = upcoming_qs.values("clean_type").annotate(count=Count("id"))

            # 🔥 DEBUG (keep temporarily)
            print("DEBUG EVENT TYPES:", list(grouped))

            # Convert to dict
            type_map = {}
            for item in grouped:
                key = item["clean_type"] or "unknown"
                type_map[key] = item["count"]

            upcoming_event_type = [
                {
                    "type": "seminar",
                    "count": type_map.get("seminar", 0)
                },
                {
                    "type": "webinar",
                    "count": type_map.get("webinar", 0)
                }
            ]
                        # =========================
            # 🔹 SESSION TYPE ARRAY
            # =========================
            session_type = [
                {"type": "paid", "count": counts["paid_events"]},
                {"type": "free", "count": counts["free_events"]},
            ]

            # =========================
            # 🔹 FINAL RESPONSE
            # =========================
            return Response({
                "message": "Event counts fetched successfully",
                "data": {
                    "total_events": counts["total_events"],

                    "upcoming_events": {
                        "total": counts["upcoming_events"],
                        "event_type": upcoming_event_type
                    },

                    "completed_events": counts["completed_events"],

                    "session_type": session_type,
                    "total_session_type": (
                        counts["paid_events"] + counts["free_events"]
                    )
                }
            })

        except Exception as e:
            return Response({
                "message": "Something went wrong",
                "error": str(e)
            }, status=500)                
                
class MarkEventCompletedAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, event_id):
        try:
            event = get_object_or_404(Event, id=event_id)

            # ✅ Only allow if event is upcoming
            if event.session_status != "upcoming":
                return Response(
                    {"message": "Only upcoming events can be marked as completed"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # ✅ Update status
            event.session_status = "completed"
            event.save(update_fields=["session_status"])

            return Response({
                "message": "Event marked as completed successfully",
                "event_id": event.id,
                "status": event.session_status
            })

        except Exception as e:
            return Response({
                "message": "Something went wrong",
                "error": str(e)
            }, status=500)               
                
                
                
                