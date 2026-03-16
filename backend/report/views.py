import os

from django.shortcuts import render

from django.http import FileResponse
from django.urls import reverse
from counselling_slot.models import Booking
from lead_registration.models import StudentProfile
from rest_framework.permissions import AllowAny
from django.views.decorators.clickjacking import xframe_options_exempt
from django.utils.decorators import method_decorator
from report.utils import get_completed_exam_report_data, send_report_uploaded_email
from payment.models import Payment
from program_package.models import UserProgramPackage
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from django.utils import timezone
from openpyxl import Workbook
from django.http import HttpResponse

from report.serializers import CompletedExamReportSerializer
from exam.models import UserExam
from report.models import Report

# class CompletedExamReportAPIView(APIView):
#     """
#     Fetches completed exam users with their program, report, and payment details.
#     """
#     permission_classes = [IsAuthenticated]

#     def get(self, request):
#         completed_exams = (
#             UserExam.objects
#             .filter(status='completed')
#             .select_related('user', 'exam')
#         )

#         response_data = []

#         for user_exam in completed_exams:
#             user = user_exam.user

#             # Program
#             user_program = (
#                 UserProgramPackage.objects
#                 .filter(user=user)
#                 .select_related('program')
#                 .first()
#             )

#             # Report
#             report = (
#                 Report.objects
#                 .filter(user=user, exam=user_exam.exam)
#                 .order_by('-uploaded_at')
#                 .first()
#             )

#             # Payment
#             payment = (
#                 Payment.objects
#                 .filter(user=user)
#                 .order_by('-created_at')
#                 .first()
#             )

#             response_data.append({
#                 "id": report.id if report else None,
#                 "user_id": user.id,
#                 "first_name": user.first_name,
#                 "last_name": user.last_name,
#                 "email": user.email,
#                 "phone": getattr(user, "phone", None),
#                 "program_id": user_program.program.id if user_program else None,
#                 "program": user_program.program.name if user_program else None,
#                 "exam_status": user_exam.status,

#                 "report_status": report.report_status if report else None,
#                 "uploaded_at": report.uploaded_at if report else None,

#                 "payment_status": payment.status if payment else None,
#             })

#         serializer = CompletedExamReportSerializer(response_data, many=True)
#         return Response({
#             "count": len(serializer.data),
#             "data": serializer.data
#         })


class CompletedExamReportAPIView(APIView):
    """
    Fetches ALL reports (all statuses) with user, exam, program, and payment details.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):

        reports = (
            Report.objects
            .select_related('user', 'exam')
            .order_by('-uploaded_at')
        )

        response_data = []

        for report in reports:
            user = report.user

            # Student Profile
            student_profile = (
                StudentProfile.objects
                .filter(user=user)
                .first()
            )

            # Program
            user_program = (
                UserProgramPackage.objects
                .filter(user=user)
                .select_related('program')
                .first()
            )

            # Exam status
            user_exam = (
                UserExam.objects
                .filter(user=user, exam=report.exam)
                .first()
            )

            # Latest Payment
            print(user)
            payment = (
                Payment.objects
                .filter(user=user)
                .order_by('-created_at')
                .first()
            )
            
            print(f"payment for user {user.id}: {payment.status if payment else 'No payment'}")

            # File URL
            file_url = None
            if report.file_path:
                pdf_url = reverse(
                    "report-pdf",
                    kwargs={"report_id": report.id}
                )
                file_url = request.build_absolute_uri(pdf_url)

            response_data.append({
                "id": report.id,
                "user_id": user.id,
                "student_id": student_profile.id if student_profile else None,

                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
                "phone": getattr(user, "phone", None),

                "program_id": user_program.program.id if user_program else None,
                "program": user_program.program.name if user_program else None,
                
                "package_id": user_program.package.id if user_program else None,
                "package": user_program.package.name if user_program else None,

                "exam_id": report.exam.id if report.exam else None,
                "exam": report.exam.name if report.exam else None,
                "exam_status": user_exam.status if user_exam else None,

                "report_status": report.report_status,
                
                "file_path": file_url,
                "uploaded_at": report.uploaded_at,

                "payment_status": payment.status if payment else None,
            })

        serializer = CompletedExamReportSerializer(response_data, many=True)

        return Response({
            "count": len(serializer.data),
            "data": serializer.data
        })
        
        
class CompletedExamReportStudentIDAPIView(APIView):
    """
    Fetch ALL reports OR reports for a specific student.
    """
        
    def get(self, request, student_id):

        # 1️⃣ Get student profile
        student_profile = get_object_or_404(
            StudentProfile,
            id=student_id
        )

        user = student_profile.user

        # 2️⃣ Get reports only for this user
        reports = (
            Report.objects
            .filter(user=user)
            .select_related('user', 'exam')
            .order_by('-uploaded_at')
        )

        response_data = []

        for report in reports:

            # Program
            user_program = (
                UserProgramPackage.objects
                .filter(user=user)
                .select_related('program')
                .first()
            )

            # Exam status
            user_exam = (
                UserExam.objects
                .filter(user=user, exam=report.exam)
                .first()
            )

            # Latest Payment
            payment = (
                Payment.objects
                .filter(user=user)
                .order_by('-created_at')
                .first()
            )

            # File URL
            file_url = None
            if report.file_path:
                pdf_url = reverse(
                    "report-pdf",
                    kwargs={"report_id": report.id}
                )
                file_url = request.build_absolute_uri(pdf_url)

            response_data.append({
                "id": report.id,
                "user_id": user.id,
                "student_id": student_profile.id,  # ✅ From URL

                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
                "phone": getattr(user, "phone", None),

                "program_id": user_program.program.id if user_program else None,
                "program": user_program.program.name if user_program else None,
                
                "package_id": user_program.package.id if user_program else None,
                "package": user_program.package.name if user_program else None,

                "exam_id": report.exam.id if report.exam else None,
                "exam": report.exam.name if report.exam else None,
                "exam_status": user_exam.status if user_exam else None,

                "report_status": report.report_status,
                "file_path": file_url,
                "uploaded_at": report.uploaded_at,

                "payment_status": payment.status if payment else None,
            })

        serializer = CompletedExamReportSerializer(response_data, many=True)

        return Response({
            "count": len(serializer.data),
            "data": serializer.data
        })

# =====================================================

@method_decorator(xframe_options_exempt, name="dispatch")
# class ReportPDFView(APIView):
#     authentication_classes = []          # 🔥 skips JWT completely
#     permission_classes = [AllowAny] 

#     def get(self, request, report_id):
#         report = get_object_or_404(Report, id=report_id)

#         response = FileResponse(
#             report.file_path.open("rb"),
#             content_type="application/pdf"
#         )
#         response["Content-Disposition"] = "inline"
#         response["X-Frame-Options"] = "ALLOWALL"
#         return response

class ReportPDFView(APIView):
    authentication_classes = []          # 🔥 skips JWT completely
    permission_classes = [AllowAny] 

    def get(self, request, report_id):
        # This will return 404 if report doesn't exist
        report = get_object_or_404(Report, id=report_id)
        
        # Check if file path exists
        if not report.file_path:
            return Response(
                {
                    "error": "File path not found",
                    "message": f"No file path associated with report {report_id}"
                },
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if physical file exists
        if not os.path.exists(report.file_path.path):
            return Response(
                {
                    "error": "PDF file not found",
                    "message": f"The PDF file for report {report_id} could not be found on the server"
                },
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Try to open and serve the file
        try:
            response = FileResponse(
                report.file_path.open("rb"),
                content_type="application/pdf"
            )
            response["Content-Disposition"] = "inline"
            response["X-Frame-Options"] = "ALLOWALL"
            return response
            
        except (FileNotFoundError, IOError, OSError) as e:
            return Response(
                {
                    "error": "File access error",
                    "message": f"Unable to access the PDF file: {str(e)}"
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )  
    

        
# class UploadReportAPIView(APIView):
#     """
#     Upload or replace a report file.
#     If latest payment is fully_paid → report unlocked
#     If partial_paid or no payment → report locked
#     """
#     permission_classes = [IsAuthenticated]

#     def handle_upload(self, request, report_id):
#         report = get_object_or_404(Report, id=report_id)
#         user = report.user

#         file_path = request.FILES.get("file_path")

#         if not file_path:
#             return Response(
#                 {"message": "Report file is required"},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         # 🔎 Get latest payment
#         latest_payment = (
#             Payment.objects
#             .filter(user=user)
#             .order_by('-created_at')
#             .first()
#         )

#         # ✅ Default locked
#         report_status = "locked"

#         # ✅ Unlock only if fully paid
#         if latest_payment and latest_payment.status == "fully_paid":
#             report_status = "unlocked"

#         # Save file
#         report.file_path = file_path
#         report.uploaded_by = request.user
#         report.uploaded_at = timezone.now()
#         report.report_status = report_status
#         report.save()

#         return Response(
#             {
#                 "message": "Report uploaded successfully",
#                 "report_id": report.id,
#                 "uploaded_at": report.uploaded_at,
#                 "report_status": report.report_status,
#                 "payment_status": latest_payment.status if latest_payment else None
#             },
#             status=status.HTTP_200_OK
#         )

#     # POST → Upload
#     def post(self, request, report_id):
#         return self.handle_upload(request, report_id)

#     # PUT → Replace
#     def put(self, request, report_id):
#         return self.handle_upload(request, report_id)

class UploadReportAPIView(APIView):
    """
    Upload or replace a report file.
    If latest payment is fully_paid → report received_unlocked
    If partial_paid or no payment → report received_locked
    """
    permission_classes = [IsAuthenticated]

    def handle_upload(self, request, report_id):

        report = get_object_or_404(Report, id=report_id)
        user = report.user

        file_path = request.FILES.get("file_path")

        if not file_path:
            return Response(
                {"message": "Report file is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 🔎 Get latest payment
        latest_payment = (
            Payment.objects
            .filter(user=user)
            .order_by('-created_at')
            .first()
        )

        # ✅ Default locked
        report_status = "received_locked"

        # ✅ Unlock only if fully paid
        if latest_payment and latest_payment.status == "fully_paid":
            report_status = "received_unlocked"

        # -------------------------
        # Save Report
        # -------------------------
        report.file_path = file_path
        report.uploaded_by = request.user
        report.uploaded_at = timezone.now()
        report.report_status = report_status
        report.save()
        
        # Send email
        send_report_uploaded_email(user, report)

        # -------------------------
        # CREATE BOOKING IF NOT EXISTS
        # -------------------------
        student_profile = StudentProfile.objects.filter(
            user=user
        ).first()

        booking = None

        if student_profile:
            booking, created = Booking.objects.get_or_create(
                student=student_profile,
                defaults={
                    "status": "not_booked"
                }
            )

        return Response(
            {
                "message": "Report uploaded successfully",
                "report_id": report.id,
                "uploaded_at": report.uploaded_at,
                "report_status": report.report_status,
                "payment_status": latest_payment.status if latest_payment else None,
                "booking_created": created if student_profile else False
            },
            status=status.HTTP_200_OK
        )

    def post(self, request, report_id):
        return self.handle_upload(request, report_id)

    def put(self, request, report_id):
        return self.handle_upload(request, report_id)
    
    
        
class CompletedExamReportExportExcelAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = get_completed_exam_report_data()

        wb = Workbook()
        ws = wb.active
        ws.title = "Completed Exam Reports"

        headers = [
            "User ID", "First Name", "Last Name", "Email", "Phone",
            "Program", "Exam", "Exam Status",
            "Report Status", "Uploaded At", "Payment Status"
        ]
        ws.append(headers)

        for row in data:
            uploaded_at = row["uploaded_at"]
            if uploaded_at:
                uploaded_at = uploaded_at.strftime("%d-%m-%Y %H:%M:%S")
            else:
                uploaded_at = ""

            ws.append([
                row["user_id"],
                row["first_name"],
                row["last_name"],
                row["email"],
                row["phone"],
                row["program"],
                row["exam"],
                row["exam_status"],
                row["report_status"],
                uploaded_at,              # ✅ string, not datetime
                row["payment_status"],
            ])

        response = HttpResponse(
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
        response["Content-Disposition"] = (
            "attachment; filename=completed_exam_reports.xlsx"
        )

        wb.save(response)
        return response
    
    
class CompletedExamReportExportPDFAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = get_completed_exam_report_data()

        response = HttpResponse(content_type="application/pdf")
        response["Content-Disposition"] = "attachment; filename=completed_exam_reports.pdf"

        p = canvas.Canvas(response, pagesize=A4)
        width, height = A4

        y = height - 40
        p.setFont("Helvetica", 9)

        for row in data:
            text = f"""
                    {row['first_name']} {row['last_name']} | {row['email']}
                    Program: {row['program']} | Exam: {row['exam']}
                    Report: {row['report_status']} | Payment: {row['payment_status']}
                    ------------------------------------------------------------
                    """
            for line in text.split("\n"):
                if y < 50:
                    p.showPage()
                    p.setFont("Helvetica", 9)
                    y = height - 40
                p.drawString(40, y, line)
                y -= 12

        p.showPage()
        p.save()
        return response
    
class ReportStatusCountAPIView(APIView):
    
    permission_classes = [IsAuthenticated]

    def get(self, request):
        total_reports = Report.objects.count()

        received_locked_count = Report.objects.filter(report_status='received_locked').count()
        received_unlocked_count = Report.objects.filter(report_status='received_unlocked').count()
        not_received_count = Report.objects.filter(
            report_status='not_received'
        ).count()

        return Response({
            "total_reports": total_reports,
            "received_locked": received_locked_count,
            "received_unlocked": received_unlocked_count,
            "not_received": not_received_count
        })