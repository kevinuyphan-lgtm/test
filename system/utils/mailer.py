with smtplib.SMTP_SSL(Config.MAIL_SERVER, Config.MAIL_PORT) as server:
    server.login(Config.MAIL_USERNAME, Config.MAIL_PASSWORD)
    server.send_message(msg)
