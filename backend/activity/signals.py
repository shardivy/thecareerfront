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


def get_user_name(user, instance):
    if user and getattr(user, "is_authenticated", False):
        if hasattr(user, "get_full_name"):
            return user.get_full_name() or user.email
        return f"{user.first_name} {user.last_name}".strip() or user.email

    if hasattr(instance, "student") and instance.student:
        student = instance.student
        return f"{student.first_name} {student.last_name}".strip() or student.email

    if hasattr(instance, "user") and instance.user:
        u = instance.user
        return f"{u.first_name} {u.last_name}".strip() or u.email

    if hasattr(instance, "booking") and instance.booking:
        student = getattr(instance.booking, "student", None)
        if student:
            return f"{student.first_name} {student.last_name}".strip() or student.email

    return "User"


def get_description(user, action, instance):
    model = instance.__class__.__name__
    user_name = get_user_name(user, instance)

    try:
        if model == "Booking":
            return f"{user_name} booked a counselling session"

        elif model == "BookingCounsellor":
            return f"{user_name} was assigned a counsellor"

        elif model == "Payment":
            return f"{user_name} made a payment of ₹{instance.amount}"

        elif model == "LogEntry":
            return None

        return f"{user_name} {action} {model}"

    except Exception:
        return f"{user_name} performed {action}"


def create_log(sender, instance, created, **kwargs):
    if sender.__name__ == "ActivityLog":
        return

    user = get_current_user()

    # ✅ FIX: only assign real user
    if user and user.is_authenticated:
        log_user = user
    else:
        log_user = None

    action = "created" if created else "updated"

    description = get_description(user, action, instance)

    if description is None:
        return

    ActivityLog.objects.create(
        user=log_user,  # ✅ FIXED
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

    description = get_description(user, "deleted", instance)

    if description is None:
        return

    ActivityLog.objects.create(
        user=user,
        action="deleted",
        module=sender._meta.app_label,
        model_name=sender.__name__,
        object_id=instance.pk,
        description=description
    )


# ✅ Connect signals
for model in apps.get_models():
    post_save.connect(create_log, sender=model)
    post_delete.connect(delete_log, sender=model)