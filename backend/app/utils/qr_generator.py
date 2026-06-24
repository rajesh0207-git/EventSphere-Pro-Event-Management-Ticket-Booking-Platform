import qrcode
import io
import base64

def generate_booking_qr(booking_id: int, user_id: int, event_id: int) -> str:
    """
    Generates a QR code image encoded in base64 data URI format.
    The QR data contains event, booking, and user reference identifiers.
    """
    data = f"eventsphere_booking_{booking_id}_{user_id}_{event_id}"
    qr = qrcode.QRCode(
        version=1,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    return f"data:image/png;base64,{img_str}"
