import sys
try:
    from PIL import Image
    img = Image.open(r'C:\Users\mahmu\.gemini\antigravity-ide\brain\05bd460c-45e8-4f3f-a455-d4f64fefb1b7\askida_feature_graphic_1781154469670.png')
    img = img.resize((1024, 500), Image.Resampling.LANCZOS)
    img.save(r'e:\projelerim\askida\assets\feature_graphic.png')
    print('SUCCESS')
except ImportError:
    print('Pillow not installed')
except Exception as e:
    print('ERROR:', e)
