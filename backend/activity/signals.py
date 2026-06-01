# from django.db.models.signals import post_save, post_delete
# from django.dispatch import receiver
# from django.apps import apps

# ActivityLog = apps.get_model("activity", "ActivityLog")


# def create_log(sender, instance, created, **kwargs):
#     if sender.__name__ == "ActivityLog":
#         return
#     print(f"Logging {sender.__name__} - {instance.pk} - {'Created' if created else 'Updated'}")

#     ActivityLog.objects.create(
#         user=None,
#         action="create" if created else "update",
#         module=sender._meta.app_label,
#         model_name=sender.__name__,
#         object_id=instance.pk
#     )


# def delete_log(sender, instance, **kwargs):
#     if sender.__name__ == "ActivityLog":
#         return

#     ActivityLog.objects.create(
#         user=None,
#         action="delete",
#         module=sender._meta.app_label,
#         model_name=sender.__name__,
#         object_id=instance.pk
#     )


# # ✅ Connect signals
# for model in apps.get_models():
#     post_save.connect(create_log, sender=model)
#     post_delete.connect(delete_log, sender=model)


from django.db.models.signals import post_save, post_delete
from django.apps import apps
from activity.middleware import get_current_user
from django.contrib.auth.models import AnonymousUser

ActivityLog = apps.get_model("activity", "ActivityLog")




# def get_user_name(user, instance):
#     if user and getattr(user, "is_authenticated", False):

#         full_name = f"{user.first_name} {user.last_name}".strip() or user.email

#         # ✅ Add role prefix
#         if user and getattr(user, "is_authenticated", False):

#             full_name = f"{user.first_name} {user.last_name}".strip() or user.email

#             if hasattr(user, "role") and user.role:
#                 role_name = user.role.name.lower()

#                 if role_name == "super admin":
#                     return f"Superadmin {full_name}"

#                 if role_name == "admin":
#                     return f"Admin {full_name}"

#             return full_name

#     if hasattr(instance, "student") and instance.student:
#         student = instance.student
#         return f"{student.user.first_name} {student.user.last_name}".strip() or student.user.email

#     if hasattr(instance, "user") and instance.user:
#         u = instance.user
#         return f"{u.first_name} {u.last_name}".strip() or u.email

#     if hasattr(instance, "booking") and instance.booking:
#         student = getattr(instance.booking, "student", None)
#         if student:
#             return f"{student.user.first_name} {student.user.last_name}".strip() or student.user.email

#     return "User"

def get_user_name(user, instance):
    if user and getattr(user, "is_authenticated", False):

        full_name = (
            f"{user.first_name} {user.last_name}".strip()
            or user.email
        )

        if getattr(user, "role", None):
            role_name = user.role.name.lower()

            if role_name == "super admin":
                return f"Superadmin {full_name}"

            if role_name == "admin":
                return f"Admin {full_name}"

        return full_name

    try:
        student = getattr(instance, "student", None)
        if student and student.user:
            return (
                f"{student.user.first_name} {student.user.last_name}".strip()
                or student.user.email
            )
    except Exception:
        pass

    try:
        related_user = getattr(instance, "user", None)
        if related_user:
            return (
                f"{related_user.first_name} {related_user.last_name}".strip()
                or related_user.email
            )
    except Exception:
        pass

    try:
        booking = getattr(instance, "booking", None)
        if booking and booking.student and booking.student.user:
            return (
                f"{booking.student.user.first_name} "
                f"{booking.student.user.last_name}"
            ).strip() or booking.student.user.email
    except Exception:
        pass

    return "User"

def get_description(user, action, instance):

    model = instance.__class__.__name__
    user_name = get_user_name(user, instance)

    if model == "User" and action == "create":
        if user and getattr(user, "is_authenticated", False) and hasattr(user, "role") and user.role:
            if user.role.name.lower() == "super admin":
                return f"Super Admin created student {instance.first_name} {instance.last_name}"

        return f"{instance.first_name} {instance.last_name} registered"

    if model == "Booking" and action == "create":

        student_name = ""

        if hasattr(instance, "student") and instance.student:
            student = instance.student.user
            student_name = f"{student.first_name} {student.last_name}".strip() or student.email

        actor = get_user_name(user, instance)

        # Admin / Superadmin booked session for student
        if user and getattr(user, "is_authenticated", False):
            return f"{actor} booked a counselling session for {student_name}"

        # Student booked themselves
        return f"{student_name} booked a counselling session"

    if model == "Payment" and action == "create":

        student_name = ""

        if hasattr(instance, "user") and instance.user:
            student = instance.user
            student_name = f"{student.first_name} {student.last_name}".strip() or student.email

        actor = get_user_name(user, instance)

        # Admin / Superadmin recorded payment
        if user and getattr(user, "is_authenticated", False):
            return f"{actor} recorded a payment of ₹{instance.amount} for {student_name}"

        # Student made payment
        return f"{student_name} made a payment of ₹{instance.amount}"

    if action == "update":
        # return None  
        return f"{get_user_name(user, instance)} updated {model}"

    return None

def create_log(sender, instance, created, **kwargs):

    if sender.__name__ == "ActivityLog":
        return

    # ✅ Only track selected models
    if sender not in TRACKED_MODELS:
        return

    user = get_current_user()

    log_user = user if user and user.is_authenticated else None

    action = "create" if created else "update"

    description = get_description(user, action, instance)

    if description is None:
        return

    ActivityLog.objects.create(
        user=log_user,
        action=action,
        module=sender._meta.app_label,
        model_name=sender.__name__,
        object_id=instance.pk,
        description=description
    ) 

def delete_log(sender, instance, **kwargs):
    if sender.__name__ == "ActivityLog":
        return

    user = get_current_user()

    # ✅ FIX: allow only authenticated users
    if user and getattr(user, "is_authenticated", False):
        log_user = user
    else:
        log_user = None

    description = get_description(user, "deleted", instance)

    if description is None:
        return

    ActivityLog.objects.create(
        user=log_user,  # ✅ FIXED
        action="deleted",
        module=sender._meta.app_label,
        model_name=sender.__name__,
        object_id=instance.pk,
        description=description
    )


# ✅ Connect signals
# for model in apps.get_models():
#     post_save.connect(create_log, sender=model)
#     post_delete.connect(delete_log, sender=model)
TRACKED_MODELS = [
    apps.get_model("accounts", "User"),
    apps.get_model("lead_registration", "StudentProfile"),
    apps.get_model("counselling_slot", "Booking"),
    apps.get_model("payment", "Payment"),
]

for model in TRACKED_MODELS:
    post_save.connect(create_log, sender=model)
    post_delete.connect(delete_log, sender=model)