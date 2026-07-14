import mimetypes
import os

from django.shortcuts import render

from django.http import FileResponse
from django.urls import reverse
from payment.views import PaymentCreateAPIView
from counselling_slot.models import Booking
from lead_registration.models import StudentProfile
from rest_framework.permissions import AllowAny
from django.views.decorators.clickjacking import xframe_options_exempt
from django.utils.decorators import method_decorator
from report.utils import get_completed_exam_report_data, send_report_uploaded_email
from payment.models import Payment
from program_package.models import CollegeListAnalysis, UserProgramPackage
from rest_framework.response import Response
from rest_framework.views import APIView, settings
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
#     permission_classes = [IsAuthenticated]

#     def get(self, request):
#         try:
#             reports = (
#                 Report.objects
#                 .select_related('user', 'exam')
#                 .order_by('-uploaded_at')
#             )

#             response_data = []

#             # 🔥 PRELOAD DATA (avoid N+1 queries)
#             user_ids = [r.user_id for r in reports if r.user_id]

#             user_programs = {
#                 up.user_id: up
#                 for up in UserProgramPackage.objects
#                 .filter(user_id__in=user_ids)
#                 .select_related('program', 'package')
#             }

#             user_exams_map = {}
#             user_exams = UserExam.objects.filter(user_id__in=user_ids)

#             for ue in user_exams:
#                 # store latest exam per (user, exam)
#                 key = (ue.user_id, ue.exam_id)
#                 if key not in user_exams_map or ue.id > user_exams_map[key].id:
#                     user_exams_map[key] = ue

#             fallback_user_exam = {}
#             for ue in user_exams:
#                 # latest exam per user (fallback)
#                 if ue.user_id not in fallback_user_exam or ue.id > fallback_user_exam[ue.user_id].id:
#                     fallback_user_exam[ue.user_id] = ue

#             for report in reports:
#                 user = report.user

#                 # ❗ Skip if user missing
#                 if not user:
#                     continue

#                 student_profile = StudentProfile.objects.filter(user=user).first()

#                 user_program = user_programs.get(user.id)

#                 # 🚫 Skip Engineering Test Analysis
#                 if (
#                     user_program
#                     and user_program.package
#                     and user_program.package.engineering_test_analysis
#                 ):
#                     continue

#                 # =============================
#                 # ✅ FIXED EXAM STATUS LOGIC
#                 # =============================
#                 user_exam = None

#                 if report.exam:
#                     user_exam = user_exams_map.get((user.id, report.exam.id))

#                 # fallback if exact match not found
#                 if not user_exam:
#                     user_exam = fallback_user_exam.get(user.id)

#                 # =============================
#                 # PAYMENT
#                 # =============================
#                 payment_status = None

#                 if user_program and user_program.package:
#                     package_price = user_program.package.price or 0

#                     total_paid = (
#                         Payment.objects
#                         .filter(user=user, package=user_program.package)
#                         .aggregate(total=Sum('amount'))["total"] or 0
#                     )

#                     if total_paid == 0:
#                         payment_status = "not_paid"
#                     elif total_paid < package_price:
#                         payment_status = "partial_paid"
#                     else:
#                         payment_status = "fully_paid"

#                 # =============================
#                 # FILE URL
#                 # =============================
#                 # file_url = None
#                 # if report.file_path:
#                 #     try:
#                 #         pdf_url = reverse("report-pdf", kwargs={"report_id": report.id})
#                 #         file_url = request.build_absolute_uri(pdf_url)
#                 #     except Exception:
#                 #         file_url = None
#                 file_url = None
#                 file_name = None

#                 if report.file_path:
#                     try:
#                         # ✅ Preview/download route using report ID
#                         file_url = request.build_absolute_uri(
#                             f"/api/report/report/pdf/{report.id}/"
#                         )

#                         # ✅ Actual uploaded file name with extension
#                         file_name = os.path.basename(report.file_path.name)

#                     except Exception:
#                         file_url = None
#                         file_name = None

#                 # =============================
#                 # RESPONSE
#                 # =============================
#                 response_data.append({
#                     "id": report.id,
#                     "user_id": user.id,
#                     "student_id": student_profile.id if student_profile else None,

#                     "first_name": user.first_name,
#                     "last_name": user.last_name,
#                     "email": user.email,
#                     "phone": getattr(user, "phone", None),

#                     "program_id": user_program.program.id if user_program and user_program.program else None,
#                     "program": user_program.program.name if user_program and user_program.program else None,

#                     "package_id": user_program.package.id if user_program and user_program.package else None,
#                     "package": user_program.package.name if user_program and user_program.package else None,

#                     "exam_id": report.exam.id if report.exam else None,
#                     "exam": report.exam.name if report.exam else None,

#                     # ✅ FIXED
#                     "exam_status": user_exam.status if user_exam else None,

#                     "report_status": report.report_status,
#                     "file_path": file_url,
#                     "uploaded_at": report.uploaded_at,

#                     "payment_status": payment_status,
#                 })

#             serializer = CompletedExamReportSerializer(response_data, many=True)

#             return Response({
#                 "count": len(serializer.data),
#                 "data": serializer.data
#             })

#         except Exception as e:
#             import traceback
#             print(traceback.format_exc())

#             return Response({
#                 "error": str(e)
#             }, status=500)      

class CompletedExamReportAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            reports = (
                Report.objects
                .select_related('user', 'exam', 'program', 'package')
                .order_by('-uploaded_at')
            )

            response_data = []

            # 🔥 PRELOAD DATA
            user_ids = list(
                reports.values_list("user_id", flat=True)
            )

            user_programs = {
                up.user_id: up
                for up in UserProgramPackage.objects
                .filter(user_id__in=user_ids)
                .select_related('program', 'package')
            }

            user_exams_map = {}
            user_exams = UserExam.objects.filter(user_id__in=user_ids)

            for ue in user_exams:
                key = (ue.user_id, ue.program_id, ue.package_id)
                if key not in user_exams_map or ue.id > user_exams_map[key].id:
                    user_exams_map[key] = ue

            fallback_user_exam = {}
            for ue in user_exams:
                if ue.user_id not in fallback_user_exam or ue.id > fallback_user_exam[ue.user_id].id:
                    fallback_user_exam[ue.user_id] = ue

            for report in reports:
                user = report.user

                if not user:
                    continue

                student_profile = StudentProfile.objects.filter(user=user).first()

                report_program = report.program
                report_package = report.package

                # 🚫 Skip Engineering Test Analysis
                if (
                    report_package
                    and report_package.engineering_test_analysis
                ):
                    continue

                # =============================
                # ✅ EXAM STATUS
                # =============================
                user_exam = None

                if report.program and report.package:
                    user_exam = user_exams_map.get(
                        (user.id, report.program.id, report.package.id)
                    )

                if not user_exam:
                    user_exam = fallback_user_exam.get(user.id)

                # =============================
                # PAYMENT STATUS
                # =============================
                payment_status = None

                if report_package:
                    package_price = report_package.price or 0

                    total_paid = (
                        Payment.objects
                        .filter(
                            user=user,
                            package=report_package
                        )
                        .aggregate(total=Sum('amount'))["total"] or 0
                    )

                    if total_paid == 0:
                        payment_status = "not_paid"
                    elif total_paid < package_price:
                        payment_status = "partial_paid"
                    else:
                        payment_status = "fully_paid"

                # =============================
                # FILE DETAILS
                # =============================
                # file_url = None
                # file_name = None

                # if report.file_path:
                #     try:
                #         # ✅ Actual uploaded file name
                #         file_name = os.path.basename(report.file_path.name)

                #         # ✅ Get extension
                #         file_extension = os.path.splitext(file_name)[1].lower()

                #         # ==========================================
                #         # 🔹 PDF FILE
                #         # ==========================================
                #         if file_extension == ".pdf":
                #             # Use preview endpoint
                #             file_url = request.build_absolute_uri(
                #                 f"/api/report/report/pdf/{report.id}/"
                #             )

                #         # ==========================================
                #         # 🔹 OTHER FILES (Excel, Doc, Zip, etc.)
                #         # ==========================================
                #         else:
                #             # Direct media file URL
                #             file_url = request.build_absolute_uri(
                #                 report.file_path.url
                #             )

                #     except Exception:
                #         file_url = None
                #         file_name = None
                
                file_url = None
                file_name = None

                if report.file_path:
                    try:
                        # ✅ Actual uploaded file name
                        file_name = os.path.basename(report.file_path.name)

                        # ✅ ALL FILE TYPES use same API
                        file_url = request.build_absolute_uri(
                            f"/api/report/report/pdf/{report.id}/"
                        )

                    except Exception:
                        file_url = None
                        file_name = None


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

                    "program_id": report.program.id if report.program else None,
                    "program": report.program.name if report.program else None,

                    "package_id": report.package.id if report.package else None,
                    "package": report.package.name if report.package else None,
                    "exam_id": report.exam.id if report.exam else None,
                    "exam": report.exam.name if report.exam else None,

                    "exam_status": user_exam.status if user_exam else None,

                    "report_status": report.report_status,

                    # ✅ Smart file URL
                    # PDF → preview
                    # Excel/Doc/Zip → direct file
                    "file_path": file_url,

                    # ✅ Actual uploaded filename
                    "file_name": file_name,

                    "uploaded_at": report.uploaded_at,

                    "payment_status": payment_status,
                })

            serializer = CompletedExamReportSerializer(
                response_data,
                many=True
            )

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
               
# class CompletedExamReportStudentIDAPIView(APIView):
#     """
#     Fetch ALL reports OR reports for a specific student.
#     """
        
#     def get(self, request, student_id):

#         # 1️⃣ Get student profile
#         student_profile = get_object_or_404(
#             StudentProfile,
#             id=student_id
#         )

#         user = student_profile.user

#         # 2️⃣ Get reports only for this user
#         reports = (
#             Report.objects
#             .filter(user=user)
#             .select_related('user', 'exam')
#             .order_by('-uploaded_at')
#         )

#         response_data = []

#         for report in reports:

#             # Program
#             user_program = (
#                 UserProgramPackage.objects
#                 .filter(user=user)
#                 .select_related('program')
#                 .first()
#             )

#             # Exam status
#             user_exam = (
#                 UserExam.objects
#                 .filter(user=user, exam=report.exam)
#                 .first()
#             )

#             # Latest Payment
#             payment = (
#                 Payment.objects
#                 .filter(user=user)
#                 .order_by('-created_at')
#                 .first()
#             )

#             # File URL
#             file_url = None
#             if report.file_path:
#                 try:
#                     pdf_url = reverse("report-pdf", kwargs={"report_id": report.id})
#                     file_url = request.build_absolute_uri(pdf_url)
#                 except Exception:
#                     file_url = None

#             response_data.append({
#                 "id": report.id,
#                 "user_id": user.id,
#                 "student_id": student_profile.id,  # ✅ From URL

#                 "first_name": user.first_name,
#                 "last_name": user.last_name,
#                 "email": user.email,
#                 "phone": getattr(user, "phone", None),

#                 # "program_id": user_program.program.id if user_program else None,
#                 # "program": user_program.program.name if user_program else None,
#                 "program_id": user_program.program.id if user_program and user_program.program else None,
#                 "program": user_program.program.name if user_program and user_program.program else None,
                
#                 # "package_id": user_program.package.id if user_program else None,
#                 # "package": user_program.package.name if user_program else None,
#                 "package_id": user_program.package.id if user_program and user_program.package else None,
#                 "package": user_program.package.name if user_program and user_program.package else None,

#                 "exam_id": report.exam.id if report.exam else None,
#                 "exam": report.exam.name if report.exam else None,
#                 "exam_status": user_exam.status if user_exam else None,

#                 "report_status": report.report_status,
#                 "file_path": file_url,
#                 "uploaded_at": report.uploaded_at,

#                 "payment_status": payment.status if payment else None,
#             })

#         serializer = CompletedExamReportSerializer(response_data, many=True)

#         return Response({
#             "count": len(serializer.data),
#             "data": serializer.data
#         })

class CompletedExamReportStudentIDAPIView(APIView):
    """
    Fetch reports for a specific student
    with smart file preview/download logic
    """

    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):

        # ==========================================
        # 🔹 GET STUDENT PROFILE
        # ==========================================
        student_profile = get_object_or_404(
            StudentProfile,
            id=student_id
        )

        user = student_profile.user

        # ==========================================
        # 🔹 GET REPORTS
        # ==========================================
        reports = (
            Report.objects
            .filter(user=user)
            .select_related("user", "exam", "program", "package")
            .order_by("-uploaded_at")
        )

        response_data = []

        for report in reports:

            # ==========================================
            # 🔹 PROGRAM
            # ==========================================
            user_program = (
                UserProgramPackage.objects
                .filter(user=user)
                .select_related("program", "package")
                .first()
            )

            # ==========================================
            # 🔹 EXAM STATUS
            # ==========================================
            user_exam = (
                UserExam.objects
                .filter(user=user, exam=report.exam)
                .first()
            )

            # ==========================================
            # 🔹 PAYMENT
            # ==========================================
            payment = (
                Payment.objects
                .filter(user=user)
                .order_by("-created_at")
                .first()
            )
            
            # ==========================================
            # 🔹 BOOKING STATUS
            # ==========================================
            booking = (
                Booking.objects
                .filter(student=student_profile)
                .exclude(status="cancelled")
                .order_by("-created_at")
                .first()
            )

            # # ==========================================
            # # 🔹 FILE DETAILS
            # # ==========================================
            
            # file_url = None
            # file_name = None

            # if report.file_path:
            #     try:
            #         # ✅ Actual uploaded file name
            #         file_name = os.path.basename(report.file_path.name)

            #         # ✅ ALL FILE TYPES use same API
            #         file_url = request.build_absolute_uri(
            #             f"/api/report/report/pdf/{report.id}/"
            #         )

            #     except Exception:
            #         file_url = None
            #         file_name = None
            
            # ==========================================
            # 🔹 FILE DETAILS
            # ==========================================

            main_file_url = None
            main_file_name = None

            v1_file_url = None
            v1_file_name = None

            v2_file_url = None
            v2_file_name = None

            try:
                if report.file_path:
                    main_file_name = os.path.basename(report.file_path.name)
                    main_file_url = request.build_absolute_uri(
                        f"/api/report/report/pdf/{report.id}/?type=v1"
                    )

                if report.file_path1:
                    v1_file_name = os.path.basename(report.file_path1.name)
                    v1_file_url = request.build_absolute_uri(
                        f"/api/report/report/pdf/{report.id}/?type=v2"
                    )

                if report.file_path2:
                    v2_file_name = os.path.basename(report.file_path2.name)
                    v2_file_url = request.build_absolute_uri(
                        f"/api/report/report/pdf/{report.id}/?type=v3"
                    )

            except Exception:
                pass
                    
                    
            # ==========================================
            # 🔹 ENGINEERING TEST ANALYSIS CONDITION
            # ==========================================
            if getattr(student_profile, "engineering_test_analysis", False):

                college_analysis = (
                    CollegeListAnalysis.objects
                    .filter(
                        user=user,
                        status="completed"
                    )
                    .first()
                )

                # If engineering analysis is true but college analysis not completed
                if not college_analysis:
                    continue

            # ==========================================
            # 🔹 RESPONSE DATA
            # ==========================================
            response_data.append({
                "id": report.id,
                "user_id": user.id,
                "student_id": student_profile.id,

                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
                "phone": getattr(user, "phone", None),

                "program_id": (
                    report.program.id
                    if report.program
                    else None
                ),
                "program": (
                    report.program.name
                    if report.program
                    else None
                ),

                "package_id": (
                    report.package.id
                    if report.package
                    else None
                ),
                "package": (
                    report.package.name
                    if report.package
                    else None
                ),

                "exam_id": report.exam.id if report.exam else None,
                "exam": report.exam.name if report.exam else None,
                "exam_status": user_exam.status if user_exam else None,
                "booking_status": booking.status if booking else None,

                "report_status": report.report_status,
                "file_path": main_file_url,
                "file_name": main_file_name,
                "file_path_count": report.file_path_count,
                
                # V1 Report
                "report_status_v2": report.report_status_v2,
                "file_path1": v1_file_url,
                "file_name1": v1_file_name,
                "file_path1_count": report.file_path1_count,
                
                # V2 Report
                "report_status_v3": report.report_status_v3,
                "file_path2": v2_file_url,
                "file_name2": v2_file_name,
                "file_path2_count": report.file_path2_count,

                "uploaded_at": report.uploaded_at,

                "payment_status": payment.status if payment else None,
            })

        serializer = CompletedExamReportSerializer(
            response_data,
            many=True
        )

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


# class ReportPDFView(APIView):
#     authentication_classes = []
#     permission_classes = [AllowAny]

#     def get(self, request, report_id):
#         report = get_object_or_404(Report, id=report_id)

#         if not report.file_path:
#             return Response(
#                 {
#                     "error": "File path not found",
#                     "message": f"No file path associated with report {report_id}"
#                 },
#                 status=status.HTTP_404_NOT_FOUND
#             )

#         if not os.path.exists(report.file_path.path):
#             return Response(
#                 {
#                     "error": "File not found",
#                     "message": f"The file for report {report_id} could not be found on the server"
#                 },
#                 status=status.HTTP_404_NOT_FOUND
#             )

#         try:
#             file_path = report.file_path.path
#             file_name = os.path.basename(file_path)

#             # ✅ Detect correct content type
#             content_type, _ = mimetypes.guess_type(file_path)

#             if not content_type:
#                 content_type = "application/octet-stream"

#             response = FileResponse(
#                 open(file_path, "rb"),
#                 content_type=content_type
#             )

#             # ==========================================
#             # 🔹 PDF → Preview
#             # ==========================================
#             if content_type == "application/pdf":
#                 response["Content-Disposition"] = f'inline; filename="{file_name}"'
#                 response["X-Frame-Options"] = "ALLOWALL"

#             # ==========================================
#             # 🔹 Other files → Download
#             # ==========================================
#             else:
#                 response["Content-Disposition"] = f'attachment; filename="{file_name}"'

#             return response

#         except (FileNotFoundError, IOError, OSError) as e:
#             return Response(
#                 {
#                     "error": "File access error",
#                     "message": f"Unable to access file: {str(e)}"
#                 },
#                 status=status.HTTP_500_INTERNAL_SERVER_ERROR
#             ) 

class ReportPDFView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request, report_id):

        report = get_object_or_404(Report, id=report_id)

        # v1 | v2 | v3
        report_type = request.GET.get("type", "v1")

        if report_type == "v1":
            file_obj = report.file_path

        elif report_type == "v2":
            file_obj = report.file_path1

        elif report_type == "v3":
            file_obj = report.file_path2

        else:
            return Response(
                {"error": "Invalid report type"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not file_obj:
            return Response(
                {
                    "error": "File path not found",
                    "message": f"{report_type} file not uploaded"
                },
                status=status.HTTP_404_NOT_FOUND
            )

        if not os.path.exists(file_obj.path):
            return Response(
                {
                    "error": "File not found",
                    "message": "The file could not be found on the server"
                },
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            file_path = file_obj.path
            file_name = os.path.basename(file_path)

            content_type, _ = mimetypes.guess_type(file_path)

            if not content_type:
                content_type = "application/octet-stream"

            response = FileResponse(
                open(file_path, "rb"),
                content_type=content_type
            )

            if content_type == "application/pdf":
                response["Content-Disposition"] = (
                    f'inline; filename="{file_name}"'
                )
                response["X-Frame-Options"] = "ALLOWALL"

            else:
                response["Content-Disposition"] = (
                    f'attachment; filename="{file_name}"'
                )

            return response

        except (FileNotFoundError, IOError, OSError) as e:
            return Response(
                {
                    "error": "File access error",
                    "message": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# class UploadReportAPIView(APIView):
#     """
#     Upload or replace a report file.
#     If latest payment is fully_paid → report received_unlocked
#     If partial_paid or no payment → report received_locked
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
#         report_status = "received_locked"

#         # ✅ Unlock only if fully paid
#         if latest_payment and latest_payment.status == "fully_paid":
#             report_status = "received_unlocked"

#         # -------------------------
#         # Save Report
#         # -------------------------
#         report.file_path = file_path
#         report.uploaded_by = request.user
#         report.uploaded_at = timezone.now()
#         report.report_status = report_status
#         report.save()
        
#         # Send email
#         send_report_uploaded_email(user, report)

#         # -------------------------
#         # CREATE BOOKING IF NOT EXISTS
#         # -------------------------
#         student_profile = StudentProfile.objects.filter(
#             user=user
#         ).first()

#         booking = None

#         if student_profile:
#             booking, created = Booking.objects.get_or_create(
#                 student=student_profile,
#                 defaults={
#                     "status": "not_booked"
#                 }
#             )

#         return Response(
#             {
#                 "message": "Report uploaded successfully",
#                 "report_id": report.id,
#                 "uploaded_at": report.uploaded_at,
#                 "report_status": report.report_status,
#                 "payment_status": latest_payment.status if latest_payment else None,
#                 "booking_created": created if student_profile else False
#             },
#             status=status.HTTP_200_OK
#         )

#     def post(self, request, report_id):
#         return self.handle_upload(request, report_id)

#     def put(self, request, report_id):
#         return self.handle_upload(request, report_id)


class UploadReportAPIView(APIView):
    """
    Upload or replace a report file.

    ✅ Unlock ONLY if:
       - Payment is fully_paid
       - Review entry exists for user
       - Review status = submitted
       - Booking is completed 

    ❌ Else:
       - received_locked
    """

    permission_classes = [IsAuthenticated]

    def handle_upload(self, request, report_id):

        # =========================
        # 🔎 Get Report
        # =========================
        report = get_object_or_404(
            Report,
            id=report_id
        )

        user = report.user

        # =========================
        # 📂 Validate File
        # =========================
        file_path = request.FILES.get("file_path")

        if not file_path:
            return Response(
                {
                    "message": "Report file is required"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # ✅ Terminal log for uploaded file
        print("📤 Report Upload Started:")
        print(f"   File Name: {file_path.name}")
        print(f"   File Size: {file_path.size} bytes")
        print(f"   File Type: {file_path.content_type}")

        # =========================
        # 💳 Latest Payment
        # =========================
        latest_payment = (
            Payment.objects
            .filter(user=user)
            .order_by('-created_at')
            .first()
        )

        # =========================
        # 📝 Review Check
        # Must exist + submitted
        # =========================
        submitted_review = (
            Review.objects
            .filter(
                user=user,
                review_status="submitted"
            )
            .order_by('-created_at')
            .first()
        )

        # # =========================
        # # 🔒 Default Locked
        # # =========================
        # report_status = "received_locked"

        # # =========================
        # # 🔓 Unlock Rule
        # # =========================
        # if (
        #     latest_payment
        #     and latest_payment.status == "fully_paid"
        #     and submitted_review
        # ):
        #     report_status = "received_unlocked"
        # =========================
        # 🎓 Student Profile
        # =========================
        student_profile = (
            StudentProfile.objects
            .filter(user=user)
            .first()
        )
        # =========================
        # 🔒 Default Locked
        # =========================
        report_status = "received_locked"

        # =========================
        # 📅 Latest Booking Status
        # =========================
        latest_booking = None

        if student_profile:
            latest_booking = (
                Booking.objects
                .filter(
                    student=student_profile,
                    program=report.program,
                    package=report.package
                )
                .order_by("-id")
                .first()
            )

        # =========================
        # 🔓 Unlock Rule
        # Must have:
        # - fully_paid payment
        # - submitted review
        # - completed booking
        # =========================
        if (
            latest_payment
            and latest_payment.status == "fully_paid"
            and submitted_review
            and latest_booking
            and latest_booking.status == "completed"
        ):
            report_status = "received_unlocked"

        # =========================
        # 💾 Save Report
        # =========================
        report.file_path = file_path
        report.uploaded_by = request.user
        report.uploaded_at = timezone.now()
        report.report_status = report_status
        report.save()

        # =========================
        # 📧 Send Email
        # =========================
        send_report_uploaded_email(
            user,
            report
        )

        # =========================
        # 🎓 Student Profile
        # =========================
        student_profile = (
            StudentProfile.objects
            .filter(user=user)
            .first()
        )

        # # =========================
        # # 📅 Booking
        # # =========================
        # booking = None
        # created = False

        # if student_profile:
        #     booking, created = Booking.objects.get_or_create(
        #         student=student_profile,
        #         defaults={
        #             "status": "not_booked"
        #         }
        #     )
        
        # =========================
        # 📅 Booking
        # =========================
        created = False

        if student_profile:

            upp = (
                UserProgramPackage.objects
                .filter(user=user)
                .order_by("-id")
                .first()
            )
            print("Student Profile:", student_profile.id)
            print("UPP:", upp)

            
            booking, created = Booking.objects.get_or_create(
                student=student_profile,
                program=report.program,
                package=report.package,
                defaults={
                    "status": "not_booked"
                }
            )  
            print("Booking Created ID:", booking.id)

            created = True

        # =========================
        # 📤 Response
        # =========================
        return Response(
            {
                "message": "Report uploaded successfully",

                "report_id": report.id,

                "uploaded_at": report.uploaded_at,

                "report_status": report.report_status,

                "payment_status": (
                    latest_payment.status
                    if latest_payment
                    else None
                ),

                "review_exists": bool(submitted_review),

                "review_status": (
                    submitted_review.review_status
                    if submitted_review
                    else None
                ),

                "booking_created": (
                    created
                    if student_profile
                    else False
                )
            },
            status=status.HTTP_200_OK
        )

    # =========================
    # 🔹 POST
    # =========================
    def post(self, request, report_id):
        return self.handle_upload(
            request,
            report_id
        )

    # =========================
    # 🔹 PUT
    # =========================
    def put(self, request, report_id):
        return self.handle_upload(
            request,
            report_id
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

import os

# class EngineeringTestAnalysisReportAPIView(APIView):
#     """
#     Fetch reports only for students whose package has
#     engineering_test_analysis = True
#     """

#     permission_classes = [IsAuthenticated]

#     def get(self, request):

#         reports = (
#             Report.objects
#         .select_related("user", "exam", "program", "package")
#             .order_by("-uploaded_at")
#         )

#         response_data = []

#         for report in reports:
#             user = report.user

#             if not user:
#                 continue

#             # ==========================================
#             # 🔹 STUDENT PROFILE
#             # ==========================================
#             student_profile = StudentProfile.objects.filter(
#                 user=user
#             ).first()

#             # ==========================================
#             # 🔹 USER PROGRAM
#             # ==========================================
#             # Skip reports that are not Engineering reports
#             if (
#                 not report.package
#                 or not report.package.engineering_test_analysis
#             ):
#                 continue

#             # ==========================================
#             # 🔹 ANALYSIS STATUS
#             # ==========================================
#             analysis = (
#                 CollegeListAnalysis.objects
#                 .filter(user=user)
#                 .first()
#             )

#             # ==========================================
#             # 🔹 PAYMENT
#             # ==========================================
#             payment = (
#                 Payment.objects
#                 .filter(user=user)
#                 .order_by("-created_at")
#                 .first()
#             )
            
#             # ==========================================
#             # 🔹 BOOKING STATUS
#             # ==========================================
#             booking = None

#             if student_profile:
#                 booking = (
#                     Booking.objects
#                     .filter(student=student_profile)
#                     .order_by("-created_at")
#                     .first()
#                 )

#             # ==========================================
#             # 🔹 FILE DETAILS
#             # ==========================================
#             # file_url = None
#             # file_name = None

#             # if report.file_path:
#             #     try:
#             #         # Actual uploaded filename
#             #         file_name = os.path.basename(
#             #             report.file_path.name
#             #         )

#             #         # File extension
#             #         file_extension = os.path.splitext(
#             #             file_name
#             #         )[1].lower()

#             #         # ==========================================
#             #         # PDF → Preview route
#             #         # ==========================================
#             #         if file_extension == ".pdf":
#             #             file_url = request.build_absolute_uri(
#             #                 f"/api/report/report/pdf/{report.id}/"
#             #             )

#             #         # ==========================================
#             #         # Excel / Doc / Zip / Other → Direct media
#             #         # ==========================================
#             #         else:
#             #             file_url = request.build_absolute_uri(
#             #                 report.file_path.url
#             #             )

#             #     except Exception:
#             #         file_url = None
#             #         file_name = None
            
#             file_url = None
#             file_name = None

#             if report.file_path:
#                 try:
#                     # ✅ Actual uploaded filename
#                     file_name = os.path.basename(
#                         report.file_path.name
#                     )

#                     # ✅ ALL file types use same secure API
#                     file_url = request.build_absolute_uri(
#                         f"/api/report/report/pdf/{report.id}/"
#                     )

#                 except Exception:
#                     file_url = None
#                     file_name = None

#             # ==========================================
#             # 🔹 RESPONSE DATA
#             # ==========================================
#             response_data.append({
#                 "id": report.id,
#                 "user_id": user.id,
#                 "student_id": (
#                     student_profile.id
#                     if student_profile else None
#                 ),

#                 "first_name": user.first_name,
#                 "last_name": user.last_name,
#                 "email": user.email,
#                 "phone": getattr(user, "phone", None),

#                 "program_id": report.program.id if report.program else None,
#                 "program": report.program.name if report.program else None,

#                 "package_id": report.package.id if report.package else None,
#                 "package": report.package.name if report.package else None,

#                 "analysis_status": (
#                     analysis.status
#                     if analysis else None
#                 ),

#                 "report_status": report.report_status,
#                 "booking_status": (
#                     booking.status
#                     if booking else None
#                 ),

#                 # ✅ Smart file path
#                 "file_path": file_url,

#                 # ✅ Actual uploaded file name
#                 "file_name": file_name,

#                 "uploaded_at": report.uploaded_at,

#                 "payment_status": (
#                     payment.status
#                     if payment else None
#                 ),
#             })

#         serializer = EngineeringTestAnalysisReportSerializer(
#             response_data,
#             many=True
#         )

#         return Response({
#             "count": len(serializer.data),
#             "data": serializer.data
#         })

class EngineeringTestAnalysisReportAPIView(APIView):
    """
    Fetch reports only for students whose package has
    engineering_test_analysis = True
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):

        reports = (
            Report.objects
        .select_related("user", "exam", "program", "package")
            .order_by("-uploaded_at")
        )

        response_data = []

        for report in reports:
            user = report.user

            if not user:
                continue

            # ==========================================
            # 🔹 STUDENT PROFILE
            # ==========================================
            student_profile = StudentProfile.objects.filter(
                user=user
            ).first()

            # ==========================================
            # 🔹 USER PROGRAM
            # ==========================================
            # Skip reports that are not Engineering reports
            if (
                not report.package
                or not report.package.engineering_test_analysis
            ):
                continue

            # ==========================================
            # 🔹 ANALYSIS STATUS
            # ==========================================
            analysis = (
                CollegeListAnalysis.objects
                .filter(
                    user=user,
                    program=report.program,
                    package=report.package
                )
                .first()
            )

            # ==========================================
            # 🔹 PAYMENT
            # ==========================================
            payment = (
                Payment.objects
                .filter(user=user)
                .order_by("-created_at")
                .first()
            )
            
            # ==========================================
            # 🔹 BOOKING STATUS
            # ==========================================
            booking = None

            if student_profile:
                booking = (
                    Booking.objects
                    .filter(student=student_profile)
                    .order_by("-created_at")
                    .first()
                )

            # ==========================================
            # 🔹 FILE DETAILS
            # ==========================================
            # file_url = None
            # file_name = None

            # if report.file_path:
            #     try:
            #         # Actual uploaded filename
            #         file_name = os.path.basename(
            #             report.file_path.name
            #         )

            #         # File extension
            #         file_extension = os.path.splitext(
            #             file_name
            #         )[1].lower()

            #         # ==========================================
            #         # PDF → Preview route
            #         # ==========================================
            #         if file_extension == ".pdf":
            #             file_url = request.build_absolute_uri(
            #                 f"/api/report/report/pdf/{report.id}/"
            #             )

            #         # ==========================================
            #         # Excel / Doc / Zip / Other → Direct media
            #         # ==========================================
            #         else:
            #             file_url = request.build_absolute_uri(
            #                 report.file_path.url
            #             )

            #     except Exception:
            #         file_url = None
            #         file_name = None
            
            main_file_url = None
            main_file_name = None

            v1_file_url = None
            v1_file_name = None

            v2_file_url = None
            v2_file_name = None

            try:
                if report.file_path:
                    main_file_name = os.path.basename(report.file_path.name)
                    main_file_url = request.build_absolute_uri(
                        f"/api/report/report/pdf/{report.id}/?type=v1"
                    )

                if report.file_path1:
                    v1_file_name = os.path.basename(report.file_path1.name)
                    v1_file_url = request.build_absolute_uri(
                        f"/api/report/report/v1/pdf/{report.id}/?type=v2"
                    )

                if report.file_path2:
                    v2_file_name = os.path.basename(report.file_path2.name)
                    v2_file_url = request.build_absolute_uri(
                        f"/api/report/report/v2/pdf/{report.id}/?type=v3"
                    )

            except Exception:
                pass

            # ==========================================
            # 🔹 RESPONSE DATA
            # ==========================================
            response_data.append({
                "id": report.id,
                "user_id": user.id,
                "student_id": (
                    student_profile.id
                    if student_profile else None
                ),

                "first_name": user.first_name,
                "last_name": user.last_name,
                "email": user.email,
                "phone": getattr(user, "phone", None),

                "program_id": report.program.id if report.program else None,
                "program": report.program.name if report.program else None,

                "package_id": report.package.id if report.package else None,
                "package": report.package.name if report.package else None,

                "analysis_status": (
                    analysis.status
                    if analysis else None
                ),

                "report_status": report.report_status,
                "report_status_v2": report.report_status_v2,
                "report_status_v3": report.report_status_v3,
                "booking_status": (
                    booking.status
                    if booking else None
                ),

                # Main Report
                "file_path": main_file_url,
                "file_name": main_file_name,
                "file_path_count": report.file_path_count,

                # V1 Report
                "file_path1": v1_file_url,
                "file_name1": v1_file_name,
                "file_path1_count": report.file_path1_count,

                # V2 Report
                "file_path2": v2_file_url,
                "file_name2": v2_file_name,
                "file_path2_count": report.file_path2_count,

                "uploaded_at": report.uploaded_at,

                "payment_status": (
                    payment.status
                    if payment else None
                ),
            })

        serializer = EngineeringTestAnalysisReportSerializer(
            response_data,
            many=True
        )

        return Response({
            "count": len(serializer.data),
            "data": serializer.data
        })




# class EngineeringReportUploadAPIView(APIView):
#     """
#     Upload or replace a report file.

#     Condition:
#     ✅ CollegeListAnalysis status must be completed
#     ✅ Report status always received_unlocked
#     """

#     permission_classes = [IsAuthenticated]

#     def handle_upload(self, request, report_id):

#         report = get_object_or_404(Report, id=report_id)
#         user = report.user

#         # ------------------------------------
#         # CHECK COLLEGE ANALYSIS STATUS
#         # ------------------------------------
#         college_analysis = CollegeListAnalysis.objects.filter(
#             user=user
#         ).order_by("-created_at").first()

#         if not college_analysis or college_analysis.status != "completed":
#             return Response(
#                 {
#                     "message": "College list analysis is not completed. Report upload not allowed."
#                 },
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         # ------------------------------------
#         # FILE VALIDATION
#         # ------------------------------------
#         file_path = request.FILES.get("file_path")

#         if request.method == "POST" and not file_path:
#             return Response(
#                 {"message": "Report file is required"},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         # ------------------------------------
#         # SAVE REPORT
#         # ------------------------------------
#         if file_path:
#             report.file_path = file_path

#         report.uploaded_by = request.user
#         report.uploaded_at = timezone.now()

#         # ALWAYS UNLOCK
#         report.report_status = "received_unlocked"

#         report.save()

#         # ------------------------------------
#         # SEND EMAIL
#         # ------------------------------------
#         send_report_uploaded_email(user, report)

#         # ------------------------------------
#         # CREATE BOOKING IF NOT EXISTS
#         # ------------------------------------
#         student_profile = StudentProfile.objects.filter(user=user).first()

#         created = False

#         if student_profile:
#             booking = Booking.objects.filter(
#                 student=student_profile
#             ).first()

#             if not booking:
#                 booking = Booking.objects.create(
#                     student=student_profile,
#                     status="not_booked"
#                 )
#                 created = True

#         return Response(
#             {
#                 "message": "Report uploaded successfully",
#                 "report_id": report.id,
#                 "uploaded_at": report.uploaded_at,
#                 "report_status": report.report_status,
#                 "college_analysis_status": college_analysis.status,
#                 "booking_created": created if student_profile else False
#             },
#             status=status.HTTP_200_OK
#         )

#     def post(self, request, report_id):
#         return self.handle_upload(request, report_id)

#     def put(self, request, report_id):
#         return self.handle_upload(request, report_id)  

class EngineeringReportUploadAPIView(APIView):
    """
    Upload or replace a report file.

    Condition:
    ✅ CollegeListAnalysis status must be completed
    ✅ Report status always v1_received
    """

    permission_classes = [IsAuthenticated]

    def handle_upload(self, request, report_id):

        report = get_object_or_404(Report, id=report_id)
        user = report.user

        # ------------------------------------
        # CHECK COLLEGE ANALYSIS STATUS
        # ------------------------------------
        college_analysis = CollegeListAnalysis.objects.filter(
            user=user,
            program_id=report.program_id,
            package_id=report.package_id
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
        file_path2 = request.FILES.get("file_path2")

        if request.method in ["POST", "PUT"] and not (file_path or file_path2):
            return Response(
                {"message": "Report files are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ------------------------------------
        # SAVE REPORT
        # ------------------------------------
        if file_path:
            report.file_path = file_path
            report.file_path_count = (report.file_path_count or 0) + 1

        if file_path2:
            report.file_path2 = file_path2
            report.file_path2_count = (report.file_path2_count or 0) + 1

        report.uploaded_by = request.user
        report.uploaded_at = timezone.now()

        # ALWAYS UNLOCK
        report.report_status = "v1_received"

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
            booking = Booking.objects.filter(
                student=student_profile          
            ).first()

            if not booking:
                booking = Booking.objects.create(
                    student=student_profile,
                    status="not_booked"
                )
                created = True

        return Response(
            {
                "message": "Report uploaded successfully",
                "report_id": report.id,
                "file_path_count": report.file_path_count,
                "file_path2_count": report.file_path2_count,
                "uploaded_at": report.uploaded_at,
                "report_status": report.report_status,
                "college_analysis_status": college_analysis.status,
                "booking_created": created if student_profile else False
            },
            status=status.HTTP_200_OK
        )

    def post(self, request, report_id):
        return self.handle_upload(request, report_id)

    def put(self, request, report_id):
        return self.handle_upload(request, report_id)
    
    
class StudentReportUploadAPIView(APIView):
    """
    Student Upload/Update Report

    Upload File -> file_path1
    Status -> v2_received
    """

    permission_classes = [IsAuthenticated]

    def handle_upload(self, request, student_id):
        

        # -----------------------------
        # GET STUDENT
        # -----------------------------
        student = get_object_or_404(
            StudentProfile.objects.select_related("user"),
            id=student_id
        )
        
        program_id = request.GET.get("program_id")
        package_id = request.GET.get("package_id")
        
        if not program_id or not package_id:
            return Response(
                {
                    "message": "program_id and package_id are required"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Optional Security Check
        # if request.user != student.user:
        #     return Response(
        #         {"message": "You can upload only your own report"},
        #         status=status.HTTP_403_FORBIDDEN
        #     )

        # -----------------------------
        # GET REPORT
        # -----------------------------
        # Check Engineering Test Analysis Package

        user_package = UserProgramPackage.objects.filter(
            user=student.user,
            program_id=program_id,
            package_id=package_id,
            package__engineering_test_analysis=True
        ).select_related("program", "package").first()

        if not user_package:
            return Response(
                {
                    "message": "Engineering Test Analysis package not found."
                },
                status=status.HTTP_400_BAD_REQUEST
            )
            
        report = Report.objects.filter(
            user=student.user,
            program_id=program_id,
            package_id=package_id
        ).first()

        if not report:
            return Response(
                {"message": "Report not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # -----------------------------
        # FILE VALIDATION
        # -----------------------------
        file_path1 = request.FILES.get("file_path1")

        if request.method == "POST" and not file_path1:
            return Response(
                {"message": "Report file is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # -----------------------------
        # SAVE FILE
        # -----------------------------
        if file_path1:
            report.file_path1 = file_path1
            report.file_path1_count = (report.file_path1_count or 0) + 1
            report.report_status_v2 = "v2_received"

        report.uploaded_at = timezone.now()

        report.save()

        return Response(
            {
                "message": "Report uploaded successfully",
                "student_id": student.id,
                "report_id": report.id,
                "report_status_v2": report.report_status_v2,
                "uploaded_at": report.uploaded_at,
                "file_path_count": report.file_path_count,
                "file_path1_count": report.file_path1_count
            },
            status=status.HTTP_200_OK
        )

    def post(self, request, student_id):
        return self.handle_upload(request, student_id)

    def put(self, request, student_id):
        return self.handle_upload(request, student_id) 
    
class EngineeringV2ReportUploadAPIView(APIView):
    """
    Upload or replace a report file.

    Condition:
    ✅ CollegeListAnalysis status must be completed
    ✅ Report status always v3_received
    """

    permission_classes = [IsAuthenticated]

    def handle_upload(self, request, report_id):

        report = get_object_or_404(Report, id=report_id)
        user = report.user

        # ------------------------------------
        # CHECK COLLEGE ANALYSIS STATUS
        # ------------------------------------
        college_analysis = CollegeListAnalysis.objects.filter(
            user=user,
            program_id=report.program_id,
            package_id=report.package_id,
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
        file_path2 = request.FILES.get("file_path2")

        if request.method == "POST" and not file_path2:
            return Response(
                {"message": "Report file is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ------------------------------------
        # SAVE REPORT
        # ------------------------------------
        if file_path2:
            report.file_path2 = file_path2
            report.file_path2_count = (report.file_path2_count or 0) + 1

        report.uploaded_by = request.user
        report.uploaded_at = timezone.now()

        # ALWAYS UNLOCK
        report.report_status_v3 = "v3_received"

        report.save()

        # ------------------------------------
        # SEND EMAIL
        # ------------------------------------
        send_report_uploaded_email(user, report)

        # ------------------------------------
        # CREATE BOOKING IF NOT EXISTS
        # ------------------------------------
        # student_profile = StudentProfile.objects.filter(user=user).first()

        # created = False

        # if student_profile:
        #     booking = Booking.objects.filter(
        #         student=student_profile
        #     ).first()

        #     if not booking:
        #         booking = Booking.objects.create(
        #             student=student_profile,
        #             status="not_booked"
        #         )
        #         created = True

        return Response(
            {
                "message": "Report uploaded successfully",
                "report_id": report.id,
                "uploaded_at": report.uploaded_at,
                "report_status_v3": report.report_status_v3,
                "college_analysis_status": college_analysis.status,
                "file_path_count": report.file_path_count,
                "file_path1_count": report.file_path1_count,
                "file_path2_count": report.file_path2_count,
                # "booking_created": created if student_profile else False
            },
            status=status.HTTP_200_OK
        )

    def post(self, request, report_id):
        return self.handle_upload(request, report_id)

    def put(self, request, report_id):
        return self.handle_upload(request, report_id)
     
    

    
# ======================= Review APIView =======================

# class ReviewStartByStudentAPIView(APIView):
#     permission_classes = [IsAuthenticated]

#     def post(self, request):
#         student_id = request.data.get("student_id")

#         if not student_id:
#             return Response(
#                 {"message": "student_id is required"},
#                 status=status.HTTP_400_BAD_REQUEST
#             )

#         # ✅ Get student
#         try:
#             student = StudentProfile.objects.get(id=student_id)
#         except StudentProfile.DoesNotExist:
#             return Response(
#                 {"message": "Student not found"},
#                 status=status.HTTP_404_NOT_FOUND
#             )

#         # ✅ Create review using linked user
#         review = Review.objects.create(
#             user=student.user,   # ✅ CORRECT
#             review_status='in_process'
#         )

#         return Response({
#             "message": "Review created and started successfully",
#             "review_id": review.id,
#             "review_status": review.review_status
#         }, status=status.HTTP_201_CREATED)

class ReviewStartByStudentAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        student_id = request.data.get("student_id")

        if not student_id:
            return Response(
                {"message": "student_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            student = StudentProfile.objects.get(id=student_id)
        except StudentProfile.DoesNotExist:
            return Response(
                {"message": "Student not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # ✅ Check existing in_process review
        existing_review = Review.objects.filter(
            user=student.user,
            review_status="in_process"
        ).first()

        if existing_review:
            return Response(
                {
                    "message": "Review already in progress",
                    "review_id": existing_review.id,
                    "review_status": existing_review.review_status
                },
                status=status.HTTP_200_OK
            )

        # ✅ Create only if no in_process review exists
        review = Review.objects.create(
            user=student.user,
            review_status="in_process"
        )

        return Response(
            {
                "message": "Review created and started successfully",
                "review_id": review.id,
                "review_status": review.review_status
            },
            status=status.HTTP_201_CREATED
        )
        

# class SubmitReviewAPIView(APIView):
#     permission_classes = [IsAuthenticated]

#     def put(self, request, review_id=None):
#         user = request.user
#         related_id = request.data.get("related_id")

#         # =========================
#         # 🔍 FIND EXISTING REVIEW
#         # =========================
#         review = Review.objects.filter(
#             user=user,
#             related_id=related_id
#         ).first()

#         # =========================
#         # 🆕 CREATE IF NOT EXISTS
#         # =========================
#         if not review:
#             review = Review.objects.create(
#                 user=user,
#                 related_id=related_id,
#                 review_status='submitted',
#                 review_text=request.data.get("review_text"),
#                 rating=request.data.get("rating")
#             )

#         else:
#             # =========================
#             # 🔄 UPDATE EXISTING REVIEW
#             # =========================
#             review.review_text = request.data.get(
#                 "review_text",
#                 review.review_text
#             )

#             review.rating = request.data.get(
#                 "rating",
#                 review.rating
#             )

#             if review.review_status in [
#                 'not_submitted',
#                 'in_process',
#                 'pending_approval'
#             ]:
#                 review.review_status = 'submitted'

#             review.save()

#         # =========================
#         # 💳 CHECK PAYMENT STATUS
#         # =========================
#         latest_payment = (
#             Payment.objects
#             .filter(user=user)
#             .order_by('-created_at')
#             .first()
#         )

#         # =========================
#         # 🔓 UNLOCK REPORT IF:
#         # Payment fully paid
#         # Review submitted
#         # =========================
#         if (
#             latest_payment
#             and latest_payment.status == "fully_paid"
#             and review.review_status == "submitted"
#         ):
#             Report.objects.filter(
#                 user=user
#             ).update(
#                 report_status="received_unlocked"
#             )

#         # =========================
#         # 📤 RESPONSE
#         # =========================
#         return Response({
#             "message": "Review submitted successfully",
#             "review_id": review.id,
#             "review_status": review.review_status,
#             "payment_status": (
#                 latest_payment.status
#                 if latest_payment else None
#             ),
#             "report_status": (
#                 "received_unlocked"
#                 if latest_payment
#                 and latest_payment.status == "fully_paid"
#                 and review.review_status == "submitted"
#                 else "received_locked"
#             )
#         }, status=status.HTTP_200_OK)
 
class SubmitReviewAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, review_id=None):
        user = request.user
        related_id = request.data.get("related_id")

        # =========================
        # 🔍 FIND EXISTING REVIEW
        # =========================
        # review = Review.objects.filter(
        #     user=user,
        #     related_id=related_id
        # ).first()
        review = Review.objects.filter(
            user=user,
            related_id=related_id,
            review_status="in_process"
        ).first()

        # If no in_process review exists, check any existing review
        if not review:
            review = Review.objects.filter(
                user=user,
                related_id=related_id
            ).first()

        # =========================
        # 🆕 CREATE IF NOT EXISTS
        # =========================
        if not review:
            review = Review.objects.create(
                user=user,
                related_id=related_id,
                review_status='submitted',
                review_text=request.data.get("review_text"),
                rating=request.data.get("rating")
            )

        else:
            # =========================
            # 🔄 UPDATE EXISTING REVIEW
            # =========================
            review.review_text = request.data.get(
                "review_text",
                review.review_text
            )

            review.rating = request.data.get(
                "rating",
                review.rating
            )

            if review.review_status in [
                'not_submitted',
                'in_process',
                'pending_approval'
            ]:
                review.review_status = 'submitted'

            review.save()

        # =========================
        # 💳 CHECK LATEST PAYMENT STATUS
        # =========================
        latest_payment = (
            Payment.objects
            .filter(user=user)
            .order_by('-created_at')
            .first()
        )
        
        # if latest_payment:
        #     PaymentCreateAPIView().unlock_report_if_paid(latest_payment)
        

        # =========================
        # 🎓 GET STUDENT PROFILE
        # =========================
        student_profile = (
            StudentProfile.objects
            .filter(user=user)
            .first()
        )

        # =========================
        # 📅 CHECK LATEST BOOKING
        # =========================
        latest_booking = None

        if student_profile:
            latest_booking = (
                Booking.objects
                .filter(student=student_profile)
                .order_by("-id")
                .first()
            )
        # +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++    
        # =========================
        # 🚫 ENGINEERING TEST ANALYSIS
        # =========================
        is_engineering_analysis = (
            latest_payment
            and latest_payment.package.filter(
                engineering_test_analysis=True
            ).exists()
        )

        if is_engineering_analysis:

            # Get current report status from DB
            report = Report.objects.filter(
                user=user
            ).first()

            report_status = (
                report.report_status
                if report
                else None
            )

        else:

            # =========================
            # 🔒 DEFAULT REPORT STATUS
            # =========================
            report_status = "received_locked"

            if (
                latest_payment
                and latest_payment.status == "fully_paid"
                and review.review_status == "submitted"
                and latest_booking
                and latest_booking.status == "completed"
            ):
                report_status = "received_unlocked"

            Report.objects.filter(
                user=user
            ).update(
                report_status=report_status
            )
            # ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

        # # =========================
        # # 🔒 DEFAULT REPORT STATUS
        # # =========================
        # report_status = "received_locked"

        # # =========================
        # # 🔓 UNLOCK REPORT ONLY IF:
        # # ✅ Payment fully paid
        # # ✅ Review submitted
        # # ✅ Booking completed
        # # =========================
        # if (
        #     latest_payment
        #     and latest_payment.status == "fully_paid"
        #     and review.review_status == "submitted"
        #     and latest_booking
        #     and latest_booking.status == "completed"
        # ):
        #     report_status = "received_unlocked"

        # # =========================
        # # 📄 UPDATE REPORT STATUS
        # # =========================
        # Report.objects.filter(
        #     user=user
        # ).update(
        #     report_status=report_status
        # )
        
        # # =========================
        # # REPORT STATUS LOGIC
        # # Skip for engineering analysis students
        # # =========================
        # report_status = None

        # is_engineering_analysis = (
        #     latest_payment
        #     and latest_payment.package
        #     and latest_payment.package.engineering_test_analysis
        # )

        # if not is_engineering_analysis:

        #     report_status = "received_locked"

        #     if (
        #         latest_payment
        #         and latest_payment.status == "fully_paid"
        #         and review.review_status == "submitted"
        #         and latest_booking
        #         and latest_booking.status == "completed"
        #     ):
        #         report_status = "received_unlocked"

        #     Report.objects.filter(
        #         user=user
        #     ).update(
        #         report_status=report_status
        #     )
            
        # =========================
        # 📤 RESPONSE
        # =========================
        
        return Response({
            "message": "Review submitted successfully",

            "review_id": review.id,

            "review_status": review.review_status,

            "payment_status": (
                latest_payment.status
                if latest_payment
                else None
            ),

            "booking_status": (
                latest_booking.status
                if latest_booking
                else None
            ),

            "report_status": report_status
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