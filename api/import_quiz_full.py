#!/usr/bin/env python
"""
Script to import ALL quiz questions for heritage sites
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
            "question": "Địa đạo Vịnh Mốc được coi là biểu tượng của tinh thần nào trong cuộc chiến tranh chống Mỹ?",
            "option_a": "Sự kiên cường bám trụ, đoàn kết 'một tấc không đi, một ly không rời' của người dân Vĩnh Linh",
            "option_b": "Tính thần bí, khó hiểu của chiến tranh du kích",
            "option_c": "Táo bạo, cơ động, linh hoạt của quân đội chính quy",
            "option_d": "Khả năng xây dựng các công trình quân sự siêu tốc",
            "correct_answer": "A"
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
            "question": "Ý nghĩa chiến lược quan trọng nhất của vị trí Địa đạo Vịnh Mốc là gì?",
            "option_a": "Trở thành khu nghỉ dưỡng bí mật cho cán bộ cấp cao",
            "option_b": "Nơi tập trung sản xuất vũ khí quy mô lớn",
            "option_c": "Là đầu cầu tiếp nhận, vận chuyển hàng hóa chi viện cho tiền tuyến miền Nam từ miền Bắc và đường Hồ Chí Minh trên biển",
            "option_d": "Thoát ly khỏi chiến trường, hoàn toàn tách biệt khỏi sự hỗ trợ của hậu phương lớn",
            "correct_answer": "C"
        },
        {
            "question": "Điều kiện sống khó khăn nhất mà người dân phải đối mặt trong lòng địa đạo Vịnh Mốc là gì?",
            "option_a": "Thiếu ánh sáng mặt trời và sự thiếu thốn về không gian, không khí bí bách",
            "option_b": "Sự khan hiếm lương thực và nước sạch nghiêm trọng",
            "option_c": "Sự tấn công liên tục của các loài côn trùng độc hại",
            "option_d": "Nguy cơ sập hầm do động đất hoặc thiên tai",
            "correct_answer": "A"
        },
        {
            "question": "Tên gọi 'Vịnh Mốc' xuất phát từ đâu?",
            "option_a": "Tên một vị tướng chỉ huy quân đội tại khu vực này",
            "option_b": "Tên gọi cũ của khu vực này, 'Bến Mốc', do là nơi neo đậu tàu thuyền và mốc giới",
            "option_c": "Là từ viết tắt của một khẩu hiệu quân sự",
            "option_d": "Tên một loài cây đặc trưng chỉ mọc ở khu vực Vĩnh Linh",
            "correct_answer": "B"
        },
        {
            "question": "Thời gian xây dựng Địa đạo Vịnh Mốc kéo dài khoảng bao lâu?",
            "option_a": "Hơn 10 năm",
            "option_b": "Khoảng 6 năm (từ 1966 đến 1972)",
            "option_c": "Chưa đầy 1 năm",
            "option_d": "Khoảng 2-3 năm",
            "correct_answer": "B"
        },
        {
            "question": "Hệ thống địa đạo Vịnh Mốc có bao nhiêu cửa mở ra phía bờ biển?",
            "option_a": "6 cửa",
            "option_b": "9 cửa",
            "option_c": "4 cửa",
            "option_d": "7 cửa",
            "correct_answer": "D"
        }
    ],
    
    # IV. Quảng Bình Quan
    "quangbinhquan": [
        {
            "question": "Quảng Bình Quan được xây dựng trong bối cảnh lịch sử nào của Việt Nam?",
            "option_a": "Thời kỳ Trịnh - Nguyễn phân tranh",
            "option_b": "Thời kỳ nhà Nguyễn thống nhất đất nước",
            "option_c": "Thời kỳ nhà Tây Sơn lật đổ chúa Nguyễn",
            "option_d": "Thời kỳ kháng chiến chống Pháp",
            "correct_answer": "A"
        },
        {
            "question": "Kiến trúc sư và danh thần nào được cho là người đã đề xuất và tổ chức xây dựng hệ thống Lũy Thầy, trong đó có Quảng Bình Quan?",
            "option_a": "Nguyễn Hữu Cảnh",
            "option_b": "Đào Duy Từ",
            "option_c": "Lê Quý Đôn",
            "option_d": "Trần Hưng Đạo",
            "correct_answer": "B"
        },
        {
            "question": "Quảng Bình Quan được xem là cửa ngõ chính quan trọng của khu vực nào trong hệ thống phòng thủ Lũy Thầy?",
            "option_a": "Đàng Ngoài",
            "option_b": "Kinh thành Huế",
            "option_c": "Phía Tây Trường Sơn",
            "option_d": "Phía Bắc của xứ Đàng Trong (Chúa Nguyễn)",
            "correct_answer": "D"
        },
        {
            "question": "Quảng Bình Quan nằm trên tuyến đường giao thông quan trọng nào kết nối hai miền đất nước xưa và nay?",
            "option_a": "Đường Hồ Chí Minh",
            "option_b": "Đường Thiên Lý (Quốc lộ 1A)",
            "option_c": "Đường mòn Trường Sơn",
            "option_d": "Đường ven biển",
            "correct_answer": "B"
        },
        {
            "question": "Trong hệ thống Lũy Thầy, Quảng Bình Quan là một trong ba cửa ải chính. Hai cửa ải còn lại là gì?",
            "option_a": "Cửa Eo và Cửa Biển",
            "option_b": "Cửa Thượng và Cửa Hạ",
            "option_c": "Cửa Luỹ và Cửa Eo",
            "option_d": "Cửa Tây và Cửa Đông",
            "correct_answer": "C"
        },
        {
            "question": "Trong bản phục dựng gần đây nhất, mục đích phục dựng Quảng Bình Quan chủ yếu là gì?",
            "option_a": "Phục hồi di tích lịch sử và phát triển du lịch",
            "option_b": "Làm trụ sở hành chính của tỉnh Quảng Bình",
            "option_c": "Phục vụ mục đích quân sự, quốc phòng",
            "option_d": "Làm chợ trung tâm của thành phố",
            "correct_answer": "A"
        },
        {
            "question": "Trong quá trình xây dựng và tồn tại, Quảng Bình Quan đã từng là cửa ngõ chính của khu vực thành phố nào dưới thời nhà Nguyễn?",
            "option_a": "Kinh thành Huế",
            "option_b": "Thành phố Vinh",
            "option_c": "Đồng Hới",
            "option_d": "Thành phố Đà Nẵng",
            "correct_answer": "C"
        },
        {
            "question": "Mục đích chính của việc xây dựng Quảng Bình Quan trong giai đoạn lịch sử ban đầu là gì?",
            "option_a": "Cung cấp nơi ở cho quan lại triều đình",
            "option_b": "Phân chia ranh giới quân sự giữa Đàng Trong và Đàng Ngoài",
            "option_c": "Cổng chào vào kinh đô Huế",
            "option_d": "Nơi giao thương buôn bán sầm uất",
            "correct_answer": "B"
        }
    ],
    
    # V. Lũy Thầy
    "luythay": [
        {
            "question": "Người có công thiết kế và chỉ đạo xây dựng hệ thống phòng thủ Lũy Thầy là ai?",
            "option_a": "Đào Duy Từ",
            "option_b": "Nguyễn Hữu Cảnh",
            "option_c": "Chúa Nguyễn Phúc Nguyên",
            "option_d": "Nguyễn Hoàng",
            "correct_answer": "A"
        },
        {
            "question": "Tên gọi phổ biến khác của Lũy Thầy, gắn liền với tên của người thiết kế, là gì?",
            "option_a": "Lũy Hoành Sơn",
            "option_b": "Lũy Trường Dục",
            "option_c": "Lũy Trường Sa",
            "option_d": "Lũy Đào Duy Từ",
            "correct_answer": "D"
        },
        {
            "question": "Lũy Thầy được xây dựng vào khoảng thời gian nào trong lịch sử Việt Nam?",
            "option_a": "Đầu thế kỷ XVII (khoảng 1630 - 1634)",
            "option_b": "Giữa thế kỷ XVIII",
            "option_c": "Cuối thế kỷ XV",
            "option_d": "Đầu thế kỷ XIX",
            "correct_answer": "A"
        },
        {
            "question": "Mục đích chính của việc xây dựng Lũy Thầy là gì?",
            "option_a": "Phòng thủ trước sự tấn công của chúa Trịnh ở Đàng Ngoài",
            "option_b": "Làm ranh giới phân chia hành chính giữa các phủ",
            "option_c": "Phòng thủ trước sự tấn công của người Chăm Pa ở phía Nam",
            "option_d": "Bảo vệ kinh đô Phú Xuân",
            "correct_answer": "A"
        },
        {
            "question": "Hệ thống Lũy Thầy được chia thành mấy đoạn lũy chính?",
            "option_a": "Bốn đoạn (Lũy Đồng Hới, Lũy Trường Sa, Lũy Trường Dục, Lũy Trường Thành)",
            "option_b": "Hai đoạn (Lũy Trường Sa và Lũy Trường Dục)",
            "option_c": "Chỉ có một đoạn kéo dài liên tục",
            "option_d": "Ba đoạn (Lũy Trường Sa, Lũy Trường Dục, Lũy Trường Thành)",
            "correct_answer": "D"
        },
        {
            "question": "Đoạn lũy nào trong hệ thống Lũy Thầy nằm sát bờ biển, có vai trò bảo vệ cửa sông Nhật Lệ?",
            "option_a": "Lũy Trường Dục",
            "option_b": "Lũy Đồng Hới",
            "option_c": "Lũy Trường Sa",
            "option_d": "Lũy Trường Thành",
            "correct_answer": "C"
        },
        {
            "question": "Vật liệu chủ yếu được sử dụng để xây dựng Lũy Thầy là gì?",
            "option_a": "Bê tông và cốt thép",
            "option_b": "Gạch nung và xi măng",
            "option_c": "Đất và đá (hoặc cát)",
            "option_d": "Đá ong và vôi vữa",
            "correct_answer": "C"
        },
        {
            "question": "Tính chất 'Thầy' trong tên gọi Lũy Thầy có thể ám chỉ đến ai?",
            "option_a": "Một vị đạo sĩ có công hiến kế xây lũy",
            "option_b": "Chúa Nguyễn Phúc Nguyên, người ra lệnh xây dựng",
            "option_c": "Vua Lê, người đứng đầu triều đình chính thống",
            "option_d": "Đào Duy Từ, người thầy đã thiết kế công trình",
            "correct_answer": "D"
        },
        {
            "question": "Sau khi chiến tranh Trịnh - Nguyễn kết thúc (1672), Lũy Thầy có vai trò gì trong giai đoạn hòa bình kéo dài hơn 100 năm?",
            "option_a": "Bị phá hủy hoàn toàn để thể hiện thiện chí hòa bình",
            "option_b": "Được chuyển đổi thành nơi ở cho binh lính và gia đình",
            "option_c": "Tiếp tục được củng cố và mở rộng quy mô",
            "option_d": "Trở thành cột mốc ranh giới không chính thức giữa Đàng Trong và Đàng Ngoài",
            "correct_answer": "D"
        }
    ],
    
    # VI. Tượng Đài Mẹ Suốt
    "tuongdaimesuot": [
        {
            "question": "Tên thật của nữ Anh hùng Lao động Mẹ Suốt là gì?",
            "option_a": "Nguyễn Thị Kim",
            "option_b": "Trần Thị Lý",
            "option_c": "Nguyễn Thị Suốt",
            "option_d": "Nguyễn Thị Định",
            "correct_answer": "C"
        },
        {
            "question": "Mẹ Suốt đã thực hiện công việc anh hùng của mình trên dòng sông nào?",
            "option_a": "Sông Nhật Lệ",
            "option_b": "Sông Mã",
            "option_c": "Sông Gianh",
            "option_d": "Sông Hương",
            "correct_answer": "A"
        },
        {
            "question": "Năm nào Mẹ Suốt (Nguyễn Thị Suốt) được Nhà nước phong tặng danh hiệu Anh hùng Lao động?",
            "option_a": "1964",
            "option_b": "1975",
            "option_c": "1968",
            "option_d": "1967",
            "correct_answer": "D"
        },
        {
            "question": "Chiều cao của Tượng đài Mẹ Suốt (tính cả bệ) là bao nhiêu?",
            "option_a": "5 mét",
            "option_b": "12 mét",
            "option_c": "7 mét",
            "option_d": "10 mét",
            "correct_answer": "C"
        },
        {
            "question": "Hoạt động chính của Mẹ Suốt trong những năm 1964-1967 là gì?",
            "option_a": "Tham gia du kích bắn máy bay địch",
            "option_b": "Sản xuất lương thực tại hậu phương",
            "option_c": "Làm công tác cứu thương tại bệnh xá",
            "option_d": "Lái đò chở bộ đội, thương binh, đạn dược qua sông",
            "correct_answer": "D"
        },
        {
            "question": "Địa danh nào gắn liền với quê hương của Mẹ Suốt, nay thuộc thành phố Đồng Hới?",
            "option_a": "Bảo Ninh",
            "option_b": "Đồng Sơn",
            "option_c": "Nhật Lệ",
            "option_d": "Lộc Ninh",
            "correct_answer": "A"
        },
        {
            "question": "Hình ảnh Mẹ Suốt được nhà thơ nào đưa vào tác phẩm thơ ca nổi tiếng?",
            "option_a": "Chế Lan Viên",
            "option_b": "Huy Cận",
            "option_c": "Xuân Diệu",
            "option_d": "Tố Hữu",
            "correct_answer": "D"
        },
        {
            "question": "Mẹ Suốt hy sinh vào năm nào và trong hoàn cảnh nào?",
            "option_a": "1968, trong một trận bom bi oanh tạc của máy bay Mỹ",
            "option_b": "1969, do bệnh nặng sau nhiều năm làm việc vất vả",
            "option_c": "1967, do trúng đạn pháo của tàu chiến Mỹ",
            "option_d": "1972, khi đang vận chuyển hàng hóa trên đường Hồ Chí Minh",
            "correct_answer": "A"
        },
        {
            "question": "Tượng đài Mẹ Suốt được xây dựng với mục đích quan trọng nhất là gì?",
            "option_a": "Tỏ lòng ngưỡng mộ, tri ân và giáo dục truyền thống yêu nước cho thế hệ trẻ",
            "option_b": "Phát triển du lịch ven sông Nhật Lệ",
            "option_c": "Kỷ niệm ngày thống nhất đất nước",
            "option_d": "Tạo thêm cảnh quan kiến trúc cho thành phố Đồng Hới",
            "correct_answer": "A"
        },
        {
            "question": "Tư thế của Mẹ Suốt được thể hiện trong Tượng đài có ý nghĩa gì?",
            "option_a": "Tư thế đang cầm mái chèo, mắt hướng ra sông Nhật Lệ, sẵn sàng cho những chuyến đò mới",
            "option_b": "Tư thế ôm đứa con thơ để bảo vệ",
            "option_c": "Tư thế đang nghỉ ngơi sau một chuyến đò mệt mỏi",
            "option_d": "Tư thế vẫy tay chào tạm biệt bộ đội",
            "correct_answer": "A"
        }
    ],
    
    # VII. Bến Phà Long Đại
    "benphalongdai": [
        {
            "question": "Bến phà Long Đại nằm trên tuyến đường giao thông chiến lược nào trong thời kỳ kháng chiến chống Mỹ?",
            "option_a": "Đường Hồ Chí Minh (Đường Trường Sơn) và đường 15",
            "option_b": "Đường sắt Thống Nhất",
            "option_c": "Đường 9 Nam Lào",
            "option_d": "Quốc lộ 1A",
            "correct_answer": "A"
        },
        {
            "question": "Vì sao Bến phà Long Đại được coi là 'yếu hầu', 'huyết mạch' trong chiến tranh chống Mỹ?",
            "option_a": "Vì đây là điểm duy nhất có thể vượt sông ở Quảng Bình",
            "option_b": "Vì đây là nơi có địa hình hiểm trở nhất, dễ phòng thủ",
            "option_c": "Vì nó nằm trên cả ba tuyến đường: đường bộ, đường thủy và đường sắt, kết nối hậu phương miền Bắc với tiền tuyến miền Nam",
            "option_d": "Vì đây là nơi đặt sở chỉ huy tiền phương của Quân khu 4",
            "correct_answer": "C"
        },
        {
            "question": "Sự hy sinh của 16 thanh niên xung phong (TNXP) thuộc đơn vị C130 tỉnh Thái Bình tại Bến phà Long Đại diễn ra vào năm nào?",
            "option_a": "Năm 1968",
            "option_b": "Năm 1970",
            "option_c": "Năm 1972",
            "option_d": "Năm 1975",
            "correct_answer": "C"
        },
        {
            "question": "Câu thơ 'Nơi mảnh bom thù dày hơn đá sỏi. Nơi trao tay mình tiền phương, hậu phương' được khắc tại khu Di tích Bến phà Long Đại nhằm mục đích gì?",
            "option_a": "Làm nổi bật sự khốc liệt của chiến tranh và vai trò trung chuyển hàng hóa, vũ khí chi viện cho miền Nam",
            "option_b": "Kêu gọi khách du lịch quay lại thăm khu di tích",
            "option_c": "Ghi lại số lượng bom đạn mà địch đã trút xuống khu vực này",
            "option_d": "Mô tả vẻ đẹp hoang sơ của dòng sông Long Đại",
            "correct_answer": "A"
        },
        {
            "question": "Hiện nay, bên cạnh Bến phà Long Đại còn có công trình nào được xây dựng để tưởng nhớ các anh hùng liệt sĩ?",
            "option_a": "Tượng đài Chiến thắng Điện Biên Phủ",
            "option_b": "Đền tưởng niệm liệt sĩ Trường Sơn (hoặc Đền Long Đại)",
            "option_c": "Bảo tàng Lịch sử Quân sự Việt Nam",
            "option_d": "Cột cờ Hà Nội",
            "correct_answer": "B"
        },
        {
            "question": "Vị trí Bến phà Long Đại nằm ở ngã ba của những con sông nào?",
            "option_a": "Sông Gianh và sông Nhật Lệ",
            "option_b": "Sông Ba và sông Thu Bồn",
            "option_c": "Sông Kiến Giang và sông Long Đại",
            "option_d": "Sông Hương và sông Bến Hải",
            "correct_answer": "C"
        },
        {
            "question": "Vì sao Bến Phà Long Đại được mệnh danh là một trong những 'tọa độ lửa' trong chiến tranh?",
            "option_a": "Vì đây là nơi đặt tổng kho vũ khí lớn nhất của quân đội ta",
            "option_b": "Vì nơi đây là điểm xuất phát của nhiều trận tiến công lớn",
            "option_c": "Vì đây là mục tiêu trọng điểm bị không quân Mỹ oanh tạc với mật độ bom đạn dày đặc",
            "option_d": "Vì đây là nơi diễn ra các cuộc giao tranh lớn giữa bộ binh hai bên",
            "correct_answer": "C"
        },
        {
            "question": "Trong chiến tranh, lực lượng nào đã giữ vai trò chủ chốt, kiên cường bám trụ và đảm bảo hoạt động cho Bến Phà Long Đại?",
            "option_a": "Bộ đội Biên phòng",
            "option_b": "Thanh niên xung phong và Bộ đội Công binh",
            "option_c": "Bộ đội Pháo binh",
            "option_d": "Bộ đội Đặc công",
            "correct_answer": "B"
        },
        {
            "question": "Sau khi bị đánh phá ác liệt, Bến Phà Long Đại được thay thế bằng công trình gì để đảm bảo giao thông trên Quốc lộ 1A?",
            "option_a": "Một hệ thống đường hầm bí mật",
            "option_b": "Đường vòng qua núi",
            "option_c": "Cầu Long Đại",
            "option_d": "Một cây cầu phao tạm thời",
            "correct_answer": "C"
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
