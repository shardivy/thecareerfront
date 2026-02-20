from lead_registration.models import StudentProfile
from rest_framework import serializers

from accounts.models import User
from django.contrib.auth import get_user_model

from counselling_slot.models import Booking, BookingCounsellor, Counsellor, Slot
from datetime import date, datetime, timedelta

# =========================== Updated Serializers Below ===========================
class UserMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "first_name", "last_name", "email")

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
            "end_time",
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
    date = serializers.DateField()

    # 🔥 RENAMED FIELD (THIS FIXES EVERYTHING)
    slots = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(
            queryset=Slot.objects.all()
        ),
        allow_empty=False
    )

    counsellors_data = BookingCounsellorInputSerializer(many=True)

    # def validate(self, data):
    #     # exactly one lead
    #     lead_count = sum(
    #         1 for c in data["counsellors_data"] if c["role"] == "lead"
    #     )
    #     if lead_count != 1:
    #         raise serializers.ValidationError(
    #             "Exactly one lead counsellor is required."
    #         )

    #     # prevent double booking
    #     for slot in data["slots"]:
    #         if Booking.objects.filter(slot=slot, date=data["date"]).exists():
    #             raise serializers.ValidationError(
    #                 f"Slot {slot.id} already booked for this date"
    #             )

    #     return data

    def validate(self, data):
        student = data["student_id"]
        booking_id = self.context.get("booking_id")

        # ✅ 1. Exactly one lead counsellor
        lead_count = sum(
            1 for c in data["counsellors_data"] if c["role"] == "lead"
        )
        if lead_count != 1:
            raise serializers.ValidationError(
                {"counsellors_data": "Exactly one lead counsellor is required."}
            )

        # ✅ 2. Exclude current booking during update
        existing_booking = Booking.objects.filter(
            student=student,
            status__in=["booked", "completed"]
        )

        if booking_id:
            existing_booking = existing_booking.exclude(id=booking_id)

        if existing_booking.exists():
            raise serializers.ValidationError(
                {"error": "Student already has a booked or completed session."}
            )

        # ✅ 3. Prevent slot being already booked by someone else
        for slot in data["slots"]:
            slot_query = Booking.objects.filter(
                slot=slot,
                status__in=["booked", "completed"]
            )

            if booking_id:
                slot_query = slot_query.exclude(id=booking_id)

            if slot_query.exists():
                raise serializers.ValidationError(
                    {"error": f"Slot {slot.id} is already booked or completed."}
                )

        return data














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
