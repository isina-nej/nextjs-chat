import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center p-4">
      <div className="text-center text-white">
        <h1 className="text-5xl font-bold mb-6">سامانه چت بلادرنگ</h1>
        <p className="text-xl mb-8 opacity-90">
          سیستم ارتباطی آنی و امن برای گفتگو با دیگران
        </p>
        
        <div className="space-y-4">
          <Link
            href="/auth/login"
            className="inline-block px-8 py-3 bg-white text-blue-600 font-bold rounded-lg hover:bg-gray-100"
          >
            ورود
          </Link>
          
          <div className="text-sm opacity-75">
            حساب ندارید؟{' '}
            <Link href="/auth/register" className="underline hover:opacity-100">
              ثبت‌نام کنید
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
