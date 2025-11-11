#!/usr/bin/env python
"""
Script to import quiz questions for heritage sites
"""
import os
import sys
import django

# Setup Django
sys.path.append('/app')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'project.settings')
django.setup()

from heritage.models import Site, Quiz

# Mapping site_id to quiz questions
quiz_data = {
    # I. Cầu Hiền Lương - Sông Bến Hải
    "song_ben_hai": [
        {
            "question": "Theo Hiệp định Genève năm 1954, Sông Bến Hải được chọn làm ranh giới quân sự tạm thời ở vĩ tuyến nào?",
            "option_a": "Vĩ tuyến 19",
            "option_b": "Vĩ tuyến 17",
            "option_c": "Vĩ tuyến 18",
            "option_d": "Vĩ tuyến 16",
            "correct_answer": "B"
        },
        {
            "question": "Cầu Hiền Lương bắc qua sông Bến Hải có ý nghĩa lịch sử quan trọng nhất là gì?",
            "option_a": "Là chứng tích của chiến thắng Điện Biên Phủ",
            "option_b": "Là cây cầu quan trọng nhất trên Quốc lộ 1A",
            "option_c": "Là nơi diễn ra cuộc đàm phán Hiệp định Paris",
            "option_d": "Biểu tượng cho sự chia cắt đất nước Việt Nam thành hai miền",
            "correct_answer": "D"
        },
        {
            "question": "Cầu Hiền Lương hiện tại là cầu số mấy được xây dựng lại trên nền cầu cũ sau nhiều lần bị đánh sập và sửa chữa?",
            "option_a": "Cầu thứ 9",
            "option_b": "Cầu thứ 3",
            "option_c": "Cầu thứ 5",
            "option_d": "Cầu thứ 7",
            "correct_answer": "D"
        },
        {
            "question": "Trong thời kỳ chia cắt, Đồn Công an Nhân dân vũ trang của ta đóng ở vị trí nào của Cầu Hiền Lương?",
            "option_a": "Bờ Bắc (thuộc Huyện Vĩnh Linh)",
            "option_b": "Giữa cầu",
            "option_c": "Bờ Nam (thuộc Huyện Gio Linh)",
            "option_d": "Cách xa cầu 1km về phía Tây",
            "correct_answer": "A"
        },
        {
            "question": "Địa danh lịch sử nào là nơi Sông Bến Hải đổ ra biển Đông?",
            "option_a": "Cửa Thuận An",
            "option_b": "Cửa Việt",
            "option_c": "Cửa Nhật Lệ",
            "option_d": "Cửa Tùng",
            "correct_answer": "D"
        }
    ],
    
    # # II. Thành Cổ Quảng Trị
    # "thanh_co_quang_tri": [
    #     {
    #         "question": "Sự kiện lịch sử nổi tiếng nhất gắn liền với Thành cổ Quảng Trị trong cuộc Kháng chiến chống Mỹ là gì?",
    #         "option_a": "Chiến dịch Điện Biên Phủ trên không",
    #         "option_b": "Cuộc Tổng tiến công và nổi dậy Tết Mậu Thân 1968",
    #         "option_c": "Cuộc chiến 81 ngày đêm năm 1972",
    #         "option_d": "Chiến dịch Đường 9 - Khe Sanh",
    #         "correct_answer": "C"
    #     },
    #     {
    #         "question": "Ý nghĩa sâu sắc nhất của Thành cổ Quảng Trị hiện nay là gì?",
    #         "option_a": "Biểu tượng của chủ nghĩa anh hùng cách mạng và sự hy sinh cao cả",
    #         "option_b": "Bảo tồn kiến trúc quân sự cổ của triều Nguyễn",
    #         "option_c": "Nơi ghi dấu sự thay đổi triều đại",
    #         "option_d": "Trung tâm văn hóa, du lịch của tỉnh",
    #         "correct_answer": "A"
    #     },
    #     {
    #         "question": "Vì sao Thành cổ Quảng Trị được ví như là 'nghĩa trang không nấm mồ'?",
    #         "option_a": "Vì nơi đây có nhiều ngôi mộ tập thể không tên",
    #         "option_b": "Vì xương máu của các chiến sĩ đã hòa quyện vào lòng đất, không còn hình hài nấm mộ",
    #         "option_c": "Vì di tích chỉ còn lại cổng thành và tường bao",
    #         "option_d": "Vì toàn bộ chiến sĩ hy sinh đã được chuyển đi hết",
    #         "correct_answer": "B"
    #     },
    #     {
    #         "question": "Dòng sông nào chảy qua thị xã Quảng Trị và gắn liền với việc tiếp tế, chiến đấu bảo vệ Thành cổ năm 1972?",
    #         "option_a": "Sông Thạch Hãn",
    #         "option_b": "Sông Gianh",
    #         "option_c": "Sông Bến Hải",
    #         "option_d": "Sông Hương",
    #         "correct_answer": "A"
    #     },
    #     {
    #         "question": "Cuộc chiến bảo vệ Thành cổ Quảng Trị kéo dài 81 ngày đêm diễn ra trong khoảng thời gian nào của năm 1972?",
    #         "option_a": "Từ 30/4 đến 20/7",
    #         "option_b": "Từ 1/1 đến 22/3",
    #         "option_c": "Từ 28/6 đến 16/9",
    #         "option_d": "Từ 1/10 đến 20/12",
    #         "correct_answer": "C"
    #     }
    # ],
    
    # III. Địa Đạo Vịnh Mốc
    "diadaovinhmoc": [
        {
            "question": "Mục đích chính của việc xây dựng địa đạo Vịnh Mốc là gì?",
            "option_a": "Là nơi ẩn nấp, trú ẩn an toàn cho người dân địa phương trong suốt cuộc chiến tranh phá hoại",
            "option_b": "Phòng tuyến ngăn chặn bộ binh đối phương xâm nhập qua vĩ tuyến 17",
            "option_c": "Làm nơi cất giấu vũ khí và lương thực cho bộ đội chủ lực",
            "option_d": "Là căn cứ tiến công bí mật cho các đơn vị đặc công ra vào miền Nam",
            "correct_answer": "A"
        },
        {
            "question": "Địa đạo Vịnh Mốc được xây dựng chủ yếu trong giai đoạn lịch sử nào?",
            "option_a": "1965 - 1972",
            "option_b": "1960 - 1964",
            "option_c": "1973 - 1975",
            "option_d": "1945 - 1954",
            "correct_answer": "A"
        },
        {
            "question": "Trong lòng địa đạo Vịnh Mốc, công trình đặc biệt nào đã được xây dựng và là nơi chào đời của nhiều em bé Vĩnh Linh?",
            "option_a": "Phòng hội trường lớn",
            "option_b": "Phòng hộ sinh (phòng đẻ)",
            "option_c": "Bếp Hoàng Cầm",
            "option_d": "Kho chứa vũ khí",
            "correct_answer": "B"
        },
        {
            "question": "Tổng cộng, Địa đạo Vịnh Mốc có bao nhiêu cửa ra vào, bao gồm cả các cửa mở ra bờ biển?",
            "option_a": "15 cửa",
            "option_b": "8 cửa",
            "option_c": "10 cửa",
            "option_d": "13 cửa",
            "correct_answer": "D"
        },
        {
            "question": "Hệ thống địa đạo Vịnh Mốc có bao nhiêu cửa mở ra phía bờ biển?",
            "option_a": "6 cửa",
            "option_b": "9 cửa",
            "option_c": "4 cửa",
            "option_d": "7 cửa",
            "correct_answer": "D"
        }
    ]
}

def import_quizzes():
    print("Starting quiz import...")
    
    total_created = 0
    total_skipped = 0
    
    for site_id, questions in quiz_data.items():
        try:
            site = Site.objects.get(site_id=site_id)
            print(f"\nProcessing site: {site.name} ({site_id})")
            
            for q_data in questions:
                # Check if quiz already exists
                existing = Quiz.objects.filter(
                    site=site,
                    question=q_data['question']
                ).first()
                
                if existing:
                    print(f"  ⊘ Skipped (exists): {q_data['question'][:50]}...")
                    total_skipped += 1
                    continue
                
                # Create new quiz
                quiz = Quiz.objects.create(
                    site=site,
                    question=q_data['question'],
                    option_a=q_data['option_a'],
                    option_b=q_data['option_b'],
                    option_c=q_data['option_c'],
                    option_d=q_data['option_d'],
                    correct_answer=q_data['correct_answer'],
                    xp_reward=10
                )
                print(f"  ✓ Created: {q_data['question'][:50]}...")
                total_created += 1
                
        except Site.DoesNotExist:
            print(f"  ✗ Site not found: {site_id}")
            continue
    
    print(f"\n{'='*60}")
    print(f"Import completed!")
    print(f"  Created: {total_created} quizzes")
    print(f"  Skipped: {total_skipped} quizzes (already exist)")
    print(f"{'='*60}")

if __name__ == '__main__':
    import_quizzes()
