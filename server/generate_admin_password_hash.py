import base64
import getpass
import hashlib
import secrets

password = getpass.getpass("Contraseña admin: ").encode("utf-8")
salt = secrets.token_bytes(16)
iterations = 260000
password_hash = hashlib.pbkdf2_hmac(
    "sha256",
    password,
    salt,
    iterations,
)

salt_value = base64.urlsafe_b64encode(salt).decode("ascii").rstrip("=")
hash_value = base64.urlsafe_b64encode(password_hash).decode("ascii").rstrip("=")

print(f"pbkdf2_sha256${iterations}${salt_value}${hash_value}")
