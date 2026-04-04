'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/ThemeToggle';
import { motion } from 'framer-motion'; 

export default function HomePage() {
  const router = useRouter();
  // Достаем функцию loginWithGoogle из контекста
  const { user, login, register, logout, isLoading: isAuthLoading, loginWithGoogle } = useAuth();
  
  const [isMounted, setIsMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formType, setFormType] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isFormLoading, setIsFormLoading] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const openModal = (type: 'login' | 'register') => {
    setError('');
    setUsername('');
    setPassword('');
    setFormType(type);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsFormLoading(true);
    setError('');
    try {
      if (formType === 'login') {
        await login(username, password);
        router.push('/dashboard');
      } else {
        await register(username, password);
        setIsModalOpen(false);
        alert('Регистрация прошла успешно! Теперь вы можете войти.');
        openModal('login');
      }
    } catch (err) {
      console.error(err);
      setError('Ошибка. Проверьте правильность логина и пароля.');
    } finally {
      setIsFormLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-8 py-4 flex justify-between items-center border-b bg-card">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/image.png"
            alt="GoAnalytics Logo"
            width={32}
            height={32}
            className="rounded-md"
          />
          <h1 className="text-2xl font-bold cursor-pointer transition-colors">
            GoAnalytics
          </h1>
        </Link>
        <div className="flex items-center gap-4">
          {isAuthLoading ? (
            <div className="h-10 w-48 bg-muted rounded animate-pulse"></div>
          ) : user ? (
            <div className="flex items-center space-x-4">
              <span className="font-medium">
                Добро пожаловать, {user.username}!
              </span>
              <Button variant="outline" onClick={() => router.push('/dashboard')}>
                Панель управления
              </Button>
              <Button onClick={handleLogout}>Выход</Button>
            </div>
          ) : (
            <div className="space-x-2">
              <Button variant="outline" onClick={() => openModal('login')}>
                Вход
              </Button>
              <Button onClick={() => openModal('register')}>
                Регистрация
              </Button>
            </div>
          )}
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-grow flex flex-col items-center justify-center text-center p-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-5xl font-extrabold mb-4"
        >
          Управляйте вашим автопарком эффективно
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-2xl text-lg text-muted-foreground mb-8"
        >
          «GoAnalytics» — это аналитическое приложение для автоматизации учета
          использования основных средств вашей автотранспортной компании.
          Принимайте решения на основе данных.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full"
        >
          <motion.div whileHover={{ y: -5, transition: { duration: 0.2 } }}>
            <div className="p-6 bg-card rounded-lg border h-full">
              <h3 className="text-xl font-semibold mb-2">Аналитика в реальном времени</h3>
              <p className="text-muted-foreground">Получайте актуальные данные о пробеге, расходе топлива и затратах без задержек.</p>
            </div>
          </motion.div>
          <motion.div whileHover={{ y: -5, transition: { duration: 0.2 } }}>
            <div className="p-6 bg-card rounded-lg border h-full">
              <h3 className="text-xl font-semibold mb-2">Оптимизация затрат</h3>
              <p className="text-muted-foreground">Выявляйте самые затратные транспортные средства и оптимизируйте их использование.</p>
            </div>
          </motion.div>
          <motion.div whileHover={{ y: -5, transition: { duration: 0.2 } }}>
            <div className="p-6 bg-card rounded-lg border h-full">
              <h3 className="text-xl font-semibold mb-2">Экспорт отчетов</h3>
              <p className="text-muted-foreground">Формируйте и выгружайте детализированные отчеты в формате PDF для руководства.</p>
            </div>
          </motion.div>
        </motion.div>
      </main>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {formType === 'login' ? 'Вход в аккаунт' : 'Создание аккаунта'}
            </DialogTitle>
            <DialogDescription>
              {formType === 'login'
                ? 'Введите ваши данные для входа.'
                : 'Заполните форму для регистрации.'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="username" className="text-right">
                  Логин
                </Label>
                <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} className="col-span-3" disabled={isFormLoading} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  Пароль
                </Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="col-span-3" disabled={isFormLoading} />
              </div>
            </div>

            {error && (
              <p className="text-center text-sm text-red-600 pt-2">{error}</p>
            )}

            <DialogFooter className="pt-4 flex-col gap-3">
              <Button type="submit" disabled={isFormLoading} className="w-full">
                {isFormLoading ? 'Загрузка...' : (formType === 'login' ? 'Войти' : 'Зарегистрироваться')}
              </Button>
              
              {/* --- БЛОК OAUTH --- */}
              {formType === 'login' && (
                <>
                  <div className="relative my-2 w-full text-center">
                    <span className="text-muted-foreground text-sm bg-background px-2 relative z-10">или</span>
                    <div className="absolute top-1/2 left-0 w-full h-px bg-border"></div>
                  </div>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="w-full flex items-center justify-center gap-2" 
                    onClick={loginWithGoogle}
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5 bg-white rounded-full p-0.5" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    Войти через Google
                  </Button>
                </>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}