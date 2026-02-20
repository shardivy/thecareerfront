# from django.db import transaction
# from exam.models import Exam
# from program_package.models import Program, Package, PackageExam

# # Allowed programs to auto-create default exams
# ALLOWED_PROGRAMS = [
#     "8-12 aptitude test",
#     "pg counselling",
# ]

# # Default exams
# DEFAULT_EXAMS = [
#     {
#         "name": "Aptitude Test",
#         "exam_link": "https://example.com/aptitude",
#         "instructions": "Complete within 60 minutes",
#         "is_active": True,
#         "is_mandatory": True,
#         "sequence_order": 1,
#     },
#     {
#         "name": "Personality Test",
#         "exam_link": "https://example.com/personality",
#         "instructions": "Answer honestly",
#         "is_active": True,
#         "is_mandatory": False,
#         "sequence_order": 2,
#     }
# ]

# # Default package info
# DEFAULT_PACKAGE_NAME = "Default Package"
# DEFAULT_PACKAGE_PRICE = 1000  # Adjust as needed


# @transaction.atomic
# def create_default_exams_for_all_packages():
#     """
#     Auto-create programs, packages, and only one default exam per package.
#     """
#     for program_name in ALLOWED_PROGRAMS:
#         program_name_normalized = program_name.strip()

#         # 🔹 Get or create the program
#         program, _ = Program.objects.get_or_create(name=program_name_normalized)

#         # 🔹 Get or create the default package for this program
#         package, _ = Package.objects.get_or_create(
#             program=program,
#             name=DEFAULT_PACKAGE_NAME,
#             defaults={"price": DEFAULT_PACKAGE_PRICE},
#         )

#         # 🔹 Only create the **first exam** from DEFAULT_EXAMS
#         exam_data = DEFAULT_EXAMS[0]

#         # Check if an exam with the same name and link exists
#         exam_qs = Exam.objects.filter(
#             name=exam_data["name"],
#             exam_link=exam_data["exam_link"]
#         )

#         if exam_qs.exists():
#             exam = exam_qs.first()
#         else:
#             exam = Exam.objects.create(
#                 name=exam_data["name"],
#                 exam_link=exam_data["exam_link"],
#                 instructions=exam_data["instructions"],
#                 is_active=exam_data["is_active"],
#             )

#         # 🔹 Map exam to package if not already mapped
#         if not PackageExam.objects.filter(package=package, exam=exam).exists():
#             PackageExam.objects.create(
#                 package=package,
#                 exam=exam,
#                 is_mandatory=exam_data["is_mandatory"],
#                 sequence_order=exam_data["sequence_order"],
#             )


from django.db import transaction
from exam.models import Exam
from program_package.models import Program, Package, PackageExam

# Program-wise configuration
PROGRAM_CONFIG = {
    "8-12 Aptitude Test": {
        "package_name": "8-12 Basic Package",
        "package_price": 1500,
    },
    "PG Counselling": {
        "package_name": "PG Premium Package",
        "package_price": 3000,
    },
}

# Default exam (only one will be created per package)
DEFAULT_EXAM = [{
    "name": "Aptitude Test",
    "exam_link": "https://example.com/aptitude",
    "instructions": "Complete within 60 minutes",
    "is_active": True,
    "is_mandatory": True,
    "sequence_order": 1,
},
                {
    "name": "Aptitude Test",
    "exam_link": "https://example.com/aptitude",
    "instructions": "Complete within 60 minutes",
    "is_active": True,
    "is_mandatory": True,
    "sequence_order": 2,
},
                
                ]


# @transaction.atomic
# def create_default_exams_for_all_packages():
#     """
#     Auto-create programs, packages (with different names & prices),
#     and only one default exam per package.
#     """

#     for program_name, config in PROGRAM_CONFIG.items():
#         program_name_normalized = program_name.strip()

#         # 🔹 Create or get program
#         program, _ = Program.objects.get_or_create(
#             name=program_name_normalized
#         )

#         # 🔹 Create or get package (different name & price per program)
#         package, created = Package.objects.get_or_create(
#             program=program,
#             name=config["package_name"],
#             defaults={"price": config["package_price"]},
#         )

#         # 🔹 Create or get exam
#         exam_qs = Exam.objects.filter(
#             name=DEFAULT_EXAM["name"],
#             exam_link=DEFAULT_EXAM["exam_link"]
#         )

#         if exam_qs.exists():
#             exam = exam_qs.first()
#         else:
#             exam = Exam.objects.create(
#                 name=DEFAULT_EXAM["name"],
#                 exam_link=DEFAULT_EXAM["exam_link"],
#                 instructions=DEFAULT_EXAM["instructions"],
#                 is_active=DEFAULT_EXAM["is_active"],
#             )

#         # 🔹 Map exam to package (only if not mapped)
#         if not PackageExam.objects.filter(package=package, exam=exam).exists():
#             PackageExam.objects.create(
#                 package=package,
#                 exam=exam,
#                 is_mandatory=DEFAULT_EXAM["is_mandatory"],
#                 sequence_order=DEFAULT_EXAM["sequence_order"],
#             )

@transaction.atomic
def create_default_exams_for_all_packages():
    """
    Auto-create programs, packages (with different names & prices),
    and create default exams per package.
    """

    for program_name, config in PROGRAM_CONFIG.items():
        program_name_normalized = program_name.strip()

        # 🔹 Create or get program
        program, _ = Program.objects.get_or_create(
            name=program_name_normalized
        )

        # 🔹 Create or get package
        package, _ = Package.objects.get_or_create(
            program=program,
            name=config["package_name"],
            defaults={"price": config["package_price"]},
        )

        # 🔹 LOOP THROUGH DEFAULT EXAMS (FIX HERE)
        for exam_data in DEFAULT_EXAM:

            # Create or get exam
            exam, _ = Exam.objects.get_or_create(
                name=exam_data["name"],
                exam_link=exam_data["exam_link"],
                defaults={
                    "instructions": exam_data["instructions"],
                    "is_active": exam_data["is_active"],
                }
            )

            # Map exam to package
            PackageExam.objects.get_or_create(
                package=package,
                exam=exam,
                defaults={
                    "is_mandatory": exam_data["is_mandatory"],
                    "sequence_order": exam_data["sequence_order"],
                }
            )