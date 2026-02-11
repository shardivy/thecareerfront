from rest_framework import serializers

from accounts.models import User
from lead_registration.models import Hobby, Lead, Stream, StudentAcademicHistory, StudentHobby, StudentStream, StudentSubjectPreference, Subject
from program_package.models import Package, Program, UserProgramPackage
from program_package.serializers import PackageSerializer, ProgramSerializer



class LeadSerializer(serializers.ModelSerializer):
    program_detail = ProgramSerializer(source='program', read_only=True)
    
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
            'source',
            'status',
            'date',
        )
        read_only_fields = ('status',) 

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
    # User fields
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField()
    phone = serializers.CharField(required=False, allow_blank=True)

    # StudentProfile fields
    study_class = serializers.CharField(required=False, allow_blank=True)
    current_academic_stage = serializers.CharField(required=False, allow_blank=True)
    current_academic_year = serializers.CharField(required=False, allow_blank=True)
    school_college = serializers.CharField(required=False, allow_blank=True)
    city = serializers.CharField(required=False, allow_blank=True)

    # Program & Package (IDs only)
    program = serializers.PrimaryKeyRelatedField(
        queryset=Program.objects.all()
    )
    package = serializers.PrimaryKeyRelatedField(
        queryset=Package.objects.all()
    )

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email already exists.")
        return value


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



