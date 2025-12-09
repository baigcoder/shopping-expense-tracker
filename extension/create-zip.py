import zipfile
import os

# Create Firefox ZIP with proper paths
os.chdir('dist/firefox')

with zipfile.ZipFile('../../vibetracker-firefox.zip', 'w', zipfile.ZIP_DEFLATED) as zf:
    for root, dirs, files in os.walk('.'):
        for file in files:
            file_path = os.path.join(root, file)
            # Clean up the archive name
            arcname = file_path.replace('\\', '/').lstrip('./')
            print(f'Adding: {arcname}')
            zf.write(file_path, arcname)

print('\n✅ vibetracker-firefox.zip created!')

# Verify contents
os.chdir('../..')
with zipfile.ZipFile('vibetracker-firefox.zip', 'r') as zf:
    print('\nZIP Contents:')
    for name in zf.namelist():
        print(f'  {name}')
