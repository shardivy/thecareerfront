import requests
from django.conf import settings


def send_whatsapp_otp(phone, otp):
    """
    Sends OTP to WhatsApp using Message91
    """
    url = "https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/"

    payload = {
        "integrated_number": settings.MSG91_WHATSAPP_NUMBER,
        "content_type": "template",
        "payload": {
            "messaging_product": "whatsapp",
            "type": "template",
            "template": {
                "name": settings.MSG91_OTP_TEMPLATE_NAME,
                "language": {
                    "code": "en"
                },
                "components": [
                    {
                        "type": "body",
                        "parameters": [
                            {
                                "type": "text",
                                "text": str(otp)
                            }
                        ]
                    }
                ]
            },
            "to": phone
        }
    }

    headers = {
        "Content-Type": "application/json",
        "authkey": settings.MSG91_AUTH_KEY
    }

    response = requests.post(url, json=payload, headers=headers)
    return response.json()

# 📲 MSG91 WhatsApp Sender
def send_whatsapp_message(phone, email, password):
    url = "https://api.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/"

    payload = {
        "integrated_number": settings.MSG91_WHATSAPP_NUMBER,
        "content_type": "template",
        "payload": {
            "messaging_product": "whatsapp",
            "type": "template",
            "template": {
                "name": settings.MSG91_TEMPLATE_NAME,
                "language": {"code": "en"},
                "components": [
                    {
                        "type": "body",
                        "parameters": [
                            {"type": "text", "text": email},
                            {"type": "text", "text": password}
                        ]
                    }
                ]
            },
            "to": f"91{phone}"
        }
    }

    headers = {
        "Content-Type": "application/json",
        "authkey": settings.MSG91_AUTH_KEY
    }

    response = requests.post(url, json=payload, headers=headers)
    response.raise_for_status()
    return response.json()
