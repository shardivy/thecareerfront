import logging
from django.shortcuts import get_object_or_404, render

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import  IsAuthenticated, AllowAny

from accounts.permissions import IsAdmin, IsSuperAdmin
from report.models import Report
from lead_registration.models import StudentProfile
from program_package.models import Answer, CollegeListAnalysis, LandingPage, Package, PackageFeature, Program, QuestionAnswer, UserProgramPackage
from program_package.serializers import CollegeListAnalysisSerializer, LandingPageSerializer, MultipleProgramsWithPackagesSerializer, PackageCreateSerializer, PackageListSerializer, PackageSerializer, ProgramListSerializer, ProgramSerializer, ProgramWithPackagesSerializer, QuestionAnswerSerializer
from django.db.models import Count, Sum


class ProgramListAPIView(APIView):
    """
    List all programs with enrolled users count
    """
    # permission_classes = [AllowAny]
    def get(self, request):
        programs = Program.objects.annotate(
            enrolled_users=Count("userprogrampackage", distinct=True)
        ).order_by("-created_at")

        serializer = ProgramListSerializer(programs, many=True)

        return Response(
            {
                "success": True,
                "count": programs.count(),
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )
        
class ActiveProgramListAPIView(APIView):

    def get(self, request):
        programs = Program.objects.filter(is_active=True).order_by("-created_at")
        serializer = ProgramSerializer(programs, many=True)

        return Response({
            "count": programs.count(),
            "data": serializer.data
        })
        
class ExcludeHandholdingProgramListAPIView(APIView):
    
    def get(self, request):
        programs = Program.objects.filter(is_active=True).exclude(package__is_handholding=True).distinct()
        serializer = ProgramSerializer(programs, many=True)

        return Response({
            "count": programs.count(),
            "data": serializer.data
        })

class AddProgramAPIView(APIView):
    """
    API to allow super_admin users to create a new Program.
    """
    permission_classes = [IsSuperAdmin | IsAdmin ]
    

    def post(self, request):
        serializer = ProgramSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "errors": serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        program = serializer.save()

        return Response(
            {
                "success": True,
                "message": "Program added successfully",
                "data": serializer.data
            },
            status=status.HTTP_201_CREATED
        )
        
        
class UpdateProgramAPIView(APIView):
    """
    API to update or delete an existing Program
    """
    permission_classes = [IsSuperAdmin]

    # =========================
    # UPDATE PROGRAM (PUT)
    # =========================
    def put(self, request, program_id):
        try:
            program = Program.objects.get(id=program_id)
        except Program.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "Program not found"
                },
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ProgramSerializer(
            program,
            data=request.data,
            partial=False  # PUT = full update
        )

        if not serializer.is_valid():
            return Response(
                {
                    "success": False,
                    "errors": serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer.save()

        return Response(
            {
                "success": True,
                "message": "Program updated successfully",
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )
        
    # =========================
    # DELETE PROGRAM
    # =========================
    def delete(self, request, program_id):
        try:
            program = Program.objects.get(id=program_id)
        except Program.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "Program not found"
                },
                status=status.HTTP_404_NOT_FOUND
            )

        program.delete()

        return Response(
            {
                "success": True,
                "message": "Program deleted successfully"
            },
            status=status.HTTP_200_OK
        )

        
logger = logging.getLogger(__name__)

class PackageCreateAPIView(APIView):
    """
    Creates a package along with its features
    """
    permission_classes = [IsAdmin | IsSuperAdmin]

    def post(self, request):
        serializer = PackageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        package = serializer.save()

        return Response(
            {
                "success": True,
                "message": "Package created successfully",
                "data": {
                    "package_id": package.id,
                    "program": {
                        "id": package.program.id,
                        "name": package.program.name
                    },
                    "name": package.name,
                    "price": float(package.price),
                    "description": package.description,
                    "link_url": package.link_url,
                    "is_active": package.is_active,
                    "aptitude_test": package.aptitude_test,
                    "engineering_test_analysis": package.engineering_test_analysis,
                    "is_handholding": package.is_handholding,
                    "features": [
                        {
                            "id": feature.id,
                            "description": feature.description
                        }
                        for feature in package.packagefeature_set.all()
                    ]
                }
            },
            status=status.HTTP_201_CREATED
        )
        
    def put(self, request, pk):
        # Update package and replace its features
        package = get_object_or_404(Package, pk=pk)

        serializer = PackageCreateSerializer(
            package,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        package = serializer.save()

        # 🔁 Replace features if provided
        features = request.data.get("features", None)
        if features is not None:
            PackageFeature.objects.filter(package=package).delete()
            PackageFeature.objects.bulk_create([
                PackageFeature(
                    package=package,
                    description=feature
                )
                for feature in features
            ])

        return Response(
            {
                "success": True,
                "message": "Package updated successfully",
                "data": {
                    "package_id": package.id,
                    "program": {
                        "id": package.program.id,
                        "name": package.program.name
                    },
                    "name": package.name,
                    "price": float(package.price),
                    "description": package.description,
                    "link_url": package.link_url,
                    "is_active": package.is_active,
                    "aptitude_test": package.aptitude_test,
                    "engineering_test_analysis": package.engineering_test_analysis,
                    "is_handholding": package.is_handholding,
                    "features": [
                        {
                            "id": f.id,
                            "description": f.description
                        }
                        for f in package.packagefeature_set.all()
                    ]
                }
            },
            status=status.HTTP_200_OK
        )
        
class PackageListAPIView(APIView):
    """
    List all packages with active user count
    """
    # permission_classes = [IsAdmin]

    def get(self, request):
        packages = (
            Package.objects
            .select_related("program")
            .prefetch_related("packagefeature_set")  # improve query for features
            .annotate(
                active_users=Count("userprogrampackage")
            )
            .order_by("program__name", "name")
        )

        serializer = PackageListSerializer(packages, many=True)

        return Response(
            {
                "success": True,
                "count": packages.count(),
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )
        
class DashboardCountAPIView(APIView):
    permission_classes = [IsAuthenticated]

    # def get(self, request):
    #     total_programs = Program.objects.count()
    #     total_packages = Package.objects.count()
    #     total_enrolled_students = (
    #         UserProgramPackage.objects
    #         .values("user")
    #         .distinct()
    #         .count()
    #     )

    #     return Response({
    #         "total_programs": total_programs,
    #         "total_packages": total_packages,
    #         "total_enrolled_students": total_enrolled_students
    #     })
    
    def get(self, request):
        total_programs = Program.objects.count()
        total_packages = Package.objects.count()

        total_enrolled_students = (
            UserProgramPackage.objects
            .values("user")
            .distinct()
            .count()
        )

        # ✅ Total Revenue (Sum of purchased package prices)
        total_revenue = (
            UserProgramPackage.objects
            .aggregate(total=Sum("package__price"))
            .get("total") or 0
        )

        return Response({
            "total_programs": total_programs,
            "total_packages": total_packages,
            "total_enrolled_students": total_enrolled_students,
            "total_revenue": total_revenue
        })
 
# Fetch packages for a specific program        
class ProgramPackagesAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, program_id):
        program = get_object_or_404(Program, id=program_id, is_active=True)

        serializer = ProgramWithPackagesSerializer(program)

        return Response(
            {
                "message": "Program packages fetched successfully",
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )
        
class MultipleProgramPackagesAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):

        program_ids = request.data.get("program_ids", [])

        programs = Program.objects.filter(
            id__in=program_ids,
            is_active=True
        )

        serializer = MultipleProgramsWithPackagesSerializer(
            programs,
            many=True
        )

        return Response(
            {
                "message": "Programs fetched successfully",
                "count": programs.count(),
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )


class ProgramPackageDetailAPIView(APIView):
    """
    API to fetch a specific package under a program using program_id and package_id.
    Returns program name, package name, price, description, and package URL.
    """
    permission_classes = [IsAuthenticated]
    def get(self, request, program_id, package_id):

        try:
            program = Program.objects.get(id=program_id, is_active=True)
        except Program.DoesNotExist:
            return Response(
                {"error": "Program not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            package = Package.objects.get(
                id=package_id,
                program=program,
                is_active=True
            )
        except Package.DoesNotExist:
            return Response(
                {"error": "Package not found for this program"},
                status=status.HTTP_404_NOT_FOUND
            )

        data = {
            "program_id": program.id,
            "program_name": program.name,
            "package_id": package.id,
            "package_name": package.name,
            "price": package.price,
            # "package_url": package.link_url,
            # "description": package.description
        }

        return Response(data)
    
    
    
# ============================ Engineering Test Analysis Field Added in API Responses ============================

# class CollegeListAnalysisListAPIView(APIView):

#     permission_classes = [IsAuthenticated]

#     def get(self, request):

#         analyses = CollegeListAnalysis.objects.select_related(
#             "user", "program", "package"
#         ).order_by("-created_at")

#         serializer = CollegeListAnalysisSerializer(analyses, many=True)

#         return Response({
#             "message": "College analysis list fetched successfully",
#             "count": analyses.count(),
#             "data": serializer.data
#         })
  
class CollegeListAnalysisListAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        tab = request.GET.get("tab")
        student_id = request.GET.get("student_id")
        program_id = request.GET.get("program_id")
        package_id = request.GET.get("package_id")

        analyses = CollegeListAnalysis.objects.select_related(
            "user", "program", "package"
        ).order_by("-created_at")

        # Draft filter
        if tab == "draft":
            analyses = analyses.filter(status="in_progress")

        # Filter by student
        if student_id:
            student = get_object_or_404(StudentProfile, id=student_id)
            analyses = analyses.filter(user=student.user)
            
        if program_id:
            analyses = analyses.filter(program_id=program_id)
            
        if package_id:
             analyses = analyses.filter(package_id=package_id)

        serializer = CollegeListAnalysisSerializer(analyses, many=True)

        response_data = {
            "message": "College analysis list fetched successfully",
            "count": analyses.count(),
            "data": serializer.data
        }

        # Draft question + answers
        if tab == "draft" and student_id and program_id and package_id:

            questions = QuestionAnswer.objects.all()

            answers = Answer.objects.filter(
                student=student,
                program_id=program_id,
                package_id=package_id,
                is_draft=True
            )

            answer_map = {
                ans.question_id: ans.answer_text
                for ans in answers
            }

            question_list = []

            for q in questions:
                question_list.append({
                    "question_id": q.id,
                    "question": q.question,
                    "answer_text": answer_map.get(q.id, "")
                })

            # response_data["questions"] = question_list

        return Response(response_data)
        
class AddQuestionAPIView(APIView):

    permission_classes = [IsAuthenticated]
    
    # ✅ GET (List or Single)
    def get(self, request, question_id=None):

        if question_id:
            question = get_object_or_404(QuestionAnswer, id=question_id)

            serializer = QuestionAnswerSerializer(question)

            return Response({
                "message": "Question fetched successfully",
                "data": serializer.data
            })

        questions = QuestionAnswer.objects.select_related("user").order_by("-created_at")

        serializer = QuestionAnswerSerializer(questions, many=True)

        return Response({
            "message": "Questions fetched successfully",
            "count": questions.count(),
            "data": serializer.data
        })


    def post(self, request):

        serializer = QuestionAnswerSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {
                    "message": "Validation error",
                    "errors": serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        question = serializer.save(user=request.user)

        return Response(
            {
                "message": "Question added successfully",
                "data": QuestionAnswerSerializer(question).data
            },
            status=status.HTTP_201_CREATED
        )
        
    # ✅ Update Question or Answer
    def put(self, request, question_id):

        question = get_object_or_404(QuestionAnswer, id=question_id)

        serializer = QuestionAnswerSerializer(
            question,
            data=request.data,
            partial=True
        )

        if not serializer.is_valid():
            return Response(
                {"message": "Validation error", "errors": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer.save()

        return Response(
            {
                "message": "Question updated successfully",
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )

    # ✅ Delete Question
    def delete(self, request, question_id):

        question = get_object_or_404(QuestionAnswer, id=question_id)

        question.delete()

        return Response(
            {"message": "Question deleted successfully"},
            status=status.HTTP_200_OK
        )
        
class StartQuestionAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def put(self, request, student_id):
        
        program_id = request.GET.get("program_id")
        package_id = request.GET.get("package_id")

        if not program_id or not package_id:
            return Response(
                {
                    "message": "program_id and package_id are required"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get student profile
        student = get_object_or_404(StudentProfile, id=student_id)

        # Get latest college analysis for that student
        analysis = (
            CollegeListAnalysis.objects
            .filter(
                user=student.user,
                program_id=program_id,
                package_id=package_id
            )
            .order_by("-created_at")
            .first()
        )

        if not analysis:
            return Response(
                {"message": "College list analysis not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Only update if status is not_started
        if analysis.status == "not_started":
            analysis.status = "in_progress"
            analysis.save(update_fields=["status"])

            return Response(
                {
                    "message": "Status updated successfully",
                    "data": {
                        "student_id": student_id,
                        "program_id": program_id,
                        "package_id": package_id,
                        "analysis_id": analysis.id,
                        "status": analysis.status
                    }
                },
                status=status.HTTP_200_OK
            )

        return Response(
            {
                "message": "Status already started or completed",
                "current_status": analysis.status
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    

# class SubmitMultipleAnswersAPIView(APIView):

#     permission_classes = [IsAuthenticated]

#     def post(self, request):

#         student_id = request.data.get("student_id")
#         answers_data = request.data.get("answers", [])
#         is_final_submit = request.data.get("is_final_submit", False)  # ✅ NEW

#         student = get_object_or_404(StudentProfile, id=student_id)

#         created_answers = []

#         is_draft = not is_final_submit   # ✅ FIXED LOGIC

#         for item in answers_data:

#             answer = Answer.objects.update_or_create(
#                 student=student,
#                 question_id=item.get("question_id"),
#                 defaults={
#                     "answer_text": item.get("answer_text"),
#                     "is_draft": is_draft
#                 }
#             )[0]

#             created_answers.append({
#                 "id": answer.id,
#                 "question_id": answer.question.id,
#                 "answer_text": answer.answer_text,
#                 "is_draft": answer.is_draft
#             })

#         analysis = CollegeListAnalysis.objects.filter(user=student.user).first()

#         report_created = False
#         report = None

#         if analysis:

#             if is_final_submit:
#                 analysis.status = "completed"
#             else:
#                 analysis.status = "in_progress"

#             analysis.save(update_fields=["status"])

#             if is_final_submit:
#                 report, report_created = Report.objects.get_or_create(
#                     user=student.user,
#                     defaults={
#                         "exam": None,
#                         "report_status": "not_received",
#                     }
#                 )

#                 if not report_created:
#                     report.report_status = "not_received"
#                     report.save(update_fields=["report_status"])

#         return Response({
#             "message": "Draft saved successfully" if not is_final_submit else "Answers submitted successfully",
#             "analysis_status": analysis.status if analysis else None,
#             "report_created": report_created,
#             "report_id": report.id if report else None,
#             "report_status": report.report_status if report else None,
#             "data": created_answers
#         }, status=status.HTTP_201_CREATED)
 
class SubmitMultipleAnswersAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        student_id = request.data.get("student_id")
        answers_data = request.data.get("answers", [])
        program_id = request.data.get("program_id")
        package_id = request.data.get("package_id")
        is_final_submit = request.data.get("is_final_submit", False)  # ✅ NEW

        student = get_object_or_404(StudentProfile, id=student_id)

        created_answers = []

        is_draft = not is_final_submit   # ✅ FIXED LOGIC

        for item in answers_data:

            answer = Answer.objects.update_or_create(
                student=student,
                program_id=program_id,
                package_id=package_id,
                question_id=item.get("question_id"),
                defaults={
                    "answer_text": item.get("answer_text"),
                    "is_draft": is_draft
                }
            )[0]

            created_answers.append({
                "id": answer.id,
                "question_id": answer.question.id,
                "answer_text": answer.answer_text,
                "is_draft": answer.is_draft
            })

        # analysis = CollegeListAnalysis.objects.filter(user=student.user).first()
        analysis = CollegeListAnalysis.objects.filter(
            user=student.user,
            program_id=program_id,
            package_id=package_id
        ).first()

        report_created = False
        report = None

        if analysis:
            if is_final_submit:
                analysis.status = "completed"
            else:
                analysis.status = "in_progress"

            analysis.save(update_fields=["status"])


        # ✅ CREATE REPORT ON FINAL SUBMIT
        if is_final_submit:
            print("Student id:", student.user.id)
            user_program = CollegeListAnalysis.objects.filter(
                user=student.user,
                program_id=program_id,
                package_id=package_id
            ).select_related(
                "program",
                "package"
            ).first()
            
            print("User program:", user_program)
            if user_program:
                print("Program:", analysis.program)
                print("Package:", analysis.package)

            report, report_created = Report.objects.get_or_create(
                user=student.user,
                program=user_program.program if analysis else None,
                package=user_program.package if analysis else None,
                exam=None,
                defaults={
                    "report_status": "v1_not_received",
                    "review_required": False
                }
            )

            report_created = True

            if not report_created:
                report.report_status = "v1_not_received"
                report.save(update_fields=["report_status"])

        return Response({
            "message": "Draft saved successfully" if not is_final_submit else "Answers submitted successfully",
            "analysis_status": analysis.status if analysis else None,
            "report_created": report_created,
            "report_id": report.id if report else None,
            "report_status": report.report_status if report else None,
            "data": created_answers
        }, status=status.HTTP_201_CREATED)
     
 
        
class UpdateMultipleAnswersAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def put(self, request, student_id):

        answers_data = request.data.get("answers", [])

        student = get_object_or_404(StudentProfile, id=student_id)

        updated_answers = []

        for item in answers_data:

            question_id = item.get("question_id")
            answer_text = item.get("answer_text")

            answer = Answer.objects.filter(
                student=student,
                question_id=question_id
            ).first()

            if answer:
                answer.answer_text = answer_text
                answer.save(update_fields=["answer_text"])

                updated_answers.append({
                    "id": answer.id,
                    "question_id": question_id,
                    "answer_text": answer.answer_text
                })

        return Response(
            {
                "message": "Answers updated successfully",
                "student_id": student_id,
                "data": updated_answers
            },
            status=status.HTTP_200_OK
        )

        
# class CollegeListAnalysisStatusAPIView(APIView):

#     permission_classes = [IsAuthenticated]

#     def get(self, request, student_id):

#         # Get student profile
#         student = get_object_or_404(StudentProfile, id=student_id)

#         # Get college analysis
#         analysis = (
#             CollegeListAnalysis.objects
#             .filter(user=student.user)
#             .order_by("-created_at")
#             .first()
#         )

#         if not analysis:
#             return Response(
#                 {
#                     "student_id": student_id,
#                     "analysis_status": None,
#                     "message": "College list analysis not found"
#                 },
#                 status=status.HTTP_404_NOT_FOUND
#             )

#         return Response(
#             {
#                 "student_id": student_id,
#                 # "college_analysis_id": analysis.id,
#                 "analysis_status": analysis.status
#             },
#             status=status.HTTP_200_OK
#         )

class CollegeListAnalysisStatusAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):

        student = get_object_or_404(StudentProfile, id=student_id)

        program_id = request.query_params.get("program_id")
        package_id = request.query_params.get("package_id")

        if not program_id or not package_id:
            return Response(
                {
                    "message": "program_id and package_id are required"
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        analysis = (
            CollegeListAnalysis.objects
            .filter(
                user=student.user,
                program_id=program_id,
                package_id=package_id
            )
            .order_by("-created_at")
            .first()
        )

        if not analysis:
            return Response(
                {
                    "student_id": student_id,
                    "program_id": program_id,
                    "package_id": package_id,
                    "analysis_status": None,
                    "message": "College list analysis not found"
                },
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(
            {
                "student_id": student_id,
                "program_id": program_id,
                "package_id": package_id,
                "analysis_status": analysis.status
            },
            status=status.HTTP_200_OK
        )

class EngineeringAnalysisDashboardAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        # -----------------------------
        # TOTAL QUESTION TEMPLATES
        # -----------------------------
        total_questions = QuestionAnswer.objects.count()

        # -----------------------------
        # USERS WHO REQUESTED ENGINEERING ANALYSIS
        # -----------------------------
        analysis_users = CollegeListAnalysis.objects.filter(
            program__name="Engineering"
        ).values_list("user_id", flat=True)

        user_request_count = analysis_users.count()

        # -----------------------------
        # REPORTS UPLOADED
        # -----------------------------
        report_uploaded_count = Report.objects.filter(
            user_id__in=analysis_users,
            report_status__in=["received_locked", "received_unlocked"]
        ).count()

        # -----------------------------
        # PENDING REPORT UPLOAD
        # -----------------------------
        pending_report_count = Report.objects.filter(
            user_id__in=analysis_users,
            report_status="not_received"
        ).count()

        return Response({
            "total_templates_questions": total_questions,
            "engineering_test_analysis_users": user_request_count,
            "reports_uploaded": report_uploaded_count,
            "pending_report_upload": pending_report_count
        })
        
class CreateLandingPageAPIView(APIView):
    permission_classes = [AllowAny]  # remove if not needed
    
    def get(self, request):

        queryset = LandingPage.objects.select_related("program", "package").all().order_by("-created_at")

        serializer = LandingPageSerializer(
            queryset,
            many=True,
            context={"request": request}
        )

        return Response(
            {
                "success": True,
                "count": len(serializer.data),
                "data": serializer.data
            },
            status=status.HTTP_200_OK
        )

    def post(self, request):

        serializer = LandingPageSerializer(
            data=request.data,
            context={"request": request}
        )

        if serializer.is_valid():
            landing_page = serializer.save()

            return Response(
                {
                    "success": True,
                    "message": "Landing page created successfully",
                    "data": LandingPageSerializer(
                        landing_page,
                        context={"request": request}
                    ).data
                },
                status=status.HTTP_201_CREATED
            )

        return Response(
            {
                "success": False,
                "errors": serializer.errors
            },
            status=status.HTTP_400_BAD_REQUEST
        )
        
    def put(self, request, pk):
        try:
            landing_page = LandingPage.objects.get(id=pk)
        except LandingPage.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "Landing page not found"
                },
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            serializer = LandingPageSerializer(
                landing_page,
                data=request.data,
                partial=True,  # ✅ allows partial update
                context={"request": request}
            )

            if serializer.is_valid():
                updated_landing_page = serializer.save()

                return Response(
                    {
                        "success": True,
                        "message": "Landing page updated successfully",
                        "data": LandingPageSerializer(
                            updated_landing_page,
                            context={"request": request}
                        ).data
                    },
                    status=status.HTTP_200_OK
                )

            return Response(
                {
                    "success": False,
                    "errors": serializer.errors
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        except Exception as e:
            return Response(
                {
                    "success": False,
                    "message": "Something went wrong",
                    "error": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
    def delete(self, request, pk):
        try:
            landing_page = LandingPage.objects.get(id=pk)
        except LandingPage.DoesNotExist:
            return Response(
                {
                    "success": False,
                    "message": "Landing page not found"
                },
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            landing_page.delete()

            return Response(
                {
                    "success": True,
                    "message": "Landing page deleted successfully"
                },
                status=status.HTTP_200_OK
            )

        except Exception as e:
            return Response(
                {
                    "success": False,
                    "message": "Failed to delete landing page",
                    "error": str(e)
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
class LandingPageByPackageAPIView(APIView):

    def get(self, request, package_id):
        try:
            landing_pages = (
                LandingPage.objects
                .filter(package_id=package_id)
                .select_related("program", "package")
            )

            if not landing_pages.exists():
                return Response({
                    "success": False,
                    "message": "No landing page found for this package"
                }, status=status.HTTP_404_NOT_FOUND)

            serializer = LandingPageSerializer(
                landing_pages,
                many=True,
                context={"request": request}
            )

            return Response({
                "success": True,
                "count": len(serializer.data),
                "data": serializer.data
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({
                "success": False,
                "message": "Something went wrong",
                "error": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)