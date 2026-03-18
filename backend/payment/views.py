from django.db import models
from django.shortcuts import get_object_or_404, render

from accounts.models import User
from counselling_slot.tasks import create_system_notification
from report.models import Report
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
from payment.serializers import PaymentCreateSerializer, PaymentListSerializer, PaymentLogSerializer, PaymentResponseSerializer, StudentPaymentDetailSerializer
from payment.utils import send_payment_approved_email, send_payment_created_email, send_payment_reject_email, send_payment_reject_whatsapp, send_payment_rejected_email, send_payment_updated_email
from program_package.models import Package, UserProgramPackage

User = get_user_model()

class PaymentCreateAPIView(APIView):
    """
    Create Payment (Online / Offline)
    """
    permission_classes = [IsAuthenticated]
    
    def unlock_report_if_paid(self, payment):
        """
        Unlock report if total payment reaches package price
        """

        from django.db.models import Sum

        total_paid = (
            Payment.objects.filter(
                user=payment.user,
                package=payment.package
            ).aggregate(total=Sum("amount"))["total"] or 0
        )

        package_price = payment.package.price

        # ✅ Fully paid condition
        if total_paid >= package_price:

            Report.objects.filter(
                user=payment.user
            ).update(report_status="received_unlocked")

    def post(self, request):
        serializer = PaymentCreateSerializer(
            data=request.data,
            context={"request": request}
        )

        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "errors": serializer.errors
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

            message = (
                f"User {user_name} has successfully made a payment of ₹{amount}."
            )

            admin_users = User.objects.filter(is_superuser=True)

            for admin in admin_users:
                admin_id = admin.id  # ✅ fix lambda issue

                on_commit(lambda admin_id=admin_id: create_system_notification.delay(
                    admin_id,
                    title,
                    message
                ))
            
        # send email
        send_payment_created_email(payment.user, payment)

        # ✅ THIS IS THE KEY LINE
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
                    "errors": serializer.errors
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

#     - Allows approval or rejection of a payment only when its status is
#       `verification_pending`.
#     - On approval, automatically determines whether the payment is
#       `fully_paid` or `partial_paid` based on cumulative payments for the package.
#     - Prevents overpayment: if cumulative payments exceed package price, returns error.
#     - On rejection, resets the payment to `pending` and notifies the user via email and WhatsApp.
#     """
#     permission_classes = [IsAdmin | IsSuperAdmin]  

#     def post(self, request, payment_id):
#         action = request.data.get('action')
#         payment = get_object_or_404(Payment, id=payment_id)

#         if payment.status != 'verification_pending':
#             return Response(
#                 {"error": "Only verification_pending payments can be processed"},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         old_status = payment.status   # 🔹 capture old status

#         package_price = payment.package.price

#         total_paid = Payment.objects.filter(
#             user=payment.user,
#             package=payment.package,
#             status__in=['fully_paid', 'partial_paid']
#         ).aggregate(total=Sum('amount'))['total'] or 0

#         cumulative_amount = total_paid + payment.amount

#         # ❌ Prevent overpayment
#         if action == 'approve' and cumulative_amount > package_price:
#             return Response(
#                 {
#                     "success": False,
#                     "error": f"Total payment exceeds package price. Please verify amounts." 
                             
#                 },
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         # ✅ APPROVE
#         if action == 'approve':
#             if cumulative_amount >= package_price:
#                 payment.status = 'fully_paid'
#             else:
#                 payment.status = 'partial_paid'

#         # ❌ REJECT
#         elif action == 'reject':
#             payment.status = 'pending'

#         else:
#             return Response(
#                 {"success": False, "error": "Invalid action. Use approve or reject"},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         # 🔹 Save payment
#         payment.verified_by = request.user
#         payment.save()

#         # 🔹 Create payment log
#         PaymentLog.objects.create(
#             payment=payment,
#             old_status=old_status,
#             new_status=payment.status,
#             changed_by=request.user
#         )

#         # 🔹 Assign program/package on approval
#         if action == 'approve':
#             UserProgramPackage.objects.get_or_create(
#                 user=payment.user,
#                 program=payment.package.program,
#                 package=payment.package,
#                 defaults={'assigned_by': request.user.email}
#             )

#             return Response({
#                 "success": True,
#                 "message": "Payment approved successfully",
#                 "payment_status": payment.status,
#                 "cumulative_amount": cumulative_amount,
#                 "package_price": package_price
#             })

#         # 🔹 Notify on rejection
#         send_payment_reject_email(payment.user.email)
#         send_payment_reject_whatsapp(payment.user.phone)

#         return Response({
#             "success": True,
#             "message": "Payment rejected and user notified",
#             "payment_id": payment.id
#         })
        
        
class VerifyPaymentAPIView(APIView):
    """
    Admin-only API to verify a payment.

    - Approve:
        • Calculates cumulative payments
        • Sets status to fully_paid / partial_paid
        • Prevents overpayment
        • Assigns program/package if fully paid

    - Reject:
        • Sends email & WhatsApp notification
        • Logs the action
        • Permanently deletes the payment record
    """

    # permission_classes = [IsAdmin | IsSuperAdmin]
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
        package_price = payment.package.price

        # Calculate total paid excluding current payment
        total_paid = Payment.objects.filter(
            user=payment.user,
            package=payment.package,
            status__in=['fully_paid', 'partial_paid']
        ).exclude(id=payment.id).aggregate(
            total=Sum('amount')
        )['total'] or 0

        cumulative_amount = total_paid + payment.amount

        # ======================================
        # ✅ APPROVE LOGIC
        # ======================================
        if action == 'approve':

            # Prevent overpayment
            if cumulative_amount > package_price:
                return Response(
                    {
                        "success": False,
                        "error": "Total payment exceeds package price."
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Determine payment status
            if cumulative_amount >= package_price:
                payment.status = 'fully_paid'
            else:
                payment.status = 'partial_paid'

            payment.verified_by = request.user
            payment.save()

            # Log status change
            PaymentLog.objects.create(
                payment=payment,
                old_status=old_status,
                new_status=payment.status,
                changed_by=request.user
            )

            # Assign program/package if fully paid
            if payment.status == 'fully_paid':
                UserProgramPackage.objects.get_or_create(
                    user=payment.user,
                    program=payment.package.program,
                    package=payment.package,
                    defaults={'assigned_by': request.user.email}
                )
            
            # Send email
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
        # ❌ REJECT LOGIC (DELETE RECORD)
        # ======================================
        elif action == 'reject':

            # Send notifications
            send_payment_rejected_email(payment.user)
            # send_payment_reject_whatsapp(payment.user.phone)

            # Calculate remaining payments excluding this one
            remaining_paid = Payment.objects.filter(
                user=payment.user,
                package=payment.package,
                status__in=['fully_paid', 'partial_paid']
            ).exclude(id=payment.id).aggregate(
                total=Sum('amount')
            )['total'] or 0

            # Determine new status
            if remaining_paid == 0:
                new_status = "not_paid"
            elif remaining_paid < package_price:
                new_status = "partial_paid"
            else:
                new_status = "fully_paid"

            # Update current payment
            payment.status = "not_paid"
            payment.verified_by = request.user
            payment.save()

            # Update other payments
            Payment.objects.filter(
                user=payment.user,
                package=payment.package
            ).exclude(id=payment.id).update(status=new_status)

            # Log action
            PaymentLog.objects.create(
                payment=payment,
                old_status=old_status,
                new_status=new_status,
                changed_by=request.user
            )

            return Response({
                "success": True,
                "message": "Payment rejected successfully",
                "remaining_paid": remaining_paid,
                "new_status": new_status
            })
            
            
            
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

class PaymentListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        response_data = []

        # Get unique user + package combinations
        payment_groups = Payment.objects.values(
            "user_id", "package_id"
        ).distinct()

        for group in payment_groups:

            user_id = group["user_id"]
            package_id = group["package_id"]

            # All payments for that user + package
            payments = Payment.objects.filter(
                user_id=user_id,
                package_id=package_id
            ).select_related(
                "user",
                "user__student_profile",
                "package",
                "package__program"
            ).order_by("-created_at")

            if not payments.exists():
                continue

            latest_payment = payments.first()

            # 🔥 SUM OF ALL PAYMENTS
            total_paid = payments.filter(
                status__in=["partial_paid", "fully_paid", "verification_pending"]
            ).aggregate(
                total=Sum("amount")
            )["total"] or 0

            package_price = latest_payment.package.price if latest_payment.package else 0

            # 🔥 Remaining amount
            remaining_amount = package_price - total_paid
            if remaining_amount < 0:
                remaining_amount = 0

            # Payment status
            if latest_payment.status in ["verification_pending", "rejected"]:
                payment_status = latest_payment.status
            else:
                if total_paid == 0:
                    payment_status = "not_paid"
                elif total_paid < package_price:
                    payment_status = "partial_paid"
                else:
                    payment_status = "fully_paid"

            proof_url = None
            if latest_payment.proof_file:
                url = reverse(
                    "payment-report-image",
                    kwargs={"payment_id": latest_payment.id}
                )
                proof_url = request.build_absolute_uri(url)

            response_data.append({
                "user_id": latest_payment.user.id,
                "student_id": (
                    latest_payment.user.student_profile.id
                    if getattr(latest_payment.user, "student_profile", None)
                    else None
                ),
                "user_name": f"{latest_payment.user.first_name} {latest_payment.user.last_name}",
                "email": latest_payment.user.email,

                # Payment summary
                "total_paid": float(total_paid),
                "remaining_amount": float(remaining_amount),
                "package_price": float(package_price),

                # Last payment
                "amount": float(latest_payment.amount),

                "program_id": (
                    latest_payment.package.program.id
                    if latest_payment.package and latest_payment.package.program
                    else None
                ),
                "program": (
                    latest_payment.package.program.name
                    if latest_payment.package else None
                ),
                "package_id": latest_payment.package.id if latest_payment.package else None,
                "package": latest_payment.package.name if latest_payment.package else None,

                "payment_id": latest_payment.id,
                "created_at": latest_payment.created_at,
                "payment_date": latest_payment.payment_date,
                "transaction_id": latest_payment.transaction_id,
                "payment_status": payment_status,
                "method": latest_payment.method,

                "proof_file_url": proof_url,
            })

        return Response({
            "success": True,
            "count": len(response_data),
            "data": response_data
        }, status=status.HTTP_200_OK)
        
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
            'user_id', 'package_id', 'package__price'
        ).distinct()

        total_users = user_packages.count()

        total_expected = sum(
            item['package__price'] for item in user_packages
        ) if user_packages else 0

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
#     """
#     Fetch all payments of a student using student_id
#     """

#     def get(self, request, student_id):
#         student = get_object_or_404(StudentProfile, id=student_id)
#         user = student.user

#         payments = Payment.objects.filter(user=user).order_by("-created_at")

#         # 🔹 Get program-package once
#         upp = UserProgramPackage.objects.filter(
#             user=user
#         ).select_related("program", "package").first()

#         # 🔹 Total Paid Amount
#         total_paid = payments.aggregate(
#             total=Sum("amount")
#         )["total"] or 0

#         # 🔹 Package Price
#         package_price = upp.package.price if upp and upp.package else 0

#         # 🔹 Remaining Amount
#         remaining_amount = package_price - total_paid

#         serializer = PaymentDetailSerializer(
#             payments,
#             many=True,
#             context={
#                 "request": request,
#                 "payments": payments,
#                 "upp": upp
#             }
#         )

#         return Response(
#             {
#                 "message": "Student payment list fetched successfully",
#                 "student_id": student.id,
#                 "user_id": user.id,
#                 "total_payments": payments.count(),
#                 "package_price": package_price,
#                 "total_paid": total_paid,
#                 "remaining_amount": remaining_amount,
#                 "data": serializer.data
#             },
#             status=status.HTTP_200_OK
#         )


# class StudentPaymentListAPIView(APIView):
#     """
#     Fetch all payments of a student using student_id
#     """

#     def get(self, request, student_id):
#         student = get_object_or_404(StudentProfile, id=student_id)
#         user = student.user

#         payments = Payment.objects.filter(user=user).order_by("-created_at")

#         # 🔹 Get program-package once
#         upp = UserProgramPackage.objects.filter(
#             user=user
#         ).select_related("program", "package").first()

#         # 🔹 Total Paid Amount (exclude not_paid entries)
#         total_paid = payments.filter(
#             status__in=["partial_paid", "fully_paid"]
#         ).aggregate(total=Sum("amount"))["total"] or 0

#         # 🔹 Package Price
#         package_price = upp.package.price if upp and upp.package else 0

#         # 🔹 Remaining Amount
#         remaining_amount = package_price - total_paid

#         # 🔹 Payment Progress %
#         if package_price > 0:
#             payment_progress = round((total_paid / package_price) * 100, 2)
#         else:
#             payment_progress = 0

#         # 🔥 Auto-create remaining payment entry
#         if remaining_amount > 0 and upp:

#             existing_pending = Payment.objects.filter(
#                 user=user,
#                 status="not_paid"
#             ).exists()

#             if not existing_pending:
#                 Payment.objects.create(
#                     user=user,
#                     package=upp.package,
#                     amount=remaining_amount,
#                     payment_type=None,
#                     method=None,
#                     transaction_id=None,
#                     status="not_paid"
#                 )

#                 payments = Payment.objects.filter(
#                     user=user
#                 ).order_by("-created_at")

#         serializer = PaymentDetailSerializer(
#             payments,
#             many=True,
#             context={
#                 "request": request,
#                 "payments": payments,
#                 "upp": upp
#             }
#         )

#         return Response(
#             {
#                 "message": "Student payment list fetched successfully",
#                 "student_id": student.id,
#                 "user_id": user.id,
#                 "total_payments": payments.count(),
#                 "package_price": package_price,
#                 "total_paid": total_paid,
#                 "remaining_amount": remaining_amount,
#                 "payment_progress_percentage": payment_progress,  # ✅ NEW
#                 "data": serializer.data
#             },
#             status=status.HTTP_200_OK
#         )
  
  
  
  
class StudentPaymentListAPIView(APIView):
    """
    Fetch all payments of a student using student_id
    """

    def get(self, request, student_id):
        student = get_object_or_404(StudentProfile, id=student_id)
        user = student.user

        payments = Payment.objects.filter(user=user).order_by("-created_at")

        # 🔹 Get program-package
        upp = UserProgramPackage.objects.filter(
            user=user
        ).select_related("program", "package").first()

        # 🔹 Total Paid Amount
        total_paid = payments.filter(
            status__in=["partial_paid", "fully_paid"]
        ).aggregate(total=Sum("amount"))["total"] or 0

        # 🔹 Package Price
        package_price = upp.package.price if upp and upp.package else 0

        # 🔹 Remaining Amount
        remaining_amount = package_price - total_paid

        # 🔹 Payment Progress %
        if package_price > 0:
            payment_progress = round((total_paid / package_price) * 100, 2)
        else:
            payment_progress = 0

        # =================================================
        # 🔹 Handle Payment Status Logic
        # =================================================
        if upp:

            # Case 1: Fully Paid
            if total_paid >= package_price:

                # Delete pending payments
                Payment.objects.filter(
                    user=user,
                    status="not_paid"
                ).delete()

                # Update latest payment to fully_paid
                last_payment = Payment.objects.filter(
                    user=user
                ).exclude(status="not_paid").order_by("-created_at").first()

                if last_payment and last_payment.status != "fully_paid":
                    last_payment.status = "fully_paid"
                    last_payment.save()

            # Case 2: Remaining Payment
            elif remaining_amount > 0:

                existing_pending = Payment.objects.filter(
                    user=user,
                    status="not_paid"
                ).exists()

                if not existing_pending:
                    Payment.objects.create(
                        user=user,
                        package=upp.package,
                        amount=remaining_amount,
                        payment_type=None,
                        method=None,
                        transaction_id=None,
                        status="not_paid"
                    )

        # 🔹 Refresh payments queryset
        payments = Payment.objects.filter(user=user).order_by("-created_at")

        serializer = PaymentDetailSerializer(
            payments,
            many=True,
            context={
                "request": request,
                "payments": payments,
                "upp": upp
            }
        )

        return Response(
            {
                "message": "Student payment list fetched successfully",
                "student_id": student.id,
                "user_id": user.id,
                "total_payments": payments.count(),
                "package_price": package_price,
                "total_paid": total_paid,
                "remaining_amount": max(remaining_amount, 0),
                "payment_progress_percentage": payment_progress,
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )  
  
  
  
        
class StudentPaymentProgressAPIView(APIView):
    """
    Fetch payment progress summary of a student
    """

    def get(self, request, student_id):
        student = get_object_or_404(StudentProfile, id=student_id)
        user = student.user

        # 🔹 Get program-package
        upp = UserProgramPackage.objects.filter(
            user=user
        ).select_related("package").first()

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
        remaining_amount = package_price - total_paid

        # 🔹 Progress %
        if package_price > 0:
            payment_progress = round((total_paid / package_price) * 100, 2)
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

            
class StudentPackagePaymentSummaryAPIView(APIView):
    """
    Get payment summary by student_id + package_id
    """
    permission_classes = [IsAdmin | IsSuperAdmin]

    def get(self, request, student_id, package_id):

        # Get student
        student = get_object_or_404(StudentProfile, id=student_id)
        user = student.user

        # Get package
        package = get_object_or_404(Package, id=package_id)

        # Get all payments for this student + package
        payments = Payment.objects.filter(
            user=user,
            package=package
        )

        if not payments.exists():
            return Response(
                {
                    "success": False,
                    "message": "No payment found for this student and package."
                },
                status=status.HTTP_404_NOT_FOUND
            )

        total_paid = payments.filter(
            status__in=["partial_paid", "fully_paid", "verification_pending"]
        ).aggregate(
            total=Sum("amount")
        )["total"] or 0

        package_price = package.price
        remaining_amount = max(package_price - total_paid, 0)

        # Latest payment status
        latest_payment = payments.order_by("-created_at").first()

        return Response(
            {
                "success": True,
                "data": {
                    "student_id": student.id,
                    "student_name": f"{user.first_name} {user.last_name}",
                    "package_id": package.id,
                    "package_name": package.name,
                    "package_price": package_price,
                    "total_paid": total_paid,
                    "remaining_amount": remaining_amount,
                    "payment_status": latest_payment.status
                }
            },
            status=status.HTTP_200_OK
        )
        
class UpdatePaymentStatusAPIView(APIView):
    """
    Update payment status anytime
    """
    permission_classes = [IsAuthenticated]  # Add role permissions if needed

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
        
        
class PendingPaymentUsersAPIView(APIView):
    """
    Fetch the latest (last) payment record for users whose payment status
    is 'not_paid' or 'partial_paid'.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):

        users = User.objects.all()
        response_data = []

        for user in users:

            # Get last payment record
            payment = Payment.objects.filter(user=user).order_by("-created_at").first()

            if not payment:
                continue

            # Only include not_paid or partial_paid
            if payment.status not in ["not_paid", "partial_paid"]:
                continue

            package = payment.package
            program = package.program if package else None

            response_data.append({
                "user_id": user.id,
                "student_id": getattr(payment.user.student_profile, "id", None),
                "name": f"{user.first_name} {user.last_name}",
                "email": user.email,
                "preferred_counselling_mode": getattr(user.student_profile, "preferred_counselling_mode", None),

                "payment_id": payment.id,
                "amount": payment.amount,
                "status": payment.status,
                "method": payment.method,
                "transaction_id": payment.transaction_id,
                "payment_date": payment.payment_date,

                "program": program.name if program else None,
                "package": package.name if package else None,
                "package_price": package.price if package else None,

                "created_at": payment.created_at
            })

        return Response(
            {
                "success": True,
                "count": len(response_data),
                "data": response_data
            }
        )