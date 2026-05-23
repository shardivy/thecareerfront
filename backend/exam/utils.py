from django.core.mail import send_mail
from django.conf import settings


# def send_exam_approved_email(user, completed_at, description=None):
#     """
#     Email when user's exam is approved
#     """

#     subject = "Your Exam Has Been Approved"
    
#     description_text = description if description else "No additional remarks."


#     message = f"""
# Dear {user.first_name},

# Congratulations! Your exam has been successfully reviewed and approved.

# Exam Details:

# Completion Date: {completed_at.strftime('%d %B %Y')}

# Remarks from reviewer:
# {description_text}

# Our team will now prepare your detailed report based on your exam results.

# Once the report is ready, it will be uploaded to your student portal.

# If you have any questions, please feel free to contact our support team.

# Best Regards  
# Support Team
# """

#     send_mail(
#         subject,
#         message,
#         settings.DEFAULT_FROM_EMAIL,
#         [user.email],
#         fail_silently=True
#     )

def send_exam_approved_email(user, completed_at, description=None):
    """
    Email when user's exam is approved
    """

    from django.conf import settings
    from django.core.mail import send_mail

    subject = "Your Exam Has Been Approved"

    description_text = (
        description
        if description
        else "No additional remarks."
    )

    message = f"""
Dear Student,

Congratulations! Your exam has been successfully reviewed and approved.

________________________________________

Exam Details

Completion Date:
{completed_at.strftime('%d %B %Y')}

Reviewer Remarks:
{description_text}

________________________________________

Our team will now prepare your detailed report based on your exam results.

Once ready, the report will be uploaded to your student portal.

________________________________________

For any queries or assistance, feel free to contact:

Call / WhatsApp:
+91 99226 95424 | +91 82080 30557

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


   
def send_exam_rejected_email(user, rejected_at, description=None):
    """
    Email when a user's exam is rejected and sent back to in_progress
    """

    subject = "Your Exam Requires Review"

    message = f"""
Dear {user.first_name},

Your submitted exam has been reviewed by our team, but it requires further action before it can be approved.

Exam Details:

Review Date: {rejected_at.strftime('%d %B %Y')}

Remarks from reviewer:
{description if description else "No additional remarks."}

Status Update:
Your exam has been moved back to "In Progress".

This usually happens if:
• Some answers were not submitted properly
• The exam session was incomplete
• Additional verification is required

Please log in to your student portal and complete the remaining steps for your exam.

If you need assistance, feel free to contact our support team.

Best Regards  
Support Team
"""

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=True
    )