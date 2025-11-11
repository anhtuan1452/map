from rest_framework import authentication
from rest_framework import exceptions
from django.contrib.auth import get_user_model
from django.conf import settings
import jwt
from rest_framework.authentication import SessionAuthentication

User = get_user_model()


class TokenAuthentication(authentication.BaseAuthentication):
    """
    JWT token authentication.
    Token format: "Bearer <jwt_token>"
    """
    
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        
        if not auth_header.startswith('Bearer '):
            return None
        
        token = auth_header.replace('Bearer ', '').strip()
        
        if not token:
            return None
        
        try:
            # Decode JWT token
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            user_id = payload.get('user_id')
            
            if not user_id:
                raise exceptions.AuthenticationFailed('Invalid token payload')
            
            user = User.objects.get(id=user_id)
            return (user, None)
        except jwt.ExpiredSignatureError:
            raise exceptions.AuthenticationFailed('Token has expired')
        except jwt.DecodeError:
            raise exceptions.AuthenticationFailed('Invalid token')
        except User.DoesNotExist:
            raise exceptions.AuthenticationFailed('User not found')


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """
    Session authentication without CSRF checks.
    Useful for specific views like login where CSRF is not required or handled differently.
    """
    def enforce_csrf(self, request):
        return  # To not perform the csrf check
