from rest_framework import serializers

from accounts.models import Permission, Role, RolePermission, User
from event.models import HandHoldingParticipant
from exam.models import UserExam
from lead_registration.models import StudentProfile
from payment.models import Payment
from program_package.models import CollegeListAnalysis, PackageExam, UserProgramPackage
from counselling_slot.models import Booking
from report.models import Report
from django.urls import reverse
from django.db.models import Sum

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name']  # include other fields if needed
        
class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ["id", "code", "description"]


class RolePermissionSerializer(serializers.ModelSerializer):
    permission = PermissionSerializer(read_only=True)

    class Meta:
        model = RolePermission
        fields = ["id", "permission"]

class UserSerializer(serializers.ModelSerializer):
    role = RoleSerializer(read_only=True)  # nested role info

    class Meta:
        model = User
        fields = [
            'id',
            'public_id',
            'first_name',
            'last_name',
            'email',
            'phone',
            'role',
            'is_active',
            'is_staff',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'public_id', 'created_at', 'updated_at']
        
        
class PackageExamSerializer(serializers.ModelSerializer):
    exam_name = serializers.CharField(source="exam.name")

    class Meta:
        model = PackageExam
        fields = [
            "exam_name",
            "is_mandatory",
            "sequence_order",
        ]

class UserProgramPackageSerializer(serializers.ModelSerializer):
    program_name = serializers.CharField(source="program.name")
    package_name = serializers.CharField(source="package.name")
    exams = serializers.SerializerMethodField()

    class Meta:
        model = UserProgramPackage
        fields = [
            "program_name",
            "package_name",
            "assigned_by",
            "created_at",
            "exams",
        ]

    def get_exams(self, obj):
        exams = PackageExam.objects.filter(package=obj.package)
        return PackageExamSerializer(exams, many=True).data

class StudentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProfile
        fields = [
            "study_class",
            "current_academic_stage",
            "current_academic_year",
            "school_college",
            "city",
        ]
        

# class StudentListSerializer(serializers.ModelSerializer):
#     first_name = serializers.CharField(source="user.first_name")
#     last_name = serializers.CharField(source="user.last_name")
#     email = serializers.EmailField(source="user.email")
#     phone = serializers.CharField(source="user.phone")  
#     preferred_counselling_mode = serializers.SerializerMethodField()
#     created_at = serializers.DateTimeField(read_only=True)
#     program_id = serializers.SerializerMethodField()
#     program_name = serializers.SerializerMethodField()
#     package_id = serializers.SerializerMethodField()
#     package_name = serializers.SerializerMethodField()
#     price = serializers.SerializerMethodField()
#     payment_status = serializers.SerializerMethodField()
#     payment_type = serializers.SerializerMethodField()
#     # created_at = serializers.DateTimeField()
#     method = serializers.SerializerMethodField()
#     transaction_id = serializers.SerializerMethodField()
#     amount = serializers.SerializerMethodField()
#     total_paid_amount = serializers.SerializerMethodField()
#     proof_file = serializers.SerializerMethodField()
#     # is_report_locked = serializers.SerializerMethodField()
#     report_status = serializers.SerializerMethodField()
#     exam_status = serializers.SerializerMethodField()
#     analysis_status = serializers.SerializerMethodField()
#     slot_status = serializers.SerializerMethodField()
#     full_access = serializers.SerializerMethodField()
#     aptitude_test = serializers.SerializerMethodField()

#     class Meta:
#         model = StudentProfile
#         fields = [
#             "id",
#             "first_name",
#             "last_name",
#             "email",
#             "phone",
#             "preferred_counselling_mode",
#             "created_at",
#             "study_class",
#             "current_academic_stage",
#             "city",
#             "program_id",
#             "program_name",
#             "package_id",
#             "package_name",
#             "price",
#             "aptitude_test", 
#             "payment_status",
#             "payment_type",
#             # "created_at",
#             "method",
#             "transaction_id",
#             "amount",
#             "total_paid_amount", 
#             "proof_file",
#             # "is_report_locked",
#             "report_status",
#             "exam_status",
#             "analysis_status",
#             "slot_status",
#             "full_access",
#         ]
        
#     def get_aptitude_test(self, obj):
#         upp = (
#             UserProgramPackage.objects
#             .filter(user=obj.user)
#             .select_related("package")
#             .last()
#         )

#         if not upp or not upp.package:
#             return False

#         return upp.package.aptitude_test
        
#     def get_preferred_counselling_mode(self, obj):
#         return obj.preferred_counselling_mode if obj.preferred_counselling_mode else "Not Specified"

#     def get_student_name(self, obj):
#         return f"{obj.user.first_name} {obj.user.last_name}"

#     def get_program_id(self, obj):
#         upp = UserProgramPackage.objects.filter(user=obj.user).last()
#         return upp.program.id if upp and upp.program else None

#     def get_program_name(self, obj):
#         upp = UserProgramPackage.objects.filter(user=obj.user).last()
#         return upp.program.name if upp and upp.program else None

#     def get_package_id(self, obj):
#         upp = UserProgramPackage.objects.filter(user=obj.user).last()
#         return upp.package.id if upp and upp.package else None

#     def get_package_name(self, obj):
#         upp = UserProgramPackage.objects.filter(user=obj.user).last()
#         return upp.package.name if upp and upp.package else None
    
#     def get_price(self, obj):
#         upp = UserProgramPackage.objects.filter(user=obj.user).last()
#         return upp.package.price if upp and upp.package else None


#     def get_payment_status(self, obj):
#         upp = (
#             UserProgramPackage.objects
#             .filter(user=obj.user)
#             .select_related("package")
#             .last()
#         )

#         if not upp or not upp.package:
#             return "not_paid"

#         package_price = upp.package.price or 0

#         # 🔥 Sum ALL payments (previous + current)
#         total_paid = (
#             Payment.objects
#             .filter(user=obj.user)
#             .aggregate(total=Sum("amount"))["total"]
#             or 0
#         )

#         if total_paid == 0:
#             return "not_paid"
#         elif total_paid < package_price:
#             return "partial_paid"
#         else:
#             return "fully_paid"
    
#     def get_payment_type(self, obj):
#         payment = Payment.objects.filter(user=obj.user).order_by("-created_at").first()
#         return payment.payment_type if payment else None
    
#     # def get_created_at(self, obj):
#     #     payment = Payment.objects.filter(user=obj.user).order_by("-created_at").first()
#     #     return payment.created_at if payment else None
    
#     def get_method(self, obj):
#         payment = Payment.objects.filter(user=obj.user).order_by("-created_at").first()
#         return payment.method if payment else None
    
#     def get_transaction_id(self, obj):
#         payment = Payment.objects.filter(user=obj.user).order_by("-created_at").first()
#         return payment.transaction_id if payment else None
    
#     def get_amount(self, obj):
#         payment = Payment.objects.filter(user=obj.user).order_by("-created_at").first()
#         return payment.amount if payment else None
    
#     def get_total_paid_amount(self, obj):
#         total = (
#             Payment.objects
#             .filter(user=obj.user)
#             .aggregate(total=Sum("amount"))["total"]
#         )
#         return total or 0
    
#     def get_proof_file(self, obj):
#         payment = (
#             Payment.objects
#             .filter(user=obj.user)
#             .order_by("-created_at")
#             .first()
#         )

#         if not payment or not payment.proof_file:
#             return None

#         request = self.context.get("request")
#         if not request:
#             return None

#         # 🔥 Return iframe-safe API URL
#         url = reverse(
#             "payment-report-image",
#             kwargs={"payment_id": payment.id}
#         )
#         return request.build_absolute_uri(url)
    
#     # def get_report_status(self, obj):
#     #     report = Report.objects.filter(user=obj.user).order_by("-uploaded_at").first()
#     #     return report.report_status if report else "not_uploaded"       #locked, unlocked 
    
#     # def get_report_status(self, obj):
#     #     upp = (
#     #         UserProgramPackage.objects
#     #         .filter(user=obj.user)
#     #         .select_related("package")
#     #         .last()
#     #     )

#     #     # ❌ If no package OR aptitude_test False
#     #     if not upp or not upp.package or not upp.package.aptitude_test:
#     #         return "not_applicable"

#     #     # ✅ If aptitude_test True → return actual report status
#     #     report = (
#     #         Report.objects
#     #         .filter(user=obj.user)
#     #         .order_by("-uploaded_at")
#     #         .first()
#     #     )

#     #     return report.report_status if report else "not_received"
    
#     def get_report_status(self, obj):

#         upp = (
#             UserProgramPackage.objects
#             .filter(user=obj.user)
#             .select_related("package")
#             .order_by("-created_at")
#             .first()
#         )

#         # ❌ No package
#         if not upp or not upp.package:
#             return "not_applicable"

#         package = upp.package

#         aptitude_test_status = package.aptitude_test
#         engineering_analysis_status = package.engineering_test_analysis

#         # ❌ BOTH FALSE → NOT APPLICABLE
#         if not aptitude_test_status and not engineering_analysis_status:
#             return "not_applicable"

#         # ✅ FETCH REPORT
#         report = (
#             Report.objects
#             .filter(user=obj.user)
#             .order_by("-uploaded_at")
#             .first()
#         )

#         # ❌ NOT UPLOADED
#         if not report:
#             return "not_received"

#         # ✅ RETURN ACTUAL STATUS
#         return report.report_status

#     # def get_exam_status(self, obj):
#     #     qs = UserExam.objects.filter(user=obj.user)

#     #     return {
#     #         "completed": qs.filter(status="completed").count(),
#     #         "in_progress": qs.filter(status="in_progress").count(),
#     #         "pending_approval": qs.filter(status="pending_approval").count(),
#     #         "not_started": qs.filter(status="not_started").count(),
#     #     }
#     def get_exam_status(self, obj):
#         upp = (
#             UserProgramPackage.objects
#             .filter(user=obj.user)
#             .select_related("package")
#             .last()
#         )

#         # ❌ If no package OR aptitude_test False
#         if not upp or not upp.package or not upp.package.aptitude_test:
#             return {
#                 "completed": "not_applicable",
#                 "in_progress": "not_applicable",
#                 "pending_approval": "not_applicable",
#                 "not_started": "not_applicable",
#             }

#         # ✅ If aptitude_test True → return actual counts
#         qs = UserExam.objects.filter(user=obj.user)

#         return {
#             "completed": qs.filter(status="completed").count(),
#             "in_progress": qs.filter(status="in_progress").count(),
#             "pending_approval": qs.filter(status="pending_approval").count(),
#             "not_started": qs.filter(status="not_started").count(),
#         }
    
#     def get_analysis_status(self, obj):
#         upp = (
#             UserProgramPackage.objects
#             .filter(user=obj.user)
#             .select_related("package")
#             .last()
#         )

#         # ❌ Not applicable
#         if not upp or not upp.package or not upp.package.engineering_test_analysis:
#             return "not_applicable"

#         # ✅ Fetch from CollegeListAnalysis
#         analysis = (
#             CollegeListAnalysis.objects
#             .filter(user=obj.user)
#             .order_by("-created_at")
#             .first()
#         )

#         if not analysis:
#             return "not_started"

#         return analysis.status
        
#     # def get_slot_status(self, obj):
#     #     booking = (
#     #         Booking.objects
#     #         .filter(student=obj)
#     #         .order_by("-created_at")
#     #         .first()
#     #     )

#     #     return booking.status if booking else "not_booked"
    
#     def get_slot_status(self, obj):
#         booking = (
#             Booking.objects
#             .filter(student=obj)
#             .first()   # fetch last DB row
#         )

#         if not booking:
#             return "not_booked"

#         return booking.status
        
        
#     def get_full_access(self, obj):
#         # Check booking
#         booking = Booking.objects.filter(student=obj).exists()

#         # Check review (currently hardcoded False like journey API)
#         review_status = False  # update when review model exists

#         # Step priority (same as journey current_step logic)
#         if review_status:
#             return "Review"

#         if booking:
#             return "Counselling Slot Booking"

#         # Check report
#         upp = UserProgramPackage.objects.filter(user=obj.user).last()
        
#         if upp and upp.package and upp.package.aptitude_test:
#             report = Report.objects.filter(user=obj.user).order_by("-uploaded_at").first()
#             if report:
#                 return "Report"

#             exam = UserExam.objects.filter(user=obj.user).exists()
#             if exam:
#                 return "Exam"

#         # Payment
#         payment = Payment.objects.filter(user=obj.user).exists()
#         if payment:
#             return "Payment"

#         # Counselling service
#         if upp:
#             return "Counselling Service Selection"

#         return "Registration"

class StudentListSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source="user.first_name")
    last_name = serializers.CharField(source="user.last_name")
    email = serializers.EmailField(source="user.email")
    phone = serializers.CharField(source="user.phone")  
    preferred_counselling_mode = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(read_only=True)
    programs = serializers.SerializerMethodField()
        # program_id = serializers.SerializerMethodField()
        # program_name = serializers.SerializerMethodField()
        # package_id = serializers.SerializerMethodField()
        # package_name = serializers.SerializerMethodField()
    price = serializers.SerializerMethodField()
    payment_status = serializers.SerializerMethodField()
    payment_type = serializers.SerializerMethodField()
    # created_at = serializers.DateTimeField()
    method = serializers.SerializerMethodField()
    transaction_id = serializers.SerializerMethodField()
    amount = serializers.SerializerMethodField()
    total_paid_amount = serializers.SerializerMethodField()
    proof_file = serializers.SerializerMethodField()
    # is_report_locked = serializers.SerializerMethodField()
    # report_status = serializers.SerializerMethodField()
    # exam_status = serializers.SerializerMethodField()
    # analysis_status = serializers.SerializerMethodField()
    # slot_status = serializers.SerializerMethodField()
    # full_access = serializers.SerializerMethodField()
    # aptitude_test = serializers.SerializerMethodField()
    # program_statuses = serializers.SerializerMethodField()

    class Meta:
        model = StudentProfile
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "phone",
            "preferred_counselling_mode",
            "created_at",
            "study_class",
            "current_academic_stage",
            "city",
            "programs",
            # "program_id",
            # "program_name",
            # "package_id",
            # "package_name",
            "price",
            # "aptitude_test", 
            "payment_status",
            "payment_type",
            # "created_at",
            "method",
            "transaction_id",
            "amount",
            "total_paid_amount", 
            "proof_file",
            # "is_report_locked",
            # "report_status",
            # "exam_status",
            # "analysis_status",
            # "slot_status",
            # "full_access",
            # "program_statuses"
        ]
        
    # def get_program_statuses(self, obj):

    #     result = []

    #     payments = (
    #         Payment.objects
    #         .filter(user=obj.user)
    #         .prefetch_related("package__program")
    #         .order_by("-created_at")
    #     )

    #     latest_payment = payments.first()

    #     if not latest_payment:
    #         return []

    #     for package in latest_payment.package.all():

    #         program = package.program

    #         item = {
    #             "program_id": program.id if program else None,
    #             "program_name": program.name if program else None,
    #             "package_id": package.id,
    #             "package_name": package.name,
    #             "aptitude_test": package.aptitude_test,
    #             "engineering_test_analysis": package.engineering_test_analysis,
    #         }

    #         # Report Status
    #         if package.aptitude_test or package.engineering_test_analysis:

    #             report = (
    #                 Report.objects
    #                 .filter(
    #                     user=obj.user,
    #                     program=program   # if report has program FK
    #                 )
    #                 .order_by("-uploaded_at")
    #                 .first()
    #             )

    #             item["report_status"] = (
    #                 report.report_status
    #                 if report else "not_received"
    #             )
    #         else:
    #             item["report_status"] = "not_applicable"

    #         # Exam Status
    #         if package.aptitude_test:

    #             exams = UserExam.objects.filter(
    #                 user=obj.user,
    #                 program=program   # if exam has program FK
    #             )

    #             item["exam_status"] = {
    #                 "completed": exams.filter(status="completed").count(),
    #                 "in_progress": exams.filter(status="in_progress").count(),
    #                 "pending_approval": exams.filter(status="pending_approval").count(),
    #                 "not_started": exams.filter(status="not_started").count(),
    #             }

    #         else:
    #             item["exam_status"] = "not_applicable"

    #         # Analysis Status
    #         if package.engineering_test_analysis:

    #             analysis = (
    #                 CollegeListAnalysis.objects
    #                 .filter(
    #                     user=obj.user,
    #                     program=program   # if analysis has program FK
    #                 )
    #                 .order_by("-created_at")
    #                 .first()
    #             )

    #             item["analysis_status"] = (
    #                 analysis.status
    #                 if analysis else "not_started"
    #             )

    #         else:
    #             item["analysis_status"] = "not_applicable"

    #         result.append(item)

    #     return result
        
    def get_programs(self, obj):
        data = []

        payment = (
            Payment.objects
            .filter(user=obj.user)
            .prefetch_related("package__program")
            .order_by("-created_at")
            .first()
        )

        if not payment:
            return []

        for package in payment.package.all():

            program = package.program

            item = {
                "program_id": program.id,
                "program_name": program.name,
                "package": {
                    "id": package.id,
                    "name": package.name,
                    "price": str(package.price)
                },
                "statuses": {}
            }

            # Report Status
            if package.aptitude_test or package.engineering_test_analysis:

                report = (
                    Report.objects
                    .filter(
                        user=obj.user,
                        program=program,
                        package=package
                    )
                    .order_by("-uploaded_at")
                    .first()
                )

                # Engineering Program
                if package.engineering_test_analysis:

                    if report:

                        all_reports_received = (
                            report.report_status == "v1_received"
                            and report.report_status_v2 == "v2_received"
                            and report.report_status_v3 == "v3_received"
                        )

                        no_report_uploaded = (
                            not report.file_path
                            # and not report.file_path1
                            # and not report.file_path2
                        )

                        if all_reports_received:
                            item["statuses"]["report_status"] = "all_received"
                        elif no_report_uploaded:
                            item["statuses"]["report_status"] = "not_received"
                        else:
                            item["statuses"]["report_status"] = "in_progress"

                        item["statuses"]["report_versions"] = {
                            "v1": report.report_status,
                            "v2": report.report_status_v2,
                            "v3": report.report_status_v3,
                        }

                    else:

                        item["statuses"]["report_status"] = "not_received"

                        item["statuses"]["report_versions"] = {
                            "v1": "v1_not_received",
                            "v2": "v2_not_received",
                            "v3": "v3_not_received",
                        }

                # Aptitude Program
                elif package.aptitude_test:

                    item["statuses"]["report_status"] = (
                        report.report_status
                        if report
                        else "not_received"
                    )

            else:
                item["statuses"]["report_status"] = "not_applicable"

            # Exam Status
            if package.aptitude_test:

                exams = UserExam.objects.filter(user=obj.user, program=program, package=package)

                item["statuses"]["exam_status"] = {
                    "completed": exams.filter(status="completed").count(),
                    "in_progress": exams.filter(status="in_progress").count(),
                    "pending_approval": exams.filter(status="pending_approval").count(),
                    "not_started": exams.filter(status="not_started").count(),
                }
            else:
                item["statuses"]["exam_status"] = "not_applicable"

            # Analysis Status
            if package.engineering_test_analysis:

                analysis = (
                    CollegeListAnalysis.objects
                    .filter(user=obj.user, program=program, package=package)
                    .order_by("-created_at")
                    .first()
                )

                item["statuses"]["analysis_status"] = (
                    analysis.status if analysis else "not_started"
                )
            else:
                item["statuses"]["analysis_status"] = "not_applicable"
            
            # Slot Status    
            booking = (
                Booking.objects
                .filter(
                    student=obj,
                    program=program ,  # if Booking has program FK
                    package=package
                )
                .order_by("-created_at")
                .first()
            )

            item["statuses"]["slot_status"] = (
                booking.status if booking else "not_booked"
            )
            
            # Full Access Program Wise
            if booking:
                item["statuses"]["full_access"] = "Counselling Slot Booking"

            elif package.engineering_test_analysis:

                report = (
                    Report.objects.filter(
                        user=obj.user,
                        program=program,
                        package=package
                    )
                    .order_by("-uploaded_at")
                    .first()
                )

                if report:

                    all_reports_received = (
                        report.report_status == "v1_received"
                        and report.report_status_v2 == "v2_received"
                        and report.report_status_v3 == "v3_received"
                    )

                    if all_reports_received:
                        item["statuses"]["full_access"] = "Report"
                    else:
                        item["statuses"]["full_access"] = "Analysis"

                else:

                    analysis = (
                        CollegeListAnalysis.objects
                        .filter(user=obj.user, program=program, package=package)
                        .order_by("-created_at")
                        .first()
                    )

                    if analysis:
                        item["statuses"]["full_access"] = "Analysis"
                    else:
                        item["statuses"]["full_access"] = "Payment"

            elif package.aptitude_test:

                report = (
                    Report.objects.filter(
                        user=obj.user,
                        program=program,
                        package=package
                    )
                    .order_by("-uploaded_at")
                    .first()
                )

                if report:
                    item["statuses"]["full_access"] = "Report"

                else:
                    exam_exists = UserExam.objects.filter(
                        user=obj.user,
                        program=program,
                        package=package
                    ).exists()

                    if exam_exists:
                        item["statuses"]["full_access"] = "Exam"
                    else:
                        item["statuses"]["full_access"] = "Payment"

            else:
                item["statuses"]["full_access"] = "Payment"

            data.append(item)

        return data


  
    def get_aptitude_test(self, obj):
        upp = (
            UserProgramPackage.objects
            .filter(user=obj.user)
            .select_related("package")
            .last()
        )

        if not upp or not upp.package:
            return False

        return upp.package.aptitude_test
        
    def get_preferred_counselling_mode(self, obj):
        return obj.preferred_counselling_mode if obj.preferred_counselling_mode else "Not Specified"

    def get_student_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"

    def get_program_id(self, obj):
        upp = UserProgramPackage.objects.filter(user=obj.user).last()
        return upp.program.id if upp and upp.program else None

    def get_program_name(self, obj):
        upp = UserProgramPackage.objects.filter(user=obj.user).last()
        return upp.program.name if upp and upp.program else None

    def get_package_id(self, obj):
        upp = UserProgramPackage.objects.filter(user=obj.user).last()
        return upp.package.id if upp and upp.package else None

    def get_package_name(self, obj):
        upp = UserProgramPackage.objects.filter(user=obj.user).last()
        return upp.package.name if upp and upp.package else None
    
    def get_price(self, obj):
        payment = (
            Payment.objects
            .filter(user=obj.user)
            .prefetch_related("package")
            .order_by("-created_at")
            .first()
        )

        if not payment:
            return 0

        return sum(
            float(pkg.price or 0)
            for pkg in payment.package.all()
        )


    def get_payment_status(self, obj):
        upp = (
            UserProgramPackage.objects
            .filter(user=obj.user)
            .select_related("package")
            .last()
        )

        if not upp or not upp.package:
            return "not_paid"

        package_price = upp.package.price or 0

        # 🔥 Sum ALL payments (previous + current)
        total_paid = (
            Payment.objects
            .filter(user=obj.user)
            .aggregate(total=Sum("amount"))["total"]
            or 0
        )

        if total_paid == 0:
            return "not_paid"
        elif total_paid < package_price:
            return "partial_paid"
        else:
            return "fully_paid"
    
    def get_payment_type(self, obj):
        payment = Payment.objects.filter(user=obj.user).order_by("-created_at").first()
        return payment.payment_type if payment else None
    
    # def get_created_at(self, obj):
    #     payment = Payment.objects.filter(user=obj.user).order_by("-created_at").first()
    #     return payment.created_at if payment else None
    
    def get_method(self, obj):
        payment = Payment.objects.filter(user=obj.user).order_by("-created_at").first()
        return payment.method if payment else None
    
    def get_transaction_id(self, obj):
        payment = Payment.objects.filter(user=obj.user).order_by("-created_at").first()
        return payment.transaction_id if payment else None
    
    def get_amount(self, obj):
        payment = Payment.objects.filter(user=obj.user).order_by("-created_at").first()
        return payment.amount if payment else None
    
    def get_total_paid_amount(self, obj):
        total = (
            Payment.objects
            .filter(user=obj.user)
            .aggregate(total=Sum("amount"))["total"]
        )
        return total or 0
    
    def get_proof_file(self, obj):
        payment = (
            Payment.objects
            .filter(user=obj.user)
            .order_by("-created_at")
            .first()
        )

        if not payment or not payment.proof_file:
            return None

        request = self.context.get("request")
        if not request:
            return None

        # 🔥 Return iframe-safe API URL
        url = reverse(
            "payment-report-image",
            kwargs={"payment_id": payment.id}
        )
        return request.build_absolute_uri(url)
    
    # def get_report_status(self, obj):
    #     report = Report.objects.filter(user=obj.user).order_by("-uploaded_at").first()
    #     return report.report_status if report else "not_uploaded"       #locked, unlocked 
    
    # def get_report_status(self, obj):
    #     upp = (
    #         UserProgramPackage.objects
    #         .filter(user=obj.user)
    #         .select_related("package")
    #         .last()
    #     )

    #     # ❌ If no package OR aptitude_test False
    #     if not upp or not upp.package or not upp.package.aptitude_test:
    #         return "not_applicable"

    #     # ✅ If aptitude_test True → return actual report status
    #     report = (
    #         Report.objects
    #         .filter(user=obj.user)
    #         .order_by("-uploaded_at")
    #         .first()
    #     )

    #     return report.report_status if report else "not_received"
    
    def get_report_status(self, obj):

        upp = (
            UserProgramPackage.objects
            .filter(user=obj.user)
            .select_related("package")
            .order_by("-created_at")
            .first()
        )

        # ❌ No package
        if not upp or not upp.package:
            return "not_applicable"

        package = upp.package

        aptitude_test_status = package.aptitude_test
        engineering_analysis_status = package.engineering_test_analysis

        # ❌ BOTH FALSE → NOT APPLICABLE
        if not aptitude_test_status and not engineering_analysis_status:
            return "not_applicable"

        # ✅ FETCH REPORT
        report = (
            Report.objects
            .filter(user=obj.user)
            .order_by("-uploaded_at")
            .first()
        )

        # ❌ NOT UPLOADED
        if not report:
            return "not_received"

        # ✅ RETURN ACTUAL STATUS
        return report.report_status

    # def get_exam_status(self, obj):
    #     qs = UserExam.objects.filter(user=obj.user)

    #     return {
    #         "completed": qs.filter(status="completed").count(),
    #         "in_progress": qs.filter(status="in_progress").count(),
    #         "pending_approval": qs.filter(status="pending_approval").count(),
    #         "not_started": qs.filter(status="not_started").count(),
    #     }
    def get_exam_status(self, obj):
        upp = (
            UserProgramPackage.objects
            .filter(user=obj.user)
            .select_related("package")
            .last()
        )

        # ❌ If no package OR aptitude_test False
        if not upp or not upp.package or not upp.package.aptitude_test:
            return {
                "completed": "not_applicable",
                "in_progress": "not_applicable",
                "pending_approval": "not_applicable",
                "not_started": "not_applicable",
            }

        # ✅ If aptitude_test True → return actual counts
        qs = UserExam.objects.filter(user=obj.user)

        return {
            "completed": qs.filter(status="completed").count(),
            "in_progress": qs.filter(status="in_progress").count(),
            "pending_approval": qs.filter(status="pending_approval").count(),
            "not_started": qs.filter(status="not_started").count(),
        }
    
    def get_analysis_status(self, obj):
        upp = (
            UserProgramPackage.objects
            .filter(user=obj.user)
            .select_related("package")
            .last()
        )

        # ❌ Not applicable
        if not upp or not upp.package or not upp.package.engineering_test_analysis:
            return "not_applicable"

        # ✅ Fetch from CollegeListAnalysis
        analysis = (
            CollegeListAnalysis.objects
            .filter(user=obj.user)
            .order_by("-created_at")
            .first()
        )

        if not analysis:
            return "not_started"

        return analysis.status
        
    # def get_slot_status(self, obj):
    #     booking = (
    #         Booking.objects
    #         .filter(student=obj)
    #         .order_by("-created_at")
    #         .first()
    #     )

    #     return booking.status if booking else "not_booked"
    
    def get_slot_status(self, obj):
        booking = (
            Booking.objects
            .filter(student=obj)
            .first()   # fetch last DB row
        )

        if not booking:
            return "not_booked"

        return booking.status
        
        
    def get_full_access(self, obj):
        # Check booking
        booking = Booking.objects.filter(student=obj).exists()

        # Check review (currently hardcoded False like journey API)
        review_status = False  # update when review model exists

        # Step priority (same as journey current_step logic)
        if review_status:
            return "Review"

        if booking:
            return "Counselling Slot Booking"

        # Check report
        upp = UserProgramPackage.objects.filter(user=obj.user).last()
        
        if upp and upp.package and upp.package.aptitude_test:
            report = Report.objects.filter(user=obj.user).order_by("-uploaded_at").first()
            if report:
                return "Report"

            exam = UserExam.objects.filter(user=obj.user).exists()
            if exam:
                return "Exam"

        # Payment
        payment = Payment.objects.filter(user=obj.user).exists()
        if payment:
            return "Payment"

        # Counselling service
        if upp:
            return "Counselling Service Selection"

        return "Registration"


class HandholdingUsersListSerializer(serializers.ModelSerializer):
    first_name = serializers.SerializerMethodField()
    last_name = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()  
    created_at = serializers.DateTimeField(read_only=True)
    program_id = serializers.SerializerMethodField()
    program_name = serializers.SerializerMethodField()
    package_id = serializers.SerializerMethodField()
    package_name = serializers.SerializerMethodField()
    price = serializers.SerializerMethodField()
    payment_status = serializers.SerializerMethodField()
    payment_type = serializers.SerializerMethodField()
    # created_at = serializers.DateTimeField()
    method = serializers.SerializerMethodField()
    preferred_counselling_mode = serializers.SerializerMethodField()
    transaction_id = serializers.SerializerMethodField()
    amount = serializers.SerializerMethodField()
    total_paid_amount = serializers.SerializerMethodField()
    proof_file = serializers.SerializerMethodField()
    next_not_booked_session_no = serializers.IntegerField(read_only=True)
    # is_report_locked = serializers.SerializerMethodField()
    

    class Meta:
        model = HandHoldingParticipant   
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "phone",
            "created_at",
            "city",           
            "program_id",
            "program_name",
            "package_id",
            "package_name",
            "price",
            "payment_status",
            "payment_type",
            # "created_at",
            "method",
            "preferred_counselling_mode",
            "transaction_id",
            "amount",
            "total_paid_amount", 
            "proof_file",
            "next_not_booked_session_no",
            # "is_report_locked",
            
        ]
    def get_preferred_counselling_mode(self, obj):
        return obj.preferred_counselling_mode
    
    def get_first_name(self, obj):
        return obj.user.first_name if obj.user else None

    def get_last_name(self, obj):
        return obj.user.last_name if obj.user else None

    def get_email(self, obj):
        return obj.user.email if obj.user else obj.email

    def get_phone(self, obj):
        return obj.user.phone if obj.user else None
    

    def get_student_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"

    def get_program_id(self, obj):
        upp = UserProgramPackage.objects.filter(user=obj.user).last()
        return upp.program.id if upp and upp.program else None

    def get_program_name(self, obj):
        upp = UserProgramPackage.objects.filter(user=obj.user).last()
        return upp.program.name if upp and upp.program else None

    def get_package_id(self, obj):
        upp = UserProgramPackage.objects.filter(user=obj.user).last()
        return upp.package.id if upp and upp.package else None

    def get_package_name(self, obj):
        upp = UserProgramPackage.objects.filter(user=obj.user).last()
        return upp.package.name if upp and upp.package else None
    
    def get_price(self, obj):
        upp = UserProgramPackage.objects.filter(user=obj.user).last()
        return upp.package.price if upp and upp.package else None


    def get_payment_status(self, obj):
        upp = (
            UserProgramPackage.objects
            .filter(user=obj.user)
            .select_related("package")
            .last()
        )

        if not upp or not upp.package:
            return "not_paid"

        package_price = upp.package.price or 0

        # 🔥 Sum ALL payments (previous + current)
        total_paid = (
            Payment.objects
            .filter(user=obj.user)
            .aggregate(total=Sum("amount"))["total"]
            or 0
        )

        if total_paid == 0:
            return "not_paid"
        elif total_paid < package_price:
            return "partial_paid"
        else:
            return "fully_paid"
    
    def get_payment_type(self, obj):
        payment = Payment.objects.filter(user=obj.user).order_by("-created_at").first()
        return payment.payment_type if payment else None
    
    # def get_created_at(self, obj):
    #     payment = Payment.objects.filter(user=obj.user).order_by("-created_at").first()
    #     return payment.created_at if payment else None
    
    def get_method(self, obj):
        payment = Payment.objects.filter(user=obj.user).order_by("-created_at").first()
        return payment.method if payment else None
    
    def get_transaction_id(self, obj):
        payment = Payment.objects.filter(user=obj.user).order_by("-created_at").first()
        return payment.transaction_id if payment else None
    
    def get_amount(self, obj):
        payment = Payment.objects.filter(user=obj.user).order_by("-created_at").first()
        return payment.amount if payment else None
    
    def get_total_paid_amount(self, obj):
        total = (
            Payment.objects
            .filter(user=obj.user)
            .aggregate(total=Sum("amount"))["total"]
        )
        return total or 0
    
    def get_proof_file(self, obj):
        payment = (
            Payment.objects
            .filter(user=obj.user)
            .order_by("-created_at")
            .first()
        )

        if not payment or not payment.proof_file:
            return None

        request = self.context.get("request")
        if not request:
            return None

        # 🔥 Return iframe-safe API URL
        url = reverse(
            "payment-report-image",
            kwargs={"payment_id": payment.id}
        )
        return request.build_absolute_uri(url)
    
    # def get_report_status(self, obj):
    #     report = Report.objects.filter(user=obj.user).order_by("-uploaded_at").first()
    #     return report.report_status if report else "not_uploaded"       #locked, unlocked 
    
    