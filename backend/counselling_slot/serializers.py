from django.shortcuts import get_object_or_404
from django.urls import reverse

from program_package.models import Package, Program, UserProgramPackage
from report.models import Report
from lead_registration.models import StudentProfile, StudentStream
from rest_framework import serializers

from accounts.models import User
from django.contrib.auth import get_user_model
import os
import uuid
from django.conf import settings

from counselling_slot.models import Booking, BookingCounsellor, CounsellingNote, Counsellor, Slot
from datetime import date, datetime, timedelta

# =========================== Updated Serializers Below ===========================
class UserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "first_name", "last_name", "email")

class ProgramMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Program
        fields = ["id", "name"]


class PackageMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Package
        fields = ["id", "name"]

class CounsellorListSerializer(serializers.ModelSerializer):
    user = UserMiniSerializer(read_only=True)

    class Meta:
        model = Counsellor
        fields = ("id", "user", "specialization", "is_active")
  
# Add counselling slot serializers        
class SlotCreateSerializer(serializers.ModelSerializer):
    counsellor_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Slot
        fields = (
            "id",
            "counsellor_id",
            "date",
            "start_time",
            # "end_time",
            "mode",
            "created_at",
        )

    def validate_counsellor_id(self, value):
        if not Counsellor.objects.filter(id=value, is_active=True).exists():
            raise serializers.ValidationError("Invalid or inactive counsellor.")
        return value

    def create(self, validated_data):
        counsellor_id = validated_data.pop("counsellor_id")

        counsellor = Counsellor.objects.get(id=counsellor_id)

        slot = Slot.objects.create(
            counsellor=counsellor.user,
            **validated_data
        )
        return slot
    
class BookingCounsellorInputSerializer(serializers.Serializer):
    counsellor_id = serializers.PrimaryKeyRelatedField(
        queryset=Counsellor.objects.all()
    )
    role = serializers.ChoiceField(
        choices=["lead", "assistant"]
    )

class StudentMiniSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)
    preferred_counselling_mode = serializers.CharField(read_only=True)

    class Meta:
        model = StudentProfile
        fields = ["id", "first_name", "last_name", "email", "preferred_counselling_mode"]

class CounsellorMiniSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source="user.id", read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)
    email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = Counsellor
        fields = ["id", "user_id", "first_name", "last_name", "email", "specialization"]

class SlotMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Slot
        fields = [
            "id",
            "date",
            "start_time",
            "end_time",
            "mode",
        ]

class BookingCounsellorMiniSerializer(serializers.ModelSerializer):
    counsellor = CounsellorMiniSerializer(read_only=True)

    class Meta:
        model = BookingCounsellor
        fields = [
            "counsellor",
            "role",
            "assigned_at",
        ]

class BookingReadSerializer(serializers.ModelSerializer):
    student = StudentMiniSerializer(read_only=True)
    slot = SlotMiniSerializer(read_only=True)
    program = ProgramMiniSerializer(read_only=True)
    package = PackageMiniSerializer(read_only=True)
    counsellors = BookingCounsellorMiniSerializer(
        source="bookingcounsellor_set",
        many=True,
        read_only=True
    )

    class Meta:
        model = Booking
        fields = [
            "id",
            "student",
            "slot",
            "program",
            "package",
            "date",
            "status",
            "meeting_link",
            "created_at",
            "counsellors",
        ]



    
class BookingCreateSerializer(serializers.Serializer):
    student_id = serializers.PrimaryKeyRelatedField(
        queryset=StudentProfile.objects.all()
    )
    program = serializers.PrimaryKeyRelatedField(
        queryset=Program.objects.all()
    )

    package = serializers.PrimaryKeyRelatedField(
        queryset=Package.objects.all()
    )

    date = serializers.DateField()

    slots = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(
            queryset=Slot.objects.all()
        ),
        allow_empty=False
    )

    counsellors_data = BookingCounsellorInputSerializer(many=True)

    def validate(self, data):

        student = data["student_id"]
        booking_id = self.context.get("booking_id")

        # =============================
        # 1️⃣ Exactly one lead counsellor
        # =============================
        lead_count = sum(
            1 for c in data["counsellors_data"] if c["role"] == "lead"
        )

        if lead_count != 1:
            raise serializers.ValidationError({
                "counsellors_data": "Exactly one lead counsellor is required."
            })

        # =============================
        # 2️⃣ Student booking validation
        # =============================
        existing_booking = Booking.objects.filter(
            student=student,
            program=data["program"],
            package=data["package"],
            status__in=["booked", "completed", "rescheduled"]
        )

        if booking_id:

            try:
                booking = Booking.objects.get(id=booking_id)
            except Booking.DoesNotExist:
                raise serializers.ValidationError({
                    "error": "Booking not found"
                })

            # =============================
            # 3️⃣ Booking status logic
            # =============================
            if booking.status == "not_booked":
                data["status_override"] = "booked"

            elif booking.status in ["booked", "completed"]:
                data["status_override"] = "rescheduled"

            elif booking.status == "pending":
                data["status_override"] = "rescheduled"

            elif booking.status == "rescheduled":
                data["status_override"] = "rescheduled"

            else:
                raise serializers.ValidationError({
                    "error": "Invalid booking status for update."
                })

            existing_booking = existing_booking.exclude(id=booking_id)

        if existing_booking.exists():
            raise serializers.ValidationError({
                "error": "Student already has a booked or completed session."
            })

        # =============================
        # 4️⃣ Slot validation
        # =============================
        # for slot in data["slots"]:

        #     slot_query = Booking.objects.filter(
        #         slot=slot,
        #         status__in=["booked", "completed", "rescheduled"]
        #     )

        #     if booking_id:
        #         slot_query = slot_query.exclude(id=booking_id)

        #     if slot_query.exists():
        #         raise serializers.ValidationError({
        #             "error": f"Slot {slot.id} is already booked."
        #         })
        for slot in data["slots"]:

            for counsellor_data in data["counsellors_data"]:

                counsellor = counsellor_data["counsellor_id"]

                booking_query = BookingCounsellor.objects.filter(
                    counsellor=counsellor,
                    booking__slot=slot,
                    booking__status__in=["booked", "completed", "rescheduled"]
                )

                if booking_id:
                    booking_query = booking_query.exclude(booking_id=booking_id)

                if booking_query.exists():
                    raise serializers.ValidationError({
                        "error": f"Counsellor {counsellor.id} already has this slot booked."
                    })

        return data
    


class StudentBookingSerializer(serializers.ModelSerializer):
    slot_date = serializers.DateField(source="slot.date", allow_null=True)
    start_time = serializers.CharField(source="slot.start_time", allow_null=True)
    end_time = serializers.CharField(source="slot.end_time", allow_null=True)
    mode = serializers.CharField(source="slot.mode", allow_null=True)
    preferred_counselling_mode = serializers.CharField(source="student.preferred_counselling_mode", allow_null=True)
    
    program_detail = ProgramMiniSerializer(
        source="program",
        read_only=True
    )

    package_detail = PackageMiniSerializer(
        source="package",
        read_only=True
    )

    counsellors = BookingCounsellorMiniSerializer(
        source="bookingcounsellor_set",
        many=True,
        read_only=True
    )

    class Meta:
        model = Booking
        fields = [
            "id",
            "program_detail",
            "package_detail",
            "slot_date",
            "start_time",
            "end_time",
            "date",
            "mode",
            "preferred_counselling_mode",
            "counsellors",   # ✅ real relation
            "status",
            "meeting_link",
            "created_at",
        ]
        
class CounsellorStudentBookingSerializer(serializers.ModelSerializer):
    student_id = serializers.IntegerField(source="student.id", read_only=True)
    student_name = serializers.SerializerMethodField()
    student_email = serializers.SerializerMethodField()
    student_phone = serializers.SerializerMethodField()
    preferred_counselling_mode = serializers.CharField(source="student.preferred_counselling_mode", read_only=True)
    stream = serializers.SerializerMethodField()
    suggested_stream = serializers.SerializerMethodField()
    counsellor_name = serializers.SerializerMethodField()
    role = serializers.SerializerMethodField()
    slot_time = serializers.SerializerMethodField()
    mode = serializers.CharField(source="slot.mode", read_only=True)
    program = ProgramMiniSerializer(read_only=True)
    package = PackageMiniSerializer(read_only=True)
    report_file = serializers.SerializerMethodField()
    aptitude_test = serializers.SerializerMethodField()
    engineering_test_analysis = serializers.SerializerMethodField()

    class Meta:
        model = Booking
        fields = [
            "id",
            "student_id",
            "student_name",
            "student_email",
            "student_phone",
            "preferred_counselling_mode",
            "stream",
            "suggested_stream",
            "counsellor_name",
            "role",
            "date",
            "slot_time",
            "mode",
            "program",
            "package",
            "status",
            "report_file",
            "aptitude_test",
            "engineering_test_analysis",
        ]
        
    
    # def get_report_file(self, obj):
    #     request = self.context.get("request")

    #     report = (
    #         Report.objects
    #         .filter(user=obj.student.user)
    #         .order_by("-uploaded_at")
    #         .first()
    #     )

    #     if not report or not report.file_path:
    #         return None

    #     try:
    #         # ✅ Actual uploaded filename
    #         file_name = os.path.basename(
    #             report.file_path.name
    #         )

    #         # ✅ ALL file types use same secure API
    #         return request.build_absolute_uri(
    #             f"/api/report/report/pdf/{report.id}/"
    #         )

    #     except Exception:
    #         return None
     
     
    def get_report_file(self, obj):
        request = self.context.get("request")

        report = (
            Report.objects
            .filter(
                user=obj.student.user,
                program=obj.program,
                package=obj.package
            )
            .order_by("-uploaded_at")
            .first()
        )

        if not report:
            return []

        reports = []

        # V1 Report
        if report.file_path:
            reports.append({
                "version": "V1",
                "status": report.report_status,
                "url": request.build_absolute_uri(
                    f"/api/report/report/pdf/{report.id}/"
                )
            })

        # V2 Report
        if report.file_path1:
            reports.append({
                "version": "V2",
                "status": report.report_status_v2,
                "url": request.build_absolute_uri(
                    f"/api/report/report/v1/pdf/{report.id}/"
                )
            })

        # V3 Report
        if report.file_path2:
            reports.append({
                "version": "V3",
                "status": report.report_status_v3,
                "url": request.build_absolute_uri(
                    f"/api/report/report/v2/pdf/{report.id}/"
                )
            })

        return reports
        
    def get_student_id(self, obj):
        return obj.student.id

    def get_student_name(self, obj):
        return f"{obj.student.user.first_name} {obj.student.user.last_name}"

    def get_student_email(self, obj):
        return obj.student.user.email
    
    def get_student_phone(self, obj):
        return obj.student.user.phone
    
    def get_suggested_stream(self, obj):
        return obj.student.suggested_stream
    
    def get_stream(self, obj):

        student_stream = (
            StudentStream.objects
            .filter(student_profile=obj.student)
            .select_related("stream")
            .first()
        )

        if not student_stream:
            return None

        return {
            "stream_id": student_stream.stream.id,
            "stream_name": student_stream.stream.name
        }
    
    def get_preferred_counselling_mode(self, obj):
        return obj.student.preferred_counselling_mode

    # def get_counsellor_name(self, obj):
    #     counsellor = obj.bookingcounsellor_set.first()

    #     if counsellor:
    #         return f"{counsellor.counsellor.user.first_name} {counsellor.counsellor.user.last_name}"
    #     return None
    
    def get_counsellor_name(self, obj):
        counsellors = obj.bookingcounsellor_set.all()

        counsellor_list = []
        for counsellor in counsellors:
            counsellor_list.append({
                "counsellor_id": counsellor.counsellor.id,
                "counsellor_name": f"{counsellor.counsellor.user.first_name} {counsellor.counsellor.user.last_name}",
                "role": counsellor.role
            })

        return counsellor_list

    def get_role(self, obj):
        counsellor = obj.bookingcounsellor_set.filter(
            counsellor__user=self.context["request"].user
        ).first()

        if counsellor:
            return counsellor.role
        return None

    def get_slot_time(self, obj):
        if obj.slot:
            return f"{obj.slot.start_time}"
        return None
    
    def get_aptitude_test(self, obj):
        student_user = obj.student.user

        return UserProgramPackage.objects.filter(
            user=student_user,
            package__aptitude_test=True
        ).exists()
        
    def get_engineering_test_analysis(self, obj):
        student_user = obj.student.user

        return UserProgramPackage.objects.filter(
            user=student_user,
            package__engineering_test_analysis=True
        ).exists()
    
class CounsellingNoteSerializer(serializers.ModelSerializer):
    
    program = serializers.PrimaryKeyRelatedField(
        queryset=Program.objects.all()
    )

    package = serializers.PrimaryKeyRelatedField(
        queryset=Package.objects.all()
    )

    class Meta:
        model = CounsellingNote
        fields = [
            "id",
            "notes",
            "program",
            "package",
            "file1",
            "file2",
            "file3",
            "file4",
            "file5",
            "created_at"
        ]
        read_only_fields = ["id", "created_at"]

    def create(self, validated_data):
        booking = self.context["booking"]
        request = self.context["request"]

        counsellor = Counsellor.objects.filter(user=request.user).first()

        note = CounsellingNote.objects.create(
            booking=booking,
            counsellor=counsellor,  # will be None if user is not counsellor
            program=validated_data.pop("program"),
            package=validated_data.pop("package"),
            **validated_data
        )

        return note

class CounsellorBookingSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    email = serializers.EmailField(source="student.user.email")
    phone = serializers.CharField(source="student.user.phone")
    preferred_mode = serializers.CharField(source="student.preferred_counselling_mode")
    slot_date = serializers.DateField(source="slot.date")
    start_time = serializers.CharField(source="slot.start_time")
    end_time = serializers.CharField(source="slot.end_time")

    class Meta:
        model = Booking
        fields = [
            "id",
            "student_name",
            "email",
            "phone",
            "preferred_mode",
            "status",
            "slot_date",
            "start_time",
            "end_time",
            "created_at",
        ]

    def get_student_name(self, obj):
        return f"{obj.student.user.first_name} {obj.student.user.last_name}"








# ============================ Old Serializers Above ==========================
User = get_user_model()

class LeadCounsellorUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'first_name', 'last_name', 'email', 'role', 'is_active']


class UserBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "first_name",
            "last_name",
            "email",
            "phone"
        ]
        
class CounsellorResponseSerializer(serializers.ModelSerializer):
    user = UserBasicSerializer()

    class Meta:
        model = Counsellor
        fields = [
            "id",
            "user",
            "specialization",
            "is_active"
        ]

class AddCounsellorSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'specialization', 'is_active']

    def validate(self, attrs):
        user = self.instance or self.context['user']
        if user.role == 'counsellor':
            raise serializers.ValidationError(
                "User is already a counsellor"
            )
        return attrs

    def update(self, instance, validated_data):
        instance.role = 'counsellor'
        instance.specialization = validated_data.get(
            'specialization', instance.specialization
        )
        instance.is_active = validated_data.get(
            'is_active', instance.is_active
        )
        instance.save()
        return instance

    
# ================== slot create serializers ======================

# class SlotCreateSerializer(serializers.ModelSerializer):
#     lead_counsellor = serializers.PrimaryKeyRelatedField(
#         queryset=User.objects.all()
#     )
#     normal_counsellor = serializers.PrimaryKeyRelatedField(
#         queryset=User.objects.all(),
#         required=False,
#         allow_null=True
#     )

#     class Meta:
#         model = Slot
#         fields = [
#             'id',
#             'lead_counsellor',
#             'normal_counsellor',
#             'date',
#             'start_time',
#             'end_time',
#             'mode',
#             'duration_minutes',
#             'is_available',
#         ]

#     def validate(self, attrs):
#         lead = attrs.get('lead_counsellor')
#         normal = attrs.get('normal_counsellor')

#         if lead.role.name != 'lead_counsellor':
#             raise serializers.ValidationError(
#                 {"lead_counsellor": "Selected user is not a lead counsellor"}
#             )

#         if normal and normal.role.name != 'counsellor':
#             raise serializers.ValidationError({
#                 "normal_counsellor": "Selected user is not a counsellor"
#             })

#         return attrs


# class SlotCreateSerializer(serializers.ModelSerializer):
#     lead_counsellor = serializers.PrimaryKeyRelatedField(
#         queryset=User.objects.all()
#     )
#     normal_counsellor = serializers.PrimaryKeyRelatedField(
#         queryset=User.objects.all(),
#         required=False,
#         allow_null=True
#     )

#     class Meta:
#         model = Slot
#         fields = [
#             'id',
#             'lead_counsellor',
#             'normal_counsellor',
#             'date',
#             'start_time',
#             'end_time',
#             'mode',
#             'duration_minutes',
#             'is_available',
#         ]
#         read_only_fields = ('end_time',)

#     def _parse_time(self, value):
#         """Accept HH:MM and HH:MM AM/PM"""
#         for fmt in ("%H:%M", "%I:%M %p"):
#             try:
#                 return datetime.strptime(value, fmt).time()
#             except ValueError:
#                 continue
#         raise serializers.ValidationError({
#             "start_time": "Invalid time format. Use HH:MM or HH:MM AM/PM."
#         })

#     def validate(self, attrs):
#         lead = attrs.get('lead_counsellor')
#         normal = attrs.get('normal_counsellor')
#         start_time = attrs.get('start_time')
#         duration = attrs.get('duration_minutes')

#         if lead.role.name != 'lead_counsellor':
#             raise serializers.ValidationError({
#                 "lead_counsellor": "Selected user is not a lead counsellor"
#             })

#         if normal and normal.role.name != 'counsellor':
#             raise serializers.ValidationError({
#                 "normal_counsellor": "Selected user is not a counsellor"
#             })

#         if start_time and duration:
#             if isinstance(start_time, str):
#                 start_time_obj = self._parse_time(start_time)
#             else:
#                 start_time_obj = start_time

#             end_time = (
#                 datetime.combine(date.today(), start_time_obj)
#                 + timedelta(minutes=duration)
#             ).time()

#             # store as string since model uses CharField
#             attrs['start_time'] = start_time_obj.strftime("%I:%M %p")
#             attrs['end_time'] = end_time.strftime("%I:%M %p")

#         return attrs



    
class SlotResponseSerializer(serializers.ModelSerializer):
    lead_counsellor = UserBasicSerializer()
    normal_counsellor = UserBasicSerializer()

    class Meta:
        model = Slot
        fields = [
            'id',
            'lead_counsellor',
            'normal_counsellor',
            'date',
            'start_time',
            'end_time',
            'mode',
            'duration_minutes',
            'is_available',
        ]

class SlotUpdateSerializer(serializers.ModelSerializer):
    lead_counsellor = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=False
    )
    normal_counsellor = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = Slot
        fields = [
            'lead_counsellor',
            'normal_counsellor',
            'date',
            'start_time',
            'end_time',      # auto-generated
            'mode',
            'duration_minutes',
            'is_available',
        ]
        read_only_fields = ('end_time',)

    def _parse_time(self, value):
        """
        Accepts:
        - 14:00
        - 02:00 PM
        """
        if not isinstance(value, str):
            return value

        for fmt in ("%H:%M", "%I:%M %p"):
            try:
                return datetime.strptime(value, fmt).time()
            except ValueError:
                pass

        raise serializers.ValidationError({
            "start_time": "Invalid time format. Use HH:MM or HH:MM AM/PM."
        })

    def validate(self, attrs):
        instance = self.instance

        # FINAL values (incoming OR existing)
        start_time = attrs.get('start_time', instance.start_time)
        duration = attrs.get('duration_minutes', instance.duration_minutes)

        lead = attrs.get('lead_counsellor')
        normal = attrs.get('normal_counsellor')

        # counsellor validation
        if lead is not None and lead.role.name != 'lead_counsellor':
            raise serializers.ValidationError({
                "lead_counsellor": "Selected user is not a lead counsellor"
            })

        if normal is not None and normal.role.name != 'counsellor':
            raise serializers.ValidationError({
                "normal_counsellor": "Selected user is not a counsellor"
            })

        # auto-calculate end_time
        if start_time and duration:
            start_time_obj = self._parse_time(start_time)

            end_time_obj = (
                datetime.combine(date.today(), start_time_obj)
                + timedelta(minutes=duration)
            ).time()

            # store as string (model uses CharField)
            attrs['start_time'] = start_time_obj.strftime("%I:%M %p")
            attrs['end_time'] = end_time_obj.strftime("%I:%M %p")

        return attrs

    def update(self, instance, validated_data):
        """
        FORCE UPDATE — never create new row
        """
        for field, value in validated_data.items():
            setattr(instance, field, value)

        instance.save(update_fields=validated_data.keys())
        return instance



# =================== Add counselling booking slot =========================
# class BookingCounsellorCreateSerializer(serializers.Serializer):
#     counsellor_id = serializers.IntegerField()
#     role = serializers.ChoiceField(choices=["lead", "assistant"])


# class StudentMiniSerializer(serializers.ModelSerializer):
#     first_name = serializers.CharField(source="user.first_name", read_only=True)
#     last_name = serializers.CharField(source="user.last_name", read_only=True)
#     email = serializers.EmailField(source="user.email", read_only=True)

#     class Meta:
#         model = StudentProfile
#         fields = ["id", "first_name", "last_name", "email"]


# class CounsellorMiniSerializer(serializers.ModelSerializer):
#     user = StudentMiniSerializer(read_only=True)

#     class Meta:
#         model = Counsellor
#         fields = ("id", "user", "specialization")

# class SlotMiniSerializer(serializers.ModelSerializer):
#     counsellor = CounsellorMiniSerializer(read_only=True)

#     class Meta:
#         model = Slot
#         fields = ("id", "date", "start_time", "end_time", "mode", "counsellor")


# class BookingCreateSerializer(serializers.ModelSerializer):
#     # READ
#     student = StudentMiniSerializer(read_only=True)
#     slot = SlotMiniSerializer(read_only=True)

#     counsellors = serializers.SerializerMethodField()

#     # WRITE
#     student_id = serializers.PrimaryKeyRelatedField(
#         queryset=StudentProfile.objects.all(),
#         source="student",
#         write_only=True
#     )
#     slot_id = serializers.PrimaryKeyRelatedField(
#         queryset=Slot.objects.all(),
#         source="slot",
#         write_only=True
#     )
#     counsellors_data = BookingCounsellorCreateSerializer(
#         many=True,
#         write_only=True,
#         source="counsellors"
#     )

#     class Meta:
#         model = Booking
#         fields = [
#             "id",
#             "student",
#             "student_id",
#             "slot",
#             "slot_id",
#             "date",
#             "meeting_link",
#             "status",
#             "created_at",
#             "counsellors",
#             "counsellors_data",
#         ]
#         read_only_fields = ("id", "status", "created_at")

#     def get_counsellors(self, obj):
#         qs = obj.bookingcounsellor_set.select_related("counsellor__user")
#         return [
#             {
#                 "id": bc.counsellor.id,
#                 "role": bc.role,
#                 "user": {
#                     "id": bc.counsellor.user.id,
#                     "first_name": bc.counsellor.user.first_name,
#                     "last_name": bc.counsellor.user.last_name,
#                     "email": bc.counsellor.user.email,
#                 }
#             }
#             for bc in qs
#         ]

#     def validate(self, attrs):
#         counsellors_data = attrs.get("counsellors", [])

#         # 🔒 exactly ONE lead counsellor
#         leads = [c for c in counsellors_data if c["role"] == "lead"]
#         if len(leads) != 1:
#             raise serializers.ValidationError({
#                 "counsellors": "Exactly one lead counsellor is required."
#             })

#         # 🔒 slot double booking check
#         slot = attrs.get("slot")
#         date = attrs.get("date")
#         if Booking.objects.filter(slot=slot, date=date).exists():
#             raise serializers.ValidationError({
#                 "slot": "This slot is already booked."
#             })

#         return attrs

#     def create(self, validated_data):
#         counsellors_data = validated_data.pop("counsellors")
#         booking = Booking.objects.create(**validated_data)

#         for item in counsellors_data:
#             user = User.objects.get(
#                 id=item["counsellor_id"],
#                 role__name="counsellor"
#             )
#             counsellor = Counsellor.objects.get(user=user)

#             BookingCounsellor.objects.create(
#                 booking=booking,
#                 counsellor=counsellor,
#                 role=item["role"]
#             )

#         return booking
