from django.shortcuts import render

from django.http import FileResponse
from django.urls import reverse
from rest_framework.permissions import AllowAny
from django.views.decorators.clickjacking import xframe_options_exempt
from django.utils.decorators import method_decorator
from report.utils import get_completed_exam_report_data
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

            # Program
            user_program = (
                UserProgramPackage.objects
                .filter(user=user)
                .select_related('program')
                .first()
            )

            # Exam status (from UserExam)
            user_exam = (
                UserExam.objects
                .filter(user=user, exam=report.exam)
                .first()
            )

            # Payment
            payment = (
                Payment.objects
                .filter(user=user)
                .order_by('-created_at')
                .first()
            )
            file_url = None
            if report.file_path:
                pdf_url = reverse(
                    "report-pdf",
                    kwargs={"report_id": report.id}
                )
                file_url = request.build_absolute_uri(pdf_url)

            response_data.append({
                "id": report.id if report else None,
                "user_id": user.id,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
                "phone": getattr(user, "phone", None),

                "program_id": user_program.program.id if user_program else None,
                "program": user_program.program.name if user_program else None,

                "exam_id": report.exam.id,
                "exam": report.exam.name,
                "exam_status": user_exam.status if user_exam else None,

                "report_status": report.report_status if report else None,
                "file_path": file_url,
                "uploaded_at": report.uploaded_at if report else None,

                "payment_status": payment.status if payment else None,
            })

        serializer = CompletedExamReportSerializer(response_data, many=True)
        return Response({
            "count": len(serializer.data),
            "data": serializer.data
        })

# =====================================================

@method_decorator(xframe_options_exempt, name="dispatch")
class ReportPDFView(APIView):
    authentication_classes = []          # 🔥 skips JWT completely
    permission_classes = [AllowAny] 

    def get(self, request, report_id):
        report = get_object_or_404(Report, id=report_id)

        response = FileResponse(
            report.file_path.open("rb"),
            content_type="application/pdf"
        )
        response["Content-Disposition"] = "inline"
        response["X-Frame-Options"] = "ALLOWALL"
        return response
    
    

        
class UploadReportAPIView(APIView):
    """
    Upload or replace a report file for an existing Report entry.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, report_id):
        report = get_object_or_404(Report, id=report_id)

        file = request.FILES.get("file")

        if not file:
            return Response(
                {"message": "Report file is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ✅ Upload / replace file
        report.file_path = file
        report.uploaded_by = request.user
        report.uploaded_at = timezone.now()
        report.report_status = "locked"   # or 'unlocked' based on logic

        report.save()

        return Response(
            {
                "message": "Report uploaded successfully",
                "report_id": report.id,
                "uploaded_at": report.uploaded_at,
                "report_status": report.report_status
            },
            status=status.HTTP_200_OK
        )
        
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

        locked_count = Report.objects.filter(report_status='locked').count()
        unlocked_count = Report.objects.filter(report_status='unlocked').count()
        pending_uploaded_count = Report.objects.filter(
            report_status='pending_uploaded'
        ).count()

        return Response({
            "total_reports": total_reports,
            "locked": locked_count,
            "unlocked": unlocked_count,
            "pending_uploaded": pending_uploaded_count
        })