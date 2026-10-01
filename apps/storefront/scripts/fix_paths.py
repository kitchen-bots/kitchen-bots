import os
import re

# Move files up one level if they are in doubly-nested folders
src_dir = 'src'
shared_dir = os.path.join(src_dir, 'shared')

doubles = [
    ('components/components', 'components'),
    ('context/context', 'context'),
    ('hooks/hooks', 'hooks'),
    ('types/types', 'types'),
    ('utils/lib', 'lib')
]

for old, new in doubles:
    old_path = os.path.join(shared_dir, old)
    new_path = os.path.join(shared_dir, new)
    if os.path.exists(old_path):
        os.system(f"rsync -a {old_path}/ {new_path}/")
        os.system(f"rm -rf {old_path}")
        print(f"Moved {old_path} to {new_path}")

def fix_imports():
    # Walk all files and replace known bad paths
    for root, _, files in os.walk(src_dir):
        for file in files:
            if not (file.endswith('.ts') or file.endswith('.tsx')):
                continue
            path = os.path.join(root, file)
            with open(path, 'r') as f:
                content = f.read()
            
            # Simple heuristic fixes for the errors
            content = content.replace('../components/ui/button', '@/shared/components/ui/button')
            content = content.replace('./ui/button', '@/shared/components/ui/button')
            content = content.replace('../hooks/use-cart', '@/shared/hooks/use-cart')
            content = content.replace('../hooks/use-toast', '@/shared/hooks/use-toast')
            content = content.replace('../hooks/use-wishlist', '@/shared/hooks/use-wishlist')
            content = content.replace('../lib/seo', '@/shared/lib/seo')
            content = content.replace('../lib/analytics', '@/shared/lib/analytics')
            content = content.replace('../lib/utils', '@/shared/lib/utils')
            content = content.replace('../types/product', '@/shared/types/product')
            content = content.replace('../data/products', '@/shared/data/products')
            content = content.replace('../App', '@/app/App')
            content = content.replace('../context/CartContextData', '@/shared/context/CartContextData')
            content = content.replace('../context/ToastContextData', '@/shared/context/ToastContextData')
            content = content.replace('../context/WishlistContextData', '@/shared/context/WishlistContextData')
            content = content.replace('../components/ui/form-data', '@/shared/components/ui/form-data')
            content = content.replace('../components/ui/sidebar-data', '@/shared/components/ui/sidebar-data')
            
            with open(path, 'w') as f:
                f.write(content)

fix_imports()
