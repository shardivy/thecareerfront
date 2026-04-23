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
from program_package.models import CollegeListAnalysis, UserProgramPackage
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
from django.db.models import Count, Q, Sum

from report.serializers import CompletedExamReportSerializer, EngineeringTestAnalysisReportSerializer
from exam.models import UserExam
from report.models import Report, Review



# class CompletedExamReportAPIView(APIView):
#     """
#     Fetch reports EXCEPT students whose package has engineering_test_analysis = True
#     """

#     permission_classes = [IsAuthenticated]

#     def get(self, request):

#         reports = (
#             Report.objects
#             .select_related('user', 'exam')
#             .order_by('-uploaded_at')
#         )

#         response_data = []

#         for report in reports:
#             user = report.user

#             # =============================
#             # 🔹 Student Profile
#             # =============================
#             student_profile = StudentProfile.objects.filter(user=user).first()

#             # =============================
#             # 🔹 Program + Package
#             # =============================
#             user_program = (
#                 UserProgramPackage.objects
#                 .filter(user=user)
#                 .select_related('program', 'package')
#                 .first()
#             )

#             # 🚫 Skip Engineering Test Analysis students
#             if user_program and user_program.package and user_program.package.engineering_test_analysis:
#                 continue

#             # =============================
#             # 🔹 Exam status
#             # =============================
#             user_exam = (
#                 UserExam.objects
#                 .filter(user=user, exam=report.exam)
#                 .first()
#             )

#             # =============================
#             # 🔹 ✅ ACTUAL PAYMENT STATUS (CUMULATIVE)
#             # =============================
#             payment_status = None

#             if user_program and user_program.package:
#                 package_price = user_program.package.price

#                 total_paid = (
#                     Payment.objects
#                     .filter(user=user, package=user_program.package)
#                     .aggregate(total=Sum('amount'))["total"] or 0
#                 )

#                 if total_paid == 0:
#                     payment_status = "not_paid"
#                 elif total_paid < package_price:
#                     payment_status = "partial_paid"
#                 else:
#                     payment_status = "fully_paid"

#             # =============================
#             # 🔹 File URL
#             # =============================
#             file_url = None
#             if report.file_path:
#                 pdf_url = reverse(
#                     "report-pdf",
#                     kwargs={"report_id": report.id}
#                 )
#                 file_url = request.build_absolute_uri(pdf_url)

#             # =============================
#             # 🔹 Response
#             # =============================
#             response_data.append({
#                 "id": report.id,
#                 "user_id": user.id,
#                 "student_id": student_profile.id if student_profile else None,

#                 "first_name": user.first_name,
#                 "last_name": user.last_name,
#                 "email": user.email,
#                 "phone": getattr(user, "phone", None),

#                 "program_id": user_program.program.id if user_program else None,
#                 "program": user_program.program.name if user_program else None,

#                 "package_id": user_program.package.id if user_program else None,
#                 "package": user_program.package.name if user_program else None,

#                 "exam_id": report.exam.id if report.exam else None,
#                 "exam": report.exam.name if report.exam else None,
#                 "exam_status": user_exam.status if user_exam else None,

#                 "report_status": report.report_status,

#                 "file_path": file_url,
#                 "uploaded_at": report.uploaded_at,

#                 # ✅ FINAL FIXED FIELD
#                 "payment_status": payment_status,
#             })

#         serializer = CompletedExamReportSerializer(response_data, many=True)

#         return Response({
#             "count": len(serializer.data),
#             "data": serializer.data
#         })
 
class CompletedExamReportAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            reports = (
                Report.objects
                .select_related('user', 'exam')
                .order_by('-uploaded_at')
            )

            response_data = []

            # 🔥 PRELOAD DATA (avoid N+1 queries)
            user_ids = [r.user_id for r in reports if r.user_id]

            user_programs = {
                up.user_id: up
                for up in UserProgramPackage.objects
                .filter(user_id__in=user_ids)
                .select_related('program', 'package')
            }

            user_exams_map = {}
            user_exams = UserExam.objects.filter(user_id__in=user_ids)

            for ue in user_exams:
                # store latest exam per (user, exam)
                key = (ue.user_id, ue.exam_id)
                if key not in user_exams_map or ue.id > user_exams_map[key].id:
                    user_exams_map[key] = ue

            fallback_user_exam = {}
            for ue in user_exams:
                # latest exam per user (fallback)
                if ue.user_id not in fallback_user_exam or ue.id > fallback_user_exam[ue.user_id].id:
                    fallback_user_exam[ue.user_id] = ue

            for report in reports:
                user = report.user

                # ❗ Skip if user missing
                if not user:
                    continue

                student_profile = StudentProfile.objects.filter(user=user).first()

                user_program = user_programs.get(user.id)

                # 🚫 Skip Engineering Test Analysis
                if (
                    user_program
                    and user_program.package
                    and user_program.package.engineering_test_analysis
                ):
                    continue

                # =============================
                # ✅ FIXED EXAM STATUS LOGIC
                # =============================
                user_exam = None

                if report.exam:
                    user_exam = user_exams_map.get((user.id, report.exam.id))

                # fallback if exact match not found
                if not user_exam:
                    user_exam = fallback_user_exam.get(user.id)

                # =============================
                # PAYMENT
                # =============================
                payment_status = None

                if user_program and user_program.package:
                    package_price = user_program.package.price or 0

                    total_paid = (
                        Payment.objects
                        .filter(user=user, package=user_program.package)
                        .aggregate(total=Sum('amount'))["total"] or 0
                    )

                    if total_paid == 0:
                        payment_status = "not_paid"
                    elif total_paid < package_price:
                        payment_status = "partial_paid"
                    else:
                        payment_status = "fully_paid"

                # =============================
                # FILE URL
                # =============================
                file_url = None
                if report.file_path:
                    try:
                        pdf_url = reverse("report-pdf", kwargs={"report_id": report.id})
                        file_url = request.build_absolute_uri(pdf_url)
                    except Exception:
                        file_url = None

                # =============================
                # RESPONSE
                # =============================
                response_data.append({
                    "id": report.id,
                    "user_id": user.id,
                    "student_id": student_profile.id if student_profile else None,

                    "first_name": user.first_name,
                    "last_name": user.last_name,
                    "email": user.email,
                    "phone": getattr(user, "phone", None),

                    "program_id": user_program.program.id if user_program and user_program.program else None,
                    "program": user_program.program.name if user_program and user_program.program else None,

                    "package_id": user_program.package.id if user_program and user_program.package else None,
                    "package": user_program.package.name if user_program and user_program.package else None,

                    "exam_id": report.exam.id if report.exam else None,
                    "exam": report.exam.name if report.exam else None,

                    # ✅ FIXED
                    "exam_status": user_exam.status if user_exam else None,

                    "report_status": report.report_status,
                    "file_path": file_url,
                    "uploaded_at": report.uploaded_at,

                    "payment_status": payment_status,
                })

            serializer = CompletedExamReportSerializer(response_data, many=True)

            return Response({
                "count": len(serializer.data),
                "data": serializer.data
            })

        except Exception as e:
            import traceback
            print(traceback.format_exc())

            return Response({
                "error": str(e)
            }, status=500)      
        
               
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

        # Users who have engineering test analysis package
        excluded_users = UserProgramPackage.objects.filter(
            package__engineering_test_analysis=True
        ).values_list("user_id", flat=True)

        # Exclude those users' reports
        reports = Report.objects.exclude(user_id__in=excluded_users)

        stats = reports.aggregate(
            total_reports=Count("id"),
            received_locked=Count("id", filter=Q(report_status="received_locked")),
            received_unlocked=Count("id", filter=Q(report_status="received_unlocked")),
            not_received=Count("id", filter=Q(report_status="not_received")),
        )

        return Response(stats)
        
# ================= Engineering report views =================

class EngineeringTestAnalysisReportAPIView(APIView):
    
    """ 
    Fetch reports only for students whose package has engineering_test_analysis = True 
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

            student_profile = StudentProfile.objects.filter(user=user).first()

            user_program = (
                UserProgramPackage.objects
                .filter(
                    user=user,
                    package__engineering_test_analysis=True
                )
                .select_related('program', 'package')
                .first()
            )

            if not user_program:
                continue

            # 🔹 Fetch analysis status
            analysis = CollegeListAnalysis.objects.filter(user=user).first()

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
                "id": report.id,
                "user_id": user.id,
                "student_id": student_profile.id if student_profile else None,

                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
                "phone": getattr(user, "phone", None),

                "program_id": user_program.program.id,
                "program": user_program.program.name,

                "package_id": user_program.package.id,
                "package": user_program.package.name,

                "analysis_status": analysis.status if analysis else None,

                "report_status": report.report_status,
                "file_path": file_url,
                "uploaded_at": report.uploaded_at,

                "payment_status": payment.status if payment else None,
            })

        serializer = EngineeringTestAnalysisReportSerializer(response_data, many=True)

        return Response({
            "count": len(serializer.data),
            "data": serializer.data
        })

class EngineeringReportUploadAPIView(APIView):
    """
    Upload or replace a report file.

    Conditions:
    1️⃣ CollegeListAnalysis status must be 'completed'
    2️⃣ If latest payment is fully_paid → report received_unlocked
    3️⃣ If partial_paid or no payment → report received_locked
    """

    permission_classes = [IsAuthenticated]

    def handle_upload(self, request, report_id):

        report = get_object_or_404(Report, id=report_id)
        user = report.user

        # ------------------------------------
        # CHECK EXAM EXISTS
        # ------------------------------------
        # if not report.exam:
        #     return Response(
        #         {"message": "Exam not linked with this report"},
        #         status=status.HTTP_400_BAD_REQUEST
        #     )

        # exam = report.exam

        # ------------------------------------
        # CHECK COLLEGE ANALYSIS STATUS
        # ------------------------------------
        college_analysis = CollegeListAnalysis.objects.filter(
            user=user
        ).order_by("-created_at").first()

        if not college_analysis or college_analysis.status != "completed":
            return Response(
                {
                    "message": "College list analysis is not completed. Report upload not allowed."
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ------------------------------------
        # FILE VALIDATION
        # ------------------------------------
        file_path = request.FILES.get("file_path")

        # Only require file for POST (new upload)
        if request.method == "POST" and not file_path:
            return Response(
                {"message": "Report file is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ------------------------------------
        # GET LATEST PAYMENT
        # ------------------------------------
        latest_payment = (
            Payment.objects
            .filter(user=user)
            .order_by('-created_at')
            .first()
        )

        # ------------------------------------
        # REPORT STATUS LOGIC
        # ------------------------------------
        report_status = "received_locked"

        if latest_payment and latest_payment.status == "fully_paid":
            report_status = "received_unlocked"

        # ------------------------------------
        # SAVE REPORT
        # ------------------------------------
        if file_path:
            report.file_path = file_path
        report.uploaded_by = request.user
        report.uploaded_at = timezone.now()
        report.report_status = report_status
        report.save()

        # ------------------------------------
        # SEND EMAIL
        # ------------------------------------
        send_report_uploaded_email(user, report)

        # ------------------------------------
        # CREATE BOOKING IF NOT EXISTS
        # ------------------------------------
        student_profile = StudentProfile.objects.filter(user=user).first()

        created = False

        if student_profile:
            booking, created = Booking.objects.get_or_create(
                student=student_profile,
                defaults={"status": "not_booked"}
            )

        return Response(
            {
                "message": "Report uploaded successfully",
                "report_id": report.id,
                "uploaded_at": report.uploaded_at,
                "report_status": report.report_status,
                "payment_status": latest_payment.status if latest_payment else None,
                "college_analysis_status": college_analysis.status,
                "booking_created": created if student_profile else False
            },
            status=status.HTTP_200_OK
        )

    def post(self, request, report_id):
        return self.handle_upload(request, report_id)

    def put(self, request, report_id):
        return self.handle_upload(request, report_id)
    
    
# ======================= Review APIView =======================

class ReviewStartByStudentAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        student_id = request.data.get("student_id")

        if not student_id:
            return Response(
                {"message": "student_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ✅ Get student
        try:
            student = StudentProfile.objects.get(id=student_id)
        except StudentProfile.DoesNotExist:
            return Response(
                {"message": "Student not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # ✅ Create review using linked user
        review = Review.objects.create(
            user=student.user,   # ✅ CORRECT
            review_status='in_process'
        )

        return Response({
            "message": "Review created and started successfully",
            "review_id": review.id,
            "review_status": review.review_status
        }, status=status.HTTP_201_CREATED)
        
class SubmitReviewAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, review_id):
        try:
            review = Review.objects.get(id=review_id)
        except Review.DoesNotExist:
            return Response(
                {"message": "Review not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # ✅ Only allow transition from in_process → submitted
        if review.review_status != 'in_process':
            return Response({
                "message": f"Cannot submit review in '{review.review_status}' state"
            }, status=status.HTTP_400_BAD_REQUEST)

        # ✅ Update fields (optional)
        review.review_text = request.data.get("review_text", review.review_text)
        review.rating = request.data.get("rating", review.rating)

        # ✅ Change status
        review.review_status = 'submitted'
        review.save()

        return Response({
            "message": "Review submitted successfully",
            "review_id": review.id,
            "review_status": review.review_status
        }, status=status.HTTP_200_OK)
        
class GetReviewStatusAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        # ✅ Get student
        try:
            student = StudentProfile.objects.get(id=student_id)
        except StudentProfile.DoesNotExist:
            return Response(
                {"message": "Student not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # ✅ Get latest review
        review = Review.objects.filter(user=student.user).order_by("-updated_at").first()

        if not review:
            return Response({
                "message": "No review found",
                "review_status": "not_submitted"
            }, status=status.HTTP_200_OK)

        return Response({
            "review_id": review.id,
            "review_status": review.review_status,
            # "rating": review.rating,
            # "review_text": review.review_text
        }, status=status.HTTP_200_OK)