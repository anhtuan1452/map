import time
import logging
from django.conf import settings
from django.db import connection

logger = logging.getLogger(__name__)


class UserActivityLoggingMiddleware:
    """
    Middleware để ghi log hoạt động của người dùng
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Bắt đầu tính thời gian
        start_time = time.time()

        # Lấy thông tin từ request
        ip_address = self.get_client_ip(request)
        user_agent = request.META.get('HTTP_USER_AGENT', '')
        path = request.path
        method = request.method
        session_id = request.session.session_key or ''
        referrer = request.META.get('HTTP_REFERER', '')

        # Lấy tên người dùng nếu đã đăng nhập
        user_name = ''
        if hasattr(request, 'user') and request.user.is_authenticated:
            user_name = request.user.username

        # Xử lý request
        response = self.get_response(request)

        # Tính thời gian xử lý
        response_time = time.time() - start_time

        # Chỉ log các request thành công và không phải static files
        if (response.status_code < 400 and
            not path.startswith('/static/') and
            not path.startswith('/media/') and
            not path.startswith('/admin/jsi18n/') and
            not 'favicon' in path):

            try:
                # Log ra console trong development
                if settings.DEBUG:
                    logger.info(f"Activity: {ip_address} - {method} {path} - {response.status_code} - {response_time:.3f}s")

            except Exception as e:
                # Không để lỗi logging làm crash app
                logger.error(f"Error logging user activity: {e}")

        return response

    def get_client_ip(self, request):
        """
        Lấy IP thật của client (xử lý proxy/load balancer)
        """
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            # Lấy IP đầu tiên trong danh sách
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip

    def parse_user_agent(self, user_agent):
        """
        Phân tích cơ bản user agent để lấy thông tin browser và OS
        """
        info = {
            'browser': 'Unknown',
            'browser_version': '',
            'os': 'Unknown',
            'device': 'Unknown'
        }

        if not user_agent:
            return info

        ua = user_agent.lower()

        # Detect browser
        if 'chrome' in ua and 'safari' in ua:
            info['browser'] = 'Chrome'
            # Extract version (rough)
            try:
                chrome_part = ua.split('chrome/')[1].split(' ')[0]
                info['browser_version'] = chrome_part.split('.')[0]
            except:
                pass
        elif 'firefox' in ua:
            info['browser'] = 'Firefox'
            try:
                ff_part = ua.split('firefox/')[1].split(' ')[0]
                info['browser_version'] = ff_part.split('.')[0]
            except:
                pass
        elif 'safari' in ua and 'chrome' not in ua:
            info['browser'] = 'Safari'
        elif 'edge' in ua or 'edg' in ua:
            info['browser'] = 'Edge'
        elif 'opera' in ua or 'opr' in ua:
            info['browser'] = 'Opera'

        # Detect OS
        if 'windows' in ua:
            info['os'] = 'Windows'
        elif 'macintosh' in ua or 'mac os x' in ua:
            info['os'] = 'macOS'
        elif 'linux' in ua:
            info['os'] = 'Linux'
        elif 'android' in ua:
            info['os'] = 'Android'
        elif 'iphone' in ua or 'ipad' in ua:
            info['os'] = 'iOS'

        # Detect device type
        if 'mobile' in ua or 'android' in ua or 'iphone' in ua:
            info['device'] = 'Mobile'
        elif 'tablet' in ua or 'ipad' in ua:
            info['device'] = 'Tablet'
        else:
            info['device'] = 'Desktop'

        return info