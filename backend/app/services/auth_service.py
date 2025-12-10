from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from ..config import settings
import random
import string

pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def generate_otp(length=6):
    return ''.join(random.choices(string.digits, k=length))

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi.concurrency import run_in_threadpool

def send_email_sync(email_to: str, otp: str):
    try:
        msg = MIMEMultipart()
        msg['From'] = settings.MAIL_FROM
        msg['To'] = email_to
        msg['Subject'] = "CryptoBeacon Verification Code"

        body = f"""<html>
<body style="font-family: Arial, sans-serif; color: #333;">
<div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
<h2 style="color: #00ff88; text-align: center;">Verify Your Account</h2>
<p>Hello,</p>
<p>Thank you for registering with CryptoBeacon. Please use the following One-Time Password (OTP) to complete your verification:</p>
<div style="background-color: #f5f5f5; padding: 15px; text-align: center; border-radius: 5px; font-size: 24px; letter-spacing: 5px; font-weight: bold; margin: 20px 0;">
{otp}
</div>
<p>This code will expire in 10 minutes.</p>
<p>If you did not request this, please ignore this email.</p>
<br>
<p style="font-size: 12px; color: #888;">CryptoBeacon Team</p>
<div style="display:none; color:transparent; font-size:1px;">Message ID: {datetime.utcnow().timestamp()}</div>
</div>
</body>
</html>"""
        msg.attach(MIMEText(body, 'html'))

        server = smtplib.SMTP(settings.MAIL_SERVER, settings.MAIL_PORT)
        server.starttls()
        server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
        text = msg.as_string()
        server.sendmail(settings.MAIL_FROM, email_to, text)
        server.quit()
        return True
    except Exception as e:
        print(f"Failed to send email: {e}")
        return False

async def send_otp_email(email: str, otp: str):
    return await run_in_threadpool(send_email_sync, email, otp)

def send_goodbye_email_sync(email_to: str, username: str):
    try:
        msg = MIMEMultipart()
        msg['From'] = settings.MAIL_FROM
        msg['To'] = email_to
        msg['Subject'] = "Goodbye from CryptoBeacon"

        body = f"""<html>
<body style="font-family: Arial, sans-serif; color: #333;">
<div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
<h2 style="color: #ff4d4d; text-align: center;">Account Deleted</h2>
<p>Hello {username},</p>
<p>Your CryptoBeacon account has been successfully deleted.</p>
<p>All your personal data, portfolio, and watchlist have been permanently removed from our servers.</p>
<p>We are sorry to see you go. If you ever change your mind, we'll be here!</p>
<br>
<p style="font-size: 12px; color: #888;">CryptoBeacon Team</p>
<div style="display:none; color:transparent; font-size:1px;">Message ID: {datetime.utcnow().timestamp()}</div>
</div>
</body>
</html>"""
        msg.attach(MIMEText(body, 'html'))

        server = smtplib.SMTP(settings.MAIL_SERVER, settings.MAIL_PORT)
        server.starttls()
        server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
        text = msg.as_string()
        server.sendmail(settings.MAIL_FROM, email_to, text)
        server.quit()
        return True
    except Exception as e:
        print(f"Failed to send goodbye email: {e}")
        return False

async def send_goodbye_email(email: str, username: str):
    return await run_in_threadpool(send_goodbye_email_sync, email, username)

def send_weekly_report_email_sync(email_to: str, username: str, report_data: dict):
    try:
        msg = MIMEMultipart()
        msg['From'] = settings.MAIL_FROM
        msg['To'] = email_to
        msg['Subject'] = "Your Weekly CryptoBeacon Report"
        
        # Color for P/L
        pl_color = "#00ff88" if report_data['total_pl'] >= 0 else "#ff4d4d"
        pl_sign = "+" if report_data['total_pl'] >= 0 else ""

        body = f"""<html>
<body style="font-family: Arial, sans-serif; color: #333;">
<div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
<h2 style="color: #6366f1; text-align: center;">Weekly Portfolio Summary</h2>
<p>Hello {username},</p>
<p>Here is your weekly update on your crypto portfolio.</p>

<div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
<div style="margin-bottom: 15px;">
<span style="font-size: 14px; color: #666;">Total Portfolio Value</span><br>
<span style="font-size: 24px; font-weight: bold;">${report_data['total_value']:,.2f}</span>
</div>
<div>
<span style="font-size: 14px; color: #666;">Total Profit/Loss</span><br>
<span style="font-size: 24px; font-weight: bold; color: {pl_color};">
{pl_sign}${abs(report_data['total_pl']):,.2f} ({pl_sign}{report_data['pl_percent']:.2f}%)
</span>
</div>
</div>

<h3 style="border-bottom: 1px solid #eee; padding-bottom: 5px;">Highlights</h3>
<p><strong>Top Performer:</strong> {report_data['top_coin']} ({report_data['top_perf']}%)</p>
<p><strong>Worst Performer:</strong> {report_data['worst_coin']} ({report_data['worst_perf']}%)</p>

<br>
<div style="text-align: center;">
<a href="http://localhost:5173" style="background-color: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Dashboard</a>
</div>
<br>
<p style="font-size: 12px; color: #888;">CryptoBeacon Team</p>
<div style="display:none; color:transparent; font-size:1px;">Message ID: {datetime.utcnow().timestamp()}</div>
</div>
</body>
</html>"""
        msg.attach(MIMEText(body, 'html'))

        server = smtplib.SMTP(settings.MAIL_SERVER, settings.MAIL_PORT)
        server.starttls()
        server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)
        text = msg.as_string()
        server.sendmail(settings.MAIL_FROM, email_to, text)
        server.quit()
        return True
    except Exception as e:
        print(f"Failed to send weekly report email: {e}")
        return False

async def send_weekly_report_email(email: str, username: str, report_data: dict):
    return await run_in_threadpool(send_weekly_report_email_sync, email, username, report_data)
