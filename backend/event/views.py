from django.shortcuts import render

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from accounts.models import User
from program_package.models import Program
from event.models import HandHoldingParticipant
from payment.models import Payment
from lead_registration.models import Lead

class HandHoldingRegisterAPIView(APIView):

    def post(self, request):
        data = request.data

        # ✅ Get Hand Holding Program
        try:
            program = Program.objects.get(name__iexact="Hand Holding Program")
        except Program.DoesNotExist:
            return Response(
                {"error": "Hand Holding program not found"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ✅ Create Lead
        lead = Lead.objects.create(
            first_name=data.get("first_name"),
            last_name=data.get("last_name"),
            email=data.get("email"),
            phone=data.get("mobile"),
            source="website",
            status="enquiry",
            program=program   # 👈 AUTO SET HERE
        )

        # ✅ Create Payment
        payment = None
        if request.FILES.get("payment"):
            payment = Payment.objects.create(
                payment_file=request.FILES.get("payment")
            )

        # ✅ Create Participant
        participant = HandHoldingParticipant.objects.create(
            user=None,
            payment=payment,
            email=data.get("email"),
            mobile=data.get("mobile"),
            full_address=data.get("full_address"),
            city=data.get("city"),
            mode=data.get("mode"),
            photo=request.FILES.get("photo"),
            resume_file=request.FILES.get("resume"),
        )

        return Response({
            "message": "Registration successful",
            "lead_id": lead.id,
            "participant_id": participant.id
        }, status=status.HTTP_201_CREATED)
        
    # ✅ GET API (NEW)
    def get(self, request):

        participants = HandHoldingParticipant.objects.all().order_by("-created_at")

        data = []

        for p in participants:
            data.append({
                "participant_id": p.id,
                "email": p.email,
                "mobile": p.mobile,
                "full_address": p.full_address,
                "city": p.city,
                "mode": p.mode,
                "status": p.status,
                "total_sessions": p.total_sessions,
                "completed_sessions": p.completed_sessions,

                # ✅ File URLs
                "photo": p.photo.url if p.photo else None,
                "resume": p.resume_file.url if p.resume_file else None,

                # ✅ Payment file
                "payment": p.payment.payment_file.url if p.payment else None,

                # ✅ Created date
                "created_at": p.created_at
            })

        return Response({
            "count": len(data),
            "data": data
        }, status=status.HTTP_200_OK)