from rest_framework import serializers

from accounts.models import User
from exam.models import CareerFuturaTest, Exam, UserExam
from program_package.models import Package, PackageExam, Program, UserProgramPackage


# ---- Exam Serializer ----
class ExamCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Exam
        fields = ("id", "name", "provider", "instructions", "exam_link", "is_active", "created_at")
    
# ---- Minimal User Serializer ----    
class UserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "first_name", "last_name", "email")
   
# ---- UserExam Serializer (nested details) ----     
class UserExamCreateSerializer(serializers.ModelSerializer):
    user = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), write_only=True)
    exam = serializers.PrimaryKeyRelatedField(queryset=Exam.objects.all(), write_only=True)

    user_detail = UserMiniSerializer(source="user", read_only=True)
    exam_detail = ExamCreateSerializer(source="exam", read_only=True)

    class Meta:
        model = UserExam
        fields = (
            "id",
            "user",
            "exam",
            "status",
            "user_detail",
            "exam_detail",
        )

    def validate(self, data):
        if UserExam.objects.filter(
            user=data["user"], exam=data["exam"]
        ).exists():
            raise serializers.ValidationError(
                "Exam already assigned to this user"
            )
        return data
    
# ---- Serializer for Starting an Exam ----
class StartExamSerializer(serializers.Serializer):
    exam_id = serializers.IntegerField()


# ---- Serializer for Submitting an Exam ----
class SubmitExamSerializer(serializers.Serializer):
    exam_id = serializers.IntegerField()
    completed_at = serializers.DateTimeField(required=False)


# ---- Serializer for Approving an Exam ----
class ApproveExamSerializer(serializers.Serializer):
    approved_by_id = serializers.IntegerField()


# ---- Serializer for Overriding Exam Status ----
class OverrideExamSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=UserExam.STATUS_CHOICES)
    
#---- Serializer for PackageExam Creation with Exam Details ----
class PackageExamCreateSerializer(serializers.Serializer):
    program = serializers.PrimaryKeyRelatedField(
        queryset=Program.objects.all()
    )
    package = serializers.PrimaryKeyRelatedField(
        queryset=Package.objects.all()
    )

    # 👇 EXAM DATA (NOT FK)
    exam_name = serializers.CharField(max_length=150)
    provider = serializers.CharField(required=False, allow_blank=True)
    exam_link = serializers.URLField(required=False, allow_null=True)
    instructions = serializers.CharField(required=False, allow_blank=True)
    is_active = serializers.BooleanField(default=True)

    is_mandatory = serializers.BooleanField(default=False)
    sequence_order = serializers.IntegerField(required=False, allow_null=True)

    def validate(self, attrs):
        package = attrs["package"]
        program = attrs["program"]

        if hasattr(package, "program") and package.program != program:
            raise serializers.ValidationError(
                "Selected package does not belong to this program."
            )

        return attrs

    def create(self, validated_data):
        # ─── Create Exam ─────────────────────────────
        exam = Exam.objects.create(
            name=validated_data.pop("exam_name"),
            provider=validated_data.pop("provider", None),
            exam_link=validated_data.pop("exam_link", None),
            instructions=validated_data.pop("instructions", None),
            is_active=validated_data.pop("is_active", True),
        )

        # ─── Create PackageExam ──────────────────────
        package_exam = PackageExam.objects.create(
            exam=exam,
            package=validated_data["package"],
            is_mandatory=validated_data.get("is_mandatory", False),
            sequence_order=validated_data.get("sequence_order"),
        )

        return package_exam
   
#---- Serializer for PackageExam Response ---- 
class PackageExamResponseSerializer(serializers.ModelSerializer):
    exam_name = serializers.CharField(source="exam.name", read_only=True)
    exam_link = serializers.CharField(source="exam.exam_link", read_only=True)
    instructions = serializers.CharField(source="exam.instructions", read_only=True)
    # is_mandatory = serializers.BooleanField(read_only=True)
    is_active = serializers.BooleanField(source="exam.is_active", read_only=True)

    package_id = serializers.IntegerField(source="package.id", read_only=True)
    package = serializers.CharField(source="package.name", read_only=True)
    program_id = serializers.IntegerField(source="package.program.id", read_only=True)
    program = serializers.CharField(source="package.program.name", read_only=True)

    class Meta:
        model = PackageExam
        fields = (
            "id",
            "program_id",
            "program",
            "package_id",
            "package",
            "exam_name",
            "exam_link",
            "is_active",
            "instructions",
            "is_mandatory",
            "sequence_order",
            "created_at",
        )

#---- Serializer for PackageExam Update ----
class PackageExamUpdateSerializer(serializers.Serializer):
    exam_name = serializers.CharField(required=False)
    provider = serializers.CharField(required=False, allow_blank=True)
    exam_link = serializers.URLField(required=False, allow_null=True)
    instructions = serializers.CharField(required=False, allow_blank=True)
    is_active = serializers.BooleanField(required=False)

    is_mandatory = serializers.BooleanField(required=False)
    sequence_order = serializers.IntegerField(required=False, allow_null=True)

    def update(self, instance, validated_data):
        # Update exam
        exam = instance.exam
        for field in ["exam_name", "provider", "exam_link", "instructions", "is_active"]:
            if field in validated_data:
                setattr(
                    exam,
                    "name" if field == "exam_name" else field,
                    validated_data[field]
                )
        exam.save()

        # Update PackageExam
        for field in ["is_mandatory", "sequence_order"]:
            if field in validated_data:
                setattr(instance, field, validated_data[field])

        instance.save()
        return instance
   
   #--- Serializer for UserExam List with User and Program Details ---- 
class UserExamListSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)

    program_id = serializers.SerializerMethodField()
    program = serializers.SerializerMethodField()
    package_id = serializers.SerializerMethodField()
    package = serializers.SerializerMethodField()
    
    approved_by = serializers.SerializerMethodField()
    approved_by_role = serializers.SerializerMethodField()

    class Meta:
        model = UserExam
        fields = (
            "id",
            "first_name",
            "last_name",
            "email",
            "program_id",
            "program",
            "package_id",
            "package",
            "status",
            "completed_at",
            "approved_by",
            "approved_by_role",
        )
    
    # def get_user_program_package(self, obj):
    #     return UserProgramPackage.objects.filter(user=obj.user).select_related(
    #         "program", "package"
    #     ).first()
    def get_user_program_package(self, obj):
        if not hasattr(obj, "_upp_cache"):
            obj._upp_cache = (
                UserProgramPackage.objects
                .filter(
                    user=obj.user,
                    package__aptitude_test=True
                )
                .select_related("program", "package")
                .first()
            )

        return obj._upp_cache

    # def get_program_id(self, obj):
    #     upp = self.get_user_program_package(obj)
    #     return upp.program.id if upp and upp.program else None

    # def get_program(self, obj):
    #     upp = self.get_user_program_package(obj)
    #     return upp.program.name if upp and upp.program else None

    # def get_package_id(self, obj):
    #     upp = self.get_user_program_package(obj)
    #     return upp.package.id if upp and upp.package else None

    # def get_package(self, obj):
    #     upp = self.get_user_program_package(obj)
    #     return upp.package.name if upp and upp.package else None
    
    def get_program_id(self, obj):
        return obj.program.id if obj.program else None
   
    def get_program(self, obj):
        return obj.program.name if obj.program else None
   
    def get_package_id(self, obj):
        return obj.package.id if obj.package else None
   
    def get_package(self, obj):
        return obj.package.name if obj.package else None 
    
    
    

    def get_approved_by(self, obj):
        if obj.approved_by:
            return f"{obj.approved_by.first_name} {obj.approved_by.last_name}"
        return None

    def get_approved_by_role(self, obj):
        if obj.approved_by and obj.approved_by.role:
            return obj.approved_by.role.name
        return None

#---- Serializer for UserExam Approval Response ----
class UserExamApproveResponseSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    exam_name = serializers.SerializerMethodField()
    approved_by = serializers.SerializerMethodField()
    approved_by_role = serializers.SerializerMethodField()

    class Meta:
        model = UserExam
        fields = (
            "id",
            "student_name",
            "exam_name",
            "status",
            "description",
            "completed_at",
            "approved_by",
            "approved_by_role",
        )

    def get_student_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}"

    def get_exam_name(self, obj):
        return obj.exam.name if obj.exam else None

    def get_approved_by(self, obj):
        if obj.approved_by:
            return f"{obj.approved_by.first_name} {obj.approved_by.last_name}"
        return None

    def get_approved_by_role(self, obj):
        if obj.approved_by and obj.approved_by.role:
            return obj.approved_by.role.name
        return None
    
class SaveCareerFuturaDetailsSerializer(serializers.Serializer):
    first_name = serializers.CharField(max_length=100)
    last_name = serializers.CharField(
        max_length=100,
        required=False,
        allow_blank=True
    )

    email = serializers.EmailField()
    phone = serializers.CharField(max_length=15)

    password = serializers.CharField(
        write_only=True,
        min_length=6
    )

    confirm_password = serializers.CharField(
        write_only=True,
        min_length=6
    )

    study_class = serializers.CharField(max_length=20)
    qualification_status = serializers.CharField(max_length=100)
    type = serializers.CharField(max_length=100)

    def validate(self, attrs):

        # Check password
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({
                "confirm_password": "Password and Confirm Password do not match."
            })

        # Check email uniqueness
        if CareerFuturaTest.objects.filter(email=attrs["email"]).exists():
            raise serializers.ValidationError({
                "email": "This email is already registered."
            })

        # Check phone uniqueness
        if CareerFuturaTest.objects.filter(phone=attrs["phone"]).exists():
            raise serializers.ValidationError({
                "phone": "This phone number is already registered."
            })

        return attrs
    