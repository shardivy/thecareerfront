import os
import requests
from django.conf import settings
from django.utils.timezone import get_current_timezone, is_naive, localtime, make_aware

def get_font_path():
    font_dir = os.path.join(settings.BASE_DIR, "fonts")
    os.makedirs(font_dir, exist_ok=True)

    font_path = os.path.join(font_dir, "GreatVibes-Regular.ttf")

    if os.path.exists(font_path):
        return font_path

    url = "https://github.com/google/fonts/raw/main/ofl/greatvibes/GreatVibes-Regular.ttf"

    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()

        with open(font_path, "wb") as f:
            f.write(response.content)

        print("✅ Font downloaded successfully")

    except Exception as e:
        print("❌ Font download failed:", e)
        return None

    return font_path


def generate_handholding_reminder(participant_session, participant):
    """
    Generate reminder for handholding participant
    Only for:
    - booked
    - rescheduled
    - not_booked
    """

    preferred_mode = (
        participant.preferred_counselling_mode or "online"
    ).lower()

    session_status = (
        participant_session.status or ""
    ).lower()

    subject = "Handholding Session Reminder | Abhinav Career Scope"

    # ==========================================
    # 🔹 NOT BOOKED
    # ==========================================
    if session_status == "not_booked":

        message = f"""
Greetings from Abhinav Career Scope.

Your handholding session is not booked yet.
Please book your session as soon as possible to continue your counselling process.

Regards,
Abhinav Career Scope.
""".strip()

        return {
            "subject": subject,
            "message": message
        }

    # ==========================================
    # 🔹 BOOKED / RESCHEDULED ONLY
    # ==========================================
    elif session_status in ["booked", "rescheduled"]:

        if not participant_session.session_date:
            return {
                "subject": subject,
                "message": "Session date not available."
            }

        # ==========================================
        # 🔹 SESSION DATE SAFETY FIX
        # ==========================================
        session_datetime = participant_session.session_date

        if is_naive(session_datetime):
            session_datetime = make_aware(
                session_datetime,
                get_current_timezone()
            )

        session_datetime = localtime(session_datetime)

        session_date = session_datetime.strftime("%d-%m-%Y")
        session_time = session_datetime.strftime("%I:%M %p")

        # ==========================================
        # 🔹 ONLINE
        # ==========================================
        if preferred_mode == "online":

            message = f"""
Greetings from Abhinav Career Scope.

Your handholding session is scheduled on {session_date} at {session_time}.
Please join 15 minutes before the scheduled time.

Instructions for Online:
- Ensure stable internet connection
- Keep your audio/video ready
- Join using the provided meeting link
- Keep necessary documents ready

Regards,
Abhinav Career Scope.
""".strip()

        # ==========================================
        # 🔹 OFFLINE
        # ==========================================
        else:

            message = f"""
Greetings from Abhinav Career Scope.

Your handholding session is scheduled on {session_date} at {session_time}.
Please reach half an hour before the scheduled time.

Instructions for Offline:
- Reach venue 30 minutes early
- Carry required documents
- Be punctual
- Contact counsellor if delayed

Regards,
Abhinav Career Scope.
""".strip()

        return {
            "subject": subject,
            "message": message
        }

    # ==========================================
    # 🔹 OTHER STATUS
    # ==========================================
    else:
        return {
            "subject": subject,
            "message": f"No reminder required for session status: {participant_session.status}"
        }