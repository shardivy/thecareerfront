from rest_framework import serializers

from payment.models import Payment
from report.models import Report
from lead_registration.models import Stream, StudentProfile
from program_package.models import Answer, CollegeListAnalysis, LandingPage, Package, PackageFeature, Program, QuestionAnswer, UserProgramPackage


class ProgramListSerializer(serializers.ModelSerializer):
    enrolled_users = serializers.IntegerField(read_only=True)

    class Meta:
        model = Program
        fields = [
            "id",
            "name",
            "description",
            "duration",
            "session",
            "is_active",
            "enrolled_users",
        ]

class ProgramSerializer(serializers.ModelSerializer):
    class Meta:
        model = Program
        fields = [
            "id",
            "name",
            "description",
            "duration",
            "session",
            "is_active",
            "created_at",
        ]
        read_only_fields = ["id", "created_at"]
        
class PackageSerializer(serializers.ModelSerializer):
    program = serializers.PrimaryKeyRelatedField(
        queryset=Program.objects.all(), write_only=True
    )
    program_details = ProgramSerializer(
        source='program', read_only=True
    )

    class Meta:
        model = Package
        fields = [
            'id',
            'program',          # for POST
            'program_details',  # for RESPONSE
            'name',
            'price',
            'description',
            'is_active',
            'created_at'
        ]
        
class PackageCreateSerializer(serializers.ModelSerializer):
    program_id = serializers.PrimaryKeyRelatedField(
        queryset=Program.objects.all(),
        source="program"
    )
    features = serializers.ListField(
        child=serializers.CharField(),
        write_only=True
    )

    class Meta:
        model = Package
        fields = [
            "program_id",
            "name",
            "price",
            "description",
            "link_url",
            "is_active",
            "aptitude_test",
            "engineering_test_analysis",
            "is_handholding",
            "features"
        ]

    def create(self, validated_data):
        features = validated_data.pop("features")

        # 1️⃣ Create package
        package = Package.objects.create(**validated_data)

        # 2️⃣ Create related features
        feature_objects = [
            PackageFeature(
                package=package,
                description=feature
            )
            for feature in features
        ]
        PackageFeature.objects.bulk_create(feature_objects)

        return package
   
   
# GET API serializer 
class PackageListSerializer(serializers.ModelSerializer):
    program = serializers.SerializerMethodField()
    active_users = serializers.IntegerField(read_only=True)
    features = serializers.SerializerMethodField()  # include features like POST response

    class Meta:
        model = Package
        fields = [
            "id",
            "name",
            "price",
            "is_active",
            "program",
            "description",
            "link_url",
            "active_users",
            "aptitude_test",
            "engineering_test_analysis",
            "is_handholding",
            "features"
        ]

    def get_program(self, obj):
        return {
            "id": obj.program.id,
            "name": obj.program.name
        }

    def get_features(self, obj):
        # Convert all related features to desired format
        return [
            {
                "id": feature.id,
                "description": feature.description
            }
            for feature in obj.packagefeature_set.all()
        ]
        
# Serializer for features inside a package
class PackageFeatureMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = PackageFeature
        fields = ("id", "description")


# Serializer for packages including features
class PackageWithFeaturesSerializer(serializers.ModelSerializer):
    features = serializers.SerializerMethodField()
    program = serializers.SerializerMethodField()
    active_users = serializers.SerializerMethodField()  # optional if you want to include count

    class Meta:
        model = Package
        fields = (
            "id",
            "name",
            "price",
            "description",
            "link_url",
            "is_active",
            "program",
            "active_users",
            "features",
            "aptitude_test",
            "engineering_test_analysis",
            "is_handholding", 
        )

    def get_features(self, obj):
        features = PackageFeature.objects.filter(
            package=obj,
            is_enabled=True
        )
        return PackageFeatureMiniSerializer(features, many=True).data

    def get_program(self, obj):
        return {"id": obj.program.id, "name": obj.program.name}

    def get_active_users(self, obj):
        # Replace with your actual logic for active users count
        return obj.users.filter(is_active=True).count() if hasattr(obj, 'users') else 0


# Serializer for Program including packages with features
class ProgramWithPackagesSerializer(serializers.ModelSerializer):
    packages = serializers.SerializerMethodField()

    class Meta:
        model = Program
        fields = (
            "id",
            "name",
            "description",
            "duration",
            "session",
            "is_active",
            "packages",
        )

    def get_packages(self, obj):
        packages = Package.objects.filter(
            program=obj,
            is_active=True
        )
        return PackageWithFeaturesSerializer(packages, many=True).data
    
class StreamListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Stream
        fields = (
            "id",
            "name",
            "is_active"
        )
    
class MultipleProgramsWithPackagesSerializer(serializers.ModelSerializer):
    packages = serializers.SerializerMethodField()
    streams = serializers.SerializerMethodField()

    class Meta:
        model = Program
        fields = (
            "id",
            "name",
            "description",
            "duration",
            "session",
            "is_active",
            "packages",
            "streams"
        )

    def get_packages(self, obj):
        packages = Package.objects.filter(
            program=obj,
            is_active=True
        )

        return PackageWithFeaturesSerializer(
            packages,
            many=True
        ).data
    
    def get_streams(self, obj):
        streams = Stream.objects.filter(
            programs=obj,
            is_active=True
        )
        print("Program:", obj.id)
        print("Streams:", streams)

        return StreamListSerializer(
            streams,
            many=True
        ).data
    
# ====================== College List Analysis Serializer =====================
    
class CollegeListAnalysisSerializer(serializers.ModelSerializer):

    student_id = serializers.SerializerMethodField()
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)

    program_name = serializers.CharField(source="program.name", read_only=True)
    package_name = serializers.CharField(source="package.name", read_only=True)
    answers = serializers.SerializerMethodField()
    
    payment_status = serializers.SerializerMethodField()
    report_id = serializers.SerializerMethodField()
    report_status = serializers.SerializerMethodField()

    class Meta:
        model = CollegeListAnalysis
        fields = [
            "id",
            "student_id",
            "first_name",
            "last_name",
            "email",
            "program",
            "program_name",
            "package",
            "package_name",
            "status",
            "assigned_by",
            "payment_status",
            "report_id",
            "report_status",
            "answers",           
            "created_at",
            "updated_at"
        ]

    def get_student_id(self, obj):
        student = StudentProfile.objects.filter(user=obj.user).first()
        return student.id if student else None
    
    def get_answers(self, obj):

        student = StudentProfile.objects.filter(user=obj.user).first()

        if not student:
            return []

        answers = (
            Answer.objects
            .filter(
                student=student,
                program_id=obj.program_id,
                package_id=obj.package_id
            )
            .select_related("question")
            .order_by("created_at")
        )

        unique_answers = {}
        for ans in answers:
            if ans.question_id not in unique_answers:
                unique_answers[ans.question_id] = ans

        return AnswerSerializer(unique_answers.values(), many=True).data
    
    # ---------------------------
    # PAYMENT STATUS
    # ---------------------------
    def get_payment_status(self, obj):

        payment = (
            Payment.objects
            .filter(user=obj.user)
            .order_by("-created_at")
            .first()
        )

        return payment.status if payment else None


    # ---------------------------
    # REPORT ID
    # ---------------------------
    def get_report_id(self, obj):

        report = (
            Report.objects
            .filter(
                user=obj.user,
                package__engineering_test_analysis=True
            )
            .order_by("-id")
            .first()
        )

        return report.id if report else None


    # ---------------------------
    # REPORT STATUS
    # ---------------------------
    # def get_report_status(self, obj):

    #     report = (
    #         Report.objects
    #         .filter(
    #             user=obj.user,
    #             package__engineering_test_analysis=True
    #         )
    #         .order_by("-id")
    #         .first()
    #     )

    #     if not report:
    #         return "not_received"

    #     return report.report_status or "not_received" 
    def get_report_status(self, obj):

        report = (
            Report.objects
            .filter(
                user=obj.user,
                program=obj.program,
                package=obj.package
            )
            .order_by("-id")
            .first()
        )

        if not report:
            return "not_received"

        # Return the latest available report status
        if report.report_status_v3 and report.report_status_v3 != "v3_not_received":
            return report.report_status_v3

        if report.report_status_v2 and report.report_status_v2 != "v2_not_received":
            return report.report_status_v2

        if report.report_status and report.report_status != "not_received":
            return report.report_status

        return "not_received"
    
class QuestionAnswerSerializer(serializers.ModelSerializer):

    class Meta:
        model = QuestionAnswer
        fields = ["id", "question", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]
        
class AnswerCreateSerializer(serializers.ModelSerializer):

    class Meta:
        model = Answer
        fields = ["student", "question", "answer_text"]
        read_only_fields = ["id", "created_at", "updated_at"]
        
class AnswerSerializer(serializers.ModelSerializer):

    question_id = serializers.IntegerField(source="question.id", read_only=True)
    question = serializers.CharField(source="question.question", read_only=True)

    class Meta:
        model = Answer
        fields = [
            # "id",
            "question_id",
            "question",
            "answer_text",
            "created_at"
        ]


class LandingPageSerializer(serializers.ModelSerializer):

    program_details = ProgramSerializer(source="program", read_only=True)
    package_details = PackageWithFeaturesSerializer(source="package", read_only=True)

    class Meta:
        model = LandingPage
        fields = "__all__"

    def to_representation(self, instance):
        data = super().to_representation(instance)

        request = self.context.get("request")

        # ✅ Full image URL
        if instance.flyer_image and request:
            data["flyer_image"] = request.build_absolute_uri(instance.flyer_image.url)

        return data