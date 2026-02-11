from payment.models import Payment
from program_package.models import UserProgramPackage
from report.models import Report
from exam.models import UserExam


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
