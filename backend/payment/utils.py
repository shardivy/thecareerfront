from django.core.mail import send_mail
from django.conf import settings
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from io import BytesIO
from datetime import datetime
from textwrap import wrap
from django.db.models import Sum

from payment.models import Payment

def send_payment_reject_email(email):
    send_mail(
        subject="Payment Rejected",
        message="Your payment has been rejected. Please try again.",
        from_email="noreply@yourapp.com",
        recipient_list=[email],
        fail_silently=False
    )

def send_payment_reject_whatsapp(phone):
    print(f"WhatsApp sent to {phone}: Your payment has been rejected.")
    
def send_payment_created_email(user, payment):
    """
    Send email when payment is created
    """

    subject = "Payment Received Successfully"

    message = f"""
Dear {user.first_name},

We have received your payment successfully.

Payment Details:
Payment ID: {payment.id}
Amount Paid: {payment.amount}
Payment Status: {payment.status}

Thank you for your payment.

Best Regards,
Support Team
"""

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=True
    )


def send_payment_updated_email(user, payment):
    """
    Send email when payment is updated
    """

    subject = "Payment Status Updated"

    message = f"""
Dear {user.first_name},

Your payment information has been updated.

Updated Payment Details:
Payment ID: {payment.id}
Amount: {payment.amount}
Payment Status: {payment.status}

Please login to the portal to view updated details.

Best Regards,
Support Team
"""

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=True
    )
    
def send_payment_approved_email(user, payment, cumulative_amount, package_price):
    """
    Email when admin approves payment
    """

    subject = "Your Payment Has Been Approved"

    message = f"""
Dear {user.first_name},

Your payment has been successfully verified by our team.

Payment Details:
Payment ID: {payment.id}
Amount Paid: {payment.amount}
Payment Status: {payment.status}

Total Paid So Far: {cumulative_amount}
Package Price: {package_price}

"""

    if payment.status == "fully_paid":
        message += """
Your package has now been fully paid and activated.
You can access your program and related services from your student portal.
"""
    else:
        message += """
Your payment has been recorded as a partial payment.
Please complete the remaining payment to activate your full package access.
"""

    message += """

Thank you for choosing our services.

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


def send_payment_rejected_email(user):
    """
    Email when admin rejects payment
    """

    subject = "Payment Verification Failed"

    message = f"""
Dear {user.first_name},

Unfortunately, your recent payment submission could not be verified by our team.

Possible reasons may include:
• Invalid payment proof
• Incorrect transaction details
• Payment not received in our account

Please review your payment details and submit the correct information again.

If you believe this is an error, please contact our support team.

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


# def send_payment_reminder_email(user, payment):
#     subject = "Payment Reminder"
    
#     message = f"""
# Hello {user.first_name},

# This is a reminder that your payment for the package "{payment.package}" is still pending.

# Payment Status: {payment.status}
# Amount Due: {payment.amount}

# Please complete your payment as soon as possible.

# Thank you.
# """

#     send_mail(
#         subject,
#         message,
#         settings.DEFAULT_FROM_EMAIL,
#         [user.email],
#         fail_silently=False
#     )
    
def send_payment_reminder_email(user, payment):
    subject = "Payment Reminder"

    # =====================================
    # GET ALL PAYMENTS FOR SAME USER + PACKAGE
    # =====================================
    payments = Payment.objects.filter(
        user=payment.user,
         package__in=payment.package.all()
    ).distinct()

    # =====================================
    # TOTAL PAID
    # =====================================
    total_paid = payments.filter(
        status__in=["partial_paid", "fully_paid", "verification_pending"]
    ).aggregate(total=Sum("amount"))["total"] or 0

    # =====================================
    # PACKAGE PRICE
    # =====================================
    package_price = payment.package.aggregate(
        total=Sum("price")
    )["total"] or 0

    # =====================================
    # REMAINING AMOUNT
    # =====================================
    remaining_amount = package_price - total_paid
    if remaining_amount < 0:
        remaining_amount = 0

    # =====================================
    # MESSAGE
    # =====================================
    package_names = ", ".join(
        payment.package.values_list("name", flat=True)
    )
    message = f"""
Dear {user.first_name},

This is a reminder that your payment for the package "{package_names}" is still pending.

Total Package Amount: ₹{package_price}
Amount Paid: ₹{total_paid}
Remaining Amount: ₹{remaining_amount}

Please complete your remaining payment as soon as possible.

Thank you.
"""

    send_mail(
        subject,
        message,
        settings.DEFAULT_FROM_EMAIL,
        [user.email],
        fail_silently=False
    )  
    
    

def generate_receipt_pdf(name, service_name, amount, date=None):
    # =========================
    # CREATE MEMORY BUFFER FOR PDF
    # Stores PDF temporarily before download
    # =========================
    buffer = BytesIO()

    # =========================
    # USE TODAY'S DATE IF NO DATE PROVIDED
    # =========================
    if not date:
        date = datetime.now().strftime("%d/%m/%Y")

    # =========================
    # CREATE PDF CANVAS WITH A4 SIZE
    # =========================
    pdf = canvas.Canvas(buffer, pagesize=A4)

    # =========================
    # PAGE WIDTH & HEIGHT
    # =========================
    width, height = A4

    # =========================
    # PAGE BORDER MARGIN
    # Distance from page edges
    # =========================
    margin = 30

    # ============================================================
    # HEADER SECTION
    # ============================================================

    # Set large bold font for company name
    pdf.setFont("Helvetica-Bold", 22)

    # Draw company name at center top
    pdf.drawCentredString(
        width / 2,
        height - 60,
        "ABHINAV CAREER SCOPE"
    )

    # Set normal font for address
    pdf.setFont("Helvetica", 10)

    # Company address line
    address_line1 = (
        "Bhagwati Maestros, Miller 403, LMD Chowk, Bavdhan, Pune, Maharashtra 411021, India"
    )

    # Contact details line
    address_line2 = (
        "Mobile: 9922695424 | Email: abhinavcareerscope@gmail.com | Website: abhinavcareerscope.com"
    )

    # Draw centered address
    pdf.drawCentredString(width / 2, height - 82, address_line1)

    # Draw centered contact details
    pdf.drawCentredString(width / 2, height - 96, address_line2)

    # Horizontal line below header
    pdf.line(
        50,
        height - 110,
        width - 50,
        height - 110
    )

    # ============================================================
    # RECEIPT TITLE
    # ============================================================

    # Set title font
    pdf.setFont("Helvetica-Bold", 18)

    # Draw RECEIPT title
    pdf.drawCentredString(
        width / 2,
        height - 145,
        "RECEIPT"
    )

    # =========================
    # BODY TEXT WITH WRAPPING + ONLY NAME BOLD
    # =========================

    amount_text = f"{amount}"

    # Line 1
    y = height - 190
    x = 60

    pdf.setFont("Helvetica", 13)
    pdf.drawString(x, y, "Received with thanks from ")

    prefix_width = pdf.stringWidth(
        "Received with thanks from ",
        "Helvetica",
        13
    )

    # Bold name
    pdf.setFont("Helvetica-Bold", 13)
    pdf.drawString(
        x + prefix_width,
        y,
        f"{name},"
    )

    # Remaining first line
    name_width = pdf.stringWidth(
        f"{name},",
        "Helvetica-Bold",
        13
    )

    pdf.setFont("Helvetica", 13)
    pdf.drawString(
        x + prefix_width + name_width,
        y,
        f" the sum of Rupees {amount_text}"
    )

    # Line 2
    y -= 22
    pdf.drawString(
        x,
        y,
        f"only on {date}, towards counseling services provided for {service_name},"
    )

    # Line 3
    y -= 22
    pdf.drawString(
        x,
        y,
        "including guidance, consultation, and support as required."
    )


    # ============================================================
    # SPACE AFTER BODY
    # ============================================================
    y -= 40

    # ============================================================
    # TOTAL AMOUNT SECTION
    # ============================================================

    # Bold font for total
    pdf.setFont("Helvetica-Bold", 15)

    # Draw total amount
    pdf.drawString(
        60,
        y,
        f"Total: {amount}/-"
    )

    # ============================================================
    # SIGNATURE SECTION
    # ============================================================

    # Bold font for signer name
    pdf.setFont("Helvetica-Bold", 12)

    # Draw signer name on right side
    pdf.drawRightString(
        width - 85,
        y,
        "Reena Bhutada"
    )

    # Normal font for designation
    pdf.setFont("Helvetica", 12)

    # Draw designation below name
    pdf.drawRightString(
        width - 85,
        y - 22,
        "Career Counsellor"
    )

    # ============================================================
    # DYNAMIC BORDER SECTION
    # Border ends after content, not full page
    # ============================================================

    # Border bottom position below signature
    bottom_y = y - 80

    # Border thickness
    pdf.setLineWidth(1)

    # Draw rectangle border
    pdf.rect(
        margin,                     # Left border
        bottom_y,                   # Bottom border
        width - 2 * margin,         # Border width
        height - bottom_y - margin  # Border height
    )

    # ============================================================
    # FINALIZE PDF
    # ============================================================

    # End current page
    pdf.showPage()

    # Save PDF
    pdf.save()

    # Reset buffer position
    buffer.seek(0)

    # Return generated PDF
    return buffer










