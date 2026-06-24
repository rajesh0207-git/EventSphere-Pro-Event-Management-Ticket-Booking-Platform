# Placeholder email utility - replace with real SMTP in production


def send_reset_email(email: str, reset_token: str) -> None:
    """
    In production, send an actual email with the reset link.
    For now, just print to console.
    """
    reset_link = f"http://localhost:5173/reset-password?token={reset_token}"
    print(f"\n{'='*60}")
    print(f"PASSWORD RESET EMAIL (to: {email})")
    print(f"Reset Link: {reset_link}")
    print(f"{'='*60}\n")
