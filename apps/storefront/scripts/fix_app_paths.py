import os

app_path = 'src/app/App.tsx'
with open(app_path, 'r') as f:
    content = f.read()

# Fix components
content = content.replace('./components/', '@/shared/components/')
content = content.replace('./sections/', '@/features/marketing/components/sections/')
content = content.replace('./context/', '@/shared/context/')
content = content.replace('./lib/', '@/shared/lib/')
# Fix pages
content = content.replace('./pages/ProductsPage', '@/features/products/components/ProductsPage')
content = content.replace('./pages/ProductDetailPage', '@/features/products/components/ProductDetailPage')
content = content.replace('./pages/WishlistPage', '@/features/products/components/WishlistPage')
content = content.replace('./pages/CartPage', '@/features/cart/components/CartPage')
content = content.replace('./pages/ContactPage', '@/features/marketing/components/ContactPage')
content = content.replace('./pages/AboutPage', '@/features/marketing/components/AboutPage')
content = content.replace('./pages/PoliciesPage', '@/features/marketing/components/PoliciesPage')
content = content.replace('./pages/CapabilitiesPage', '@/features/marketing/components/CapabilitiesPage')
content = content.replace('./pages/BlogPage', '@/features/marketing/components/BlogPage')
content = content.replace('./pages/CheckoutPage', '@/features/checkout/components/CheckoutPage')
content = content.replace('./pages/OrderConfirmationPage', '@/features/checkout/components/OrderConfirmationPage')
content = content.replace('./pages/BulkEnquiryPage', '@/features/quotes/components/BulkEnquiryPage')
content = content.replace('./pages/LoginPage', '@/features/auth/components/LoginPage')
content = content.replace('./pages/ForgotPasswordPage', '@/features/auth/components/ForgotPasswordPage')
content = content.replace('./pages/DashboardPage', '@/features/dashboard/components/DashboardPage')

with open(app_path, 'w') as f:
    f.write(content)

# Fix client.ts types
client_path = 'src/core/api/client.ts'
with open(client_path, 'r') as f:
    content = f.read()

content = content.replace('import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from \'axios\';', 'import axios, { AxiosError } from \'axios\';\nimport type { InternalAxiosRequestConfig, AxiosResponse } from \'axios\';')

with open(client_path, 'w') as f:
    f.write(content)

