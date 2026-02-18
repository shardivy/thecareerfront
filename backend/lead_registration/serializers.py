from decimal import Decimal

from rest_framework import serializers

from accounts.models import User
from lead_registration.models import Hobby, Lead, Stream, StudentAcademicHistory, StudentHobby, StudentProfile, StudentStream, StudentSubjectPreference, Subject
from program_package.models import Package, Program, UserProgramPackage
from program_package.serializers import PackageSerializer, ProgramSerializer
from payment.models import Payment  


class LeadPackageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Package
        fields = (
            "id",
            "name",
            "price",
            "description",
            "is_active",
            "created_at",
        )


class LeadSerializer(serializers.ModelSerializer):
    program_detail = ProgramSerializer(source='program', read_only=True)
    package_detail = serializers.SerializerMethodField()
    
    class Meta:
        model = Lead
        fields = (
            'id',
            'first_name',
            'last_name',
            'phone',
            'email',
            'program',
            'program_detail',
            'package_detail',
            'source',
            'status',
            'date',
        )
        read_only_fields = ('status',) 
        
    def get_package_detail(self, obj):
        try:
            user = User.objects.filter(email=obj.email).first()
            if not user:
                return None

            upp = UserProgramPackage.objects.filter(user=user).select_related('package').first()
            if not upp:
                return None

            return LeadPackageSerializer(upp.package).data


        except Exception:
            return None

    def validate_phone(self, value):
        if value and not value.isdigit():
            raise serializers.ValidationError("Phone number must contain only digits.")
        return value

    def validate_email(self, value):
        lead_id = self.instance.id if self.instance else None

        if Lead.objects.exclude(id=lead_id).filter(email=value).exists():
            raise serializers.ValidationError(
                "Enquiry with this email already exists."
            )

        return value
    

class AddUserSerializer(serializers.Serializer):
    # -------------------------
    # User fields
    # -------------------------
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField()
    phone = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(required=False, write_only=True)


    # -------------------------
    # StudentProfile fields
    # -------------------------
    study_class = serializers.CharField(required=False, allow_blank=True)
    current_academic_stage = serializers.CharField(required=False, allow_blank=True)
    current_academic_year = serializers.CharField(required=False, allow_blank=True)
    school_college = serializers.CharField(required=False, allow_blank=True)
    city = serializers.CharField(required=False, allow_blank=True)
    preferred_counselling_mode = serializers.CharField(required=False, allow_blank=True)

    # -------------------------
    # Program & Package
    # -------------------------
    program = serializers.PrimaryKeyRelatedField(queryset=Program.objects.all())
    package = serializers.PrimaryKeyRelatedField(queryset=Package.objects.all())

    # -------------------------
    # Payment (optional)
    # -------------------------
    amount = serializers.DecimalField(
        max_digits=20, decimal_places=2, required=False, allow_null=True
    )
    payment_type = serializers.ChoiceField(
        choices=Payment.PAYMENTTYPE_CHOICE, required=False
    )
    transaction_id = serializers.CharField(
        required=False, allow_blank=True, allow_null=True
    )
    method = serializers.CharField(required=False, allow_blank=True)
    proof_file = serializers.FileField(required=False, allow_null=True)

    # -------------------------
    # Email Validation
    # -------------------------
    def validate_email(self, value):
        user_id = self.context.get("user_id")

        qs = User.objects.filter(email=value)
        if user_id:
            qs = qs.exclude(id=user_id)

        if qs.exists():
            raise serializers.ValidationError("Email already exists.")

        return value

    # -------------------------
    # Phone Validation
    # -------------------------
    def validate_phone(self, value):
        user_id = self.context.get("user_id")

        qs = User.objects.filter(phone=value)
        if user_id:
            qs = qs.exclude(id=user_id)

        if qs.exists():
            raise serializers.ValidationError("Phone number already exists.")

        return value

    # -------------------------
    # Cross-field Validation
    # -------------------------
    def validate(self, attrs):
        package = attrs.get("package")
        program = attrs.get("program")
        amount = attrs.get("amount")
        payment_type = attrs.get("payment_type")

        # ✅ Ensure package belongs to program (recommended)
        if package and program:
            if package.program != program:
                raise serializers.ValidationError(
                    {"package": "Selected package does not belong to the selected program."}
                )

        # ✅ Validate payment rules
        if amount is not None:

            package_price = package.price


            # ❌ Minimum amount check
            if amount < Decimal("500"):
                raise serializers.ValidationError(
                    {"amount": "Minimum payment amount must be ₹500."}
                )

            # ❌ Exceeding package amount
            if amount > package_price:
                raise serializers.ValidationError(
                    {"amount": f"Amount cannot exceed package price ₹{package_price}."}
                )

            # ❌ Payment type required if amount provided
            if not payment_type:
                raise serializers.ValidationError(
                    {"payment_type": "Payment type is required when amount is provided."}
                )

        return attrs



class UserProgramPackageResponseSerializer(serializers.ModelSerializer):
    program = ProgramSerializer(read_only=True)
    package = PackageSerializer(read_only=True)

    class Meta:
        model = UserProgramPackage
        fields = ['program', 'package']
        
class StudentAcademicHistorySerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentAcademicHistory
        fields = (
            'id',
            'academic_stage',
            'start_year',
            'end_year',
            'is_current',
            'created_at',
            'updated_at',
        )
        
class StreamSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stream
        fields = ("id", "name")

class StudentStreamSerializer(serializers.ModelSerializer):
    stream_detail = StreamSerializer(source="stream", read_only=True)

    class Meta:
        model = StudentStream
        fields = ("id", "stream", "stream_detail", "created_at")
        read_only_fields = ("created_at",)
        
class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ("id", "name")

class StudentSubjectPreferenceSerializer(serializers.ModelSerializer):
    subject_detail = SubjectSerializer(source="subject", read_only=True)

    class Meta:
        model = StudentSubjectPreference
        fields = (
            "id",
            "subject",
            "subject_detail",
            "preference_type",
            "created_at",
        )
        
class HobbySerializer(serializers.ModelSerializer):
    class Meta:
        model = Hobby
        fields = ("id", "name")
        
class StudentHobbySerializer(serializers.ModelSerializer):
    hobby_detail = HobbySerializer(source="hobby", read_only=True)

    class Meta:
        model = StudentHobby
        fields = (
            "id",
            "hobby",
            "hobby_detail",
            "created_at",
        )
        

class UserDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "phone",
            "is_active"
        ]

class StudentProfileDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProfile
        fields = "__all__"
class ProgramMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Program
        fields = ["id", "name"]
class PackageMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Package
        fields = ["id", "name", "price"]
class UserProgramPackageDetailSerializer(serializers.ModelSerializer):
    program = ProgramMiniSerializer()
    package = PackageMiniSerializer()

    class Meta:
        model = UserProgramPackage
        fields = "__all__"
        
class PaymentDetailSerializer(serializers.ModelSerializer):
    proof_file = serializers.SerializerMethodField()
    payment_date = serializers.SerializerMethodField()

    class Meta:
        model = Payment
        fields = [
            "id",
            "amount",
            "payment_type",
            "method",
            "transaction_id",
            "status",
            "payment_date", 
            "proof_file",
            "created_at"
        ]

    def get_proof_file(self, obj):
        request = self.context.get("request")
        if obj.proof_file and request:
            return request.build_absolute_uri(obj.proof_file.url)
        return None
    
    def get_payment_date(self, obj):
        """
        First payment → show created_at
        Other payments → show date field
        """
        request = self.context.get("request")
        payments = self.context.get("payments")

        if not payments:
            return obj.created_at

        # Get first payment (latest because ordered by -created_at)
        first_payment = payments.first()

        if obj.id == first_payment.id:
            return obj.created_at
        else:
            return obj.payment_date   # 👈 your Payment model date field


# ============================ Student Registration form serializers below =========================

class StudentRegistrationSerializer(serializers.Serializer):
    # =========================
    # 👨‍🎓 Student
    # =========================
    student_name = serializers.CharField(required=True)
    dob = serializers.DateField(required=True)
    student_email = serializers.EmailField(required=True)
    student_mobile = serializers.CharField(required=True)
    study_class = serializers.CharField(required=True)
    stream_id = serializers.IntegerField(required=False, allow_null=True)

    # =========================
    # 👨‍👩 Parent
    # =========================
    parent_mobile = serializers.CharField(required=True)
    parent_email = serializers.EmailField(required=True)

    # =========================
    # 🔐 Auth
    # =========================
    password = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, attrs):

        # 🔐 Password match check
        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({
                "password": "Passwords do not match"
            })

        # =========================
        # 👨‍🎓 Student must be unique
        # =========================
        if User.objects.filter(email=attrs["student_email"]).exists():
            raise serializers.ValidationError({
                "student_email": "Student email already exists"
            })

        if User.objects.filter(phone=attrs["student_mobile"]).exists():
            raise serializers.ValidationError({
                "student_mobile": "Student mobile already exists"
            })

        # =========================
        # 👨‍👩 Parent can already exist
        # DO NOT validate uniqueness here
        # =========================

        # 🎓 Stream validation
        stream_id = attrs.get("stream_id")
        if stream_id and not Stream.objects.filter(id=stream_id).exists():
            raise serializers.ValidationError({
                "stream_id": "Invalid stream selected"
            })

        return attrs

    
class ParentDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "first_name", "last_name", "email", "phone")


