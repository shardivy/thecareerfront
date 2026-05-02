from django.core.mail import send_mail
from django.conf import settings
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from io import BytesIO
from datetime import datetime
from textwrap import wrap

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


def send_payment_reminder_email(user, payment):
    subject = "Payment Reminder"
    
    message = f"""
Hello {user.first_name},

This is a reminder that your payment for the package "{payment.package}" is still pending.

Payment Status: {payment.status}
Amount Due: {payment.amount}

Please complete your payment as soon as possible.

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
    buffer = BytesIO()

    if not date:
        date = datetime.now().strftime("%d/%m/%Y")

    pdf = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    # =========================
    # FINAL BORDER (DRAW LAST)
    # =========================
    margin = 30
    pdf.setLineWidth(1)
    pdf.rect(margin, margin, width - 2 * margin, height - 2 * margin)

    # =========================
    # HEADER
    # =========================
    pdf.setFont("Helvetica-Bold", 18)
    pdf.drawCentredString(width / 2, height - 60, "ABHINAV CAREER SCOPE")

    pdf.setFont("Helvetica", 10)

    address_line1 = "Bhagwati Maestros, Miller 403, LMD Chowk, Bavdhan, Pune, Maharashtra 411021, India"
    address_line2 = "Mobile: 9922695424 | Email: abhinavcareerscope@gmail.com | Website: abhinavcareerscope.com"

    pdf.drawCentredString(width / 2, height - 80, address_line1)
    pdf.drawCentredString(width / 2, height - 95, address_line2)

    pdf.line(50, height - 110, width - 50, height - 110)

    # =========================
    # TITLE
    # =========================
    pdf.setFont("Helvetica-Bold", 16)
    pdf.drawCentredString(width / 2, height - 140, "RECEIPT")

    # =========================
    # BODY
    # =========================
    amount_text = f"₹{amount}"

    text = (
        f"Received with thanks from {name}, the sum of Rupees {amount_text} only, "
        f"on {date}, towards counseling services provided for {service_name}, "
        f"including guidance, consultation, and support as required."
    )

    pdf.setFont("Helvetica", 11)

    lines = wrap(text, 95)

    y = height - 180
    for line in lines:
        pdf.drawString(60, y, line)
        y -= 18

    # =========================
    # MOVE DOWN AFTER TEXT FINISH
    # =========================
    y -= 20  # space after paragraph

    # =========================
    # TOTAL (after text)
    # =========================
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(60, y, f"Total: ₹{amount}/-")

    # =========================
    # SIGNATURE (same level right side)
    # =========================
    pdf.setFont("Helvetica-Bold", 11)
    pdf.drawRightString(width - 60, y, "Reena Bhutada")

    pdf.setFont("Helvetica", 10)
    pdf.drawRightString(width - 60, y - 20, "Career Counsellor")

    pdf.showPage()
    pdf.save()

    buffer.seek(0)
    return buffer