from decimal import Decimal

from django.db import models
from django.shortcuts import get_object_or_404, render

from accounts.models import User

from event.models import HandHoldingParticipant
from counselling_slot.models import Booking
from counselling_slot.tasks import create_system_notification
from report.models import Report, Review
from lead_registration.models import StudentProfile
from lead_registration.serializers import PaymentDetailSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from django.urls import reverse
from rest_framework import status
from django.db import transaction
from django.http import FileResponse, Http404
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.clickjacking import xframe_options_exempt
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
import mimetypes
import os
from django.db.transaction import on_commit
from django.contrib.auth import get_user_model

from django.db.models import Q, Count, Sum
from accounts.permissions import IsAdmin, IsSuperAdmin
from rest_framework.permissions import IsAuthenticated

from payment.models import Payment, PaymentLog
from payment.serializers import PaymentCreateSerializer, PaymentCreateStudentSerializer, PaymentListSerializer, PaymentLogSerializer, PaymentResponseSerializer, StudentPaymentDetailSerializer
from payment.utils import generate_receipt_pdf, send_payment_approved_email, send_payment_created_email, send_payment_reject_email, send_payment_reject_whatsapp, send_payment_rejected_email, send_payment_reminder_email, send_payment_updated_email
from program_package.models import Package, UserProgramPackage

User = get_user_model()

def safe_notify(admin_id, title, message):
        try:
            # ✅ Try async (Celery)
            create_system_notification.delay(admin_id, title, message)
        except Exception as e:
            print("❌ Celery failed, using sync:", str(e))
            try:
                # ✅ Fallback to direct call
                create_system_notification(admin_id, title, message)
            except Exception as inner_e:
                print("❌ Sync notification also failed:", str(inner_e))


# class PaymentCreateAPIView(APIView):
#     """
#     Create Payment (Online / Offline)
#     """
#     permission_classes = [IsAuthenticated]
    
#     def unlock_report_if_paid(self, payment):
#         """
#         Unlock report ONLY if:
#         ✅ Total payment >= package price
#         ✅ Review exists for user
#         ✅ Review status = submitted
#         ✅ Booking status = completed
#         ✅ Report is uploaded

#         ❌ Else keep locked

#         🚫 Skip report status update for College List Analysis packages
#         """

#         # ==================================
#         # 🚫 Skip College List Analysis users
#         # ==================================
#         if payment.package and payment.package.engineering_test_analysis:
#             return

#         from django.db.models import Sum

#         # =========================
#         # 💳 Total Paid
#         # =========================
#         total_paid = (
#             Payment.objects.filter(
#                 user=payment.user,
#                 package=payment.package
#             ).aggregate(
#                 total=Sum("amount")
#             )["total"] or 0
#         )

#         package_price = payment.package.price or 0

#         # =========================
#         # 📝 Submitted Review Check
#         # =========================
#         submitted_review = (
#             Review.objects.filter(
#                 user=payment.user,
#                 review_status="submitted"
#             ).exists()
#         )

#         # =========================
#         # 🎓 Student Profile
#         # =========================
#         student_profile = (
#             StudentProfile.objects.filter(
#                 user=payment.user
#             ).first()
#         )

#         # =========================
#         # 📅 Booking Completed Check
#         # =========================
#         completed_booking = False

#         if student_profile:
#             completed_booking = (
#                 Booking.objects.filter(
#                     student=student_profile,
#                     status="completed"
#                 ).exists()
#             )

#         # =========================
#         # 📄 Report Uploaded Check
#         # =========================
#         uploaded_report = Report.objects.filter(
#             user=payment.user,
#             file_path__isnull=False
#         ).exclude(
#             file_path=""
#         ).exists()

#         # =========================
#         # 🔓 Unlock Condition
#         # =========================
#         if (
#             total_paid >= package_price
#             and submitted_review
#             and completed_booking
#             and uploaded_report
#         ):
#             Report.objects.filter(
#                 user=payment.user
#             ).update(
#                 report_status="received_unlocked"
#             )
#         else:
#             Report.objects.filter(
#                 user=payment.user
#             ).update(
#                 report_status="not_received"
#             )  


#     def post(self, request):
#         serializer = PaymentCreateSerializer(
#             data=request.data,
#             context={"request": request}
#         )

#         if not serializer.is_valid():
#             return Response(
#                 {
#                     "success": False,
#                     "errors": serializer.errors
#                 },
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         with transaction.atomic():
#             payment = serializer.save()
            
#             self.unlock_report_if_paid(payment)
            
#             # =========================
#             # 🔔 SEND NOTIFICATION TO SUPERADMIN
#             # =========================
#             user_name = f"{payment.user.first_name} {payment.user.last_name}"
#             amount = payment.amount

#             title = "Payment Received"
#             message = f"User {user_name} has successfully made a payment of ₹{amount}."

#             admin_users = User.objects.filter(is_superuser=True)

#             for admin in admin_users:
#                 admin_id = admin.id

#                 print(f"DEBUG: Preparing notification for admin_id={admin_id}")

#                 # ✅ ALWAYS SAFE
#                 on_commit(lambda admin_id=admin_id: safe_notify(
#                     admin_id,
#                     title,
#                     message
#                 ))

#         # ✅ Send email AFTER transaction
#         try:
#             send_payment_created_email(payment.user, payment)
#         except Exception as e:
#             print("Email error:", e)

#         response_data = PaymentResponseSerializer(
#             payment,
#             context={"request": request}
#         ).data

#         return Response(
#             {
#                 "success": True,
#                 "message": "Payment created successfully",
#                 "data": response_data
#             },
#             status=status.HTTP_201_CREATED
#         )

#     def put(self, request, pk):
#         """
#         Update Payment (partial update supported)
#         """
#         payment = get_object_or_404(Payment, pk=pk)

#         serializer = PaymentCreateSerializer(
#             payment,
#             data=request.data,
#             partial=True,
#             context={"request": request}
#         )

#         if not serializer.is_valid():
#             return Response(
#                 {
#                     "success": False,
#                     "errors": serializer.errors
#                 },
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         with transaction.atomic():
#             payment = serializer.save()
            
#             self.unlock_report_if_paid(payment)
            
#         # send email
#         send_payment_updated_email(payment.user, payment)

#         response_data = PaymentResponseSerializer(
#             payment,
#             context={"request": request}
#         ).data

#         return Response(
#             {
#                 "success": True,
#                 "message": "Payment updated successfully",
#                 "data": response_data
#             },
#             status=status.HTTP_200_OK
#         )
        
#     def delete(self, request, pk):
#         """
#         Delete Payment
#         """
#         payment = get_object_or_404(Payment, pk=pk)

#         with transaction.atomic():
#             payment.delete()

#         return Response(
#             {
#                 "success": True,
#                 "message": "Payment deleted successfully"
#             },
#             status=status.HTTP_200_OK
#         )

class PaymentCreateAPIView(APIView):
    """
    Create Payment (Online / Offline)
    """
    permission_classes = [IsAuthenticated]
    
    def get_first_error(errors):
        if isinstance(errors, dict):
            for value in errors.values():
                if isinstance(value, list):
                    return value[0]
                return value
        return str(errors)
    
    def unlock_report_if_paid(self, payment):
        """
        Unlock report ONLY if:
        ✅ Total payment >= package price
        ✅ Review exists for user
        ✅ Review status = submitted
        ✅ Booking status = completed
        ✅ Report is uploaded

        ❌ Else keep locked

        🚫 Skip report status update for College List Analysis packages
        """

        # ==================================
        # 🚫 Skip College List Analysis users
        # ==================================
        if payment.package.filter(
            engineering_test_analysis=True
        ).exists():
            return

        from django.db.models import Sum

        # =========================
        # 💳 Total Paid
        # =========================
        total_paid = (
            Payment.objects.filter(
                user=payment.user,
                package__in=payment.package.all()
            ).distinct().aggregate(
                total=Sum("amount")
            )["total"] or 0
        )

        package_price = sum(
            pkg.price or 0
            for pkg in payment.package.all()
        )

        # =========================
        # 📝 Submitted Review Check
        # =========================
        submitted_review = (
            Review.objects.filter(
                user=payment.user,
                review_status="submitted"
            ).exists()
        )

        # =========================
        # 🎓 Student Profile
        # =========================
        student_profile = (
            StudentProfile.objects.filter(
                user=payment.user
            ).first()
        )

        # =========================
        # 📅 Booking Completed Check
        # =========================
        completed_booking = False

        if student_profile:
            completed_booking = (
                Booking.objects.filter(
                    student=student_profile,
                    status="completed"
                ).exists()
            )

        # =========================
        # 📄 Report Uploaded Check
        # =========================
        uploaded_report = Report.objects.filter(
            user=payment.user,
            file_path__isnull=False
        ).exclude(
            file_path=""
        ).exists()

        # =========================
        # 🔓 Unlock Condition
        # =========================
        if (
            total_paid >= package_price
            and submitted_review
            and completed_booking
            and uploaded_report
        ):
            Report.objects.filter(
                user=payment.user
            ).update(
                report_status="received_unlocked"
            )
        else:
            Report.objects.filter(
                user=payment.user
            ).update(
                report_status="not_received"
            )  


    def post(self, request):
        serializer = PaymentCreateSerializer(
            data=request.data,
            context={"request": request}
        )

        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "errors": get_first_error(serializer.errors)
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            payment = serializer.save()
            
            self.unlock_report_if_paid(payment)
            
            # =========================
            # 🔔 SEND NOTIFICATION TO SUPERADMIN
            # =========================
            user_name = f"{payment.user.first_name} {payment.user.last_name}"
            amount = payment.amount

            title = "Payment Received"
            message = f"User {user_name} has successfully made a payment of ₹{amount}."

            admin_users = User.objects.filter(is_superuser=True)

            for admin in admin_users:
                admin_id = admin.id

                print(f"DEBUG: Preparing notification for admin_id={admin_id}")

                # ✅ ALWAYS SAFE
                on_commit(lambda admin_id=admin_id: safe_notify(
                    admin_id,
                    title,
                    message
                ))

        # ✅ Send email AFTER transaction
        try:
            send_payment_created_email(payment.user, payment)
        except Exception as e:
            print("Email error:", e)
            
        print("Payment ID:", payment.id)
        print("Package IDs:", list(payment.package.values_list("id", flat=True)))

        response_data = PaymentResponseSerializer(
            payment,
            context={"request": request}
        ).data

        return Response(
            {
                "success": True,
                "message": "Payment created successfully",
                "data": response_data
            },
            status=status.HTTP_201_CREATED
        )

    def put(self, request, pk):
        """
        Update Payment (partial update supported)
        """
        payment = get_object_or_404(Payment, pk=pk)

        serializer = PaymentCreateSerializer(
            payment,
            data=request.data,
            partial=True,
            context={"request": request}
        )

        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "errors": get_first_error(serializer.errors)
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            payment = serializer.save()
            
            self.unlock_report_if_paid(payment)
            
        # send email
        send_payment_updated_email(payment.user, payment)

        response_data = PaymentResponseSerializer(
            payment,
            context={"request": request}
        ).data

        return Response(
            {
                "success": True,
                "message": "Payment updated successfully",
                "data": response_data
            },
            status=status.HTTP_200_OK
        )
        
    def delete(self, request, pk):
        """
        Delete Payment
        """
        payment = get_object_or_404(Payment, pk=pk)

        with transaction.atomic():
            payment.delete()

        return Response(
            {
                "success": True,
                "message": "Payment deleted successfully"
            },
            status=status.HTTP_200_OK
        )

    
# class VerifyPaymentAPIView(APIView):
#     """
#     Admin-only API to verify a payment.

#     - Approve:
#         • Calculates cumulative payments
#         • Sets status to fully_paid / partial_paid
#         • Prevents overpayment
#         • Assigns program/package if fully paid

#     - Reject:
#         • Sends email & WhatsApp notification
#         • Logs the action
#         • Permanently deletes the payment record
#     """

#     # permission_classes = [IsAdmin | IsSuperAdmin]
#     permission_classes = [IsAuthenticated]

#     @transaction.atomic
#     def post(self, request, payment_id):

#         action = request.data.get('action')
#         payment = get_object_or_404(Payment, id=payment_id)

#         if action not in ['approve', 'reject']:
#             return Response(
#                 {"success": False, "error": "Invalid action. Use approve or reject"},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         old_status = payment.status
#         package_price = payment.package.price

#         # Calculate total paid excluding current payment
#         total_paid = Payment.objects.filter(
#             user=payment.user,
#             package=payment.package,
#             status__in=['fully_paid', 'partial_paid']
#         ).exclude(id=payment.id).aggregate(
#             total=Sum('amount')
#         )['total'] or 0

#         cumulative_amount = total_paid + payment.amount

#         # ======================================
#         # ✅ APPROVE LOGIC
#         # ======================================
#         if action == 'approve':

#             # Prevent overpayment
#             if cumulative_amount > package_price:
#                 return Response(
#                     {
#                         "success": False,
#                         "error": "Total payment exceeds package price."
#                     },
#                     status=status.HTTP_400_BAD_REQUEST
#                 )

#             # Determine payment status
#             if cumulative_amount >= package_price:
#                 payment.status = 'fully_paid'
#             else:
#                 payment.status = 'partial_paid'

#             payment.verified_by = request.user
#             payment.save()

#             # Log status change
#             PaymentLog.objects.create(
#                 payment=payment,
#                 old_status=old_status,
#                 new_status=payment.status,
#                 changed_by=request.user
#             )

#             # Assign program/package if fully paid
#             if payment.status == 'fully_paid':
#                 UserProgramPackage.objects.get_or_create(
#                     user=payment.user,
#                     program=payment.package.program,
#                     package=payment.package,
#                     defaults={'assigned_by': request.user.email}
#                 )
            
#             # Send email
#             send_payment_approved_email(
#                 payment.user,
#                 payment,
#                 cumulative_amount,
#                 package_price
#             )

#             return Response({
#                 "success": True,
#                 "message": "Payment approved successfully",
#                 "payment_status": payment.status,
#                 "cumulative_amount": cumulative_amount,
#                 "package_price": package_price
#             })

#         # ======================================
#         # ❌ REJECT LOGIC (DELETE RECORD)
#         # ======================================
#         elif action == 'reject':

#             # Send notification
#             send_payment_rejected_email(payment.user)

#             # ❌ Mark this payment as not_paid (acts like rejected)
#             payment.status = "not_paid"
#             payment.amount = 0   # 🔥 IMPORTANT: make it zero so it doesn't affect total
#             payment.verified_by = request.user
#             payment.save()

#             # ✅ Get only VALID payments (exclude not_paid)
#             valid_payments = Payment.objects.filter(
#                 user=payment.user,
#                 package=payment.package,
#                 status__in=["partial_paid", "fully_paid"]
#             )

#             total_paid = valid_payments.aggregate(
#                 total=Sum("amount")
#             )["total"] or 0

#             # ✅ Determine correct status
#             if total_paid == 0:
#                 new_status = "not_paid"
#             elif total_paid < package_price:
#                 new_status = "partial_paid"
#             else:
#                 new_status = "fully_paid"

#             # ✅ Update remaining payments properly
#             for pay in valid_payments:
#                 if total_paid >= package_price:
#                     pay.status = "fully_paid"
#                 else:
#                     pay.status = "partial_paid"
#                 pay.save()

#             # ✅ Log action
#             PaymentLog.objects.create(
#                 payment=payment,
#                 old_status=old_status,
#                 new_status=new_status,
#                 changed_by=request.user
#             )

#             return Response({
#                 "success": True,
#                 "message": "Payment rejected successfully",
#                 "total_paid": total_paid,
#                 "new_status": new_status
#             })


# ========================================== Last working code ===========================================
# class VerifyPaymentAPIView(APIView):
#     """
#     Admin-only API to verify a payment.

#     - Approve:
#         • Calculates cumulative payments
#         • Sets status to fully_paid / partial_paid
#         • Prevents overpayment
#         • Assigns program/package if fully paid

#     - Reject:
#         • Allows only latest payment rejection
#         • Validates previous payment consistency
#         • Marks payment as not_paid (not deleted)
#         • Recalculates remaining payments properly
#     """

#     permission_classes = [IsAuthenticated]

#     @transaction.atomic
#     def post(self, request, payment_id):

#         action = request.data.get('action')
#         payment = get_object_or_404(Payment, id=payment_id)

#         if action not in ['approve', 'reject']:
#             return Response(
#                 {"success": False, "error": "Invalid action. Use approve or reject"},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         old_status = payment.status
        
#         # ======================================
#         # 🔹 ALLOW APPROVE/REJECT ONLY FOR VERIFICATION PENDING
#         # ======================================
#         if action == "approve" and payment.status != "verification_pending":
#             return Response(
#                 {
#                     "success": False,
#                     "error": "Only verification pending payments can be approved."
#                 },
#                 status=status.HTTP_400_BAD_REQUEST
#             )

        
#         package_price = payment.package.price or Decimal("0")
#         current_amount = payment.amount or Decimal("0")

#         # ======================================
#         # 🔹 COMMON: CALCULATE TOTAL (EXCLUDING CURRENT)
#         # ======================================
#         total_paid = Payment.objects.filter(
#             user=payment.user,
#             package=payment.package,
#             status__in=['fully_paid', 'partial_paid']
#         ).exclude(id=payment.id).aggregate(
#             total=Sum('amount')
#         )['total'] or Decimal("0")

#         cumulative_amount = total_paid + current_amount

#         # ======================================
#         # ✅ APPROVE LOGIC
#         # ======================================
#         if action == 'approve':

#             # ❌ Prevent overpayment
#             if cumulative_amount > package_price:
#                 return Response(
#                     {
#                         "success": False,
#                         "error": "Total payment exceeds package price."
#                     },
#                     status=status.HTTP_400_BAD_REQUEST
#                 )

#             # ✅ Determine status
#             if cumulative_amount == package_price:
#                 payment.status = 'fully_paid'
#             else:
#                 payment.status = 'partial_paid'

#             payment.verified_by = request.user
#             payment.save()

#             # ✅ Log
#             PaymentLog.objects.create(
#                 payment=payment,
#                 old_status=old_status,
#                 new_status=payment.status,
#                 changed_by=request.user
#             )

#             # ✅ Assign program/package if fully paid
#             if payment.status == 'fully_paid':
#                 UserProgramPackage.objects.update_or_create(
#                     user=payment.user,
#                     program=payment.package.program,
#                     package=payment.package,
#                     defaults={'assigned_by': request.user.email}
#                 )

#             # ✅ Send email
#             send_payment_approved_email(
#                 payment.user,
#                 payment,
#                 cumulative_amount,
#                 package_price
#             )

#             return Response({
#                 "success": True,
#                 "message": "Payment approved successfully",
#                 "payment_status": payment.status,
#                 "cumulative_amount": cumulative_amount,
#                 "package_price": package_price
#             })

#         # ======================================
#         # REJECT LOGIC - SAFE & FLEXIBLE
#         # ======================================
#         if action == "reject":
#             with transaction.atomic():

#                 # ✅ GET VERIFIED AMOUNT
#                 verified_amount_str = request.data.get("verifiedAmount")

#                 if not verified_amount_str:
#                     return Response(
#                         {"success": False, "error": "verifiedAmount is required."},
#                         status=status.HTTP_400_BAD_REQUEST
#                     )

#                 try:
#                     verified_amount = Decimal(str(verified_amount_str))
#                 except Exception:
#                     return Response(
#                         {"success": False, "error": "Invalid verifiedAmount format."},
#                         status=status.HTTP_400_BAD_REQUEST
#                     )

#                 try:
#                     # ✅ LOCK PAYMENTS
#                     payments_qs = Payment.objects.select_for_update().filter(
#                         user=payment.user,
#                         package=payment.package
#                     )

#                     # ✅ GET LAST VALID PAYMENT (NOT REJECTED)
#                     payment = payments_qs.filter(
#                         status__in=["partial_paid", "fully_paid", "verification_pending"],
#                         amount__gt=0   # 🔥 IMPORTANT FIX
#                     ).order_by("-created_at", "-id").first()

#                     if not payment:
#                         return Response(
#                             {
#                                 "success": False,
#                                 "error": "No valid payment found to reject (all payments already rejected)."
#                             },
#                             status=status.HTTP_400_BAD_REQUEST
#                         )

#                     old_status = payment.status
#                     actual_payment_amount = payment.amount or Decimal("0")

#                     # ✅ AMOUNT MATCH VALIDATION
#                     if verified_amount != actual_payment_amount:
#                         return Response(
#                             {
#                                 "success": False,
#                                 "error": f"Amount mismatch! Passed ₹{verified_amount}, but last payment is ₹{actual_payment_amount}",
#                             },
#                             status=status.HTTP_400_BAD_REQUEST
#                         )

#                     # ======================================
#                     # ✅ REJECT PAYMENT
#                     # ======================================
#                     payment.status = "not_paid"
#                     payment.amount = Decimal("0")
#                     payment.verified_by = request.user
#                     payment.save(update_fields=["status", "amount", "verified_by"])
                    
#                     # ======================================
#                     # 🔒 LOCK USER REPORT IF PREVIOUSLY UNLOCKED
#                     # ======================================
#                     # Report.objects.filter(
#                     #     user=payment.user,
#                     #     report_status="received_unlocked"
#                     # ).update(
#                     #     report_status="received_locked"
#                     # )
#                     # College List Analysis → do nothing
#                     if payment.package and payment.package.engineering_test_analysis:
#                         pass

#                     # Normal counselling reports
#                     else:
#                         Report.objects.filter(
#                             user=payment.user,
#                             report_status="received_unlocked"
#                         ).update(
#                             report_status="received_locked"
#                         )

#                     # ======================================
#                     # ✅ UPDATE PREVIOUS PAYMENTS
#                     # ======================================
#                     previous_payments = payments_qs.filter(
#                         status__in=["partial_paid", "fully_paid"]
#                     )

#                     previous_total = previous_payments.aggregate(
#                         total=Sum("amount")
#                     )["total"] or Decimal("0")

#                     for prev in previous_payments:
#                         if prev.status != "partial_paid":
#                             prev.status = "partial_paid"
#                             prev.save(update_fields=["status"])

#                     # # ======================================
#                     # # ✅ REMOVE PACKAGE ASSIGNMENT
#                     # # ======================================
#                     # UserProgramPackage.objects.filter(
#                     #     user=payment.user
#                     #     # program=payment.package.program,
#                     #     # package=payment.package
#                     # ).delete()

#                     # ======================================
#                     # ✅ LOG
#                     # ======================================
#                     PaymentLog.objects.create(
#                         payment=payment,
#                         old_status=old_status,
#                         new_status="not_paid",
#                         changed_by=request.user
#                     )

#                     # ======================================
#                     # ✅ EMAIL
#                     # ======================================
#                     send_payment_rejected_email(payment.user)

#                     return Response(
#                         {
#                             "success": True,
#                             "message": "Last payment rejected successfully.",
#                             "payment_id": payment.id,
#                             "rejected_amount": float(actual_payment_amount),
#                             "remaining_total": float(previous_total),
#                         },
#                         status=status.HTTP_200_OK
#                     )

#                 except Exception as e:
#                     return Response(
#                         {
#                             "success": False,
#                             "error": f"Something went wrong: {str(e)}"
#                         },
#                         status=status.HTTP_500_INTERNAL_SERVER_ERROR
#                     )
 
class VerifyPaymentAPIView(APIView):
    """
    Admin-only API to verify a payment.

    - Approve:
        • Calculates cumulative payments
        • Sets status to fully_paid / partial_paid
        • Prevents overpayment
        • Assigns program/package if fully paid

    - Reject:
        • Allows only latest payment rejection
        • Validates previous payment consistency
        • Marks payment as not_paid (not deleted)
        • Recalculates remaining payments properly
    """

    permission_classes = [IsAuthenticated]

    @transaction.atomic
    def post(self, request, payment_id):

        action = request.data.get('action')
        payment = get_object_or_404(Payment, id=payment_id)

        if action not in ['approve', 'reject']:
            return Response(
                {"success": False, "error": "Invalid action. Use approve or reject"},
                status=status.HTTP_400_BAD_REQUEST
            )

        old_status = payment.status
        
        # ======================================
        # 🔹 ALLOW APPROVE/REJECT ONLY FOR VERIFICATION PENDING
        # ======================================
        if action == "approve" and payment.status != "verification_pending":
            return Response(
                {
                    "success": False,
                    "error": "Only verification pending payments can be approved."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        
        package_price = sum(
            (pkg.price or Decimal("0"))
            for pkg in payment.package.all()
        )
        current_amount = payment.amount or Decimal("0")

        # ======================================
        # 🔹 COMMON: CALCULATE TOTAL (EXCLUDING CURRENT)
        # ======================================
        total_paid = Payment.objects.filter(
            user=payment.user,
            package__in=payment.package.all(),
            status__in=['fully_paid', 'partial_paid']
        ).distinct().exclude(
            id=payment.id
        ).aggregate(
            total=Sum('amount')
        )['total'] or Decimal("0")

        cumulative_amount = total_paid + current_amount

        # ======================================
        # ✅ APPROVE LOGIC
        # ======================================
        if action == 'approve':

            # ❌ Prevent overpayment
            if cumulative_amount > package_price:
                return Response(
                    {
                        "success": False,
                        "error": "Total payment exceeds package price."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # ✅ Determine status
            if cumulative_amount == package_price:
                payment.status = 'fully_paid'
            else:
                payment.status = 'partial_paid'

            payment.verified_by = request.user
            payment.save()

            # ✅ Log
            PaymentLog.objects.create(
                payment=payment,
                old_status=old_status,
                new_status=payment.status,
                changed_by=request.user
            )

            # ✅ Assign program/package if fully paid
            if payment.status == "fully_paid":

                for package in payment.package.all():

                    UserProgramPackage.objects.update_or_create(
                        user=payment.user,
                        program=package.program,
                        package=package,
                        defaults={
                            "assigned_by": request.user.email
                        }
                    )

            # ✅ Send email
            send_payment_approved_email(
                payment.user,
                payment,
                cumulative_amount,
                package_price
            )

            return Response({
                "success": True,
                "message": "Payment approved successfully",
                "payment_status": payment.status,
                "cumulative_amount": cumulative_amount,
                "package_price": package_price
            })

        # ======================================
        # REJECT LOGIC - SAFE & FLEXIBLE
        # ======================================
        if action == "reject":
            with transaction.atomic():

                # ✅ GET VERIFIED AMOUNT
                verified_amount_str = request.data.get("verifiedAmount")

                if not verified_amount_str:
                    return Response(
                        {"success": False, "error": "verifiedAmount is required."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                try:
                    verified_amount = Decimal(str(verified_amount_str))
                except Exception:
                    return Response(
                        {"success": False, "error": "Invalid verifiedAmount format."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                try:
                    # ✅ LOCK PAYMENTS
                    payments_qs = Payment.objects.select_for_update().filter(
                        user=payment.user,
                        package__in=payment.package.all()
                    ).distinct()

                    # ✅ GET LAST VALID PAYMENT (NOT REJECTED)
                    payment = payments_qs.filter(
                        status__in=["partial_paid", "fully_paid", "verification_pending"],
                        amount__gt=0   # 🔥 IMPORTANT FIX
                    ).order_by("-created_at", "-id").first()

                    if not payment:
                        return Response(
                            {
                                "success": False,
                                "error": "No valid payment found to reject (all payments already rejected)."
                            },
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    old_status = payment.status
                    actual_payment_amount = payment.amount or Decimal("0")

                    # ✅ AMOUNT MATCH VALIDATION
                    if verified_amount != actual_payment_amount:
                        return Response(
                            {
                                "success": False,
                                "error": f"Amount mismatch! Passed ₹{verified_amount}, but last payment is ₹{actual_payment_amount}",
                            },
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    # ======================================
                    # ✅ REJECT PAYMENT
                    # ======================================
                    payment.status = "not_paid"
                    payment.amount = Decimal("0")
                    payment.verified_by = request.user
                    payment.save(update_fields=["status", "amount", "verified_by"])
                    
                    # ======================================
                    # 🔒 LOCK USER REPORT IF PREVIOUSLY UNLOCKED
                    # ======================================
                    # Report.objects.filter(
                    #     user=payment.user,
                    #     report_status="received_unlocked"
                    # ).update(
                    #     report_status="received_locked"
                    # )
                    # College List Analysis → do nothing
                    if payment.package.filter(
                        engineering_test_analysis=True
                    ).exists():
                        pass

                    # Normal counselling reports
                    else:
                        Report.objects.filter(
                            user=payment.user,
                            report_status="received_unlocked"
                        ).update(
                            report_status="received_locked"
                        )

                    # ======================================
                    # ✅ UPDATE PREVIOUS PAYMENTS
                    # ======================================
                    previous_payments = payments_qs.filter(
                        status__in=["partial_paid", "fully_paid"]
                    )

                    previous_total = previous_payments.aggregate(
                        total=Sum("amount")
                    )["total"] or Decimal("0")

                    for prev in previous_payments:
                        if prev.status != "partial_paid":
                            prev.status = "partial_paid"
                            prev.save(update_fields=["status"])

                    # # ======================================
                    # # ✅ REMOVE PACKAGE ASSIGNMENT
                    # # ======================================
                    # UserProgramPackage.objects.filter(
                    #     user=payment.user
                    #     # program=payment.package.program,
                    #     # package=payment.package
                    # ).delete()

                    # ======================================
                    # ✅ LOG
                    # ======================================
                    PaymentLog.objects.create(
                        payment=payment,
                        old_status=old_status,
                        new_status="not_paid",
                        changed_by=request.user
                    )

                    # ======================================
                    # ✅ EMAIL
                    # ======================================
                    send_payment_rejected_email(payment.user)

                    return Response(
                        {
                            "success": True,
                            "message": "Last payment rejected successfully.",
                            "payment_id": payment.id,
                            "rejected_amount": float(actual_payment_amount),
                            "remaining_total": float(previous_total),
                        },
                        status=status.HTTP_200_OK
                    )

                except Exception as e:
                    return Response(
                        {
                            "success": False,
                            "error": f"Something went wrong: {str(e)}"
                        },
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
              
                
        
        
        
# =================================================================================

# class PaymentListAPIView(APIView):
#     """
#     Get all payments with user, package, status
#     + payment proof file
#     + total_paid
#     + remaining_amount
#     + last_payment_amount
#     """
#     # permission_classes = [IsAdmin | IsSuperAdmin]
#     permission_classes = [IsAuthenticated]

#     def get(self, request):

#         unique_payments = (
#             Payment.objects
#             .values("user", "package")
#             .distinct()
#         )

#         response_data = []

#         for item in unique_payments:
#             user_id = item["user"]
#             package_id = item["package"]

#             payments_qs = Payment.objects.filter(
#                 user_id=user_id,
#                 package_id=package_id
#             ).select_related(
#                 'user',
#                 'user__student_profile',
#                 'package',
#                 'package__program'
#             ).order_by('-created_at')

#             latest_payment = payments_qs.first()

#             if not latest_payment:
#                 continue

#             # ✅ Total paid
#             total_paid = payments_qs.aggregate(
#                 total=Sum("amount")
#             )["total"] or 0

#             package_price = latest_payment.package.price if latest_payment.package else 0
#             remaining_amount = max(package_price - total_paid, 0)

#             # ✅ Correct payment status logic
#             if latest_payment.status in ["verification_pending", "rejected"]:
#                 payment_status = latest_payment.status
#             else:
#                 if total_paid == 0:
#                     payment_status = "not_paid"
#                 elif total_paid < package_price:
#                     payment_status = "partial_paid"
#                 else:
#                     payment_status = "fully_paid"

#             proof_url = None
#             if latest_payment.proof_file:
#                 url = reverse(
#                     "payment-report-image",
#                     kwargs={"payment_id": latest_payment.id}
#                 )
#                 proof_url = request.build_absolute_uri(url)

#             response_data.append({
#                 "user_id": latest_payment.user.id,
#                 "student_id": (
#                     latest_payment.user.student_profile.id
#                     if getattr(latest_payment.user, "student_profile", None)
#                     else None
#                 ),
#                 "user_name": f"{latest_payment.user.first_name} {latest_payment.user.last_name}",
#                 "email": latest_payment.user.email,

#                 # 🔥 Payment Summary
#                 "total_paid": total_paid,
#                 "remaining_amount": remaining_amount,
#                 "package_price": package_price,

#                 # 🔥 NEW FIELD (Last payment amount)
#                 "amount": latest_payment.amount,

#                 "program_id": (
#                     latest_payment.package.program.id
#                     if latest_payment.package and latest_payment.package.program
#                     else None
#                 ),
#                 "program": (
#                     latest_payment.package.program.name
#                     if latest_payment.package else None
#                 ),
#                 "package_id": latest_payment.package.id if latest_payment.package else None,
#                 "package": latest_payment.package.name if latest_payment.package else None,

#                 # Latest transaction details
#                 "payment_id": latest_payment.id,
#                 "created_at": latest_payment.created_at,
#                 "payment_date": latest_payment.payment_date,
#                 "transaction_id": latest_payment.transaction_id,
#                 "payment_status": payment_status,
#                 "method": latest_payment.method,

#                 "proof_file_url": proof_url,
#             })

#         return Response(
#             {
#                 "success": True,
#                 "count": len(response_data),
#                 "data": response_data
#             },
#             status=status.HTTP_200_OK
#         )

from django.db.models import Sum, Max

# class PaymentListAPIView(APIView):
#     permission_classes = [IsAuthenticated]

#     def get(self, request):

#         response_data = []

#         # Get unique user + package combinations
#         payment_groups = Payment.objects.values(
#             "user_id", "package_id"
#         ).distinct()

#         for group in payment_groups:

#             user_id = group["user_id"]
#             package_id = group["package_id"]

#             # All payments for that user + package
#             payments = Payment.objects.filter(
#                 user_id=user_id,
#                 package_id=package_id
#             ).select_related(
#                 "user",
#                 "user__student_profile",
#                 "package",
#                 "package__program"
#             ).order_by("-created_at")

#             if not payments.exists():
#                 continue

#             latest_payment = payments.first()

#             # 🔥 SUM OF ALL PAYMENTS
#             total_paid = payments.filter(
#                 status__in=["partial_paid", "fully_paid", "verification_pending"]
#             ).aggregate(
#                 total=Sum("amount")
#             )["total"] or 0

#             package_price = latest_payment.package.price if latest_payment.package else 0

#             # 🔥 Remaining amount
#             remaining_amount = package_price - total_paid
#             if remaining_amount < 0:
#                 remaining_amount = 0

#             # Payment status
#             if latest_payment.status in ["verification_pending", "rejected"]:
#                 payment_status = latest_payment.status
#             else:
#                 if total_paid == 0:
#                     payment_status = "not_paid"
#                 elif total_paid < package_price:
#                     payment_status = "partial_paid"
#                 else:
#                     payment_status = "fully_paid"

#             proof_url = None
#             if latest_payment.proof_file:
#                 url = reverse(
#                     "payment-report-image",
#                     kwargs={"payment_id": latest_payment.id}
#                 )
#                 proof_url = request.build_absolute_uri(url)

#             response_data.append({
#                 "user_id": latest_payment.user.id,
#                 "student_id": (
#                     latest_payment.user.student_profile.id
#                     if getattr(latest_payment.user, "student_profile", None)
#                     else None
#                 ),
#                 "is_handholding": (
#                     latest_payment.package.is_handholding
#                     if latest_payment.package else False
#                 ),
#                 "user_name": f"{latest_payment.user.first_name} {latest_payment.user.last_name}",
#                 "email": latest_payment.user.email,

#                 # Payment summary
#                 "total_paid": float(total_paid),
#                 "remaining_amount": float(remaining_amount),
#                 "package_price": float(package_price),

#                 # Last payment
#                 "amount": float(latest_payment.amount),

#                 "program_id": (
#                     latest_payment.package.program.id
#                     if latest_payment.package and latest_payment.package.program
#                     else None
#                 ),
#                 "program": (
#                     latest_payment.package.program.name
#                     if latest_payment.package else None
#                 ),
#                 "package_id": latest_payment.package.id if latest_payment.package else None,
#                 "package": latest_payment.package.name if latest_payment.package else None,

#                 "payment_id": latest_payment.id,
#                 "created_at": latest_payment.created_at,
#                 "payment_date": latest_payment.payment_date,
#                 "transaction_id": latest_payment.transaction_id,
#                 "payment_status": payment_status,
#                 "method": latest_payment.method,

#                 "proof_file_url": proof_url,
#             })

#         return Response({
#             "success": True,
#             "count": len(response_data),
#             "data": response_data
#         }, status=status.HTTP_200_OK)
 
class PaymentListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        response_data = []

        # =====================================
        # 🔹 HANDHOLDING PARTICIPANTS
        # =====================================
        participants = HandHoldingParticipant.objects.all().values(
            "id",
            "user_id",
            "email"
        )

        participant_by_user = {
            p["user_id"]: p["id"]
            for p in participants
            if p["user_id"]
        }

        participant_by_email = {
            p["email"]: p["id"]
            for p in participants
            if p["email"]
        }

        # =====================================
        # 🔹 FETCH ALL PAYMENTS
        # =====================================
        payments = Payment.objects.select_related(
            "user",
            "user__student_profile"
        ).prefetch_related(
            "package",
            "package__program"
        ).order_by("-created_at")

        processed = set()

        for payment in payments:

            package_ids_key = tuple(
                sorted(
                    payment.package.values_list("id", flat=True)
                )
            )

            key = (payment.user_id, package_ids_key)

            if key in processed:
                continue

            processed.add(key)

            # =====================================
            # 🔹 GET ALL PACKAGES OF PAYMENT
            # =====================================
            packages = payment.package.all()

            total_package_price = sum(
                float(pkg.price or 0)
                for pkg in packages
            )

            package_ids = list(
                packages.values_list("id", flat=True)
            )

            package_names = list(
                packages.values_list("name", flat=True)
            )

            remaining_amount = total_package_price - float(payment.amount or 0)

            if remaining_amount < 0:
                remaining_amount = 0

                response_data.append({
                    "id": payment.id,

                    "user_id": payment.user.id if payment.user else None,

                    "user_name": (
                        f"{payment.user.first_name} {payment.user.last_name}"
                        if payment.user else None
                    ),

                    "email": payment.user.email if payment.user else None,

                    "package_ids": package_ids,
                    "packages": package_names,

                    "package_price": total_package_price,
                    "amount": float(payment.amount or 0),

                    "remaining_amount": remaining_amount,

                    "payment_id": payment.id,
                    "created_at": payment.created_at,
                    "payment_date": payment.payment_date,
                    "transaction_id": payment.transaction_id,

                    "payment_status": payment.status,
                    "method": payment.method,
                })
                continue

            # =====================================
            # 🔹 PACKAGE DETAILS
            # =====================================
            package_ids = []
            package_names = []
            program_ids = []
            program_names = []

            is_handholding = False
            handholding_participant_id = None

            total_package_price = 0

            for package in packages:

                package_ids.append(package.id)
                package_names.append(package.name)

                total_package_price += float(package.price or 0)

                if package.program:
                    program_ids.append(package.program.id)
                    program_names.append(package.program.name)

                # =====================================
                # 🔹 HANDHOLDING CHECK
                # =====================================
                if (
                    package.is_handholding
                    or "hand" in package.name.lower()
                    or (
                        package.program
                        and "hand" in package.program.name.lower()
                    )
                ):
                    is_handholding = True

            # =====================================
            # 🔹 HANDHOLDING PARTICIPANT
            # =====================================
            if is_handholding and payment.user:

                handholding_participant_id = participant_by_user.get(
                    payment.user.id
                )

                if not handholding_participant_id:
                    handholding_participant_id = participant_by_email.get(
                        payment.user.email
                    )

            # =====================================
            # 🔹 TOTAL PAID
            # =====================================
            total_paid = (
                Payment.objects.filter(
                    user=payment.user,
                    status__in=[
                        "partial_paid",
                        "fully_paid",
                        "verification_pending"
                    ]
                )
                .filter(package__in=packages)
                .distinct()
                .aggregate(total=Sum("amount"))["total"]
                or 0
            )

            # =====================================
            # 🔹 REMAINING AMOUNT
            # =====================================
            remaining_amount = (
                total_package_price - float(total_paid)
            )

            if remaining_amount < 0:
                remaining_amount = 0

            # =====================================
            # 🔹 PAYMENT STATUS
            # =====================================
            if payment.status in [
                "verification_pending",
                "rejected"
            ]:
                payment_status = payment.status

            elif total_paid == 0:
                payment_status = "not_paid"

            elif total_paid < total_package_price:
                payment_status = "partial_paid"

            else:
                payment_status = "fully_paid"

            # =====================================
            # 🔹 PROOF URL
            # =====================================
            proof_url = None

            if payment.proof_file:
                url = reverse(
                    "payment-report-image",
                    kwargs={"payment_id": payment.id}
                )

                proof_url = request.build_absolute_uri(url)

            # =====================================
            # 🔹 SINGLE RESPONSE RECORD
            # =====================================
            response_data.append({
                "id": payment.id,

                "user_id": (
                    payment.user.id
                    if payment.user else None
                ),

                "student_id": (
                    payment.user.student_profile.id
                    if payment.user
                    and hasattr(payment.user, "student_profile")
                    else None
                ),

                "is_handholding": is_handholding,

                "handholding_participant_id":
                    handholding_participant_id,

                "user_name": (
                    f"{payment.user.first_name} "
                    f"{payment.user.last_name}"
                    if payment.user else None
                ),

                "email": (
                    payment.user.email
                    if payment.user else None
                ),

                "total_paid": float(total_paid),

                "package_price": float(total_package_price),

                "remaining_amount": float(
                    remaining_amount
                ),

                "amount": float(payment.amount or 0),

                "program_ids": program_ids,
                "programs": program_names,

                "package_ids": package_ids,
                "packages": package_names,

                "payment_id": payment.id,
                "created_at": payment.created_at,
                "payment_date": payment.payment_date,
                "transaction_id": payment.transaction_id,

                "payment_status": payment_status,
                "method": payment.method,

                "proof_file_url": proof_url,
            })

        return Response(
            {
                "success": True,
                "count": len(response_data),
                "data": response_data
            },
            status=status.HTTP_200_OK
        )
    
 
 
 
 
        
@method_decorator(xframe_options_exempt, name="dispatch")
class PaymentProofFileView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, payment_id):
        payment = get_object_or_404(Payment, id=payment_id)

        if not payment.proof_file:
            raise Http404("Proof file not found")

        content_type, _ = mimetypes.guess_type(payment.proof_file.name)

        if content_type not in [
            "image/png",
            "image/jpeg",
            "application/pdf"
        ]:
            raise Http404("Unsupported file type")

        response = FileResponse(
            payment.proof_file.open("rb"),
            content_type=content_type
        )
        response["Content-Disposition"] = "inline"
        response["X-Frame-Options"] = "ALLOWALL"
        return response


class PaymentStatsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        # 🔹 FULLY PAID USERS
        fully_paid_user_ids = Payment.objects.filter(
            status='fully_paid'
        ).values_list('user_id', flat=True).distinct()

        # ==============================
        # 🔹 TOTAL EXPECTED COLLECTION
        # ==============================

        # Unique user-package combinations
        user_packages = Payment.objects.values(
            'user_id', 'package__id', 'package__price'
        ).distinct()

        total_users = user_packages.count()

        total_expected = UserProgramPackage.objects.aggregate(
            total=Sum('package__price')
        )['total'] or 0

        # ==============================
        # 🔹 TOTAL COLLECTED
        # ==============================

        total_collected = Payment.objects.aggregate(
            collected=Sum(
                'amount',
                filter=Q(status__in=['fully_paid', 'partial_paid'])
            )
        )['collected'] or 0

        # ==============================
        # 🔹 PARTIAL PAID
        # ==============================

        partial_queryset = Payment.objects.filter(
            status='partial_paid'
        ).exclude(
            user_id__in=fully_paid_user_ids
        )

        partial_data = partial_queryset.aggregate(
            total_amount=Sum('amount'),
            total_payments=Count('id'),
            total_users=Count('user', distinct=True)
        )

        # ==============================
        # 🔹 FULLY PAID
        # ==============================

        fully_queryset = Payment.objects.filter(status='fully_paid')

        fully_data = fully_queryset.aggregate(
            total_amount=Sum('amount'),
            total_payments=Count('id'),
            total_users=Count('user', distinct=True)
        )

        # ==============================
        # 🔹 VERIFICATION PENDING
        # ==============================

        pending_queryset = Payment.objects.filter(status='verification_pending')

        pending_data = pending_queryset.aggregate(
            total_amount=Sum('amount'),
            total_payments=Count('id'),
            total_users=Count('user', distinct=True)
        )

        # ==============================
        # 🔹 FINAL RESPONSE
        # ==============================

        return Response({
            "success": True,
            "data": {

                "total_expected_collection": {
                    "total_users": total_users,
                    "expected_amount": total_expected
                },

                "total_collected": total_collected,

                "partial_paid": {
                    "total_users": partial_data['total_users'] or 0,
                    "total_payments": partial_data['total_payments'] or 0,
                    "total_amount": partial_data['total_amount'] or 0
                },

                "fully_paid": {
                    "total_users": fully_data['total_users'] or 0,
                    "total_payments": fully_data['total_payments'] or 0,
                    "total_amount": fully_data['total_amount'] or 0
                },

                "verification_pending": {
                    "total_users": pending_data['total_users'] or 0,
                    "total_payments": pending_data['total_payments'] or 0,
                    "total_amount": pending_data['total_amount'] or 0
                }
            }
        })

        
class PaymentLogListAPIView(APIView):
    """
    Fetch all status change logs for a payment
    """
    permission_classes = [IsAdmin | IsSuperAdmin]

    def get(self, request, payment_id):
        payment = get_object_or_404(Payment, id=payment_id)

        logs = PaymentLog.objects.filter(
            payment=payment
        ).order_by("-created_at")

        serializer = PaymentLogSerializer(logs, many=True)

        return Response({
            "success": True,
            "payment_id": payment.id,
            "total_logs": logs.count(),
            "data": serializer.data
        })
  

 
# class StudentPaymentListAPIView(APIView):

#     def get(self, request, student_id=None, participant_id=None):

#         try:
#             # =========================
#             # 🔹 GET USER
#             # =========================
#             if student_id:
#                 student = get_object_or_404(
#                     StudentProfile.objects.select_related("user"),
#                     id=student_id
#                 )
#                 user = student.user

#             elif participant_id:
#                 participant = get_object_or_404(
#                     HandHoldingParticipant.objects.select_related("user"),
#                     id=participant_id
#                 )
#                 user = participant.user

#             else:
#                 return Response({
#                     "message": "student_id or participant_id is required"
#                 }, status=400)
                
#             # =========================
#             # 🔹 USER DETAILS
#             # =========================
#             student_data = None
#             participant_data = None

#             if student_id:
#                 student_data = {
#                     "student_id": student.id,
#                     "student_name": f"{user.first_name} {user.last_name}".strip(),
#                     "student_email": user.email,
#                 }

#             elif participant_id:
#                 participant_data = {
#                     "participant_id": participant.id,
#                     "participant_name": f"{user.first_name} {user.last_name}".strip(),
#                     "participant_email": user.email,
#                 }

#             # =========================
#             # 🔹 GET PAYMENTS
#             # =========================
#             payments = Payment.objects.filter(
#                 user=user
#             ).exclude(amount=0).order_by("-created_at")

#             # =========================
#             # 🔹 GET PACKAGE
#             # =========================
#             upp = UserProgramPackage.objects.filter(
#                 user=user,
#                 package__isnull=False
#             ).select_related("program", "package").order_by("-id").first()
#             print("UPP:", upp)
#             print("Package:", upp.package if upp else "No UPP")

#             # =========================
#             # 🔹 TOTAL PAID (VALID ONLY)
#             # =========================
#             total_paid = payments.filter(
#                 status__in=["partial_paid", "fully_paid"],
#                 amount__gt=0
#             ).aggregate(total=Sum("amount"))["total"] or 0

            
#             # =========================
#             # 🔹 PACKAGE + PROGRAM (FIXED)
#             # =========================
#             if upp and upp.package:
#                 package_price = upp.package.price
#                 program = upp.program
#                 package = upp.package
#             else:
#                 package_price = 0
#                 program = None
#                 package = None
                                
#                 print("program:", program)
#                 print("package:", package)

#             # ✅ Now calculate remaining
#             remaining_amount = max(package_price - total_paid, 0)

#             # ✅ Progress
#             payment_progress = (
#                 round(min((total_paid / package_price) * 100, 100), 2)
#                 if package_price > 0 else 0
#             )

#             # =========================
#             # 🔹 SERIALIZE PAYMENTS
#             # =========================
#             serializer = PaymentDetailSerializer(
#                 payments,
#                 many=True,
#                 context={
#                     "request": request,
#                     "payments": payments,
#                     "upp": upp
#                 }
#             )

#             payment_data = list(serializer.data)

#             # =========================
#             # 🔹 ADD REMAINING ROW (BACKEND CONTROLLED)
#             # =========================
#             # if package_price > 0 and remaining_amount > 0:
#             has_verification_pending = payments.filter(
#                 status="verification_pending"
#             ).exists()

#             # =========================
#             # 🔹 ADD REMAINING ROW ONLY IF NO VERIFICATION PENDING
#             # =========================
#             if (
#                 package_price > 0
#                 and remaining_amount > 0
#                 and not has_verification_pending
#             ):
#                 payment_data.insert(0, {
#                     "id": None,
#                     "amount": str(remaining_amount),
#                     "payment_type": "pending",
#                     "method": None,
#                     "transaction_id": None,
#                     "status": "not_paid",
#                     "payment_date": None,
#                     "program_id": program.id if program else None,
#                     "program": program.name if program else None,
#                     "package_id": package.id if package else None,
#                     "package": package.name if package else None,
#                     "package_price": package_price,
#                     "proof_file": None,
#                     "created_at": None
#                 })

#             # =========================
#             # 🔹 RESPONSE
#             # =========================
#             # return Response({
#             #     "message": "Payment list fetched successfully",
#             #     "user_id": user.id,
#             #     "total_payments": len(payment_data),
#             #     "package_price": package_price,
#             #     "total_paid": total_paid,
#             #     "remaining_amount": remaining_amount,
#             #     "payment_progress_percentage": payment_progress,
#             #     "data": payment_data
#             # })
#             response_payload = {
#                 "message": "Payment list fetched successfully",
#                 "user_id": user.id,
#                 "total_payments": len(payment_data),
#                 "package_price": package_price,
#                 "total_paid": total_paid,
#                 "remaining_amount": remaining_amount,
#                 "payment_progress_percentage": payment_progress,
#                 "data": payment_data
#             }

#             # =========================
#             # 🔹 Add Student/Participant Details
#             # =========================
#             if student_data:
#                 response_payload.update(student_data)

#             if participant_data:
#                 response_payload.update(participant_data)

#             return Response(response_payload)

#         except StudentProfile.DoesNotExist:
#             return Response({"message": "Student not found"}, status=404)

#         except HandHoldingParticipant.DoesNotExist:
#             return Response({"message": "Participant not found"}, status=404)

#         except Exception as e:
#             return Response({
#                 "message": "Something went wrong",
#                 "error": str(e)
#             }, status=500) 
 
class StudentPaymentListAPIView(APIView):

    def get(self, request, student_id=None, participant_id=None):

        try:
            # =========================
            # 🔹 GET USER
            # =========================
            if student_id:
                student = get_object_or_404(
                    StudentProfile.objects.select_related("user"),
                    id=student_id
                )
                user = student.user

            elif participant_id:
                participant = get_object_or_404(
                    HandHoldingParticipant.objects.select_related("user"),
                    id=participant_id
                )
                user = participant.user

            else:
                return Response({
                    "message": "student_id or participant_id is required"
                }, status=400)
                
            # =========================
            # 🔹 USER DETAILS
            # =========================
            student_data = None
            participant_data = None

            if student_id:
                student_data = {
                    "student_id": student.id,
                    "student_name": f"{user.first_name} {user.last_name}".strip(),
                    "student_email": user.email,
                }

            elif participant_id:
                participant_data = {
                    "participant_id": participant.id,
                    "participant_name": f"{user.first_name} {user.last_name}".strip(),
                    "participant_email": user.email,
                }

            # =========================
            # 🔹 GET PAYMENTS
            # =========================
            payments = Payment.objects.filter(
                user=user
            ).exclude(amount=0).order_by("-created_at")

            # =========================
            # 🔹 GET PACKAGE
            # =========================
            # latest_payment = payments.first()
            user_packages = UserProgramPackage.objects.filter(
                user=user
            ).select_related("program", "package")

            package_price = 0
            pending_programs = []

            for upp in user_packages:
                if upp.package:
                    package_price += float(upp.package.price or 0)

                    pending_programs.append({
                        "program_id": upp.program.id if upp.program else None,
                        "program_name": upp.program.name if upp.program else None,
                        "package": {
                            "id": upp.package.id,
                            "name": upp.package.name,
                            "price": str(upp.package.price or 0)
                        }
                    })

            print("Package Price:", package_price)
                                
                # print("program:", program)
                # print("package:", package)
            print("Package Price:", package_price)
            
            total_paid = float(
                payments.filter(
                    status__in=["partial_paid", "fully_paid"],
                    amount__gt=0
                ).aggregate(
                    total=Sum("amount")
                )["total"] or 0
            )
            print("Total Paid:", total_paid)

            # ✅ Now calculate remaining
            remaining_amount = max(package_price - total_paid, 0)
            print("Remaining Amount:", remaining_amount)

            # ✅ Progress
            payment_progress = (
                round(min((total_paid / package_price) * 100, 100), 2)
                if package_price > 0 else 0
            )

            # =========================
            # 🔹 SERIALIZE PAYMENTS
            # =========================
            serializer = PaymentDetailSerializer(
                payments,
                many=True,
                context={
                    "request": request,
                    "payments": payments
                    
                }
            )

            payment_data = list(serializer.data)

            # =========================
            # 🔹 ADD REMAINING ROW (BACKEND CONTROLLED)
            # =========================
            # if package_price > 0 and remaining_amount > 0:
            has_verification_pending = payments.filter(
                status="verification_pending"
            ).exists()

            # =========================
            # 🔹 ADD REMAINING ROW ONLY IF NO VERIFICATION PENDING
            # =========================
            if (
                package_price > 0
                and remaining_amount > 0
                and not has_verification_pending
            ):
                payment_data.insert(0, {
                    "id": None,
                    "amount": str(remaining_amount),
                    "payment_type": "pending",
                    "method": None,
                    "transaction_id": None,
                    "status": "not_paid",
                    "payment_date": None,
                    "package_price": package_price,
                    "programs": pending_programs,
                    "proof_file": None,
                    "created_at": None
                })

            # =========================
            # 🔹 RESPONSE
            # =========================
            # return Response({
            #     "message": "Payment list fetched successfully",
            #     "user_id": user.id,
            #     "total_payments": len(payment_data),
            #     "package_price": package_price,
            #     "total_paid": total_paid,
            #     "remaining_amount": remaining_amount,
            #     "payment_progress_percentage": payment_progress,
            #     "data": payment_data
            # })
            response_payload = {
                "message": "Payment list fetched successfully",
                "user_id": user.id,
                "total_payments": len(payment_data),
                "package_price": package_price,
                "total_paid": total_paid,
                "remaining_amount": remaining_amount,
                "payment_progress_percentage": payment_progress,
                "data": payment_data
            }

            # =========================
            # 🔹 Add Student/Participant Details
            # =========================
            if student_data:
                response_payload.update(student_data)

            if participant_data:
                response_payload.update(participant_data)

            return Response(response_payload)

        except StudentProfile.DoesNotExist:
            return Response({"message": "Student not found"}, status=404)

        except HandHoldingParticipant.DoesNotExist:
            return Response({"message": "Participant not found"}, status=404)

        except Exception as e:
            return Response({
                "message": "Something went wrong",
                "error": str(e)
            }, status=500) 
  
 
        
class StudentPaymentProgressAPIView(APIView):
    """
    Fetch payment progress summary of a student
    """

    def get(self, request, student_id):
        student = get_object_or_404(StudentProfile, id=student_id)
        user = student.user

        # 🔹 Get all user packages
        user_packages = UserProgramPackage.objects.filter(
            user=user,
            package__isnull=False
        ).select_related("package")
        
        # 🔹 Get payments (exclude not_paid)
        payments = Payment.objects.filter(
            user=user,
            status__in=["partial_paid", "fully_paid"]
        )

        # 🔹 Total Paid
        # total_paid = payments.aggregate(
        #     total=Sum("amount")
        # )["total"] or 0
        total_paid = float(
            payments.aggregate(
                total=Sum("amount")
            )["total"] or 0
        )

        # 🔹 Total Package Price
        package_price = sum(
            float(upp.package.price or 0)
            for upp in user_packages
            if upp.package
        )

        # 🔹 Remaining
        # remaining_amount = package_price - total_paid
        remaining_amount = max(package_price - total_paid, 0)
        
        # 🔹 Progress %
        if package_price > 0:
            # payment_progress = round((total_paid / package_price) * 100, 2)
            payment_progress = round(min((total_paid / package_price) * 100, 100), 2)
        else:
            payment_progress = 0

        return Response(
            {
                "package_price": package_price,
                "total_paid": total_paid,
                "remaining_amount": remaining_amount,
                "payment_progress_percentage": payment_progress
            },
            status=status.HTTP_200_OK
        )
        
class HandholdingPaymentProgressAPIView(APIView):
    """
    Fetch payment progress summary of a student
    """

    def get(self, request, participant_id):
        participant = get_object_or_404(HandHoldingParticipant, id=participant_id)
        user = participant.user

        # 🔹 Get program-package
        upp = UserProgramPackage.objects.filter(
                user=user,
                package__isnull=False
        ).select_related("program", "package").order_by("-id").first()
        
        # 🔹 Get payments (exclude not_paid)
        payments = Payment.objects.filter(
            user=user,
            status__in=["partial_paid", "fully_paid"]
        )

        # 🔹 Total Paid
        total_paid = payments.aggregate(
            total=Sum("amount")
        )["total"] or 0

        # 🔹 Package Price
        package_price = upp.package.price if upp and upp.package else 0

        # 🔹 Remaining
        # remaining_amount = package_price - total_paid
        remaining_amount = max(package_price - total_paid, 0)
        # 🔹 Progress %
        if package_price > 0:
            # payment_progress = round((total_paid / package_price) * 100, 2)
            payment_progress = round(min((total_paid / package_price) * 100, 100), 2)
        else:
            payment_progress = 0

        return Response(
            {
                "package_price": package_price,
                "total_paid": total_paid,
                "remaining_amount": remaining_amount,
                "payment_progress_percentage": payment_progress
            },
            status=status.HTTP_200_OK
        )        
        

            
# class StudentPackagePaymentSummaryAPIView(APIView):
#     """
#     Get payment summary by student_id OR participant_id + package_id
#     """
#     permission_classes = [IsAdmin | IsSuperAdmin]

#     def get(self, request, package_id, student_id=None, participant_id=None):

#         try:
#             # =========================
#             # 🔹 GET USER
#             # =========================
#             if student_id:
#                 student = StudentProfile.objects.select_related("user").get(id=student_id)
#                 user = student.user
#                 name = f"{user.first_name} {user.last_name}"

#             elif participant_id:
#                 participant = HandHoldingParticipant.objects.select_related("user").get(id=participant_id)
#                 user = participant.user
#                 name = f"{user.first_name} {user.last_name}"

#             else:
#                 return Response({
#                     "success": False,
#                     "message": "student_id or participant_id is required"
#                 }, status=400)

#             # =========================
#             # 🔹 PACKAGE
#             # =========================
#             package = get_object_or_404(Package, id=package_id)

#             # =========================
#             # 🔹 PAYMENTS
#             # =========================
#             payments = Payment.objects.filter(
#                 user=user,
#                 package=package
#             )

#             if not payments.exists():
#                 return Response(
#                     {
#                         "success": False,
#                         "message": "No payment found for this user and package."
#                     },
#                     status=status.HTTP_404_NOT_FOUND
#                 )

#             total_paid = payments.filter(
#                 status__in=["partial_paid", "fully_paid", "verification_pending"]
#             ).aggregate(
#                 total=Sum("amount")
#             )["total"] or 0

#             package_price = package.price
#             remaining_amount = max(package_price - total_paid, 0)

#             latest_payment = payments.order_by("-created_at").first()

#             return Response(
#                 {
#                     "success": True,
#                     "data": {
#                         "user_id": user.id,
#                         "name": name,
#                         "package_id": package.id,
#                         "package_name": package.name,
#                         "package_price": package_price,
#                         "total_paid": total_paid,
#                         "remaining_amount": remaining_amount,
#                         "payment_status": latest_payment.status
#                     }
#                 },
#                 status=status.HTTP_200_OK
#             )

#         except StudentProfile.DoesNotExist:
#             return Response({"message": "Student not found"}, status=404)

#         except HandHoldingParticipant.DoesNotExist:
#             return Response({"message": "Participant not found"}, status=404)

#         except Exception as e:
#             return Response({
#                 "message": "Something went wrong",
#                 "error": str(e)
#             }, status=500)


class StudentPackagePaymentSummaryAPIView(APIView):
    """
    Get payment summary by student_id OR participant_id + package_id
    """
    permission_classes = [IsAdmin | IsSuperAdmin]

    def get(self, request, package_id, student_id=None, participant_id=None):

        try:
            # =========================
            # 🔹 GET USER
            # =========================
            if student_id:
                student = StudentProfile.objects.select_related("user").get(id=student_id)
                user = student.user
                name = f"{user.first_name} {user.last_name}"

            elif participant_id:
                participant = HandHoldingParticipant.objects.select_related("user").get(id=participant_id)
                user = participant.user
                name = f"{user.first_name} {user.last_name}"

            else:
                return Response({
                    "success": False,
                    "message": "student_id or participant_id is required"
                }, status=400)

            # =========================
            # 🔹 PACKAGE
            # =========================
            package = get_object_or_404(Package, id=package_id)

            # =========================
            # 🔹 ALL PACKAGES FROM USER PAYMENTS
            # =========================
            payments = (
                Payment.objects
                .filter(user=user)
                .prefetch_related("package")
            )

            if not payments.exists():
                return Response(
                    {
                        "success": False,
                        "message": "No payment found."
                    },
                    status=status.HTTP_404_NOT_FOUND
                )

            package_summary = []
            total_package_price = 0
            total_paid_amount = 0
            total_remaining_amount = 0

            latest_payment = payments.order_by("-created_at").first()

            # =========================
            # 🔹 TOTAL PAID
            # =========================
            total_paid = (
                Payment.objects.filter(
                    user=user,
                    status__in=[
                        "partial_paid",
                        "fully_paid",
                        "verification_pending"
                    ]
                ).aggregate(
                    total=Sum("amount")
                )["total"] or 0
            )

            remaining_payment_pool = float(total_paid)

            # =========================
            # 🔹 PACKAGES
            # =========================
            packages = (
                Package.objects.filter(
                    payment__user=user
                )
                .distinct()
                .order_by("id")
            )

            for package in packages:

                package_price = float(package.price or 0)

                paid_for_package = min(
                    remaining_payment_pool,
                    package_price
                )

                remaining_payment_pool -= paid_for_package

                remaining = package_price - paid_for_package

                package_summary.append({
                    "package_id": package.id,
                    "package_name": package.name,
                    "package_price": package_price,
                    "paid_amount": paid_for_package,
                    "remaining_amount": remaining
                })

                total_package_price += package_price
                total_remaining_amount += remaining

            # response total paid
            total_paid_amount = float(total_paid)

            return Response(
                {
                    "success": True,
                    "data": {
                        "user_id": user.id,
                        "name": name,

                        "package_price": total_package_price,
                        "total_paid": total_paid_amount,
                        "remaining_amount": total_remaining_amount,

                        "payment_status": (
                            latest_payment.status
                            if latest_payment else None
                        ),

                        "packages": package_summary
                    }
                },
                status=status.HTTP_200_OK
            )

        except StudentProfile.DoesNotExist:
            return Response({"message": "Student not found"}, status=404)

        except HandHoldingParticipant.DoesNotExist:
            return Response({"message": "Participant not found"}, status=404)

        except Exception as e:
            return Response({
                "message": "Something went wrong",
                "error": str(e)
            }, status=500)
            
                 
            
                   
class UpdatePaymentStatusAPIView(APIView):
    """
    Update payment status anytime
    """
    permission_classes = [IsAuthenticated]  

    @transaction.atomic
    def post(self, request, pk):

        payment = get_object_or_404(Payment, id=pk)

        new_status = request.data.get("status")

        # ✅ Validate status
        VALID_STATUSES = [
            "fully_paid",
            "partial_paid",
            "verification_pending"
        ]

        if new_status not in VALID_STATUSES:
            return Response(
                {
                    "success": False,
                    "message": f"Status must be one of {VALID_STATUSES}"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ✅ Update payment
        payment.status = new_status
        payment.verified_by = request.user
        payment.save(update_fields=["status", "verified_by", "updated_at"])

        return Response(
            {
                "success": True,
                "message": "Payment status updated successfully",
                "payment_id": payment.id,
                "new_status": payment.status,
                "verified_by": request.user.id
            },
            status=status.HTTP_200_OK
        )
        
# =================================== Student Payment Summary API ===================================

class StudentPaymentDetailAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        student = get_object_or_404(
            StudentProfile.objects.select_related("user"),  # ✅ removed program
            id=student_id
        )

        payments = Payment.objects.filter(
            user=student.user
        ).select_related("package", "package__program")

        data = []

        for payment in payments:
            package_price = payment.package.price if payment.package else 0

            total_paid = Payment.objects.filter(
                user=student.user,
                package=payment.package
            ).aggregate(total=Sum("amount"))["total"] or 0

            remaining_amount = max(package_price - total_paid, 0)

            # ✅ Proper proof URL (same as list API)
            proof_url = None
            if payment.proof_file:
                url = reverse(
                    "payment-report-image",
                    kwargs={"payment_id": payment.id}
                )
                proof_url = request.build_absolute_uri(url)

            data.append({
                "user_id": student.user.id,
                "student_id": student.id,
                "user_name": f"{student.user.first_name} {student.user.last_name}",
                "email": student.user.email,

                "total_paid": total_paid,
                "remaining_amount": remaining_amount,
                "package_price": package_price,

                "amount": payment.amount,

                "program_id": (
                    payment.package.program.id
                    if payment.package and payment.package.program
                    else None
                ),
                "program": (
                    payment.package.program.name
                    if payment.package and payment.package.program
                    else None
                ),

                "package_id": payment.package.id if payment.package else None,
                "package": payment.package.name if payment.package else None,

                "payment_id": payment.id,
                "created_at": payment.created_at,
                "payment_date": payment.payment_date,
                "transaction_id": payment.transaction_id,
                "payment_status": payment.status,
                "method": payment.method,

                "proof_file_url": proof_url,
            })

        return Response({
            "success": True,
            "data": data
        })
        
        
# class PendingPaymentUsersAPIView(APIView):
#     """
#     Fetch the latest (last) payment record for users whose payment status
#     is 'not_paid' or 'partial_paid'.
#     """

#     permission_classes = [IsAuthenticated]

#     def get(self, request):

#         users = User.objects.all()
#         response_data = []

#         for user in users:

#             # Get last payment record
#             payment = Payment.objects.filter(user=user).order_by("-created_at").first()

#             if not payment:
#                 continue

#             # Only include not_paid or partial_paid
#             if payment.status not in ["not_paid", "partial_paid"]:
#                 continue

#             package = payment.package
#             program = package.program if package else None

#             response_data.append({
#                 "user_id": user.id,
#                 "student_id": getattr(payment.user.student_profile, "id", None),
#                 "name": f"{user.first_name} {user.last_name}",
#                 "email": user.email,
#                 "preferred_counselling_mode": getattr(user.student_profile, "preferred_counselling_mode", None),

#                 "payment_id": payment.id,
#                 "amount": payment.amount,
#                 "status": payment.status,
#                 "method": payment.method,
#                 "transaction_id": payment.transaction_id,
#                 "payment_date": payment.payment_date,

#                 "program": program.name if program else None,
#                 "package": package.name if package else None,
#                 "package_price": package.price if package else None,

#                 "created_at": payment.created_at
#             })

#         return Response(
#             {
#                 "success": True,
#                 "count": len(response_data),
#                 "data": response_data
#             }
#         )
      
      
class PendingPaymentUsersAPIView(APIView):
    """
    Fetch latest payment record for users whose payment status
    is 'not_paid' or 'partial_paid' and who have not booked counselling.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):

        users = User.objects.all()
        response_data = []

        for user in users:

            # Check student profile
            student = getattr(user, "student_profile", None)
            if not student:
                continue

            # ❌ Skip users who already booked/rescheduled/completed counselling
            booking_exists = Booking.objects.filter(
                student=student,
                status__in=["booked", "rescheduled", "completed"]
            ).exists()

            if booking_exists:
                continue

            # Get latest payment
            payment = Payment.objects.filter(user=user).order_by("-created_at").first()

            if not payment:
                continue

            if payment.status not in ["not_paid", "partial_paid"]:
                continue

            # package = payment.package
            # program = package.program if package else None
            

            packages = payment.package.all()

            program_map = {}

            for pkg in packages:

                if not pkg.program:
                    continue

                program_id = pkg.program.id

                if program_id not in program_map:
                    program_map[program_id] = {
                        "id": pkg.program.id,
                        "name": pkg.program.name,
                        "packages": []
                    }

                program_map[program_id]["packages"].append({
                    "id": pkg.id,
                    "name": pkg.name,
                    "price": pkg.price
                })

            program_data = list(program_map.values())

            package_price = sum(
                pkg.price or 0
                for pkg in packages
            )

            response_data.append({
                "user_id": user.id,
                "student_id": student.id,
                "name": f"{user.first_name} {user.last_name}",
                "email": user.email,
                "preferred_counselling_mode": getattr(student, "preferred_counselling_mode", None),

                "payment_id": payment.id,
                "amount": payment.amount,
                "status": payment.status,
                "method": payment.method,
                "transaction_id": payment.transaction_id,
                "payment_date": payment.payment_date,

                # "program": program.name if program else None,
                # "package": package.name if package else None,
                # "package_price": package.price if package else None,
                "program": program_data,
                # "package": package_data,
                "package_price": package_price,

                "created_at": payment.created_at
            })

        return Response({
            "success": True,
            "count": len(response_data),
            "data": response_data
        })      
      
  
class PaymentReminderAPI(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, student_id):

        try:
            student = StudentProfile.objects.select_related("user").get(id=student_id)
        except StudentProfile.DoesNotExist:
            return Response(
                {"error": "Student not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        payments = Payment.objects.filter(
            user=student.user,
            status__in=["not_paid", "partial_paid"]
        ).prefetch_related("package")

        if not payments.exists():
            return Response(
                {"message": "No pending payments found"},
                status=status.HTTP_200_OK
            )

        count = 0

        for payment in payments:
            try:
                send_payment_reminder_email(payment.user, payment)
                count += 1
            except Exception as e:
                print("ERROR:", str(e))
                return Response(
                    {"error": str(e)},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        return Response(
            {
                "message": "Payment reminder sent successfully",
                "total_reminders_sent": count
            },
            status=status.HTTP_200_OK
        )
        
class HandHoldingPaymentReminderAPI(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, participant_id):

        try:
            participant = HandHoldingParticipant.objects.select_related("user").get(id=participant_id)
        except HandHoldingParticipant.DoesNotExist:
            return Response(
                {"error": "Participant not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        payments = Payment.objects.filter(
            user=participant.user,
            status__in=["not_paid", "partial_paid"]
        ).select_related("package")

        if not payments.exists():
            return Response(
                {"message": "No pending payments found"},
                status=status.HTTP_200_OK
            )

        count = 0

        for payment in payments:
            send_payment_reminder_email(payment.user, payment)
            count += 1

        return Response(
            {
                "message": "Payment reminder sent successfully",
                "total_reminders_sent": count
            },
            status=status.HTTP_200_OK
        )        
        
        
        
class PendingHandHoldingParticipantsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        participants = HandHoldingParticipant.objects.select_related("user")

        result = []

        for participant in participants:
            user = participant.user

            # 🔹 Get latest handholding package
            upp = UserProgramPackage.objects.filter(
                user=user,
                package__is_handholding=True
            ).select_related("package").order_by("-created_at").first()

            if not upp or not upp.package:
                continue

            package = upp.package
            package_price = package.price or Decimal("0")

            # 🔹 Total paid
            total_paid = Payment.objects.filter(
                user=user,
                package=package
            ).exclude(status="not_paid").aggregate(
                total=Sum("amount")
            )["total"] or Decimal("0")

            # 🔹 Payment status
            if total_paid == 0:
                payment_status = "not_paid"
            elif total_paid < package_price:
                payment_status = "partial_paid"
            else:
                payment_status = "fully_paid"

            # ✅ FILTER
            if payment_status in ["not_paid", "partial_paid"]:
                result.append({
                    "id": participant.id,
                    "user_id": user.id,
                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "email": user.email,
                    # "name": f"{user.first_name} {user.last_name}",

                    # ✅ NEW FIELD ADDED
                    "preferred_counselling_mode": participant.preferred_counselling_mode,

                    "package_id": package.id,
                    "package_name": package.name,
                    "package_price": package_price,
                    "total_paid": total_paid,
                    "remaining_amount": package_price - total_paid,
                    "payment_status": payment_status,
                })

        return Response({
            "success": True,
            "count": len(result),
            "data": result
        })
        
class GenerateReceiptByStudentAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):

        # =========================
        # GET STUDENT
        # =========================
        student = StudentProfile.objects.filter(
            id=student_id
        ).select_related("user").first()

        if not student:
            return Response({"message": "Student not found"}, status=404)

        user = student.user

        # =========================
        # GET LATEST BOOKING
        # =========================
        # booking = (
        #     Booking.objects
        #     .filter(student=student)
        #     .select_related("slot")
        #     .order_by("-id")
        #     .first()
        # )

        # if not booking:
        #     return Response({"message": "No booking found"}, status=404)

        # =========================
        # TOTAL PACKAGE PRICE
        # =========================
        user_packages = (
            UserProgramPackage.objects
            .filter(user=user)
            .select_related("package")
        )

        if user_packages.exists():

            package_price = sum(
                (upp.package.price or Decimal("0"))
                for upp in user_packages
                if upp.package
            )

        else:
            # fallback: use payment packages
            latest_payment = (
                Payment.objects
                .filter(user=user)
                .prefetch_related("package")
                .order_by("-id")
                .first()
            )

            if latest_payment and latest_payment.package.exists():

                package_price = sum(
                    (pkg.price or Decimal("0"))
                    for pkg in latest_payment.package.all()
                )

            else:
                return Response(
                    {"message": "Package not assigned or payment not found"},
                    status=404
                )
        # =========================
        # SERVICE NAME
        # =========================
        # service_name = (
        #     booking.slot.mode
        #     if booking.slot
        #     else "Counselling Services"
        # )
        service_name = "Counselling Services"

        # =========================
        # GENERATE PDF
        # =========================
        pdf_buffer = generate_receipt_pdf(
            name=f"{user.first_name} {user.last_name}",
            service_name=service_name,
            amount=package_price,
            # date=booking.date.strftime("%d/%m/%Y") if booking.date else None
            date=None
        )

        # =========================
        # DOWNLOAD
        # =========================
        return FileResponse(
            pdf_buffer,
            as_attachment=True,
            filename=f"receipt_student_{student_id}.pdf"
        )
        
class GenerateReceiptByHandHoldingParticipantAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, participant_id):

        # =========================
        # GET PARTICIPANT
        # =========================
        participant = HandHoldingParticipant.objects.filter(
            id=participant_id
        ).select_related("user").first()

        if not participant:
            return Response(
                {"message": "HandHolding participant not found"},
                status=404
            )

        user = participant.user

        # =========================
        # GET FULLY PAID PAYMENT
        # =========================
        payment = (
            Payment.objects
            .filter(
                user=user,
                status="fully_paid"
            )
            .select_related("package")
            .order_by("-created_at")
            .first()
        )

        if not payment:
            return Response(
                {"message": "No fully paid payment found"},
                status=404
            )

        # =========================
        # PACKAGE PRICE
        # =========================
        package_price = (
            payment.package.price
            if payment.package
            else payment.amount
        )

        # =========================
        # SERVICE NAME
        # =========================
        service_name = (
            payment.package.name
            if payment.package
            else "HandHolding Services"
        )

        # =========================
        # GENERATE PDF
        # =========================
        pdf_buffer = generate_receipt_pdf(
            name=f"{user.first_name} {user.last_name}",
            service_name=service_name,
            amount=package_price,
            date=payment.payment_date.strftime("%d/%m/%Y")
            if payment.payment_date else None
        )

        # =========================
        # DOWNLOAD RECEIPT
        # =========================
        return FileResponse(
            pdf_buffer,
            as_attachment=True,
            filename=f"handholding_receipt_{participant_id}.pdf"
        )

def get_first_error(errors):
    if isinstance(errors, dict):
        for value in errors.values():
            if isinstance(value, list):
                return value[0]
            return value
    return str(errors)          
        
class PaymentCreateByStudentAPIView(APIView):
    """
    Create Payment directly using student_id in URL

    URL Example:
    POST /api/payment/create/student/12/

    ✅ Automatically maps:
    - student_id → StudentProfile
    - StudentProfile → User
    - User → Payment

    ✅ Supports:
    - Full payment
    - Partial payment
    - Online/Offline
    - Report unlock logic
    - Notifications
    - Email

    ❌ Prevents:
    - Overpayment
    - Duplicate full payment
    """

    permission_classes = [IsAuthenticated]

    # =====================================================
    # 🔓 REPORT UNLOCK LOGIC
    # =====================================================
    def unlock_report_if_paid(self, payment):
        """
        Unlock report ONLY if:
        ✅ Full package payment completed
        ✅ Review submitted
        ✅ Booking completed
        Skip report logic for College List Analysis packages.
        """
        
        # ======================================
        # 🚫 Skip report lock/unlock for
        # College List Analysis students
        # ======================================
        # if (
        #     payment.package
        #     and payment.package.engineering_test_analysis
        # ):
        #     return
        if payment.package.filter(
            engineering_test_analysis=True
        ).exists():
            return

        from django.db.models import Sum

        # =========================
        # 💳 Total Paid
        # =========================
        total_paid = (
            Payment.objects.filter(
                user=payment.user
                # package=payment.package
            ).aggregate(
                total=Sum("amount")
            )["total"] or 0
        )

        from decimal import Decimal

        package_price = sum(
            (pkg.price or Decimal("0"))
            for pkg in payment.package.all()
        )

        # =========================
        # 📝 Review Check
        # =========================
        submitted_review = (
            Review.objects.filter(
                user=payment.user,
                review_status="submitted"
            ).exists()
        )

        # =========================
        # 🎓 Student Profile
        # =========================
        student_profile = (
            StudentProfile.objects.filter(
                user=payment.user
            ).first()
        )

        # =========================
        # 📅 Booking Check
        # =========================
        completed_booking = False

        if student_profile:
            completed_booking = (
                Booking.objects.filter(
                    student=student_profile,
                    status="completed"
                ).exists()
            )

        # =========================
        # 🔓 Unlock Rule
        # =========================
        if (
            total_paid >= package_price
            and submitted_review
            and completed_booking
        ):
            Report.objects.filter(
                user=payment.user
            ).update(
                report_status="received_unlocked"
            )

        else:
            Report.objects.filter(
                user=payment.user
            ).update(
                report_status="received_locked"
            )

    # =====================================================
    # 🆕 CREATE PAYMENT
    # =====================================================
    def post(self, request, student_id):

        # =========================
        # 🎓 Get Student
        # =========================
        student_profile = get_object_or_404(
            StudentProfile,
            id=student_id
        )

        # =========================
        # 📥 Copy Request Data
        # =========================
        data = request.data.copy()

        # Auto inject student_profile
        data["student_profile"] = student_profile.id

        # =========================
        # 🧾 Serializer
        # =========================
        serializer = PaymentCreateStudentSerializer(
            data=data,
            context={"request": request}
        )

        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "errors": get_first_error(serializer.errors)
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # =========================
        # 💾 Save Payment
        # =========================
        with transaction.atomic():

            payment = serializer.save()

            # 🔓 Unlock report
            self.unlock_report_if_paid(payment)

            # =========================
            # 🔔 Notification
            # =========================
            user_name = f"{payment.user.first_name} {payment.user.last_name}"
            amount = payment.amount

            title = "Payment Received"
            message = (
                f"User {user_name} has successfully made a payment of ₹{amount}."
            )

            admin_users = User.objects.filter(
                is_superuser=True
            )

            for admin in admin_users:
                admin_id = admin.id

                on_commit(
                    lambda admin_id=admin_id: safe_notify(
                        admin_id,
                        title,
                        message
                    )
                )

        # =========================
        # 📧 Email
        # =========================
        try:
            send_payment_created_email(
                payment.user,
                payment
            )
        except Exception as e:
            print("Email error:", e)

        # =========================
        # 📤 Response
        # =========================
        response_data = PaymentResponseSerializer(
            payment,
            context={"request": request}
        ).data

        return Response(
            {
                "success": True,
                "message": "Payment created successfully",
                "student_id": student_profile.id,
                "data": response_data
            },
            status=status.HTTP_201_CREATED
        )

    # =====================================================
    # ✏️ UPDATE PAYMENT
    # =====================================================
    def put(self, request, student_id):

        # =========================
        # 🎓 Student
        # =========================
        student_profile = get_object_or_404(
            StudentProfile,
            id=student_id
        )

        # =========================
        # 💳 Payment
        # =========================
        # payment = Payment.objects.filter(
        #     user=student_profile.user
        # ).order_by("-created_at").first()
        payment = Payment.objects.filter(
            user=student_profile.user
        ).exclude(
            status="not_paid"
        ).exclude(
            amount=0
        ).order_by("-created_at").first()

        if not payment:
            return Response(
                {
                    "success": False,
                    "message": "No payment found for this student."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        # =========================
        # 📥 Copy Data
        # =========================
        data = request.data.copy()
        data["student_profile"] = student_profile.id

        serializer = PaymentCreateStudentSerializer(
            payment,
            data=data,
            partial=True,
            context={"request": request}
        )

        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "errors": get_first_error(serializer.errors)
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # =========================
        # 💾 Save
        # =========================
        with transaction.atomic():
            payment = serializer.save()

            self.unlock_report_if_paid(payment)

        # =========================
        # 📧 Email
        # =========================
        send_payment_updated_email(
            payment.user,
            payment
        )

        response_data = PaymentResponseSerializer(
            payment,
            context={"request": request}
        ).data

        return Response(
            {
                "success": True,
                "message": "Payment updated successfully",
                "student_id": student_profile.id,
                "data": response_data
            },
            status=status.HTTP_200_OK
        )
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        