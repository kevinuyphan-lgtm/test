# mailer.py
import os
from flask import render_template

# Try SendGrid first (recommended)
def send_email(subject: str, to_email: str, html_content: str):
    sendgrid_api_key = os.getenv("SENDGRID_API_KEY")
    if sendgrid_api_key:
        try:
            from sendgrid import SendGridAPIClient
            from sendgrid.helpers.mail import Mail
            message = Mail(
                from_email=os.getenv("MAIL_FROM", "noreply@example.com"),
                to_emails=to_email,
                subject=subject,
                html_content=html_content,
            )
            sg = SendGridAPIClient(sendgrid_api_key)
            resp = sg.send(message)
            return True
        except Exception as e:
            # fall through to SMTP fallback if SendGrid fails
            print("SendGrid send failed:", e)

    # SMTP fallback
    try:
        import smtplib
        from email.mime.multipart import MIMEMultipart
        from email.mime.text import MIMEText

        smtp_host = os.getenv("SMTP_HOST")
        smtp_port = int(os.getenv("SMTP_PORT", "587"))
        smtp_user = os.getenv("SMTP_USER")
        smtp_pass = os.getenv("SMTP_PASS")
        mail_from = os.getenv("MAIL_FROM", "noreply@example.com")

        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = mail_from
        msg["To"] = to_email
        part = MIMEText(html_content, "html")
        msg.attach(part)

        server = smtplib.SMTP(smtp_host, smtp_port, timeout=10)
        server.starttls()
        if smtp_user and smtp_pass:
            server.login(smtp_user, smtp_pass)
        server.sendmail(mail_from, [to_email], msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print("SMTP send failed:", e)
        return False
