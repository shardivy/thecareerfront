from django.conf import settings
from payment.models import Payment
from program_package.models import UserProgramPackage
from report.models import Report
from exam.models import UserExam
from django.core.mail import send_mail


def get_completed_exam_report_data():
    completed_exams = (
        UserExam.objects
        .filter(status='completed')
        .select_related('user', 'exam')
    )

    data = []

    for user_exam in completed_exams:
        user = user_exam.user

        user_program = (
            UserProgramPackage.objects
            .filter(user=user)
            .select_related('program')
            .first()
        )

        report = (
            Report.objects
            .filter(user=user, exam=user_exam.exam)
            .order_by('-uploaded_at')
            .first()
        )

        payment = (
            Payment.objects
            .filter(user=user)
            .order_by('-created_at')
            .first()
        )

        data.append({
            "user_id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email,
            "phone": getattr(user, "phone", None),
            "program": user_program.program.name if user_program else None,
            "exam": user_exam.exam.name,
            "exam_status": user_exam.status,
            "report_status": report.report_status if report else None,
            "uploaded_at": report.uploaded_at,
            "payment_status": payment.status if payment else None,
        })

    return data


# def send_report_uploaded_email(user, report):
#     """
#     Send email notification when report is uploaded
#     """

#     subject = "Your Report Has Been Uploaded"

#     message = f"""
# Dear {user.first_name},

# Your report has been successfully uploaded.

# Report Details:
# Report ID: {report.id}
# Upload Date: {report.uploaded_at.strftime('%d %B %Y')}
# Report Status: {report.report_status}
# """

#     if report.report_status == "received_unlocked":
#         message += "\nYour report is now available and unlocked."
#     else:
#         message += "\nYour report has been uploaded but is locked until payment is completed."

#     message += """

# Please login to the student portal to view your report.

# Best Regards,
# Support Team
# """

#     send_mail(
#         subject,
#         message,
#         settings.DEFAULT_FROM_EMAIL,
#         [user.email],
#         fail_silently=True
#     )


def send_report_uploaded_email(user, report):
    """
    Send email notification when report is uploaded
    """
    
    subject = "Your Report Has Been Uploaded"

    # ==========================================
    # REPORT STATUS TEXT
    # ==========================================
    if report.report_status == "received_unlocked":
        status_text = "Received & Unlocked"

        status_message = """
The report is now available and unlocked.

Please log in to the student portal to view your report.
"""

    else:
        status_text = "Received & Locked"

        status_message = """
The report is currently locked and will be accessible after completion of your counselling session.

Please log in to the student portal to view the report once the counselling session is completed.
"""

    # ==========================================
    # EMAIL MESSAGE
    # ==========================================
    message = f"""
Dear Student,

Your report has been successfully uploaded.

________________________________________

Report Details

Report ID:
{report.id}

Upload Date:
{report.uploaded_at.strftime('%d %B %Y')}

Status:
{status_text}

________________________________________

{status_message}

________________________________________

Best Regards,
Abhinav Career Scope
"""

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=True
    )

