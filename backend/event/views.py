from django.shortcuts import get_object_or_404, render

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.db import models
from django.db.models import F, Count, Q, OuterRef, Subquery
from datetime import datetime, timedelta
from django.db import transaction
from django.utils import timezone
from django.db.models import Max
from django.core.files.base import ContentFile
from PIL import Image, ImageDraw, ImageFont, ImageOps
import io
import os
from django.conf import settings


from accounts.models import Role, User
from event.utils import get_font_path
from counselling_slot.models import Booking, Slot
from event.serializers import AdvertisementSerializer, CertificateTemplateSerializer, HandHoldingParticipantSerializer, HandHoldingParticipantSessionSerializer, HandHoldingSessionSerializer
from program_package.models import Program
from event.models import Certificate, CertificateTemplate, HandHoldingParticipant, HandHoldingParticipantSession, HandHoldingSession
from payment.models import Payment
from lead_registration.models import Lead

# ===================== HandHolding Registration API =====================

# class HandHoldingRegisterAPIView(APIView):

#     def post(self, request):
#         data = request.data

#         # ✅ Get Hand Holding Program
#         try:
#             program = Program.objects.get(name__iexact="Hand Holding Program")
#         except Program.DoesNotExist:
#             return Response(
#                 {"error": "Hand Holding program not found"},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         # ✅ Create Lead
#         lead = Lead.objects.create(
#             first_name=data.get("first_name"),
#             last_name=data.get("last_name"),
#             email=data.get("email"),
#             phone=data.get("mobile"),
#             source="website",
#             status="enquiry",
#             program=program   # 👈 AUTO SET HERE
#         )

#         # ✅ Create Payment
#         payment = None
#         if request.FILES.get("payment"):
#             payment = Payment.objects.create(
#                 proof_file=request.FILES.get("payment")
#             )

#         # ✅ Create Participant
#         participant = HandHoldingParticipant.objects.create(
#             user=None,
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
#             "participant_id": participant.id
#         }, status=status.HTTP_201_CREATED)
        
#     # ✅ GET API (NEW)
#     def get(self, request):

#         participants = HandHoldingParticipant.objects.all().order_by("-created_at")

#         data = []

#         for p in participants:
#             data.append({
#                 "participant_id": p.id,
#                 "email": p.email,
#                 "mobile": p.mobile,
#                 "full_address": p.full_address,
#                 "city": p.city,
#                 "preferred_counselling_mode": p.preferred_counselling_mode,
#                 "status": p.status,
#                 "total_sessions": p.total_sessions,
#                 "completed_sessions": p.completed_sessions,

#                 # ✅ File URLs
#                 "photo": p.photo.url if p.photo else None,
#                 "resume": p.resume_file.url if p.resume_file else None,

#                 # ✅ Payment file
#                 "payment": p.payment.payment_file.url if p.payment else None,

#                 # ✅ Created date
#                 "created_at": p.created_at
#             })

#         return Response({
#             "count": len(data),
#             "data": data
#         }, status=status.HTTP_200_OK)
 
class HandHoldingRegisterAPIView(APIView):

    def post(self, request):
        data = request.data

        # =========================
        # ✅ Get Hand Holding Program
        # =========================
        try:
            program = Program.objects.get(name__iexact="Hand Holding Program")
        except Program.DoesNotExist:
            return Response(
                {"error": "Hand Holding program not found"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # =========================
        # ✅ Get Role (HANDHOLDING)
        # =========================
        try:
            role = Role.objects.get(name__iexact="handholding")
        except Role.DoesNotExist:
            return Response(
                {"error": "Handholding role not found"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # =========================
        # ✅ CREATE USER
        # =========================
        user = User.objects.create(
            first_name=data.get("first_name"),
            last_name=data.get("last_name"),
            email=data.get("email"),
            phone=data.get("mobile"),
            role=role
        )

        # Optional: set password
        if data.get("password"):
            user.set_password(data.get("password"))
            user.save()

        # =========================
        # ✅ Create Lead
        # =========================
        lead = Lead.objects.create(
            first_name=data.get("first_name"),
            last_name=data.get("last_name"),
            email=data.get("email"),
            phone=data.get("mobile"),
            source="website",
            status="enquiry",
            program=program
        )

        # =========================
        # ✅ Create Payment
        # =========================
        payment = None
        if request.FILES.get("payment"):
            payment = Payment.objects.create(
                proof_file=request.FILES.get("payment"),
                user=user   # ✅ IMPORTANT (link user)
            )

        # =========================
        # ✅ Create Participant
        # =========================
        participant = HandHoldingParticipant.objects.create(
            user=user,  # ✅ LINK USER HERE
            payment=payment,
            email=data.get("email"),
            mobile=data.get("mobile"),
            full_address=data.get("full_address"),
            city=data.get("city"),
            preferred_counselling_mode=data.get("preferred_counselling_mode"),
            photo=request.FILES.get("photo"),
            resume_file=request.FILES.get("resume"),
        )

        return Response({
            "message": "Registration successful",
            "lead_id": lead.id,
            "user_id": user.id,
            "participant_id": participant.id
        }, status=status.HTTP_201_CREATED)
 
 
        
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
        
    
class BookedRescheduledSlotsByDateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, date):

        response_data = []
        used_slot_ids = set()  # ✅ prevent duplicates

        # ============================================
        # 🔹 NORMAL BOOKINGS
        # ============================================
        bookings = Booking.objects.select_related("slot", "student__user").filter(
            slot__date=date,
            status__in=["booked", "rescheduled"],
            slot__is_deleted=False
        )

        for booking in bookings:
            slot = booking.slot
            if not slot:
                continue

            used_slot_ids.add(slot.id)  # ✅ mark used

            response_data.append({
                "type": "normal",
                "slot_id": slot.id,
                "date": slot.date,
                "start_time": slot.start_time,
                "end_time": slot.end_time,
                "status": booking.status,
                "student_id": booking.student.id,
                "student_name": f"{booking.student.user.first_name} {booking.student.user.last_name}",
                "email": booking.student.user.email,
                "phone": booking.student.user.phone,
                "meeting_link": booking.meeting_link
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

            response_data.append({
                "type": "handholding",
                "slot_id": session_slot.id,
                "date": session_slot.date,
                "start_time": session_slot.start_time,
                "end_time": session_slot.end_time,
                "status": session.status,
                "participant_id": participant.id if participant else None,
                "session_no": session.session_no,
                "student_id": user.id if user else None,
                "student_name": f"{user.first_name} {user.last_name}" if user else None,
                "email": user.email if user else None,
                "phone": user.phone if user else None,
                "counsellor_id": session.conducted_by.id if session.conducted_by else None,
                "counsellor_name": (
                    f"{session.conducted_by.first_name} {session.conducted_by.last_name}"
                    if session.conducted_by else None
                ),
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
        }, status=status.HTTP_200_OK) 
        
              
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
                slot = Slot.objects.select_related("counsellor").get(
                    id=slot_id,
                    is_available=True,
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
                session.slot = slot
                session.session_date = session_datetime
                session.status = "booked"
                session.conducted_by = slot.counsellor
                session.save()

                # =========================
                # 🔹 BLOCK SLOT
                # =========================
                slot.is_available = False
                slot.save(update_fields=["is_available"])

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

                    new_slot.is_available = False
                    new_slot.save(update_fields=["is_available"])

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
                        current_session.slot.is_available = True
                        current_session.slot.save(update_fields=["is_available"])

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
                    new_slot.save(update_fields=["is_available"])

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
                    current_session.slot.is_available = True
                    current_session.slot.save(update_fields=["is_available"])

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

class   ParticipantSessionListAPIView(APIView):
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
            if session.slot and session.slot.end_time:

                # ✅ convert string → time
                end_time_obj = datetime.strptime(session.slot.end_time, "%I:%M %p").time()

                # ✅ combine date + time (NAIVE)
                session_end_datetime = datetime.combine(
                    session.session_date.date(),
                    end_time_obj
                )

                # ✅ convert BOTH to naive (IMPORTANT FIX)
                now_naive = now.replace(tzinfo=None)

                # ✅ compare safely
                if now_naive >= (session_end_datetime - timedelta(minutes=30)):
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

        status_filter = request.GET.get("status")

        # ✅ Get participant
        participant = get_object_or_404(
            HandHoldingParticipant,
            id=participant_id
        )

        # =========================
        # 🔥 AUTO COMPLETE LOGIC
        # =========================
        now = timezone.now()

        today_sessions = HandHoldingParticipantSession.objects.select_related("slot").filter(
            handholding_participant=participant,
            session_date__date=now.date(),
            status__in=["booked", "rescheduled", "in_progress"]
        )

        for session in today_sessions:
            if session.slot and session.slot.end_time:

                end_time_obj = datetime.strptime(
                    session.slot.end_time, "%I:%M %p"
                ).time()

                session_end_datetime = datetime.combine(
                    session.session_date.date(),
                    end_time_obj
                )

                now_naive = now.replace(tzinfo=None)

                if now_naive >= (session_end_datetime - timedelta(minutes=30)):
                    session.status = "completed"
                    session.completed_at = now
                    session.save(update_fields=["status", "completed_at"])

        # =========================
        # ✅ FETCH ONLY THIS PARTICIPANT DATA
        # =========================
        sessions = HandHoldingParticipantSession.objects.select_related(
            "handholding_participant__user", "slot"
        ).filter(handholding_participant=participant)

        # =========================
        # 🔍 STATUS FILTER (SAME AS YOUR API)
        # =========================
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

        # =========================
        # ✅ SAME RESPONSE FORMAT
        # =========================
        serializer = HandHoldingParticipantSessionSerializer(
            sessions, many=True
        )

        return Response(serializer.data)
    

# ============================ Advertisement Views ============================

class AdvertisementCreateAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AdvertisementSerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(created_by=request.user)

            return Response(
                {
                    "message": "Advertisement created successfully",
                    "data": serializer.data
                },
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    
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
            templates = CertificateTemplate.objects.all().order_by("-created_at")

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
        active_users_count = Certificate.objects.filter(
            certificate_status="pending",
            program_type="handholding"
        ).values("user").distinct().count()

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