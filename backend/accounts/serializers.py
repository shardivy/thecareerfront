from rest_framework import serializers

from accounts.models import Permission, Role, RolePermission, User
from exam.models import UserExam
from lead_registration.models import StudentProfile
from payment.models import Payment
from program_package.models import PackageExam, UserProgramPackage
from report.models import Report
from django.urls import reverse

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
#     profile = serializers.SerializerMethodField()
#     program_package = serializers.SerializerMethodField()
#     payment_status = serializers.SerializerMethodField()
#     exam_status = serializers.SerializerMethodField()
#     sessions = serializers.SerializerMethodField()

#     class Meta:
#         model = User
#         fields = [
#             "id",
#             "first_name",
#             "last_name",
#             "email",
#             "phone",
#             "profile",
#             "program_package",
#             "exam_status",
#             "payment_status",
#             "sessions",
#         ]

#     def get_profile(self, obj):
#         profile = StudentProfile.objects.filter(user=obj).first()
#         return StudentProfileSerializer(profile).data if profile else None

#     def get_program_package(self, obj):
#         upp = UserProgramPackage.objects.filter(user=obj).first()
#         return UserProgramPackageSerializer(upp).data if upp else None

#     def get_exam_status(self, obj):
#         upp = UserProgramPackage.objects.filter(user=obj).first()
#         if not upp:
#             return []

#         package_exams = PackageExam.objects.filter(package=upp.package)

#         exam_status_list = []

#         for pe in package_exams:
#             user_exam = UserExam.objects.filter(
#                 user=obj,
#                 exam=pe.exam
#             ).first()

#             exam_status_list.append({
#                 "exam_name": pe.exam.name,
#                 "is_mandatory": pe.is_mandatory,
#                 "sequence_order": pe.sequence_order,
#                 "status": user_exam.status if user_exam else "not_started",
#                 "completed_at": user_exam.completed_at if user_exam else None
#             })

#         return exam_status_list


#     def get_payment_status(self, obj):
#         upp = UserProgramPackage.objects.filter(user=obj).first()
#         if not upp:
#             return None

#         payment = (
#             Payment.objects
#             .filter(user=obj, package=upp.package)
#             .order_by("-created_at")
#             .first()
#         )

#         if not payment:
#             return None

#         return payment.status


#     def get_sessions(self, obj):
#         # placeholder – map with Session / Booking model later
#         return []


class StudentListSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source="user.first_name")
    last_name = serializers.CharField(source="user.last_name")
    email = serializers.EmailField(source="user.email")
    phone = serializers.CharField(source="user.phone")
    program_id = serializers.SerializerMethodField()
    program_name = serializers.SerializerMethodField()
    package_id = serializers.SerializerMethodField()
    package_name = serializers.SerializerMethodField()
    payment_status = serializers.SerializerMethodField()
    payment_type = serializers.SerializerMethodField()
    method = serializers.SerializerMethodField()
    transaction_id = serializers.SerializerMethodField()
    amount = serializers.SerializerMethodField()
    proof_file = serializers.SerializerMethodField()
    is_report_locked = serializers.SerializerMethodField()
    exam_status = serializers.SerializerMethodField()

    class Meta:
        model = StudentProfile
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "phone",
            "study_class",
            "current_academic_stage",
            "city",
            "program_id",
            "program_name",
            "package_id",
            "package_name",
            "payment_status",
            "payment_type",
            "method",
            "transaction_id",
            "amount",
            "proof_file",
            "is_report_locked",
            "exam_status",
        ]

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


    def get_payment_status(self, obj):
        payment = Payment.objects.filter(user=obj.user).order_by("-created_at").first()
        return payment.status if payment else "pending"
    
    def get_payment_type(self, obj):
        payment = Payment.objects.filter(user=obj.user).order_by("-created_at").first()
        return payment.payment_type if payment else None
    
    def get_method(self, obj):
        payment = Payment.objects.filter(user=obj.user).order_by("-created_at").first()
        return payment.method if payment else None
    
    def get_transaction_id(self, obj):
        payment = Payment.objects.filter(user=obj.user).order_by("-created_at").first()
        return payment.transaction_id if payment else None
    
    def get_amount(self, obj):
        payment = Payment.objects.filter(user=obj.user).order_by("-created_at").first()
        return payment.amount if payment else None
    
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



    def get_is_report_locked(self, obj):
        return Report.objects.filter(
            user=obj.user,
            report_status="locked"
        ).exists()

    def get_exam_status(self, obj):
        qs = UserExam.objects.filter(user=obj.user)

        return {
            "completed": qs.filter(status="completed").count(),
            "in_progress": qs.filter(status="in_progress").count(),
            "pending_approval": qs.filter(status="pending_approval").count(),
            "not_started": qs.filter(status="not_started").count(),
        }
